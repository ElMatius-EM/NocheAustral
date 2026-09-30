      /* ---------------- cartas de truco en pixel art (baraja española) ----------------
         56×84 píxeles nativos. Capa A: carta, marco con "pintas", números y palos (planos).
         Capa B: figuras y anchos dibujados con primitivas (reciben sombreado y contorno automático). */
      const PK = '#3a2410';
      const PIP = {
        oro: {
          rows: ["....kkkkk....", "..kkyyyyykk..", ".kywoyyyoyyk.", ".kwoyyyyyoyk.", "kyyyykkkyyyyk", "kyoykrrrkyoyk", "kyyykrwrkyyyk", "kyoykrrrkyoyk", "kyyyykkkyyyyk", ".kyoyyyyyoyk.", ".kyyoyyyoyyk.", "..kkyyyyykk..", "....kkkkk...."],
          pal: { k: PK, y: '#f0c838', o: '#c8781c', r: '#c8281c', w: '#fff4b0' }
        },
        copa: {
          rows: [".kkkkkkkkkkk.", "kyyyyyyyyyyyk", "krrrrrrrrrrrk", "kywyyyyyyyyyk", "kwyyyoooyyyyk", ".kyyyyyyyyyk.", ".kyyoyyyoyyk.", "..kyyyyyyyk..", "...kkyyykk...", ".....kgk.....", ".....kgk.....", "....kgggk....", "...kgwgggk...", "..kgggggggk..", "..kkkkkkkkk.."],
          pal: { k: PK, r: '#c8281c', y: '#f0c838', o: '#c8781c', w: '#fff4b0', g: '#2f8a3a' }
        },
        espada: {
          rows: ["...k...", "..kbk..", "..kwk..", ".kbwbk.", ".kbwbk.", ".kbwbk.", ".kbwbk.", ".kbwbk.", ".kbwbk.", ".kbwbk.", ".kbwbk.", ".kbwbk.", ".kbwbk.",
            "kkkkkkk", "kyyyyyk", "kkkrkkk", "..krk..", "..krk..", "..krk..", ".kkykk.", ".kyyyk.", "..kkk.."],
          pal: { k: '#1c2440', b: '#3a6ac0', w: '#b8d4f4', y: '#f0c838', r: '#b02a20' }
        },
        basto: {
          rows: ["..kkk..", ".kLmmk.", "kLmmmdk", "kLmnmdk", "kLmmmdk", ".kLmmdk", ".kLmdk.", ".kLndk.", ".kLmdk.", ".kLmdk.", ".kLmdk.", ".kLndk.",
            ".kLmdk.", ".kLmdk.", ".kLmdk.", ".kLmmdk", "..kLmdk", "..kkkk."],
          pal: { k: '#1a2a14', m: '#3a9a3a', L: '#7ad06a', d: '#1f5a24', n: '#123012' },
          red: { k: '#3a1410', m: '#c83a2a', L: '#f08a6a', d: '#7a1a14', n: '#3a0c08' }
        }
      };
      const DIG = { 0: ["111", "101", "101", "101", "111"], 1: ["010", "110", "010", "010", "111"], 2: ["111", "001", "111", "100", "111"], 4: ["101", "101", "111", "001", "001"], 7: ["111", "001", "010", "010", "010"] };
      const PINTAS = { oro: 0, copa: 1, espada: 2, basto: 3 };
      // posiciones de los palos (centro de cada palo, relativas al centro de la carta)
      function pipLayout(suit, n) {
        const tall = suit === 'espada' || suit === 'basto';
        if (n === 4) return tall ? [[-11, -18], [11, -18], [-11, 18], [11, 18]] : [[-10, -20], [10, -20], [-10, 20], [10, 20]];
        if (n === 7) return tall ? [[-13, -17], [13, -17], [-13, 17], [13, 17], [0, -23], [0, 0], [0, 23]] : [[-10, -25], [10, -25], [0, -12], [-10, 1], [10, 1], [-10, 25], [10, 25]];
        return [[0, 0]];
      }
      function cardFigure(b, id) {
        const skin = '#e8b48a', dark = '#1c1a1a';
        if (id === 'anchoEspadas') {
          b.line([[0, -33], [0, 12]], 5, '#3a6ac0'); b.line([[0, -30], [0, 11]], 1.4, '#b8d4f4', 1);
          b.poly([[-2.5, -33], [0, -38], [2.5, -33]], '#3a6ac0');
          b.line([[-12, 14], [12, 14]], 3, '#f0c838');
          for (const s of [-1, 1]) { b.ell(s * 13, 12, 2.4, 2.4, '#f0c838'); b.ell(s * 13, 12, .9, .9, '#c8781c', 1); b.line([[s * 5, 16], [s * 9, 20], [s * 12, 18]], 1.6, '#f0c838'); }
          b.line([[0, 16], [0, 26]], 3.4, '#b02a20'); for (let y = 17; y < 26; y += 2) b.line([[-1.6, y], [1.6, y + 1]], .8, '#7a1a14', 1);
          b.ell(0, 29, 3.4, 3, '#f0c838'); b.dot(-1, 28, '#fff4b0', 1);
          for (const s of [-1, 1]) { b.line(qb([s * 3, 17], [s * 10, 19], [s * 9, 28], 6), 1.8, '#c8281c'); b.poly([[s * 8, 27], [s * 10.5, 31], [s * 9, 28], [s * 7, 31]], '#c8281c'); }
        } else if (id === 'anchoBastos') {
          b.line(qb([2, 30], [-2, 0], [3, -26], 10), 6, '#3a9a3a', 0, 1, 11);
          for (const [x, y, sd] of [[-2, 20, -1], [1, 8, 1], [-1, -4, -1], [3, -14, 1], [1, -22, -1]]) b.ell(x + sd * 4.5, y, 2.6, 2, '#3a9a3a');
          b.tex('#3a9a3a', (x, y) => (y % 4 === 0 && hash(x, y) < .55) ? dk('#3a9a3a', .22) : hash(x * 5, y) < .05 ? lt('#3a9a3a', .2) : null);
          for (const [x, y] of [[-1, 16], [0, 2], [1, -10], [3, -20]]) b.ell(x, y, 1.6, 1.2, '#1f5a24', 1);
          b.ell(3, -31, 6, 4, '#3a9a3a');
          for (const s of [-1, 1]) { b.ell(s * 8, -26, 3.4, 1.8, '#5ab84a'); b.line([[s * 3, -24], [s * 8, -26]], .8, '#1f5a24', 1); }
          b.ell(-6, 8, 3, 1.6, '#5ab84a'); b.line([[-2, 8], [-6, 8]], .8, '#1f5a24', 1);
        } else if (id === 'reyEspadas') {
          b.line([[13, -34], [13, 4]], 3.2, '#3a6ac0'); b.line([[13, -32], [13, 3]], 1, '#b8d4f4', 1); b.poly([[11.4, -34], [13, -37], [14.6, -34]], '#3a6ac0');
          b.line([[9, 5], [17, 5]], 2, '#f0c838'); b.line([[13, 6], [13, 12]], 2, '#b02a20'); b.ell(13, 13.5, 1.6, 1.4, '#f0c838');
          b.poly([[-9, -11], [9, -11], [15, 31], [-15, 31]], '#b82a24');
          b.poly([[-5, -9], [5, -9], [7, 31], [-7, 31]], '#2f5fa8');
          b.line([[-5, -9], [-7, 31]], 1, '#f0c838', 1); b.line([[5, -9], [7, 31]], 1, '#f0c838', 1);
          b.line([[-6, 8], [6, 8]], 1.4, '#f0c838');
          b.tex('#2f5fa8', (x, y) => ((x + y) % 4 === 0) ? lt('#2f5fa8', .18) : null);
          b.ell(-5, 33, 3, 1.6, dark); b.ell(5, 33, 3, 1.6, dark);
          b.ell(0, -12, 10, 3.2, '#f4efe2'); for (const x of [-6, -2, 2, 6]) b.dot(x, -12, dark, 1);
          b.line([[7, -8], [12, 2]], 3, '#b82a24'); b.ell(13, 3, 2, 2, skin);
          b.line([[-7, -8], [-3, 4]], 3, '#b82a24'); b.ell(-2, 5, 2, 2, skin);
          b.ell(0, -20, 5, 5.5, skin);
          b.poly([[-5, -18], [5, -18], [3, -9], [0, -7], [-3, -9]], '#d8d0c0');
          b.dot(-2, -21, dark, 1); b.dot(2, -21, dark, 1); b.line([[-2, -15], [2, -15]], .8, '#a09880', 1);
          b.poly([[-6, -24], [6, -24], [6, -30], [3, -27], [0, -32], [-3, -27], [-6, -30]], '#f0c838');
          b.dot(0, -26, '#c8281c', 1); b.dot(-4, -26, '#3a6ac0', 1); b.dot(4, -26, '#3a6ac0', 1);
        } else if (id === 'sotaOros') {
          for (const s of [-1, 1]) { b.line([[s * 3, 11], [s * 4, 30]], 3.4, '#e0b030'); b.ell(s * 4.5, 32, 2.8, 1.5, dark); }
          b.tex('#e0b030', (x, y) => (y % 3 === 0) ? [200, 40, 28] : null);
          b.poly([[-8, -11], [8, -11], [11, 13], [-11, 13]], '#2f5fa8');
          b.line([[-9, 6], [9, 6]], 1.4, '#f0c838'); b.rect(-1, 4, 2, 3, '#c8781c', 1);
          b.tex('#2f5fa8', (x, y) => ((x * 2 + y) % 5 === 0) ? lt('#2f5fa8', .18) : null);
          b.line([[-7, -9], [-9, 3]], 3, '#c8281c'); b.ell(-9, 4, 1.8, 1.8, skin);
          b.line([[7, -9], [10, -15]], 3, '#c8281c'); b.ell(10.5, -16, 1.8, 1.8, skin);
          b.ell(0, -12, 5, 2, '#f4efe2');
          b.ell(-.5, -18, 5.5, 5.5, '#e0b060');
          b.ell(0, -17, 4.4, 5, skin);
          b.dot(-2, -18, dark, 1); b.dot(2, -18, dark, 1); b.dot(0, -14, '#c86a5a', 1);
          b.ell(-1, -23, 6, 2.2, '#c8281c'); b.line([[-4, -24], [-9, -30], [-11, -29]], 1, '#f4efe2');
        } else if (id === 'caballoBastos') {
          b.line(qb([-15, 6], [-22, 12], [-19, 24], 6), 2.6, '#3a2418');
          for (const [x, s] of [[-10, 1], [-6, -1], [7, 1], [11, -1]]) { b.line([[x, 14], [x + s, 30]], 2.6, '#8a5a3a'); b.ell(x + s, 31, 1.8, 1.2, dark); }
          b.ell(0, 11, 15, 7.5, '#8a5a3a');
          b.poly([[8, 8], [13, -8], [18, -8], [15, 10]], '#8a5a3a');
          b.ell(19, -8, 5.5, 3.4, '#8a5a3a'); b.ell(23, -7, 2.4, 2.2, '#a07050');
          b.poly([[15, -11], [16, -15], [18, -11]], '#8a5a3a'); b.dot(19, -9, dark, 1); b.dot(23, -6, dark, 1);
          b.line([[9, 6], [14, -10]], 1.8, '#3a2418');
          b.tex('#8a5a3a', (x, y) => hash(x * 3, y * 7) < .08 ? dk('#8a5a3a', .15) : null);
          b.poly([[-6, 4], [4, 4], [5, 9], [-7, 9]], '#c8281c');
          b.line([[0, 5], [3, 17]], 3, '#2f5fa8'); b.ell(4, 18, 2, 1.3, dark);
          b.poly([[-4, -14], [4, -14], [5, 5], [-5, 5]], '#c8281c');
          b.line([[-4, 4], [4, 4]], 1.2, '#f0c838');
          b.ell(0, -19, 4, 4.5, skin); b.dot(2, -20, dark, 1);
          b.ell(0, -23, 7, 1.6, '#2f7a3a'); b.ell(0, -25, 3.6, 2.4, '#2f7a3a');
          b.line(qb([4, -4], [-2, -18], [-11, -33], 6), 2.4, '#3a9a3a', 0, 1, 4.6);
          b.ell(-11, -34, 3, 2.4, '#3a9a3a'); b.ell(-7, -26, 1.1, .9, '#1f5a24', 1); b.ell(-3, -18, 1.1, .9, '#1f5a24', 1);
          b.line([[5, -12], [4, -5]], 2.6, '#c8281c'); b.ell(4, -4, 1.8, 1.8, skin);
        }
      }
      function cardURL(id) {
        const key = 'card_' + id; if (ICONS[key]) return ICONS[key];
        const A = ARCANAS[id], suit = A.suit, Wc = 56, Hc = 84;
        const a = PixBuf(Wc, 1, 0, Hc);
        a.rect(-27, -41, 54, 82, '#f4efe2');
        for (const [x, y] of [[-27, -41], [26, -41], [-27, 40], [26, 40]]) { const i = (a.cy + y) * Wc + (a.cx + x); a.c[i] = null; }
        const line = '#34302a', gaps = PINTAS[suit];
        // marco: laterales enteros, arriba y abajo cortados según el palo (las "pintas")
        const L = -23, R = 22, T = -36, B = 35;
        for (let y = T; y <= B; y++) { a.pp(a.cx + L, a.cy + y, line, 1); a.pp(a.cx + R, a.cy + y, line, 1); }
        const seg = gaps + 1, span = R - L + 1, gw = 3, sw = Math.floor((span - gaps * gw) / seg);
        for (const yy of [T, B]) for (let k = 0; k < seg; k++) { const x0 = L + k * (sw + gw), x1 = k === seg - 1 ? R : x0 + sw - 1; for (let x = x0; x <= x1; x++) a.pp(a.cx + x, a.cy + yy, line, 1); }
        // números: arriba a la izquierda y abajo a la derecha dado vuelta
        const num = String(A.num), digW = num.length * 4 - 1;
        const drawNum = (x0, y0, flip) => {
          const ds = flip ? [...num].reverse() : [...num];
          ds.forEach((d, k) => a.spr(DIG[d].map(r => r.replace(/1/g, 'n').replace(/0/g, '.')), { n: '#1c1a1a' }, x0 + k * 4, y0, flip, flip));
        };
        for (let x = -26; x <= -26 + digW; x++) for (let y = -40; y <= -34; y++) a.pp(a.cx + x, a.cy + y, '#f4efe2', 0);
        for (let x = 25 - digW; x <= 25; x++) for (let y = 33; y <= 39; y++) a.pp(a.cx + x, a.cy + y, '#f4efe2', 0);
        drawNum(-26, -40, false); drawNum(26 - digW, 35, true);
        // palos
        const figs = A.num >= 10 || A.num === 1, P = PIP[suit];
        if (!figs) {
          pipLayout(suit, A.num).forEach(([x, y], i) => {
            const pal = suit === 'basto' && (i % 2) ? P.red : P.pal, w = P.rows[0].length, h = P.rows.length;
            a.spr(P.rows, pal, x - Math.floor(w / 2), y - Math.floor(h / 2), false, suit === 'basto' && y > 0);
          });
        }
        const base = pixFinish(a);
        if (figs) {
          const bb = PixBuf(Wc, 1, 0, Hc); cardFigure(bb, id);
          const fig = pixFinish(bb), g = base.img.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(fig.img, 0, 0);
          if (A.num === 10) { const o = PixBuf(Wc, 1, 0, Hc); o.spr(PIP.oro.rows, PIP.oro.pal, 10 - 5, -22 - 5, false, false, 1); g.drawImage(pixFinish(o).img, 0, 0); }
        }
        return ICONS[key] = base.img.toDataURL();
      }
      function playerURL(id) { const p = PSPR[id]; return p.url || (p.url = p.frames[0].toDataURL()); }
      makeSprites();

