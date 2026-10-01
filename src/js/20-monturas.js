      /* ---------------- animales montables: caballo y guanaco ----------------
         En algunas zonas del mapa (potreros y aguadas) hay animales sueltos. Si te acercás, huyen a los piques:
         corren un rato, aflojan y cambian de rumbo. Mientras estés a menos de TAME_R se llena la barra de amanse;
         si te alejás baja, y si te pegan pierde un cuarto. Llena, lo montás.
         Montado: más velocidad, las armas quedan en pausa y atacás con el rebenque de lado a lado y atropellando.
         El daño montado escala con el tiempo (hpMult) o con tu DPS real al montar, lo que sea mayor,
         y hereda tus pasivos (daño, área y recarga). Los golpes van a la vida del animal; si se queda sin vida
         o se termina el tiempo, corcovea y te tira. */
      const MOUNTS = {
        caballo: {
          name: 'caballo', dur: 20, spd: 1.9, acc: 5.5, tame: 2.8, sprint: 1.04, trot: .6, run: [1.4, 2.2], rest: [.8, 1.2], turn: [.8, 1.4], jink: .8, steer: 3.2,
          hpK: .9, trample: 18, kb: 16, heavy: 3, r: 18, seat: -15, seatX: -4
        },
        guanaco: {
          name: 'guanaco', dur: 15, spd: 1.65, acc: 15, tame: 2.2, sprint: 1.0, trot: .64, run: [.9, 1.5], rest: [.6, .9], turn: [.35, .75], jink: 1.25, steer: 7,
          hpK: .6, trample: 12, kb: 9, heavy: 2, r: 15, seat: -13, seatX: -7, spit: 3.2
        }
      };
      const PJ = { id: 'jinete', evo: false };
      const TAME_R = 95, HERD_CELL = 1250, BUCK_T = 3.2, RIDE_CD = 60;  // descanso entre montas en la noche

      /* sprites laterales, mirando a la derecha, en unidades de mundo (el suelo queda en y=24).
         Cada pata es [ángulo del muslo, ángulo de la caña] respecto de la vertical (positivo = hacia adelante). */
      const LEG_POSE = { idle: [[0, 0], [0, 0]], rear: [[1.25, -.55], [.62, .55]], kick: [[-.45, -.4], [-1.35, -1.55]], salto: [[.75, -.85], [-.7, .75]] };
      function legA(pose, ph, off, front) {
        if (pose === 'run') { const p = ph + off, a = Math.sin(p) * .6; return [a, a - Math.max(0, -Math.cos(p)) * .9]; }
        return LEG_POSE[pose][front ? 0 : 1];
      }
      function aLeg(b, hip, L, len, col, hoof, w, sock) {
        const [a, a2] = L, k = [hip[0] + Math.sin(a) * len * .5, hip[1] + Math.cos(a) * len * .5], h = [k[0] + Math.sin(a2) * len * .5, k[1] + Math.cos(a2) * len * .5];
        b.line([hip, k, h], w, col, 0, 1, w * .72);
        if (sock) b.line([[k[0] + (h[0] - k[0]) * .45, k[1] + (h[1] - k[1]) * .45], h], w * .78, sock);
        b.ell(h[0] + Math.sin(a2) * .8, h[1] + Math.cos(a2) * .8, w * .55, 1.3, hoof);
      }
      function horseDraw(b, pose, ph, saddle, pel) {
        // caballo criollo de perfil. Proporciones: alzada ≈ largo del cuerpo, alto del cuerpo ≈ largo de la pata
        const PL = PELAJES[pel] || PELAJES.zaino, body = PL.body, far = dk(body, .32), mane = PL.mane, hoof = '#16100c', sock = '#ece4cc', L = (o, f) => legA(pose, ph, o, f);
        // pata afinada con articulación: codo/babilla -> rodilla/garrón -> casco
        const leg = (hip, A, l1, l2, w1, wk, w2, col, sk, hind) => {
          const a1 = A[0] + (hind ? -.34 : 0), a2 = A[1] + (hind ? .02 : 0);
          const k = [hip[0] + Math.sin(a1) * l1, hip[1] + Math.cos(a1) * l1], f = [k[0] + Math.sin(a2) * l2, k[1] + Math.cos(a2) * l2];
          b.line([hip, k], w1, col, 0, 1, wk); b.line([k, f], wk * .85, col, 0, 1, w2);
          if (sk) b.line([[k[0] + (f[0] - k[0]) * .5, k[1] + (f[1] - k[1]) * .5], f], w2 + .2, sk);
          b.ell(f[0] + Math.sin(a2) * .4, f[1] + Math.cos(a2) * .9, w2 * .62, 1.1, hoof);
        };
        leg([-12, 4.2], L(Math.PI, 0), 9.6, 10, 4.2, 2.6, 2.1, far, null, true);
        leg([10.8, 4.2], L(Math.PI * 1.5, 1), 10, 9.2, 3.8, 2.6, 2.1, far, null, false);
        // cola
        const tail = pose === 'kick' ? [[-17.6, -7], [-24, -10], [-29, -6]] : pose === 'salto' ? [[-17.6, -7], [-23, -7], [-27, 1]] : [[-17.6, -7], [-20.8, -4.5], [-22.4, 2], [-22, 10.5]];
        b.line(tail, 3.8, mane, 0, 1, 2);
        // cuello y cabeza siguen a la pose (en la coz baja la cabeza, empinado la levanta)
        const hd = pose === 'kick' ? [4, 8] : pose === 'rear' ? [-2, -3] : [0, 0], X = v => v + hd[0] * ((v - 9) / 20), Y = v => v + hd[1] * ((-v - 5) / 20), T = ([x, y]) => [X(x), Y(y)];
        // silueta del cuerpo con cuello
        b.poly([[-12, -10.2], [-7, -9.3], [-2, -8.7], [3, -9.3], [7, -11.2], T([10, -15.2]), T([13.4, -20.6]), T([16.2, -23.6]), T([18.4, -24.8]), T([21, -19.6]), T([18.4, -13.6]), [16.8, -7.6], [16.4, -3.4], [16.4, -1], [15.4, 2.6], [13, 5.4], [8, 7], [2, 7.3], [-4, 6.5], [-8, 4.6], [-9.6, 5.2], [-14, 6.4], [-17, 3], [-18.3, -2.4], [-17.6, -6.6], [-15, -9.4]], body);
        b.ell(-12, .8, 5.4, 5.2, body);    // muslo
        b.ell(12.6, 4.6, 2.8, 3.2, body);  // antebrazo
        // cabeza: frente recta, quijada redonda, hocico
        b.poly([T([18.4, -25.3]), T([20.6, -25.6]), T([24.6, -21.6]), T([28, -16.8]), T([29.6, -14.4]), T([30.2, -12.8]), T([29.6, -11.4]), T([27.8, -11]), T([26.2, -12.2]), T([23.4, -14.4]), T([21.2, -15.6]), T([20.4, -17.8]), T([20.6, -21])], body);
        b.ell(X(22.6), Y(-16.4), 2.9, 2.6, body);
        b.poly([T([19.2, -25]), T([18.8, -29.6]), T([20.6, -25.8])], body);
        // pelaje: textura y manchas redondeadas del overo
        const sn = (x, y) => { const s = 6, ix = Math.floor(x / s), iy = Math.floor(y / s), fx = x / s - ix, fy = y / s - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), a = hash(ix, iy + 71), c = hash(ix + 1, iy + 71), d = hash(ix, iy + 72), e = hash(ix + 1, iy + 72); return a + (c - a) * u + (d - a) * v + (a - c - d + e) * u * v; };
        b.tex(body, (x, y) => PL.spots && sn(x, y) > .62 ? [236, 230, 214] : hash(x * 3, y * 5 + 2) < .08 ? dk(body, .14) : null);
        // crin, copete, ojo, ollar y lista
        b.line([T([18.8, -25.4]), T([16, -24]), T([13, -20.8]), T([9.8, -15.6]), [7.2, -11.4]], 2.4, mane, 1, 1, 1.6);
        b.line([T([19.8, -25.6]), T([21.8, -24.2])], 1.5, mane, 1);
        b.dot(X(22.9), Y(-22), '#0c0806', 1); b.dot(X(29.4), Y(-13.8), '#2a1a10', 1);
        b.line([T([24.2, -22.8]), T([28.4, -16.4])], 1.1, sock, 1);
        if (saddle) {
          // cabezada, freno y riendas
          const cuero = '#3a2416', plata = '#c4c8d0';
          b.line([T([20.4, -25]), T([21.8, -18]), T([23.6, -14.8])], .9, cuero, 1);
          b.line([T([27.2, -18.4]), T([28.2, -12.4])], .9, cuero, 1);
          b.dot(X(28.4), Y(-12.2), plata, 1);
          b.line([T([28.2, -12.4]), T([21, -12.6]), [14, -10.6], [7.5, -10.8]], .7, '#5a3a22', 1);
          // recado: carona tejida con rombos, bastos de cuero, pellón claro arriba, cincha y estribo
          b.rect(-8, -9.6, 15, 7, '#e3d6b6');
          b.tex('#e3d6b6', (x, y) => { const m = (x + y) % 6, n = (x - y + 60) % 6; return (m === 0 || n === 0) ? [92, 50, 32] : ((x + y) % 3 === 1 && (x - y + 60) % 3 === 1) ? [150, 58, 40] : null; });
          b.rect(-8, -3, 15, 1.1, '#6a2a22');
          b.rect(-6, -10.8, 11.5, 3.4, '#7a4a24');
          b.ell(-.3, -11.4, 6.6, 2.1, '#efe6d0');
          b.tex('#efe6d0', (x, y) => ((x * 3 + y) % 4 === 0) ? [210, 198, 170] : null);
          b.line([[-.5, -7.4], [-.5, 6.4]], 1.3, cuero, 1);
          b.dot(-.5, 1, plata, 1);
          b.line([[1.2, -7.6], [1.6, 3.4]], .7, '#4a3020', 1);
          b.rect(.6, 3.2, 2.2, 1.4, plata, 1); b.dot(1.7, 3.9, '#1a1612', 1);
        }
        leg([-11, 4.6], L(0, 0), 9.8, 10, 4.6, 2.8, 2.2, body, sock, true);
        leg([12.6, 4.6], L(Math.PI * .5, 1), 10, 9.2, 4, 2.7, 2.2, body, null, false);
      }
      function guanacoDraw(b, pose, ph, saddle) {
        const body = '#b98355', far = dk('#b98355', .3), belly = '#efe6d6', face = '#5e5a58', hoof = '#2a2420', L = (o, f) => legA(pose, ph, o, f);
        aLeg(b, [-10, 4], L(Math.PI, 0), 20, far, hoof, 3);
        aLeg(b, [11, 4], L(Math.PI * 1.5, 1), 20, far, hoof, 3);
        b.ell(-16.5, pose === 'kick' ? -7 : -4.5, 3, 2.6, body);
        b.ell(0, 0, 16, 8.5, body); b.ell(-9, 0, 8.5, 9, body); b.ell(9, .5, 7, 8, body);
        b.ell(2, 5.2, 11, 3.2, belly);
        const nk = pose === 'kick' ? [[9, -2], [16, -12], [21, -20]] : pose === 'rear' ? [[9, -2], [11, -16], [11, -27]] : [[9, -2], [13, -16], [15, -27]], hx = nk[2][0] - 15, hy = nk[2][1] + 27;
        b.line(nk, 6.6, body, 0, 1, 5);
        b.tex(body, (x, y) => hash(x * 5, y * 3 + 4) < .09 ? lt(body, .14) : null);
        b.line([[13, -2], [nk[1][0] + 3.5, nk[1][1] + 2], [nk[2][0] + 2.6, nk[2][1] + 3]], 2, belly, 1);
        b.ell(17 + hx, -28 + hy, 4.6, 3.6, face); b.ell(21.5 + hx, -26.6 + hy, 3, 2.2, face);
        b.poly([[14 + hx, -30 + hy], [13 + hx, -35.5 + hy], [16 + hx, -31 + hy]], face); b.poly([[16.5 + hx, -31 + hy], [17.2 + hx, -36 + hy], [18.6 + hx, -31 + hy]], face);
        b.dot(18.2 + hx, -29.3 + hy, '#0c0806', 1); b.dot(18.2 + hx, -30.6 + hy, belly, 1); b.dot(23.4 + hx, -26.4 + hy, '#1c1816', 1);
        if (saddle) {
          // mismo recado que el caballo, más chico
          b.rect(-7, -8.4, 13, 5.6, '#e3d6b6');
          b.tex('#e3d6b6', (x, y) => { const m = (x + y) % 6, n = (x - y + 60) % 6; return (m === 0 || n === 0) ? [92, 50, 32] : ((x + y) % 3 === 1 && (x - y + 60) % 3 === 1) ? [150, 58, 40] : null; });
          b.rect(-7, -3.2, 13, 1, '#6a2a22'); b.rect(-5, -9.4, 10, 3, '#7a4a24');
          b.ell(-.3, -10, 5.6, 1.9, '#efe6d0'); b.tex('#efe6d0', (x, y) => ((x * 3 + y) % 4 === 0) ? [210, 198, 170] : null);
          b.line([[-.5, -6.4], [-.5, 3.2]], 1.2, '#3a2416', 1); b.line([[1.1, -6.6], [1.4, 2.6]], .7, '#4a3020', 1); b.rect(.5, 2.4, 2, 1.3, '#c4c8d0', 1);
        }
        aLeg(b, [-8, 5], L(0, 0), 20, body, hoof, 3.4, belly);
        aLeg(b, [12, 5], L(Math.PI * .5, 1), 20, body, hoof, 3.4, belly);
      }
      const ANIM_SPR = {}, POSE_FR = { rear: 5, kick: 6, salto: 7 };
      function animSpr(kind, saddle, pel) {
        pel = kind === 'caballo' ? (pel || 'zaino') : '';
        const key = kind + (saddle ? '_m' : '') + pel; if (ANIM_SPR[key]) return ANIM_SPR[key];
        const draw = kind === 'caballo' ? horseDraw : guanacoDraw, frames = [];
        const F = [['idle', 0], ['run', 0], ['run', TAU / 4], ['run', TAU / 2], ['run', TAU * 3 / 4], ['rear', 0], ['kick', 0], ['salto', 0]];
        for (const [pose, ph] of F) { const b = PixBuf(64, 1 / PXS); draw(b, pose, ph, saddle, pel); frames.push(pixFinish(b)); }
        return ANIM_SPR[key] = { frames, size: 64 * PXS };
      }

      /* zonas: potreros (caballos) y aguadas (guanacos), fijas por celda como los obstáculos */
      function herdZone(ix, iy) {
        // la semilla cambia en cada partida: los potreros y aguadas nunca quedan en el mismo lugar
        const sd = S.herdSeed || 0, a = ix + sd, c = iy - sd * 3;
        if (hash(a * 41 + 13, c * 23 + 7) > (NI('b4b') ? .3 : .17)) return null;
        const x = (ix + .2 + hash(a * 7 + 1, c * 11) * .6) * HERD_CELL, y = (iy + .2 + hash(a * 3, c * 5 + 9) * .6) * HERD_CELL;
        if (Math.hypot(x, y) < 900) return null;
        const kind = MAPS[bioKey(x, y)].ice ? 'guanaco' : (hash(a * 19, c * 31 + 5) < .55 ? 'caballo' : 'guanaco');
        return { key: ix + ',' + iy, x, y, kind };
      }
      function rideDmg(frac, base) { const R = S.ride; return Math.max(base * hpMult(), (R ? R.dps : S.dpsEMA || 0) * frac / Math.max(1, ST.might)); }
      function neigh(long) {
        sfx(760, long ? .5 : .32, 'sawtooth', .025, .55);
        setTimeout(() => sfx(980, long ? .35 : .2, 'sawtooth', .02, .6), 90);
        setTimeout(() => sfx(640, .25, 'triangle', .02, .5), long ? 260 : 180);
      }

      function updateMounts(dt) {
        const P = S.player;
        if (S.tumble > 0) S.tumble -= dt;
        if (S.rideCD > 0) S.rideCD -= dt;
        S.herdScan -= dt;
        if (S.herdScan <= 0) {
          S.herdScan = .5;
          const R = viewR() * 1.7, x0 = Math.floor((P.x - R) / HERD_CELL), x1 = Math.floor((P.x + R) / HERD_CELL), y0 = Math.floor((P.y - R) / HERD_CELL), y1 = Math.floor((P.y + R) / HERD_CELL);
          for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
            const z = herdZone(ix, iy); if (!z || S.herdAct.has(z.key) || (S.herdCD.get(z.key) || 0) > S.t) continue;
            if (Math.hypot(z.x - P.x, z.y - P.y) > R) continue;
            S.herdAct.add(z.key);
            for (let i = 0, n = z.kind === 'guanaco' ? 2 : 1; i < n; i++) {
              const a = {
                kind: z.kind, pelaje: z.kind === 'caballo' ? pick(PELAJES) : '', rasgo: z.kind === 'caballo' ? pick(RASGOS) : '', key: z.key, hx: z.x, hy: z.y, x: z.x + rnd(-50, 50), y: z.y + rnd(-40, 40), vx: 0, vy: 0, state: 'graze', wT: rnd(0, 2), tx: z.x, ty: z.y,
                tame: 0, calm: 0, ang: 0, jink: 0, turnT: 0, runT: 0, sprint: true, face: Math.random() < .5 ? -1 : 1, wob: Math.random() * TAU, dead: false, r: MOUNTS[z.kind].r
              };
              pushOut(a, a.r); S.mounts.push(a);
            }
          }
        }
        const far = viewR() * 3.2, hw = W / 2 / ZOOM, hh = H / 2 / ZOOM;
        for (const a of S.mounts) {
          const M = MOUNTS[a.kind];
          if (a.state === 'bolt') { a.life -= dt; a.vx = Math.cos(a.ang) * 300; a.vy = Math.sin(a.ang) * 300; a.x += a.vx * dt; a.y += a.vy * dt; a.face = a.vx > 0 ? 1 : -1; if (a.life <= 0) a.dead = true; continue; }
          const dx = a.x - P.x, dy = a.y - P.y, d = Math.hypot(dx, dy) || 1;
          if (d > far) { a.dead = true; continue; }
          if (!S.herdTip && (SAVE.stats.rides || 0) < 3 && Math.abs(dx) < hw - 20 && Math.abs(dy) < hh - 20) {
            S.herdTip = true; banner(`Un ${M.name} suelto: perseguilo y quedate cerca para amansarlo`);
          }
          let sp = 0, ux = 0, uy = 0;
          if (a.state === 'graze' || S.ride) {
            if (S.ride && a.state === 'flee') { a.state = 'graze'; a.hx = a.x; a.hy = a.y; a.tx = a.x; a.ty = a.y; }
            a.wT -= dt;
            if (a.wT <= 0) { a.wT = rnd(1.5, 3.5); if (Math.random() < .45) { a.tx = a.x; a.ty = a.y; } else { const an = Math.random() * TAU, rr = rnd(20, 90); a.tx = a.hx + Math.cos(an) * rr; a.ty = a.hy + Math.sin(an) * rr; } }
            const tx = a.tx - a.x, ty = a.ty - a.y, td = Math.hypot(tx, ty);
            if (td > 6) { sp = 34; ux = tx / td; uy = ty / td; }
            a.tame = Math.max(0, a.tame - dt / (S.ride ? .5 : 4));
            if (!S.ride && d < 230) {
              a.state = 'flee'; a.sprint = true; a.runT = rnd(M.run[0], M.run[1]); a.turnT = rnd(M.turn[0], M.turn[1]); a.jink = 0; a.ang = Math.atan2(dy, dx); a.calm = 0;
              if (Math.abs(dx) < hw && Math.abs(dy) < hh) neigh(false);
            }
          } else {
            a.turnT -= dt; if (a.turnT <= 0) { a.turnT = rnd(M.turn[0], M.turn[1]); a.jink = (Math.random() < .5 ? -1 : 1) * rnd(.5, 1) * M.jink; }
            a.runT -= dt; if (a.runT <= 0) { a.sprint = !a.sprint; a.runT = a.sprint ? rnd(M.run[0], M.run[1]) : rnd(M.rest[0], M.rest[1]); }
            const want = Math.atan2(dy, dx) + a.jink, da = ((want - a.ang) % TAU + TAU * 1.5) % TAU - Math.PI;
            a.ang += clamp(da, -M.steer * dt, M.steer * dt);
            sp = ST.speed * (a.sprint ? M.sprint : M.trot) * (d < TAME_R ? .85 : 1); ux = Math.cos(a.ang); uy = Math.sin(a.ang);
            if (d > 520) { a.calm += dt; if (a.calm > 2.5) { a.state = 'graze'; a.hx = a.x; a.hy = a.y; a.tx = a.x; a.ty = a.y; } } else a.calm = 0;
            if (d < TAME_R && S.rideCD > 0) { if (!S.rideCDTip) { S.rideCDTip = true; banner('Todavía estás molido de la última monta'); } }
            else if (d < TAME_R) { a.tame += dt / (M.tame * (NI('b2') ? .72 : 1) * (CHARS[S.char].doma || 1)); if (a.tame >= 1) { startRide(a); continue; } }
            else if (d > TAME_R * 1.5) a.tame = Math.max(0, a.tame - dt / 5);
          }
          const k = Math.min(1, (MAP().ice ? 3 : 8) * dt);
          a.vx += (ux * sp - a.vx) * k; a.vy += (uy * sp - a.vy) * k;
          a.x += a.vx * dt; a.y += a.vy * dt;
          if (Math.abs(a.vx) > 8) a.face = a.vx > 0 ? 1 : -1;
          pushOut(a, a.r * .8, 120 * dt);
        }
        compact(S.mounts);
        S.herdAct.clear(); for (const a of S.mounts) if (a.state !== 'bolt') S.herdAct.add(a.key);
        if (S.ride) updateRide(dt);
      }

      function startRide(a) {
        const M = MOUNTS[a.kind], P = S.player, hp = ST.maxHp * M.hpK;
        a.dead = true; S.herdCD.set(a.key, S.t + 90);
        for (const o of S.mounts) if (o !== a && o.key === a.key && o.state !== 'bolt') { o.state = 'bolt'; o.life = 3; o.ang = Math.atan2(o.y - P.y, o.x - P.x); }
        const lv = a.lvl || 0, rg = a.rasgo || '', hk = (rg === 'guapo' ? 1.35 : 1) * (1 + .08 * Math.max(0, lv - 1));
        if (a.kind === 'caballo' && !a.own) S.tamed = { pelaje: a.pelaje || 'zaino', rasgo: rg || 'ligero' };
        S.ride = {
          kind: a.kind, pelaje: a.pelaje, rasgo: rg, own: !!a.own, spdK: (rg === 'ligero' ? 1.15 : 1) * (1 + .03 * Math.max(0, lv - 1)), trK: rg === 'manero' ? 1.3 : 1,
          t: 0, T: S.mode === 'campo' ? Infinity : M.dur + (NI('b3') ? 5 : 0) + (CHARS[S.char].monta || 0) + (rg === 'aguantador' ? 5 : 0) + Math.max(0, lv - 1), hp: hp * hk, maxHp: hp * hk, rebT: .35, side: P.face, buck: false, buckT: 0, buckMax: 1, bk: 0, mv: null, lastMv: null, introDone: false, swT: 0, swMax: .26, swDir: 1, flash: 0,
          spitT: M.spit || 0, dps: S.dpsEMA || 0, intro: .8, dustT: 0
        };
        P.x = a.x; P.y = a.y; P.vx = a.vx; P.vy = a.vy; P.r = M.r; P.dashT = 0; P.atkT = 0;
        for (const w of S.weapons) { if (w.pos) w.pos.length = 0; w.R = 0; }
        if (!a.own) SAVE.stats.rides = (SAVE.stats.rides || 0) + 1;
        banner(S.mode === 'campo' ? (a.own ? 'Llegó tu ' + M.name + '. Tocá H para bajarte' : `¡Amansado! Traelo por la tranquera y queda en el corral`) : `¡Amansado! Tenés el ${M.name} por ${M.dur} segundos`);
        S.fx.push({ type: 'ring', x: P.x, y: P.y, life: .5, max: .5, col: '#e0b75a', R: 90 });
        S.shake = Math.min(1, S.shake + .3); burst(P.x, P.y + 20, 12, MAP().ice ? '#dbe8f2' : '#8a7b5a', 140);
        neigh(true);
      }

      function rideHurt(raw) {
        const R = S.ride; if (!R || R.hp <= 0) return;
        const d = Math.max(1, raw * (1 - armorRed())); R.hp -= d; R.flash = .12;
        addText(S.player.x, S.player.y - 42, Math.round(d), '#e0a060');
        S.shake = Math.min(1, S.shake + .2); sfx(120, .1, 'square', .035, .6);
      }

      /* jineteada: cada corcovo es un movimiento con su pose, altura y giro.
         salto: se despega del suelo con el lomo arqueado. coz: planta las manos y patea para atrás con el anca arriba.
         empinada: se para en dos patas. giro: salta y cae mirando para el otro lado. piv: casco sobre el que rota (1 manos, -1 patas). */
      const MOVES = {
        salto: { T: .62, lift: 24, rot: .12, piv: 0, push: 1 },
        coz: { T: .52, lift: 7, rot: .62, piv: 1, push: -.4 },
        empinada: { T: .72, lift: 5, rot: -.78, piv: -1, push: .2 },
        giro: { T: .5, lift: 14, rot: .2, piv: 0, push: 0, flip: true }
      };
      function startMove(R, type, amp) {
        const B = MOVES[type], P = S.player, k = R.buck ? R.bk : 0;
        R.mv = { type, t: 0, T: B.T * (1 - .3 * k), amp, landed: false, flipped: false }; R.lastMv = type;
        P.vx += P.face * B.push * (140 + 180 * k) * amp; P.vy += rnd(-1, 1) * (60 + 160 * k) * amp;
        if (type === 'giro') P.vy += (Math.random() < .5 ? -1 : 1) * (150 + 200 * k) * amp;
        sfx(type === 'empinada' ? 520 : 180 + Math.random() * 60, .14, type === 'empinada' ? 'sawtooth' : 'square', .03, type === 'empinada' ? 1.3 : .5);
        if (type === 'empinada' && Math.random() < .6) neigh(false);
      }
      function landMove(R) {
        const P = S.player, a = R.mv.amp, big = MOVES[R.mv.type].lift * a;
        S.shake = Math.min(1, S.shake + .06 + big * .012);
        burst(P.x, P.y + 22, 4 + Math.round(big * .4), MAP().ice ? '#dbe8f2' : '#8a7b5a', 70 + big * 5);
        sfx(70 + Math.random() * 25, .16, 'square', .04 + big * .001, .5);
        if (R.buck && big > 8 && S.fx.length < 320) S.fx.push({ type: 'ring', x: P.x, y: P.y + 18, life: .3, max: .3, col: 'rgba(201,184,148,.6)', R: 30 + big * 1.5 });
      }
      function updateRide(dt) {
        const R = S.ride, M = MOUNTS[R.kind], P = S.player, sp = Math.hypot(P.vx, P.vy);
        R.t += dt; R.flash -= dt; if (R.swT > 0) R.swT -= dt;
        if (!R.mv && Math.abs(P.vx) > 25) P.face = P.vx > 0 ? 1 : -1;
        if (!R.buck && (R.t >= R.T || R.hp <= 0)) {
          R.buck = true; R.buckT = R.buckMax = R.hp <= 0 ? 1.6 : BUCK_T; R.bk = 0; R.swT = 0;
          banner(R.hp <= 0 ? `El ${M.name} no aguanta más y se encabrita` : '¡Corcovea! Agarrate fuerte');
          neigh(true);
        }
        if (R.mv) {
          R.mv.t += dt; const q = R.mv.t / R.mv.T;
          if (R.mv.type === 'giro' && !R.mv.flipped && q > .5) { R.mv.flipped = true; P.face = -P.face; P.vx *= -.5; }
          if (!R.mv.landed && q >= .86) { R.mv.landed = true; landMove(R); }
          if (q >= 1) R.mv = null;
        }
        if (R.buck) {
          R.buckT -= dt; R.bk = clamp(1 - R.buckT / R.buckMax, 0, 1);
          // lo tira en el punto más alto de un corcovo
          if (R.buckT <= 0 && (!R.mv || R.mv.t / R.mv.T > .35)) { throwRider(); return; }
          if (!R.mv) { const opts = Object.keys(MOVES).filter(m => m !== R.lastMv); startMove(R, opts[(Math.random() * opts.length) | 0], .7 + .5 * R.bk + (R.rasgo === 'manero' ? .15 : 0)); }
        } else if (R.intro > 0) {
          R.intro -= dt;
          if (!R.mv && !R.introDone) { R.introDone = true; startMove(R, Math.random() < .5 ? 'empinada' : 'coz', .55); }
        }
        if (!R.buck) {
          // rebenque de lado a lado, en vertical y corto
          R.rebT -= dt;
          if (R.rebT <= 0 && !R.mv && (S.mode !== 'campo' || S.armed)) { R.rebT = .55 * ST.cd; riderSwing({ dmg: rideDmg(.3, 14), area: 1.2 }, R.side); R.side = -R.side; }
          if (M.spit) {
            R.spitT -= dt;
            if (R.spitT <= 0) {
              const e = nearest(P.x, P.y);
              if (e && dist2(e, P.x, P.y) < 380 * 380) {
                R.spitT = M.spit * ST.cd; const a = Math.atan2(e.y - P.y + 22, e.x - P.x - P.face * 20);
                spawnProj({ kind: 'spit', x: P.x + P.face * 20, y: P.y - 22, vx: Math.cos(a) * 460, vy: Math.sin(a) * 460, r: 8 * ST.area, dmg: rideDmg(.35, 16), pierce: 4, life: .9, w: PJ, kb: 6 });
                sfx(600, .1, 'sine', .03, .4);
              } else R.spitT = .4;
            }
          }
        }
        // atropello: los chicos salen volando; los pesados y las élites frenan al animal y lo lastiman
        const air = R.mv && R.mv.type === 'salto' && R.mv.t / R.mv.T > .15 && R.mv.t / R.mv.T < .85;
        if (sp > 60 && !air) {
          const dmg = rideDmg(.25, M.trample) * (R.trK || 1) * clamp(sp / (ST.speed * M.spd), .4, 1.3);
          forNear(P.x, P.y, M.r + 6, e => {
            if (e.type === 'mandinga') return;
            const rr = M.r + e.r + 4; if (dist2(e, P.x, P.y) > rr * rr || !canHit(e, 'pisada', .4)) return;
            const heavy = !e.prop && (e.elite || ETYPES[e.type].w > M.heavy);
            hurt(e, dmg, PJ, heavy ? 1 : M.kb, P.x - P.vx * .05, P.y - P.vy * .05);
            if (heavy) { P.vx *= -.3; P.vy *= -.3; rideHurt(e.dmg * .7); S.shake = Math.min(1, S.shake + .25); sfx(70, .2, 'square', .05, .5); }
            else if (S.parts.length < 520) burst(e.x, e.y, 3, '#c9b894', 80);
          });
          R.dustT -= dt;
          if (R.dustT <= 0 && S.parts.length < 500) { R.dustT = .05; S.parts.push({ x: P.x - P.face * 16 + rnd(-4, 4), y: P.y + 22, vx: -P.vx * .2 + rnd(-20, 20), vy: rnd(-30, -10), life: .4, max: .4, col: MAP().ice ? '#dbe8f2' : '#8a7b5a', size: rnd(2, 3.5) }); }
        }
        // la coz golpea fuerte a lo que tenga atrás
        if (R.mv && R.mv.type === 'coz' && !R.mv.hit && R.mv.t / R.mv.T > .4) {
          R.mv.hit = true; const bx = P.x - P.face * 30, by = P.y + 8, pw = rideDmg(.3, M.trample * 1.5);
          forNear(bx, by, 30, e => { if (e.type !== 'mandinga' && dist2(e, bx, by) < (30 + e.r) ** 2) hurt(e, pw, PJ, M.kb * 1.2, P.x, P.y); });
        }
      }
      function riderSwing(s, dir) {
        const R = S.ride, M = MOUNTS[R.kind];
        R.swT = R.swMax = .26; R.swDir = dir;
        later(.07, () => {
          if (!S.ride) return;
          const P = S.player, A = s.area * ST.area, ww = 46 * A, top = P.y + M.seat - 34 * Math.sqrt(A), bot = P.y + 26, x0 = dir > 0 ? P.x + 4 : P.x - 4 - ww;
          forNear(x0 + ww / 2, (top + bot) / 2, Math.max(ww, bot - top) / 2, e => { if (e.x + e.r > x0 && e.x - e.r < x0 + ww && e.y + e.r > top && e.y - e.r < bot) hurt(e, s.dmg, PJ, 6, P.x, P.y - 10); });
          clearBullets(b => b.x + b.r > x0 && b.x - b.r < x0 + ww && b.y + b.r > top && b.y - b.r < bot);
          sfx(1900, .03, 'square', .018, .5);
        });
        sfx(300, .07, 'triangle', .03, .4);
      }

      function throwRider() {
        const R = S.ride, M = MOUNTS[R.kind], P = S.player, dmg = rideDmg(.4, 20), a = (P.face > 0 ? 0 : Math.PI) + rnd(-.9, .9);
        S.ride = null; if (S.mode !== 'campo') { S.rideCD = RIDE_CD; S.rideCDTip = false; }
        S.mounts.push({ kind: R.kind, pelaje: R.pelaje, key: 'suelto', x: P.x, y: P.y, vx: 0, vy: 0, state: 'bolt', life: 3.5, ang: a + Math.PI, face: 1, saddle: true, dead: false, r: M.r, tame: 0, wob: 0 });
        P.r = 12; P.dvx = Math.cos(a) * 460; P.dvy = Math.sin(a) * 460; P.dashT = .2; P.vx = P.vy = 0;
        P.iframe = Math.max(P.iframe, 1.2); P.dashCD = Math.max(P.dashCD, .6); S.tumble = .5; P.dashT = .26;
        S.waves.push({ x: P.x, y: P.y, r: 6, R: 130, spd: 480, dmg, w: PJ, hit: new Set(), evo: false });
        S.fx.push({ type: 'ring', x: P.x, y: P.y, life: .5, max: .5, col: '#c9b894', R: 130 });
        burst(P.x, P.y + 14, 16, MAP().ice ? '#dbe8f2' : '#8a7b5a', 180);
        S.shake = Math.min(1, S.shake + .6); S.hitstop = Math.max(S.hitstop, .06);
        banner(`Te tiró el ${M.name}. ¡A pie otra vez!`);
        for (const w of S.weapons) w.cd = Math.min(w.cd, .25);
        sfx(80, .35, 'sawtooth', .06, .4);
      }

      /* ---- dibujo ---- */
      function drawHerdZones() {
        const P = S.player, hw = W / 2 / ZOOM + 180, hh = H / 2 / ZOOM + 180;
        const x0 = Math.floor((P.x - hw) / HERD_CELL), x1 = Math.floor((P.x + hw) / HERD_CELL), y0 = Math.floor((P.y - hh) / HERD_CELL), y1 = Math.floor((P.y + hh) / HERD_CELL);
        for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
          const z = herdZone(ix, iy); if (!z || Math.abs(z.x - P.x) > hw || Math.abs(z.y - P.y) > hh) continue;
          const sd = ix * 7 + iy * 13, zb = bioKey(z.x, z.y), ice = MAPS[zb].ice;
          if (z.kind === 'caballo') {
            // potrero con alambrado a medio caer
            const n = 10, pts = [];
            for (let i = 0; i < n; i++) { const an = -2.5 + i * .52 + hash(sd, i) * .12; pts.push([z.x + Math.cos(an) * 130, z.y + Math.sin(an) * 100]); }
            cx.lineWidth = 1; cx.strokeStyle = 'rgba(200,190,160,.45)';
            for (const off of [-6, -11]) { cx.beginPath(); for (let i = 0; i < n - 1; i++) { if (hash(sd, i + 30) < .18) continue; cx.moveTo(pts[i][0], pts[i][1] + off); cx.lineTo(pts[i + 1][0], pts[i + 1][1] + off + (hash(sd, i + 50) < .2 ? 6 : 0)); } cx.stroke(); }
            for (let i = 0; i < n; i++) {
              const [x, y] = pts[i], tilt = (hash(sd, i + 70) - .5) * .35;
              cx.save(); cx.translate(x, y); cx.rotate(tilt); cx.fillStyle = OL; cx.fillRect(-3, -15, 6, 17); cx.fillStyle = '#6a4a2c'; cx.fillRect(-2, -14, 4, 15); cx.fillStyle = '#8a6a44'; cx.fillRect(-2, -14, 1.5, 15); cx.restore();
            }
          } else {
            // aguada (en el glaciar, charco congelado)
            cx.fillStyle = ice ? 'rgba(170,215,240,.35)' : 'rgba(24,44,58,.85)'; cx.beginPath(); cx.ellipse(z.x, z.y + 10, 70, 30, 0, 0, TAU); cx.fill();
            cx.strokeStyle = ice ? 'rgba(235,248,255,.55)' : 'rgba(120,160,170,.45)'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(z.x, z.y + 10, 70, 30, 0, 0, TAU); cx.stroke();
            cx.strokeStyle = ice ? 'rgba(255,255,255,.6)' : 'rgba(190,215,220,.35)'; cx.lineWidth = 1.5; cx.beginPath(); cx.moveTo(z.x - 30, z.y + 2); cx.lineTo(z.x + 8, z.y); cx.moveTo(z.x - 4, z.y + 18); cx.lineTo(z.x + 30, z.y + 16); cx.stroke();
            if (!ice) { const D = decorSpr(zb); for (let i = 0; i < 6; i++) { const an = i / 6 * TAU + hash(sd, i); dimg(D.tuft[i % 3], z.x + Math.cos(an) * 78, z.y + 10 + Math.sin(an) * 36); } }
          }
        }
      }
      function drawMounts() {
        const P = S.player, hw = W / 2 / ZOOM + 60, hh = H / 2 / ZOOM + 60;
        for (const a of S.mounts) {
          if (Math.abs(a.x - P.x) > hw || Math.abs(a.y - P.y) > hh) continue;
          const AS = animSpr(a.kind, !!a.saddle, a.pelaje), mv = Math.hypot(a.vx, a.vy) > 12, fast = a.state !== 'graze';
          const fr = AS.frames[mv ? 1 + (((S.t * (fast ? 11 : 6) + a.wob) | 0) % 4) : 0], sz = AS.size;
          cx.globalAlpha = a.state === 'bolt' ? clamp(a.life / .6, 0, 1) : 1;
          cx.fillStyle = 'rgba(0,0,0,.28)'; cx.beginPath(); cx.ellipse(a.x, a.y + 22, a.r + 4, 5, 0, 0, TAU); cx.fill();
          cx.save(); cx.translate(a.x, a.y + (mv && fast ? Math.sin(S.t * 12 + a.wob) * 1.2 : 0)); cx.scale(a.face, 1); cx.drawImage(fr.img, -sz / 2, -sz / 2, sz, sz); cx.restore();
          cx.globalAlpha = 1;
          if (a.tame > 0 && !S.ride && a.state !== 'bolt') {
            const d = Math.hypot(a.x - P.x, a.y - P.y), hy = a.y - (a.kind === 'caballo' ? 44 : 46);
            if (d < TAME_R * 1.6) {
              const nx = a.x + a.face * 16, ny = a.y - 20, hx = P.x + P.face * 8, hy2 = P.y - 6, mx = (nx + hx) / 2, my = (ny + hy2) / 2 + 14;
              cx.lineCap = 'round'; cx.strokeStyle = OL; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(hx, hy2); cx.quadraticCurveTo(mx, my, nx, ny); cx.stroke();
              cx.strokeStyle = d < TAME_R ? '#e0c080' : 'rgba(224,192,128,.5)'; cx.lineWidth = 1.6; cx.stroke();
              cx.beginPath(); cx.ellipse(nx, ny, 5, 3.5, 0, 0, TAU); cx.stroke(); cx.lineCap = 'butt';
            }
            cx.fillStyle = 'rgba(12,17,32,.8)'; cx.beginPath(); cx.arc(a.x, hy, 10, 0, TAU); cx.fill();
            cx.strokeStyle = '#e0b75a'; cx.lineWidth = 3; cx.beginPath(); cx.arc(a.x, hy, 7, -Math.PI / 2, -Math.PI / 2 + TAU * clamp(a.tame, 0, 1)); cx.stroke();
          }
        }
      }
      /* rebenque criollo: argolla de la manija, cabo forrado, virola y lonja ancha de cuero. (x,y) es la mano. */
      function drawRebenque(x, y, a) {
        const c = Math.cos(a), s = Math.sin(a), Q = d => [x + c * d, y + s * d];
        const seg = (d0, d1, w, col) => { const [ax, ay] = Q(d0), [bx, by] = Q(d1); cx.strokeStyle = col; cx.lineWidth = w; cx.beginPath(); cx.moveTo(ax, ay); cx.lineTo(bx, by); cx.stroke(); };
        const [lx, ly] = Q(-4.2);
        cx.strokeStyle = OL; cx.lineWidth = 2.8; cx.beginPath(); cx.ellipse(lx, ly, 3, 1.8, a, 0, TAU); cx.stroke();
        cx.strokeStyle = '#cfc9b8'; cx.lineWidth = 1.1; cx.stroke();
        cx.lineCap = 'round';
        seg(-1.5, 10, 4.4, OL); seg(10, 21.5, 5.8, OL);
        seg(-1.5, 10, 2.6, '#6e4222');
        seg(11, 21.5, 3.8, '#a4683a'); seg(12.5, 20.5, 1, '#c98f5c');
        seg(9.3, 10.9, 3.6, '#d9c49a');
        cx.lineCap = 'butt';
      }
      function drawArm(sx, sy, a, len, col) {
        const hx = sx + Math.cos(a) * len, hy = sy + Math.sin(a) * len;
        cx.lineCap = 'round';
        cx.strokeStyle = OL; cx.lineWidth = 5.5; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(hx, hy); cx.stroke();
        cx.strokeStyle = col; cx.lineWidth = 3.5; cx.beginPath(); cx.moveTo(sx, sy); cx.lineTo(sx + Math.cos(a) * len * .6, sy + Math.sin(a) * len * .6); cx.stroke();
        cx.strokeStyle = '#e0b48a'; cx.beginPath(); cx.moveTo(sx + Math.cos(a) * len * .6, sy + Math.sin(a) * len * .6); cx.lineTo(hx, hy); cx.stroke();
        cx.lineCap = 'butt';
        return [hx, hy];
      }
      function drawRider(P) {
        const R = S.ride, M = MOUNTS[R.kind], AS = animSpr(R.kind, true, R.pelaje), ch = CHARS[S.char], t = S.t, sp = Math.hypot(P.vx, P.vy), mv = sp > 25;
        // pose del corcovo en curso
        let ang = 0, px = 0, lift = 0, pose = null, rLag = 0, rTilt = 0;
        if (R.mv) {
          const B = MOVES[R.mv.type], q = clamp(R.mv.t / R.mv.T, 0, 1), s = Math.sin(Math.PI * q), a = R.mv.amp;
          lift = B.lift * a * s; ang = (R.mv.type === 'giro' ? Math.sin(TAU * q) : s) * B.rot * a; px = B.piv > 0 ? 14 : B.piv < 0 ? -12 : 0;
          pose = R.mv.type === 'salto' ? (q > .12 && q < .88 ? 'salto' : null) : R.mv.type === 'coz' ? (q > .15 && q < .85 ? 'kick' : null) : R.mv.type === 'empinada' ? (q > .1 && q < .9 ? 'rear' : null) : null;
          // el jinete llega tarde: se despega del recado y se inclina para compensar
          rLag = Math.sin(Math.PI * clamp((q - .2) / .8, 0, 1)) * (3 + B.lift * .35) * a;
          rTilt = -ang * 1.1 + (R.mv.type === 'empinada' ? .18 * s * a : R.mv.type === 'coz' ? -.28 * s * a : 0);
        } else if (mv) {
          const g = clamp(sp / (ST.speed * M.spd), 0, 1.2);
          ang = Math.sin(t * 13) * .06 * g; lift = Math.abs(Math.sin(t * 6.5)) * 3 * g; rLag = Math.abs(Math.sin(t * 6.5 + .9)) * 1.6 * g;
        }
        const shk = Math.max(.35, 1 - lift / 40);
        cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(P.x, P.y + 22, (M.r + 6) * shk, 5 * shk, 0, 0, TAU); cx.fill();
        const rR = M.r + 9;
        if (P.dashCD > 0) { const f = 1 - clamp(P.dashCD / dashCooldown(), 0, 1); cx.strokeStyle = 'rgba(201,164,92,.55)'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(P.x, P.y + 22, rR, 7, 0, -Math.PI / 2, -Math.PI / 2 + TAU * f); cx.stroke(); }
        else { cx.strokeStyle = 'rgba(201,164,92,.9)'; cx.lineWidth = 1.5; cx.beginPath(); cx.ellipse(P.x, P.y + 22, rR, 7, 0, 0, TAU); cx.stroke(); }
        if (P.iframe > 0 && P.dashT <= 0 && Math.floor(t * 30) % 2 === 0) cx.globalAlpha = .6;
        cx.save(); cx.translate(P.x, P.y - lift); cx.scale(P.face, 1);
        cx.translate(px, 22); cx.rotate(ang); cx.translate(-px, -22);
        const fr = AS.frames[pose ? POSE_FR[pose] : mv ? 1 + (((t * (8 + 6 * clamp(sp / (ST.speed * M.spd), 0, 1))) | 0) % 4) : 0], sz = AS.size;
        cx.drawImage(R.flash > 0 ? fr.flash : fr.img, -sz / 2, -sz / 2, sz, sz);
        // jinete: medio cuerpo sobre el recado, con la pierna colgando
        const PS = PSPR[S.char], f0 = PS.frames[0], ps = PS.size, rx = M.seatX, ry = M.seat, cut = 30 / 44;
        cx.save(); cx.translate(rx, ry + 8); cx.rotate(rTilt); cx.translate(0, -rLag);
        cx.lineCap = 'round';
        cx.strokeStyle = OL; cx.lineWidth = 5.5; cx.beginPath(); cx.moveTo(1, -2 + rLag * .6); cx.lineTo(3 + rLag * .15, 9 + rLag * .5); cx.stroke();
        cx.strokeStyle = '#3a3246'; cx.lineWidth = 3.5; cx.stroke(); cx.lineCap = 'butt';
        cx.fillStyle = OL; cx.fillRect(.5 + rLag * .15, 7 + rLag * .5, 7, 5); cx.fillStyle = '#2a1d14'; cx.fillRect(1.5 + rLag * .15, 8 + rLag * .5, 5, 3);
        cx.drawImage(f0, 0, 0, f0.width, f0.height * cut, -ps / 2, -8 - ps / 2, ps, ps * cut);
        // hombro en coordenadas del jinete
        const sx = 1.5, sy = -12.5;
        if (R.buck || R.mv) {
          // mano libre arriba y el rebenque en alto, como en la jineteada
          const w = Math.sin(t * 11) * .35, [hx, hy] = drawArm(sx - 1, sy, -Math.PI / 2 - .35 + w, 9, ch.col);
          drawRebenque(hx, hy, -Math.PI / 2 - .9 + w * 1.6);
        } else if (R.swT > 0) {
          // golpe vertical: arranca arriba y baja por el costado que toca (en coordenadas locales del jinete)
          const q = 1 - R.swT / R.swMax, e = 1 - Math.pow(1 - clamp(q * 1.7, 0, 1), 3), ld = R.swDir * P.face;
          const ar = -Math.PI / 2 - .35 + (Math.PI * .9 + .35) * e, a = ld > 0 ? ar : Math.PI - ar, a0 = ld > 0 ? -Math.PI / 2 - .35 : -Math.PI / 2 + .35;
          const top = -34 * Math.sqrt(1.2 * ST.area), rx_ = 40 * Math.sqrt(1.2 * ST.area), ry_ = (26 + 22 - top) / 2 + 4;
          cx.globalAlpha = clamp((1 - q) * 1.8, 0, 1) * .5;
          cx.strokeStyle = '#fff1cf'; cx.lineWidth = 5; cx.lineCap = 'round';
          cx.beginPath(); cx.ellipse(sx + (ld > 0 ? 4 : -4), sy + 8, rx_, ry_ * .55, 0, a0, a, ld < 0); cx.stroke();
          cx.globalAlpha = clamp((1 - q) * 1.8, 0, 1); cx.strokeStyle = '#e0b07a'; cx.lineWidth = 1.5; cx.stroke(); cx.lineCap = 'butt';
          cx.globalAlpha = P.iframe > 0 && P.dashT <= 0 && Math.floor(t * 30) % 2 === 0 ? .6 : 1;
          const [hx, hy] = drawArm(sx, sy, a, 8, ch.col); drawRebenque(hx, hy, a);
          if (q > .3 && q < .7) {
            const k = (q - .3) / .4, tx = hx + Math.cos(a) * 21, ty = hy + Math.sin(a) * 21; cx.globalAlpha = 1 - k; cx.strokeStyle = '#fff'; cx.lineWidth = 1.6; cx.beginPath();
            for (let i = 0; i < 6; i++) { const an = i / 6 * TAU; cx.moveTo(tx + Math.cos(an) * 2, ty + Math.sin(an) * 2); cx.lineTo(tx + Math.cos(an) * (4 + k * 9), ty + Math.sin(an) * (4 + k * 9)); } cx.stroke(); cx.globalAlpha = 1;
          }
        } else {
          // en reposo: rebenque colgando de la muñeca
          const [hx, hy] = drawArm(sx, sy, 1.2, 7, ch.col); drawRebenque(hx, hy, 1.35 + Math.sin(t * 9) * .08);
        }
        cx.restore();
        cx.restore(); cx.globalAlpha = 1;
        // tiempo de monta (dorado; rojo cuando corcovea) y aguante del animal (verde)
        const bw = 42, y0 = P.y + M.seat - 30 - lift, f = R.buck ? clamp(R.buckT / R.buckMax, 0, 1) : clamp(1 - R.t / R.T, 0, 1);
        cx.fillStyle = OL; cx.fillRect(P.x - bw / 2 - 1, y0 - 1, bw + 2, 8);
        cx.fillStyle = R.buck ? (Math.floor(t * 12) % 2 ? '#ff5a5a' : '#ffd0d0') : '#e0b75a'; cx.fillRect(P.x - bw / 2, y0, bw * f, 3);
        cx.fillStyle = '#8fe07a'; cx.fillRect(P.x - bw / 2, y0 + 4, bw * clamp(R.hp / R.maxHp, 0, 1), 2);
        const hb = 30, hp = clamp(P.hp / ST.maxHp, 0, 1);
        cx.fillStyle = OL; cx.fillRect(P.x - hb / 2 - 1, P.y + 29, hb + 2, 5);
        cx.fillStyle = '#c23a4a'; cx.fillRect(P.x - hb / 2, P.y + 30, hb * hp, 3);
      }
      function drawMountArrow() {
        if (S.ride) return;
        const P = S.player; let best = null, bd = 1100 * 1100;
        for (const a of S.mounts) { if (a.state === 'bolt') continue; const d = dist2(a, P.x, P.y); if (d < bd) { bd = d; best = a; } }
        if (!best) return;
        const dx = (best.x - P.x) * ZOOM, dy = (best.y - P.y) * ZOOM;
        if (Math.abs(dx) < W / 2 - 20 && Math.abs(dy) < H / 2 - 20) return;
        const a = Math.atan2(dy, dx), m = 36, ex = clamp(W / 2 + dx, m, W - m), ey = clamp(H / 2 + dy, m + 90, H - m);
        cx.save(); cx.translate(ex, ey); cx.rotate(a); cx.globalAlpha = .8;
        cx.fillStyle = '#d9b27c'; cx.strokeStyle = OL; cx.lineWidth = 2;
        cx.beginPath(); cx.moveTo(12, 0); cx.lineTo(-6, -8); cx.lineTo(-2, 0); cx.lineTo(-6, 8); cx.closePath(); cx.fill(); cx.stroke();
        cx.restore(); cx.globalAlpha = 1;
      }


