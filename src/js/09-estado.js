      /* ---------------- state ---------------- */
      let S = null, ST = null, PU = null;
      const freeE = [];
      /* ---- equilibrio ----
         La vida de los enemigos escala con el tiempo y con el nivel del jugador; el daño enemigo crece más rápido después del minuto 8.
         Élites, mini-jefes y jefes tienen un piso de vida calculado con el daño por segundo real del jugador (dpsEMA). */
      const BAL = { lvlHp: .012, lateDmg: .012, floorElite: 10, floorMini: 9, floorBoss: 18, auraVsElite: .6, healCap: 4, capElite: 12, capMini: 20, capBoss: 35 };
      function hpMult() { if (S.mode === 'campo') return 1.2; const m = S.t / 60; return (1 + m * .3 + m * m * .025) * (1 + Math.max(0, S.level - 15) * BAL.lvlHp); }
      function dmgMult() { if (S.mode === 'campo') return 1; const m = S.t / 60; return 1 + m * .06 + Math.max(0, m - 8) ** 2 * BAL.lateDmg; }
      const AURA = new Set(['fogon', 'pava', 'fuego']);
      function healFromWeapon(v) { const P = S.player, h = Math.min(v, S.healBudget || 0); if (h <= 0) return; S.healBudget -= h; P.hp = Math.min(ST.maxHp, P.hp + h); }
      function eliteCap() { return Math.min(BAL.capElite, 7 + S.t / 60 * .5); }
      function eliteFloor() { return Math.max(5, BAL.floorElite - S.t / 60 * .5); }
      function eliteHp(base, secs) { return Math.max(base, (S.dpsEMA || 0) * secs); }
      function minute() { return Math.floor(S.t / 60); }
      function xpNeed(L) { if (L < 20) return 5 + (L - 1) * 7; if (L < 40) return 138 + (L - 20) * 11; return 358 + (L - 40) * 14; }

      function newGame(charId, mapId, mode) {
        S = {
          t: 0, state: 'play', mode: mode || 'noche', char: charId, map: mapId || 'estepa', hyper: !!(SAVE.hyper && hasAch('win')),
          gold: 0, goldBanked: 0, banished: new Set(), banishes: 1 + shopLvl('descarte'), banishMode: false, revives: shopLvl('segunda'), newAch: [], achT: 1, freezeT: 0, whiteFlash: 0, propT: 0, waves: [], zones: [], throws: [], won: false, counted: false, arc: new Set(), arcChoices: [], bonusHp: 0, weather: null, weatherNext: 70, streaks: [], trailT: 0,
          player: { x: 0, y: 0, r: 12, hp: 100, iframe: 0, touchIF: 0, fx: 1, fy: 0, face: 1, moving: false, dashT: 0, dashCD: 0, dvx: 0, dvy: 0, vx: 0, vy: 0 }, ghosts: [], hitstop: 0, combo: 0, comboT: 0, comboBest: 0, nextMilestone: 50, sel: 0,
          weapons: [], passives: [], level: 1, xp: 0, xpNext: xpNeed(1), kills: 0,
          enemies: [], proj: [], ebul: [], gems: [], picks: [], parts: [], texts: [], fx: [], timers: [],
          rerolls: 3 + shopLvl('otramano') + (NI('p3') ? 1 : 0), spawnAcc: 0, bigGem: null, dmgBy: {}, shake: 0, hurtFlash: 0, endless: false, nextMandinga: 0,
          pendingLevels: 0, pendingChests: 0, mat: { cuero: 0, hueso: 0, hierro: 0 }, matBanked: {}, famaGiven: 0, eliteK: 0, miniK: 0, bossK: 0, whistled: false, tamed: null, horseKept: false, secondWind: false, mounts: [], ride: null, herdSeed: (Math.random() * 1e5) | 0, terrSeed: (Math.random() * 997) | 0, marks: [], ripples: [], crit: [], critT: 1.5, tw: [], twT: 0, ani: new Map(), aniScan: 0, aniNear: null, aniTip: false, wetTip: false, pWet: false, stepAcc: 0, stepSide: 1, splT: 0, birdT: 0, crkT: 2, star: null, howlT: -99, herdCD: new Map(), herdAct: new Set(), herdScan: 0, tumble: 0, herdTip: false, events: buildEvents(), cracks: [], crackNext: 100, endAcc: 0, invDirty: true, choiceLock: 0
        };
        if (S.mode === 'campo') {
          // mundo persistente: terreno y potreros salen de la semilla guardada, sin eventos, sin cartas ni noche cerrada
          S.events = []; S.hyper = false; S.herdSeed = SAVE.campo.seed; S.terrSeed = SAVE.campo.seed % 997;
          S.campoTaken = new Set(); S.leftHome = false; S.gath = null; S.armed = false; campoCache.clear();
        }
        // lo preparado en el fogón se gasta en la primera noche que sale del Puesto (no en el campo ni en partida rápida)
        if (S.mode !== 'campo' && viaPuesto && SAVE.comida && FOGON_REC[SAVE.comida]) { S.comida = { id: SAVE.comida, until: COMIDA_T, done: false }; SAVE.comida = null; writeSave(); }
        ST = null; obsCache.clear(); TCACHE.clear();
        for (const e of freeE) e.dead = true;
        addWeapon(CHARS[charId].weapon);
        recompute(); S.player.hp = ST.maxHp;
        hud.last = {};
      }
      function buildEvents() {
        // 'horda' se sortea entre bandada, estampida y cerco (sin repetir la anterior); los tiempos varían ±12 s.
        // Jefe, arcana y amanecer quedan fijos.
        const base = [[120, 'elite'], [165, 'horda'], [220, 'horda'], [270, 'horda'], [300, 'elite'], [350, 'horda'], [410, 'horda'], [440, 'miniboss'],
        [475, 'horda'], [510, 'elite'], [540, 'horda'], [570, 'horda'], [600, 'boss'], [605, 'arcana'], [650, 'horda'], [690, 'elite'], [730, 'horda'],
        [770, 'horda'], [810, 'elite'], [840, 'horda'], [870, 'horda'], [900, 'win']];
        const HORDAS = ['swarm', 'rush', 'ring'], FIX = { boss: 1, arcana: 1, win: 1 }; let prev = null;
        return base.map(([t, type]) => {
          if (type === 'horda') { const opts = HORDAS.filter(h => h !== prev); type = opts[(Math.random() * opts.length) | 0]; prev = type; }
          if (!FIX[type]) t = Math.min(885, t + Math.round(rnd(-12, 12)));
          return { t, type, done: false };
        });
      }
      function recompute() {
        const p = { might: 1, area: 1, cd: 1, dur: 1, amount: 0, speed: 150, magnet: 62, armor: 0, maxHp: 100, regen: 0, growth: 1, greed: 1 };
        const b = CHARS[S.char].bonus;
        for (const k in b) p[k] *= b[k];
        const L = shopLvl;
        p.might *= 1 + .05 * L('fuerza'); p.maxHp *= 1 + .1 * L('aguante'); p.armor += L('cuerocurtido'); p.cd *= 1 - .03 * L('pulso');
        p.area *= 1 + .05 * L('brazo'); p.speed *= 1 + .05 * L('caballo'); p.magnet *= 1 + .2 * L('bolsillos'); p.growth *= 1 + .06 * L('baquiania');
        p.greed *= 1 + .15 * L('codicia'); p.regen += .2 * L('matediario');
        if (S.arc) { if (S.arc.has('sieteOros')) p.greed *= 1.25; if (S.arc.has('reyEspadas')) { p.amount += 1; p.cd *= 1.15; } }
        p.maxHp += S.bonusHp || 0;
        if (S.hyper) { p.speed *= 1.15; p.greed *= 1.5; }
        for (const ps of S.passives) PASSIVES[ps.id].apply(p, ps.lvl);
        nireApply(p);
        const prevMax = ST ? ST.maxHp : p.maxHp;
        ST = p;
        if (S.player && p.maxHp > prevMax) S.player.hp += p.maxHp - prevMax;
        S.invDirty = true;
      }
      function addWeapon(id) { S.weapons.push({ id, lvl: 1, cd: 0, evo: false }); S.dmgBy[id] = 0; }
      function st(w) { const d = WEAPONS[w.id]; return w.evo ? d.evo : d.stats(w.lvl); }
      function later(t, fn) { if (t <= 0) { fn(); return; } S.timers.push({ t, fn }); }

      /* ---------------- spatial hash ---------------- */
      const CELL = 72, MAXR = 50, grid = new Map(), used = [];
      const gk = (ix, iy) => (ix + 40000) * 80000 + (iy + 40000);
      function buildGrid() {
        for (const a of used) a.length = 0; used.length = 0;
        if (grid.size > 6000) grid.clear();
        for (const e of S.enemies) {
          if (e.dead) continue;
          const k = gk(Math.floor(e.x / CELL), Math.floor(e.y / CELL));
          let a = grid.get(k); if (!a) { a = []; grid.set(k, a); }
          if (a.length === 0) used.push(a);
          a.push(e);
        }
      }
      function forNear(x, y, r, fn, pad) {
        const R = r + (pad === undefined ? MAXR : pad);
        const x0 = Math.floor((x - R) / CELL), x1 = Math.floor((x + R) / CELL), y0 = Math.floor((y - R) / CELL), y1 = Math.floor((y + R) / CELL);
        for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
          const a = grid.get(gk(ix, iy)); if (!a || !a.length) continue;
          for (let i = 0; i < a.length; i++) { const e = a[i]; if (!e.dead && fn(e) === false) return; }
        }
      }
      const OBS_CELL = 340, obsCache = new Map();
      function obsChunk(ix, iy) {
        const key = gk(ix, iy) * 2 + (S.map === 'glaciar' ? 1 : 0); let a = obsCache.get(key); if (a) return a; a = [];
        const M = MAP(), h0 = hash(ix * 31 + 7, iy * 17 + 3), n = h0 < .3 ? 0 : h0 < .78 ? 1 : 2;
        for (let i = 0; i < n; i++) {
          const h1 = hash(ix * 13 + i * 7, iy * 29 - i * 3), h2 = hash(ix * 5 - i * 11, iy * 7 + i * 19), h3 = hash(ix + i * 23, iy * 3 - i);
          const x = (ix + .15 + h1 * .7) * OBS_CELL, y = (iy + .15 + h2 * .7) * OBS_CELL, r = 20 + h3 * 30;
          if (Math.hypot(x, y) < 260) continue;
          if (a.some(o => Math.hypot(o.x - x, o.y - y) < o.r + r + 70)) continue;
          a.push({ x, y, r, kind: M.obs[h3 < .55 ? 0 : 1], seed: Math.floor(h1 * 1000) });
        }
        if (obsCache.size > 4000) obsCache.clear();
        obsCache.set(key, a); return a;
      }
      function forObs(x, y, r, fn) {
        const x0 = Math.floor((x - r - 60) / OBS_CELL), x1 = Math.floor((x + r + 60) / OBS_CELL), y0 = Math.floor((y - r - 60) / OBS_CELL), y1 = Math.floor((y + r + 60) / OBS_CELL);
        for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) { const a = obsChunk(ix, iy); for (let i = 0; i < a.length; i++) fn(a[i]); }
      }
      function pushOut(ent, rad, slide) {
        let hit = false;
        forObs(ent.x, ent.y, rad, o => {
          const dx = ent.x - o.x, dy = ent.y - o.y, d = Math.hypot(dx, dy) || .01, m = o.r + rad;
          if (d < m) { ent.x = o.x + dx / d * m; ent.y = o.y + dy / d * m; hit = true; if (slide) { const sg = slide * ((ent.wob || 0) > Math.PI ? 1 : -1); ent.x += -dy / d * sg; ent.y += dx / d * sg; } }
        });
        return hit;
      }
      const dist2 = (e, x, y) => { const dx = e.x - x, dy = e.y - y; return dx * dx + dy * dy; };
      function canHit(e, key, t) { const l = e.imm[key]; if (l === undefined || S.t - l >= t) { e.imm[key] = S.t; return true; } return false; }
      function nearest(x, y) { let b = null, bd = Infinity; for (const e of S.enemies) { if (e.dead || e.prop) continue; const d = dist2(e, x, y); if (d < bd) { bd = d; b = e; } } return b; }

