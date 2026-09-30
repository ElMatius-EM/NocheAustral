      /* ---------------- loop ---------------- */
      let last = performance.now();
      const FPSM = { n: 0, worst: 0, t0: 0 };
      function fpsTick(now, raw) {
        if (!SAVE.opts.fps) return;
        if (!FPSM.t0) FPSM.t0 = now;
        FPSM.n++; if (raw > FPSM.worst) FPSM.worst = raw;
        const el = now - FPSM.t0;
        if (el >= 500) {
          const fps = Math.round(FPSM.n * 1000 / el), w = Math.round(FPSM.worst), m = $('fpsMeter');
          m.textContent = fps + ' fps · peor ' + w + ' ms';
          m.classList.toggle('mid', w >= 20 && w < 34); m.classList.toggle('bad', w >= 34);
          FPSM.n = 0; FPSM.worst = 0; FPSM.t0 = now;
        }
      }
      function frame(now) {
        const raw = now - last;
        let dt = raw / 1000; last = now;
        fpsTick(now, raw);
        if (dt > 1 / 20) dt = 1 / 20; if (dt < 0) dt = 0;
        if (S && S.state === 'play') { if (S.hitstop > 0) { S.hitstop -= dt; if (S.shake > 0) S.shake = Math.max(0, S.shake - dt); } else update(dt); }
        render(dt);
        ambUpdate(now);
        updateHUD();
        requestAnimationFrame(frame);
      }
      $('fpsMeter').classList.toggle('on', !!SAVE.opts.fps);
      requestAnimationFrame(frame);

      window.__game = { SPR, PSPR, cardURL, obsSprite, bulletSprite, get SAVE() { return SAVE }, checkAch, ashBomb, MAPS, render, tryDash, get S() { return S }, newGame, update, WEAPONS, PASSIVES, recompute, openChest, buildChoices, applyChoice, endGame };
