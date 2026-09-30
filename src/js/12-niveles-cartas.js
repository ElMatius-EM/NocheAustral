      /* ---------------- level up / chest ---------------- */
      function buildChoices() {
        const pool = [];
        const B = S.banished;
        for (const w of S.weapons) if (!w.evo && w.lvl < 8 && !B.has(w.id)) pool.push({ kind: 'w', id: w.id, wt: 1.25 });
        if (S.weapons.length < 6) for (const id in WEAPONS) if (!S.weapons.some(w => w.id === id) && unlocked(WEAPONS[id].lock) && !B.has(id)) pool.push({ kind: 'w', id, wt: .8 });
        for (const p of S.passives) if (p.lvl < PASSIVES[p.id].max && !B.has(p.id)) pool.push({ kind: 'p', id: p.id, wt: 1 });
        if (S.passives.length < 6) for (const id in PASSIVES) if (!S.passives.some(p => p.id === id) && !B.has(id)) pool.push({ kind: 'p', id, wt: .7 });
        const out = [];
        while (out.length < 3 && pool.length) {
          let t = 0; for (const o of pool) t += o.wt;
          let r = Math.random() * t, i = 0;
          for (; i < pool.length; i++) { r -= pool[i].wt; if (r <= 0) break; }
          out.push(pool.splice(Math.min(i, pool.length - 1), 1)[0]);
        }
        if (!out.length) out.push({ kind: 'heal' });
        return out;
      }
      function cardHTML(c, i) {
        if (c.kind === 'heal') return `<span class="ci">${ICON_ASADO}</span><span class="ct"><strong>Asado</strong><small>Recuperás 30 de vida.</small></span>`;
        const isW = c.kind === 'w', def = isW ? WEAPONS[c.id] : PASSIVES[c.id];
        const own = (isW ? S.weapons : S.passives).find(x => x.id === c.id);
        const tag = own ? `nivel ${own.lvl + 1}` : 'nuevo';
        const txt = own && isW ? def.ups[own.lvl] : def.desc;
        let hint = '';
        if (isW) { const p = PASSIVES[def.evoWith]; hint = `<em>Evoluciona con ${p.icon} ${p.name}</em>`; }
        else { const wk = Object.keys(WEAPONS).find(k => WEAPONS[k].evoWith === c.id); if (wk) hint = `<em>Hace evolucionar ${WEAPONS[wk].icon} ${WEAPONS[wk].name}</em>`; }
        return `<span class="ci">${def.icon}</span><span class="ct"><strong>${def.name}<span>${tag}</span></strong><small>${txt}</small>${hint}</span>`;
      }
      function openLevelUp() {
        S.state = 'levelup'; S.banishMode = false; S.choices = buildChoices(); S.choiceLock = performance.now() + 350;
        renderChoices(); show('lvlOv'); joy = null;
        sfx(523, .12, 'triangle', .05); setTimeout(() => sfx(784, .18, 'triangle', .05), 90);
      }
      function renderChoices() {
        $('lvlTitle').textContent = 'Nivel ' + (S.level - S.pendingLevels + 1);
        const box = $('cards'); box.innerHTML = '';
        S.choices.forEach((c, i) => {
          const b = document.createElement('button'); b.className = 'card'; b.innerHTML = cardHTML(c, i) + `<kbd>${i + 1}</kbd>`;
          b.addEventListener('click', () => choose(i)); b.addEventListener('mouseenter', () => selCard(i)); box.appendChild(b);
        });
        selCard(0);
        box.classList.toggle('banishing', !!S.banishMode);
        $('banish').innerHTML = S.banishMode ? 'Elegí qué descartar<kbd>B</kbd>' : `Descartar (${S.banishes})<kbd>B</kbd>`;
        $('banish').disabled = S.banishes <= 0;
        $('reroll').innerHTML = `Cambiar opciones (${S.rerolls})<kbd>R</kbd>`;
        $('reroll').disabled = S.rerolls <= 0;
        $('skip').innerHTML = `Saltear (+${skipGold()} de oro)<kbd>X</kbd>`;
      }
      function selCard(i) {
        const cards = $('cards').children, n = cards.length; if (!n) return;
        S.sel = ((i % n) + n) % n;
        for (let j = 0; j < n; j++) cards[j].classList.toggle('sel', j === S.sel);
      }
      function applyChoice(c) {
        if (c.kind === 'heal') { S.player.hp = Math.min(ST.maxHp, S.player.hp + 30); return; }
        if (c.kind === 'w') { const w = S.weapons.find(x => x.id === c.id); if (w) w.lvl++; else addWeapon(c.id); }
        else { const p = S.passives.find(x => x.id === c.id); if (p) p.lvl++; else S.passives.push({ id: c.id, lvl: 1 }); }
        recompute();
      }
      function choose(i) {
        if (!S || S.state !== 'levelup' || performance.now() < S.choiceLock) return;
        if (S.banishMode) { banish(i); return; }
        const c = S.choices[i]; if (!c) return;
        applyChoice(c); finishLevel();
      }
      function banish(i) {
        if (!S || S.state !== 'levelup' || S.banishes <= 0) return;
        const c = S.choices[i]; if (!c || c.kind === 'heal') return;
        S.banished.add(c.id); S.banishes--; S.banishMode = false;
        S.choices = buildChoices(); renderChoices(); sfx(200, .15, 'square', .04, .5);
      }
      function finishLevel() {
        S.pendingLevels--;
        if (S.pendingLevels > 0) { S.choices = buildChoices(); S.choiceLock = performance.now() + 250; renderChoices(); }
        else { hide('lvlOv'); S.state = 'play'; }
      }
      $('reroll').addEventListener('click', () => { if (!S || S.state !== 'levelup' || S.rerolls <= 0) return; S.rerolls--; S.choices = buildChoices(); renderChoices(); });
      const skipGold = () => Math.round((15 + S.level) * ST.greed);
      $('skip').addEventListener('click', () => { if (!S || S.state !== 'levelup' || performance.now() < S.choiceLock) return; const g = skipGold(); S.gold += g; addText(S.player.x, S.player.y - 30, '+' + g, '#e0b75a'); sfx(1320, .05, 'square', .025); finishLevel(); });

      function canEvolve(w) { return !w.evo && w.lvl >= 8 && S.passives.some(p => p.id === WEAPONS[w.id].evoWith); }
      const CA = { timers: [], done: true, finish: null };
      function caLater(ms, fn) { CA.timers.push(setTimeout(fn, ms)); }
      function flashScreen() { if (reduceMotion) return; const f = $('flash'); f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 40); }
      function openChest() {
        S.state = 'chest'; joy = null; SAVE.stats.chests++;
        const results = [], evo = S.weapons.filter(canEvolve).sort((a, b) => (S.dmgBy[b.id] || 0) - (S.dmgBy[a.id] || 0))[0]; let sub = '';
        if (evo) {
          evo.evo = true; SAVE.stats.evos++; const d = WEAPONS[evo.id];
          results.push({ icon: iconURL(evo.id, true), evo: true, html: `<div class="card evo"><span class="ci">${d.evoIcon}</span><span class="ct"><strong>${d.evoName}<span>evolución</span></strong><small>${d.evoDesc}</small></span></div>` });
          sub = '¡Tu arma evolucionó!';
        } else {
          const r = Math.random(), n = r < .07 ? 5 : r < .35 ? 3 : 1;
          for (let i = 0; i < n; i++) {
            const pool = [];
            for (const w of S.weapons) if (!w.evo && w.lvl < 8) pool.push({ kind: 'w', id: w.id });
            for (const p of S.passives) if (p.lvl < PASSIVES[p.id].max) pool.push({ kind: 'p', id: p.id });
            if (!pool.length) { S.player.hp = Math.min(ST.maxHp, S.player.hp + 30); results.push({ icon: iconURL('asado'), html: `<div class="card"><span class="ci">${ICON_ASADO}</span><span class="ct"><strong>Asado</strong><small>Recuperaste 30 de vida.</small></span></div>` }); continue; }
            const c = pool[(Math.random() * pool.length) | 0], html = cardHTML(c);
            applyChoice(c);
            results.push({ icon: iconURL(c.id), html: `<div class="card">${html}</div>` });
          }
          const hint = S.weapons.find(w => !w.evo && w.lvl >= 8);
          sub = hint ? `Para evolucionar ${WEAPONS[hint.id].name} necesitás ${PASSIVES[WEAPONS[hint.id].evoWith].name}.` : 'Las armas en nivel 8 con su objeto pareja evolucionan en el próximo cofre.';
        }
        recompute();
        const gold = Math.round(rnd(15, 40) * ST.greed * (results.length >= 3 ? 1.6 : 1)); S.gold += gold;
        CA.timers.forEach(clearTimeout); CA.timers = []; CA.done = false;
        const stage = $('chestStage'); stage.className = 'stage' + (evo ? ' evo' : '');
        $('chestImg').src = iconURL('cofre'); $('reels').innerHTML = ''; $('chestItems').innerHTML = ''; $('chestGold').innerHTML = ''; $('chestSub').textContent = '';
        $('chestTitle').textContent = evo ? 'Cofre de evolución' : results.length >= 5 ? '¡Cofre legendario!' : results.length >= 3 ? 'Cofre grande' : 'Cofre';
        $('chestOk').disabled = true;
        show('chestOv');
        const pool = [...Object.keys(WEAPONS).map(k => iconURL(k)), ...Object.keys(PASSIVES).map(k => iconURL(k))];
        const goldHTML = v => `${ICON_ORO}<span>+${v}</span>`;
        const finish = () => {
          if (CA.done) return; CA.done = true; CA.timers.forEach(clearTimeout); CA.timers = [];
          stage.classList.remove('shake', 'shake2'); stage.classList.add('open'); $('chestImg').src = iconURL('cofreAbierto');
          $('reels').innerHTML = results.map(r => `<div class="reel land${r.evo ? ' evo' : ''}"><img src="${r.icon}" alt=""></div>`).join('');
          $('chestItems').innerHTML = results.map(r => r.html).join('');
          $('chestGold').innerHTML = goldHTML(gold); $('chestSub').textContent = sub;
          $('chestOk').disabled = false; S.choiceLock = performance.now() + 150;
        };
        CA.finish = finish;
        if (SAVE.opts.fastChest) { finish(); return; }
        stage.classList.add('shake'); sfx(300, .06, 'square', .03);
        caLater(260, () => sfx(360, .06, 'square', .03));
        caLater(520, () => { stage.classList.add('shake2'); sfx(440, .06, 'square', .035); });
        caLater(700, () => sfx(520, .06, 'square', .04));
        caLater(880, () => {
          stage.classList.remove('shake', 'shake2'); stage.classList.add('open'); $('chestImg').src = iconURL('cofreAbierto');
          flashScreen(); sfx(180, .5, 'sawtooth', .05, .4); sfx(880, .3, 'triangle', .05, 1.5);
          const steps = 14;
          for (let i = 1; i <= steps; i++) caLater(i * 42, () => { const cg = $('chestGold'); cg.innerHTML = goldHTML(Math.round(gold * i / steps)); cg.classList.remove('bump'); void cg.offsetWidth; cg.classList.add('bump'); sfx(900 + i * 55, .03, 'square', .015); });
          const t0 = 320;
          results.forEach((r, i) => {
            const spinDur = (r.evo ? 1700 : 560) + i * 300;
            caLater(t0 + i * 170, () => {
              const el = document.createElement('div'); el.className = 'reel spin' + (r.evo ? ' evo' : ''); el.innerHTML = '<img alt="">'; $('reels').appendChild(el);
              let iv = 42, tt = 0;
              const tick = () => {
                if (CA.done) return;
                el.firstChild.src = pool[(Math.random() * pool.length) | 0]; sfx(520 + Math.random() * 260, .02, 'square', .01);
                tt += iv; iv *= 1.13;
                if (tt < spinDur) CA.timers.push(setTimeout(tick, iv));
                else {
                  el.firstChild.src = r.icon; el.className = 'reel land' + (r.evo ? ' evo' : '');
                  sfx(523 * Math.pow(2, ([0, 4, 7, 12, 16][i] || 0) / 12), .28, 'triangle', .06);
                  if (r.evo) { sfx(784, .5, 'triangle', .05); sfx(1047, .6, 'triangle', .04); flashScreen(); }
                  const tmp = document.createElement('div'); tmp.innerHTML = r.html; $('chestItems').appendChild(tmp.firstChild);
                  if (i === results.length - 1) caLater(260, () => { $('chestSub').textContent = sub; finish(); });
                }
              };
              tick();
            });
          });
        });
      }
      $('chestStage').addEventListener('click', () => { if (!CA.done && CA.finish) CA.finish(); });
      $('chestOk').addEventListener('click', () => { if (!S || S.state !== 'chest' || !CA.done || performance.now() < S.choiceLock) return; hide('chestOv'); S.state = 'play'; });


      /* ---------------- cartas de truco ---------------- */
      function openArcana(title, sub) {
        S.state = 'arcana'; joy = null;
        const pool = Object.keys(ARCANAS).filter(k => !S.arc.has(k));
        for (let i = pool.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[pool[i], pool[j]] = [pool[j], pool[i]]; }
        S.arcChoices = pool.slice(0, NI('p4a') ? 4 : 3);
        $('arcTitle').textContent = title; $('arcSub').textContent = sub;
        $('arcs').className = 'arcs';
        $('arcs').innerHTML = S.arcChoices.map((k, i) => `<button class="arc" style="animation-delay:${i * .13}s" data-a="${i}"><img src="${cardURL(k)}" alt=""><strong>${ARCANAS[k].name}</strong><small>${ARCANAS[k].desc}</small><kbd>${i + 1}</kbd></button>`).join('');
        selArc(0); show('arcOv'); S.choiceLock = performance.now() + 550;
        for (let i = 0; i < 3; i++) setTimeout(() => sfx(620 + i * 90, .05, 'square', .03), i * 130);
      }
      function selArc(i) { const els = $('arcs').children, n = els.length; if (!n) return; S.sel = ((i % n) + n) % n; for (let j = 0; j < n; j++) els[j].classList.toggle('sel', j === S.sel); }
      function pickArc(i) {
        if (!S || S.state !== 'arcana' || performance.now() < S.choiceLock) return;
        const k = S.arcChoices[i]; if (!k) return;
        S.arc.add(k); recompute(); S.choiceLock = Infinity;
        const el = $('arcs').children[i]; if (el) el.classList.add('picked'); $('arcs').classList.add('done');
        sfx(523, .12, 'triangle', .05); setTimeout(() => sfx(784, .22, 'triangle', .05), 100);
        setTimeout(() => { hide('arcOv'); if (S && S.state === 'arcana') { S.state = 'play'; S.invDirty = true; banner('Carta: ' + ARCANAS[k].name); } }, 480);
      }
      $('arcs').addEventListener('click', ev => { const b = ev.target.closest('.arc'); if (b) pickArc(+b.dataset.a); });
      $('arcs').addEventListener('mouseover', ev => { const b = ev.target.closest('.arc'); if (b) selArc(+b.dataset.a); });

