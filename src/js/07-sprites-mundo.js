      /* ---------------- pixel art: mundo, pickups, proyectiles ---------------- */
      // crea un sprite a partir de una función de dibujo; unit = unidades de mundo por "unidad de dibujo"
      function pixSprite(worldSize, unit, draw, oy) {
        const G = Math.max(4, Math.round(worldSize / PXS)), b = PixBuf(G, unit / PXS, oy); draw(b); const r = pixFinish(b);
        return { img: r.img, flash: r.flash, size: G * PXS };
      }
      const dimg = (s, x, y, sc) => { const z = s.size * (sc || 1); cx.drawImage(s.img, x - z / 2, y - z / 2, z, z); };

      /* obstáculos: unidades = radio del obstáculo. Se cachean por tipo, tamaño (de a 4) y variante. */
      const OBS_DRAW = {
        roca(b, sd, ice) {
          const base = ice ? '#8fbcd6' : '#5d635e';
          b.ellD(.12, .56, 1.12, .44, ice ? [20, 40, 70] : [0, 0, 0], 2, .32, 0); b.ell(.12, .56, .96, .36, ice ? [20, 40, 70] : [0, 0, 0], 2, .32);
          const pts = []; for (let i = 0; i < 9; i++) { const a = i / 9 * TAU, rr = .84 + hash(sd, i) * .26; pts.push([Math.cos(a) * rr, Math.sin(a) * rr * .82 - .1]); }
          b.poly(pts, base);
          if (ice) b.tex(base, (x, y) => hash(x * 3 + sd, y * 7) < .08 ? lt(base, .25) : null);
          else b.tex(base, (x, y) => hash(x * 3 + sd, y * 7) < .13 ? dk(base, .2) : hash(x + sd, y * 3) < .06 ? lt(base, .22) : null);
          b.poly([[-.55, -.3], [-.12, -.62], [.38, -.5], [.04, -.18]], ice ? '#c4e2f2' : '#6f7670');
          if (ice) { b.line([[-.3, -.02], [.08, .22], [.42, .1]], .06, '#f4fbff', 1); b.line([[.08, .22], [.12, .42]], .05, '#f4fbff', 1); b.dot(-.3, -.42, '#ffffff', 1); }
          else {
            b.line([[-.12, -.08], [.08, .16], [.03, .34], [.24, .5]], .05, '#353a37', 1);
            b.ell(.3, .36, .36, .14, '#4f6a3a'); b.tex('#4f6a3a', (x, y) => hash(x, y + sd) < .35 ? [98, 130, 70] : null);
          }
        },
        hielo(b, sd) { OBS_DRAW.roca(b, sd, true); },
        arbusto(b, sd) {
          b.ellD(.12, .5, 1.08, .4, [0, 0, 0], 2, .3, 0); b.ell(.12, .5, .92, .32, [0, 0, 0], 2, .3);
          for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + sd; b.ell(Math.cos(a) * .5, Math.sin(a) * .4 - .1, .5, .48, '#2f4a2c'); }
          b.ell(0, -.1, .58, .5, '#2f4a2c');
          b.ell(-.15, -.32, .46, .4, '#3d5e36');
          b.tex('#2f4a2c', (x, y) => hash(x * 5 + sd, y * 3) < .22 ? [36, 58, 34] : hash(x, y * 5 + sd) < .06 ? [70, 102, 60] : null);
          b.tex('#3d5e36', (x, y) => hash(x * 3, y * 5 + sd) < .22 ? [86, 122, 70] : null);
          for (let i = 0; i < 7; i++) {
            const a = hash(sd, i + 9) * TAU, d = hash(sd, i + 20) * .72, x = Math.cos(a) * d, y = Math.sin(a) * d * .8 - .1;
            b.ell(x, y, .1, .1, '#6a4a9a', 1); b.dot(x - .04, y - .04, '#b89ae0', 1);
          }
        },
        lenga(b, sd) {
          b.ellD(.1, .55, 1.1, .4, [0, 0, 0], 2, .32, 0); b.ell(.1, .55, .9, .3, [0, 0, 0], 2, .3);
          b.rect(-.16, -.3, .32, .88, '#4a3424'); b.tex('#4a3424', (x, y) => hash(x, y * 3 + sd) < .25 ? [58, 40, 28] : null);
          const G = ['#2f4a2c', '#3d5e36', '#4f7238'], R = ['#8a3222', '#b8482a', '#d8743a'], oto = hash(sd, 99) < .4;
          for (let i = 0; i < 13; i++) { const a = hash(sd, i) * TAU, d = hash(sd, i + 30) * .78; b.ell(Math.cos(a) * d, -.86 + Math.sin(a) * d * .62, .5, .4, oto && i % 3 === 0 ? R[i % 3] : G[i % 3]); }
          b.ell(-.25, -1.2, .5, .32, oto ? R[2] : G[2]); b.ell(.35, -1.05, .36, .26, G[2]);
          b.tex(G[0], (x, y) => hash(x * 5 + sd, y * 3) < .2 ? [36, 58, 34] : null);
          b.tex(G[1], (x, y) => hash(x * 3, y * 5 + sd) < .14 ? [86, 122, 70] : null);
        },
        tronco(b, sd) {
          b.ellD(.05, .35, 1.25, .35, [0, 0, 0], 2, .3, 0);
          b.line([[-1.1, .1], [1.0, -.05]], .55, '#5a3a22');
          b.tex('#5a3a22', (x, y) => y % 3 === 0 ? [74, 48, 28] : hash(x, y * 3 + sd) < .1 ? [110, 76, 46] : null);
          b.ell(1.0, -.05, .22, .3, '#c89060'); b.ell(1.0, -.05, .11, .15, '#a07048', 1);
          for (let i = 0; i < 6; i++) b.ell(-.9 + i * .33, -.14 + hash(sd, i) * .06, .18, .08, '#4f7238', 1);
          b.line([[-.3, -.12], [-.5, -.5], [-.36, -.72]], .06, '#4a3424');
        },
        seraque(b, sd) {
          b.ellD(.1, .52, 1.0, .36, [20, 40, 70], 2, .32, 0); b.ell(.1, .52, .85, .28, [20, 40, 70], 2, .32);
          b.poly([[-.8, .4], [-.62, -1.05], [-.1, -1.52], [.36, -1.0], [.8, .4], [.4, .62], [0, .66], [-.4, .62]], '#b3d8ec');
          b.poly([[-.52, .26], [-.4, -.96], [-.13, -1.3], [-.15, .34]], '#e2f2fa');
          b.poly([[.1, -.92], [.34, -1.0], [.72, .36], [.3, .52]], '#86b4d0');
          b.line([[-.08, -.34], [.1, -.02], [0, .24]], .05, '#ffffff', 1);
          b.dot(-.3, -.82, '#ffffff', 1); b.dot(-.26, -.9, '#ffffff', 1);
        }
      };
      const OBS_SPR = new Map();
      function obsSprite(o) {
        const rb = Math.max(16, Math.round(o.r / 4) * 4), v = o.seed % 5, key = o.kind + rb + '_' + v;
        let s = OBS_SPR.get(key);
        if (!s) { s = pixSprite(rb * 3.6, rb, b => OBS_DRAW[o.kind](b, v * 37 + 11)); OBS_SPR.set(key, s); }
        return s;
      }

      /* decoración del suelo (por mapa, en unidades de mundo) */
      const DECOR_SPR = {};
      function decorSpr(bk) {
        const key = bk || (S ? S.bio || S.map : 'estepa'), M = MAPS[key]; if (DECOR_SPR[key]) return DECOR_SPR[key];
        const D = { tuft: [], stone: [], crack: [] };
        for (let v = 0; v < 3; v++) D.tuft.push(pixSprite(20, 1, b => {
          const blades = [[[0, 4], [-3 - v, -4]], [[2, 4], [3, -6 + v]], [[4, 4], [8 - v, -2]], [[1, 4], [0, -1 - v]]];
          for (const [a, c] of blades) { b.line([a, c], 1.3, M.tuft, 2); b.dot(c[0], c[1], lt(M.tuft, .25), 2); }
        }));
        for (const r of [3, 5, 7]) D.stone.push(pixSprite(r * 2 + 6, 1, b => { b.ell(0, 0, r, r * .65, M.stone); b.dot(-r * .4, -r * .3, lt(M.stone, .2)); }));
        for (let v = 0; v < 2; v++) D.crack.push(pixSprite(24, 1, b => {
          const pts = v ? [[-8, -2], [0, 1], [8, -3]] : [[-8, -3], [1, 0], [7, -4]]; b.line(pts, 1, M.tuft, 2); b.line([pts[1], [2, 7]], 1, M.tuft, 2);
        }));
        D.flower = pixSprite(16, 1, b => { for (const [x, y] of [[0, -1], [5, 2], [-3, 4]]) { b.rect(x - 1, y - 1, 2, 2, M.spot, 2); b.dot(x - 2, y, dk(M.spot, .3), 2); b.dot(x + 1, y, dk(M.spot, .3), 2); } });
        D.patch = pixSprite(24, 1, b => { b.ellD(0, 0, 9, 4, M.spot, 2, .55, 0); b.ell(0, 0, 7, 3, M.spot, 2, .55); b.ell(-2, -1, 3, 1, [255, 255, 255], 2, .6); });
        D.bone = pixSprite(18, 1, b => { b.line([[-5, -.5], [5, 1.5]], 1.6, M.bone); for (const [x, y] of [[-6, -1.5], [-6, .5], [6, .5], [6, 2.5]]) b.ell(x, y, 1.1, 1.1, M.bone); });
        return DECOR_SPR[key] = D;
      }

      /* gemas, pickups y proyectiles (unidades de mundo) */
      const ITEM = {};
      function gemSprite(col, s) {
        const k = 'gem' + col + s; if (ITEM[k]) return ITEM[k];
        return ITEM[k] = pixSprite(s * 2 + 6, 1, b => {
          b.poly([[0, -s], [s * .72, 0], [0, s], [-s * .72, 0]], col);
          b.poly([[0, -s], [0, s], [-s * .72, 0]], lt(col, .25));
          b.line([[0, -s * .6], [0, -s * .1]], .9, [255, 255, 255], 1);
        });
      }
      function mkItems() {
        if (ITEM.ready) return; ITEM.ready = true;
        ITEM.cofre = pixSprite(46, 1, b => {
          b.ellD(0, 0, 20, 20, [255, 220, 120], 2, .22, 0); b.ellD(0, 0, 14, 14, [255, 225, 140], 2, .3, 1);
          b.rect(-12, -8, 24, 16, '#6b4220'); b.ell(0, -9.5, 12, 4, '#8a5a2c'); b.rect(-12, -10, 24, 4, '#8a5a2c');
          b.tex('#6b4220', (x, y) => ((y % 3) === 0) ? dk('#6b4220', .25) : null);
          b.rect(-12, -4, 24, 2.6, '#e0b75a'); b.rect(-12, -10, 2.4, 18, '#c9a45c'); b.rect(9.6, -10, 2.4, 18, '#c9a45c');
          b.rect(-2.5, -6.5, 5, 6, '#e0b75a'); b.rect(-.6, -4.6, 1.2, 2.2, '#2a1a0c', 1);
        });
        ITEM.asado = pixSprite(28, 1, b => {
          b.line([[3, -1], [11, -2]], 3, '#e8dcc0'); b.ell(12, -3.2, 1.8, 1.8, '#e8dcc0'); b.ell(12.4, -.4, 1.8, 1.8, '#e8dcc0');
          b.ell(-2, 0, 8, 6, '#8a3d1c');
          b.tex('#8a3d1c', (x, y) => hash(x * 3, y * 5) < .12 ? dk('#8a3d1c', .2) : null);
          b.line([[-7, 1], [-1, -4]], .9, '#4f200d', 1); b.line([[-4, 4], [2, -1]], .9, '#4f200d', 1);
          b.ell(-4, -2.5, 3.5, 1.6, '#c8733a');
        });
        ITEM.oro = [1, .7, .28, .7].map(k => pixSprite(18, 1, b => {
          b.ell(0, 0, Math.max(1, 5.5 * k), 5.5, '#e0b75a');
          if (k > .5) { b.ell(0, 0, 3.4 * k, 3.4, '#c99a3e'); b.rect(-.5, -2, 1, 4, '#f6dc8e', 1); }
          b.dot(-2 * k, -3, '#fff4c8', 1);
        }));
        ITEM.bolsa = pixSprite(28, 1, b => {
          b.ell(0, 3, 9, 8, '#8a6a42'); b.rect(-4, -8, 8, 6, '#8a6a42'); b.ell(0, -8.5, 5, 2, '#8a6a42');
          b.tex('#8a6a42', (x, y) => hash(x * 7, y * 3) < .1 ? dk('#8a6a42', .2) : null);
          b.rect(-5, -4, 10, 2, '#e0b75a'); b.ell(0, 4, 3, 3, '#e0b75a'); b.rect(-.5, 2.5, 1, 3, '#8a6a42', 1);
        });
        ITEM.bomba = [0, 1].map(f => pixSprite(30, 1, b => {
          b.line(qb([4, -6], [9, -12], [11, -9], 5), 1.4, '#8a6a42');
          b.ell(0, 0, 8, 8, '#2a2a30'); b.rect(2, -9, 5, 3, '#5a5a66');
          b.ell(-3, -3, 2.2, 2.2, '#6a6a78', 1);
          b.ellD(11, -9, 3.6, 3.6, [255, 210, 60], 2, .4, f); b.ell(11, -9, 1.6, 1.6, f ? '#ffd23c' : '#ff7a2a', 1);
        }));
        ITEM.helada = pixSprite(26, 1, b => {
          for (let i = 0; i < 3; i++) {
            const a = i * Math.PI / 3, c = Math.cos(a), s = Math.sin(a);
            b.line([[-c * 9, -s * 9], [c * 9, s * 9]], 1.6, '#bfe8ff');
            for (const sg of [-1, 1]) { const px = c * 6 * sg, py = s * 6 * sg, n = [-s, c]; b.line([[px, py], [px + c * 2 * sg + n[0] * 2.5, py + s * 2 * sg + n[1] * 2.5]], 1, '#bfe8ff'); b.line([[px, py], [px + c * 2 * sg - n[0] * 2.5, py + s * 2 * sg - n[1] * 2.5]], 1, '#bfe8ff'); }
          }
          b.ell(0, 0, 2.4, 2.4, '#f4fbff', 1);
        });
        ITEM.iman = pixSprite(28, 1, b => {
          const arc = []; for (let i = 0; i <= 10; i++) { const a = Math.PI + i / 10 * Math.PI; arc.push([Math.cos(a) * 7, -2 + Math.sin(a) * 7]); }
          b.line([[-7, 3], ...arc, [7, 3]], 4.4, '#d0303a');
          b.rect(-9.2, 1, 4.4, 4, '#dcdcdc'); b.rect(4.8, 1, 4.4, 4, '#dcdcdc');
          b.line([[-5, -6], [-2, -8.5]], .9, '#ff8a8a', 1);
        });
        // proyectiles (apuntan a la derecha)
        for (const evo of [0, 1]) {
          ITEM['knife' + evo] = pixSprite(28, 1, b => {
            b.rect(-9, -2, 6, 4, '#5a3a22'); b.dot(-8, -1, '#7a5236', 1); b.rect(-4, -3, 1.6, 6, '#c9a45c');
            b.poly([[10.5, 0], [-2.5, -2.6], [-2.5, 2.6]], evo ? '#cfe2ff' : '#dfe6ee');
            b.line([[-1, -.8], [8, -.2]], .8, '#ffffff', 1);
          });
          ITEM['spear' + evo] = [0, 1].map(f => pixSprite(52, 1, b => {
            b.rect(-24, -1.5, 32, 3, '#8a5a2c'); b.tex('#8a5a2c', (x, y) => (x % 4 === 0) ? dk('#8a5a2c', .2) : null);
            b.poly([[8, -4.5], [21, 0], [8, 4.5]], evo ? '#ffe9a8' : '#dfe6ee'); b.line([[10, -1], [18, 0]], .8, '#ffffff', 1);
            b.poly([[6, -1.5], [-1, f ? -8 : -6.5], [3, -1.5]], '#c23a4a');
          }));
          ITEM['cross' + evo] = pixSprite(40, 1, b => {
            const star = (R, r) => { const p = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr = i % 2 ? r : R; p.push([Math.cos(a) * rr, Math.sin(a) * rr]); } return p; };
            b.ellD(0, 0, 15, 15, evo ? [150, 200, 255] : [255, 230, 150], 2, .3, 0);
            b.poly(star(11, 4), evo ? '#cfe6ff' : '#ffe9a8'); b.poly(star(5, 1.8), evo ? '#f4faff' : '#fffbe8', 1);
          });
          ITEM['pellet' + evo] = pixSprite(10, 1, b => { b.ell(0, 0, 2.6, 2.6, evo ? '#ffcf6a' : '#eee6cf'); b.dot(-1, -1, '#ffffff', 1); });
          ITEM['pava' + evo] = pixSprite(30, 1, b => {
            const body = evo ? '#6a3fa0' : '#8a8f99';
            b.line(qb([-4.5, -3.5], [0, -10.5], [4.5, -3.5], 6), 1.4, '#2a2a30');
            b.line([[5, 0], [10.5, -4.5]], 2.4, body);
            b.ell(0, 1, 6.8, 5.6, body); b.ell(0, -4.6, 3.6, 1.5, dk(body, .15)); b.ell(0, -6, 1, 1, '#2a2a30');
            b.line([[-3.5, -1.5], [-1.5, -2.8]], .9, lt(body, .6), 1);
          });
          ITEM['bol' + evo] = pixSprite(28, 1, b => {
            b.ell(0, 0, 11, 11, evo ? '#9fd0e8' : '#8d8676');
            b.tex(evo ? '#9fd0e8' : '#8d8676', (x, y) => hash(x * 3, y * 7) < .12 ? dk(evo ? '#9fd0e8' : '#8d8676', .2) : null);
            b.line(qb([-10, -3], [0, 2], [10, -3], 6), 1.6, '#4a3a28'); b.line(qb([-3, -10], [2, 0], [-3, 10], 6), 1.6, '#4a3a28');
            b.ell(-4, -4.5, 2.4, 1.6, [255, 255, 255], 1, .7);
          });
          ITEM['flame' + evo] = [9, 12, 15, 18].map(h => pixSprite(h * 2 + 10, 1, b => {
            const H = h + (evo ? 3 : 0), o = evo ? '#ff5a2a' : '#ff7a2a';
            b.poly([...qb([-5.5, 2], [-5, -H * .6], [0, -H], 4), ...qb([0, -H], [5, -H * .6], [5.5, 2], 4).slice(1)], o, 0, .85);
            b.poly([[-2.6, 1], [0, -H * .55], [2.6, 1]], '#ffdc6e', 1, .9);
          }));
        }
      }
      const BUL_SPR = {};
      function bulletSprite(col, glow) {
        col = col || '#e2b6ff';
        const k = col + '|' + glow; if (BUL_SPR[k]) return BUL_SPR[k];
        const gm = /rgba?\(([^)]+)\)/.exec(glow || ''), gc = gm ? gm[1].split(',').slice(0, 3).map(Number) : [197, 108, 240];
        return BUL_SPR[k] = pixSprite(36, 1, b => {
          b.ellD(0, 0, 16, 16, gc, 2, .35, 0); b.ell(0, 0, 12, 12, gc, 2, .25);
          b.ell(0, 0, 8, 8, col); b.ell(-2.6, -2.6, 2.8, 2.8, [255, 255, 255], 1, .85);
        });
      }

      /* íconos de la interfaz: se rasterizan a baja resolución y se reescalan sin suavizado */
      function pixelize(src, w, h) {
        const s = document.createElement('canvas'); s.width = w; s.height = h;
        const g = s.getContext('2d'); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.drawImage(src, 0, 0, w, h);
        const im = g.getImageData(0, 0, w, h), d = im.data;
        for (let i = 0; i < d.length; i += 4) {
          const a = d[i + 3];
          if (a < 70) { d[i + 3] = 0; continue; }
          if (a < 170) { d[i + 3] = a > 120 ? 150 : 90; } else d[i + 3] = 255;
          for (let c = 0; c < 3; c++) d[i + c] = Math.round(d[i + c] / 255 * 15) * 17;   // paleta reducida (4 bits por canal)
        }
        g.putImageData(im, 0, 0);
        const o = document.createElement('canvas'); o.width = w * 4; o.height = h * 4;
        const og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(s, 0, 0, o.width, o.height);
        return o;
      }

      mkItems();
