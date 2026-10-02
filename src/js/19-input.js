      /* ---------------- input ---------------- */
      window.addEventListener('keydown', e => {
        if (e.target && e.target.id === 'kname') { if (e.key === 'Enter') forgeStart(); else if (e.key === 'Escape') e.target.blur(); return; }
        const k = e.key.toLowerCase(), conf = k === 'enter' || k === ' ';
        const ae = document.activeElement, inRange = ae && ae.type === 'range';
        if (!(inRange && (k === 'arrowleft' || k === 'arrowright')) && ['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' ', 'enter'].includes(k)) e.preventDefault();
        if (!S) {
          if (puKey(e, k)) return;
          const view = document.querySelector('#title .view.on'); if (!view) return;
          const els = [...view.querySelectorAll('button:not([disabled]),input')];
          const i = els.indexOf(ae);
          initAudio();
          if (k === 'arrowdown' || k === 's' || (k === 'arrowright' && !inRange) || (k === 'tab' && false)) { (els[i + 1] || els[0]).focus(); menuTick(); }
          else if (k === 'arrowup' || k === 'w' || (k === 'arrowleft' && !inRange)) { (els[i - 1] || els[els.length - 1]).focus(); menuTick(); }
          else if (conf && !e.repeat && ae && els.includes(ae)) { if (ae.tagName === 'BUTTON' || ae.type === 'checkbox') ae.click(); }
          else if ((k === 'escape' || k === 'backspace') && !e.repeat) { const bk = view.querySelector('.btns [data-go]'); if (bk) bk.click(); }
          else if (!e.repeat && k >= '1' && k <= '9') { const list = [...view.querySelectorAll('[data-pick]:not(.locked)')]; if (list[+k - 1]) list[+k - 1].click(); }
          return;
        }
        if (S.state === 'end') { if (!e.repeat && k === 'enter') $('again').click(); else if (!e.repeat && k === 'escape') $('toMenu').click(); return; }
        if (k === 'escape' || k === 'p') { if (S.state === 'play') pause(); else if (S.state === 'pause') resume(); return; }
        if (S.state === 'levelup') {
          if (e.repeat) return;
          if (k >= '1' && k <= '3') choose(+k - 1);
          else if (k === 'arrowup' || k === 'arrowleft' || k === 'w' || k === 'a') selCard(S.sel - 1);
          else if (k === 'arrowdown' || k === 'arrowright' || k === 's' || k === 'd') selCard(S.sel + 1);
          else if (conf) choose(S.sel);
          else if (k === 'r') $('reroll').click();
          else if (k === 'x') $('skip').click();
          else if (k === 'b') banish(S.sel);
          return;
        }
        if (S.state === 'chest') { if (!e.repeat && (conf || k === 'e')) { if (!CA.done && CA.finish) CA.finish(); else $('chestOk').click(); } return; }
        if (S.state === 'arcana') {
          if (e.repeat) return;
          if (k >= '1' && k <= '4') pickArc(+k - 1);
          else if (k === 'arrowleft' || k === 'a' || k === 'arrowup' || k === 'w') selArc(S.sel - 1);
          else if (k === 'arrowright' || k === 'd' || k === 'arrowdown' || k === 's') selArc(S.sel + 1);
          else if (conf) pickArc(S.sel);
          return;
        }
        if (S.state === 'pause') { if (!e.repeat && conf) resume(); return; }
        if (S.state === 'play' && (k === ' ' || k === 'shift')) { if (!e.repeat) tryDash(); return; }
        if (S.state === 'play' && S.mode === 'campo') {
          if (k === 'e' || k === 'j') { if (!e.repeat) toolDown(); return; }
          if (k === 'q' || k === 'tab') { e.preventDefault(); if (!e.repeat) toolNext(); return; }
          if (k >= '1' && k <= '3') { if (!e.repeat) toolPick(toolsOwned()[+k - 1]); return; }
        }
        if (S.state === 'play' && k === 'h') { if (!e.repeat) { whistle(); if (S && S.mode !== 'campo') $('whBtn').classList.remove('on'); } return; }
        keys.add(k);
      });
      $('dashBtn').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); tryDash(); });
      $('whBtn').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); whistle(); if (S && S.mode !== 'campo') $('whBtn').classList.remove('on'); });
      window.addEventListener('keyup', e => { const k = e.key.toLowerCase(); keys.delete(k); if (k === 'e' || k === 'j') toolUp(); });
      window.addEventListener('blur', () => { keys.clear(); joy = null; });
      document.addEventListener('visibilitychange', () => { if (document.hidden) { writeSave(); pause(); } });
      addEventListener('pagehide', writeSave);
      cv.addEventListener('pointerdown', e => {
        if (!((S && S.state === 'play') || (PU && !PU.ui))) return;
        cv.setPointerCapture(e.pointerId);
        joy = { id: e.pointerId, ox: e.clientX, oy: e.clientY, x: e.clientX, y: e.clientY };
      });
      cv.addEventListener('pointermove', e => {
        if (!joy || e.pointerId !== joy.id) return;
        joy.x = e.clientX; joy.y = e.clientY;
        const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy);
        if (d > 70) { joy.ox = joy.x - dx / d * 70; joy.oy = joy.y - dy / d * 70; }
      });
      const endJoy = e => { if (joy && e.pointerId === joy.id) joy = null; };
      cv.addEventListener('pointerup', endJoy); cv.addEventListener('pointercancel', endJoy);
      cv.addEventListener('contextmenu', e => e.preventDefault());


