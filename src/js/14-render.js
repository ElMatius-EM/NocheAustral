      /* ---------------- render ---------------- */
      function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
      /* ---- dibujo en lote (rendimiento en móvil) ----
         Con cientos de enemigos, partículas y números, lo que más cuesta no es la lógica sino la cantidad de llamadas al canvas
         (save/restore, cambios de globalAlpha, fill sueltos, texto). Estas ayudas las agrupan o las reemplazan por drawImage. */
      let BM = null;  // matriz del mundo en el frame actual (DPR · ZOOM · cámara); null fuera de drawWorld
      // pone la transformación de un objeto en (x, y) sin save/restore: una llamada en vez de cuatro
      function wSet(x, y, sx, sy, rot) {
        const A = BM.a, X = A * x + BM.e, Y = A * y + BM.f;
        if (rot) { const c = Math.cos(rot), s = Math.sin(rot); cx.setTransform(A * c * sx, A * s * sx, -A * s * sy, A * c * sy, X, Y); }
        else cx.setTransform(A * sx, 0, 0, A * sy, X, Y);
        _tfd = true;
      }
      let _tfd = false;
      function wDirty() { _tfd = true; }
      function wReset() { if (_tfd) { cx.setTransform(BM); _tfd = false; } }
      // estado del contexto con caché: no se reasigna si no cambió
      let _ga = 1, _sm = true;
      function gA(a) { if (a !== _ga) { _ga = a; cx.globalAlpha = a; } }
      function gSm(v) { if (v !== _sm) { _sm = v; cx.imageSmoothingEnabled = v; } }
      function gReset() { _ga = 1; _sm = true; cx.globalAlpha = 1; cx.imageSmoothingEnabled = true; }
      function gSync() { _ga = cx.globalAlpha; _sm = cx.imageSmoothingEnabled; }
      // agrupador: junta elementos por clave (color + opacidad cuantizada) para hacer un solo fill por grupo
      function mkBatch() {
        const m = new Map(), used = [];
        return {
          add(key, col, a, item) { let g = m.get(key); if (!g) { if (m.size > 300) { m.clear(); used.length = 0; } g = { col, a, l: [] }; m.set(key, g); } if (!g.l.length) used.push(g); g.l.push(item); },
          each(fn) { for (const g of used) { fn(g); g.l.length = 0; } used.length = 0; }
        };
      }
      const PART_B = mkBatch(), MARK_B = mkBatch(), GLOW_B = mkBatch(), RING_B = mkBatch();
      // punto con resplandor pre-horneado (reemplaza dos arc + dos fill por partícula)
      const DOT_SPR = new Map();
      function dotSpr(col) {
        let c = DOT_SPR.get(col); if (c) return c;
        c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d');
        g.fillStyle = col; g.globalAlpha = .25; g.beginPath(); g.arc(16, 16, 16, 0, TAU); g.fill();
        g.globalAlpha = 1; g.beginPath(); g.arc(16, 16, 6.5, 0, TAU); g.fill();
        DOT_SPR.set(col, c); return c;
      }
      // zonas (pava, fuego, remolino): degradado radial horneado una vez por tipo
      const ZONE_SPR = {};
      function zoneSpr(kind) {
        if (ZONE_SPR[kind]) return ZONE_SPR[kind];
        const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 6.4, 64, 64, 64);
        const C = { fire: ['rgba(255,150,50,.6)', 'rgba(255,90,30,.05)'], pull: ['rgba(150,90,230,.55)', 'rgba(110,60,200,.08)'], ice: ['rgba(170,215,255,.45)', 'rgba(120,180,240,.08)'] }[kind];
        gr.addColorStop(0, C[0]); gr.addColorStop(1, C[1]); g.fillStyle = gr; g.beginPath(); g.arc(64, 64, 64, 0, TAU); g.fill();
        return ZONE_SPR[kind] = c;
      }
      // estela del facón horneada (antes: un createLinearGradient por cuchillo por frame)
      const TRAIL_SPR = {};
      function trailSpr(evo) {
        const k = evo ? 1 : 0; if (TRAIL_SPR[k]) return TRAIL_SPR[k];
        const c = document.createElement('canvas'); c.width = 64; c.height = 8; const g = c.getContext('2d'), gr = g.createLinearGradient(64, 0, 0, 0);
        gr.addColorStop(0, evo ? 'rgba(170,210,255,.7)' : 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
        g.strokeStyle = gr; g.lineWidth = 6.4; g.lineCap = 'round'; g.beginPath(); g.moveTo(60, 4); g.lineTo(4, 4); g.stroke();
        return TRAIL_SPR[k] = c;
      }
      /* ---- textos flotantes como imágenes ----
         fillText + strokeText (y cambiar cx.font) por cada número es de lo más caro en el canvas de un celular.
         Los números se arman con un atlas de dígitos: una sola imagen por color y tamaño, horneada a la escala real de
         pantalla (DPR · ZOOM), con los contornos en una fila y los rellenos en otra para que un contorno no pise el dígito
         de al lado. Los textos sueltos (+30, ¡Combo 50!) se cachean ya rasterizados. Hasta que carga Pixelify se usa texto normal. */
      const TXT_F = [[600, 13], [700, 16], [700, 19], [700, 24]], NUM_RE = /^[+-]?\d+$/, GLYPHS = '0123456789+-';
      let fontOK = false, TXT_K = 2, TXT_KEY = 0;
      function fontReady() { if (!fontOK) { try { fontOK = document.fonts.check(`600 13px "Pixelify Sans"`); } catch (e) { fontOK = true; } } return fontOK; }
      const DIGITS = new Map(), STR_SPR = new Map();
      function txtScale() {
        // escala de horneado = píxeles de pantalla por unidad de mundo, redondeada para no rehornear con cada cambio chico
        const k = Math.max(1, Math.round(DPR * ZOOM * 4) / 4);
        if (k !== TXT_KEY) { TXT_KEY = TXT_K = k; DIGITS.clear(); STR_SPR.clear(); }
      }
      function digitSet(col, fi) {
        const key = col + fi; let d = DIGITS.get(key); if (d) return d;
        const [wt, px] = TXT_F[fi], K = TXT_K, f = `${wt} ${px * K}px ${FONT}`, pad = Math.ceil(2 * K), c = document.createElement('canvas'), g = c.getContext('2d');
        g.font = f; const adv = {}, sx = {}; let x = 0;
        for (const ch of GLYPHS) { adv[ch] = g.measureText(ch).width; sx[ch] = x; x += Math.ceil(adv[ch]) + pad * 2; }
        const h = Math.ceil(px * 1.5 * K), by = Math.round(px * 1.1 * K);
        c.width = x; c.height = h * 2; g.font = f; g.textAlign = 'left'; g.lineWidth = 3 * K; g.strokeStyle = 'rgba(0,0,0,.75)'; g.fillStyle = col;
        for (const ch of GLYPHS) { g.strokeText(ch, sx[ch] + pad, by); g.fillText(ch, sx[ch] + pad, by + h); }
        d = { c, adv, sx, pad, h, by }; DIGITS.set(key, d); return d;
      }
      // número completo horneado en un canvas propio del texto (contornos y rellenos en una pasada):
      // se rearma solo si cambia el valor, el tamaño, el color o la escala; dibujarlo es un solo drawImage
      function numSpr(h, str, col, fi) {
        const key = TXT_KEY + '|' + fi + '|' + col + '|' + str;
        let c = h._c; if (c && c.key === key) return c;
        const D = digitSet(col, fi); let w = 0; for (let i = 0; i < str.length; i++) w += D.adv[str[i]];
        if (!c) c = h._c = document.createElement('canvas');
        c.width = Math.ceil(w) + D.pad * 2 + 1; c.height = D.h; // reasignar el tamaño también limpia
        const g = c.getContext('2d');
        for (let row = 0; row < 2; row++) {
          let gx = 0;
          for (let i = 0; i < str.length; i++) { const ch = str[i], sw = Math.ceil(D.adv[ch]) + D.pad * 2; g.drawImage(D.c, D.sx[ch], row * D.h, sw, D.h, gx, 0, sw, D.h); gx += D.adv[ch]; }
        }
        c.key = key; c.ox = w / 2 + D.pad; c.by = D.by; return c;
      }
      function drawTxt(str, x, y, col, fi, h) {
        const K = TXT_K;
        if (NUM_RE.test(str)) {
          if (h) { const c = numSpr(h, str, col, fi); cx.drawImage(c, x - c.ox / K, y - c.by / K, c.width / K, c.height / K); return; }
          const D = digitSet(col, fi); let w = 0; for (let i = 0; i < str.length; i++) w += D.adv[str[i]];
          for (let row = 0; row < 2; row++) {
            let gx = x - w / 2 / K;
            for (let i = 0; i < str.length; i++) {
              const ch = str[i], sw = Math.ceil(D.adv[ch]) + D.pad * 2;
              cx.drawImage(D.c, D.sx[ch], row * D.h, sw, D.h, gx - D.pad / K, y - D.by / K, sw / K, D.h / K);
              gx += D.adv[ch] / K;
            }
          }
          return;
        }
        const k = fi + col + str; let c = STR_SPR.get(k);
        if (!c) {
          if (STR_SPR.size > 250) STR_SPR.clear();
          const [wt, px] = TXT_F[fi], f = `${wt} ${px * K}px ${FONT}`, pad = Math.ceil(2 * K); c = document.createElement('canvas'); const g = c.getContext('2d');
          g.font = f; c.adv = g.measureText(str).width; c.width = Math.ceil(c.adv) + pad * 2; c.height = Math.ceil(px * 1.5 * K); c.pad = pad; c.by = Math.round(px * 1.1 * K);
          g.font = f; g.lineWidth = 3 * K; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText(str, pad, c.by); g.fillStyle = col; g.fillText(str, pad, c.by);
          STR_SPR.set(k, c);
        }
        cx.drawImage(c, x - c.adv / K / 2 - c.pad / K, y - c.by / K, c.width / K, c.height / K);
      }
      /* ---- decoración del suelo por zonas ----
         Pasto, piedras, juncos, flores y huesos salen de hashes y del ruido de humedad/bioma. Antes se recalculaba todo por
         matita en cada frame (~4,5 ms de JS en PC, 15+ ms en un celular). Ahora cada zona de 3x3 baldosas calcula su lista
         una sola vez. Con calidad reducida (gráficos bajos o resolución dinámica bajada) la zona además se hornea en una
         imagen y se dibuja con un solo drawImage (el pasto deja de mecerse; los brillos del agua siguen animados). */
      const DT = 96, DN = 3, DCH = DT * DN, DPAD = 24, DK = 1 / PXS, DCACHE = new Map();
      // en pantallas táctiles (celulares, tablets) la decoración va siempre horneada; en PC el pasto se mece
      const DECOR_LIVE = !matchMedia('(pointer: coarse)').matches;
      let dBaked = 0;
      function decorChunk(ci, cj) {
        const key = ci * 100003 + cj; let C = DCACHE.get(key); if (C) return C;
        const items = [], glints = [];
        for (let tx = ci * DN; tx < ci * DN + DN; tx++) for (let ty = cj * DN; ty < cj * DN + DN; ty++) {
          const bk = bioKey((tx + .5) * DT, (ty + .5) * DT), ice = MAPS[bk].decor === 'ice', D = decorSpr(bk), V = vivoSpr(bk);
          for (let k = 0; k < 3; k++) {
            const h1 = hash(tx * 3 + k, ty * 7 - k), h2 = hash(tx * 5 - k, ty * 3 + k * 11), h3 = hash(tx + k * 17, ty - k * 5);
            const x = tx * DT + h1 * DT, y = ty * DT + h2 * DT;
            if (terrWet(x, y)) {
              if (ice) { if (h3 < .25) items.push({ t: 0, s: V.drift, x, y, a: 1 }); }
              else if (h3 < .5) items.push({ t: 1, s: V.reed[(h2 * 2) | 0], x: x + 3, y: y - 4, ph: h1, amp: 1.3 });
              else if (h3 < .62) glints.push({ s: V.glint, x, y, ph: h1 });
              continue;
            }
            if (h3 < .6) { if (ice) { if (h3 < .3) items.push({ t: 0, s: D.crack[k & 1], x: x + 8, y: y + 3, a: 1 }); } else items.push({ t: 1, s: D.tuft[(h2 * 3) | 0], x: x + 3, y: y - 3, ph: h1, amp: 1 }); }
            else if (h3 < .85) items.push({ t: 0, s: D.stone[Math.min(2, (h1 * 3) | 0)], x, y, a: 1 });
            else if (h3 < .97) items.push({ t: 0, s: ice ? D.patch : D.flower, x, y: y + 2, a: 1 });
            else items.push({ t: 0, s: D.bone, x, y: y + 1, a: ice ? .5 : 1 });
          }
        }
        C = { items, glints, baked: null, x0: ci * DCH, y0: cj * DCH };
        if (DCACHE.size > 140) { const k0 = DCACHE.keys().next().value, o = DCACHE.get(k0); if (o.baked) dBaked--; DCACHE.delete(k0); }
        DCACHE.set(key, C); return C;
      }
      function bakeDecor(C) {
        const n = Math.ceil((DCH + DPAD * 2) * DK), c = document.createElement('canvas'); c.width = c.height = n;
        const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(DK, 0, 0, DK, (DPAD - C.x0) * DK, (DPAD - C.y0) * DK);
        for (const it of C.items) { const z = it.s.size; g.globalAlpha = it.a || 1; g.drawImage(it.s.img, it.x - z / 2, it.y - z / 2, z, z); }
        C.baked = c; dBaked++;
        // con muchas zonas horneadas en memoria, se sueltan las imágenes más viejas (la lista se conserva)
        if (dBaked > 70) for (const o of DCACHE.values()) { if (o.baked && o !== C) { o.baked = null; dBaked--; if (dBaked <= 60) break; } }
      }
      function drawGround(px, py) {
        const hw = W / 2 / ZOOM + DT, hh = H / 2 / ZOOM + DT;
        if (!S) { drawGroundStatic(px, py); return; }
        drawTerrain(px, py);
        const low = GFX_LOW || RES_K < 1 || !DECOR_LIVE, bx = W / 2 / ZOOM + 40, by = H / 2 / ZOOM + 40;
        const c0 = Math.floor((px - hw) / DCH), c1 = Math.floor((px + hw) / DCH), r0 = Math.floor((py - hh) / DCH), r1 = Math.floor((py + hh) / DCH);
        let bakes = 0;
        for (let ci = c0; ci <= c1; ci++) for (let cj = r0; cj <= r1; cj++) {
          const C = decorChunk(ci, cj);
          if (low) {
            if (!C.baked && bakes++ < 2) bakeDecor(C);
            if (C.baked) { cx.imageSmoothingEnabled = false; cx.drawImage(C.baked, C.x0 - DPAD, C.y0 - DPAD, C.baked.width / DK, C.baked.height / DK); cx.imageSmoothingEnabled = true; }
            else for (const it of C.items) { if (it.a !== 1 && it.a) cx.globalAlpha = it.a; dimg(it.s, it.x, it.y); cx.globalAlpha = 1; }
          } else {
            for (const it of C.items) {
              if (Math.abs(it.x - px) > bx || Math.abs(it.y - py) > by) continue;
              if (it.t === 1) swayDraw(it.s, it.x, it.y, it.ph, it.amp);
              else { if (it.a !== 1) cx.globalAlpha = it.a; dimg(it.s, it.x, it.y); if (it.a !== 1) cx.globalAlpha = 1; }
            }
          }
          for (const gl of C.glints) {
            if (Math.abs(gl.x - px) > bx || Math.abs(gl.y - py) > by) continue;
            cx.globalAlpha = .2 + .5 * Math.max(0, Math.sin(S.t * 2.2 + gl.ph * 40)); dimg(gl.s, gl.x, gl.y);
          }
          cx.globalAlpha = 1;
        }
      }
      // título y Puesto (sin partida): misma decoración de estepa, cálculo directo como antes
      function drawGroundStatic(px, py) {
        const T = DT, hw = W / 2 / ZOOM + T, hh = H / 2 / ZOOM + T, D = decorSpr('estepa');
        const tx0 = Math.floor((px - hw) / T), tx1 = Math.floor((px + hw) / T), ty0 = Math.floor((py - hh) / T), ty1 = Math.floor((py + hh) / T);
        for (let tx = tx0; tx <= tx1; tx++) for (let ty = ty0; ty <= ty1; ty++) for (let k = 0; k < 3; k++) {
          const h1 = hash(tx * 3 + k, ty * 7 - k), h2 = hash(tx * 5 - k, ty * 3 + k * 11), h3 = hash(tx + k * 17, ty - k * 5), x = tx * T + h1 * T, y = ty * T + h2 * T;
          if (h3 < .6) swayDraw(D.tuft[(h2 * 3) | 0], x + 3, y - 3, h1, 1);
          else if (h3 < .85) dimg(D.stone[Math.min(2, (h1 * 3) | 0)], x, y);
          else if (h3 < .97) dimg(D.flower, x, y + 2);
          else dimg(D.bone, x, y + 1);
        }
      }
      function drawObstacle(o) { dimg(obsSprite(o), o.x, o.y); }
      function drawWeather(dt) {
        const w = S.weather, k = w.k || 0, vent = w.type === 'ventisca', rain = w.type === 'lluvia', st = S.streaks, want = vent ? 170 : rain ? 140 : 70;
        if (rain) cx.fillStyle = `rgba(20,30,40,${.18 * k})`, cx.fillRect(0, 0, W, H);
        while (st.length < want) st.push({ x: Math.random() * W, y: Math.random() * H, l: rnd(12, 42), v: rnd(.7, 1.3) });
        if (vent) { const g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .14, W / 2, H / 2, Math.max(W, H) * .62); g.addColorStop(0, 'rgba(205,222,240,0)'); g.addColorStop(1, `rgba(205,222,240,${.88 * k})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
        const sp = vent ? 520 : rain ? 900 : 720, mv = S.state === 'play' ? dt : 0;
        cx.strokeStyle = vent ? `rgba(248,252,255,${.85 * k})` : rain ? `rgba(170,200,225,${.45 * k})` : `rgba(225,212,178,${.4 * k})`; cx.lineWidth = vent ? 2.6 : rain ? 1.2 : 1.5; cx.lineCap = 'round'; cx.beginPath();
        for (const p of st) {
          p.x += w.dx * sp * p.v * mv; p.y += w.dy * sp * p.v * mv + (vent ? 45 * mv : 0);
          if (p.x < -60) p.x += W + 120; else if (p.x > W + 60) p.x -= W + 120;
          if (p.y < -60) p.y += H + 120; else if (p.y > H + 60) p.y -= H + 120;
          const L = vent ? 3 : rain ? p.l * .7 : p.l; cx.moveTo(p.x, p.y); cx.lineTo(p.x - w.dx * L, p.y - w.dy * L);
        }
        cx.stroke(); cx.lineCap = 'butt';
      }
      function drawGhosts() {
        for (const g of S.ghosts) {
          const PS = PSPR[S.char], sz = PS.size;
          cx.globalAlpha = g.life / .22 * .45; cx.save(); cx.translate(g.x, g.y); cx.scale(g.face, 1); cx.drawImage(PS.sil, -sz / 2, -sz / 2, sz, sz); cx.restore();
        }
        cx.globalAlpha = 1;
      }
      function drawPlayer(P) {
        const ch = CHARS[S.char], t = S.t, bob = P.moving ? Math.sin(t * 14) * 1.5 : 0, step = P.moving ? Math.sin(t * 14) : 0;
        cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(P.x, P.y + 13, 11, 4, 0, 0, TAU); cx.fill();
        if (P.dashCD > 0) {
          const f = 1 - clamp(P.dashCD / dashCooldown(), 0, 1);
          cx.strokeStyle = 'rgba(201,164,92,.55)'; cx.lineWidth = 2; cx.beginPath(); cx.ellipse(P.x, P.y + 13, 15, 6, 0, -Math.PI / 2, -Math.PI / 2 + TAU * f); cx.stroke();
        } else { cx.strokeStyle = 'rgba(201,164,92,.9)'; cx.lineWidth = 1.5; cx.beginPath(); cx.ellipse(P.x, P.y + 13, 15, 6, 0, 0, TAU); cx.stroke(); }
        if (P.iframe > 0 && P.dashT <= 0 && Math.floor(t * 30) % 2 === 0) cx.globalAlpha = .5;
        cx.save(); cx.translate(P.x, P.y + bob); cx.scale(P.face, 1); if (S.tumble > 0) cx.rotate((1 - S.tumble / .5) * TAU);
        { const PS = PSPR[S.char], fr = PS.frames[P.moving ? 1 + (((t * 8.9) | 0) % 4) : 0], sz = PS.size; cx.drawImage(fr, -sz / 2, -sz / 2, sz, sz); }
        if (P.atkT > 0) {
          const k = 1 - P.atkT / P.atkMax, sw = P.atkDir, e = 1 - Math.pow(1 - Math.min(1, k * 2.4), 3), base = -2.5 + 2.9 * e, ang = sw > 0 ? base : Math.PI - base, sx = sw > 0 ? 5 : -5;
          const hx = sx + Math.cos(ang) * 9, hy = -1 + Math.sin(ang) * 9;
          cx.lineCap = 'round'; cx.strokeStyle = '#0c1120'; cx.lineWidth = 5.5; cx.beginPath(); cx.moveTo(sx, -1); cx.lineTo(hx, hy); cx.stroke();
          cx.strokeStyle = ch.col; cx.lineWidth = 3.5; cx.beginPath(); cx.moveTo(sx, -1); cx.lineTo(sx + Math.cos(ang) * 5, -1 + Math.sin(ang) * 5); cx.stroke();
          cx.strokeStyle = '#e0b48a'; cx.beginPath(); cx.moveTo(sx + Math.cos(ang) * 5, -1 + Math.sin(ang) * 5); cx.lineTo(hx, hy); cx.stroke();
          if (P.atkKind !== 'throw') { cx.strokeStyle = '#5a3a22'; cx.lineWidth = 2.5; cx.beginPath(); cx.moveTo(hx, hy); cx.lineTo(hx + Math.cos(ang) * 6, hy + Math.sin(ang) * 6); cx.stroke(); }
          cx.lineCap = 'butt';
        }
        cx.restore(); cx.globalAlpha = 1;
        const bw = 30, hp = clamp(P.hp / ST.maxHp, 0, 1);
        cx.fillStyle = '#0c1120'; cx.fillRect(P.x - bw / 2 - 1, P.y + 17, bw + 2, 5);
        cx.fillStyle = '#c23a4a'; cx.fillRect(P.x - bw / 2, P.y + 18, bw * hp, 3);
      }
      function drawWorld() {
        BM = cx.getTransform(); _tfd = false;
        const P = S.player, hw = W / 2 / ZOOM + 60, hh = H / 2 / ZOOM + 60, vis = (x, y) => Math.abs(x - P.x) < hw && Math.abs(y - P.y) < hh;

        for (const w of S.weapons) {
          if (w.id !== 'fogon' || !w.R) continue;
          const R = w.R * (1 + Math.sin(S.t * 9) * .03);
          const g = cx.createRadialGradient(P.x, P.y, R * .2, P.x, P.y, R);
          g.addColorStop(0, w.evo ? 'rgba(255,120,40,.28)' : 'rgba(255,150,60,.2)'); g.addColorStop(.8, w.evo ? 'rgba(255,80,30,.16)' : 'rgba(255,110,40,.1)'); g.addColorStop(1, 'rgba(255,90,30,0)');
          cx.fillStyle = g; cx.beginPath(); cx.arc(P.x, P.y, R, 0, TAU); cx.fill();
          const n = Math.max(8, Math.round(R / 9));
          for (let i = 0; i < n; i++) {
            const an = i / n * TAU + S.t * .6, fx_ = P.x + Math.cos(an) * R * .9, fy_ = P.y + Math.sin(an) * R * .9, h = (w.evo ? 15 : 11) + Math.sin(S.t * 13 + i * 1.7) * 4 + Math.sin(S.t * 7 + i) * 2.5;
            dimg(ITEM['flame' + (w.evo ? 1 : 0)][clamp(Math.round((h - 9) / 3), 0, 3)], fx_, fy_);
          }
          if (w.pulse > 0) { const k = 1 - w.pulse / .22; cx.globalAlpha = (1 - k) * .55; cx.strokeStyle = w.evo ? '#ffb070' : '#ffd08a'; cx.lineWidth = 3 * (1 - k) + 1; cx.beginPath(); cx.arc(P.x, P.y, R * (.85 + k * .2), 0, TAU); cx.stroke(); cx.globalAlpha = 1; }
        }

        for (const f of S.fx) {
          if (f.type !== 'scorch' || !vis(f.x, f.y)) continue;
          const a = f.life / f.max;
          cx.globalAlpha = a * .55; cx.fillStyle = '#0a0d12'; cx.beginPath(); cx.ellipse(f.x, f.y, f.R, f.R * .55, 0, 0, TAU); cx.fill();
          cx.globalAlpha = a * a * .8; cx.strokeStyle = '#8fc4ff'; cx.lineWidth = 1.5; cx.beginPath(); cx.ellipse(f.x, f.y, f.R * .8, f.R * .42, 0, 0, TAU); cx.stroke();
          cx.globalAlpha = 1;
        }
        drawHerdZones();
        forObs(P.x, P.y, Math.max(hw, hh), o => { if (vis(o.x, o.y)) drawObstacle(o); });
        prewarmObs(P.x, P.y, Math.max(hw, hh) + 120);
        if (S.mode === 'campo') drawCampo(vis, hw, hh);

        for (const z of S.zones) {
          if (!vis(z.x, z.y)) continue;
          const a = clamp(z.life / .4, 0, 1) * clamp((z.max - z.life) / .15, 0, 1);
          cx.globalAlpha = a; cx.drawImage(zoneSpr(z.fire ? 'fire' : z.pull ? 'pull' : 'ice'), z.x - z.R, z.y - z.R * .8, z.R * 2, z.R * 1.6);
          cx.fillStyle = z.fire ? 'rgba(255,220,120,.85)' : 'rgba(235,245,255,.7)'; cx.beginPath();
          for (let i = 0; i < 6; i++) { const ph = S.t * 3 + i * 1.7 + z.x, bx = z.x + Math.cos(i * 2.4 + z.y) * z.R * .55, by = z.y + Math.sin(i * 1.9 + z.x) * z.R * .42, br = 1.2 + (Math.sin(ph) + 1) * 1.4; cx.moveTo(bx + br, by); cx.arc(bx, by, br, 0, TAU); }
          cx.fill();
          if (z.pull) { cx.strokeStyle = 'rgba(210,170,255,.7)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(z.x, z.y, z.R * .6, S.t * 4, S.t * 4 + 4); cx.stroke(); cx.beginPath(); cx.arc(z.x, z.y, z.R * .3, -S.t * 5, -S.t * 5 + 3.5); cx.stroke(); }
          cx.globalAlpha = 1;
        }
        for (const c of S.cracks) {
          if (c.t < 0 || !vis(c.x, c.y)) continue;
          if (!c.boom) {
            const k = clamp(c.t / c.T, 0, 1), blink = k > .7 && ((S.t * 14) | 0) % 2;
            cx.fillStyle = `rgba(150,205,255,${.1 + .18 * k})`; cx.beginPath(); cx.ellipse(c.x, c.y, c.R * k, c.R * .8 * k, 0, 0, TAU); cx.fill();
            cx.strokeStyle = blink ? 'rgba(255,255,255,.95)' : `rgba(205,235,255,${.35 + .45 * k})`; cx.lineWidth = 2;
            cx.beginPath(); cx.ellipse(c.x, c.y, c.R, c.R * .8, 0, 0, TAU); cx.stroke();
            cx.lineWidth = 1.6; cx.strokeStyle = `rgba(235,248,255,${.5 + .5 * k})`;
            for (let i = 0; i < 6; i++) {
              const a = i / 6 * TAU + hash(c.seed, i) * .8, L = c.R * k * (.6 + .4 * hash(i, c.seed));
              const mx = c.x + Math.cos(a + .25) * L * .5, my = c.y + Math.sin(a + .25) * L * .4;
              cx.beginPath(); cx.moveTo(c.x, c.y); cx.lineTo(mx, my); cx.lineTo(c.x + Math.cos(a) * L, c.y + Math.sin(a) * L * .8); cx.stroke();
            }
          } else {
            const f = 1 - clamp((c.t - c.T) / .45, 0, 1);
            cx.fillStyle = `rgba(220,240,255,${.55 * f})`; cx.beginPath(); cx.ellipse(c.x, c.y, c.R * (1 + .25 * (1 - f)), c.R * .8 * (1 + .25 * (1 - f)), 0, 0, TAU); cx.fill();
          }
        }

        for (const g of S.gems) {
          if (!vis(g.x, g.y)) continue;
          const s = g.big ? 9 : g.v < 3 ? 4.5 : g.v < 10 ? 6 : 7.5;
          dimg(gemSprite(g.big || g.v >= 10 ? '#ff5a6a' : g.v >= 3 ? '#8fe07a' : '#6fd3e0', s), g.x, g.y);
        }

        for (const pk of S.picks) {
          if (!vis(pk.x, pk.y)) continue;
          const b = Math.sin(pk.t * 4) * 2;
          if (pk.type === 'oro') dimg(ITEM.oro[((pk.t * 8) | 0) % 4], pk.x, pk.y + b);
          else if (pk.type === 'bomba') dimg(ITEM.bomba[Math.sin(pk.t * 20) > 0 ? 1 : 0], pk.x, pk.y + b);
          else if (pk.type === 'helada') { cx.save(); cx.translate(pk.x, pk.y + b); cx.rotate(pk.t); dimg(ITEM.helada, 0, 0); cx.restore(); }
          else if (pk.type === 'mat') dimg(matSprite(pk.m), pk.x, pk.y + b);
          else dimg(ITEM[pk.type] || ITEM.iman, pk.x, pk.y + b);
        }

        // aviso del salto del Mandinga: se agacha (anillo que se cierra) y marca dónde va a caer
        { const m = S.bossRef; if (m && m.fight && !m.dead && m.jph) {
          wReset(); cx.lineWidth = 3;
          if (m.jph === 'wind') { const k = 1 - m.jk / MF.wind; cx.strokeStyle = 'rgba(255,60,60,.8)'; cx.beginPath(); cx.arc(m.x, m.y, m.r + 40 * (1 - k) + 6, 0, TAU); cx.stroke(); }
          else { const k = clamp(1 - m.jk / MF.air, 0, 1);
            cx.globalAlpha = .18 + .3 * k; cx.fillStyle = '#ff3c3c'; cx.beginPath(); cx.arc(m.jtx, m.jty, MF.R * k, 0, TAU); cx.fill();
            cx.globalAlpha = .55 + .35 * Math.sin(S.t * 20) * k; cx.strokeStyle = '#ff5a3c'; cx.beginPath(); cx.arc(m.jtx, m.jty, MF.R, 0, TAU); cx.stroke(); cx.globalAlpha = 1; }
        } }
        drawMounts();
        cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath();
        for (const e of S.enemies) { if (ETYPES[e.type].fly || !vis(e.x, e.y)) continue; cx.moveTo(e.x + e.r, e.y + e.r * .9); cx.ellipse(e.x, e.y + e.r * .9, e.r, e.r * .35, 0, 0, TAU); }
        cx.fill();
        gSync();
        for (const e of S.enemies) {
          if (!vis(e.x, e.y)) continue;
          const sp = SPR[e.type], sz = sp.size * (e.r / ETYPES[e.type].r);
          const bob = ETYPES[e.type].fly ? Math.sin(S.t * 6 + e.wob) * 2 : 0;
          // lo poco común (apuntando, embistiendo, élite, helada) dibuja en coordenadas del mundo: recién ahí se restaura la matriz
          if (e.aimT > 0) {
            wReset(); const k = 1 - e.aimT / .55, col = ETYPES[e.type].shotCol || '#e2b6ff';
            gA(.35 + .5 * k); cx.strokeStyle = col; cx.lineWidth = 2.5;
            cx.beginPath(); cx.arc(e.x, e.y, e.r + 14 * (1 - k) + 3, 0, TAU); cx.stroke();
            cx.fillStyle = col; cx.beginPath(); cx.arc(e.x, e.y - e.r - 6, 2 + k * 3, 0, TAU); cx.fill();
            gA(1);
          }
          if (e.phase === 'aim') { wSet(e.x, e.y, 1, 1, Math.atan2(e.cdy, e.cdx)); gA(.25 + .25 * Math.sin(S.t * 30)); cx.fillStyle = '#ff3c3c'; cx.fillRect(0, -e.r * .8, e.dashLen || (560 * .55 + e.r), e.r * 1.6); gA(1); }
          if (e.elite) { wReset(); cx.strokeStyle = e.type === 'mandinga' ? 'rgba(255,60,60,.7)' : 'rgba(224,183,90,.75)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(e.x, e.y, e.r + 5 + Math.sin(S.t * 6) * 1.5, 0, TAU); cx.stroke(); }
          gSm(!e.elite);
          if (e.z > 0) { const y0 = e.y; e.y -= e.z; blitEnemy(e, sp, sz, bob); e.y = y0; }
          else blitEnemy(e, sp, sz, bob);
          if (S.freezeT > 0 && e.type !== 'mandinga' && !e.prop) { wReset(); cx.fillStyle = 'rgba(160,220,255,.4)'; cx.beginPath(); cx.arc(e.x, e.y, e.r * 1.05, 0, TAU); cx.fill(); }
          if (e.elite && e.type !== 'mandinga') {
            wReset(); const bw = Math.min(e.r * 2, 90), f = clamp(e.hp / e.maxHp, 0, 1);
            cx.fillStyle = '#0c1120'; cx.fillRect(e.x - bw / 2 - 1, e.y - e.r - 12, bw + 2, 5);
            cx.fillStyle = '#e0b75a'; cx.fillRect(e.x - bw / 2, e.y - e.r - 11, bw * f, 3);
          }
        }
        wReset(); gReset();

        for (const b of S.ebul) {
          if (!vis(b.x, b.y)) continue;
          dimg(bulletSprite(b.col, b.glow), b.x, b.y, b.r / 8);
        }

        for (const p of S.proj) {
          if (!vis(p.x, p.y)) continue;
          const rotK = p.kind === 'knife' || p.kind === 'spear' || p.kind === 'cross';
          wSet(p.x, p.y, 1, 1, rotK ? p.rot : 0);
          if (p.kind === 'knife') {
            const s = p.r / 6;
            cx.drawImage(trailSpr(p.w.evo), -40 * s, -2 * s, 34 * s, 4 * s);
            dimg(ITEM['knife' + (p.w.evo ? 1 : 0)], 0, 0, s);
            if (Math.sin(S.t * 40 + p.x * .05) > .6) { cx.fillStyle = '#fff'; cx.fillRect(8 * s, -.75, 3, 1.5); cx.fillRect(9 * s, -2, 1.5, 4); }
          } else if (p.kind === 'pellet') {
            const v = Math.hypot(p.vx, p.vy) || 1;
            cx.strokeStyle = p.w.evo ? 'rgba(255,190,90,.5)' : 'rgba(236,230,210,.35)'; cx.lineWidth = p.r * .9; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-p.vx / v * 12, -p.vy / v * 12); cx.stroke(); cx.lineCap = 'butt';
            dimg(ITEM['pellet' + (p.w.evo ? 1 : 0)], 0, 0, p.r / 4.5);
          } else if (p.kind === 'spear') {
            const s = p.r / 9;
            dimg(ITEM['spear' + (p.w.evo ? 1 : 0)][Math.sin(S.t * 30) > 0 ? 1 : 0], 0, 0, s);
          } else if (p.kind === 'spit') {
            const v = Math.hypot(p.vx, p.vy) || 1;
            cx.strokeStyle = 'rgba(220,235,200,.35)'; cx.lineWidth = p.r; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-p.vx / v * 16, -p.vy / v * 16); cx.stroke(); cx.lineCap = 'butt';
            cx.fillStyle = OL; cx.beginPath(); cx.arc(0, 0, p.r * .7 + 1.5, 0, TAU); cx.fill();
            cx.fillStyle = '#e6f0d0'; cx.beginPath(); cx.arc(0, 0, p.r * .7, 0, TAU); cx.fill();
            cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(-p.r * .2, -p.r * .2, p.r * .25, 0, TAU); cx.fill();
          } else {
            const R = p.r;
            const pu = 1 + Math.sin(S.t * 18 + p.x * .03) * .08;
            dimg(ITEM['cross' + (p.w.evo ? 1 : 0)], 0, 0, R / 11 * pu);
          }
        }
        wReset();

        for (const t of S.throws) {
          if (t.t < 0) continue;
          const k = t.t / t.T, x = t.x0 + (t.x - t.x0) * k, y = t.y0 + (t.y - t.y0) * k - Math.sin(k * Math.PI) * 70;
          cx.save(); cx.translate(x, y); cx.rotate(k * 8);
          dimg(ITEM['pava' + (t.w.evo ? 1 : 0)], 0, 0);
          cx.restore();
        }
        for (const wv of S.waves) {
          const a = 1 - wv.r / wv.R;
          cx.strokeStyle = wv.gold ? '#ffd98a' : wv.evo ? '#d7a8ff' : '#f4e7c4';
          cx.globalAlpha = a * .35; cx.lineWidth = 10; cx.beginPath(); cx.arc(wv.x, wv.y, Math.max(1, wv.r - 6), 0, TAU); cx.stroke();
          if (wv.gold) cx.strokeStyle = '#ffd98a';
          cx.globalAlpha = a * .85; cx.lineWidth = 2.5; cx.beginPath(); cx.arc(wv.x, wv.y, wv.r, 0, TAU); cx.stroke();
          cx.globalAlpha = 1;
        }

        drawGhosts();
        if (S.ride) drawRider(P); else drawPlayer(P);

        for (const w of S.weapons) {
          if (w.id !== 'boleadoras' || !w.pos || !w.pos.length) continue;
          const fade = w.evo ? 1 : clamp(w.on / .3, 0, 1) * clamp((w.onMax - w.on) / .15 + .2, 0, 1);
          cx.globalAlpha = fade;
          const sr = 11 * Math.sqrt(ST.area);
          cx.lineCap = 'round';
          for (let i = 0; i < w.pos.length; i += 2) {
            const x = w.pos[i], y = w.pos[i + 1], a0 = Math.atan2(y - P.y, x - P.x), Rr = Math.hypot(x - P.x, y - P.y);
            for (let j = 0; j < 4; j++) { cx.strokeStyle = w.evo ? `rgba(160,220,245,${.28 - j * .06})` : `rgba(210,190,150,${.26 - j * .06})`; cx.lineWidth = sr * (1.7 - j * .3); cx.beginPath(); cx.arc(P.x, P.y, Rr, a0 - .16 * (j + 1), a0 - .16 * j); cx.stroke(); }
          }
          cx.strokeStyle = 'rgba(180,150,110,.6)'; cx.lineWidth = 1.5; cx.beginPath();
          for (let i = 0; i < w.pos.length; i += 2) { const x = w.pos[i], y = w.pos[i + 1], mx = (P.x + x) / 2, my = (P.y + y) / 2, px = -(y - P.y) * .12, py = (x - P.x) * .12; cx.moveTo(P.x, P.y); cx.quadraticCurveTo(mx - px, my - py, x, y); }
          cx.stroke(); cx.lineCap = 'butt';
          for (let i = 0; i < w.pos.length; i += 2) {
            const x = w.pos[i], y = w.pos[i + 1];
            dimg(ITEM['bol' + (w.evo ? 1 : 0)], x, y, sr / 11);
          }
          cx.globalAlpha = 1;
        }

        for (const f of S.fx) {
          // culling: el rayo baja desde 360 arriba y los anillos pueden ser enormes, así que se mira su alcance
          const ext = f.type === 'ring' ? f.R + 8 : f.type === 'bolt' ? 360 : f.type === 'slash' ? 80 : 0;
          if (Math.abs(f.x - P.x) > hw + ext || Math.abs(f.y - P.y) > hh + ext) continue;
          const a = f.life / f.max;
          if (f.type === 'ring') { const q = Math.ceil(a * 6); if (q > 0) RING_B.add(f.col + q, f.col, q / 6, f); continue; }
          if (f.type !== 'death') wReset();
          if (f.type === 'slash') {
            const p = 1 - a, dir = f.dir, L = f.w, H = f.h, ox = f.ox, oy = f.oy;
            const whip = q => { const e = 1 - Math.pow(1 - clamp(q * 2.4, 0, 1), 3); return [ox + dir * L * .45, oy - H * (1.4 - 1.2 * clamp(q * 2, 0, 1)), ox + dir * L * e, oy + H * .25 - H * 1.1 * (1 - e)]; };
            cx.lineCap = 'round';
            cx.globalAlpha = clamp(a * 1.5, 0, 1) * .42 * clamp(p * 4, 0, 1);
            const gr = cx.createLinearGradient(ox, oy, ox + dir * L, oy); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(1, f.evo ? '#ff4a64' : '#fff1cf');
            cx.fillStyle = gr; cx.beginPath(); cx.moveTo(ox, oy);
            cx.quadraticCurveTo(ox + dir * L * .5, oy - H * 1.35, ox + dir * L, oy + H * .25); cx.quadraticCurveTo(ox + dir * L * .55, oy - H * .3, ox, oy); cx.fill();
            for (const [dq, al, lw] of [[.18, .22, 2], [.09, .45, 2.5], [0, 1, 3.2]]) {
              const q = Math.max(0, p - dq), [c1, c2, tx, ty] = whip(q);
              cx.globalAlpha = al * clamp(a * 1.6, 0, 1);
              cx.strokeStyle = dq ? (f.evo ? '#ff7a8a' : '#f4e7c4') : '#0c1120'; cx.lineWidth = lw + (dq ? 0 : 2);
              cx.beginPath(); cx.moveTo(ox, oy); cx.quadraticCurveTo(c1, c2, tx, ty); cx.stroke();
              if (!dq) { cx.strokeStyle = f.evo ? '#e0364f' : '#b07a45'; cx.lineWidth = lw; cx.stroke(); cx.strokeStyle = f.evo ? '#ffb0bc' : '#e0b07a'; cx.lineWidth = 1; cx.stroke(); }
            }
            if (p > .28 && p < .8) {
              const [, , tx, ty] = whip(p), k = (p - .28) / .52;
              cx.globalAlpha = 1 - k; cx.strokeStyle = f.evo ? '#ffd0d8' : '#fff'; cx.lineWidth = 2; cx.beginPath();
              for (let i = 0; i < 7; i++) { const an = i / 7 * TAU + f.x * .1; cx.moveTo(tx + Math.cos(an) * 3, ty + Math.sin(an) * 3); cx.lineTo(tx + Math.cos(an) * (6 + k * 14), ty + Math.sin(an) * (6 + k * 14)); }
              cx.stroke(); cx.fillStyle = '#fff'; cx.beginPath(); cx.arc(tx, ty, 3 * (1 - k) + 1, 0, TAU); cx.fill();
            }
            cx.lineCap = 'butt'; cx.globalAlpha = 1;
          } else if (f.type === 'bolt') {
            cx.globalAlpha = a;
            cx.fillStyle = f.evo ? 'rgba(160,210,255,.35)' : 'rgba(190,225,255,.3)'; cx.beginPath(); cx.arc(f.x, f.y, f.R, 0, TAU); cx.fill();
            const fl = Math.floor(S.t * 28) % 3, sd = f.seed + fl * 7.3, p = 1 - a;
            if (p < .35) { cx.globalAlpha = (1 - p / .35) * .8; cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(f.x, f.y, f.R * .55, 0, TAU); cx.fill(); cx.globalAlpha = a; }
            const cg = cx.createLinearGradient(f.x, f.y - 360, f.x, f.y); cg.addColorStop(0, 'rgba(160,200,255,0)'); cg.addColorStop(1, f.evo ? 'rgba(160,200,255,.35)' : 'rgba(190,220,255,.25)');
            cx.fillStyle = cg; cx.fillRect(f.x - f.R * .35, f.y - 360, f.R * .7, 360);
            let x = f.x + (hash(sd, 1) - .5) * 60, y = f.y - 340;
            const pts = [[x, y]];
            for (let i = 1; i <= 9; i++) { y = f.y - 340 + i * 340 / 9; x = i === 9 ? f.x : f.x + (hash(sd, i + 2) - .5) * 54 * (1 - i / 9); pts.push([x, y]); }
            const br = [];
            for (const bi of [3, 6]) { const [bx, by] = pts[bi], dirb = hash(sd, bi + 40) > .5 ? 1 : -1; br.push([[bx, by], [bx + dirb * (14 + hash(sd, bi) * 18), by + 18], [bx + dirb * (22 + hash(sd, bi + 9) * 20), by + 40]]); }
            cx.lineJoin = 'round';
            for (const [lw, col] of [[f.evo ? 11 : 8, 'rgba(110,170,255,.45)'], [f.evo ? 4.5 : 3, '#f2f8ff']]) {
              cx.strokeStyle = col; cx.lineWidth = lw; cx.beginPath(); cx.moveTo(pts[0][0], pts[0][1]);
              for (const q of pts) cx.lineTo(q[0], q[1]);
              for (const b of br) { cx.moveTo(b[0][0], b[0][1]); for (const q of b) cx.lineTo(q[0], q[1]); }
              cx.stroke();
            }
            cx.globalAlpha = 1;
          } else if (f.type === 'death') {
            const sp = SPR[f.etype], fr = sp.frames[f.frame] || sp.frames[0], sz = sp.size * f.scale, k = 1 - a;
            if (f.etype === 'anima') {
              wSet(f.x, f.y - k * 34, 1 - k * .45, 1 + k * .9, f.tilt + f.rot);
              cx.globalAlpha = a * .9; cx.drawImage(k < .12 ? fr.flash : fr.img, -sz / 2, -sz / 2, sz, sz);
            } else {
              wSet(f.x, f.y + k * sz * .2, 1 + k * .35, 1 - k * .75, f.rot);
              cx.globalAlpha = a; cx.drawImage(k < .35 ? fr.flash : fr.img, -sz / 2, -sz / 2, sz, sz);
            }
            // sin volver a 1: las demás ramas ponen su alfa antes de dibujar
          }
        }
        wReset();
        // anillos: un stroke por color y opacidad cuantizada
        cx.lineWidth = 3;
        RING_B.each(g => { cx.globalAlpha = g.a; cx.strokeStyle = g.col; cx.beginPath(); for (const f of g.l) { const r = f.R * (1 - f.life / f.max) + 8; cx.moveTo(f.x + r, f.y); cx.arc(f.x, f.y, r, 0, TAU); } cx.stroke(); });
        cx.globalAlpha = 1;

        wReset();
        // partículas: las comunes van en lotes por color y opacidad (un fill por lote); las que brillan, un drawImage cada una
        for (const p of S.parts) {
          if (!vis(p.x, p.y)) continue;
          const a = clamp(p.life / p.max, 0, 1);
          if (p.glow) { const q = Math.ceil(a * 6); if (q > 0) GLOW_B.add(p.col + q, p.col, q / 6, p); continue; }
          const q = Math.ceil(a * 5); if (q > 0) PART_B.add(p.col + q, p.col, q / 5, p);
        }
        GLOW_B.each(g => { cx.globalAlpha = g.a; const sp = dotSpr(g.col); for (const p of g.l) { const R = p.size * 2.2; cx.drawImage(sp, p.x - R, p.y - R, R * 2, R * 2); } });
        PART_B.each(g => { cx.globalAlpha = g.a; cx.fillStyle = g.col; cx.beginPath(); for (const p of g.l) cx.rect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); cx.fill(); });
        cx.globalAlpha = 1;
        BM = null;

      }
      function drawTexts() {
        if (!fontReady()) {  // la fuente embebida todavía no cargó: texto directo (no se cachea con la fuente de reemplazo)
          cx.textAlign = 'center'; cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.75)';
          for (const t of S.texts) { const fi = t.tier !== undefined ? Math.min(3, t.tier + (t.pop > 0 ? 1 : 0)) : t.big ? 2 : 0; cx.font = `${TXT_F[fi][0]} ${TXT_F[fi][1]}px ${FONT}`; cx.globalAlpha = clamp(t.life / .3, 0, 1); cx.strokeText(t.txt, t.x, t.y); cx.fillStyle = t.col; cx.fillText(t.txt, t.x, t.y); }
          cx.globalAlpha = 1; return;
        }
        txtScale(); let ga = 1;
        for (const t of S.texts) {
          const fi = t.tier !== undefined ? Math.min(3, t.tier + (t.pop > 0 ? 1 : 0)) : t.big ? 2 : 0, a = clamp(t.life / .3, 0, 1);
          if (a !== ga) cx.globalAlpha = ga = a;
          drawTxt(String(t.txt), t.x, t.y, t.col, fi, t);
        }
        cx.globalAlpha = 1;
      }
      let demoT = 0;
      /* desglose del medidor de FPS: ms de JS por sección (solo se mide con el medidor activado) */
      const PRF = { a: {} };
      function prf(k, t0) { const t = performance.now(); PRF.a[k] = (PRF.a[k] || 0) + t - t0; return t; }
      function render(dt) {
        const pOn = SAVE.opts.fps; let t0 = pOn ? performance.now() : 0;
        cx.setTransform(DPR, 0, 0, DPR, 0, 0);
        cx.fillStyle = MAP().bg; cx.fillRect(0, 0, W, H);
        demoT += dt;
        if (!S && PU) { drawPuesto(dt); return; }
        if (!S) { drawTitleScene(dt); cx.drawImage(vignette, 0, 0, W, H); drawCharPreview(); return; }
        const P = S.player;
        let sx = 0, sy = 0;
        if (S && S.shake > 0 && !reduceMotion && SAVE.opts.shake) { sx = rnd(-1, 1) * S.shake * 6; sy = rnd(-1, 1) * S.shake * 6; }
        cx.save(); cx.translate(W / 2 + sx, H / 2 + sy); cx.scale(ZOOM, ZOOM); cx.translate(-P.x, -P.y);
        drawGround(P.x, P.y);
        if (pOn) t0 = prf('suelo', t0);
        drawMarks(); drawAnimitas(); drawCrits(false);
        if (S) drawWorld();
        drawCrits(true);
        cx.restore();
        if (pOn) t0 = prf('mundo', t0);
        drawOverlay(sx, sy);
        if (S && S.weather) drawWeather(dt);
        cx.drawImage(vignette, 0, 0, W, H);
        if (!S) return;
        if (S.freezeT > 0) { cx.fillStyle = 'rgba(120,190,255,.10)'; cx.fillRect(0, 0, W, H); }
        if (S.whiteFlash > 0) { cx.fillStyle = `rgba(255,250,235,${Math.min(.6, S.whiteFlash * 1.6)})`; cx.fillRect(0, 0, W, H); }
        if (S.hurtFlash > 0) { cx.fillStyle = `rgba(194,58,74,${S.hurtFlash * .9})`; cx.fillRect(0, 0, W, H); }
        const br = S.bossRef;
        if (br && !br.dead && br.elite && !mHunter(br)) {
          const dx = (br.x - P.x) * ZOOM, dy = (br.y - P.y) * ZOOM;
          if (Math.abs(dx) > W / 2 - 20 || Math.abs(dy) > H / 2 - 20) {
            const a = Math.atan2(dy, dx), m = 40, ex = clamp(W / 2 + dx, m, W - m), ey = clamp(H / 2 + dy, m + 90, H - m - 40);
            cx.save(); cx.translate(ex, ey); cx.rotate(a); cx.globalAlpha = .75 + .25 * Math.sin(S.t * 8);
            cx.fillStyle = '#ff5a5a'; cx.strokeStyle = '#0c1120'; cx.lineWidth = 2;
            cx.beginPath(); cx.moveTo(16, 0); cx.lineTo(-8, -11); cx.lineTo(-3, 0); cx.lineTo(-8, 11); cx.closePath(); cx.fill(); cx.stroke();
            cx.restore(); cx.globalAlpha = 1;
          }
        }
        for (const pk of S.picks) {
          if (pk.type !== 'cofre') continue;
          const dx = (pk.x - P.x) * ZOOM, dy = (pk.y - P.y) * ZOOM;
          if (Math.abs(dx) < W / 2 - 20 && Math.abs(dy) < H / 2 - 20) continue;
          const a = Math.atan2(dy, dx), m = 36, ex = clamp(W / 2 + dx, m, W - m), ey = clamp(H / 2 + dy, m + 90, H - m);
          cx.save(); cx.translate(ex, ey); cx.rotate(a);
          cx.fillStyle = '#e0b75a'; cx.beginPath(); cx.moveTo(12, 0); cx.lineTo(-6, -8); cx.lineTo(-6, 8); cx.closePath(); cx.fill();
          cx.restore();
        }
        drawMountArrow();
        if (joy && S.state === 'play') {
          cx.strokeStyle = 'rgba(236,230,210,.35)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(joy.ox, joy.oy, 50, 0, TAU); cx.stroke();
          const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1;
          cx.fillStyle = 'rgba(236,230,210,.4)'; cx.beginPath(); cx.arc(joy.ox + dx * k, joy.oy + dy * k, 20, 0, TAU); cx.fill();
        }
      }

