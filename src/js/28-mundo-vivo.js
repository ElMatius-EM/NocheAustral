      /* ---------------- mundo vivo: terreno, mallines, marcas, luz, fauna y ambiente ---------------- */
      // paletas por mapa; en el glaciar el "mallín" es nieve honda
      const TERR_PAL = {
        estepa: {
          dry: '#3b3f2a', dark: '#121a17', salt: '#454c47', rim: '#223f2e', wet: '#10302f', deep: '#0c2429', glint: '#7fb4b8', mark: '#4a4230',
          reed: '#5f7a42', reedTip: '#8a6a3e', bird: '#5b5147', birdHead: '#c9a46a', birdWing: '#3e3731', hare: '#8a7a5e', hareBelly: '#bba98a'
        },
        bosque: {
          dry: '#4a3a22', dark: '#0f1a0e', salt: '#35562c', rim: '#1f3f2c', wet: '#0f2a26', deep: '#0b2024', glint: '#7fb4b8', mark: '#3a3224',
          reed: '#4f7a3a', reedTip: '#7a5a32', bird: '#4a4038', birdHead: '#b08a5a', birdWing: '#2e2a24', hare: '#6a5a44', hareBelly: '#9a8a6a'
        },
        glaciar: {
          dry: '#24344d', dark: '#121b29', salt: '#2e3f56', rim: '#465d78', wet: '#637c97', deep: '#7189a4', glint: '#dfeaf6', mark: '#34495f',
          reed: null, bird: '#e6eef5', birdHead: '#f4f8fb', birdWing: '#8b99a8', hare: '#dfe6ec', hareBelly: '#ffffff'
        }
      };
      const TPAL = bk => TERR_PAL[bk || (S ? S.bio || S.map : 'estepa')] || TERR_PAL.estepa;
      const WET_T = .78;
      function vnoise(x, y, s, o) {
        const gx = x / s + o * 17.31, gy = y / s - o * 9.17, ix = Math.floor(gx), iy = Math.floor(gy), fx = gx - ix, fy = gy - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
        const a = hash(ix, iy), b = hash(ix + 1, iy), c = hash(ix, iy + 1), d = hash(ix + 1, iy + 1);
        return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
      }
      function wetVal(x, y) { const o = S ? S.terrSeed : 0; return vnoise(x, y, 300, o) * .62 + vnoise(x, y, 90, o + 3) * .38; }
      // true si (x,y) cae en un mallín (o nieve honda); nunca cerca del punto de partida
      function terrWet(x, y) { return x * x + y * y > 220 * 220 && wetVal(x, y) > WET_T; }

      /* suelo en chunks de píxeles: manchas de coironal, tierra oscura, salitral y mallines */
      const TCH = 240, TCELL = 2.5, TN = TCH / TCELL, TCACHE = new Map();
      let tBudgetEnd = 0; const PAL_RGB = {};
      /* Los ruidos del suelo son suaves (escalas de 90 a 1500 unidades): se calculan en una grilla gruesa cada TG celdas
         y se interpolan por píxel. Da el mismo dibujo con ~10 veces menos cálculo; antes un chunk nuevo tardaba
         15 ms en PC (50-70 ms en un celular) y trababa el frame cada vez que se caminaba hacia zona nueva. */
      const TG = 4, TGN = TN / TG + 1, BIO_TMP = [];
      function palRGB(k) { return PAL_RGB[k] || (PAL_RGB[k] = (() => { const Pl = TPAL(k), M = MAPS[k]; return [M.ice, rgb(M.bg), rgb(Pl.dry), rgb(Pl.dark), rgb(Pl.salt), rgb(Pl.rim), rgb(Pl.wet), rgb(Pl.deep), rgb(Pl.glint)]; })()); }
      const q3 = k => k <= 0 ? 0 : k >= 1 ? 1 : Math.round(k * 3) / 3;
      /* Un chunk se arma como "trabajo" que se puede hacer de a filas: el prearmado lo avanza un poco por frame
         (tope de tiempo) y solo se completa de golpe si el chunk ya está en pantalla y todavía no existe. */
      function chunkJob(ix, iy) {
        const c = document.createElement('canvas'); c.width = c.height = TN;
        const g = c.getContext('2d'), img = g.createImageData(TN, TN), o = S.terrSeed, reg = REGION(), TF = new Float32Array(TGN * TGN * 5);
        // grilla gruesa: coironal, tierra oscura, salitral, humedad y bioma (ruidos suaves, se interpolan por píxel)
        for (let gj = 0; gj < TGN; gj++) for (let gi = 0; gi < TGN; gi++) {
          const x = ix * TCH + gi * TG * TCELL, y = iy * TCH + gj * TG * TCELL, k = (gj * TGN + gi) * 5;
          TF[k] = vnoise(x, y, 620, o + 7); TF[k + 1] = vnoise(x, y, 410, o + 11); TF[k + 2] = vnoise(x, y, 520, o + 19);
          TF[k + 3] = wetVal(x, y); TF[k + 4] = reg ? bioN(x, y) : 0;
        }
        const base = S.map in TERR_PAL ? S.map : MAPS[S.map].region.biomes[0];
        return { key: ix + ',' + iy, sd: S.terrSeed + S.map, ix, iy, c, g, img, d32: new Uint32Array(img.data.buffer), TF, reg, pk: base, pal: palRGB(base), row: 0 };
      }
      // avanza filas hasta terminar o hasta 'until' (performance.now); devuelve true si el chunk quedó listo
      function chunkRows(J, until) {
        const { ix, iy, TF, reg, d32 } = J, inv = 1 / TG, x0 = ix * TCH, y0 = iy * TCH, T2 = 220 * 220;
        let pk = J.pk, pal = J.pal;
        while (J.row < TN) {
          const j = J.row++;
          const fyc = (j + .5) * inv, gj = Math.min(TGN - 2, fyc | 0), v = fyc - gj, y = y0 + (j + .5) * TCELL, hy = iy * TN + j;
          for (let i = 0; i < TN; i++) {
            const fxc = (i + .5) * inv, gi = Math.min(TGN - 2, fxc | 0), u = fxc - gi;
            const k00 = (gj * TGN + gi) * 5, k10 = k00 + 5, k01 = k00 + TGN * 5, k11 = k01 + 5;
            const w00 = (1 - u) * (1 - v), w10 = u * (1 - v), w01 = (1 - u) * v, w11 = u * v;
            const x = x0 + (i + .5) * TCELL, hx = ix * TN + i, hh = hash(hx, hy), dn = (hh - .5) * .06;
            if (reg) {
              const m = bioFromN(TF[k00 + 4] * w00 + TF[k10 + 4] * w10 + TF[k01 + 4] * w01 + TF[k11 + 4] * w11, BIO_TMP, reg);
              const nk = m[0] === m[1] ? m[0] : bioPick(m, hx, hy, x, y); if (nk !== pk) { pk = nk; pal = palRGB(nk); }
            }
            const ice = pal[0]; let cc = pal[1], r = cc[0], gg = cc[1], b = cc[2], kk = 0;
            const tn = TF[k00] * w00 + TF[k10] * w10 + TF[k01] * w01 + TF[k11] * w11 + dn, dT = pk === 'bosque' ? .56 : .44;
            if (tn < dT) { cc = pal[2]; kk = q3((dT - tn) / .14) * .7; r += (cc[0] - r) * kk; gg += (cc[1] - gg) * kk; b += (cc[2] - b) * kk; }
            const dk_ = TF[k00 + 1] * w00 + TF[k10 + 1] * w10 + TF[k01 + 1] * w01 + TF[k11 + 1] * w11 + dn;
            if (dk_ > .6) { cc = pal[3]; kk = q3((dk_ - .6) / .12) * .75; r += (cc[0] - r) * kk; gg += (cc[1] - gg) * kk; b += (cc[2] - b) * kk; }
            const sl = TF[k00 + 2] * w00 + TF[k10 + 2] * w10 + TF[k01 + 2] * w01 + TF[k11 + 2] * w11 + dn;
            if (sl > .74) { cc = pal[4]; kk = q3((sl - .74) / .1) * (ice ? .6 : .55); r += (cc[0] - r) * kk; gg += (cc[1] - gg) * kk; b += (cc[2] - b) * kk; }
            if (x * x + y * y > T2) {
              const w = TF[k00 + 3] * w00 + TF[k10 + 3] * w10 + TF[k01 + 3] * w01 + TF[k11 + 3] * w11; cc = null;
              if (w > WET_T + .07 + dn) { const e = pal[7]; r = e[0]; gg = e[1]; b = e[2]; if (hh < .012) { cc = pal[8]; kk = .6; } }
              else if (w > WET_T + dn * .5) { const e = pal[6]; r = e[0]; gg = e[1]; b = e[2]; if (hh < .005) { cc = pal[8]; kk = .4; } }
              else if (w > WET_T - .035 + dn) { cc = pal[5]; kk = ice ? .55 : .8; }
              if (cc) { r += (cc[0] - r) * kk; gg += (cc[1] - gg) * kk; b += (cc[2] - b) * kk; }
            }
            // ImageData redondea al escribir por canal; acá se escribe el píxel entero de una (little-endian: ABGR)
            d32[j * TN + i] = 0xff000000 | (Math.round(b) & 255) << 16 | (Math.round(gg) & 255) << 8 | (Math.round(r) & 255);
          }
          if ((j & 7) === 7 && performance.now() > until) break;
        }
        J.pk = pk; J.pal = pal;
        if (J.row < TN) return false;
        J.g.putImageData(J.img, 0, 0);
        TCACHE.set(J.key, J.c);
        if (TCACHE.size > 160) TCACHE.delete(TCACHE.keys().next().value);
        return true;
      }
      let TJOB = null;
      function terrChunk(ix, iy) {
        const key = ix + ',' + iy; const c = TCACHE.get(key); if (c) return c;
        if (performance.now() > tBudgetEnd) return null;
        // si justo se estaba prearmando este chunk, se termina el mismo trabajo
        const J = TJOB && TJOB.key === key && TJOB.sd === S.terrSeed + S.map ? TJOB : chunkJob(ix, iy); if (J === TJOB) TJOB = null;
        chunkRows(J, Infinity); return J.c;
      }
      function drawTerrain(px, py) {
        const hw = W / 2 / ZOOM + 20, hh = H / 2 / ZOOM + 20;
        tBudgetEnd = performance.now() + (TCACHE.size < 8 ? 60 : 5);
        const x0 = Math.floor((px - hw) / TCH), x1 = Math.floor((px + hw) / TCH), y0 = Math.floor((py - hh) / TCH), y1 = Math.floor((py + hh) / TCH);
        cx.imageSmoothingEnabled = false;
        for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) { const c = terrChunk(i, j); if (c) cx.drawImage(c, i * TCH, j * TCH, TCH + .7, TCH + .7); }
        cx.imageSmoothingEnabled = true;
        // prearmado en segundo plano: avanza de a filas un chunk del anillo de afuera (primero hacia donde se mueve el
        // jugador), con un tope de tiempo por frame. Así el terreno ya está hecho cuando entra a la pantalla.
        if (TJOB && (TCACHE.has(TJOB.key) || TJOB.sd !== S.terrSeed + S.map)) TJOB = null;  // ya hecho, o de otra partida
        if (!TJOB) {
          const P = S && S.player, dx = P ? Math.sign(P.vx || 0) : 0, dy = P ? Math.sign(P.vy || 0) : 0;
          let best = null, bs = -Infinity;
          for (let i = x0 - 1; i <= x1 + 1; i++) for (let j = y0 - 1; j <= y1 + 1; j++) {
            if (TCACHE.has(i + ',' + j)) continue;
            const inView = i >= x0 && i <= x1 && j >= y0 && j <= y1;
            const sc = inView ? 9 : (i < x0 ? -dx : i > x1 ? dx : 0) + (j < y0 ? -dy : j > y1 ? dy : 0);
            if (sc > bs) { bs = sc; best = [i, j]; }
          }
          if (best) TJOB = chunkJob(best[0], best[1]);
        }
        if (TJOB) chunkRows(TJOB, performance.now() + (GFX_LOW ? 1.5 : 2.5)) && (TJOB = null);
      }

      /* decoración que se mueve: pasto y juncos se mecen con la brisa, el viento y cuando pasás */
      function swayDraw(s, x, y, ph, amp) {
        if (reduceMotion || !S || GFX_LOW) { dimg(s, x, y); return; }
        const P = S.player, w = S.weather;
        let k = Math.sin(S.t * 1.6 + ph * 6.3) * .09;
        if (w && w.type === 'viento') k += w.dx * (w.k || 0) * (.38 + .14 * Math.sin(S.t * 7 + ph * 9));
        const dx = x - P.x, dy = y - P.y, d2 = dx * dx + dy * dy;
        if (d2 < 900) { k += (dx > 0 ? 1 : -1) * (1 - Math.sqrt(d2) / 30) * .75; }
        k *= amp;
        // variantes inclinadas pre-horneadas: se dibujan alineadas, sin transformaciones por mata
        const B = swayBake(s), z = s.size, i = clamp(Math.round((k / SW_MAX) * SW_HALF) + SW_HALF, 0, SW_HALF * 2);
        cx.drawImage(B[i], x - z * SW_W / 2, y - z / 2, z * SW_W, z);
      }
      const SW_MAX = .9, SW_HALF = 6, SW_W = 1 + SW_MAX * 1.1, SWB = new WeakMap();
      function swayBake(s) {
        let B = SWB.get(s); if (B) return B; B = [];
        const iw = s.img.width, ih = s.img.height, cw = Math.ceil(iw * SW_W);
        for (let n = -SW_HALF; n <= SW_HALF; n++) {
          const k = n / SW_HALF * SW_MAX, c = document.createElement('canvas'); c.width = cw; c.height = ih;
          const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.setTransform(1, 0, -k, 1, cw / 2, ih); g.drawImage(s.img, -iw / 2, -ih);
          B.push(c);
        }
        SWB.set(s, B); return B;
      }
      const VIVO_SPR = {};
      function vivoSpr(bk) {
        const key = bk || (S ? S.bio || S.map : 'estepa'); if (VIVO_SPR[key]) return VIVO_SPR[key];
        const Pl = TPAL(key), V = { reed: [] };
        if (Pl.reed) for (let v = 0; v < 2; v++) V.reed.push(pixSprite(24, 1, b => {
          const st = v ? [[-4, -8], [-1, -11], [2, -9], [5, -7]] : [[-5, -7], [-2, -10], [1, -12], [4, -8], [6, -5]];
          for (const [tx, ty] of st) { b.line([[tx * .5, 5], [tx, ty]], 1.1, Pl.reed, 2); b.dot(tx, ty, lt(Pl.reed, .2), 2); }
          b.ell(st[1][0], st[1][1] + 1.5, .9, 1.8, Pl.reedTip, 1); if (!v) b.ell(st[3][0], st[3][1] + 1.5, .9, 1.8, Pl.reedTip, 1);
        }));
        V.glint = pixSprite(10, 1, b => { b.dot(0, 0, '#ffffff', 1); b.dot(-1, 0, Pl.glint, 1); b.dot(1, 0, Pl.glint, 1); b.dot(0, -1, Pl.glint, 1); b.dot(0, 1, Pl.glint, 1); });
        V.drift = pixSprite(22, 1, b => { b.ell(0, 1, 7, 2.6, Pl.deep, 2); b.ell(-1, 0, 5, 1.8, '#e8f1f8', 2); });
        // aves: posada y dos cuadros de vuelo
        V.birdSit = pixSprite(16, 1, b => {
          b.ell(-.5, 1, 3.4, 2.3, Pl.bird); b.ell(-1, .4, 2.4, 1.4, Pl.birdWing); b.ell(2.6, -1.4, 1.5, 1.3, Pl.birdHead);
          b.line([[3.8, -1.2], [5.2, -.2], [6, .9]], .7, '#1a1a1a', 1); b.line([[-1, 3], [-1, 4.8]], .6, '#2a2420', 1); b.line([[.6, 3], [.8, 4.8]], .6, '#2a2420', 1); b.dot(2.9, -1.8, '#111111', 1);
        });
        V.birdFly = [0, 1].map(f => pixSprite(18, 1, b => {
          const wy = f ? -5.5 : 1.5;
          b.poly([[-1, 0], [-7, wy], [-5, wy + 1.8], [1, 1.2]], Pl.birdWing); b.poly([[1, 0], [7, wy], [5, wy + 1.8], [-1, 1.2]], Pl.birdWing);
          b.ell(0, .6, 2.8, 1.9, Pl.bird); b.ell(2.4, -.6, 1.3, 1.2, Pl.birdHead); b.line([[3.4, -.4], [5, .4]], .6, '#1a1a1a', 1);
        }));
        V.hare = [0, 1].map(f => pixSprite(20, 1, b => {
          if (!f) {
            b.ell(-1, 1.5, 4.2, 3, Pl.hare); b.ell(-1, 2.6, 3, 1.6, Pl.hareBelly); b.ell(3, -1.2, 2.2, 1.9, Pl.hare);
            b.line([[2.6, -2.6], [2, -7.4]], 1.1, Pl.hare); b.line([[3.6, -2.6], [4, -7.2]], 1.1, Pl.hare); b.dot(3.8, -1.6, '#111111', 1); b.ell(-5, 1, 1.2, 1.2, Pl.hareBelly);
          }
          else {
            b.ell(0, .5, 5.4, 2.3, Pl.hare); b.ell(0, 1.6, 4, 1.2, Pl.hareBelly); b.ell(5, -.6, 2, 1.6, Pl.hare);
            b.line([[4.4, -1.8], [1.4, -4.6]], 1, Pl.hare); b.line([[5.2, -1.8], [2.6, -5]], 1, Pl.hare); b.dot(5.8, -1, '#111111', 1);
            b.line([[-4, 2], [-7, 3.6]], 1.1, Pl.hare); b.line([[3, 2], [5.6, 3.6]], 1, Pl.hare);
          }
        }));
        V.cardo = pixSprite(28, 1, b => {
          for (let i = 0; i < 14; i++) {
            const a0 = hash(i, 3) * TAU, a1 = a0 + 1.4 + hash(i, 5) * 2, r0 = 6 + hash(i, 7) * 3.5, r1 = 6 + hash(i, 9) * 3.5;
            b.line([[Math.cos(a0) * r0, Math.sin(a0) * r0], [Math.cos(a1) * r1 * .4, Math.sin(a1) * r1 * .4], [Math.cos(a1) * r1, Math.sin(a1) * r1]], 1, i % 3 ? '#8a7350' : '#6d5a3c', 2);
          }
        });
        // animita: casita con techo rojo, cruz y banderita del Gauchito
        V.animita = pixSprite(40, 1, b => {
          b.ell(0, 10, 11, 3, [0, 0, 0], 2, .3);
          b.rect(-8, 3, 16, 7, '#7d7a70'); b.rect(-7, -5, 14, 9, '#d9d1b8'); b.rect(-3.5, -2, 7, 5.5, '#2a2320');
          b.poly([[-9.5, -4.5], [0, -11], [9.5, -4.5]], '#9a2a2a'); b.line([[0, -11], [0, -15.5]], 1, '#e8e0c8', 1); b.line([[-1.8, -14], [1.8, -14]], 1, '#e8e0c8', 1);
          b.line([[11, 9], [11, -12]], .9, '#5a4630', 1); b.poly([[11, -12], [17, -10], [11, -7.5]], '#d23a3a');
          b.rect(-7, 9.5, 1.4, 1.2, '#5a8ab8', 1); b.rect(-5, 9.5, 1.4, 1.2, '#5a8ab8', 1);
        });
        return VIVO_SPR[key] = V;
      }

      /* marcas en el suelo: huellas, cascos, patas y manchas de lo que muere */
      function addMark(x, y, ang, k, life, col, r) {
        if (!S.marks) return;
        S.marks.push({ x, y, ang, k, life, max: life, col: col || TPAL().mark, r: r || 0, al: k === 'stain' ? .28 : (MAP().ice ? .55 : .8) });
        if (S.marks.length > (GFX_LOW ? 160 : 460)) S.marks.shift();
      }
      function drawMarks() {
        const P = S.player, hw = W / 2 / ZOOM + 40, hh = H / 2 / ZOOM + 40;
        // huellas y manchas en lotes por color y opacidad: un fill por lote en vez de uno por marca
        for (const m of S.marks) {
          if (Math.abs(m.x - P.x) > hw || Math.abs(m.y - P.y) > hh) continue;
          const q = Math.min(8, Math.ceil(m.al * Math.min(1, m.life / (m.max * .45)) * 8)); if (q > 0) MARK_B.add(m.col + q, m.col, q / 8, m);
        }
        MARK_B.each(g => {
          cx.globalAlpha = g.a; cx.fillStyle = g.col; cx.beginPath();
          for (const m of g.l) {
            if (m.k === 'foot') { cx.moveTo(m.x + 4 * Math.cos(m.ang), m.y + 4 * Math.sin(m.ang)); cx.ellipse(m.x, m.y, 4, 2.1, m.ang, 0, TAU); }
            else if (m.k === 'hoof') { const nx = -Math.sin(m.ang) * 3, ny = Math.cos(m.ang) * 3; cx.moveTo(m.x + nx + 2.6, m.y + ny); cx.ellipse(m.x + nx, m.y + ny, 2.6, 2.3, 0, 0, TAU); cx.moveTo(m.x - nx + 2.6, m.y - ny); cx.ellipse(m.x - nx, m.y - ny, 2.6, 2.3, 0, 0, TAU); }
            else if (m.k === 'paw') { for (const [a, d] of [[0, 0], [-.7, 3.2], [.7, 3.2]]) { const px = m.x + Math.cos(m.ang + a) * d, py = m.y + Math.sin(m.ang + a) * d, r = a ? 1.2 : 1.9; cx.moveTo(px + r, py); cx.arc(px, py, r, 0, TAU); } }
            else { cx.moveTo(m.x + m.r, m.y); cx.ellipse(m.x, m.y, m.r, m.r * .55, 0, 0, TAU); }
          }
          cx.fill();
        });
        cx.globalAlpha = 1;
        const Pl = TPAL(); cx.strokeStyle = Pl.glint; cx.lineWidth = 1.2;
        for (const r of S.ripples) { const k = 1 - r.life / r.max, R = 3 + k * 15; cx.globalAlpha = (1 - k) * .55; cx.beginPath(); cx.ellipse(r.x, r.y, R, R * .45, 0, 0, TAU); cx.stroke(); }
        cx.globalAlpha = 1;
      }

      /* animitas: cada tanto una al costado del camino; quedarte cerca te cura hasta que se apagan las velas */
      const ANI_CELL = 1700, ANI_CAP = 35;
      function forAnimitas(x, y, r, fn) {
        const x0 = Math.floor((x - r) / ANI_CELL), x1 = Math.floor((x + r) / ANI_CELL), y0 = Math.floor((y - r) / ANI_CELL), y1 = Math.floor((y + r) / ANI_CELL), o = S.terrSeed;
        for (let i = x0; i <= x1; i++) for (let j = y0; j <= y1; j++) {
          if (hash(i * 13 + o, j * 7 - 3) < .5) continue;
          const ax = (i + .2 + hash(i + o, j + 5) * .6) * ANI_CELL, ay = (j + .2 + hash(i - 5, j + o) * .6) * ANI_CELL;
          if (ax * ax + ay * ay < 450 * 450 || terrWet(ax, ay)) continue;
          fn({ x: ax, y: ay, id: i + ',' + j });
        }
      }
      function aniLeft(a) { return 1 - Math.min(1, (S.ani.get(a.id) || 0) / ANI_CAP); }
      function drawAnimitas() {
        const P = S.player, V = vivoSpr(), hw = W / 2 / ZOOM + 60, hh = H / 2 / ZOOM + 60;
        forAnimitas(P.x, P.y, Math.max(hw, hh), a => {
          if (Math.abs(a.x - P.x) > hw || Math.abs(a.y - P.y) > hh) return;
          dimg(V.animita, a.x, a.y);
          const left = aniLeft(a);
          for (let i = 0; i < 4; i++) {
            const vx = a.x - 6 + i * 4, vy = a.y + 11;
            cx.fillStyle = '#efe6cf'; cx.fillRect(vx - .8, vy - 3, 1.6, 3);
            if (left > i / 4) { const fl = .75 + .25 * Math.sin(S.t * 11 + i * 2.3); cx.globalAlpha = fl; cx.fillStyle = '#ffcf6a'; cx.beginPath(); cx.ellipse(vx, vy - 4.2, 1, 1.8 * fl, 0, 0, TAU); cx.fill(); cx.globalAlpha = 1; }
          }
        });
      }

      /* fauna: aves y liebres que se espantan, cardos que rueda el viento */
      function drawCrits(air) {
        const V = vivoSpr(), P = S.player, hw = W / 2 / ZOOM + 40, hh = H / 2 / ZOOM + 60;
        for (const c of S.crit) {
          if ((c.z > 10) !== air || Math.abs(c.x - P.x) > hw || Math.abs(c.y - P.y) > hh) continue;
          const sc = 1 + c.z / 220;
          cx.globalAlpha = .28 / (1 + c.z / 50); cx.fillStyle = '#000'; cx.beginPath(); cx.ellipse(c.x, c.y + 5, c.k === 'ave' ? 4 : 5, 1.6, 0, 0, TAU); cx.fill(); cx.globalAlpha = 1;
          let s;
          if (c.k === 'ave') s = c.st === 'idle' ? V.birdSit : V.birdFly[((c.t * 14) | 0) % 2];
          else s = V.hare[c.st === 'idle' ? 0 : (((c.t * 9) | 0) % 2)];
          const peck = c.k === 'ave' && c.st === 'idle' && Math.sin(c.t * 3 + c.x) > .85 ? 1.5 : 0;
          cx.save(); cx.translate(c.x, c.y - c.z + peck); cx.scale(c.fl * sc, sc); cx.drawImage(s.img, -s.size / 2, -s.size / 2, s.size, s.size); cx.restore();
        }
        if (!air) return;
        for (const w of S.tw) {
          if (Math.abs(w.x - P.x) > hw || Math.abs(w.y - P.y) > hh) continue;
          cx.globalAlpha = .25; cx.fillStyle = '#000'; cx.beginPath(); cx.ellipse(w.x, w.y + w.r, w.r * .9, w.r * .3, 0, 0, TAU); cx.fill(); cx.globalAlpha = Math.min(1, w.life);
          const s = V.cardo, z = s.size * w.r / 9; cx.save(); cx.translate(w.x, w.y - w.z); cx.rotate(w.rot); cx.drawImage(s.img, -z / 2, -z / 2, z, z); cx.restore(); cx.globalAlpha = 1;
        }
      }

      /* actualización por frame de todo lo anterior */
      function worldUpdate(dt) {
        const P = S.player, M = MAP(), ice = !!M.ice;
        for (const m of S.marks) m.life -= dt;
        while (S.marks.length && S.marks[0].life <= 0) S.marks.shift();
        for (let i = S.marks.length - 1; i >= 0; i--) if (S.marks[i].life <= 0) S.marks.splice(i, 1);
        for (const r of S.ripples) r.life -= dt; S.ripples = S.ripples.filter(r => r.life > 0);

        // pasos en el mallín / la nieve
        const sp = Math.hypot(P.vx, P.vy);
        if (S.pWet && P.dashT <= 0 && sp > 30) {
          S.stepAcc += sp * dt; const L = S.ride ? 26 : 17;
          if (S.stepAcc > L) {
            S.stepAcc -= L; S.stepSide = -S.stepSide;
            const ang = Math.atan2(P.vy, P.vx), nx = -Math.sin(ang), ny = Math.cos(ang), o = (S.ride ? 5 : 3.2) * S.stepSide;
            addMark(P.x + nx * o, P.y + ny * o + (S.ride ? 7 : 10), ang, S.ride ? 'hoof' : 'foot', ice ? 26 : 15);
            if (ice) burst(P.x, P.y + 10, 2, '#e6eef6', 45);
            else { S.ripples.push({ x: P.x, y: P.y + 10, life: .75, max: .75 }); if (S.t - S.splT > .2) { S.splT = S.t; sfx(rnd(160, 230), .07, 'sine', .018, .55); } }
          }
        } else if (!S.pWet) S.stepAcc = 0;
        if (S.pWet && !S.wetTip) { S.wetTip = true; banner(ice ? 'Nieve honda: te hundís y dejás rastro' : 'Mallín: el barro te frena y deja tus huellas'); }

        // animitas
        S.aniScan -= dt;
        if (S.aniScan <= 0) { S.aniScan = .1; S.aniNear = null; forAnimitas(P.x, P.y, 70, a => { if (Math.hypot(a.x - P.x, a.y - P.y) < 62 && aniLeft(a) > 0) S.aniNear = a; }); }
        const an = S.aniNear;
        if (an && P.hp < ST.maxHp) {
          const h = Math.min(2.2 * dt, ST.maxHp - P.hp); P.hp += h; S.ani.set(an.id, (S.ani.get(an.id) || 0) + h);
          if (Math.random() < dt * 6) S.parts.push({ x: an.x + rnd(-8, 8), y: an.y + 8, vx: rnd(-8, 8), vy: -rnd(20, 40), life: .9, max: .9, size: 2, col: '#ffcf6a', glow: true });
          if (!S.aniTip) { S.aniTip = true; banner('Una animita: quedate cerca para recuperar vida'); }
        }

        // fauna
        S.critT -= dt;
        if (S.critT <= 0 && !GFX_LOW) {
          S.critT = rnd(3, 6);
          if (S.crit.length < 14) {
            const a = Math.random() * TAU, d = rnd(260, 430), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d * .7;
            if (!ice && Math.random() < .35 && !terrWet(x, y)) S.crit.push({ k: 'liebre', x, y, vx: 0, vy: 0, z: 0, st: 'idle', t: rnd(0, 3), fl: Math.random() < .5 ? -1 : 1 });
            else { const n = 2 + ((Math.random() * 4) | 0); for (let i = 0; i < n; i++) S.crit.push({ k: 'ave', x: x + rnd(-26, 26), y: y + rnd(-16, 16), vx: 0, vy: 0, z: 0, st: 'idle', t: rnd(0, 3), fl: Math.random() < .5 ? -1 : 1 }); }
          }
        }
        for (const c of S.crit) {
          c.t += dt; const dx = c.x - P.x, dy = c.y - P.y, d = Math.hypot(dx, dy) || 1;
          if (c.st === 'idle') {
            const scare = (c.k === 'ave' ? 125 : 95) * (P.dashT > 0 || S.ride ? 1.6 : 1);
            if (d < scare) {
              c.st = 'flee'; c.t = 0; const s = c.k === 'ave' ? rnd(140, 200) : rnd(230, 290);
              c.vx = dx / d * s + rnd(-35, 35); c.vy = dy / d * s * .8 + rnd(-35, 35); c.fl = c.vx < 0 ? -1 : 1;
              if (c.k === 'ave' && S.t - S.birdT > .6) { S.birdT = S.t; sfx(rnd(1500, 1900), .07, 'triangle', .012, 1.4); setTimeout(() => sfx(rnd(1300, 1700), .06, 'triangle', .01, 1.3), 90); }
            } else if (c.k === 'ave' && Math.random() < dt * .5) c.fl *= -1;
          } else {
            c.x += c.vx * dt; c.y += c.vy * dt;
            if (c.k === 'ave') c.z += dt * (45 + c.z * 1.1);
            else { c.z = Math.abs(Math.sin(c.t * 13)) * 5; if (Math.random() < dt * 1.4) { const a = Math.atan2(c.vy, c.vx) + rnd(-.7, .7), s = Math.hypot(c.vx, c.vy); c.vx = Math.cos(a) * s; c.vy = Math.sin(a) * s; c.fl = c.vx < 0 ? -1 : 1; } }
          }
          if (d > 1000 || c.z > 280) c.dead = true;
        }
        compact(S.crit);

        // cardos rodantes con el viento
        const w = S.weather;
        if (!ice && !GFX_LOW && w && w.type === 'viento' && (w.k || 0) > .4) {
          S.twT -= dt;
          if (S.twT <= 0 && S.tw.length < 9) {
            S.twT = rnd(.45, 1);
            const hw = W / 2 / ZOOM, hh = H / 2 / ZOOM, off = Math.max(hw, hh) + 60, px_ = -w.dy, py_ = w.dx, s = rnd(-1, 1) * Math.max(hw, hh);
            S.tw.push({ x: P.x - w.dx * off + px_ * s, y: P.y - w.dy * off + py_ * s, vx: w.dx * rnd(170, 250), vy: w.dy * rnd(170, 250), rot: 0, z: 0, t: rnd(0, 3), r: rnd(7, 11), life: 9 });
          }
        }
        for (const c of S.tw) {
          const k = w && w.type === 'viento' ? .55 + .45 * (w.k || 0) : .4; c.t += dt; c.life -= dt;
          c.x += c.vx * k * dt; c.y += c.vy * k * dt; c.rot += Math.hypot(c.vx, c.vy) * k / c.r * dt * (c.vx < 0 ? -1 : 1);
          c.z = Math.abs(Math.sin(c.t * 5.5)) * 9 * k;
          if (c.life <= 0) c.dead = true;
        }
        compact(S.tw);

        // estrella fugaz / grillos / aullidos
        if (S.star) { S.star.life -= dt; S.star.x += S.star.vx * dt; S.star.y += S.star.vy * dt; if (S.star.life <= 0) S.star = null; }
        else if (!ice && !GFX_LOW && Math.random() < dt * .025) S.star = { x: rnd(W * .1, W * .9), y: rnd(0, H * .25), vx: rnd(-1, 1) < 0 ? -rnd(500, 700) : rnd(500, 700), vy: rnd(140, 240), life: .6, max: .6 };
        S.crkT -= dt;
        if (S.crkT <= 0) {
          S.crkT = rnd(.5, 1.3);
          let near = 0; for (const e of S.enemies) { if (!e.dead && !e.prop && Math.abs(e.x - P.x) < 280 && Math.abs(e.y - P.y) < 280 && ++near > 5) break; }
          const n = nightState();
          if (!ice && near <= 5 && n && n.a > .3) { const f = rnd(4100, 4500); sfx(f, .03, 'sine', .004); setTimeout(() => sfx(f, .03, 'sine', .004), 70); setTimeout(() => sfx(f, .03, 'sine', .0035), 140); }
          if (ice && Math.random() < .12) sfx(rnd(55, 75), .5, 'sawtooth', .012, .6);
        }
      }
      function howlFar() {
        if (!S || S.t - (S.howlT || -99) < 14) return; S.howlT = S.t;
        sfx(300, 1.3, 'sine', .018, 1.6); setTimeout(() => sfx(470, 1, 'sine', .014, .75), 650);
      }

