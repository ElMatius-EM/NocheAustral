      /* ---------------- update ---------------- */
      const keys = new Set();
      let joy = null;
      function inputVec() {
        let x = 0, y = 0;
        if (keys.has('a') || keys.has('arrowleft')) x -= 1;
        if (keys.has('d') || keys.has('arrowright')) x += 1;
        if (keys.has('w') || keys.has('arrowup')) y -= 1;
        if (keys.has('s') || keys.has('arrowdown')) y += 1;
        if (joy) { const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy); if (d > 6) { const k = Math.min(1, d / 50) / d; x += dx * k; y += dy * k; } }
        const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; }
        return [x, y];
      }
      function dashCooldown() { return Math.max(.5, 2 * ST.cd * (S.arc.has('caballoBastos') ? .6 : 1) * (NI('b1') ? .85 : 1)); }
      function tryDash() {
        if (!S || S.state !== 'play') return;
        const P = S.player; if (P.dashCD > 0 || P.dashT > 0) return;
        let [ix, iy] = inputVec(), l = Math.hypot(ix, iy);
        if (l < .05) { ix = P.fx; iy = P.fy; l = Math.hypot(ix, iy) || 1; }
        ix /= l; iy /= l; P.fx = ix; P.fy = iy; if (Math.abs(ix) > .1) P.face = ix > 0 ? 1 : -1;
        const sp = 780; P.dvx = ix * sp; P.dvy = iy * sp; P.dashT = .16; P.dashCD = dashCooldown();
        P.iframe = Math.max(P.iframe, .3);
        if (NI('b4a')) S.waves.push({ x: P.x, y: P.y, r: 6, R: 95, spd: 380, dmg: 10 + 5 * S.t / 60, w: { id: 'polvareda', evo: false }, hit: new Set(), evo: false });
        S.shake = Math.min(1, S.shake + .12);
        burst(P.x, P.y + 10, 8, '#c9b894', 120);
        sfx(520, .12, 'sawtooth', .03, .35);
      }
      // jefes que embisten y llaman a su manada: [comunes, grandes] y el cartel al enfurecerse
      const BOSS_PACK = { lobizon: { pack: ['sombra', 'lobizon'], enr: 'El Lobizón Mayor se enfurece' }, cuchivilu: { pack: ['chancho', 'jabali'], enr: 'El Cuchivilu se enfurece y llama a la piara' } };
      // el Paisano Viejo ve venir las hordas unos segundos antes
      const AVISOS = { swarm: 'Algo viene volando del lado del monte', rush: 'Tiembla la tierra: se viene una estampida', ring: 'Te están cerrando el cerco', boss: 'Huele a jefe: se viene algo grande' };
      function update(dt) {
        S.t += dt;
        updateBiome(dt);
        if (S.comida && !S.comida.done && S.t >= S.comida.until) { S.comida.done = true; recompute(); S.player.hp = Math.min(S.player.hp, ST.maxHp); banner(FOGON_REC[S.comida.id].end); }
        const P = S.player;
        S.pWet = terrWet(P.x, P.y);
        let [ix, iy] = inputVec(); const l = Math.hypot(ix, iy);
        if (CHARS[S.char].drunk && l > .05 && !S.ride) { const a = Math.sin(S.t * 1.3) * .38 + Math.sin(S.t * 3.7) * .14, c = Math.cos(a), s = Math.sin(a); [ix, iy] = [ix * c - iy * s, ix * s + iy * c]; }
        P.moving = l > .05;
        P.dashCD -= dt;
        if (P.dashT > 0) {
          P.dashT -= dt; P.x += P.dvx * dt; P.y += P.dvy * dt; P.moving = true;
          if (!S.ride) S.ghosts.push({ x: P.x, y: P.y, face: P.face, life: .22 });
          if (S.arc.has('caballoBastos')) { S.trailT -= dt; if (S.trailT <= 0) { S.trailT = .035; S.zones.push({ x: P.x, y: P.y, R: 24, life: 2.2, max: 2.2, tick: 0, dmg: 8 + 3 * S.t / 60, w: PWF, fire: true }); } }
        } else {
          if (P.moving) { P.fx = ix / l; P.fy = iy / l; if (Math.abs(ix) > .1) P.face = ix > 0 ? 1 : -1; }
          const RM = S.ride && MOUNTS[S.ride.kind], spd = (RM ? ST.speed * RM.spd * (S.ride.spdK || 1) : ST.speed) * (S.pWet ? (RM ? .82 : (MAP().ice ? .78 : .72)) : 1) * (S.weather && S.weather.type === 'lluvia' ? 1 - .12 * (S.weather.k || 0) : 1);
          const k = Math.min(1, (RM ? RM.acc * (MAP().ice ? .45 : 1) * (S.ride.buck ? .35 : 1) : MAP().ice ? 3.2 : 30) * dt);
          P.vx += (ix * spd - P.vx) * k; P.vy += (iy * spd - P.vy) * k;
          P.x += P.vx * dt; P.y += P.vy * dt;
          if (Math.hypot(P.vx, P.vy) > 25) P.moving = true;
        }
        if (pushOut(P, P.r * .85)) { P.vx *= .6; P.vy *= .6; }
        P.iframe -= dt; P.touchIF -= dt; if (P.atkT > 0) P.atkT -= dt;
        for (const g of S.ghosts) { g.life -= dt; if (g.life <= 0) g.dead = true; }
        compact(S.ghosts);
        S.comboT -= dt; if (S.comboT <= 0 && S.combo > 0) { S.combo = 0; S.nextMilestone = 50; }
        if (S.freezeT > 0) S.freezeT -= dt; if (S.whiteFlash > 0) S.whiteFlash -= dt;
        S.achT -= dt; if (S.achT <= 0) { S.achT = 1; if (S.mode !== 'campo') checkAch(); }
        if (ST.regen > 0) P.hp = Math.min(ST.maxHp, P.hp + ST.regen * dt);
        S.healBudget = Math.min(BAL.healCap, (S.healBudget || 0) + BAL.healCap * dt);
        worldUpdate(dt);
        S.dpsEMA = (S.dpsEMA || 0) + ((S.dmgFrame || 0) / dt - (S.dpsEMA || 0)) * Math.min(1, dt / 20); S.dmgFrame = 0;

        const tm = S.timers;
        for (let i = tm.length - 1; i >= 0; i--) { const t = tm[i]; t.t -= dt; if (t.t <= 0) { tm[i] = tm[tm.length - 1]; tm.pop(); t.fn(); } }
        if (S.state !== 'play') return;

        if (CHARS[S.char].aviso) for (const ev of S.events) if (!ev.done && !ev.warned && AVISOS[ev.type] && S.t >= ev.t - 5) { ev.warned = true; banner(AVISOS[ev.type]); sfx(330, .2, 'triangle', .03); }
        for (const ev of S.events) if (!ev.done && S.t >= ev.t) {
          if ((ev.type === 'elite' || ev.type === 'boss' || ev.type === 'miniboss') && (ev.wait || 0) < 150 && S.bossRef && !S.bossRef.dead && S.bossRef.elite && S.bossRef.type !== 'mandinga') { ev.t = S.t + 10; ev.wait = (ev.wait || 0) + 10; continue; }
          ev.done = true; runEvent(ev.type); if (S.state !== 'play') return;
        }
        if (S.endless && S.t >= S.nextMandinga) { spawnMandinga(); S.nextMandinga = S.t + 60; }
        if (S.endless) {
          S.endAcc += dt;
          if (S.endAcc >= 60) {
            S.endAcc -= 60; S.endMins = (S.endMins || 0) + 1; const g = Math.round(80 * S.endMins * ST.greed); S.gold += g;
            banner('Otro minuto escapando del Mandinga: +' + g + ' de oro'); sfx(1320, .08, 'square', .03);
          }
        }
        updateSpawns(dt);
        updateWeather(dt);
        buildGrid();
        if (MAP().ice) updateCracks(dt);

        // en el campo las armas descansan si no hay nada cerca
        if (S.mode === 'campo') { const ne = nearest(P.x, P.y); S.armed = !!(ne && dist2(ne, P.x, P.y) < 360 * 360); }
        if (!S.ride && S.mode !== 'campo') for (const w of S.weapons) {  // en el campo se trabaja con herramientas (31-campo-kit)
          const d = WEAPONS[w.id];
          if (d.update) d.update(w, dt);
          else { w.cd -= dt; if (w.cd <= 0) { const s = st(w); w.cd = s.cd * ST.cd; d.fire(w, s); } }
        }

        updateMounts(dt);
        if (S.mode === 'campo') { updateCampo(dt); if (!S || S.state !== 'play') return; updateKit(dt); }

        for (const p of S.proj) {
          if (p.dead) continue;
          p.life -= dt; if (p.life <= 0) { p.dead = true; continue; }
          if (p.kind === 'cross') { p.vx += p.ax * dt; p.vy += p.ay * dt; p.rot += dt * 14; if (S.parts.length < 520 * PART_K && Math.random() < dt * 14) S.parts.push({ x: p.x + rnd(-4, 4), y: p.y + rnd(-4, 4), vx: rnd(-15, 15), vy: rnd(-15, 15), life: rnd(.25, .45), max: .45, col: p.w.evo ? '#cfe6ff' : '#ffe9a8', size: rnd(1.5, 2.8), glow: true }); }
          else if (p.g) { p.vy += p.g * dt; p.rot = Math.atan2(p.vy, p.vx); }
          p.x += p.vx * dt; p.y += p.vy * dt;
          forNear(p.x, p.y, p.r, e => {
            const rr = p.r + e.r; if (dist2(e, p.x, p.y) > rr * rr) return;
            if (p.rep) { const lt = p.hitT.get(e); if (lt !== undefined && S.t - lt < p.rep) return; p.hitT.set(e, S.t); }
            else { if (p.hit.has(e)) return; p.hit.add(e); }
            hurt(e, p.dmg, p.w, p.kb || (p.kind === 'knife' ? 3 : 6), p.x - p.vx, p.y - p.vy);
            if (--p.pierce <= 0) {
              if (!p.bounced && S.arc.has('anchoEspadas') && (p.kind === 'knife' || p.kind === 'pellet' || p.kind === 'spear')) {
                let best = null, bd = 260 * 260;
                forNear(p.x, p.y, 260, o => { if (o === e || o.prop || (p.hit && p.hit.has(o))) return; const dd = dist2(o, p.x, p.y); if (dd < bd) { bd = dd; best = o; } });
                if (best) { const a = Math.atan2(best.y - p.y, best.x - p.x), v = Math.max(380, Math.hypot(p.vx, p.vy)); p.vx = Math.cos(a) * v; p.vy = Math.sin(a) * v; p.g = 0; p.rot = a; p.pierce = 1; p.bounced = true; p.life = Math.max(p.life, .6); return false; }
              }
              p.dead = true; return false;
            }
          });
        }
        compact(S.proj);

        for (const t of S.throws) {
          t.t += dt;
          if (t.t >= t.T) {
            t.dead = true; const s = t.s;
            S.zones.push({ x: t.x, y: t.y, R: s.R * ST.area, life: s.dur * ST.dur, max: s.dur * ST.dur, tick: 0, dmg: s.dmg, w: t.w, pull: s.pull });
            burst(t.x, t.y, 10, t.w.evo ? '#b98aff' : '#bfe3ff', 140); sfx(240, .2, 'sine', .04, .5);
          }
        }
        compact(S.throws);
        for (const z of S.zones) {
          z.life -= dt; if (z.life <= 0) { z.dead = true; continue; }
          z.tick -= dt;
          if (z.pull) forNear(z.x, z.y, z.R * 1.5, e => { if (e.prop || e.boss) return; const dx = z.x - e.x, dy = z.y - e.y, d = Math.hypot(dx, dy) || 1; if (d < z.R * 1.5 && d > 4) { const f = 95 / ETYPES[e.type].w * dt; e.x += dx / d * f; e.y += dy / d * f; } });
          if (z.tick <= 0) { z.tick = .35; forNear(z.x, z.y, z.R, e => { const rr = z.R + e.r * .5; if (dist2(e, z.x, z.y) < rr * rr) hurt(e, z.dmg, z.w, 0); }); }
        }
        compact(S.zones);
        for (const wv of S.waves) {
          wv.r += wv.spd * dt; if (wv.r >= wv.R) { wv.dead = true; continue; }
          if (S.ebul.length) clearBullets(b => { const d = Math.hypot(b.x - wv.x, b.y - wv.y); return Math.abs(d - wv.r) < 14 + b.r; });
          forNear(wv.x, wv.y, wv.r + 20, e => { if (wv.hit.has(e)) return; const d = Math.sqrt(dist2(e, wv.x, wv.y)); if (Math.abs(d - wv.r) < 12 + e.r) { wv.hit.add(e); hurt(e, wv.dmg, wv.w, wv.evo ? 14 : 10, wv.x, wv.y); } });
        }
        compact(S.waves);

        const far = (viewR() + 40) * 1.3, bastos = S.arc.has('anchoBastos'), hwS = W / 2 / ZOOM, hhS = H / 2 / ZOOM;
        let aimCount = 0, aimNew = 0; S.aimN = S.aimN || 0; S.shotCD = (S.shotCD || 0) - dt;
        // los comunes fuera de pantalla se actualizan cada dos frames (con el doble de dt) y sin separación entre ellos:
        // son más de la mitad de la horda y nadie los ve, así que la lógica casi se reduce a la mitad sin cambiar nada visible
        const lodF = S.lodF = ((S.lodF || 0) + 1) & 1, offX = hwS + 90, offY = hhS + 90, dt1 = dt;
        for (const e of S.enemies) {
          if (e.dead) continue;
          const off = !e.elite && !e.prop && (Math.abs(e.x - P.x) > offX || Math.abs(e.y - P.y) > offY);
          if (off && e.lodP !== lodF) continue;
          const dt = off ? dt1 * 2 : dt1;
          if (e.prop) { e.flash -= dt; if (Math.abs(e.x - P.x) + Math.abs(e.y - P.y) > far * 2.2) { e.dead = true; e.gone = true; } continue; }
          if (S.freezeT > 0 && e.type !== 'mandinga') { e.flash -= dt; e.x += e.kx * dt; e.y += e.ky * dt; e.kx *= .9; e.ky *= .9; continue; }
          e.flash -= dt; e.slowT -= dt;
          const sl = e.slowT > 0 ? .5 : 1;
          if (e.straight) {
            const stg = clamp(1 - Math.hypot(e.kx, e.ky) / 220, 0, 1); e.x += e.vx * dt * sl * stg; e.y += e.vy * dt * sl * stg; e.life -= dt; e.mvx = e.vx;
            if (e.life <= 0) { e.dead = true; e.gone = true; continue; }
          } else {
            let dx = P.x - e.x, dy = P.y - e.y; const d = Math.hypot(dx, dy) || 1; dx /= d; dy /= d;
            if (d > far && e.type !== 'mandinga') { const [x, y] = spawnAhead(); e.x = x; e.y = y; continue; }
            if (!e.elite) {
              const fo = clamp((d - 70) / 360, 0, 1);
              if (fo > 0) { const tx = P.x + Math.cos(e.oa) * e.orad * fo - e.x, ty = P.y + Math.sin(e.oa) * e.orad * fo - e.y, td = Math.hypot(tx, ty) || 1; dx = tx / td; dy = ty / td; }
            }
            let sp = e.spd * sl * clamp(1 - Math.hypot(e.kx, e.ky) / 220, 0, 1);
            if (e.fight) {
              if (!e.enr && e.hp < e.maxHp * .5) { e.enr = true; e.spd *= 1.15; banner('El Mandinga se enfurece'); sfx(60, 1, 'sawtooth', .08, .35); S.shake = Math.min(1, S.shake + .5); }
              mandingaCalib(e, dt);
              if (mandingaJump(e, dt)) sp = 0;
            }
            if (!ETYPES[e.type].fly && !e.boss && e.type !== 'mandinga') {
              e._wtT -= dt; if (e._wtT <= 0) { e._wtT = .18 + Math.random() * .1; e._wet = terrWet(e.x, e.y); }
              if (e._wet) { sp *= .75; if (ETYPES[e.type].w >= 1.3 && Math.abs(e.x - P.x) < hwS && Math.abs(e.y - P.y) < hhS) { e._md += sp * dt; if (e._md > 24) { e._md = 0; addMark(e.x, e.y + e.r * .8, Math.atan2(dy, dx), 'paw', 10); } } }
            }
            // embestida de las élites cuerpo a cuerpo: se frenan, marcan la línea y cargan
            if (e.elite && !e.boss && !e.mini && !ETYPES[e.type].ranged && e.type !== 'mandinga') {
              e.ch = (e.ch === undefined ? rnd(1.5, 3) : e.ch) - dt; e.dashLen = 430 * .45 + e.r;
              if (e.phase === 'aim') { sp = 0; if (e.ch <= 0) { e.phase = 'dash'; e.ch = .45; sfx(110, .25, 'sawtooth', .05, .5); } }
              else if (e.phase === 'dash') { sp = 0; e.x += e.cdx * 430 * dt; e.y += e.cdy * 430 * dt; e.mvx = e.cdx * 430; if (e.ch <= 0) { e.phase = null; e.ch = rnd(3.5, 5.5); } }
              else if (e.ch <= 0 && d < 330) { e.phase = 'aim'; e.ch = .75; e.cdx = dx; e.cdy = dy; sfx(240, .4, 'square', .025, .5); }
            }
            // embestida propia (jabalí, puma): igual que la de las élites pero con sus tiempos
            const CHG = ETYPES[e.type].charge;
            if (CHG && (!e.elite || e.mini)) {
              const [rng, aim, cs, cdur, c0, c1] = CHG; e.ch = (e.ch === undefined ? rnd(c0 * .5, c1) : e.ch) - dt; e.dashLen = cs * cdur + e.r;
              if (e.phase === 'aim') { sp = 0; if (e.ch <= 0) { e.phase = 'dash'; e.ch = cdur; if (Math.abs(e.x - P.x) < hwS && Math.abs(e.y - P.y) < hhS) sfx(e.type === 'puma' ? 520 : 130, .18, 'sawtooth', .025, .5); } }
              else if (e.phase === 'dash') { sp = 0; e.x += e.cdx * cs * dt; e.y += e.cdy * cs * dt; e.mvx = e.cdx * cs; if (e.ch <= 0) { e.phase = null; e.ch = rnd(c0, c1); } }
              else if (e.ch <= 0 && d < rng) { e.phase = 'aim'; e.ch = aim; e.cdx = dx; e.cdy = dy; }
            }
            const PACK = BOSS_PACK[e.type];
            if (e.boss && PACK) {
              e.ch = (e.ch === undefined ? 3 : e.ch) - dt; e.dashLen = 560 * .55 + e.r;
              if (e.phase === 'aim') { sp = 0; if (e.ch <= 0) { e.phase = 'dash'; e.ch = .55; sfx(90, .3, 'sawtooth', .06, .5); S.shake = Math.min(1, S.shake + .3); } }
              else if (e.phase === 'dash') { const ds = e.enr ? 660 : 560; sp = 0; e.x += e.cdx * ds * dt; e.y += e.cdy * ds * dt; e.mvx = e.cdx * ds; if (e.ch <= 0) { e.phase = null; e.ch = e.enr ? rnd(2, 3) : rnd(3.5, 5); } }
              else if (e.ch <= 0 && d < 460) { e.phase = 'aim'; e.ch = e.enr ? .6 : .85; e.cdx = dx; e.cdy = dy; sfx(200, .5, 'square', .03, .5); }
              // aullido: invoca manada alrededor
              e.howl = (e.howl === undefined ? 7 : e.howl) - dt;
              if (!e.phase && e.howl <= 0) {
                e.howl = e.enr ? rnd(6, 8) : rnd(9, 12);
                const nS = 6, nL = e.enr ? 3 : 1;
                for (let i = 0; i < nS + nL; i++) { const a = i / (nS + nL) * TAU, R_ = e.r + 40, tp = PACK.pack[i < nS ? 0 : 1]; spawnEnemy(tp, e.x + Math.cos(a) * R_, e.y + Math.sin(a) * R_, { spd: ETYPES[tp].spd * 1.15 }); }
                S.fx.push({ type: 'ring', x: e.x, y: e.y, life: .7, max: .7, col: 'rgba(255,90,60,.8)', R: e.r + 90 });
                S.shake = Math.min(1, S.shake + .4); sfx(110, .9, 'sawtooth', .06, .4); sfx(165, .8, 'sawtooth', .03, .5);
              }
              if (!e.enr && e.hp < e.maxHp * .5) { e.enr = true; banner(PACK.enr); sfx(80, .8, 'sawtooth', .07, .4); }
            }
            if (e.boss && e.type === 'caleuche') {
              e.summon -= dt;
              if (e.summon <= 0) { e.summon = 6.5; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; spawnEnemy('anima', e.x + Math.cos(a) * e.r * 1.3, e.y + Math.sin(a) * e.r * 1.3); } sfx(330, .4, 'sine', .04, .6); }
            }
            if (!e.elite && !ETYPES[e.type].erratic) { const wv = Math.sin(S.t * 1.7 + e.wob) * .32, nx = dx - dy * wv, ny = dy + dx * wv, n = Math.hypot(nx, ny) || 1; dx = nx / n; dy = ny / n; }
            if (ETYPES[e.type].erratic) { const wv = Math.sin(S.t * 4 + e.wob) * .7, nx = dx - dy * wv, ny = dy + dx * wv, n = Math.hypot(nx, ny) || 1; dx = nx / n; dy = ny / n; }
            if (ETYPES[e.type].ranged) {
              if (e.aimT > 0) {
                sp = 0; e.aimT -= dt; aimCount++;
                if (e.aimT <= 0) {
                  const a0 = Math.atan2(P.y - e.y, P.x - e.x), bs = 125, nb = e.mini ? 5 : e.elite ? 3 : 1;
                  for (let q = 0; q < nb; q++) {
                    const a = a0 + (q - (nb - 1) / 2) * .22;
                    S.ebul.push({ x: e.x, y: e.y, vx: Math.cos(a) * bs, vy: Math.sin(a) * bs, life: 5, dmg: 8 * dmgMult() * (e.elite ? 1.6 : 1), r: e.elite ? 9 : 6.5, col: ETYPES[e.type].shotCol, glow: e.elite ? HARD_GLOW : ETYPES[e.type].shotGlow, hard: e.elite });
                  }
                  e.shoot = e.mini ? rnd(2, 2.8) : rnd(3.5, 5); sfx(520, .08, 'triangle', .02, .6);
                }
              } else {
                if (d < 230) sp = 0;
                e.shoot -= dt;
                if (e.shoot <= 0) {
                  const onScr = Math.abs(e.x - P.x) < hwS - 10 && Math.abs(e.y - P.y) < hhS - 10;
                  if (onScr && S.aimN + aimNew < 4 && S.shotCD <= 0) { e.aimT = .55; aimNew++; S.shotCD = .3; }
                  else e.shoot = rnd(.4, .9);
                }
              }
            }
            if (ETYPES[e.type].volley) {
              e.shoot -= dt;
              if (e.shoot <= 0 && d < 520) {
                e.shoot = 3.2; const n = 12, o = Math.random();
                for (let i = 0; i < n; i++) { const a = (i + o) / n * TAU; S.ebul.push({ x: e.x, y: e.y, vx: Math.cos(a) * 110, vy: Math.sin(a) * 110, life: 6, dmg: 10 * dmgMult(), r: 7.5, col: '#bff0ff', glow: e.boss ? HARD_GLOW : 'rgba(120,220,255,.35)', hard: e.boss }); }
                sfx(180, .4, 'sine', .05, .5);
              }
            }
            e.x += dx * sp * dt; e.y += dy * sp * dt; e.mvx = dx * sp;
          }
          e.x += e.kx * dt; e.y += e.ky * dt;
          const k = Math.max(0, 1 - dt * 7); e.kx *= k; e.ky *= k;
          if (!e.boss && !off) {
            let c = 0;
            forNear(e.x, e.y, e.r * 2, o => {
              if (o === e) return;
              const ox = e.x - o.x, oy = e.y - o.y, rr = e.r + o.r, d2 = ox * ox + oy * oy;
              if (d2 < rr * rr && d2 > .01) {
                const d = Math.sqrt(d2), push = (rr - d) * .5; e.x += ox / d * push; e.y += oy / d * push;
                if (bastos && !o.prop && e.kx * e.kx + e.ky * e.ky > 150 * 150 && canHit(o, 'bas', .4)) hurt(o, 6 + 3 * S.t / 60, PWB, 4, e.x, e.y);
              }
              if (++c > 9) return false;
            }, e.r * 2);
          }
          if (!ETYPES[e.type].fly && e.type !== 'mandinga') pushOut(e, e.r * .9, 90 * dt);
          const cdx = P.x - e.x, cdy = P.y - e.y, rr = e.r + P.r * .8;
          if (e.z > 0 || e.jph) { /* el Mandinga agachado o en el aire no pega por contacto */ }
          else if (mHunter(e)) { if (cdx * cdx + cdy * cdy < rr * rr && P.iframe <= 0) { P.hp -= ST.maxHp * 1.5; S.hurtFlash = .4; S.shake = 1; } }
          else if (cdx * cdx + cdy * cdy < rr * rr && P.iframe <= 0 && P.touchIF <= 0 && canHit(e, 'touch', CONTACT_CD)) hurtPlayer(e.dmg * (e.phase === 'dash' ? 1.6 : 1), true);
        }
        S.aimN = aimCount + aimNew;
        let j = 0; const E = S.enemies;
        for (let i = 0; i < E.length; i++) { const e = E[i]; if (!e.dead) E[j++] = e; else freeE.push(e); }
        E.length = j;

        for (const b of S.ebul) {
          if (b.dead) continue;
          b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
          if (b.life <= 0) { b.dead = true; continue; }
          const dx = P.x - b.x, dy = P.y - b.y, rr = P.r + b.r;
          if (dx * dx + dy * dy < rr * rr) { b.dead = true; hurtPlayer(b.dmg); }
        }
        compact(S.ebul);

        const mag = ST.magnet;
        for (const g of S.gems) {
          if (g.dead) continue;
          const dx = P.x - g.x, dy = P.y - g.y, d = Math.hypot(dx, dy) || 1;
          if (d < P.r + 8) { g.dead = true; gainXP(g.v); const now = performance.now(); if (now - lastGemSfx > 45) { lastGemSfx = now; sfx(1200 + Math.random() * 300, .04, 'sine', .02); } continue; }
          if (g.vac || d < mag) { const sp = g.vac ? 620 : Math.max(260, 480 * (1 - d / mag) + 200); g.x += dx / d * sp * dt; g.y += dy / d * sp * dt; }
        }
        compact(S.gems);

        for (const pk of S.picks) {
          if (pk.dead) continue;
          pk.t += dt;
          const dx = P.x - pk.x, dy = P.y - pk.y, d = Math.hypot(dx, dy) || 1;
          if (d < mag * .6 && pk.type !== 'cofre') { pk.x += dx / d * 300 * dt; pk.y += dy / d * 300 * dt; }
          if (d < P.r + 16) {
            pk.dead = true;
            if (pk.type === 'asado') { const cc = S.arc.has('cuatroCopas'); if (cc) { S.bonusHp += 5; recompute(); } const hv = (cc ? 60 : 30) * (NI('h2') ? 1.5 : 1) * (CHARS[S.char].asado || 1); P.hp = Math.min(ST.maxHp, P.hp + hv); addText(P.x, P.y - 28, '+' + hv, '#8fe07a'); sfx(440, .15, 'triangle', .05, 1.5); }
            else if (pk.type === 'iman') { for (const g of S.gems) g.vac = true; sfx(300, .4, 'sine', .05, 3); }
            else if (pk.type === 'cofre') { S.pendingChests++; }
            else if (pk.type === 'oro' || pk.type === 'bolsa') { S.gold += pk.v; if (S.arc.has('sieteOros')) gainXP(pk.v * 2); addText(P.x, P.y - 30, '+' + pk.v, '#e0b75a'); sfx(1320, .05, 'square', .025); setTimeout(() => sfx(1760, .07, 'square', .025), 50); }
            else if (pk.type === 'mat') { S.mat[pk.m] += pk.v; addText(P.x, P.y - 30, '+' + pk.v + ' ' + MATS[pk.m].name, MATS[pk.m].col); sfx(700, .06, 'triangle', .03, 1.4); }
            else if (pk.type === 'bomba') { ashBomb(); }
            else if (pk.type === 'helada') { S.freezeT = 6; banner('Helada: los enemigos quedan congelados'); sfx(1800, .5, 'sine', .04, .3); }
          }
        }
        compact(S.picks);

        for (const p of S.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= .92; p.vy *= .92; if (p.life <= 0) p.dead = true; }
        compact(S.parts);
        for (const t of S.texts) {
          t.life -= dt; if (t.pop > 0) t.pop -= dt;
          if (t.e && !t.e.dead && t.e.dmgTxt === t && S.t - t.last < AGG_GAP_AURA) { t.x = t.e.x; t.y = t.e.y - t.e.r - 4; }
          else { t.e = null; t.y -= 38 * dt; }
          if (t.life <= 0) t.dead = true;
        }
        compact(S.texts);
        for (const f of S.fx) { f.life -= dt; if (f.life <= 0) f.dead = true; else if (f.type === 'death') { f.x += f.vx * dt; f.y += f.vy * dt; const d = Math.max(0, 1 - dt * 5); f.vx *= d; f.vy *= d; f.rot += f.spin * dt; } }
        compact(S.fx);

        S.shake = Math.max(0, S.shake - dt * 3); S.hurtFlash -= dt;

        if (P.hp <= 0 && DEV && DEV.god) P.hp = ST.maxHp;  // ?dev: ni el contacto del Mandinga cazador mata
        if (P.hp <= 0) {
          if (S.revives > 0) {
            S.revives--; P.hp = ST.maxHp * .5; P.iframe = 2.5;
            const pw = { id: 'revive', evo: false };
            forNear(P.x, P.y, 260, e => { if (!e.prop && !mHunter(e) && dist2(e, P.x, P.y) < 260 * 260) hurt(e, 200 + 40 * minute(), pw, 18); });
            S.whiteFlash = .4; S.fx.push({ type: 'ring', x: P.x, y: P.y, life: .7, max: .7, col: '#ffd98a', R: 260 });
            banner('¡Segunda vida!'); sfx(523, .3, 'triangle', .06, 2);
          } else { P.hp = 0; if (S.mode === 'campo') { endCampo('desmayo'); return; } endGame(false); return; }
        }
        if (S.pendingChests > 0) { S.pendingChests--; openChest(); }
        else if (S.pendingLevels > 0) openLevelUp();
      }
      function compact(a) { let j = 0; for (let i = 0; i < a.length; i++) if (!a[i].dead) a[j++] = a[i]; a.length = j; }

