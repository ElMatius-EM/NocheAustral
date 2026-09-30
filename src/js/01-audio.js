      /* ---------------- audio ---------------- */
      let AC = null, muted = false, lastGemSfx = 0;
      function initAudio() { if (AC) return; try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { AC = null; } }
      function sfx(f, d, type, vol, slide) {
        if (!AC || muted) return;
        try {
          const t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
          o.type = type || 'square'; o.frequency.setValueAtTime(f, t);
          if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
          g.gain.setValueAtTime(Math.max(.0002, (vol || .05) * SAVE.opts.sfx), t); g.gain.exponentialRampToValueAtTime(.0001, t + d);
          o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + d + .02);
        } catch (e) { }
      }

      /* ---------------- música ---------------- */
      let musBus = null, noiseBuf = null;
      const MUS = { on: false, next: 0, step: 0, timer: 0 };
      function musInit() {
        if (!AC || musBus) return;
        musBus = AC.createGain(); musBus.gain.value = 0;
        const dl = AC.createDelay(1), fb = AC.createGain(), wet = AC.createGain();
        dl.delayTime.value = .33; fb.gain.value = .28; wet.gain.value = .3;
        musBus.connect(AC.destination); musBus.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(AC.destination);
        noiseBuf = AC.createBuffer(1, Math.floor(AC.sampleRate * .3), AC.sampleRate);
        const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      function musVol() { return muted ? 0 : SAVE.opts.music * .55 * (S && S.state !== 'play' ? .3 : 1); }
      function musicStart() { if (!AC) return; musInit(); if (!musBus) return; MUS.on = true; MUS.step = 0; MUS.next = AC.currentTime + .15; if (!MUS.timer) MUS.timer = setInterval(musTick, 40); }
      function musicStop() { MUS.on = false; if (musBus && AC) musBus.gain.setTargetAtTime(0, AC.currentTime, .15); }
      const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
      function mnote(type, m, t, dur, vol) { const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.value = mtof(m); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g); g.connect(musBus); o.start(t); o.stop(t + dur + .05); }
      function mkick(t, v) { const o = AC.createOscillator(), g = AC.createGain(); o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(40, t + .14); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .2); o.connect(g); g.connect(musBus); o.start(t); o.stop(t + .25); }
      function mhat(t, v) { const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf; f.type = 'highpass'; f.frequency.value = 6500; g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .05); s.connect(f); f.connect(g); g.connect(musBus); s.start(t); s.stop(t + .08); }
      const PROG = [[57, [0, 3, 7], 45], [53, [0, 4, 7], 41], [55, [0, 4, 7], 43], [52, [0, 4, 7], 40]];
      const ARP = [0, 1, 2, 1, 0, 2, 1, 2], OCT = [0, 0, 0, 12, 0, 0, 0, 12];
      function musTick() {
        if (!AC || !musBus) return;
        musBus.gain.setTargetAtTime(MUS.on ? musVol() : 0, AC.currentTime, .12);
        if (!MUS.on) { return; }
        const M = MAP(), m = S ? S.t / 60 : 0, tempo = M.music.tempo + Math.min(24, m * 1.8) + (S && S.hyper ? 10 : 0), e8 = 60 / tempo / 2, tr = M.music.root;
        if (MUS.next < AC.currentTime) MUS.next = AC.currentTime + .05;
        while (MUS.next < AC.currentTime + .25) {
          const t = MUS.next, st = MUS.step, bar = Math.floor(st / 8) % 4, pos = st % 8, [root, iv, bass] = PROG[bar];
          if (pos === 0 || pos === 3 || pos === 6) { mnote('triangle', bass + tr, t, e8 * 2.6, .22); mkick(t, pos === 0 ? .32 : .2); }
          const tone = root + iv[ARP[pos]] + OCT[pos] + tr + 12;
          mnote('triangle', tone, t, e8 * 1.8, .07); mnote('square', tone, t, e8 * .9, .012);
          if (m >= 4 && pos % 2 === 1) mhat(t, .05);
          if (m >= 9 && (pos === 0 || pos === 4)) { const h = hash(Math.floor(st / 4), 7), mel = root + tr + 24 + iv[Math.floor(h * 3)]; mnote('sawtooth', mel, t, e8 * 3.5, .02); mnote('triangle', mel, t, e8 * 3.5, .05); }
          MUS.next += e8; MUS.step++;
        }
      }

