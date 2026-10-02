      /* ---------------- Recorrer el campo ----------------
         Modo tranquilo: mundo con semilla fija, casi sin enemigos, sin XP ni oro ni fama. Se juntan materiales en nodos
         que rebrotan a los 20 minutos (tiempo real). Se vuelve por la tranquera (o desde la pausa); si entrás montado en
         un caballo que amansaste, queda en el corral. Desmayarse te deja la mitad de lo juntado. */
      const RECURSOS = {
        osamenta: { name: 'Osamenta', mat: 'hueso', n: [1, 2] },
        cuero: { name: 'Cuero estaqueado', mat: 'cuero', n: [1, 2] },
        alambre: { name: 'Alambre viejo', mat: 'hierro', n: [1, 1] }
      };
      function startCampo() {
        initAudio(); if (AC && AC.state === 'suspended') AC.resume();
        const ch = SAVE.lastChar && CHARS[SAVE.lastChar] ? SAVE.lastChar : 'baqueano';
        newGame(ch, 'patagonia', 'campo');  // el campo es una región: estepa, bosque y glaciar según dónde andes
        hide('startOv'); $('hud').classList.add('on', 'campo'); $('dashBtn').classList.add('on'); $('toolBtn').classList.add('on'); $('toolSw').classList.toggle('on', toolsOwned().length > 1);
        $('whBtn').classList.toggle('on', !!SAVE.horses[SAVE.horse]);
        banner(SAVE.campo.salidas ? 'Salís a recorrer el campo' : 'Recorré el campo tranquilo. E usa la herramienta; para volver, quedate un momento en la tranquera');
      }
      function campoNode(ix, iy) {
        const key = ix + ',' + iy; if (campoCache.has(key)) return campoCache.get(key);
        const sd = SAVE.campo.seed; let n = null;
        if (hash(ix * 37 + sd, iy * 19 - sd) < .32) {
          const x = (ix + .2 + hash(ix * 11 + sd, iy * 5 + 1) * .6) * CAMPO_CELL, y = (iy + .2 + hash(ix * 3 + 2, iy * 13 + sd) * .6) * CAMPO_CELL;
          let ok = Math.hypot(x - CAMPO_HOME.x, y - CAMPO_HOME.y) > 280;
          if (ok) forObs(x, y, 24, o => { if (Math.hypot(o.x - x, o.y - y) < o.r + 26) ok = false; });
          if (ok) { const hk = hash(ix * 7 - sd, iy * 23 + sd); n = { key, x, y, kind: hk < .45 ? 'osamenta' : hk < .75 ? 'cuero' : 'alambre', v: (hk * 1000) | 0 }; }
        }
        if (campoCache.size > 3000) campoCache.clear();
        campoCache.set(key, n); return n;
      }
      function nodeTaken(key) { if (S.campoTaken.has(key)) return true; const t = SAVE.campo.taken[key]; return !!t && Date.now() - t < CAMPO_REGROW; }
      function forCampoNodes(x, y, r, fn) {
        const x0 = Math.floor((x - r) / CAMPO_CELL), x1 = Math.floor((x + r) / CAMPO_CELL), y0 = Math.floor((y - r) / CAMPO_CELL), y1 = Math.floor((y + r) / CAMPO_CELL);
        for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) { const n = campoNode(ix, iy); if (n && !nodeTaken(n.key)) fn(n); }
      }
      function updateCampo(dt) {
        const P = S.player, dh = Math.hypot(P.x - CAMPO_HOME.x, P.y - CAMPO_HOME.y);
        if (!S.leftHome && dh > 420) S.leftHome = true;
        let best = null, bd = 38 * 38;
        forCampoNodes(P.x, P.y, 60, n => { const d = (n.x - P.x) ** 2 + (n.y - P.y) ** 2; if (d < bd) { bd = d; best = n; } });
        const home = S.leftHome && dh < 58, tgt = best ? best.key : home ? 'home' : null;
        if (!S.gath || S.gath.key !== tgt) S.gath = tgt ? { key: tgt, t: 0, T: tgt === 'home' ? 1.2 : 1, x: best ? best.x : CAMPO_HOME.x, y: best ? best.y : CAMPO_HOME.y } : null;
        if (S.gath) {
          if (!S.gatherTip && tgt !== 'home') { S.gatherTip = true; banner('Quedate cerca un momento para juntarlo'); }
          S.gath.t += dt;
          if (S.gath.t >= S.gath.T) {
            if (tgt === 'home') { endCampo('vuelta'); return; }
            collectNode(best); S.gath = null;
          }
        }
        const wb = $('whBtn'), want = !!(S.ride || SAVE.horses[SAVE.horse]);
        if (wb.classList.contains('on') !== want) wb.classList.toggle('on', want);
      }
      function collectNode(n) {
        const R = RECURSOS[n.kind], v = R.n[0] + (hash(n.v, 3) < .5 ? 0 : R.n[1] - R.n[0]), M_ = MATS[R.mat];
        S.mat[R.mat] = (S.mat[R.mat] || 0) + v; S.campoTaken.add(n.key);
        addText(n.x, n.y - 22, `+${v} ${M_.name}`, M_.col, true);
        burst(n.x, n.y, 10, M_.col, 90); sfx(620, .07, 'triangle', .04); setTimeout(() => sfx(930, .1, 'triangle', .04), 70);
      }
      function dismount() {
        const R = S.ride, M = MOUNTS[R.kind], P = S.player;
        S.ride = null; P.r = 12; P.iframe = Math.max(P.iframe, .5);
        S.mounts.push({ kind: R.kind, pelaje: R.pelaje, key: 'suelto', x: P.x, y: P.y, vx: 0, vy: 0, state: 'bolt', life: 3, ang: P.face > 0 ? Math.PI : 0, face: -P.face, saddle: true, dead: false, r: M.r, tame: 0, wob: 0 });
        P.x += P.face * 16;
        banner(R.own ? 'Te bajaste. Silbá (H) para que vuelva' : `Soltaste el ${M.name}`);
        for (const w of S.weapons) w.cd = Math.min(w.cd, .25);
        sfx(300, .12, 'triangle', .03, .6);
      }
      function endCampo(reason) {
        if (!S || S.mode !== 'campo') return;
        const faint = reason === 'desmayo', k = (faint ? .5 : 1) * (NI('p4b') ? 1.5 : 1), got = [];
        for (const m of MAT_KEYS) { const v = Math.floor((S.mat[m] || 0) * k); if (v > 0) { SAVE.mat[m] += v; got.push(v + ' de ' + MATS[m].name); } }
        const now = Date.now(); for (const key of S.campoTaken) SAVE.campo.taken[key] = now;
        let horse = '';
        if (reason === 'vuelta' && S.ride && !S.ride.own && S.ride.kind === 'caballo') {
          const h = { pelaje: S.ride.pelaje || 'zaino', rasgo: S.ride.rasgo || 'ligero', lvl: 1 };
          if (!corralCap()) horse = 'Construí el corral para quedarte con caballos';
          else if (SAVE.horses.length >= corralCap()) horse = 'El corral está lleno';
          else { SAVE.horses.push(h); if (SAVE.horse < 0) SAVE.horse = SAVE.horses.length - 1; horse = horseName(h) + ' quedó en el corral'; }
        }
        SAVE.campo.salidas++; SAVE.campo.tiempo += Math.floor(S.t); writeSave();
        S.state = 'end'; joy = null;
        hide('pauseOv'); $('hud').classList.remove('on', 'campo'); $('dashBtn').classList.remove('on'); $('whBtn').classList.remove('on'); $('toolBtn').classList.remove('on'); $('toolSw').classList.remove('on'); $('combo').classList.remove('on'); hud.comboOn = false; hud.bossOn = false; $('bossbar').classList.remove('on');
        S = null; musicStop();
        enterPuesto(); PU.y = 352;
        const msg = (faint ? 'Te desmayaste y te trajeron al puesto. ' : 'Volviste al puesto. ') + (got.length ? 'Juntaste ' + got.join(', ') + '.' : 'No juntaste nada esta vez.');
        banner(horse ? msg + ' ' + horse + '.' : msg);
      }
      /* sprites de los nodos */
      const CAMPO_SPR = {};
      function campoSpr(kind) {
        if (CAMPO_SPR[kind]) return CAMPO_SPR[kind];
        return CAMPO_SPR[kind] = pixSprite(48, 1, b => {
          if (kind === 'osamenta') {
            b.ellD(0, 6, 20, 5, [0, 0, 0], 2, .3, 0);
            b.line([[-5, 4], [15, 4]], 1.8, '#c8bea4');
            for (let i = 0; i < 4; i++) { const x = -2 + i * 4.5; b.line([[x, 4], [x - 2.5, -1.5], [x + .5, -6]], 1.5, '#ddd4bc'); }
            b.ell(-11, 1, 5.2, 3.8, '#e8e0c8'); b.ell(-15.5, 2.6, 2.6, 2.1, '#e8e0c8'); b.ell(-10, 2.2, 3.2, 1.6, '#cfc6ac');
            b.dot(-11.5, .2, '#3a3228', 1); b.dot(-9, .6, '#3a3228', 1);
            b.line([[-9, -2], [-5.5, -6], [-3, -5.4]], 1.3, '#e8e0c8'); b.line([[-13, -2], [-16.5, -6], [-19, -5.2]], 1.3, '#e8e0c8');
          } else if (kind === 'cuero') {
            b.ellD(0, 9, 17, 4.5, [0, 0, 0], 2, .3, 0);
            b.line([[-12, 9], [-10.5, -15]], 2.2, '#6a4a2c'); b.line([[12, 9], [10.5, -15]], 2.2, '#6a4a2c');
            b.line([[-12, -12], [12, -12]], 1.6, '#6a4a2c'); b.line([[-12, 5], [12, 5]], 1.6, '#6a4a2c');
            b.poly([[-9, -10], [0, -11.5], [9, -10], [7.5, -4], [9, 3], [0, 2], [-9, 3], [-7.5, -4]], '#b0703e');
            b.tex('#b0703e', (x, y) => hash(x * 3, y * 7) < .16 ? [140, 84, 46] : null);
            for (const [ax, ay, bx, by] of [[-9, -10, -11, -12], [9, -10, 11, -12], [-9, 3, -11, 5], [9, 3, 11, 5], [-7.5, -4, -11, -4], [7.5, -4, 11, -4]]) b.line([[ax, ay], [bx, by]], .8, '#d8c8a0');
          } else {
            b.ellD(0, 8, 16, 4, [0, 0, 0], 2, .3, 0);
            b.line([[-4, 8], [1, -15]], 3.4, '#5e4028'); b.tex('#5e4028', (x, y) => (x % 2 === 0 && hash(x, y >> 2) < .4) ? [78, 52, 30] : null);
            b.line([[-15, 6], [-9, 1], [-2, 4], [5, 0], [12, 4], [16, 2]], 1, '#9aa4b4');
            b.line([[-14, -3], [-8, -7], [-1, -4]], 1, '#9aa4b4');
            const cx_ = 9, cy_ = 4, pts = []; for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU * 2; pts.push([cx_ + Math.cos(a) * (4 - i * .06), cy_ + Math.sin(a) * (2.4 - i * .03)]); }
            b.line(pts, .9, '#b8bcc4');
          }
        });
      }
      function drawCampo(vis, hw, hh) {
        const P = S.player;
        forCampoNodes(P.x, P.y, Math.max(hw, hh) + 40, n => { if (vis(n.x, n.y)) dimg(campoSpr(n.kind), n.x, n.y); });
        drawFauna(vis);
        dimg(sprTranquera(0), CAMPO_HOME.x, CAMPO_HOME.y);
        drawFarol(CAMPO_HOME.x + 26, CAMPO_HOME.y - 40, S.t);
        const g = S.gath;
        if (g) {
          const k = clamp(g.t / g.T, 0, 1), R = g.key === 'home' ? 30 : 20;
          cx.globalAlpha = .35; cx.strokeStyle = '#0c1120'; cx.lineWidth = 4; cx.beginPath(); cx.arc(g.x, g.y - 4, R, 0, TAU); cx.stroke();
          cx.globalAlpha = 1; cx.strokeStyle = '#e0b75a'; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(g.x, g.y - 4, R, -Math.PI / 2, -Math.PI / 2 + TAU * k); cx.stroke();
        }
      }

