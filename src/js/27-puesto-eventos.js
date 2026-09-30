      /* ---------------- eventos del puesto ---------------- */
      $('puPanel').addEventListener('click', ev => {
        const T = ev.target;
        if (T.closest('[data-pu-close]')) return closePuPanel();
        const ob = T.closest('[data-obra]'); if (ob) { const id = ob.dataset.obra, nx = OBRAS[id].lv[SAVE.puesto[id] + 1]; if (nx && canPay(nx.cost)) { pay(nx.cost); SAVE.puesto[id]++; devHorse(); writeSave(); sfx(392, .15, 'triangle', .05); setTimeout(() => sfx(587, .25, 'triangle', .05), 120); banner(nx.name + ': listo'); renderPuPanel(); } else sfx(120, .12, 'square', .03); return; }
        if (PU.ui === 'tranquera') { const sb = T.closest('[data-salir]'); if (sb) puSalir(sb.dataset.salir); return; }
        if (PU.ui === 'fogon') { const rb = T.closest('[data-rec]'); if (rb) fogonCook(rb.dataset.rec); return; }
        if (PU.ui === 'nire') {
          if (T.id === 'nireCv') return nireHit(ev); if (T.closest('#nireBuy')) return nireBuy();
          if (T.closest('#nireReset')) { for (const id in SAVE.nire) SAVE.fama += NIRE_COST[NIRE[id].t]; SAVE.nire = {}; writeSave(); rerenderNireInfo(); } return;
        }
        if (PU.ui === 'fragua') {
          const pt = T.closest('[data-part]'); if (pt && !PU.forge) { const [k, id] = pt.dataset.part.split(':'); PU.forgeSel.name = ($('kname').value || ''); PU.forgeSel[k] = id; renderPuPanel(); return; }
          if (T.closest('#forgeGo')) { if (PU.forge) forgeHit(); else forgeStart(); return; }
          const eq = T.closest('[data-kequip]'); if (eq) { const i = +eq.dataset.kequip; SAVE.knife = SAVE.knife === i ? -1 : i; writeSave(); renderPuPanel(); return; }
          const ml = T.closest('[data-kmelt]'); if (ml) {
            const i = +ml.dataset.kmelt, kn = SAVE.knives[i]; SAVE.knives.splice(i, 1); if (SAVE.knife === i) SAVE.knife = -1; else if (SAVE.knife > i) SAVE.knife--;
            const back = Math.floor((HOJAS[kn.hoja].cost.hierro || 0) / 2); SAVE.mat.hierro += back; writeSave(); banner(`Fundiste ${kn.name}: recuperás ${back} de hierro`); renderPuPanel(); return;
          }
        }
        if (PU.ui === 'corral') {
          const f = T.closest('[data-hfav]'); if (f) { SAVE.horse = +f.dataset.hfav; writeSave(); renderPuPanel(); puSyncHorses(); return; }
          const tr = T.closest('[data-htrain]'); if (tr) { const h = SAVE.horses[+tr.dataset.htrain], c = trainCost(h.lvl); if (h.lvl < 5 && canPay(c)) { pay(c); h.lvl++; writeSave(); sfx(660, .1, 'triangle', .05); renderPuPanel(); } return; }
          const fr = T.closest('[data-hfree]'); if (fr) { const i = +fr.dataset.hfree; SAVE.horses.splice(i, 1); if (SAVE.horse === i) SAVE.horse = -1; else if (SAVE.horse > i) SAVE.horse--; writeSave(); puSyncHorses(); renderPuPanel(); return; }
        }
      });
      function fogonCook(id) {
        const r = FOGON_REC[id];
        if (SAVE.comida || r.lvl > SAVE.puesto.fogon || !canPay(r.cost)) { sfx(120, .12, 'square', .03); return; }
        pay(r.cost); SAVE.comida = id; writeSave();
        for (let i = 0; i < 14; i++) PU.fx.push({ k: 'spark', x: 320 + rnd(-10, 10), y: 254, vx: rnd(-50, 50), vy: rnd(-110, -50), life: rnd(.4, .9), max: .9 });
        for (let i = 0; i < 6; i++) PU.fx.push({ k: 'smoke', x: 320 + rnd(-8, 8), y: 248, vx: rnd(-6, 6), vy: rnd(-26, -16), life: rnd(1.6, 2.4), max: 2.4, s: rnd(2.5, 3.5) });
        for (let i = 0; i < 8; i++) setTimeout(() => sfx(2000 + Math.random() * 2200, .03, 'square', .008), i * 45);
        setTimeout(() => sfx(392, .15, 'triangle', .05), 200); setTimeout(() => sfx(523, .22, 'triangle', .05), 320);
        banner(r.name + ': listo para la noche'); renderPuPanel();
      }
      $('puPanel').addEventListener('input', ev => { if (ev.target.id === 'kname' && PU && PU.forgeSel) PU.forgeSel.name = ev.target.value; });
      new MutationObserver(() => { if (PU && PU.ui === 'fragua') drawKnifePreview(); }).observe($('puPanel'), { childList: true });
      $('puPrompt').addEventListener('click', () => puInteract());
      $('puExit').addEventListener('click', () => { if (PU && PU.ui) closePuPanel(); else exitPuesto('vMain'); });
      /* teclado del puesto; devuelve true si se ocupó de la tecla */
      function puKey(e, k) {
        if (!PU) return false;
        if (PU.ui === 'shop') return false;
        if (e.target && e.target.id === 'kname') { if (k === 'escape') e.target.blur(); if (k === 'enter') forgeStart(); return true; }
        if (PU.ui) {
          if (e.repeat) return true;
          if (k === 'escape' || k === 'backspace') { closePuPanel(); return true; }
          if (PU.ui === 'nire') {
            const i = NIRE_ORDER.indexOf(PU.sel);
            if (k === 'arrowright' || k === 'd' || k === 'arrowdown' || k === 's') { PU.sel = NIRE_ORDER[(i + 1) % 20]; rerenderNireInfo(); }
            else if (k === 'arrowleft' || k === 'a' || k === 'arrowup' || k === 'w') { PU.sel = NIRE_ORDER[(i + 19) % 20]; rerenderNireInfo(); }
            else if (k === 'enter' || k === ' ') nireBuy();
            return true;
          }
          if (PU.ui === 'fragua' && PU.forge && (k === ' ' || k === 'enter')) { forgeHit(); return true; }
          if (k === 'enter' || k === ' ') { const ae = document.activeElement; if (ae && ae.tagName === 'BUTTON') ae.click(); return true; }
          if (['arrowdown', 'arrowup', 's', 'w', 'tab'].includes(k)) {
            const els = [...$('puPanel').querySelectorAll('button:not([disabled])')], j = els.indexOf(document.activeElement);
            const n = k === 'arrowdown' || k === 's' ? els[j + 1] || els[0] : els[j - 1] || els[els.length - 1]; if (n) n.focus(); return true;
          }
          return true;
        }
        if (!e.repeat && (k === 'e' || k === 'enter' || k === ' ')) { puInteract(); return true; }
        if (!e.repeat && k === 'escape') { exitPuesto('vMain'); return true; }
        keys.add(k); return true;
      }


