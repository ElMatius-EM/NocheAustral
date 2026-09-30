      /* ---------------- sonido ambiente: viento de fondo ---------------- */
      let AMB = null, ambT = 0;
      function ambUpdate(now) {
        if (!AC || now - ambT < 250) return; ambT = now;
        const on = !!(S && S.state === 'play') && !muted;
        if (!AMB && on) {
          try {
            const len = AC.sampleRate * 3, buf = AC.createBuffer(1, len, AC.sampleRate), d = buf.getChannelData(0); let l = 0;
            for (let i = 0; i < len; i++) { l = l * .98 + (Math.random() * 2 - 1) * .02; d[i] = l * 5; }
            for (let i = 0; i < 2000; i++) { const f = i / 2000; d[i] *= f; d[len - 1 - i] *= f; }
            const src = AC.createBufferSource(); src.buffer = buf; src.loop = true;
            const f = AC.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 380; f.Q.value = .6;
            const g = AC.createGain(); g.gain.value = 0; src.connect(f); f.connect(g); g.connect(AC.destination); src.start(); AMB = { src, f, g };
          } catch (e) { AMB = false; }
        }
        if (!AMB) return;
        const w = on && S.weather ? (S.weather.k || 0) : 0, tgt = on ? SAVE.opts.sfx * (.05 + .14 * w) * (MAP().ice ? 1.2 : 1) : 0;
        AMB.g.gain.setTargetAtTime(tgt, AC.currentTime, .5); AMB.f.frequency.setTargetAtTime(320 + 520 * w, AC.currentTime, .6);
      }

