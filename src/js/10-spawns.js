      /* ---------------- spawning ---------------- */
      function viewR() { return Math.hypot(W, H) / 2 / ZOOM; }
      function spawnPos() { const P = S.player, d = viewR() + 40, a = Math.random() * TAU; return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d]; }
      function spawnAhead() { const P = S.player, d = viewR() + 40, a = Math.atan2(P.fy, P.fx) + rnd(-1.1, 1.1); return [P.x + Math.cos(a) * d, P.y + Math.sin(a) * d]; }
      function pickW(o) { const wf = k => o[k] * (ETYPES[k].ranged ? .4 : 1); let t = 0; for (const k in o) t += wf(k); let r = Math.random() * t; for (const k in o) { r -= wf(k); if (r <= 0) return k; } return Object.keys(o)[0]; }
      function spawnEnemy(type, x, y, opt) {
        const T = ETYPES[type], m = S.t / 60, hm = hpMult();
        const e = freeE.pop() || {};
        const dk = S.mode === 'campo' ? 1 : BAL.dens;
        e.type = type; e.x = x; e.y = y; e.r = T.r; e.hp = e.maxHp = T.hp * hm / dk; e.spd = T.spd * rnd(.82, 1.18) * (S.hyper ? 1.25 : 1); e.dmg = T.dmg * dmgMult(); e.xp = S.mode === 'campo' ? 0 : T.xp / dk; e.lodP = (Math.random() * 2) | 0;
        e.dead = false; e.gone = false; e.dmgTxt = null; e.mini = false; e.capT = 0; e.cw = 0; e.cdmg = 0; e.howl = undefined; e.enr = false; e.flash = 0; e.kx = 0; e.ky = 0; e.imm = {}; e.slowT = 0; e.elite = false; e.boss = false; e.chest = false; e.fight = false; e.jph = null; e.z = 0;
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
        if (S.finale === 'done') return;  // ya cayó el Mandinga: solo falta la pantalla final
        const m = minute();
        // en la pelea final el protagonista es el Mandinga: pocos enemigos de relleno
        const alive = S.enemies.length, minCount = S.finale ? 40 : Math.min(8 + m * 15 + m * m * .5, 380) * BAL.dens;
        S.spawnAcc += dt * (.7 + m * .38) * BAL.dens * (alive < minCount ? 2.2 : 1) * (S.hyper ? 1.3 : 1) * (S.finale ? .3 : 1);
        S.spawnAcc = Math.min(S.spawnAcc, 6);
        while (S.spawnAcc >= 1) {
          S.spawnAcc -= 1;
          if (S.enemies.length >= (S.finale ? 120 : 420 * BAL.dens)) break;
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
          const cnt = Math.round(Math.min(18 + m * 2, 44) * BAL.dens);
          for (let i = 0; i < cnt; i++) {
            const o = (i - cnt / 2) * 14 + rnd(-6, 6), back = rnd(0, 90);
            spawnEnemy(M.swarm, cxp + px * o - Math.cos(a) * back, cyp + py * o - Math.sin(a) * back, { straight: true, vx: Math.cos(a) * 120, vy: Math.sin(a) * 120, life: 18 });
          }
          banner(M.txt.swarm);
        } else if (type === 'ring') {
          const n = Math.round(Math.min(26 + m * 2, 44) * BAL.dens), R = viewR() * .95, n2 = Math.round(24 * BAL.dens);
          for (let i = 0; i < n; i++) { const a = i / n * TAU; spawnEnemy(M.ring, P.x + Math.cos(a) * R, P.y + Math.sin(a) * R, { spd: ETYPES[M.ring].spd * .8 }); }
          if (m >= 9) for (let i = 0; i < n2; i++) { const a = (i + .5) / n2 * TAU; spawnEnemy(M.ring2, P.x + Math.cos(a) * R * 1.35, P.y + Math.sin(a) * R * 1.35, { spd: ETYPES[M.ring2].spd * .9 }); }
          if (m >= 9) spawnEscort(m);
          banner(m >= 9 ? M.txt.ring2 : M.txt.ring);
        } else if (type === 'rush') {
          const a = Math.random() * TAU, d = viewR() + 40, cnt = Math.round(Math.min(20 + m * 2, 48) * BAL.dens);
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
          if (!S.endless && !S.finale) startFinale();
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
            forNear(c.x, c.y, c.R, e => { if (e.prop || mHunter(e)) return; const rr = c.R + e.r * .5; if (dist2(e, c.x, c.y) < rr * rr) hurt(e, 25 + 10 * minute(), PWG, 8, c.x, c.y); });
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
      /* ---------------- el Mandinga: pelea final ----------------
         Al amanecer, en lugar de terminar, aparece el Mandinga y hay que matarlo. Camina más lento que el jugador y
         cada MF.cd segundos se agacha, salta hacia donde estaba el jugador y al caer mata a todo lo demás de la arena
         (sin drops ni animación de muerte) y lastima fuerte en el área de caída. Con la mitad de vida salta más seguido.
         Los Mandingas del modo infinito siguen siendo invencibles (mHunter).
         Vida: el daño a un solo objetivo cambia muchísimo entre builds (las auras pegan 7 veces menos que los
         proyectiles con el mismo dpsEMA), así que arranca con una estimación y a los MF.calT segundos se recalibra con
         el daño que de verdad le está entrando, para que la pelea dure ~MF.secs en cualquier build. La barra conserva
         el porcentaje, así que el ajuste no se nota. capT impide que dure menos de MF.cap segundos aunque el build sea muy fuerte. */
      const MF = { secs: 65, cap: 35, calT: 12, emaK: 7, cd: 10, cdEnr: 7, first: 5, wind: .5, air: 1.25, h: 150, R: 115, land: .45, touch: .3, spd: 118 };
      function mHunter(e) { return e.type === 'mandinga' && !e.fight; }
      function startFinale() {
        const P = S.player, [x, y] = spawnPos();
        S.finale = true;
        const floor = 25 * hpMult() * 13, hp = Math.max(floor, (S.dpsEMA || 0) * MF.emaK);
        S.bossRef = spawnEnemy('mandinga', x, y, {
          boss: true, elite: true, fight: true, hp, maxHp: hp, hpFloor: floor, rawIn: 0, calT: MF.calT, capT: MF.cap * (S.hyper ? 1.15 : 1), xp: 0, spd: MF.spd * (S.hyper ? 1.1 : 1),
          dmg: ST.maxHp * MF.touch * (S.hyper ? 1.2 : 1), bname: 'el Mandinga', jT: MF.first
        });
        banner('Antes del amanecer, el Mandinga viene por vos');
        sfx(70, .9, 'sawtooth', .08, .4); sfx(52, 1.4, 'sawtooth', .06, .3);
        S.shake = Math.min(1, S.shake + .6);
      }
      // saca a todos los enemigos sin drops, sin contar bajas y con lo mínimo de animación (un poco de ceniza en pantalla)
      function wipeArena(keep) {
        const P = S.player, hw = W / 2 / ZOOM + 20, hh = H / 2 / ZOOM + 20; let puffs = 0;
        for (const e of S.enemies) {
          if (e.dead || e.prop || e === keep) continue;
          e.dead = true; e.gone = true;
          if (puffs < 90 && S.parts.length < 560 * PART_K && Math.abs(e.x - P.x) < hw && Math.abs(e.y - P.y) < hh) {
            puffs++; S.parts.push({ x: e.x, y: e.y, vx: rnd(-20, 20), vy: rnd(-50, -20), life: .35, max: .35, col: '#3a2a2a', size: e.r * .5 });
          }
        }
        S.ebul.length = 0;
      }
      // salto del Mandinga; devuelve true mientras no camina (agachado o en el aire)
      function mandingaCalib(e, dt) {
        // solo cuenta el tiempo en que está cerca (al principio viene caminando desde fuera de la pantalla)
        if (e.calT <= 0 || dist2(e, S.player.x, S.player.y) > 300 * 300 || (e.calT -= dt) > 0) return;
        const obs = e.rawIn / MF.calT, f = e.hp / e.maxHp;
        e.maxHp = Math.max(e.hpFloor, obs * MF.secs * (S.hyper ? 1.15 : 1)); e.hp = e.maxHp * f;
      }
      function mandingaJump(e, dt) {
        const P = S.player;
        if (!e.jph) { e.jT -= dt; if (e.jT > 0) return false; e.jph = 'wind'; e.jk = MF.wind; sfx(90, .5, 'sawtooth', .05, .6); return true; }
        e.jk -= dt;
        if (e.jph === 'wind') {
          if (e.jk <= 0) { e.jph = 'air'; e.jk = MF.air; e.jx0 = e.x; e.jy0 = e.y; e.jtx = P.x; e.jty = P.y; sfx(140, .6, 'sawtooth', .04, 1.6); }
          return true;
        }
        const k = clamp(1 - e.jk / MF.air, 0, 1), ke = k * k * (3 - 2 * k);
        e.x = e.jx0 + (e.jtx - e.jx0) * ke; e.y = e.jy0 + (e.jty - e.jy0) * ke; e.z = Math.sin(k * Math.PI) * MF.h; e.mvx = e.jtx - e.jx0;
        if (e.jk <= 0) { e.z = 0; e.jph = null; e.jT = e.enr ? MF.cdEnr : MF.cd; mandingaLand(e); }
        return true;
      }
      function mandingaLand(e) {
        const P = S.player;
        wipeArena(e);
        S.shake = 1; S.hitstop = Math.max(S.hitstop, .08);
        S.fx.push({ type: 'ring', x: e.x, y: e.y, life: .5, max: .5, col: '#ff5a3c', R: MF.R });
        S.fx.push({ type: 'ring', x: e.x, y: e.y, life: .9, max: .9, col: 'rgba(255,90,60,.5)', R: viewR() * 1.1 });
        burst(e.x, e.y, 18, '#5a3a2a', 200);
        addMark(e.x, e.y, 0, 'scorch', 30, '#1a0d0d', MF.R * .7);
        sfx(55, .9, 'sawtooth', .09, .3); sfx(40, 1.2, 'square', .05, .4);
        const dx = P.x - e.x, dy = P.y - e.y, rr = MF.R + P.r * .6;
        if (dx * dx + dy * dy < rr * rr) hurtPlayer(ST.maxHp * MF.land * (S.hyper ? 1.2 : 1));
      }
      function mandingaDown(e) {
        const P = S.player;
        e.dead = true; S.finale = 'done'; S.bossK++; SAVE.stats.bosses++; SAVE.bestiary.mandinga = (SAVE.bestiary.mandinga || 0) + 1;
        wipeArena(e);
        P.iframe = 99;
        S.hitstop = .35; S.shake = 1; S.whiteFlash = .6;
        burst(e.x, e.y, 40, '#8a1424', 260); burst(e.x, e.y, 20, '#ffd23c', 200);
        for (let i = 0; i < 3; i++) S.fx.push({ type: 'ring', x: e.x, y: e.y, life: .6 + i * .3, max: .6 + i * .3, col: i ? '#ffd23c' : '#ff5a3c', R: 90 + i * 110 });
        S.fx.push({ type: 'death', x: e.x, y: e.y, etype: 'mandinga', scale: 1, frame: 0, tilt: 0, life: 1.2, max: 1.2, vx: 0, vy: -20, spin: 2, rot: 0 });
        banner('¡Le ganaste al Mandinga!');
        sfx(70, 1.5, 'sawtooth', .08, .25); setTimeout(() => sfx(523, .4, 'triangle', .05), 400); setTimeout(() => sfx(784, .6, 'triangle', .05), 650);
        later(2, () => { P.iframe = 0; S.dawnT = S.t; endGame(true); });
      }
      function spawnMandinga() {
        const [x, y] = spawnPos();
        spawnEnemy('mandinga', x, y, { boss: true, elite: true, hp: 1e7, maxHp: 1e7, xp: 0, spd: ETYPES.mandinga.spd });
        banner('El Mandinga salió a buscarte');
        sfx(70, .9, 'sawtooth', .08, .4);
      }

