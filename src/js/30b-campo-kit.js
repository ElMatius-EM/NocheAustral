      /* =====================================================================
         RECORRER EL CAMPO — herramientas y fauna
         En el campo no andan las armas de la noche: se trabaja con lo que se forja en el Puesto.
         E (o el botón de herramienta) usa la herramienta y Q la cambia. El lazo se apunta manteniendo
         apretado y se suelta: engancha bichos, animales sueltos y caballos (en el campo, los caballos
         solo se agarran con el lazo). Carnear da carne, cuero o hueso; talar da leña.
         ===================================================================== */
      const TOOLS = {
        cuchillo: {
          name: 'Cuchillo', lv: [null,
            { name: 'Cuchillo de hueso', desc: 'Corto y rápido. Corta matas para leña y carnea.', dmg: 12, r: 42, arc: 1.5, cd: .3, chop: 1 },
            { name: 'Cuchillo de hierro', desc: 'Pega casi el doble y carnea mejor: +1 de carne por animal.', dmg: 22, r: 46, arc: 1.6, cd: .26, chop: 1, carne: 1, cost: { hierro: 5, oro: 80 } }]
        },
        hacha: {
          name: 'Hacha', lv: [null,
            { name: 'Hacha', desc: 'Lenta y pesada. Voltea lengas y troncos caídos: mucha leña.', dmg: 28, r: 52, arc: 2.1, cd: .7, chop: 3, cost: { hierro: 6, cuero: 2, oro: 120 } }]
        },
        lazo: {
          name: 'Lazo', lv: [null,
            { name: 'Lazo trenzado', desc: 'Mantené apretado para apuntar y soltá. Engancha bichos, animales y caballos.', range: 380, cd: 1.1, cost: { cuero: 6, oro: 60 } }]
        }
      };
      const TOOL_ORDER = ['cuchillo', 'hacha', 'lazo'];
      // lo que se puede talar: golpes que aguanta, leña que da y fuerza de herramienta que pide (cuchillo 1, hacha 3)
      const CHOP = { arbusto: { hp: 4, lena: 1, need: 1 }, tronco: { hp: 5, lena: 2, need: 3 }, lenga: { hp: 6, lena: 3, need: 3 } };
      const toolLv = id => (SAVE.tools && SAVE.tools[id]) || 0;
      const toolsOwned = () => TOOL_ORDER.filter(id => toolLv(id) > 0);
      const toolDef = id => TOOLS[id].lv[toolLv(id)];

      function kitInit() {
        S.tool = toolsOwned()[0] || null; S.toolCD = 0; S.toolHeld = false; S.aim = null; S.lazo = null; S.swing = null;
        S.fauna = []; S.faunaScan = 0; kitHud();
      }
      function kitHud() {
        const o = toolsOwned();
        $('toolBar').innerHTML = o.map((id, i) => `<div class="tslot${id === S.tool ? ' on' : ''}" title="${toolDef(id).name}"><img src="${toolURL(id)}" alt=""><kbd>${i + 1}</kbd></div>`).join('') +
          `<span class="thint"><kbd>E</kbd> usar · <kbd>Q</kbd> cambiar</span>`;
        $('toolBtn').innerHTML = S.tool ? `<img src="${toolURL(S.tool)}" alt="${TOOLS[S.tool].name}">` : '';
      }
      function toolDown() {
        if (!S || S.mode !== 'campo' || S.state !== 'play' || !S.tool) return;
        S.toolHeld = true;
        if (S.tool === 'lazo') { if (S.toolCD <= 0 && !S.lazo) S.aim = { t: 0 }; return; }
        toolSwing();
      }
      function toolUp() { if (!S) return; S.toolHeld = false; if (S.aim) { if (S.state === 'play') lazoThrow(); S.aim = null; } }
      function toolPick(id) { if (!S || S.mode !== 'campo' || !toolLv(id) || S.tool === id) return; S.tool = id; S.aim = null; kitHud(); sfx(700, .04, 'triangle', .02); }
      function toolNext() { const o = toolsOwned(); if (o.length > 1) toolPick(o[(o.indexOf(S.tool) + 1) % o.length]); }

      /* ---- cuchillo y hacha: golpe en abanico hacia donde mirás ---- */
      const angDiff = (a, b) => Math.abs(((a - b) % TAU + TAU * 1.5) % TAU - Math.PI);
      function toolSwing() {
        if (S.toolCD > 0 || S.ride) return;
        const T = toolDef(S.tool), P = S.player, a = Math.atan2(P.fy, P.fx);
        S.toolCD = T.cd; S.swing = { t: 0, T: .18, a, r: T.r, arc: T.arc, big: S.tool === 'hacha' };
        const hit = (x, y, rr) => { const dx = x - P.x, dy = y - P.y, d = Math.hypot(dx, dy); return d < T.r + rr && (angDiff(Math.atan2(dy, dx), a) < T.arc / 2 || d < rr + 8); };
        forNear(P.x, P.y, T.r + 40, e => { if (!e.prop && !e.dead && e.type !== 'mandinga' && hit(e.x, e.y, e.r)) hurt(e, T.dmg, { id: S.tool, evo: false }, 5, P.x, P.y); });
        for (const f of S.fauna) if (!f.dead && !f.hidden && !f.flying && hit(f.x, f.y, f.r)) faunaHit(f, T);
        const felled = [];
        forObs(P.x, P.y, T.r + 10, o => {
          const C = CHOP[o.kind]; if (!C || o.gone || !hit(o.x, o.y, o.r * .6)) return;
          if (T.chop < C.need) { if (!S.chopTip) { S.chopTip = true; banner('Para voltear eso hace falta el hacha'); } sfx(240, .06, 'square', .02); return; }
          if (chopObs(o, T.chop)) felled.push(o);
        });
        for (const o of felled) { const arr = obsCache.get(o.ck); if (arr) { const i = arr.indexOf(o); if (i >= 0) arr.splice(i, 1); } }
        sfx(S.tool === 'hacha' ? 260 : 900, .06, 'triangle', .03, .6);
      }
      function chopObs(o, pw) {
        const C = CHOP[o.kind];
        o.chp = (o.chp === undefined ? C.hp : o.chp) - pw;
        burst(o.x, o.y - o.r * .4, 6, o.kind === 'arbusto' ? '#3d5e36' : '#a07048', 80);
        sfx(170 + Math.random() * 60, .08, 'square', .03, .5);
        if (o.chp > 0) return false;
        o.gone = true; S.campoTaken.add(o.id);
        S.mat.lena = (S.mat.lena || 0) + C.lena;
        addText(o.x, o.y - 30, `+${C.lena} de leña`, MATS.lena.col, true); burst(o.x, o.y, 16, '#8a6a44', 150);
        S.shake = Math.min(1, S.shake + .15); sfx(110, .3, 'sawtooth', .04, .5);
        return true;
      }

      /* ---- lazo ---- */
      function lazoTarget(range) {
        const P = S.player, a = Math.atan2(P.fy, P.fx); let best = null, bs = 1e9;
        const consider = (o, kind) => {
          const dx = o.x - P.x, dy = o.y - P.y, d = Math.hypot(dx, dy); if (d > range || d < 20) return;
          const da = angDiff(Math.atan2(dy, dx), a); if (da > .62) return;
          const sc = d * (1 + da * 2); if (sc < bs) { bs = sc; best = { o, kind }; }
        };
        for (const f of S.fauna) if (!f.dead && !f.hidden && !f.flying && FAUNA[f.kind].hunt) consider(f, 'fauna');
        if (!S.ride) for (const m of S.mounts) if (!m.dead && m.state !== 'bolt' && !m.own) consider(m, 'mount');
        for (const e of S.enemies) if (!e.dead && !e.prop && e.type !== 'mandinga') consider(e, 'enemy');
        return best;
      }
      const lazoRange = () => { const T = toolDef('lazo'), k = S.aim ? clamp(S.aim.t / .6, 0, 1) : 1; return 140 + (T.range - 140) * k; };
      function lazoThrow() {
        const P = S.player, T = toolDef('lazo'), range = lazoRange(), tg = lazoTarget(range * 1.15), a = Math.atan2(P.fy, P.fx);  // un poco de tolerancia: lo que estaba en la mira al soltar
        const tx = tg ? tg.o.x : P.x + Math.cos(a) * range, ty = tg ? tg.o.y : P.y + Math.sin(a) * range;
        S.lazo = { st: 'go', t: 0, T: Math.max(.12, Math.hypot(tx - P.x, ty - P.y) / 900), tx, ty, tg };
        S.toolCD = T.cd; sfx(520, .18, 'sawtooth', .015, .4);
      }
      function updateLazo(dt) {
        const L = S.lazo, P = S.player; if (!L) return;
        L.t += dt;
        if (L.st === 'go') {
          if (L.tg) { L.tx = L.tg.o.x; L.ty = L.tg.o.y; }
          if (L.t >= L.T) {
            const o = L.tg && L.tg.o;
            if (o && !o.dead && !o.hidden) { L.st = 'pull'; L.t = 0; sfx(300, .12, 'square', .03, .5); addText(o.x, o.y - 24, '¡Enlazado!', '#e0b75a', true); }
            else { L.st = 'back'; L.t = 0; }
          }
        } else if (L.st === 'pull') {
          const o = L.tg.o;
          if (o.dead) { S.lazo = null; return; }
          const dx = P.x - o.x, dy = P.y - o.y, d = Math.hypot(dx, dy) || 1;
          if (L.tg.kind === 'mount') { if (d < 90 || L.t > .5) { S.lazo = null; if (!S.ride) startRide(o); } return; }
          if (d > 44) { const sp = Math.min(d - 40, 520 * dt); o.x += dx / d * sp; o.y += dy / d * sp; }
          L.tx = o.x; L.ty = o.y;
          if (L.t > .55) { if (L.tg.kind === 'fauna') o.stun = 2.2; else { o.slowT = 2.5; o.kx = 0; o.ky = 0; } S.lazo = null; }
        } else if (L.t > .2) S.lazo = null;
      }

      /* ---- fauna: grupos fijos por celda (semilla del campo), que rebrotan como los recursos ---- */
      const FAUNA = {
        tero: { name: 'tero', r: 7, spd: 0, hp: 0, flee: 150, hunt: false, n: [2, 3], where: ['estepa'] },
        piche: { name: 'piche', r: 8, spd: 26, run: 0, hp: 8, flee: 110, hunt: true, n: [1, 2], drop: { carne: 1 }, where: ['estepa', 'bosque'] },
        liebre: { name: 'liebre', r: 8, spd: 34, run: 250, hp: 6, flee: 190, hunt: true, n: [1, 2], drop: { carne: 1 }, where: ['estepa', 'bosque', 'glaciar'] },
        choique: { name: 'choique', r: 13, spd: 40, run: 230, hp: 20, flee: 230, hunt: true, n: [2, 3], drop: { carne: 2, cuero: 1 }, where: ['estepa'] },
        oveja: { name: 'oveja', r: 12, spd: 20, run: 70, hp: 0, flee: 90, hunt: false, n: [4, 6], where: ['estepa'] },
        vaca: { name: 'vaca', r: 18, spd: 16, run: 55, hp: 0, flee: 70, hunt: false, n: [2, 3], where: ['estepa', 'bosque'] }
      };
      const FAUNA_CELL = 640;
      function faunaGroup(ix, iy) {
        const sd = SAVE.campo.seed; if (hash(ix * 53 + sd, iy * 29 - sd) > .42) return null;
        const x = (ix + .25 + hash(ix * 7 + sd, iy * 3) * .5) * FAUNA_CELL, y = (iy + .25 + hash(ix * 5, iy * 11 + sd) * .5) * FAUNA_CELL;
        if (Math.hypot(x - CAMPO_HOME.x, y - CAMPO_HOME.y) < 240) return null;
        const bk = bioKey(x, y), opts = Object.keys(FAUNA).filter(k => FAUNA[k].where.includes(bk)); if (!opts.length) return null;
        const kind = opts[(hash(ix * 17 - sd, iy * 41) * opts.length) | 0], F = FAUNA[kind];
        return { key: 'f' + ix + ',' + iy, kind, x, y, n: F.n[0] + ((hash(ix, iy * 7 + sd) * (F.n[1] - F.n[0] + 1)) | 0) };
      }
      function teroGrito() { for (let i = 0; i < 4; i++) setTimeout(() => sfx(i % 2 ? 2300 : 2700, .06, 'square', .018, .7), i * 110); }
      function updateFauna(dt) {
        const P = S.player;
        S.faunaScan -= dt;
        if (S.faunaScan <= 0) {
          S.faunaScan = .6;
          const R = viewR() * 1.5, live = new Set(S.fauna.map(f => f.g));
          S.fauna = S.fauna.filter(f => !f.dead && Math.hypot(f.x - P.x, f.y - P.y) < R + 300);
          const x0 = Math.floor((P.x - R) / FAUNA_CELL), x1 = Math.floor((P.x + R) / FAUNA_CELL), y0 = Math.floor((P.y - R) / FAUNA_CELL), y1 = Math.floor((P.y + R) / FAUNA_CELL);
          for (let ix = x0; ix <= x1; ix++) for (let iy = y0; iy <= y1; iy++) {
            const g = faunaGroup(ix, iy); if (!g || live.has(g.key) || nodeTaken(g.key) || Math.hypot(g.x - P.x, g.y - P.y) > R) continue;
            const F = FAUNA[g.kind];
            for (let i = 0; i < g.n; i++) S.fauna.push({ g: g.key, kind: g.kind, x: g.x + rnd(-45, 45), y: g.y + rnd(-30, 30), vx: 0, vy: 0, face: Math.random() < .5 ? -1 : 1, t: rnd(0, 3), hp: F.hp, r: F.r, ph: Math.random() * TAU, stun: 0, hidden: 0, wx: 0, wy: 0 });
          }
        }
        const fast = Math.hypot(P.vx, P.vy) > 110 || !!S.ride || P.dashT > 0;
        for (const f of S.fauna) {
          if (f.dead) continue;
          const F = FAUNA[f.kind], dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy) || 1;
          f.t -= dt;
          if (f.flying) { f.x += f.vx * dt; f.y += f.vy * dt; f.alt += dt * 46; f.ph += dt * 18; if (f.alt > 140) f.dead = true; continue; }
          if (f.stun > 0) { f.stun -= dt; f.vx *= .85; f.vy *= .85; continue; }
          if (f.kind === 'tero') {
            if (d < F.flee || (fast && d < F.flee * 1.6)) { f.flying = true; f.alt = 0; f.vx = dx / d * 150 + rnd(-40, 40); f.vy = dy / d * 150 - 30; if (!S.teroT || S.t - S.teroT > 2.5) { S.teroT = S.t; teroGrito(); } }
            continue;
          }
          if (f.kind === 'piche') {
            if (f.hidden > 0) { f.hidden -= dt; continue; }
            if (d < F.flee && fast) { f.hidden = rnd(5, 8); burst(f.x, f.y + 4, 8, '#8a7b5a', 60); continue; }
          }
          let tvx = 0, tvy = 0;
          if (d < F.flee && F.run) {
            const z = f.kind === 'liebre' || f.kind === 'choique' ? Math.sin(S.t * 6 + f.ph * 3) * .7 : 0, ux = dx / d, uy = dy / d;
            tvx = (ux - uy * z) * F.run; tvy = (uy + ux * z) * F.run; f.t = rnd(1, 2);
          } else if (f.t <= 0) {
            f.t = rnd(1.5, 4); if (Math.random() < .45) f.wx = f.wy = 0; else { const a = Math.random() * TAU; f.wx = Math.cos(a) * F.spd; f.wy = Math.sin(a) * F.spd; }
          } else { tvx = f.wx; tvy = f.wy; }
          const k = Math.min(1, 6 * dt); f.vx += (tvx - f.vx) * k; f.vy += (tvy - f.vy) * k;
          f.x += f.vx * dt; f.y += f.vy * dt; if (Math.abs(f.vx) > 4) f.face = f.vx > 0 ? 1 : -1;
          const sp = Math.hypot(f.vx, f.vy); f.ph += dt * (sp > 5 ? 4 + sp * .05 : 0);
          pushOut(f, f.r, 200 * dt);
        }
      }
      function faunaHit(f, T) {
        const F = FAUNA[f.kind];
        if (!F.hunt) { f.stun = .4; if (!S.ajenaTip) { S.ajenaTip = true; banner('Esa ' + (f.kind === 'vaca' ? 'vaca' : 'oveja') + ' tiene dueño: dejala pastar'); } return; }
        f.hp -= T.dmg; f.stun = .3; f.flash = .12; burst(f.x, f.y, 5, '#b8483a', 70); sfx(420, .05, 'square', .02, .6);
        if (f.hp > 0) return;
        f.dead = true; S.campoTaken.add(f.g);
        const got = [];
        for (const [m, v0] of Object.entries(F.drop)) { const v = v0 + (m === 'carne' ? (T.carne || 0) : 0); S.mat[m] = (S.mat[m] || 0) + v; got.push(`+${v} ${MATS[m].name}`); }
        addText(f.x, f.y - 22, got.join('  '), MATS.carne.col, true); sfx(620, .07, 'triangle', .04); setTimeout(() => sfx(930, .1, 'triangle', .04), 70);
      }
      function updateKit(dt) {
        S.toolCD -= dt;
        if (S.swing) { S.swing.t += dt; if (S.swing.t > S.swing.T) S.swing = null; }
        if (S.toolHeld && S.tool && S.tool !== 'lazo') toolSwing();
        if (S.aim) S.aim.t += dt;
        updateLazo(dt); updateFauna(dt);
      }

      /* ---- sprites: herramientas y fauna de perfil (mirando a la derecha) ---- */
      const KIT_SPR = {}, TOOL_URL = {};
      const kitSpr = (key, size, fn) => KIT_SPR[key] || (KIT_SPR[key] = pixSprite(size, 1, fn));
      function toolSprite(id) {
        const lv = toolLv(id);
        return kitSpr('t_' + id + lv, 24, b => {
          if (id === 'cuchillo') {
            b.line([[-7, 6], [-2, 1]], 2.6, lv > 1 ? '#5a3a22' : '#e8e0c8'); b.rect(-2.5, -.5, 2.5, 2.5, '#c9a45c');
            b.poly([[0, 0], [7.5, -7], [8.5, -6.5], [2, 2]], lv > 1 ? '#c8d0dc' : '#d8d0b8'); b.line([[1, -.2], [7.6, -6.6]], .5, '#ffffff', 1);
          } else if (id === 'hacha') {
            b.line([[-6, 8], [4, -6]], 1.8, '#6a4a2a');
            b.poly([[1, -8], [7, -6], [8, -1], [3, -2]], '#9aa4b4'); b.line([[7, -6], [8, -1]], .6, '#eef2f8', 1);
          } else {
            for (let i = 0; i < 3; i++) b.ell(-1 + i * .6, 1 - i * .4, 6 - i * 1.4, 4.4 - i, '#b0703e');
            for (let i = 0; i < 3; i++) b.ell(-1 + i * .6, 1 - i * .4, 4.6 - i * 1.4, 3 - i, '#1a1410', 1);
            b.line([[4, 4], [8, 8]], 1.2, '#b0703e');
          }
        });
      }
      const toolURL = id => { const k = id + toolLv(id); return TOOL_URL[k] || (TOOL_URL[k] = toolSprite(id).img.toDataURL()); };
      function faunaSpr(kind, fr) {
        return kitSpr('f_' + kind + fr, kind === 'vaca' ? 56 : kind === 'choique' ? 52 : 34, b => {
          const st = fr ? 1 : -1, L = (x, y0, len, col, w) => { b.line([[x, y0], [x + st * 1.2, y0 + len]], w || 1.3, col); };
          if (kind === 'tero') {
            if (fr === 2) { b.poly([[-9, -3], [0, -1], [9, -3], [2, 1], [-2, 1]], '#5a5048'); b.poly([[-9, -3], [-5, -2], [-7, -1]], '#1a1a1a'); b.poly([[9, -3], [5, -2], [7, -1]], '#1a1a1a'); b.ell(0, 0, 3, 1.6, '#e8e4dc'); b.ell(3, -1, 1.4, 1.2, '#7a7068'); return; }
            L(-1, 2, 6, '#c86a7a', .8); L(1.5, 2, 6, '#c86a7a', .8);
            b.ell(0, 0, 4.4, 2.6, '#6a6058'); b.ell(.5, 1.2, 3.2, 1.4, '#ece8e0'); b.rect(1.6, -1.6, 2.2, 2.6, '#1a1a1a');
            b.ell(3.6, -3, 1.8, 1.6, '#8a8078'); b.dot(4.1, -3.3, '#d8323a', 1); b.line([[5.2, -2.8], [6.8, -2.6]], .7, '#c86a7a', 1); b.line([[2.4, -4.2], [.4, -6]], .5, '#1a1a1a', 1);
          } else if (kind === 'piche') {
            L(-3, 2, 2.4, '#5a4a38', 1.2); L(3, 2, 2.4, '#5a4a38', 1.2);
            b.ell(0, -.5, 6, 4, '#a08a64'); for (let i = -2; i <= 2; i++) b.line([[i * 1.9, -4.2], [i * 1.9, 3]], .6, '#6a5a40', 1);
            b.ell(6.2, 1, 2.2, 1.6, '#c8a87a'); b.dot(7, .5, '#1a1410', 1); b.poly([[5.2, -1], [5.8, -3.4], [6.6, -1]], '#c8a87a'); b.line([[-5.8, 1], [-8.2, 2.6]], 1, '#a08a64');
          } else if (kind === 'liebre') {
            L(-3, 2, 3, '#7a6a50', 1.5); L(3, 2, 3, '#7a6a50', 1.3);
            b.ell(-.5, 0, 6.2, 3.4, '#8a7a5e'); b.ell(0, 1.6, 4, 1.4, '#bba98a'); b.ell(-6.4, -.4, 1.4, 1.4, '#ffffff');
            b.ell(5.4, -2.4, 2.6, 2.2, '#8a7a5e'); b.dot(6.4, -2.8, '#1a1410', 1);
            b.line([[4.6, -4], [3.2, -10]], 1.3, '#8a7a5e'); b.line([[5.6, -4], [5.2, -9.6]], 1.2, '#7a6a50');
          } else if (kind === 'choique') {
            L(-1.5, 3, 12, '#6a6058', 1.6); L(2, 3, 12, '#5a5048', 1.6);
            b.ell(0, 0, 9, 6, '#7a7268'); b.tex('#7a7268', (x, y) => hash(x * 3, y * 5) < .2 ? [96, 90, 82] : null); b.ell(-7, -1, 3, 2.6, '#8a8278');
            b.line(qb([6, -3], [9, -9], [9, -17], 5), 1.8, '#8a8278'); b.ell(9.6, -17.5, 2, 1.6, '#8a8278'); b.dot(10.4, -18, '#1a1410', 1); b.line([[11.4, -17.4], [13, -17]], .8, '#3a3430', 1);
          } else if (kind === 'oveja') {
            L(-3.5, 3, 4.5, '#2a2420', 1.3); L(3.5, 3, 4.5, '#2a2420', 1.3);
            for (const [x, y] of [[-3, -1], [1, -2], [3.5, 0], [-1, 1.4], [-4.5, 1]]) b.ell(x, y, 3.6, 3, '#e8e2d4');
            b.tex('#e8e2d4', (x, y) => hash(x * 5, y * 3) < .25 ? [200, 194, 180] : null);
            b.ell(7, -2, 2.4, 2, '#3a322c'); b.dot(7.8, -2.4, '#d8d0c0', 1); b.ell(5.6, -3.6, 1.2, .7, '#3a322c');
          } else {
            L(-7, 4, 8, '#3a2a20', 2.2); L(-4, 4, 8, '#4a3a2a', 2.2); L(6, 4, 8, '#3a2a20', 2.2); L(9, 4, 8, '#4a3a2a', 2.2);
            b.ell(0, 0, 13, 7.4, '#7a4a2a'); for (const [x, y, rx] of [[-4, -1, 4], [5, 2, 3.4], [-8, 3, 2.4]]) b.ell(x, y, rx, rx * .8, '#e8e0d0');
            b.line([[-13, -2], [-15, 6]], .9, '#5a3a22'); b.ell(14.5, -4, 4, 3.6, '#7a4a2a'); b.ell(17, -2.6, 2, 1.8, '#d8b0a0');
            b.dot(15, -5.4, '#1a1410', 1); b.line([[13, -7.5], [11.6, -10]], .9, '#e8e0d0', 1); b.line([[15.6, -7.5], [17.2, -9.6]], .9, '#e8e0d0', 1);
          }
        });
      }
      function drawFauna(vis) {
        for (const f of S.fauna) {
          if (f.dead || !vis(f.x, f.y)) continue;
          if (f.kind === 'piche' && f.hidden > 0) { cx.fillStyle = '#4a3e2c'; cx.beginPath(); cx.ellipse(f.x, f.y + 5, 7, 3, 0, 0, TAU); cx.fill(); continue; }
          const alt = f.alt || 0;
          cx.fillStyle = `rgba(0,0,0,${f.flying ? .18 : .28})`; cx.beginPath(); cx.ellipse(f.x, f.y + f.r * .8, f.r * .9, f.r * .3, 0, 0, TAU); cx.fill();
          const fr = f.flying ? 2 : Math.sin(f.ph) > 0 ? 1 : 0, s = faunaSpr(f.kind, fr);
          cx.save(); cx.translate(f.x, f.y - alt); cx.scale(f.face, 1);
          if (f.flying && Math.sin(f.ph) < 0) cx.scale(1, .6);
          cx.drawImage(s.img, -s.size / 2, -s.size / 2, s.size, s.size); cx.restore();
          if (f.stun > 0 && !f.flying && FAUNA[f.kind].hunt) { cx.fillStyle = '#e0b75a'; for (let i = 0; i < 3; i++) { const a = S.t * 5 + i * 2.1; cx.fillRect(f.x + Math.cos(a) * 8 - 1, f.y - f.r - 8 + Math.sin(a) * 2, 2, 2); } }
        }
      }
      /* lo que va encima de todo: el golpe, el lazo y la mira */
      function drawKitTop() {
        const P = S.player, sw = S.swing;
        if (sw) {
          const k = sw.t / sw.T, a0 = sw.a - sw.arc / 2 + sw.arc * k * .2;
          cx.strokeStyle = sw.big ? `rgba(255,220,160,${.75 * (1 - k)})` : `rgba(240,244,255,${.8 * (1 - k)})`; cx.lineWidth = sw.big ? 5 : 3;
          cx.beginPath(); cx.arc(P.x, P.y, sw.r * (.75 + .25 * k), a0, a0 + sw.arc * (.4 + .6 * k)); cx.stroke();
        }
        if (S.aim) {
          const R = lazoRange(), a = Math.atan2(P.fy, P.fx), tg = lazoTarget(R);
          cx.setLineDash([5, 6]); cx.strokeStyle = 'rgba(224,183,90,.55)'; cx.lineWidth = 1.5;
          cx.beginPath(); cx.moveTo(P.x, P.y); cx.lineTo(P.x + Math.cos(a) * R, P.y + Math.sin(a) * R); cx.stroke(); cx.setLineDash([]);
          cx.beginPath(); cx.arc(P.x, P.y, R, a - .62, a + .62); cx.stroke();
          if (tg) { const o = tg.o, rr = (o.r || 14) + 8 + Math.sin(S.t * 10) * 2; cx.strokeStyle = '#e0b75a'; cx.lineWidth = 2; cx.beginPath(); cx.arc(o.x, o.y, rr, 0, TAU); cx.stroke(); }
        }
        const L = S.lazo;
        if (L) {
          const k = L.st === 'go' ? clamp(L.t / L.T, 0, 1) : L.st === 'back' ? 1 - clamp(L.t / .2, 0, 1) : 1;
          const ex = P.x + (L.tx - P.x) * k, ey = P.y + (L.ty - P.y) * k, mx = (P.x + ex) / 2, my = (P.y + ey) / 2 - (L.st === 'go' ? 26 * Math.sin(k * Math.PI) : 0);
          cx.strokeStyle = '#c8955a'; cx.lineWidth = 1.8; cx.beginPath(); cx.moveTo(P.x, P.y - 4); cx.quadraticCurveTo(mx, my, ex, ey); cx.stroke();
          cx.beginPath(); cx.ellipse(ex, ey, 9, 6, 0, 0, TAU); cx.stroke();
        }
      }
      /* botones táctiles */
      $('toolBtn').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toolDown(); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) $('toolBtn').addEventListener(ev, e => { e.preventDefault(); toolUp(); });
      $('toolSw').addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); toolNext(); });
