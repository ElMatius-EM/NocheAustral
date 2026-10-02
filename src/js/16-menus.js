      /* ---------------- menús ---------------- */
      let pendingChar = 'baqueano', viaPuesto = false;
      const lockTxt = lock => { const a = achById(lock); return a ? 'Bloqueado: ' + a.desc : ''; };
      function renderGold() {
        $('goldMenu').innerHTML = `${ICON_ORO}<span>${SAVE.gold.toLocaleString('es-AR')}</span>`;
        const got = ACH.filter(a => hasAch(a.id)).length, best = Math.max(0, ...Object.entries(SAVE.stats.best).filter(([k]) => !k.endsWith('-post')).map(([, v]) => v));
        $('progMenu').innerHTML = `<span>Logros <b>${got}/${ACH.length}</b></span>${best ? `<span>Récord <b>${fmt(best)}</b></span>` : ''}`;
      }
      function go(v) {
        if (PU && PU.ui === 'shop' && v === 'vMain') { hide('startOv'); PU.ui = null; puHudUpdate(); return; }
        // si la partida se armó desde el fogón, "volver" y "menú" llevan de nuevo al Puesto
        if (v === 'vMain' && viaPuesto && !PU) { enterPuesto(); return; }
        $('toMenu').textContent = viaPuesto ? 'Volver al Puesto' : 'Menú';
        document.querySelectorAll('#title .view').forEach(x => x.classList.toggle('on', x.id === v));
        if (v !== 'vGal') stopGal();
        if (v === 'vChars') renderChars(); else if (v === 'vMaps') renderMaps(); else if (v === 'vShop') renderShop(); else if (v === 'vAch') renderAch(); else if (v === 'vOpts') renderOpts(); else if (v === 'vBest') renderBest(); else if (v === 'vGal') renderGal(); else if (v === 'vCred') renderCredits();
        renderGold();
        const view = $(v), f = view && view.querySelector && view.querySelector('button:not([disabled]):not(.locked)');
        if (f && f.focus) f.focus({ preventScroll: true });
      }
      function renderChars() {
        $('chars').innerHTML = Object.entries(CHARS).map(([k, c]) => {
          const ok = unlocked(c.lock);
          return `<button class="char${ok ? '' : ' locked'}" data-c="${k}" data-pick ${ok ? '' : 'aria-disabled="true"'}><img class="pv" src="${playerURL(k)}" alt=""><strong>${c.name}</strong></button>`;
        }).join('');
        const first = SAVE.lastChar && CHARS[SAVE.lastChar] ? SAVE.lastChar : 'baqueano';
        charPreview(first);
        requestAnimationFrame(() => { const f = $('chars').querySelector(`[data-c="${first}"]`); if (f) f.focus({ preventScroll: true }); });
      }
      function renderMaps() {
        $('maps').innerHTML = Object.entries(MAPS).map(([k, m]) => {
          const ok = unlocked(m.lock), best = SAVE.stats.best[k];
          return `<button class="card${ok ? '' : ' locked'}" data-m="${k}" data-pick><span class="ct"><strong>${m.name}${best ? `<span>récord ${fmt(best)}</span>` : ''}</strong><small>${ok ? m.desc : lockTxt(m.lock)}</small></span></button>`;
        }).join('');
        const hy = hasAch('win');
        $('hyperRow').style.display = hy ? '' : 'none'; $('hyperChk').checked = !!SAVE.hyper;
      }
      function renderShop() {
        $('shop').innerHTML = Object.entries(SHOP).map(([k, it]) => {
          const l = shopLvl(k), full = l >= it.max, c = full ? 0 : shopCost(k), poor = !full && SAVE.gold < c;
          const pips = '●'.repeat(l) + '○'.repeat(it.max - l);
          return `<button class="card${full ? ' done' : ''}${poor ? ' poor' : ''}" data-s="${k}"><span class="ci">${ico(it.icon)}</span><span class="ct"><strong>${it.name}</strong><small>${it.desc}</small><span class="pips">${pips}</span></span><span class="price">${full ? 'Completo' : ICON_ORO + c}</span></button>`;
        }).join('');
        $('refund').textContent = SAVE.spent > 0 ? `Devolver todo (${SAVE.spent})` : 'Devolver todo';
        $('refund').disabled = SAVE.spent <= 0;
      }
      function renderAch() {
        const n = ACH.filter(a => hasAch(a.id)).length;
        $('achSub').textContent = `${n} de ${ACH.length} conseguidos. Enemigos derrotados en total: ${SAVE.stats.kills.toLocaleString('es-AR')}.`;
        $('achs').innerHTML = ACH.map(a => `<div class="card${hasAch(a.id) ? ' done' : ' locked'}"><span class="ct"><strong>${hasAch(a.id) ? '✓ ' : ''}${a.name}</strong><small>${a.desc}</small><em>Premio: ${a.reward}</em></span></div>`).join('');
      }
      function renderBest() {
        const keys = Object.keys(LORE), known = keys.filter(k => SAVE.bestiary[k] > 0).length;
        $('bestSub').textContent = `${known} de ${keys.length} criaturas descubiertas.`;
        $('best').innerHTML = keys.map(k => {
          const n = SAVE.bestiary[k] || 0, T = ETYPES[k], L = LORE[k];
          if (!n) return `<div class="beast unk"><img src="${spriteURL(k, true)}" alt=""><span class="ct"><strong>???</strong><small>Todavía no lo derrotaste. Aparece en: ${L.where}.</small></span></div>`;
          const tough = T.hp >= 1e6 ? 'invencible' : T.hp >= 40 ? 'muy resistente' : T.hp >= 15 ? 'resistente' : 'frágil';
          const wt = T.w >= 10 ? 'inamovible' : T.w >= 2.5 ? 'muy pesado' : T.w >= 1.2 ? 'pesado' : T.w >= .9 ? 'normal' : 'liviano';
          return `<div class="beast"><img src="${spriteURL(k)}" alt=""><span class="ct"><strong>${T.name}<span>${n.toLocaleString('es-AR')} derrotados</span></strong><small>${L.desc}</small><em>${L.where} · ${tough} · ${wt}</em></span></div>`;
        }).join('');
      }
      function renderOpts() {
        $('optMusic').value = SAVE.opts.music; $('optSfx').value = SAVE.opts.sfx;
        $('optNums').checked = !!SAVE.opts.nums; $('optShake').checked = !!SAVE.opts.shake; $('optDark').checked = SAVE.opts.dark !== false; $('optLow').checked = SAVE.opts.gfx === 'bajo'; $('optFps').checked = !!SAVE.opts.fps; $('optFastChest').checked = !!SAVE.opts.fastChest; $('optGlass').checked = SAVE.opts.clearUI !== false;
        $('resetSave').textContent = 'Borrar todo el progreso'; resetArm = false;
      }
      let resetArm = false, refundArm = false;
      $('title').addEventListener('click', ev => {
        initAudio();
        if (ev.target.closest('[data-puesto]')) { menuOk(); enterPuesto(); return; }
        const g = ev.target.closest('[data-go]'); if (g) { menuOk(); go(g.dataset.go); return; }
        const c = ev.target.closest('.char');
        if (c) {
          const k = c.dataset.c; if (c.classList.contains('locked') || (ev.pointerType === 'touch' && pvChar !== k)) { charPreview(k); return; }
          pendingChar = k; SAVE.lastChar = k; writeSave(); menuOk(); go('vMaps'); return;
        }
        if (ev.target.closest('#cpGo')) { if (pvChar && unlocked(CHARS[pvChar].lock)) { pendingChar = pvChar; SAVE.lastChar = pvChar; writeSave(); menuOk(); go('vMaps'); } return; }
        const m = ev.target.closest('[data-m]'); if (m) { if (m.classList.contains('locked')) return; startGame(pendingChar, m.dataset.m); return; }
        const sh = ev.target.closest('[data-s]');
        if (sh) {
          const k = sh.dataset.s, it = SHOP[k]; if (shopLvl(k) >= it.max) return;
          const c = shopCost(k); if (SAVE.gold < c) { sfx(120, .12, 'square', .03); return; }
          SAVE.gold -= c; SAVE.spent += c; SAVE.shop[k] = shopLvl(k) + 1; writeSave();
          initAudio(); sfx(660, .08, 'triangle', .05); setTimeout(() => sfx(990, .12, 'triangle', .05), 70);
          renderShop(); renderGold();
          const again = $('shop').querySelector(`[data-s="${k}"]`); if (again && again.focus) again.focus({ preventScroll: true });
        }
      });
      $('refund').addEventListener('click', () => {
        if (SAVE.spent <= 0) return;
        if (!refundArm) { refundArm = true; $('refund').textContent = '¿Seguro? Tocá de nuevo'; setTimeout(() => { refundArm = false; if ($('vShop').classList.contains('on')) renderShop(); }, 2500); return; }
        refundArm = false; SAVE.gold += SAVE.spent; SAVE.spent = 0; SAVE.shop = {}; writeSave(); renderShop(); renderGold();
      });
      $('hyperChk').addEventListener('change', () => { SAVE.hyper = $('hyperChk').checked; writeSave(); });
      $('optMusic').addEventListener('input', () => { SAVE.opts.music = +$('optMusic').value; writeSave(); });
      $('optSfx').addEventListener('input', () => { SAVE.opts.sfx = +$('optSfx').value; writeSave(); initAudio(); sfx(880, .08, 'triangle', .05); });
      $('optNums').addEventListener('change', () => { SAVE.opts.nums = $('optNums').checked; writeSave(); });
      $('optShake').addEventListener('change', () => { SAVE.opts.shake = $('optShake').checked; writeSave(); });
      $('optDark').addEventListener('change', () => { SAVE.opts.dark = $('optDark').checked; writeSave(); });
      $('optLow').addEventListener('change', () => { SAVE.opts.gfx = $('optLow').checked ? 'bajo' : 'alto'; GFX_LOW = SAVE.opts.gfx === 'bajo'; RES_K = 1; writeSave(); resize(); });
      $('optFps').addEventListener('change', () => { SAVE.opts.fps = $('optFps').checked; writeSave(); $('fpsMeter').classList.toggle('on', SAVE.opts.fps); });
      $('optFastChest').addEventListener('change', () => { SAVE.opts.fastChest = $('optFastChest').checked; writeSave(); });
      $('optGlass').addEventListener('change', () => { SAVE.opts.clearUI = $('optGlass').checked; document.documentElement.classList.toggle('clear', SAVE.opts.clearUI); writeSave(); });
      $('resetSave').addEventListener('click', () => {
        if (!resetArm) { resetArm = true; $('resetSave').textContent = '¿Seguro? Se pierde todo. Tocá de nuevo'; return; }
        const opts = SAVE.opts; SAVE = DEF_SAVE(); SAVE.opts = opts; normSave(); writeSave(); renderOpts(); renderGold();
      });
      function startGame(c, m) {
        initAudio(); if (AC && AC.state === 'suspended') AC.resume();
        newGame(c, m);
        hide('startOv'); $('hud').classList.add('on'); $('hud').classList.remove('campo'); $('dashBtn').classList.add('on'); $('whBtn').classList.toggle('on', !!SAVE.horses[SAVE.horse]);
        musicStart();
        openArcana('Elegí tu carta', 'Una carta de truco que cambia las reglas de esta partida.');
      }
      $('goldIco').src = iconURL('oro');

