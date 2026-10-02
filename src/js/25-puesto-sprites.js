      /* ---------------- sprites de la escena ---------------- */
      const PUS = {};
      const puSpr = (key, size, draw) => PUS[key] || (PUS[key] = pixSprite(size, 1, draw));
      /* ---- árboles: tronco retorcido con raíces, ramas que asoman entre la copa y racimos de hojas en capas
         (sombra, medio, luz y brillo). full controla cuántos racimos tiene la copa. ---- */
      const PAL_OTONO = ['#5e1e16', '#9a3420', '#cc5a26', '#f08a3a'], PAL_ORO = ['#7a3414', '#b8601e', '#e0922e', '#f8c458'], PAL_VERDE = ['#23381e', '#3a5a2a', '#5a8038', '#86ac4c'];
      function treeDraw(b, o) {
        const s = o.s, sd = o.seed, R = (i, k) => hash(i * 13 + sd, k * 7 + sd * 3), gy = 64 * s;
        const bark = '#5a4232', barkD = rgb('#3a2a20'), barkL = rgb('#8a6a4c');
        b.ellD(4 * s, gy, 46 * s, 8 * s, [0, 0, 0], 2, .3, 0); b.ell(4 * s, gy, 38 * s, 6 * s, [0, 0, 0], 2, .25);
        // raíces que se abren sobre el suelo
        for (const [side, len, k] of [[-1, 30, 0], [1, 27, 1], [-1, 15, 2], [1, 17, 3]]) b.line([[side * 3 * s, gy - 9 * s], [side * len * .55 * s, gy - 2.5 * s], [side * len * s, gy + (k % 2) * 1.5 * s]], 5 * s, bark, 0, 1, 1.2 * s);
        // tronco con giro y ramas principales
        const tr = [[0, gy - 2 * s], [-4 * s, gy - 20 * s], [4 * s, gy - 38 * s], [1 * s, gy - 54 * s], [-2 * s, gy - 66 * s]];
        b.line(tr, 17 * s, bark, 0, 1, 8 * s);
        const limbs = [
          [[0, gy - 48 * s], [-17 * s, gy - 64 * s], [-36 * s, gy - 78 * s], [-50 * s, gy - 86 * s]],
          [[3 * s, gy - 42 * s], [21 * s, gy - 58 * s], [36 * s, gy - 76 * s], [48 * s, gy - 92 * s]],
          [[-1 * s, gy - 62 * s], [-7 * s, gy - 88 * s], [0, gy - 110 * s]],
          [[2 * s, gy - 58 * s], [15 * s, gy - 82 * s], [22 * s, gy - 102 * s]]];
        for (const L of limbs) b.line(L, 7 * s, bark, 0, 1, 2.2 * s);
        b.tex(bark, (x, y) => hash(x * 5, y >> 2) < .2 ? barkD : hash(x * 3 + 1, y >> 1) < .12 ? barkL : null);
        // copa
        const anchors = [];
        for (const L of limbs) { anchors.push(L[L.length - 1]); anchors.push(L[L.length - 2]); }
        anchors.push([0, gy - 116 * s], [-24 * s, gy - 100 * s], [26 * s, gy - 104 * s]);
        const n = Math.round(5 + o.full * 17), cl = [];
        for (let i = 0; i < n; i++) { const A = anchors[(i * 5) % anchors.length]; cl.push({ x: A[0] + (R(i, 1) - .5) * 30 * s, y: A[1] + (R(i, 2) - .5) * 16 * s - 6 * s, r: (10 + R(i, 3) * 8) * s, p: o.pals[i % o.pals.length] }); }
        cl.sort((a, b_) => a.y - b_.y);
        const blob = c => {
          const P = c.p;
          for (let k = 0; k < 12; k++) { const a = k / 12 * TAU + R(k, c.x | 0); b.ell(c.x + 1.5 * s + Math.cos(a) * c.r, c.y + 2.5 * s + Math.sin(a) * c.r * .74, 2.8 * s, 2.2 * s, P[0]); }
          b.ell(c.x + 1.5 * s, c.y + 2.5 * s, c.r * 1.02, c.r * .78, P[0]);
          b.ell(c.x, c.y, c.r * .9, c.r * .68, P[1]);
          for (let k = 0; k < 8; k++) { const a = -2.6 + k * .45; b.ell(c.x + Math.cos(a) * c.r * .72, c.y + Math.sin(a) * c.r * .55, 2.4 * s, 2 * s, P[2]); }
          b.ell(c.x - c.r * .22, c.y - c.r * .22, c.r * .52, c.r * .38, P[2]);
          b.ell(c.x - c.r * .34, c.y - c.r * .3, c.r * .2, c.r * .15, P[3], 1);
        };
        const half = Math.ceil(cl.length * .55);
        cl.slice(0, half).forEach(blob);
        // ramitas que asoman entre los racimos
        for (let i = 0; i < limbs.length; i++) { const L = limbs[i], e = L[L.length - 1]; b.line([L[L.length - 2], e, [e[0] + (R(i, 9) - .5) * 14 * s, e[1] - 8 * s]], 2.4 * s, bark, 0, 1, 1 * s); }
        cl.slice(half).forEach(blob);
        for (const P of o.pals) { b.tex(P[1], (x, y) => hash(x * 7 + sd, y * 5) < .12 ? rgb(P[2]) : hash(x * 3, y * 9 + sd) < .08 ? rgb(P[0]) : null); b.tex(P[2], (x, y) => hash(x * 5, y * 7 + sd) < .1 ? rgb(P[3]) : null); }
      }
      /* ---- el ñire de las habilidades se distingue: único árbol en otoño, en un claro con anillo de piedras,
         apacheta con velas, una cinta por cada nudo aprendido (color de su rama) y aviso cuando hay algo para aprender ---- */
      const PAL_VERDE2 = ['#1e2e1c', '#2e4a28', '#4a6a34', '#6a8c44'];
      function sprNire(bucket) { return puSpr('nire3_' + bucket, 236, b => treeDraw(b, { s: 1.16, seed: 7, full: .12 + bucket * .22, pals: [PAL_OTONO, PAL_ORO] })); }
      function sprNireChico(v) { return puSpr('nch3_' + v, 120, b => treeDraw(b, { s: .52, seed: v * 11, full: .45 + (v % 3) * .18, pals: v % 2 ? [PAL_VERDE] : [PAL_VERDE2] })); }
      const NIRE_X = 118, NIRE_Y = 110, NIRE_GY = 188;
      function sprNireRing(front) {
        return puSpr('nring' + (front ? 1 : 0), 96, b => {
          for (let i = 0; i < 16; i++) {
            const a = i / 16 * TAU + .1, y = Math.sin(a); if (front !== (y > 0)) continue;
            const x = Math.cos(a) * 38, yy = y * 11, r = 3.6 + hash(i, 8) * 1.4;
            b.ell(x, yy, r, r * .72, i % 3 ? '#6a7078' : '#5d635e'); b.ell(x - .8, yy - 1, r * .45, r * .3, '#8e949c', 1);
          }
        });
      }
      function sprApacheta(f) {
        return puSpr('apacheta' + f, 40, b => {
          b.ellD(0, 9, 13, 3, [0, 0, 0], 2, .3, 0);
          const st = [[-8, 6, 4.2], [0, 7, 4.8], [8, 6, 4], [-4, 1, 4], [4, 1.5, 3.8], [0, -4, 3.4], [-1, -8.5, 2.6]];
          st.forEach(([x, y, r], i) => { b.ell(x, y, r, r * .75, ['#6a7078', '#5d635e', '#7a7e84'][i % 3]); b.ell(x - .8, y - .9, r * .4, r * .28, '#9aa0a8', 1); });
          for (const [x, y] of [[-7, 1], [7, 2]]) { b.rect(x - 1, y - 5, 2, 5, '#e8e0c8'); const h = f ? 3 : 2.2; b.rect(x - .6, y - 5 - h, 1.4, h, '#ff9a3c', 2); b.rect(x - .3, y - 5 - h + .6, .8, h * .5, '#fff0a0', 2); }
        });
      }
      function sprCinta(col, f) {
        return puSpr('cinta2' + col + f, 28, b => {
          b.rect(-2, -1.4, 4, 2.4, dk(col, .2));
          b.line([[-.6, 0], [.4 + f * 1.2, 6], [f ? 2.4 : -1, 12.5]], 2.6, col, 0, 1, 2);
          b.line([[.8, 0], [1.8 + f * .8, 5], [f ? 1 : 3, 9]], 1.8, lt(col, .1), 0, 1, 1.4);
        });
      }
      function sprMarca() {
        return puSpr('marca2', 30, b => { b.poly([[0, -10], [6.5, 0], [0, 10], [-6.5, 0]], '#e0b75a'); b.poly([[0, -6], [3.4, 0], [0, 1.6], [-2.8, -.8]], '#fff0b8', 1); b.dot(0, -.4, '#fff8e0', 1); });
      }
      const NIRE_CINTA = { b: [-60, -53, -46, -40, -35], c: [-27, -21, -15, -10, -5], p: [5, 10, 15, 21, 27], h: [35, 40, 46, 53, 60] };
      function nireCanLearn() { for (const id in NIRE) if (nireState(id) === 'buy') return true; return false; }
      function drawNireScene(t, own) {
        dimg(sprNireRing(false), NIRE_X, NIRE_GY);
        dimg(sprNire(Math.min(4, Math.ceil(own / 5))), NIRE_X, NIRE_Y);
        // cintas: una por nudo aprendido, colgada de la copa con el color de su rama
        for (const br of ['b', 'c', 'p', 'h']) {
          const ids = Object.keys(NIRE).filter(k => NIRE[k].br === br);
          ids.forEach((id, i) => {
            if (!NI(id)) return; const x = NIRE_X + NIRE_CINTA[br][i], y = NIRE_Y - 3 + hash(i, br.charCodeAt(0)) * 8, f = ((t * 3 + i + x * .1) | 0) % 2;
            dimg(sprCinta(NIRE_BR[br].col, f), x, y + 4);
          });
        }
        dimg(sprNireRing(true), NIRE_X, NIRE_GY);
        dimg(sprApacheta(Math.sin(t * 9) > 0 ? 1 : 0), NIRE_X + 44, NIRE_GY + 2);
        if (nireCanLearn()) { const bob = Math.round(Math.sin(t * 3) * 2); dimg(sprMarca(), NIRE_X, NIRE_Y - 96 + bob); }
      }
      /* ---- fogón: piedras en anillo, leños cruzados con cortes a la vista y fuego en capas ---- */
      function fireStones(front) {
        return puSpr('fst' + (front ? 1 : 0), 76, b => {
          for (let i = 0; i < 11; i++) {
            const a = i / 11 * TAU + .15, y = Math.sin(a); if (front !== (y > 0)) continue;
            const x = Math.cos(a) * 23, yy = y * 11 + 4, r = 4.6 + hash(i, 3) * 1.6;
            b.ell(x, yy, r, r * .75, i % 3 ? '#6a7078' : '#5d635e'); b.ell(x - 1, yy - 1.2, r * .5, r * .32, '#8e949c', 1); b.dot(x + 1.5, yy + 1, '#3e4448', 1);
          }
          if (!front) {
            b.ell(0, 6, 15, 4.5, '#2a140c'); b.ell(0, 5.5, 11, 3, '#b8401a', 2); b.ell(-2, 5, 5, 1.4, '#ff9a3c', 2);
            const log = (p0, p1, col) => { b.line([p0, p1], 5.6, col, 0, 1, 5); b.ell(p0[0], p0[1], 2.8, 2.8, '#c89060'); b.dot(p0[0], p0[1], '#8a5a34', 1); };
            log([-17, 9], [11, -2], '#6a3a24'); log([17, 9], [-11, -2], '#5a3020');
            b.tex('#6a3a24', (x, y) => (x + y) % 3 === 0 ? [84, 46, 28] : null); b.tex('#5a3020', (x, y) => (x - y) % 3 === 0 ? [72, 40, 24] : null);
            for (const [x, y] of [[-6, 4], [5, 3], [0, 6], [-10, 6], [9, 6]]) b.dot(x, y, '#ff8a2a', 2);
          }
        });
      }
      function fireFrame(i) {
        return puSpr('fire' + i, 64, b => {
          const layers = [['#c8321e', 1], ['#f07a1e', .72], ['#ffc83a', .46], ['#fff2a8', .22]];
          for (const [col, k] of layers) {
            for (let t = 0; t < 5; t++) {
              const x = (t - 2) * 5.2 * (.6 + k * .4), h = (13 + hash(t, i * 3 + 1) * 13) * (1 - Math.abs(t - 2) * .18) * k + (k < 1 ? 3 : 0), sw = Math.sin(i * 1.05 + t * 1.7) * 2.2 * k;
              const w = 5.4 * (.5 + k * .5);
              b.poly([[x - w, 10], [x - w * .7 + sw * .3, 10 - h * .45], [x + sw, 10 - h], [x + w * .7 + sw * .3, 10 - h * .45], [x + w, 10]], col, 2);
            }
          }
          for (let k = 0; k < 3; k++) { const x = (hash(k, i + 9) - .5) * 16, y = -14 - hash(k + 3, i) * 12; b.rect(x, y, 1.6, 1.6, k % 2 ? '#f07a1e' : '#c8321e', 2); }
        });
      }
      function sprPava() {
        return puSpr('pava3', 30, b => {
          const k = .72, P = (x, y) => [x * k, y * k];
          b.ell(1 * k, 9.5 * k, 12 * k, 3.2 * k, '#5d635e'); b.ell(0, 8.6 * k, 10 * k, 2.3 * k, '#6f7670');
          b.line([P(-6, 3), P(-11, -2), P(-13.5, -6.5)], 2.6 * k, '#9aa0ac', 0, 1, 1.5 * k);
          b.ell(0, 2 * k, 9 * k, 7 * k, '#b4bac6'); b.rect(-9 * k, 2 * k, 18 * k, 5 * k, '#b4bac6'); b.rect(-9.4 * k, 6.4 * k, 18.8 * k, 1.6 * k, '#868c98');
          b.line([P(-4, -2.5), P(-5, 6)], .8 * k, '#98a0ac', 1); b.line([P(4, -2.5), P(5, 6)], .8 * k, '#98a0ac', 1);
          b.line([P(-6.4, -1), P(-6.8, 4.5)], 1.2 * k, '#eef2f8', 1);
          b.ell(0, -4.4 * k, 5 * k, 1.9 * k, '#cdd2dc'); b.ell(0, -6.6 * k, 1.7 * k, 1.5 * k, '#5a5e68');
          b.line(qb(P(-6.5, -4), P(0, -17), P(6.5, -4), 10), 1.9 * k, '#5a5e68');
          b.line([P(-2.8, -11.4), P(2.8, -11.4)], 2.2 * k, '#8a3a3a');
        });
      }
      function sprMate() {
        return puSpr('mate2', 16, b => {
          b.ellD(0, 4.2, 3.6, 1.1, [0, 0, 0], 2, .3, 0);
          b.ell(0, 1.4, 3.2, 3, '#7a3424');
          b.ell(0, -1.3, 2.4, .9, '#c8ccd4'); b.dot(0, -1.4, '#5e7a34', 1);
          b.line([[.5, -1.3], [2.2, -4.8]], .7, '#d8dce4', 1);
        });
      }
      function drawFogon(t) {
        const P = PU;
        cx.save(); cx.translate(320, 262);
        dimg(fireStones(false), 0, 0);
        dimg(fireFrame(((t * 9) | 0) % 6), 0, -6);
        dimg(fireStones(true), 0, 0);
        for (const e of P.embers) { cx.globalAlpha = clamp(e.l / e.m, 0, 1); cx.fillStyle = e.l > 1 ? '#ffd070' : '#ff7a2a'; cx.fillRect(Math.round(e.x), Math.round(e.y - 6), 1.5, 1.5); }
        cx.globalAlpha = 1; cx.restore();
      }

      function sprCarpa() {
        return puSpr('carpa', 140, b => {
          b.ellD(0, 30, 56, 12, [0, 0, 0], 2, .3, 0);
          b.poly([[-52, 26], [0, -34], [0, 30]], '#b8a47a'); b.poly([[52, 26], [0, -34], [0, 30]], '#d4c296');
          b.tex('#b8a47a', (x, y) => (x + y) % 5 === 0 ? [160, 140, 104] : null); b.tex('#d4c296', (x, y) => (x - y) % 5 === 0 ? [196, 180, 140] : null);
          b.poly([[-15, 30], [0, -4], [15, 30]], '#2a1d14', 1);
          b.line([[0, -34], [0, 30]], 1.6, '#5a3a22', 1);
          b.line([[-52, 26], [-62, 34]], .7, '#8a7a5a', 1); b.line([[52, 26], [62, 34]], .7, '#8a7a5a', 1);
        });
      }
      function sprRancho(lv) {
        return puSpr('rancho' + lv, 200, b => {
          b.ellD(0, 44, 86, 12, [0, 0, 0], 2, .3, 0);
          b.rect(-62, -6, 124, 48, '#b8845a');
          b.tex('#b8845a', (x, y) => hash(x * 3, y * 7) < .12 ? [160, 112, 74] : hash(x, y * 5) < .05 ? [208, 160, 116] : null);
          b.rect(-12, 10, 24, 32, '#3a2616'); b.dot(8, 26, '#c9a45c', 1);
          b.rect(28, 10, 16, 13, '#ffcf6a', 1); b.line([[36, 10], [36, 23]], 1, '#5a3a22', 1); b.line([[28, 16.5], [44, 16.5]], 1, '#5a3a22', 1);
          b.rect(-46, 10, 16, 13, '#2a2438', 1);
          b.poly([[-76, -4], [76, -4], [62, -50], [-62, -50]], '#9a8a44');
          b.tex('#9a8a44', (x, y) => (x % 3 === 0) ? [122, 108, 54] : hash(x, y * 3) < .1 ? [176, 160, 90] : null);
          b.line([[-62, -50], [62, -50]], 2.4, '#6a5a2a');
          b.rect(-44, -60, 10, 18, '#8a4a32'); b.tex('#8a4a32', (x, y) => (y % 3 === 0) ? [108, 58, 40] : null);
          if (lv >= 3) {
            b.poly([[-84, -2], [84, -2], [88, 16], [-88, 16]], '#7e6e36');
            b.tex('#7e6e36', (x, y) => (x % 3 === 1) ? [100, 88, 44] : null);
            for (const x of [-80, -40, 40, 80]) b.line([[x, 16], [x, 44]], 3, '#5a3a22');
            b.line([[-100, 30], [-100, 44]], 2.4, '#5a3a22'); b.line([[-116, 30], [-116, 44]], 2.4, '#5a3a22'); b.line([[-120, 31], [-96, 31]], 2, '#6a4a2c');
          }
        });
      }
      function sprCarreta() {
        return puSpr('carreta', 150, b => {
          b.ellD(0, 30, 62, 10, [0, 0, 0], 2, .3, 0);
          b.line([[40, 14], [70, 24]], 2.4, '#5a3a22');
          b.rect(-42, -4, 84, 24, '#6a4a2c'); b.tex('#6a4a2c', (x, y) => (y % 4 === 0) ? [84, 58, 34] : null);
          b.ell(0, -10, 44, 22, '#d8ccaa'); b.tex('#d8ccaa', (x, y) => (x % 9 === 0) ? [184, 172, 140] : null);
          for (const x of [-40, 40]) {
            b.ell(x, 20, 12, 13, '#3a2a1a'); b.ell(x, 20, 8, 9, '#6a4a2c'); b.ell(x, 20, 2.5, 2.5, '#3a2a1a', 1);
            for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; b.line([[x + Math.cos(a) * 8, 20 + Math.sin(a) * 9], [x - Math.cos(a) * 8, 20 - Math.sin(a) * 9]], 1, '#3a2a1a', 1); }
          }
          b.ell(-58, 16, 8, 10, '#7a5236'); b.line([[-66, 12], [-50, 12]], 1, '#3a2a1a', 1); b.line([[-66, 20], [-50, 20]], 1, '#3a2a1a', 1);
          b.rect(-20, -26, 40, 11, '#2a1d14', 1); b.rect(-18, -24, 36, 7, '#c9a45c', 1);
        });
      }
      /* ---- fragua: ladrillos sueltos con mortero, campana y chimenea, brasero con carbón, fuelle de cuero ---- */
      function brickTex(b, col, sd) {
        const base = rgb(col), mort = dk(col, .45);
        b.tex(col, (x, y) => {
          const row = y >> 1, off = (row & 1) * 2; if ((y & 1) === 0 && hash(x, row + sd) < .9) return mort; if (((x + off) % 5) === 0) return mort;
          const k = hash(((x + off) / 5) | 0, row + sd * 7); return k < .25 ? dk(col, .15) : k > .8 ? lt(col, .12) : null;
        });
      }
      function sprFragua(lv) {
        return puSpr('fragua3_' + lv, 124, b => {
          b.ellD(0, 31, 46, 8, [0, 0, 0], 2, .3, 0); b.ell(0, 31, 38, 6, [0, 0, 0], 2, .25);
          if (lv < 1) {
            for (const [x, y] of [[-18, 22], [-6, 26], [8, 22], [-12, 15], [2, 17], [16, 27], [-2, 9]]) b.rect(x - 6, y - 3, 12, 6, '#8a4a32');
            brickTex(b, '#8a4a32', 3);
            b.line([[30, 28], [30, -2]], 2.6, '#5a3a22'); b.rect(21, -12, 20, 11, '#6a4a2c'); b.line([[24, -7], [38, -7]], 1, '#3a2a1a', 1);
            return;
          }
          // chimenea y campana
          b.rect(-10, -56, 18, 40, '#7a4030'); b.rect(-12, -58, 22, 4, '#5a2e22');
          b.poly([[-26, -12], [24, -12], [14, -24], [-16, -24]], '#6e3a2a');
          brickTex(b, '#7a4030', 5); brickTex(b, '#6e3a2a', 9);
          // cuerpo
          b.rect(-28, -10, 54, 36, '#8a4a32'); brickTex(b, '#8a4a32', 1);
          b.rect(-30, -12, 58, 4, '#5d635e'); b.tex('#5d635e', (x, y) => hash(x * 3, y) < .3 ? [80, 86, 82] : null);
          // brasero con carbón encendido
          b.ell(-1, -9, 20, 5.5, '#1e1210');
          for (let i = 0; i < 22; i++) { const a = hash(i, 4) * TAU, r = hash(i, 6) * .9; b.dot(-1 + Math.cos(a) * 17 * r, -9 + Math.sin(a) * 4.5 * r, i % 4 === 0 ? '#fff0a0' : i % 2 ? '#ff8a2a' : '#c8401a', 2); }
          // boca del fuego
          b.rect(-8, 4, 14, 10, '#1e1210'); b.rect(-6, 8, 10, 5, '#c8401a', 2); b.rect(-4, 10, 6, 2, '#ffb040', 2);
          // fuelle de cuero con mangos
          b.poly([[28, 2], [44, -6], [46, 8], [30, 12]], '#8a5a34'); b.tex('#8a5a34', (x, y) => (x % 3 === 0) ? [110, 74, 44] : null);
          b.line([[44, -6], [52, -9]], 1.6, '#5a3a22'); b.line([[46, 8], [54, 9]], 1.6, '#5a3a22'); b.line([[28, 6], [24, 4]], 1.6, '#3e4448');
          if (lv >= 2) {
            // balde de agua y estante de herramientas
            b.ell(-40, 16, 9, 11, '#6a4a2c'); b.tex('#6a4a2c', (x, y) => (x % 3 === 0) ? [84, 58, 34] : null);
            b.line([[-49, 11], [-31, 11]], 1.2, '#5a6272'); b.line([[-49, 21], [-31, 21]], 1.2, '#5a6272'); b.ell(-40, 6, 8, 2.6, '#6a9ab8'); b.dot(-42, 5.6, '#c8e0f0', 1);
            b.rect(30, -44, 22, 3, '#6a4a2c');
            b.line([[34, -41], [34, -26]], 1.2, '#5a6272'); b.line([[33, -26], [36, -24]], 1.2, '#5a6272');
            b.line([[41, -41], [41, -28]], 1.4, '#6a4a2c'); b.rect(39, -30, 5, 3, '#5a6272');
            b.line([[48, -41], [47, -27]], 1, '#5a6272'); b.line([[49, -41], [50, -27]], 1, '#5a6272');
          }
        });
      }
      function sprYunque() {
        return puSpr('yunque2', 54, b => {
          b.ellD(0, 17, 17, 4, [0, 0, 0], 2, .3, 0);
          b.ell(0, 14, 9, 4, '#6a4a2c'); b.rect(-9, 4, 18, 10, '#6a4a2c'); b.ell(0, 4, 9, 3.4, '#a07a50'); b.ell(0, 4, 5, 1.8, '#8a6440', 1); b.dot(0, 4, '#6a4a2c', 1);
          b.tex('#6a4a2c', (x, y) => (x % 3 === 0) ? [84, 58, 34] : null);
          b.rect(-4, -2, 8, 6, '#3e4250');
          b.poly([[-12, -8], [8, -8], [18, -5], [10, -2], [-12, -2]], '#4a4e58'); b.rect(-14, -9, 4, 7, '#4a4e58');
          b.line([[-12, -8], [12, -8]], 1, '#9aa4b4', 1); b.dot(-6, -6, '#2a2e36', 1);
        });
      }
      /* tranquera criolla de dos hojas: postes gruesos, cuatro varas y la diagonal en cada hoja.
         open (0-1) las abre hacia afuera (se acortan en perspectiva y la punta sube un poco) */
      function sprTranquera(open) {
        const k = Math.round(open * 6);
        return puSpr('tranq2_' + k, 128, b => {
          const L = 37 * (1 - k * .11), up = k * .7;
          b.ellD(0, 3, 50, 4.5, [0, 0, 0], 2, .3, 0);
          for (const sd of [-1, 1]) {
            const x0 = sd * 39, x1 = x0 - sd * L;
            for (const y of [-27, -20, -13, -6]) b.line([[x0, y], [x1, y - up]], 2.8, '#8a6a44');
            b.line([[x0 - sd, -6], [x1 + sd, -27 - up]], 2.6, '#7a5a38');
            b.line([[x1 + sd, -28 - up], [x1 + sd, -5 - up]], 2.4, '#7a5a38');
          }
          b.tex('#8a6a44', (x, y) => hash(x >> 2, y) < .22 ? [110, 86, 58] : null);
          for (const px of [-42, 42]) { b.rect(px - 3.5, -37, 7, 40, '#5e4028'); b.rect(px - 3.5, -38, 7, 2, '#8a6a44'); b.ell(px, -38, 3.5, 1.3, '#9a7a50', 1); }
          b.tex('#5e4028', (x, y) => (x % 2 === 0 && hash(x, y >> 2) < .4) ? [78, 52, 30] : null);
          if (k === 0) { b.line([[-3, -18], [3, -18]], 1.4, '#b8bcc4'); b.line([[3, -18], [3, -15.5]], 1.2, '#b8bcc4', 1); }
          for (const px of [-42, 42]) b.line([[px + (px < 0 ? 3 : -3), -30], [px + (px < 0 ? 5 : -5), -30]], 1.2, '#b8bcc4', 1);
        });
      }
      /* asador de hierro: la cruz con el cordero abierto, inclinada hacia el fuego */
      function sprAsador() {
        return puSpr('asador', 64, b => {
          b.ellD(0, 16, 8, 2.4, [0, 0, 0], 2, .3, 0);
          b.line([[-2, 16], [6, -22]], 1.6, '#5a6272');
          b.line([[-8, -8], [13, -3]], 1.3, '#5a6272'); b.line([[-4, 8], [10, 11]], 1.3, '#5a6272');
          b.poly([[-7, -9], [12, -5], [10, 10], [-4, 7]], '#8a3a22');
          b.poly([[-5, -7], [10, -4], [8.5, 8], [-2.5, 5.5]], '#a8502a', 1);
          for (let i = 0; i < 5; i++) b.line([[-3.5 + i * 3, -5.5 + i * .7], [-1.5 + i * 2.4, 6 + i * .5]], .7, '#e8d8c0', 1);
          b.ell(2, 1, 2.4, 1.4, '#d88a4a', 1);
          b.line([[6, -22], [6.8, -25]], 1.2, '#8a94a4', 1);
        });
      }
      /* parrilla chica de hierro sobre unas brasas apartadas */
      function sprParrilla() {
        return puSpr('parrilla', 40, b => {
          b.ellD(0, 5, 11, 2.6, [0, 0, 0], 2, .3, 0);
          b.ell(0, 4, 8, 2.2, '#2a140c'); b.ell(0, 3.8, 6, 1.4, '#b8401a', 1); for (const x of [-4, 0, 3]) b.dot(x, 3.6, '#ff9a3c', 2);
          for (const x of [-8, 8]) b.line([[x, 5], [x * .9, -1]], 1, '#4a4e58');
          b.rect(-9, -2, 18, 1.4, '#6a7078'); for (let x = -8; x <= 8; x += 2.6) b.line([[x, -2.6], [x, 1.8]], .6, '#8a94a4', 1);
          b.ell(-3, -2.4, 2.4, 1, '#c8883c', 1); b.ell(3, -2.2, 2.4, 1, '#d89a48', 1);
        });
      }
      function sprTronco(a) {
        const k = Math.round(a * 10);
        return puSpr('tronco2_' + k, 64, b => {
          const c = Math.cos(a), s = Math.sin(a), P = (x, y) => [x * c - y * s, x * s + y * c];
          b.ellD(0, 7, 24, 5, [0, 0, 0], 2, .3, 0);
          b.line([P(-19, 0), P(19, 0)], 9, '#5a3a22');
          b.tex('#5a3a22', (x, y) => (y % 3 === 0) ? [74, 48, 28] : hash(x, y * 3) < .1 ? [110, 76, 46] : null);
          const e = P(19, 0); b.ell(e[0], e[1], 3.2, 4.4, '#c89060'); b.ell(e[0], e[1], 1.6, 2.2, '#a07048', 1); b.dot(e[0], e[1], '#7a5236', 1);
          const m = P(-4, -4.5); b.ell(m[0], m[1], 2, 1.2, '#6a4a2c');
        });
      }
      /* ---- corral ---- */
      function sprFenceH(w) {
        return puSpr('fh' + w, w + 16, b => {
          const n = Math.round(w / 24), x0 = -w / 2;
          b.line([[x0, -12], [x0 + w, -12]], 2.4, '#8a6a44'); b.line([[x0, -5], [x0 + w, -5]], 2.4, '#8a6a44');
          b.tex('#8a6a44', (x, y) => hash(x >> 2, y) < .25 ? [110, 86, 58] : null);
          for (let i = 0; i <= n; i++) { const px = x0 + i * w / n; b.rect(px - 2.4, -19, 4.8, 21, '#6a4a2c'); b.rect(px - 2.4, -20, 4.8, 2, '#8a6a44'); }
          b.tex('#6a4a2c', (x, y) => (x % 2 === 0 && hash(x, y >> 2) < .4) ? [84, 58, 34] : null);
        });
      }
      function sprFenceV(h) {
        return puSpr('fv' + h, h + 30, b => {
          const y0 = -h / 2;
          b.line([[0, y0 - 12], [0, y0 + h - 12]], 2.4, '#8a6a44'); b.line([[0, y0 - 5], [0, y0 + h - 5]], 2.4, '#8a6a44');
          for (let i = 1; i < 4; i++) { const py = y0 + i * h / 4; b.rect(-2.4, py - 19, 4.8, 21, '#6a4a2c'); b.rect(-2.4, py - 20, 4.8, 2, '#8a6a44'); }
          b.tex('#6a4a2c', (x, y) => (x % 2 === 0 && hash(x, y >> 2) < .4) ? [84, 58, 34] : null);
        });
      }
      function sprBebedero() {
        return puSpr('bebedero', 56, b => {
          b.ellD(0, 8, 24, 4, [0, 0, 0], 2, .3, 0);
          b.rect(-22, -6, 44, 13, '#6a4a2c'); b.tex('#6a4a2c', (x, y) => (y % 3 === 0) ? [84, 58, 34] : null);
          b.rect(-19, -4, 38, 5, '#3a6a8a'); b.line([[-14, -2.5], [-6, -2.5]], .8, '#9ac8e8', 1); b.line([[4, -1.5], [12, -1.5]], .8, '#9ac8e8', 1);
          b.rect(-22, -7, 44, 2, '#8a6a44');
        });
      }
      function sprCorralVacio() {
        return puSpr('corral0', 120, b => {
          for (let i = 0; i < 5; i++) { const cx_ = -40 + i * 20, cy_ = 26 + (i % 2) * 6, a = .3 + i * .2, c = Math.cos(a) * 14, s = Math.sin(a) * 14; b.line([[cx_ - c, cy_ - s], [cx_ + c, cy_ + s]], 4.6, '#6a4a2c'); }
          b.tex('#6a4a2c', (x, y) => hash(x, y * 3) < .2 ? [84, 58, 34] : null);
          b.line([[0, -12], [0, 24]], 3, '#5a3a22'); b.rect(-17, -20, 34, 15, '#8a6a44'); b.tex('#8a6a44', (x, y) => (y % 3 === 0) ? [110, 86, 58] : null);
          b.line([[-11, -15], [11, -15]], 1, '#3a2a1a', 1); b.line([[-11, -10], [7, -10]], 1, '#3a2a1a', 1);
        });
      }
      /* ---- cuero estaqueado (dos cuadros para que lo mueva el viento) ---- */
      function sprCuero(f) {
        return puSpr('cuero2_' + f, 64, b => {
          const sw = f ? 1.2 : 0;
          b.ellD(0, 27, 22, 5, [0, 0, 0], 2, .3, 0);
          for (const px of [-18, 18]) b.rect(px - 2.2, -24, 4.4, 50, '#6a4a2c');
          b.rect(-20, -26, 40, 4, '#6a4a2c'); b.tex('#6a4a2c', (x, y) => (x % 2 === 0 && hash(x, y >> 2) < .4) ? [84, 58, 34] : null);
          b.poly([[-13, -16], [13, -16], [11 + sw, 7], [3, 12], [-3, 12], [-11 + sw, 7]], '#b0703e');
          b.tex('#b0703e', (x, y) => hash(x * 3, y * 5) < .14 ? [140, 86, 46] : hash((x >> 1) * 7, (y >> 1) * 3) < .08 ? [200, 140, 90] : null);
          b.rect(-8, -10, 5, 3, '#8a5430', 1); b.rect(3, -2, 6, 3, '#8a5430', 1); b.rect(-4, 5, 4, 2, '#8a5430', 1);
          for (const [a, c, d, e] of [[-13, -16, -17, -22], [13, -16, 17, -22], [-11, 7, -17, 10], [11, 7, 17, 10]]) b.line([[a + (a < 0 ? 0 : 0), c], [d, e]], .8, '#d8c8a0', 1);
        });
      }
      /* ---- farol colgado: tres cuadros de vaivén ---- */
      function sprFarol(k) {
        return puSpr('farol' + k, 22, b => {
          const dx = k * 1.6;
          b.line([[0, -9], [dx * .6, -2]], .8, '#3a2a1a', 1);
          b.rect(dx - 3.6, -1, 7.2, 2, '#3a2a1a'); b.rect(dx - 3, 1, 6, 7, '#3a2a1a'); b.rect(dx - 2.2, 2, 4.4, 5, '#ffcf6a', 2); b.rect(dx - 1, 3, 2, 2.6, '#fff4c8', 2); b.rect(dx - 3.6, 8, 7.2, 1.6, '#3a2a1a');
        });
      }
      /* ---- perro ovejero echado: cabeza gacha o levantada y cola en tres posiciones ---- */
      const puPerro = (up, tail) => puSpr('perro2_' + (up ? 1 : 0) + tail, 48, b => {
        const K = '#1e1c22', Wt = '#e8e2d4', ty = [-2, -5, -8][tail];
        b.ellD(0, 9, 16, 3.5, [0, 0, 0], 2, .3, 0);
        b.line([[10, 3], [14, ty * .5], [17, ty]], 2.4, K, 0, 1, 1.4); b.dot(17, ty, Wt, 1);
        b.ell(1, 3, 11, 5, K); b.ell(-3, 5, 6, 3, Wt);
        b.ell(8, 6, 4, 2, K); b.ell(-7, 7, 3, 1.6, Wt);
        const hy = up ? -4 : 1;
        b.ell(-10, hy, 5, 4.2, K); b.ell(-13.5, hy + 1.6, 2.8, 2, Wt); b.dot(-15.8, hy + 1, '#0c0806', 1);
        b.poly([[-9, hy - 3.5], [-7.5, hy - 8], [-6, hy - 3.5]], K); b.dot(-11, hy - .6, '#e0b75a', 1);
        b.tex(K, (x, y) => hash(x * 5, y * 3) < .08 ? [48, 44, 52] : null);
      });
      function drawPerro(t) {
        const P = PU, near = Math.hypot(P.x - 378, P.y - 300) < 90, pet = P.pet > 0;
        const tail = near || pet ? ((t * (pet ? 14 : 9)) | 0) % 3 : (Math.sin(t * 2) > .7 ? 1 : 0);
        const br = Math.sin(t * 1.8) > 0 ? 0 : 1;
        dimg(puPerro(near || pet, tail), 378, 300 + br * .6);
        if (!near && !pet && Math.sin(t * .9) > .96) { cx.fillStyle = 'rgba(236,230,210,.7)'; cx.fillRect(364, 282 - (t * 8 % 10), 2, 2); cx.fillRect(366, 280 - (t * 8 % 10), 2, 2); }
      }
      function drawCuero(t) { dimg(sprCuero(Math.sin(t * 1.3) > 0 ? 1 : 0), 214, 196); }
      function drawFarol(x, y, t) { const s = Math.sin(t * 1.7 + x); dimg(sprFarol(s > .35 ? 1 : s < -.35 ? -1 : 0), x, y + 4); }
      /* ---- trofeos: una sola imagen pixel art con lo que tengas colgado ---- */
      function trophyPix(b, id, x, y) {
        const R = (px, py, w, h, c) => b.rect(x + px, y + py, w, h, c, 1);
        if (id === 'lobizon') { R(-5, -4, 10, 8, '#6e4a2f'); R(-6, -2, 2, 4, '#6e4a2f'); R(4, -2, 2, 4, '#6e4a2f'); R(-2, -5, 4, 2, '#a07a55'); }
        else if (id === 'caleuche') { R(-1, -6, 2, 2, '#2a2a2a'); R(-3, -4, 6, 7, '#2a3a4e'); R(-2, -3, 4, 5, '#9fe8ff'); R(-3, 3, 6, 1, '#2a3a4e'); }
        else if (id === 'mini_bruja') { R(-1, -6, 2, 8, '#6a4a2c'); R(-3, 2, 6, 4, '#c8a060'); }
        else if (id === 'mini_basilisco') { R(-3, -4, 6, 8, '#e8e0c8'); R(-2, -5, 4, 1, '#e8e0c8'); R(-1, -2, 2, 2, '#8fb36a'); }
        else if (id === 'amanecer') { R(-3, -3, 6, 6, '#ffd070'); R(-5, -1, 2, 2, '#ffb040'); R(3, -1, 2, 2, '#ffb040'); R(-1, -5, 2, 2, '#ffb040'); R(-1, 3, 2, 2, '#ffb040'); }
        else if (id === 'herradura') { R(-4, -4, 2, 8, '#9aa4b4'); R(2, -4, 2, 8, '#9aa4b4'); R(-4, 3, 8, 2, '#9aa4b4'); }
        else if (id === 'cuchivilu') { R(-4, -2, 8, 5, '#9a6a5a'); R(3, -1, 2, 3, '#d8988a'); R(2, 2, 1, 2, '#ece4cc'); R(-6, 0, 2, 3, '#4e6a4a'); }
        else if (id === 'mini_puma') { R(-5, -3, 10, 6, '#b08a5a'); R(-6, -1, 2, 3, '#b08a5a'); R(4, -1, 2, 3, '#b08a5a'); R(-1, -4, 2, 2, '#e0cba8'); }
        else if (id === 'mandinga') { R(-3, 2, 3, 3, '#8a1424'); R(-2, -1, 3, 3, '#8a1424'); R(0, -4, 2, 3, '#b8322f'); R(1, -6, 1, 2, '#ffd23c'); }
      }
      function drawTrophyBoard() {
        const got = TROFEOS.filter(tr => hasTrophy(tr.id)).map(tr => tr.id);
        const spr = puSpr('tabla_' + got.join('.'), 80, b => {
          b.rect(-28, -10, 56, 20, '#6a4a2c'); b.tex('#6a4a2c', (x, y) => (y % 4 === 0) ? [84, 58, 34] : null); b.rect(-28, -10, 56, 2, '#8a6a44');
          got.slice(0, 5).forEach((id, i) => trophyPix(b, id, -20 + i * 10, 0));
          got.slice(5).forEach((id, i) => trophyPix(b, id, -40 - i * 11, 14));
        });
        dimg(spr, 274, 138);
      }
      function drawTrophyPost() {
        const got = TROFEOS.filter(tr => hasTrophy(tr.id)).map(tr => tr.id); if (!got.length) return;
        const spr = puSpr('estaca_' + got.join('.'), 80, b => {
          b.rect(-1.6, -24, 3.2, 50, '#5a3a22');
          got.forEach((id, i) => trophyPix(b, id, i % 2 ? 7 : -7, -16 + i * 8));
        });
        dimg(spr, 254, 142);
      }
      /* ---- facón colgado en la pared de la fragua ---- */
      function sprKnifeWall(kn) {
        return puSpr('kw_' + kn.hoja + kn.cabo, 40, b => {
          const a = -1.2, c = Math.cos(a), s = Math.sin(a), P = d => [d * c, d * s];
          const CAB = { hueso: '#e8e0c8', guampa: '#3a2e28', plata: '#d8dce4' }[kn.cabo], L = kn.hoja === 'caronera' ? 15 : kn.hoja === 'riel' ? 12 : 11;
          b.line([P(-8), P(0)], 2.6, CAB); b.line([P(0), P(1.2)], 3, '#c9a45c');
          b.line([P(1.2), P(1.2 + L)], kn.hoja === 'riel' ? 2.4 : 1.9, kn.hoja === 'riel' ? '#8a94a4' : '#c8d0dc', 0, 1, .6);
        });
      }

      let puMask = null;
      // mismos gradientes que antes, pero generados una sola vez
      function puLightSpr() {
        if (puLightSpr.c) return puLightSpr.c;
        const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 64 * .15, 64, 64, 64);
        gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return puLightSpr.c = c;
      }
      function puWarmSpr(col) {
        puWarmSpr.c = puWarmSpr.c || {}; if (puWarmSpr.c[col]) return puWarmSpr.c[col];
        const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, `rgba(${col},1)`); gr.addColorStop(1, 'rgba(255,120,40,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return puWarmSpr.c[col] = c;
      }
      /* ---- cámara: la escena llena la pantalla a lo alto; en pantallas anchas se ve más paisaje a los costados,
         en el celular vertical la cámara sigue al personaje de lado a lado ---- */
      function puCam() {
        const z = H / (PUH + 6), VW = W / z, oy = (H - PUH * z) / 2;
        const camX = VW >= PUW ? PUW / 2 : clamp(PU.x, VW / 2, PUW - VW / 2);
        return { z, VW, oy, camX, x0: camX - VW / 2, x1: camX + VW / 2 };
      }
      /* ---- cordillera patagónica: picos dentados con nieve cortada por canaletas de roca,
         cerros boscosos al frente y bruma de valle. Se genera una vez a la densidad de los sprites ---- */
      let PU_MTN = null;
      const MTN_X0 = -700, MTN_X1 = 1340;
      function puMountains() {
        if (PU_MTN) return PU_MTN;
        const SC = PXS, w = Math.ceil((MTN_X1 - MTN_X0) / SC), h = Math.ceil((PU_TOP + 2) / SC);
        const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
        const vn = (x, s) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return hash(i, s) * (1 - u) + hash(i + 1, s) * u; };
        const back = new Float32Array(w), far = new Float32Array(w), mid = new Float32Array(w), near = new Float32Array(w);
        for (let i = 0; i < w; i++) {
          const x = i * SC + MTN_X0;
          let r = 0, a = 1, f = 1 / 110; for (let o = 0; o < 5; o++) { const n = vn(x * f, 11 + o); r += a * (1 - Math.abs(n * 2 - 1)); a *= .5; f *= 2.05; }
          far[i] = 62 - Math.pow(clamp(r / 1.94, 0, 1), 1.35) * 56;
          let rb = 0; a = 1; f = 1 / 170; for (let o = 0; o < 4; o++) { const n = vn(x * f, 120 + o); rb += a * (1 - Math.abs(n * 2 - 1)); a *= .5; f *= 2.1; }
          back[i] = 50 - Math.pow(clamp(rb / 1.88, 0, 1), 1.2) * 46;
          let m = 0; a = 1; f = 1 / 150; for (let o = 0; o < 3; o++) { m += a * vn(x * f, 40 + o); a *= .45; f *= 2.4; }
          mid[i] = 73 - m / 1.65 * 20;
          let q = 0; a = 1; f = 1 / 210; for (let o = 0; o < 2; o++) { q += a * vn(x * f, 60 + o); a *= .4; f *= 2.6; }
          near[i] = 79 - q / 1.4 * 8;
        }
        const put = (i, j, c, al) => { const o = (j * w + i) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = al === undefined ? 255 : al; };
        const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
        const HAZE = [64, 80, 112];
        // cordón del fondo, más alto y perdido en la bruma
        for (let i = 0; i < w; i++) {
          const x = i * SC + MTN_X0, tb = Math.floor(back[i] / SC), lit = back[Math.min(w - 1, i + 2)] - back[Math.max(0, i - 2)] > 0;
          for (let j = Math.max(0, tb); j < h; j++) {
            const y = j * SC, alt = clamp((50 - y) / 46, 0, 1), n = vn(x / 8, 33) * .2;
            let col = alt > .35 + n ? (lit ? [150, 164, 190] : [112, 126, 154]) : (lit ? [74, 88, 118] : [62, 74, 102]); if (j === tb) col = lit ? [176, 188, 210] : [132, 146, 172];
            put(i, j, mix(col, HAZE, .35));
          }
        }
        for (let i = 0; i < w; i++) {
          const x = i * SC + MTN_X0, t0 = Math.floor(far[i] / SC);
          const slope = far[Math.min(w - 1, i + 5)] - far[Math.max(0, i - 5)], lit = slope > 0;
          for (let j = Math.max(0, t0); j < h; j++) {
            const y = j * SC, alt = clamp((62 - y) / 56, 0, 1), depth = (y - far[i]) / Math.max(4, 62 - far[i]);
            const n = vn(x / 6, 77) * .22 + hash(i >> 1, j) * .08, gully = vn(x / 3.2 + j * .35 * (lit ? 1 : -1), 91) > .64 && depth > .12;
            let col;
            const deep = depth > .45 && hash(i, j * 7) < (depth - .45) * 1.6;
            if (alt > .2 + n && !gully && depth < .9 && !deep) col = lit ? [222, 230, 242] : [150, 166, 194];
            else col = lit ? [70, 82, 106] : [54, 64, 88];
            if (j === t0) col = lit ? [242, 246, 252] : [178, 192, 216];
            col = mix(col, HAZE, clamp((y - 40) / 34, 0, 1) * .6);
            put(i, j, col);
          }
          const tm = Math.floor(mid[i] / SC);
          for (let j = tm; j < h; j++) { const tree = hash(i, j * 3) < .35; let col = j === tm ? [46, 60, 80] : tree ? [18, 28, 40] : [28, 40, 56]; col = mix(col, HAZE, clamp((80 - j * SC) / 20, 0, 1) * .25); put(i, j, col); }
          const tn = Math.floor(near[i] / SC);
          for (let j = tn; j < h; j++) put(i, j, j === tn ? [34, 44, 40] : hash(i * 3, j) < .3 ? [16, 22, 24] : [22, 30, 30]);
        }
        g.putImageData(img, 0, 0);
        return PU_MTN = c;
      }
      /* ---- decoración que no cambia: coirón, calafates y ñires del borde, repartidos también fuera del puesto ---- */
      /* ---- claro de tierra pisada alrededor del fogón con senderos a cada estación.
         Se hornea una vez a la densidad de los sprites (PXS) con bordes tramados, no con alfa suave. ---- */
      const PU_PATHS = [ // [x1, y1, x2, y2, curva, medio ancho]
        [320, 262, 146, 212, 18, 11], [320, 262, 320, 172, 0, 11], [320, 262, 526, 182, -16, 11],
        [320, 262, 166, 330, -14, 11], [320, 262, 434, 318, 10, 9], [320, 262, 320, 430, 6, 17]];
      let PU_CLEAR = null;
      function puClearing() {
        if (PU_CLEAR) return PU_CLEAR;
        const X0 = -40, Y0 = PU_TOP, w = Math.ceil((PUW + 80) / PXS), h = Math.ceil((PUH - PU_TOP + 24) / PXS);
        const segs = [];
        for (const [x1, y1, x2, y2, bend, hw] of PU_PATHS) {
          const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1, mx = (x1 + x2) / 2 - dy / L * bend, my = (y1 + y2) / 2 + dx / L * bend;
          let px = x1, py = y1;
          for (let i = 1; i <= 10; i++) { const t = i / 10, u = 1 - t, qx = u * u * x1 + 2 * u * t * mx + t * t * x2, qy = u * u * y1 + 2 * u * t * my + t * t * y2; segs.push([px, py, qx, qy, hw * (1 - .15 * t)]); px = qx; py = qy; }
        }
        const segD = (x, y, a) => { const [x1, y1, x2, y2] = a, vx = x2 - x1, vy = y2 - y1, l2 = vx * vx + vy * vy || 1, t = clamp(((x - x1) * vx + (y - y1) * vy) / l2, 0, 1); return Math.hypot(x - x1 - vx * t, y - y1 - vy * t); };
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const g = c.getContext('2d'), img = g.createImageData(w, h), d = img.data;
        const DIRT = [[52, 42, 30], [62, 50, 35], [74, 60, 42]], EDGE = [44, 44, 30], ASH = [58, 54, 50];
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          const wx = X0 + (i + .5) * PXS, wy = Y0 + (j + .5) * PXS;
          let dd = (Math.hypot((wx - 320) / 112, (wy - 268) / 56) - 1) * 56;
          for (const sg of segs) { const v = segD(wx, wy, sg) - sg[4]; if (v < dd) dd = v; }
          dd += (vnoise(wx, wy, 18, 5) - .5) * 10 + (vnoise(wx, wy, 6, 9) - .5) * 5;
          if (dd > 4) continue;
          const k = (j * w + i) * 4, hsh = hash(i * 7 + 3, j * 13 + 1);
          let col;
          if (dd > 0) { if (hsh > .5 - dd * .08) continue; col = EDGE; }
          else {
            const n = vnoise(wx, wy, 22, 2) * .7 + vnoise(wx, wy, 7, 4) * .3;
            col = DIRT[n < .38 ? 0 : n < .66 ? 1 : 2];
            const r = Math.hypot((wx - 320) / 1.6, wy - 266);
            if (r < 34 && hash(i * 5, j * 3) < .55 - r / 80) col = ASH;          // ceniza alrededor del fogón
            if (hsh < .012) col = [124, 118, 104];                              // piedritas
            else if (hsh > .992) col = [70, 74, 40];                            // matas pisadas
          }
          d[k] = col[0]; d[k + 1] = col[1]; d[k + 2] = col[2]; d[k + 3] = 255;
        }
        g.putImageData(img, 0, 0);
        return PU_CLEAR = { c, x: X0, y: Y0 };
      }
      /* ---- ciprés de la cordillera: columna angosta de follaje oscuro, con el lado de la luna más claro ---- */
      function sprCipres(v) {
        return puSpr('cip' + v, 100, b => {
          const hgt = 58 + (v % 3) * 10, sd = v * 17, cols = ['#1a2c22', '#24392a', '#315038', '#46684a'];
          b.ellD(0, 46, 13, 3.5, [0, 0, 0], 2, .32, 0);
          b.rect(-1.6, 38, 3.2, 9, '#4a3424');
          const n = Math.round(hgt / 4.2);
          for (let i = 0; i < n; i++) {
            const t = i / n, yy = 40 - i * 4.2, r = (10 + (v % 2) * 2) * Math.pow(1 - t, .75) + 1.2, ox = (hash(i, sd) - .5) * 2.4;
            b.ell(ox, yy, r, 4.4, cols[i % 2]); b.ell(ox - r * .35, yy - 1, r * .55, 3, cols[2]);
            if (hash(i + 9, sd) < .5) b.ell(ox - r * .55, yy - 1.5, r * .25, 1.6, cols[3]);
          }
          b.tex(cols[0], (x, y) => hash(x * 3 + sd, y * 5) < .14 ? [16, 24, 20] : null);
          b.tex(cols[1], (x, y) => hash(x * 5, y * 3 + sd) < .12 ? [20, 32, 24] : null);
        });
      }
      /* ---- poste con farol colgado: marca cada estación con un charco de luz cálida ---- */
      const PU_POSTS = [[262, 180], [196, 300], [420, 222], [392, 372]];
      function sprPoste() {
        return puSpr('poste', 64, b => {
          b.ellD(1, 2, 7, 2.2, [0, 0, 0], 2, .3, 0);
          b.rect(-1.8, -34, 3.6, 36, '#5e4028'); b.rect(-1.8, -35, 3.6, 1.6, '#8a6a44');
          b.rect(-1.8, -34, 12.5, 2.2, '#6a4a2c'); b.line([[0, -25], [7, -32.5]], 1.4, '#5e4028');
          b.tex('#5e4028', (x, y) => (x % 2 === 0 && hash(x, y >> 2) < .4) ? [78, 52, 30] : null);
        });
      }
      function puDecor() {
        if (PU.decor) return PU.decor;
        const D = { tufts: [], shrubs: [], trees: [] }, H0 = PU_TOP + 14;
        const busy = (x, y) => Math.hypot((x - 118) / 92, (y - 186) / 40) < 1 || (x > 40 && x < 600 && y > 110 && y < 370) || (y >= 366 && Math.abs(x - 320) < 64) || (y < 130 && ((x > 240 && x < 400) || (x > 480 && x < 620) || (x > 50 && x < 190)));
        for (let k = 0; k < 420; k++) { const x = MTN_X0 + 100 + hash(k, 5) * (MTN_X1 - MTN_X0 - 200), y = H0 + hash(k, 9) * (PUH - H0 + 4); if (!busy(x, y)) D.tufts.push({ x, y, v: k % 3, ph: hash(k, 13) * TAU }); }
        for (let k = 0; k < 70; k++) { const x = MTN_X0 + 100 + hash(k, 21) * (MTN_X1 - MTN_X0 - 200), y = H0 + 10 + hash(k, 23) * (PUH - H0); if (!busy(x, y) && (x < 20 || x > 620 || y > 380 || y < 105)) D.shrubs.push({ x, y, v: k % 3 }); }
        const core = [[420, 98, 4], [610, 110, 5], [606, 200, 6], [20, 272, 7], [612, 370, 8], [24, 380, 9]];
        for (const t of core) D.trees.push({ x: t[0], y: t[1], v: t[2] });
        for (let k = 0; k < 44; k++) { const side = k % 2 ? -1 : 1, x = side < 0 ? -40 - hash(k, 31) * 560 : 680 + hash(k, 31) * 560, y = PU_TOP + 30 + hash(k, 33) * (PUH - PU_TOP - 10); D.trees.push({ x, y, v: (k % 9) + 1 }); }
        // borde cerrado: cipreses en los costados y atrás (dejando ver la cordillera) y matas bajas al frente
        D.cips = [];
        const cip = (x, y, v) => D.cips.push({ x, y, v });
        for (let k = 0; k < 15; k++) { cip(-16 + hash(k, 61) * 42, 104 + k * 21 + hash(k, 62) * 10, k % 6); cip(614 + hash(k, 63) * 40, 118 + k * 20 + hash(k, 64) * 10, (k + 3) % 6); }
        for (let k = 0; k < 26; k++) { cip(-40 - hash(k, 65) * 380, PU_TOP + 20 + hash(k, 66) * (PUH - PU_TOP), k % 6); cip(680 + hash(k, 67) * 380, PU_TOP + 20 + hash(k, 68) * (PUH - PU_TOP), (k + 2) % 6); }
        for (const [x, y, v] of [[34, 98, 1], [58, 92, 4], [196, 96, 2], [222, 90, 5], [448, 94, 0], [478, 100, 3], [596, 94, 2], [640, 100, 5]]) cip(x, y, v);
        for (let x = -30; x < 680; x += 30) { if (Math.abs(x - 320) < 76) continue; const hx = hash(x, 71); D.shrubs.push({ x: x + hx * 14, y: 400 + hash(x, 72) * 10, v: (x / 30 | 0) % 3 }); }
        for (const [x, y, v] of [[6, 404, 2], [36, 412, 5], [610, 406, 1], [640, 414, 4]]) cip(x, y, v);
        return PU.decor = D;
      }
      const puTuft = (v, lean) => puSpr('tuft' + v + '_' + lean, 30, b => {
        const cols = v === 2 ? ['#b89a58', '#d8bc70', '#8a7440'] : ['#c8a860', '#e0c878', '#9a8446'], n = 9 + v * 2;
        for (let i = 0; i < n; i++) {
          const a = (i / (n - 1) - .5) * 1.5, hgt = 9 + hash(i, v + 7) * 6, bx = (i / (n - 1) - .5) * 5;
          b.line([[bx, 9], [bx + Math.sin(a) * hgt * .7 + lean * hgt * .18, 9 - Math.cos(a) * hgt]], .9, cols[i % 3], 1);
        }
      });
      const puShrub = v => puSpr('calafate' + v, 44, b => {
        b.ellD(1, 12, 15, 4, [0, 0, 0], 2, .3, 0);
        const cols = ['#2e4428', '#3a5430', '#4a6638'];
        for (let i = 0; i < 8; i++) { const a = hash(i, v * 5) * TAU, r = 3 + hash(i, v + 3) * 8; b.ell(Math.cos(a) * r, 2 + Math.sin(a) * r * .55, 5.5, 4.5, cols[i % 3]); }
        for (const c of cols) b.tex(c, (x, y) => hash(x * 5 + v, y * 3) < .18 ? [30, 40, 26] : null);
        for (let i = 0; i < 7; i++) { const a = hash(i + 20, v) * TAU, r = hash(i + 40, v) * 9; b.dot(Math.cos(a) * r, 2 + Math.sin(a) * r * .5, '#3a3a78', 1); }
      });
      function puParticles(dt) {
        const P = PU, F = P.fx, t = P.t, wind = Math.sin(t * .35) * .6 + Math.sin(t * 1.1) * .25;
        P.wind = wind;
        const emit = (key, every, fn) => { P.em[key] = (P.em[key] || 0) - dt; if (P.em[key] <= 0) { P.em[key] = every(); fn(); } };
        if (F.length < 380) {
          emit('smoke', () => rnd(.1, .18), () => F.push({ k: 'smoke', x: 320 + rnd(-4, 4), y: 248, vx: rnd(-4, 4), vy: rnd(-22, -14), life: rnd(2.2, 3.2), max: 3.2, s: rnd(2, 3) }));
          emit('steam', () => rnd(.35, .6), () => F.push({ k: 'steam', x: 342, y: 271, vx: rnd(-6, -2), vy: -12, life: 1.1, max: 1.1, s: 1.5 }));
          emit('glint', () => rnd(.18, .3), () => { if (nireCanLearn()) F.push({ k: 'glint', x: NIRE_X + rnd(-60, 60), y: NIRE_Y + rnd(-70, -5), vx: rnd(-4, 4), vy: rnd(6, 12), life: rnd(1, 1.6), max: 1.6 }); });
          emit('leaf', () => rnd(.5, 1.4), () => { const own = Object.keys(SAVE.nire).length; if (Math.random() < .4 + own * .03) F.push({ k: 'leaf', x: 118 + rnd(-60, 60), y: rnd(64, 100), vx: rnd(-6, 6), vy: rnd(10, 18), life: rnd(5, 7), max: 7, ph: rnd(0, TAU), col: ['#8a3222', '#b8482a', '#d8743a', '#e89a48'][(Math.random() * 4) | 0], gy: rnd(170, 230) }); });
          if (SAVE.puesto.fragua >= 1) {
            emit('spark', () => rnd(1.2, 2.8), () => { for (let i = 0; i < 9; i++) F.push({ k: 'spark', x: 132 + rnd(-8, 8), y: 280, vx: rnd(-40, 40), vy: rnd(-90, -40), life: rnd(.4, .8), max: .8 }); sfx(2400 + Math.random() * 800, .03, 'square', .006); });
            emit('chim', () => rnd(.2, .3), () => F.push({ k: 'smoke', x: 131 + rnd(-2, 2), y: 236, vx: rnd(-2, 2), vy: rnd(-16, -10), life: rnd(1.8, 2.6), max: 2.6, s: rnd(1.5, 2.5), dark: true }));
          }
          if (SAVE.puesto.rancho >= 2) emit('rch', () => rnd(.25, .4), () => F.push({ k: 'smoke', x: 281, y: 50, vx: rnd(-1, 2), vy: rnd(-12, -8), life: rnd(1.6, 2.2), max: 2.2, s: 1.5 }));
          emit('breath', () => rnd(2, 3), () => {
            if (!P.moving) F.push({ k: 'breath', x: P.x + P.face * 7, y: P.y - 8, vx: P.face * 8, vy: -3, life: .9, max: .9, s: 1.2 });
            for (const h of P.horses) if (Math.random() < .35) F.push({ k: 'breath', x: h.x + h.face * 29, y: h.y - 15, vx: h.face * 9, vy: -2, life: 1, max: 1, s: 1.6 });
          });
          emit('crack', () => rnd(.6, 2.2), () => { if (!P.ui) sfx(1800 + Math.random() * 1400, .02, 'square', .004); });
        }
        for (const f of F) {
          f.life -= dt;
          if (f.k === 'leaf') { if (f.y < f.gy) { f.x += (f.vx + wind * 22 + Math.sin(P.t * 2.4 + f.ph) * 10) * dt; f.y += f.vy * dt; } }
          else if (f.k === 'spark') { f.vy += 200 * dt; f.x += f.vx * dt; f.y += f.vy * dt; }
          else if (f.k === 'heart') { f.y += f.vy * dt; f.x += Math.sin(P.t * 5 + f.ph) * 10 * dt; }
          else { f.x += (f.vx + wind * 10) * dt; f.y += f.vy * dt; }
        }
        P.fx = F.filter(f => f.life > 0);
        // estrella fugaz de vez en cuando
        if (!P.star && Math.random() < dt * .05) P.star = { x: rnd(P.cam ? P.cam.x0 : 0, P.cam ? P.cam.x1 : PUW), y: rnd(4, 24), vx: rnd(-140, -90), vy: rnd(28, 40), life: .7 };
        if (P.star) { const s = P.star; s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; if (s.life <= 0) P.star = null; }
      }
      function drawPuFx(back) {
        for (const f of PU.fx) {
          const a = clamp(f.life / f.max, 0, 1);
          if (f.k === 'smoke' && back) { const r = f.s + (1 - a) * 7; cx.globalAlpha = a * (f.dark ? .28 : .22); cx.fillStyle = f.dark ? '#6a6468' : '#b8b8c4'; cx.fillRect(f.x - r, f.y - r, r * 2, r * 2); }
          else if (back) continue;
          else if (f.k === 'steam' || f.k === 'breath') { const r = f.s + (1 - a) * 3; cx.globalAlpha = a * .45; cx.fillStyle = '#eef2f8'; cx.fillRect(f.x - r, f.y - r, r * 2, r * 2); }
          else if (f.k === 'leaf') { cx.globalAlpha = Math.min(1, f.life); cx.fillStyle = f.col; const w = Math.abs(Math.sin(PU.t * 4 + f.ph)) * 2 + .8; cx.fillRect(f.x - w / 2, f.y - 1, w, 2); }
          else if (f.k === 'spark') { cx.globalAlpha = a; cx.fillStyle = a > .5 ? '#fff0a0' : '#ff8a2a'; cx.fillRect(f.x, f.y, 1.6, 1.6); }
          else if (f.k === 'glint') { const tw = Math.sin(PU.t * 14 + f.x) > 0; cx.globalAlpha = a; cx.fillStyle = '#ffe08a'; const x = Math.round(f.x), y = Math.round(f.y); cx.fillRect(x, y, 1.3, 1.3); if (tw) { cx.fillRect(x - 1.3, y, 1.3, 1.3); cx.fillRect(x + 1.3, y, 1.3, 1.3); cx.fillRect(x, y - 1.3, 1.3, 1.3); cx.fillRect(x, y + 1.3, 1.3, 1.3); } }
          else if (f.k === 'heart') { cx.globalAlpha = a; cx.fillStyle = '#e05a6a'; const x = f.x, y = f.y; cx.fillRect(x - 3, y - 2, 2, 2); cx.fillRect(x + 1, y - 2, 2, 2); cx.fillRect(x - 3, y, 6, 2); cx.fillRect(x - 2, y + 2, 4, 1); cx.fillRect(x - 1, y + 3, 2, 1); }
        }
        cx.globalAlpha = 1;
      }
      /* gaucho sentado en el tronco: la mitad de arriba del sprite (hasta el poncho) apoyada en el tronco,
         piernas dobladas hacia el fuego y el mate que sube a la boca cada tanto */
      const SIT_CUT = 120 / 176;  // fila donde termina el poncho en el sprite del gaucho
      function drawSentado(P, t) {
        const st = P.sit, PS = PSPR[SAVE.lastChar && CHARS[SAVE.lastChar] ? SAVE.lastChar : 'baqueano'], fr = PS.frames[0], sz = PS.size, f = st.face;
        const seatY = st.y - 3.5, drop = (1 - st.k) * 5, cy = seatY - (SIT_CUT - .5) * sz - 1 + drop + Math.sin(t * 2) * .35;
        cx.fillStyle = 'rgba(0,0,0,.28)'; cx.beginPath(); cx.ellipse(st.x + f * 4, st.y + 9, 11, 3.5, 0, 0, TAU); cx.fill();
        // piernas: muslo hacia adelante y canilla hasta el suelo, con la bota
        const hx = st.x + f * 1, hy = seatY + drop;
        cx.fillStyle = '#3a3036'; cx.fillRect(Math.min(hx, hx + f * 10), hy - 2, 10, 4); cx.fillRect(hx + f * 9 - 2, hy, 4, 7);
        cx.fillStyle = '#1a1410'; cx.fillRect(hx + f * 9 - 2 + (f > 0 ? 0 : -2), hy + 6, 6, 3); cx.fillStyle = '#5a4636'; cx.fillRect(hx + f * 9 - 2 + (f > 0 ? 0 : -2), hy + 6, 6, 1);
        cx.save(); cx.translate(st.x, cy); cx.scale(f, 1);
        cx.drawImage(fr, 0, 0, fr.width, fr.height * SIT_CUT, -sz / 2, -sz / 2, sz, sz * SIT_CUT); cx.restore();
        // mate: en la mano, y a la boca durante el sorbo
        const sip = st.sip < 0, mx = st.x + f * (sip ? 6 : 10), my = cy + (sip ? -10 : 2);
        dimg(sprMate(), mx, my, .9);
        if (sip && Math.random() < .08) PU.fx.push({ k: 'steam', x: mx, y: my - 4, vx: f * 3, vy: -10, life: .8, max: .8, s: 1 });
      }
      function drawPuesto(dt) {
        puUpdate(dt); puParticles(dt);
        const P = PU, C = puCam(), z = C.z, t = P.t; P.cam = C;
        const sx = x => (x - C.camX) * z + W / 2, sy = y => y * z + C.oy;
        cx.fillStyle = '#070a14'; cx.fillRect(0, 0, W, H);
        cx.save(); cx.translate(W / 2, C.oy); cx.scale(z, z); cx.translate(-C.camX, 0);
        const X0 = C.x0 - 4, X1 = C.x1 + 4;
        // cielo de noche clara, estrellas, nubes y luna
        const sky = cx.createLinearGradient(0, -10, 0, PU_TOP); sky.addColorStop(0, '#0a1024'); sky.addColorStop(.7, '#1f2e50'); sky.addColorStop(1, '#34466c');
        cx.fillStyle = sky; cx.fillRect(X0, -10, X1 - X0, PU_TOP + 12);
        for (let i = 0; i < 150; i++) {
          const x = MTN_X0 + hash(i, 1) * (MTN_X1 - MTN_X0); if (x < X0 || x > X1) continue; const y = hash(i, 2) * PU_TOP * .7 - 4, tw = Math.sin(t * (1.5 + hash(i, 4) * 2) + i) * .5 + .5;
          cx.globalAlpha = .25 + .7 * tw * hash(i, 3); cx.fillStyle = hash(i, 6) < .15 ? '#ffe8c0' : '#e8ecf8'; const s = hash(i, 5) < .1 ? 1.8 : 1.1; cx.fillRect(x, y, s, s);
        }
        cx.globalAlpha = 1;
        if (P.star) { const s = P.star; cx.strokeStyle = `rgba(240,244,255,${clamp(s.life / .3, 0, 1)})`; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.x - s.vx * .12, s.y - s.vy * .12); cx.stroke(); }
        const mg = cx.createRadialGradient(520, 20, 4, 520, 20, 60); mg.addColorStop(0, 'rgba(236,230,210,.35)'); mg.addColorStop(1, 'rgba(236,230,210,0)');
        cx.fillStyle = mg; cx.fillRect(460, -10, 120, 90); cx.fillStyle = '#f2ecd8'; cx.beginPath(); cx.arc(520, 20, 10, 0, TAU); cx.fill();
        cx.fillStyle = '#d9d2b3'; cx.fillRect(515, 16, 3, 3); cx.fillRect(522, 23, 2, 2); cx.fillRect(518, 25, 2, 1);
        for (let i = 0; i < 5; i++) {
          const span = (MTN_X1 - MTN_X0), x = MTN_X0 + ((hash(i, 50) * span + t * (3 + i)) % span), y = 6 + hash(i, 51) * 26, L = 40 + hash(i, 52) * 60;
          if (x + L < X0 || x - L > X1) continue; cx.globalAlpha = .22; cx.fillStyle = '#8a9ab8';
          for (let k = 0; k < 5; k++) { const w = L * (1 - Math.abs(k - 2) * .22); cx.fillRect(Math.round(x - w / 2), Math.round(y + k * 2 - 4), Math.round(w), 2); }
          cx.globalAlpha = .3; cx.fillStyle = '#c8d4ec'; cx.fillRect(Math.round(x - L * .4), Math.round(y - 4), Math.round(L * .5), 1);
        }
        cx.globalAlpha = 1;
        // cordillera
        const M = puMountains(); cx.imageSmoothingEnabled = false; cx.drawImage(M, MTN_X0, 0, M.width * PXS, M.height * PXS); cx.imageSmoothingEnabled = true;
        // río y luces lejanas en el valle
        cx.strokeStyle = 'rgba(170,200,230,.35)'; cx.lineWidth = 1.2; cx.beginPath(); cx.moveTo(MTN_X0, 75); for (let x = MTN_X0; x < MTN_X1; x += 40) cx.lineTo(x, 74 + Math.sin(x * .013) * 2.5); cx.stroke();
        for (const [x, y, ph] of [[70, 74, 0], [410, 75, 2], [760, 74, 4], [-230, 75, 1]]) { if (Math.sin(t * .7 + ph) > -.6) { cx.fillStyle = '#ffcf6a'; cx.fillRect(x, y, 1.5, 1.5); cx.fillStyle = 'rgba(255,200,100,.25)'; cx.fillRect(x - 1.5, y - 1.5, 4.5, 4.5); } }
        // suelo
        cx.save(); cx.beginPath(); cx.rect(X0, PU_TOP, X1 - X0, PUH - PU_TOP + 20); cx.clip();
        cx.fillStyle = MAPS.estepa.bg; cx.fillRect(X0, PU_TOP, X1 - X0, PUH);
        drawGround(C.camX, PUH / 2); // en coordenadas de mundo: el suelo acompaña a la cámara como todo lo demás
        { const CL = puClearing(); cx.imageSmoothingEnabled = false; cx.drawImage(CL.c, CL.x, CL.y, CL.c.width * PXS, CL.c.height * PXS); cx.imageSmoothingEnabled = true; }
        cx.restore();
        cx.fillStyle = 'rgba(8,12,18,.55)'; cx.fillRect(X0, PU_TOP - 1, X1 - X0, 3);
        cx.imageSmoothingEnabled = false;
        drawPuFx(true);
        // todo lo que tiene profundidad se ordena por y
        const c = CORRAL, lvC = SAVE.puesto.corral, lvF = SAVE.puesto.fragua, D = puDecor(), L = [], add = (y, fn) => L.push([y, fn]), vis = x => x > X0 - 70 && x < X1 + 70;
        for (const tr of D.trees) if (vis(tr.x)) add(tr.y + 30, () => dimg(sprNireChico(tr.v), tr.x, tr.y));
        for (const s of D.shrubs) if (vis(s.x)) add(s.y + 10, () => dimg(puShrub(s.v), s.x, s.y));
        for (const cp of D.cips) if (vis(cp.x)) add(cp.y, () => dimg(sprCipres(cp.v), cp.x, cp.y - 40));
        for (const [x, y] of PU_POSTS) add(y, () => { dimg(sprPoste(), x, y); drawFarol(x + 9, y - 28, t); });
        for (const tf of D.tufts) if (vis(tf.x)) add(tf.y + 8, () => { const w = P.wind + Math.sin(t * 2.2 + tf.ph + tf.x * .02) * .35, lean = clamp(Math.round(w * 1.6), -2, 2); dimg(puTuft(tf.v, lean), tf.x, tf.y); });
        const own = Object.keys(SAVE.nire).length;
        add(PU_INT.nire.y, () => drawNireScene(t, own));
        add(170, () => {
          const lv = SAVE.puesto.rancho; dimg(lv >= 2 ? sprRancho(lv) : sprCarpa(), 320, lv >= 2 ? 112 : 118);
          if (lv >= 2) { drawTrophyBoard(); if (lv >= 3) drawFarol(372, 112, t); }
          else drawTrophyPost();
        });
        add(200, () => drawCuero(t));
        add(170, () => { dimg(sprCarreta(), 548, 128); drawFarol(506, 112, t); });
        add(330, () => {
          dimg(sprFragua(lvF), 132, 290);
          if (lvF >= 1) { dimg(sprYunque(), 180, 316); const kn = knifeEq(); if (kn) dimg(sprKnifeWall(kn), 90, 280); }
        });
        for (const [x, y, a] of [[272, 262, .2], [368, 262, -.2], [320, 300, 0]]) add(y + 6, () => dimg(sprTronco(a), x, y));
        add(266, () => drawFogon(t));
        add(282, () => dimg(sprPava(), 349, 276)); add(284, () => dimg(sprMate(), 359, 280));
        add(302, () => drawPerro(t));
        if (SAVE.puesto.fogon >= 1) { add(250, () => dimg(sprAsador(), 286, 234)); add(294, () => dimg(sprParrilla(), 262, 290)); }
        add(378, () => dimg(sprTranquera(P.gateT > 0 ? Math.sin((.6 - P.gateT) / .6 * Math.PI) : 0), 320, 378));
        if (lvC >= 1) {
          add(c.y, () => dimg(sprFenceH(c.w), c.x + c.w / 2, c.y));
          add(c.y + c.h, () => dimg(sprFenceH(c.w), c.x + c.w / 2, c.y + c.h));
          add(c.y + c.h, () => { dimg(sprFenceV(c.h), c.x, c.y + c.h / 2); dimg(sprFenceV(c.h), c.x + c.w, c.y + c.h / 2); });
          if (lvC >= 2) add(c.y + c.h - 10, () => dimg(sprBebedero(), c.x + c.w - 36, c.y + c.h - 20));
          for (const h of P.horses) add(h.y + 22, () => {
            const AS = animSpr('caballo', h.idx === SAVE.horse, h.pelaje), mv = Math.hypot(h.vx, h.vy) > 3, fr = AS.frames[mv ? 1 + (((t * 6 + h.wob) | 0) % 4) : 0];
            cx.fillStyle = 'rgba(0,0,0,.28)'; cx.beginPath(); cx.ellipse(h.x, h.y + 22, 20, 5, 0, 0, TAU); cx.fill();
            const nod = mv ? 0 : Math.max(0, Math.sin(t * .7 + h.wob * 3)) * 1.2;
            cx.save(); cx.translate(h.x, Math.round(h.y + nod)); cx.scale(h.face, 1); cx.drawImage(fr.img, -AS.size / 2, -AS.size / 2, AS.size, AS.size); cx.restore();
          });
        } else add(c.y + c.h, () => dimg(sprCorralVacio(), c.x + c.w / 2, c.y + c.h - 34));
        if (P.sit) add(P.sit.y + 7, () => drawSentado(P, t));
        else add(P.y + 14, () => {
          const PS = PSPR[SAVE.lastChar && CHARS[SAVE.lastChar] ? SAVE.lastChar : 'baqueano'], fr = PS.frames[P.moving ? 1 + (((t * 8.9) | 0) % 4) : 0], sz = PS.size;
          cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(P.x, P.y + 13, 11, 4, 0, 0, TAU); cx.fill();
          const br = P.moving ? Math.sin(t * 14) * 1.5 : Math.sin(t * 2) * .5;
          cx.save(); cx.translate(P.x, P.y + br); cx.scale(P.face, 1); cx.drawImage(fr, -sz / 2, -sz / 2, sz, sz); cx.restore();
        });
        L.sort((a, b) => a[0] - b[0]); for (const [, fn] of L) fn();
        drawPuFx(false);
        cx.imageSmoothingEnabled = true;
        cx.restore();
        // luz: oscuridad con el fogón, la fragua, las ventanas y los faroles como fuentes
        // máscara a un cuarto de resolución (la luz es suave, no se nota) y luces con sprites pre-horneados
        const mw = Math.max(2, Math.round(W / 4)), mh = Math.max(2, Math.round(H / 4));
        if (!puMask || puMask.width !== mw || puMask.height !== mh) { puMask = document.createElement('canvas'); puMask.width = mw; puMask.height = mh; }
        const m2 = puMask.getContext('2d'); m2.setTransform(mw / W, 0, 0, mh / H, 0, 0); m2.globalCompositeOperation = 'source-over'; m2.globalAlpha = 1; m2.clearRect(0, 0, W, H);
        m2.fillStyle = 'rgba(5,8,18,.6)'; m2.fillRect(0, 0, W, H);
        const sk = m2.createLinearGradient(0, 0, 0, sy(PU_TOP)); sk.addColorStop(0, 'rgba(0,0,0,.35)'); sk.addColorStop(1, 'rgba(0,0,0,0)');
        m2.globalCompositeOperation = 'destination-out'; m2.fillStyle = sk; m2.fillRect(0, 0, W, sy(PU_TOP));
        const LS = puLightSpr();
        const light = (x, y, r, a) => { const X = sx(x), Y = sy(y), R = r * z; if (X < -R || X > W + R) return; m2.globalAlpha = a; m2.drawImage(LS, X - R, Y - R, R * 2, R * 2); };
        const fl = 1 + Math.sin(t * 11) * .03 + Math.sin(t * 4.3) * .04 + Math.sin(t * 23) * .015;
        light(320, 262, 195 * fl, .95); light(P.x, P.y, 70, .35);
        if (lvF >= 1) light(132, 284, 92 * (1 + Math.sin(t * 6) * .06), .8);
        if (SAVE.puesto.rancho >= 2) light(358, 132, 62, .6);
        if (SAVE.puesto.rancho >= 3) light(372, 120, 50, .55);
        light(506, 120, 50, .6); light(NIRE_X + 44, NIRE_GY - 4, 62, .65);
        for (const [x, y] of PU_POSTS) light(x + 9, y - 26, 72 * (1 + Math.sin(t * 3.1 + x) * .04), .7);
        const nl = nireCanLearn(); if (nl) light(NIRE_X, NIRE_Y - 20, 95, .35 + Math.sin(t * 2) * .08);
        m2.globalAlpha = 1; m2.setTransform(1, 0, 0, 1, 0, 0);
        cx.save(); cx.setTransform(DPR, 0, 0, DPR, 0, 0); cx.drawImage(puMask, 0, 0, W, H); cx.restore();
        cx.save(); cx.globalCompositeOperation = 'lighter';
        const warm = (x, y, r, a, col) => { const X = sx(x), Y = sy(y), R = r * z; if (X < -R || X > W + R) return; cx.globalAlpha = a; cx.drawImage(puWarmSpr(col || '255,140,60'), X - R, Y - R, R * 2, R * 2); };
        warm(320, 262, 125 * fl, .17); if (lvF >= 1) warm(132, 284, 62 * (1 + Math.sin(t * 6) * .08), .15); warm(506, 120, 28, .12, '255,200,110'); for (const [x, y] of PU_POSTS) warm(x + 9, y - 26, 34, .13, '255,190,100'); warm(NIRE_X + 44, NIRE_GY - 6, 30, .14, '255,190,100'); if (nl) warm(NIRE_X, NIRE_Y - 30, 70, .09 + Math.sin(t * 2) * .03, '255,210,120');
        cx.globalAlpha = 1;
        cx.restore();
        // cartel del lugar cercano, sobre el personaje
        if (P.near && !P.ui) {
          const lb = puLabel(), X = sx(P.x), Y = sy(P.y - 34) + Math.sin(t * 4) * 2, fs = Math.round(clamp(11 * z * .55, 11, 18));
          cx.font = `600 ${fs}px ${getComputedStyle(document.body).fontFamily}`; cx.textAlign = 'center';
          const tw = cx.measureText(lb).width + 16, bh = fs + 10;
          cx.fillStyle = 'rgba(12,17,32,.85)'; cx.fillRect(X - tw / 2, Y - bh + 4, tw, bh); cx.strokeStyle = '#c9a45c'; cx.lineWidth = 1.5; cx.strokeRect(X - tw / 2 + .5, Y - bh + 4.5, tw - 1, bh - 1);
          cx.fillStyle = '#ece6d2'; cx.fillText(lb, X, Y); cx.textAlign = 'left';
        }
        if (joy && !P.ui) {
          cx.strokeStyle = 'rgba(236,230,210,.35)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(joy.ox, joy.oy, 50, 0, TAU); cx.stroke();
          const dx = joy.x - joy.ox, dy = joy.y - joy.oy, d = Math.hypot(dx, dy), k = d > 50 ? 50 / d : 1;
          cx.fillStyle = 'rgba(236,230,210,.4)'; cx.beginPath(); cx.arc(joy.ox + dx * k, joy.oy + dy * k, 20, 0, TAU); cx.fill();
        }
      }

