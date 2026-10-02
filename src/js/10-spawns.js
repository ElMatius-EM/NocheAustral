      /* ---------------- spawning ---------------- */
      function viewR() { return Math.hypot(W, H) / 2 / ZOOM; }
      function spawnPos() { const P = S.player, d = viewR() + 40, a = Math.random() * TAU; return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d]; }
      function spawnAhead() { const P = S.player, d = viewR() + 40, a = Math.atan2(P.fy, P.fx) + rnd(-1.1, 1.1); return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d]; }
      function pickW(o) { const wf = k => o[k] * (ETYPES[k].ranged ? .4 : 1); let t = 0; for (const k in o) t += wf(k); let r = Math.random() * t; for (const k in o) { r -= wf(k); if (r <= 0) return k; } return Object.keys(o)[0]; }
      function spawnEnemy(type, x, y, opt) {
        const T = ETYPES[type], m = S.t / 60, hm = hpMult();
        const e = freeE.pop() || {};
        e.type = type; e.x = x; e.y = y; e.r = T.r; e.hp = e.maxHp = T.hp * hm; e.spd = T.spd * rnd(.82, 1.18) * (S.hyper ? 1.25 : 1); e.dmg = T.dmg * dmgMult(); e.xp = S.mode === 'campo' ? 0 : T.xp;
        e.dead = false; e.gone = false; e.dmgTxt = null; e.mini = false; e.capT = 0; e.cw = 0; e.cdmg = 0; e.howl = undefined; e.enr = false; e.flash = 0; e.kx = 0; e.ky = 0; e.imm = {}; e.slowT = 0; e.elite = false; e.boss = false; e.chest = false;
        e.vx = 0; e.vy = 0; e.life = 0; e.straight = false; e.prop = !!T.prop; e.shoot = rnd(1.5, 3); e.scale = 1; e.oa = Math.random() * TAU; e.orad = rnd(80, 260); e.odir = Math.random() < .5 ? -1 : 1; e.phase = null; e.ch = undefined; e.summon = 6; e.aimT = 0; e.wob = Math.random() * TAU; e._wtT = 0; e._wet = false; e._md = 0;
        if (opt) Object.assign(e, opt);
        S.enemies.push(e);
        if (type === 'lobizon') howlFar();
        return e;
      }
      function updateWeather(dt) {
        const M = MAP(), P = S.player;
        if (!S.weather) {
          if (S.t >= S.weatherNext) {
            const a = Math.random() * TAU, type = M.weather;
            S.weather = { type, t: 0, dur: type === 'ventisca' ? 11 : type === 'lluvia' ? 14 : 8, dx: type === 'lluvia' ? Math.cos(a) * .18 : Math.cos(a), dy: type === 'lluvia' ? 1 : Math.sin(a) };
            banner(type === 'ventisca' ? 'Ventisca: casi no se ve' : type === 'lluvia' ? 'Se larga a llover: el barro te frena' : 'Sopla el viento patagónico');
            sfx(140, 1.2, 'sawtooth', .03, .6);
          }
          return;
        }
        const w = S.weather; w.t += dt;
        if (w.t >= w.dur) { S.weather = null; S.weatherNext = S.t + rnd(60, 95); return; }
        const k = Math.sin(Math.min(1, w.t / 1.2, (w.dur - w.t) / 1.2) * Math.PI / 2), f = (w.type === 'viento' ? 90 : 55) * k;
        w.k = k;
        if (w.type === 'lluvia') return;  // la lluvia no empuja: frena (ver mudK en el movimiento)
        if (P.dashT <= 0) { P.x += w.dx * f * dt; P.y += w.dy * f * dt; }
        for (const e of S.enemies) { if (e.dead || e.prop || e.boss) continue; const g = f * .8 / Math.max(1, ETYPES[e.type].w) * dt; e.x += w.dx * g; e.y += w.dy * g; }
      }
      function updateSpawns(dt) {
        if (S.mode === 'campo') {
          // cada ~14 s puede aparecer algo suelto, nunca más de 3 a la vez; sin faroles
          S.spawnAcc += dt / 14;
          if (S.spawnAcc >= 1) {
            S.spawnAcc = 0; let n = 0; for (const e of S.enemies) if (!e.dead && !e.prop) n++;
            if (n < 3) { const r = Math.random(), [x, y] = spawnPos(); spawnEnemy(r < .5 ? 'sombra' : r < .8 ? 'anima' : 'calavera', x, y); }
          }
          return;
        }
        const m = minute();
        const alive = S.enemies.length, minCount = Math.min(8 + m * 15 + m * m * .5, 380);
        S.spawnAcc += dt * (.7 + m * .38) * (alive < minCount ? 2.2 : 1) * (S.hyper ? 1.3 : 1);
        S.spawnAcc = Math.min(S.spawnAcc, 6);
        while (S.spawnAcc >= 1) {
          S.spawnAcc -= 1;
          if (S.enemies.length >= 420) break;
          const [x, y] = S.player.moving && Math.random() < .5 ? spawnAhead() : spawnPos();
          const WV = MAPS[bioKey(x, y)].waves; spawnEnemy(pickW(WV[Math.min(m, WV.length - 1)]), x, y);  // cada bioma aparece con su gente
        }
        S.propT -= dt;
        if (S.propT <= 0) {
          S.propT = 1.2; let n = 0; for (const e of S.enemies) if (e.prop) n++;
          if (n < 7) { const P = S.player, a = Math.random() * TAU, d = viewR() * rnd(1.05, 1.6); const f = spawnEnemy('farol', P.x + Math.cos(a) * d, P.y + Math.sin(a) * d, { hp: 1, maxHp: 1 }); pushOut(f, f.r + 8); }
        }
      }
      function runEvent(type) {
        const P = S.player, m = minute(), M = MAP();
        if (type === 'elite' || type === 'boss' || type === 'miniboss') {
          const boss = type === 'boss', mini = type === 'miniboss', kind = boss ? M.boss : mini ? M.mini : M.elites[m < 4 ? 0 : m < 7 ? 1 : 2], T = ETYPES[kind];
          const sc = boss ? M.bossScale : mini ? 2.4 : 1.9, hp = eliteHp(T.hp * hpMult() * (boss ? 13 : mini ? 9 : 10), boss ? BAL.floorBoss : mini ? BAL.floorMini : eliteFloor());
          const [x, y] = spawnPos();
          S.bossRef = spawnEnemy(kind, x, y, {
            elite: true, boss, mini, capT: boss ? BAL.capBoss : mini ? BAL.capMini : eliteCap(), scale: sc, r: T.r * sc, hp, maxHp: hp, xp: boss ? 60 : mini ? 35 : 20, chest: true,
            spd: T.spd * (boss ? 1.12 : mini ? 1.05 : 1.25), dmg: T.dmg * dmgMult() * (boss ? 2 : mini ? 1.7 : 1.3), bname: boss ? M.bossName : mini ? M.miniName : ''
          });
          banner(boss ? 'Llegó ' + M.bossName : mini ? 'Apareció ' + M.miniName : 'Un enemigo fuerte te encontró: cuida un cofre');
          sfx(110, .5, 'sawtooth', .06, .5);
        } else if (type === 'swarm') {
          const a = Math.random() * TAU, d = viewR() + 30, cxp = P.x - Math.cos(a) * d, cyp = P.y - Math.sin(a) * d, px = -Math.sin(a), py = Math.cos(a);
          const cnt = Math.min(18 + m * 2, 44);
          for (let i = 0; i < cnt; i++) {
            const o = (i - cnt / 2) * 14 + rnd(-6, 6), back = rnd(0, 90);
            spawnEnemy(M.swarm, cxp + px * o - Math.cos(a) * back, cyp + py * o - Math.sin(a) * back, { straight: true, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 18 });
          }
          banner(M.txt.swarm);
        } else if (type === 'ring') {
          const n = Math.min(26 + m * 2, 44), R = viewR() * .95;
          for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(M.ring, P.x + Math.cos(a) * R, P.y + Math.sin(a) * R, { spd: ETYPES[M.ring].spd * .8 }); }
          if (m >= 9) for (let i = 0; i < 24; i++) { const a = (i + .5) / 24 * TAU; spawnEnemy(M.ring2, P.x + Math.cos(a) * R * 1.35, P.y + Math.sin(a) * R * 1.35, { spd: ETYPES[M.ring2].spd * .9 }); }
          if (m >= 9) spawnEscort(m);
          banner(m >= 9 ? M.txt.ring2 : M.txt.ring);
        } else if (type === 'rush') {
          const a = Math.random() * TAU, d = viewR() + 40, cnt = Math.min(20 + m * 2, 48);
          for (let i = 0; i < cnt; i++) {
            const aa = a + rnd(-.5, .5), dd = d + rnd(0, 160);
            spawnEnemy(M.rush, P.x + Math.cos(aa) * dd, P.y + Math.sin(aa) * dd, { spd: ETYPES[M.rush].spd * 1.35 });
          }
          if (m >= 9) spawnEscort(m);
          banner(M.txt.rush);
          sfx(140, .4, 'sawtooth', .05, .6);
        } else if (type === 'arcana') {
          openArcana('Segunda carta', 'Pasó la medianoche: elegí otra carta para lo que queda.');
        } else if (type === 'win') {
          if (!S.endless) endGame(true);
        }
      }
      function updateCracks(dt) {
        const P = S.player;
        if (S.t >= S.crackNext) {
          S.crackNext = S.t + rnd(7, 11);
          const n = 3 + Math.min(3, minute() >> 2);
          for (let i = 0; i < n; i++) {
            let x, y;
            if (i === 0) { x = P.x + P.vx * .9; y = P.y + P.vy * .9; }            // una siempre donde vas a estar
            else { const a = Math.random() * TAU, d = rnd(70, 230); x = P.x + Math.cos(a) * d; y = P.y + Math.sin(a) * d; }
            S.cracks.push({ x, y, R: 48, t: -i * .12, T: 1.3, seed: Math.random() * 1000, boom: false });
          }
          sfx(1900, .35, 'sine', .02, .4);
        }
        for (const c of S.cracks) {
          c.t += dt;
          if (!c.boom && c.t >= c.T) {
            c.boom = true;
            forNear(c.x, c.y, c.R, e => { if (e.prop || e.type === 'mandinga') return; const rr = c.R + e.r * .5; if (dist2(e, c.x, c.y) < rr * rr) hurt(e, 25 + 10 * minute(), PWG, 8, c.x, c.y); });
            const dx = P.x - c.x, dy = P.y - c.y, rr = c.R + P.r * .6;
            if (dx * dx + dy * dy < rr * rr) hurtPlayer(12 * dmgMult());
            burst(c.x, c.y, 14, '#d6ecff', 170);
            S.shake = Math.min(1, S.shake + .12); sfx(300, .25, 'square', .03, .4);
          }
          if (c.t >= c.T + .45) c.dead = true;
        }
        compact(S.cracks);
      }
      function spawnEscort(m) {
        const M = MAP(), n = m >= 12 ? 3 : 2;
        for (let i = 0; i < n; i++) {
          const kind = M.elites[2], T = ETYPES[kind], [x, y] = spawnPos();
          spawnEnemy(kind, x, y, { elite: true, capT: eliteCap() * .7, scale: 1.6, r: T.r * 1.6, hp: 0, maxHp: 0, xp: 12, spd: T.spd * 1.1, dmg: T.dmg * dmgMult() * 1.4 });
          const e = S.enemies[S.enemies.length - 1]; e.hp = e.maxHp = eliteHp(T.hp * hpMult() * 3, eliteFloor() * .6);
        }
      }
      function spawnMandinga() {
        const [x, y] = spawnPos();
        spawnEnemy('mandinga', x, y, { boss: true, elite: true, hp: 1e7, maxHp: 1e7, xp: 0, spd: ETYPES.mandinga.spd });
        banner('El Mandinga salió a buscarte');
        sfx(70, .9, 'sawtooth', .08, .4);
      }

