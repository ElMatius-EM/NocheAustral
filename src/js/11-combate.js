      /* ---------------- combat ---------------- */
      function hurt(e, dmg, w, kb, sx, sy) {
        if (e.dead) return;
        if (e.type === 'mandinga' && (!e.fight || e.jph === 'air')) { e.flash = .05; return; }
        dmg *= ST.might * rnd(.92, 1.08);
        const wb = CHARS[S.char].wdmg; if (wb && wb[w.id]) dmg *= wb[w.id];
        if (e.elite && AURA.has(w.id)) dmg *= BAL.auraVsElite;
        let crit = false; if (S.arc.has('sieteEspadas') && Math.random() < .15) { dmg *= 2.5; crit = true; } else if (NI('c1') && Math.random() < .05) { dmg *= 2; crit = true; }
        if (e.elite && ST.eliteDmg) dmg *= 1 + ST.eliteDmg;
        if (!e.prop) S.dmgFrame = (S.dmgFrame || 0) + dmg;
        if (e.fight) e.rawIn += dmg;  // daño real antes del tope, para calibrar la vida del Mandinga
        // tope de daño por segundo en élites y jefes: la pelea dura al menos capT segundos, sin importar el build
        let resist = false;
        if (e.capT) {
          if (S.t - e.cw >= .5) { e.cw = S.t; e.cdmg = 0; } const lim = e.maxHp / e.capT * .5, over = Math.max(0, e.cdmg + dmg - lim);
          if (over > 0) { dmg = dmg - over + over * .1; resist = true; } e.cdmg += dmg;
        }
        e.hp -= dmg; e.flash = .09;
        if (NI('c3') && !e.elite && !e.prop && e.hp > 0 && e.hp < e.maxHp * .12) e.hp = 0;
        if (!e.prop && S.parts.length < 450 * PART_K && Math.random() < .6) { const sx = e.x - S.player.x, sy = e.y - S.player.y, sl = Math.hypot(sx, sy) || 1; for (let i = 0; i < 2; i++) S.parts.push({ x: e.x - sx / sl * e.r * .6, y: e.y - sy / sl * e.r * .6, vx: sx / sl * rnd(60, 140) + rnd(-40, 40), vy: sy / sl * rnd(60, 140) + rnd(-40, 40), life: rnd(.12, .22), max: .22, col: crit ? '#ffd23c' : '#fff4d8', size: rnd(1.5, 2.5) }); }
        S.dmgBy[w.id] = (S.dmgBy[w.id] || 0) + dmg;
        if (!e.prop && SAVE.opts.nums) dmgNum(e, dmg, w, crit, resist);
        if (kb && !e.boss) {
          const P = S.player; if (sx === undefined) { sx = P.x; sy = P.y; }
          let dx = e.x - sx, dy = e.y - sy, d = Math.hypot(dx, dy);
          if (d < .5) { dx = e.x - P.x; dy = e.y - P.y; d = Math.hypot(dx, dy) || 1; }
          const wt = ETYPES[e.type].w * (e.elite ? 12 : 1), k = kb * 42 / wt;
          e.kx += dx / d * k; e.ky += dy / d * k;
          const km = Math.hypot(e.kx, e.ky), cap = 520 / Math.sqrt(wt);
          if (km > cap) { e.kx *= cap / km; e.ky *= cap / km; }
        }
        if (w.evo && w.id === 'rebenque') healFromWeapon(WEAPONS.rebenque.evo.steal);
        if (e.hp <= 0) kill(e);
      }
      const MILESTONES = [50, 100, 200, 350, 500, 750, 1000];
      function nextMs(v) { const i = MILESTONES.indexOf(v); return i >= 0 && i < MILESTONES.length - 1 ? MILESTONES[i + 1] : v + 500; }
      function propDrop(e) {
        const r = Math.random(), push = (type, v) => S.picks.push({ type, x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 8), t: 0, v });
        if (Math.random() < .3) S.picks.push({ type: 'mat', m: 'hierro', v: 1, x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 8), t: 0 });
        if (r < .38) { for (let i = 0; i < 4; i++) push('oro', Math.max(1, Math.round(2 * ST.greed))); }
        else if (r < .55) push('bolsa', Math.round(rnd(15, 30) * ST.greed));
        else if (r < .75) push('asado');
        else if (r < .85) push('iman');
        else if (r < .93) push('bomba');
        else push('helada');
      }
      const HARD_GLOW = 'rgba(255,70,70,.5)';
      function clearBullets(test, force) {
        let n = 0;
        for (const b of S.ebul) { if (!b.dead && (force || !b.hard) && test(b)) { b.dead = true; n++; if (S.parts.length < 600 * PART_K) for (let i = 0; i < 4; i++) { const a = Math.random() * TAU; S.parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, life: .25, max: .25, col: b.col || '#e2b6ff', size: 2.5 }); } } }
        if (n) sfx(1500, .04, 'square', .015, .5);
      }
      function ashBomb() {
        const P = S.player, hw = W / 2 / ZOOM, hh = H / 2 / ZOOM, pw = { id: 'bomba', evo: false }, dmg = 60 + 35 * minute();
        for (const e of S.enemies) if (!e.dead && !e.prop && !mHunter(e) && Math.abs(e.x - P.x) < hw && Math.abs(e.y - P.y) < hh) hurt(e, dmg, pw, 10);
        clearBullets(() => true, true);
        S.whiteFlash = .35; S.shake = 1; S.hitstop = Math.max(S.hitstop, .08);
        S.fx.push({ type: 'ring', x: P.x, y: P.y, life: .6, max: .6, col: '#fff3d0', R: Math.max(hw, hh) });
        sfx(80, .7, 'sawtooth', .08, .3);
      }
      function kill(e) {
        if (e.fight) { mandingaDown(e); return; }
        if (e.prop) {
          e.dead = true; propDrop(e); burst(e.x, e.y, 10, '#ffcf6a', 120);
          if (S.fx.length < 320) S.fx.push({ type: 'death', x: e.x, y: e.y, etype: e.type, scale: 1, frame: 0, tilt: 0, life: .26, max: .26, vx: 0, vy: 0, spin: 0, rot: 0 });
          sfx(900, .08, 'square', .03, .5); return;
        }
        if (Math.random() < .3) addMark(e.x, e.y + e.r * .6, 0, 'stain', 12, ETYPES[e.type].col, e.r * .75);
        e.dead = true; S.kills++; SAVE.stats.kills++; SAVE.bestiary[e.type] = (SAVE.bestiary[e.type] || 0) + 1;
        if (e.boss && e.type !== 'mandinga') SAVE.stats.bosses++;
        S.combo++; S.comboT = 2.2; if (S.combo > S.comboBest) S.comboBest = S.combo;
        if (S.combo >= S.nextMilestone) {
          const ms = S.nextMilestone; S.nextMilestone = nextMs(ms);
          gainXP(Math.round(ms / 4)); S.hitstop = Math.max(S.hitstop, .05);
          S.fx.push({ type: 'ring', x: S.player.x, y: S.player.y, life: .5, max: .5, col: '#ffd98a', R: 140 });
          addText(S.player.x, S.player.y - 40, '¡Combo ' + ms + '!', '#ffd98a');
          hud.pop = true; sfx(660, .08, 'square', .04); setTimeout(() => sfx(990, .12, 'square', .04), 60);
        }
        if (e.elite) { S.hitstop = Math.max(S.hitstop, e.boss ? .18 : .09); S.shake = Math.min(1, S.shake + (e.boss ? .8 : .4)); }
        const T = ETYPES[e.type];
        if (S.fx.length < 320) {
          const isA = e.type === 'anima', sp = SPR[e.type];
          S.fx.push({
            type: 'death', x: e.x, y: e.y, etype: e.type, scale: e.r / T.r, frame: isA ? ((S.t * 9 + e.wob * 4) | 0) % sp.frames.length : 0,
            tilt: isA ? clamp((e.mvx || 0) / 140, -1, 1) * .28 : 0, life: isA ? .7 : .26, max: isA ? .7 : .26, vx: e.kx * 1.3, vy: e.ky * 1.3, spin: (e.kx >= 0 ? 1 : -1) * Math.min(12, Math.hypot(e.kx, e.ky) / 40) / ETYPES[e.type].w, rot: 0
          });
        }
        if (e.type === 'anima') {
          for (let i = 0; i < 5 && S.parts.length < 600 * PART_K; i++) S.parts.push({ x: e.x + rnd(-8, 8), y: e.y + rnd(-8, 6), vx: rnd(-30, 30) + e.kx * .5, vy: rnd(-90, -35) + e.ky * .5, life: rnd(.5, .9), max: .9, col: i % 3 ? '#dbe8ff' : '#8fb8f5', size: rnd(3.5, 5.5), glow: true });
          if (S.fx.length < 320) S.fx.push({ type: 'ring', x: e.x, y: e.y, life: .35, max: .35, col: 'rgba(200,222,255,.7)', R: 26 });
        } else burst(e.x, e.y, e.elite ? 22 : 6, T.col, e.elite ? 160 : 90, e.kx, e.ky);
        if (e.xp > 0) spawnGem(e.x, e.y, e.xp);
        dropMats(e); if (e.boss && e.type !== 'mandinga') S.bossK++; else if (e.mini) S.miniK++; else if (e.elite && e.type !== 'mandinga') S.eliteK++;
        if (e.chest) { S.picks.push({ type: 'cofre', x: e.x, y: e.y, t: 0 }); S.fx.push({ type: 'ring', x: e.x, y: e.y, life: .6, max: .6, col: '#c9a45c', R: 80 }); }
        const r = Math.random();
        const ar = (S.arc.has('cuatroCopas') ? .012 : .005) / BAL.dens;
        if (r < ar) S.picks.push({ type: 'asado', x: e.x, y: e.y, t: 0 });
        else if (r < ar + .0025 / BAL.dens) S.picks.push({ type: 'iman', x: e.x, y: e.y, t: 0 });
        if (e.elite && e.type !== 'mandinga') S.picks.push({ type: 'bolsa', x: e.x + 14, y: e.y, t: 0, v: Math.round((e.boss ? 120 : rnd(25, 45)) * ST.greed) });
        else if (S.mode !== 'campo' && Math.random() < .035 / BAL.dens && S.picks.length < 250) S.picks.push({ type: 'oro', x: e.x, y: e.y, t: 0, v: Math.max(1, Math.round(ST.greed)) });
      }
      function swing(w, s, dir, yo) {
        const P = S.player, A = s.area * ST.area, ww = 150 * A, hh = 34 * A;
        const x0 = dir > 0 ? P.x + 6 : P.x - 6 - ww, y0 = P.y - hh / 2 + yo;
        forNear(x0 + ww / 2, y0 + hh / 2, ww / 2, e => {
          if (e.x + e.r > x0 && e.x - e.r < x0 + ww && e.y + e.r > y0 && e.y - e.r < y0 + hh) hurt(e, s.dmg, w, 5);
        });
        clearBullets(b => b.x + b.r > x0 && b.x - b.r < x0 + ww && b.y + b.r > y0 && b.y - b.r < y0 + hh);
        P.atkT = P.atkMax = .24; P.atkDir = dir === P.face ? 1 : -1; P.atkKind = 'whip';
        S.fx.push({ type: 'slash', x: x0, y: y0, w: ww, h: hh, dir, life: .26, max: .26, evo: w.evo, ox: P.x + dir * 6, oy: P.y + yo - 3 });
        later(.07, () => sfx(2400, .03, 'square', .018, .5));
        sfx(260, .08, 'triangle', .03, .5);
      }
      function strike(w, s, x, y) {
        const R = s.aoe * ST.area;
        forNear(x, y, R, e => { const rr = R + e.r; if (dist2(e, x, y) < rr * rr) hurt(e, s.dmg, w, 5, x, y); });
        S.fx.push({ type: 'bolt', x, y, R, life: .3, max: .3, seed: Math.random() * 1000, evo: w.evo });
        if (S.fx.length < 320) S.fx.push({ type: 'scorch', x, y, R: R * .75, life: 1.4, max: 1.4 });
        burst(x, y, 6, '#bfe3ff', 120);
        S.shake = Math.min(.35, S.shake + (w.evo ? .06 : .03));
        sfx(1400, .12, 'sawtooth', .025, .2);
      }
      function spawnProj(p) { p.dead = false; if (p.rep) p.hitT = new Map(); else p.hit = new Set(); S.proj.push(p); }
      /* Balance del daño recibido: ajustá acá */
      const CONTACT_CD = .8;      // cada enemigo puede pegarte por contacto como mucho cada 0,8 s
      const CONTACT_IFRAME = .15; // invulnerabilidad corta entre golpes de contacto (tope ~6,7 golpes/s)
      const ARMOR_PCT = .06;      // cada punto de armadura reduce 6% el daño
      const ARMOR_CAP = .6;       // tope de reducción por armadura
      function armorRed() { return Math.min(ARMOR_CAP, ST.armor * ARMOR_PCT); }
      function hurtPlayer(raw, contact) {
        const P = S.player; if (P.iframe > 0) return;
        if (S.ride) { rideHurt(raw); if (contact) P.touchIF = CONTACT_IFRAME; else P.iframe = .2; return; }
        for (const a of S.mounts) if (a.tame > 0) a.tame = Math.max(0, a.tame - .25);
        const d = Math.max(1, raw * (1 - armorRed()) * ST.taken); P.hp -= d;
        if (NI('h4a') && !S.secondWind && P.hp > 0 && P.hp < ST.maxHp * .25) { S.secondWind = true; P.iframe = 3; P.hp = Math.min(ST.maxHp, P.hp + ST.maxHp * .3); banner('Segundo aire'); S.fx.push({ type: 'ring', x: P.x, y: P.y, life: .6, max: .6, col: '#8fe07a', R: 120 }); sfx(440, .3, 'triangle', .05, 2); }
        if (contact) P.touchIF = CONTACT_IFRAME; else P.iframe = .3;
        S.shake = Math.min(1, S.shake + .35); if (d >= ST.maxHp * .06) S.hurtFlash = .25; S.hitstop = Math.max(S.hitstop, .04);  // el flash es una capa a pantalla completa: solo golpes que pesan
        addText(P.x, P.y - 26, Math.round(d), '#ff6b6b');
        sfx(90, .15, 'square', .05, .6);
      }
      function spawnGem(x, y, v) {
        if (S.gems.length >= 350) {
          if (!S.bigGem || S.bigGem.dead) { S.bigGem = { x, y, v: 0, vac: false, dead: false, big: true }; S.gems.push(S.bigGem); }
          S.bigGem.v += v; return;
        }
        S.gems.push({ x: x + rnd(-4, 4), y: y + rnd(-4, 4), v, vac: false, dead: false, big: false });
      }
      function gainXP(v) {
        S.xp += v * ST.growth;
        while (S.xp >= S.xpNext) {
          S.xp -= S.xpNext; S.level++; S.xpNext = xpNeed(S.level); S.pendingLevels++;
          if (S.arc.has('sotaOros')) S.waves.push({ x: S.player.x, y: S.player.y, r: 6, R: 230, spd: 420, dmg: 20 + 6 * S.t / 60, w: PWS, hit: new Set(), evo: false, gold: true });
        }
      }
      function burst(x, y, n, col, sp, bx, by) {
        if (GFX_LOW) n = Math.ceil(n / 2);
        for (let i = 0; i < n && S.parts.length < 600 * PART_K; i++) {
          const a = Math.random() * TAU, v = rnd(.3, 1) * sp;
          S.parts.push({ x, y, vx: Math.cos(a) * v + (bx || 0) * .45, vy: Math.sin(a) * v + (by || 0) * .45, life: rnd(.25, .5), max: .5, col, size: rnd(2, 4) });
        }
      }
      function addText(x, y, txt, col, big) { S.texts.push({ x, y, txt, col, life: big ? .8 : .6, big }); }
      /* ---- agregador de números de daño ----
         Un número por enemigo: mientras sigan llegando golpes (sin cortes de más de AGG_GAP) el mismo número crece
         y sigue al enemigo. Las auras pegan cada 0,35-0,55 s, así que usan una ventana más larga. AGG_MAX evita que
         un enemigo metido en varias fuentes tenga un número abierto para siempre. */
      const AGG_GAP = .2, AGG_GAP_AURA = .6, AGG_MAX = 1.2, AGG_TIER = [60, 250];
      function dmgNum(e, dmg, w, crit, resist) {
        const gap = AURA.has(w.id) ? AGG_GAP_AURA : AGG_GAP, t = e.dmgTxt;
        if (t && !t.dead && S.t - t.last < gap && S.t - t.born < AGG_MAX) {
          t.val += dmg; t.hits++; t.last = S.t; t.life = Math.max(t.life, .5);
          if (crit && !resist) t.crit = true; if (!resist) t.res = false;
          aggStyle(t); return;
        }
        if (S.texts.length >= 90) return;
        const n = { x: e.x + rnd(-4, 4), y: e.y - e.r - 4, val: dmg, hits: 1, born: S.t, last: S.t, crit: crit && !resist, res: resist, life: .6, e };
        aggStyle(n); S.texts.push(n); e.dmgTxt = n;
      }
      function aggStyle(t) {
        const prev = t.tier;
        t.txt = Math.round(t.val);
        t.col = t.crit ? '#ffd23c' : t.res ? '#8a90a4' : '#f4efe0';
        t.tier = (t.val >= AGG_TIER[1] ? 2 : t.val >= AGG_TIER[0] ? 1 : 0) + (t.crit ? 1 : 0);
        if (t.hits > 1 && t.tier !== prev) t.pop = .1;   // salta un escalón al cambiar de tamaño
      }

