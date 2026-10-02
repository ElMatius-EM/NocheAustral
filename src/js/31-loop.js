      /* ---------------- loop ---------------- */
      let last = performance.now();
      const FPSM = { n: 0, worst: 0, t0: 0 };
      // medidor: fps y peor frame; abajo, en qué se va el tiempo. "JS" es lo que mide el juego (lógica y órdenes de dibujo);
      // "fuera del JS" es el resto del frame (GPU, navegador y espera a la pantalla). Con fps bajos, si ese resto es grande y el JS
      // chico, el cuello está en la placa de video (píxeles, capas a pantalla completa), no en el código.
      function fpsTick(now, raw) {
        if (!SAVE.opts.fps) return;
        if (!FPSM.t0) FPSM.t0 = now;
        FPSM.n++; if (raw > FPSM.worst) FPSM.worst = raw;
        const el = now - FPSM.t0;
        if (el >= 500) {
          const n = FPSM.n, fps = Math.round(n * 1000 / el), w = Math.round(FPSM.worst), m = $('fpsMeter'), A = PRF.a, f = k => ((A[k] || 0) / n).toFixed(1);
          let txt = fps + ' fps · peor ' + w + ' ms · res ' + (Math.round(DPR * 100) / 100) + 'x';
          if (S && S.state === 'play') {
            A.resto = Math.max(0, (A.rend || 0) - (A.suelo || 0) - (A.mundo || 0));
            const js = ((A['lógica'] || 0) + (A.rend || 0)) / n, frameMs = el / n;
            txt += '\nJS ' + js.toFixed(1) + ' ms: lógica ' + f('lógica') + ' · suelo ' + f('suelo') + ' · mundo ' + f('mundo') + ' · resto ' + f('resto')
              + '\nfuera del JS ' + Math.max(0, frameMs - js).toFixed(1) + ' ms · ' + S.enemies.length + ' enemigos · ' + S.parts.length + ' partículas';
          }
          m.textContent = txt;
          m.classList.toggle('mid', w >= 20 && w < 34); m.classList.toggle('bad', w >= 34);
          FPSM.n = 0; FPSM.worst = 0; FPSM.t0 = now; PRF.a = {};
        }
      }
      /* resolución dinámica: si durante la partida el promedio pasa de ~21 ms por frame (menos de 48 fps),
         baja la resolución interna un escalón (2x → 1,5x → 1x → 0,5x). Solo baja y no se guarda: cada sesión arranca en alta. */
      const AUTO = { acc: 0, n: 0 };
      function autoRes(raw) {
        if (!S || S.state !== 'play' || DPR <= .5 || raw > 120) { AUTO.acc = AUTO.n = 0; return; }
        AUTO.acc += raw; AUTO.n++;
        if (AUTO.acc < 2500) return;
        const avg = AUTO.acc / AUTO.n; AUTO.acc = AUTO.n = 0;
        if (avg > 21) { RES_K = Math.max(.25, RES_K - .25); resize(); }
      }
      function frame(now) {
        const raw = now - last;
        let dt = raw / 1000; last = now;
        fpsTick(now, raw); autoRes(raw);
        if (dt > 1 / 20) dt = 1 / 20; if (dt < 0) dt = 0;
        const pOn = SAVE.opts.fps; let t0 = pOn ? performance.now() : 0;
        if (S && S.state === 'play') { if (S.hitstop > 0) { S.hitstop -= dt; if (S.shake > 0) S.shake = Math.max(0, S.shake - dt); } else update(dt); }
        if (pOn) { const t = performance.now(); PRF.a['lógica'] = (PRF.a['lógica'] || 0) + t - t0; t0 = t; }
        render(dt);
        ambUpdate(now);
        updateHUD();
        // render completo + HUD; al mostrar, 'resto' = esto menos lo medido por sección (textos, cielo, clima, flechas, HUD)
        if (pOn) PRF.a.rend = (PRF.a.rend || 0) + performance.now() - t0;
        requestAnimationFrame(frame);
      }
      $('fpsMeter').classList.toggle('on', !!SAVE.opts.fps);
      requestAnimationFrame(frame);

      window.__game = { SPR, PSPR, cardURL, obsSprite, bulletSprite, get SAVE() { return SAVE }, checkAch, ashBomb, MAPS, render, tryDash, get S() { return S }, newGame, update, WEAPONS, PASSIVES, recompute, openChest, buildChoices, applyChoice, endGame };
