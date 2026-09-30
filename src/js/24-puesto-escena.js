      /* =====================================================================
         ESCENA DEL PUESTO (fija, caminable)
         ===================================================================== */
      const PUW = 640, PUH = 400, PU_TOP = 78;
      const PU_INT = {
        nire: { x: 118, y: 190, r: 72, label: 'Ñire de las habilidades' },
        rancho: { x: 320, y: 152, r: 72, label: 'Rancho: obras y trofeos' },
        carreta: { x: 548, y: 150, r: 68, label: 'Almacén del pulpero' },
        fogon: { x: 320, y: 262, r: 44, label: 'Fogón: aguantar la noche' },
        fragua: { x: 132, y: 318, r: 68, label: 'Fragua' },
        corral: { x: 514, y: 306, r: 104, label: 'Corral' },
        tranquera: { x: 320, y: 366, r: 40, label: 'Tranquera: recorrer el campo' },
        perro: { x: 378, y: 300, r: 34, label: 'Acariciar al perro' }
      };
      const PU_SOLID = [[262, 180, 3], [196, 300, 3], [420, 222, 3], [364, 372, 3], [294, 376, 4], [346, 376, 4], [320, 120, 60], [118, 168, 18], [548, 132, 40], [320, 256, 22], [132, 302, 32], [90, 330, 14], [380, 302, 12], [214, 206, 14], [352, 278, 6], [162, 190, 8]];
      const CORRAL = { x: 440, y: 236, w: 148, h: 142 };
      function enterPuesto() {
        viaPuesto = false; initAudio();
        hide('startOv');
        PU = { x: 320, y: 326, vx: 0, vy: 0, face: 1, moving: false, t: 0, ui: null, near: null, embers: [], horses: [], fx: [], em: {}, pet: 0, wind: 0, seed: Math.random() * 1000 };
        puSyncHorses();
        $('puHud').classList.add('on'); puHudUpdate();
        if (!SAVE.puTip) { SAVE.puTip = 1; writeSave(); banner('Tu puesto. Acercate a cada lugar y tocá E para usarlo'); }
      }
      function exitPuesto(view) {
        viaPuesto = view === 'vChars'; PU = null; keys.clear(); joy = null;
        $('puHud').classList.remove('on'); $('puPrompt').classList.remove('on'); hide('puOv');
        show('startOv'); go(view || 'vMain');
      }
      function puSyncHorses() {
        const old = PU.horses; PU.horses = SAVE.horses.map((h, i) => {
          const o = old[i]; return o && o.pelaje === h.pelaje ? Object.assign(o, h, { idx: i }) :
            Object.assign({}, h, { idx: i, x: CORRAL.x + 30 + Math.random() * (CORRAL.w - 60), y: CORRAL.y + 30 + Math.random() * (CORRAL.h - 50), vx: 0, vy: 0, tx: 0, ty: 0, wT: 0, face: 1, wob: Math.random() * TAU });
        });
      }
      function puHudUpdate() {
        $('puChips').innerHTML = `<div class="chip gold">${ICON_ORO}<span>${SAVE.gold.toLocaleString('es-AR')}</span></div>` +
          MAT_KEYS.map(m => `<div class="chip">${matIco(m)}<b>${SAVE.mat[m]}</b></div>`).join('') +
          `<div class="chip fama">${famaIco}<b>${SAVE.fama}</b></div>`;
      }
      function puUpdate(dt) {
        const P = PU; P.t += dt; if (P.pet > 0) P.pet -= dt; if (P.gateT > 0) P.gateT -= dt;
        if (!P.ui) {
          const [ix, iy] = inputVec(), l = Math.hypot(ix, iy), sp = 135;
          P.moving = l > .05; if (P.moving && Math.abs(ix) > .1) P.face = ix > 0 ? 1 : -1;
          const k = Math.min(1, 20 * dt); P.vx += (ix * sp - P.vx) * k; P.vy += (iy * sp - P.vy) * k;
        } else { P.vx *= .8; P.vy *= .8; P.moving = false; }
        P.x += P.vx * dt; P.y += P.vy * dt;
        P.x = clamp(P.x, 24, PUW - 24); P.y = clamp(P.y, PU_TOP + 70, PUH - 8);
        for (const [x, y, r] of PU_SOLID) { const dx = P.x - x, dy = P.y - y, d = Math.hypot(dx, dy) || 1, m = r + 10; if (d < m) { P.x = x + dx / d * m; P.y = y + dy / d * m; } }
        if (SAVE.puesto.corral > 0) {
          const c = CORRAL; if (P.x > c.x - 8 && P.x < c.x + c.w + 8 && P.y > c.y - 6 && P.y < c.y + c.h + 8) {
            const dl = P.x - (c.x - 8), dr = c.x + c.w + 8 - P.x, dt_ = P.y - (c.y - 6), db = c.y + c.h + 8 - P.y, m = Math.min(dl, dr, dt_, db);
            if (m === dl) P.x = c.x - 8; else if (m === dr) P.x = c.x + c.w + 8; else if (m === dt_) P.y = c.y - 6; else P.y = c.y + c.h + 8;
          }
        }
        let best = null, bd = 1e9;
        for (const k in PU_INT) { const o = PU_INT[k], d = Math.hypot(P.x - o.x, P.y - o.y) / o.r; if (d < 1 && d < bd) { bd = d; best = k; } }
        if (best !== P.near) { P.near = best; const b = $('puPrompt'); b.classList.toggle('on', !!best && !P.ui); if (best) b.innerHTML = `<kbd>E</kbd> ${PU_INT[best].label}`; }
        if (P.ui) $('puPrompt').classList.remove('on'); else if (P.near) $('puPrompt').classList.add('on');
        // caballos del corral
        const c = CORRAL;
        for (const h of P.horses) {
          h.wT -= dt;
          if (h.wT <= 0) { h.wT = rnd(2, 5); if (Math.random() < .5) { h.tx = h.x; h.ty = h.y; } else { h.tx = c.x + 26 + Math.random() * (c.w - 52); h.ty = c.y + 28 + Math.random() * (c.h - 46); } }
          const dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy), s = d > 4 ? 28 : 0;
          h.vx = d > 4 ? dx / d * s : 0; h.vy = d > 4 ? dy / d * s : 0; h.x += h.vx * dt; h.y += h.vy * dt; if (Math.abs(h.vx) > 3) h.face = h.vx > 0 ? 1 : -1;
        }
        if (Math.random() < dt * 10) P.embers.push({ x: rnd(-7, 7), y: -10, vx: rnd(-8, 8), vy: rnd(-45, -24), l: rnd(1, 2.2), m: 2.2 });
        for (const e of P.embers) { e.l -= dt; e.x += e.vx * dt + Math.sin(P.t * 3 + e.y) * .2; e.y += e.vy * dt; }
        P.embers = P.embers.filter(e => e.l > 0);
      }
      function puInteract() {
        if (!PU || PU.ui || !PU.near) return;
        const k = PU.near; sfx(660, .06, 'triangle', .03);
        if (k === 'tranquera') { PU.gateT = .6; PU.ui = 'salida'; sfx(180, .35, 'sawtooth', .02, .7); setTimeout(() => { if (PU && PU.ui === 'salida') { PU = null; keys.clear(); joy = null; $('puHud').classList.remove('on'); $('puPrompt').classList.remove('on'); hide('puOv'); startCampo(); } }, 380); return; }
        if (k === 'perro') { PU.pet = 1.6; for (let i = 0; i < 4; i++) PU.fx.push({ k: 'heart', x: 370 + i * 5, y: 286, vy: -18 - i * 4, ph: i, life: 1.2, max: 1.2 }); sfx(700, .06, 'square', .03, .8); setTimeout(() => sfx(560, .08, 'square', .03, .8), 120); return; }
        if (k === 'fogon') return exitPuesto('vChars');
        if (k === 'carreta') { PU.ui = 'shop'; show('startOv'); go('vShop'); return; }
        openPuPanel(k);
      }

