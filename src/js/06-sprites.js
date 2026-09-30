      /* ---------------- sprites (pixel art procedural) ----------------
         Cada sprite se dibuja en una grilla de píxeles con primitivas (elipses, polígonos, líneas)
         en unidades del radio del enemigo. Después un paso automático agrega luz de luna en los
         bordes de arriba/izquierda, sombra abajo/derecha y un contorno oscuro teñido del color vecino.
         Flags: 0 = material normal (se sombrea y se contornea), 1 = plano (ojos, brillos),
                2 = plano sin contorno (halos, humo, niebla). */
      const SPR = {}, PSPR = {};
      const PXS = 1.25;   // unidades de mundo por píxel de sprite (misma densidad para todo)
      const PX_UP = 4;    // pre-escalado del canvas (nearest) para que se vea nítido al escalar
      const MOONC = [236, 230, 210], NIGHTC = [12, 17, 32];
      function rgb(c) { if (typeof c !== 'string') return c; const n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
      function mixc(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
      const dk = (c, t) => mixc(rgb(c), NIGHTC, t), lt = (c, t) => mixc(rgb(c), MOONC, t);
      const mir = pts => pts.map(([x, y]) => [-x, y]);
      const qb = (p0, p1, p2, n) => { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), m = 2 * (1 - t) * t, c = t * t; o.push([a * p0[0] + m * p1[0] + c * p2[0], a * p0[1] + m * p1[1] + c * p2[1]]); } return o; };

      function PixBuf(G, u, oy, Hh) {
        const W = G, H = Hh || G;
        const b = { G, W, H, u, cx: W / 2, cy: H / 2 + (oy || 0), c: new Array(W * H).fill(null), a: new Float32Array(W * H), f: new Uint8Array(W * H) };
        const X = v => b.cx + v * u, Y = v => b.cy + v * u;
        const put = (x, y, col, fl, al, dith) => {
          x |= 0; y |= 0; if (x < 0 || y < 0 || x >= W || y >= H) return; if (dith !== undefined && ((x + y) & 1) !== dith) return;
          const i = y * W + x; b.c[i] = rgb(col); b.f[i] = fl || 0; b.a[i] = al === undefined ? 1 : al;
        };
        b.dot = (x, y, col, fl, al) => put(Math.floor(X(x)), Math.floor(Y(y)), col, fl, al);
        b.ell = (x, y, rx, ry, col, fl, al, dith) => {
          const X0 = X(x), Y0 = Y(y), RX = Math.max(.5, rx * u), RY = Math.max(.5, ry * u);
          for (let py = Math.floor(Y0 - RY); py <= Math.ceil(Y0 + RY); py++) for (let px = Math.floor(X0 - RX); px <= Math.ceil(X0 + RX); px++) {
            const dx = (px + .5 - X0) / RX, dy = (py + .5 - Y0) / RY; if (dx * dx + dy * dy <= 1) put(px, py, col, fl, al, dith);
          }
        };
        b.ellD = (x, y, rx, ry, col, fl, al, par) => b.ell(x, y, rx, ry, col, fl, al, par);
        b.poly = (pts, col, fl, al) => {
          const P = pts.map(([x, y]) => [X(x), Y(y)]); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
          for (const [x, y] of P) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
          for (let py = Math.floor(y0); py <= Math.ceil(y1); py++) for (let px = Math.floor(x0); px <= Math.ceil(x1); px++) {
            const tx = px + .5, ty = py + .5; let ins = false;
            for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
              const xi = P[i][0], yi = P[i][1], xj = P[j][0], yj = P[j][1];
              if ((yi > ty) !== (yj > ty) && tx < (xj - xi) * (ty - yi) / (yj - yi) + xi) ins = !ins;
            }
            if (ins) put(px, py, col, fl, al);
          }
        };
        // línea gruesa; si se pasa w1, se afina de w a w1 a lo largo del trazo
        b.line = (pts, w, col, fl, al, w1) => {
          let tot = 0; const segL = [];
          for (let k = 0; k < pts.length - 1; k++) { const L = Math.hypot(pts[k + 1][0] - pts[k][0], pts[k + 1][1] - pts[k][1]); segL.push(L); tot += L; }
          let acc = 0;
          for (let k = 0; k < pts.length - 1; k++) {
            const [ax, ay] = pts[k], [bx, by] = pts[k + 1], n = Math.max(1, Math.ceil(segL[k] * u * 2));
            for (let s = 0; s <= n; s++) {
              const t = s / n, g = tot ? (acc + segL[k] * t) / tot : 0, ww = w1 === undefined ? w : w + (w1 - w) * g, R = Math.max(.5, ww * u / 2);
              const cx_ = X(ax + (bx - ax) * t), cy_ = Y(ay + (by - ay) * t);
              for (let py = Math.floor(cy_ - R); py <= Math.ceil(cy_ + R); py++) for (let px = Math.floor(cx_ - R); px <= Math.ceil(cx_ + R); px++) {
                const dx = px + .5 - cx_, dy = py + .5 - cy_; if (dx * dx + dy * dy <= R * R) put(px, py, col, fl, al);
              }
            }
            acc += segL[k];
          }
        };
        b.rect = (x, y, w, h, col, fl, al) => { for (let py = Math.floor(Y(y)); py < Math.ceil(Y(y + h)); py++) for (let px = Math.floor(X(x)); px < Math.ceil(X(x + w)); px++) put(px, py, col, fl, al); };
        // recolorea los píxeles de un material (color exacto) según un patrón; devolver [r,g,b] o [r,g,b,alpha]
        b.tex = (col, fn) => {
          const C = rgb(col);
          for (let i = 0; i < W * H; i++) { const c = b.c[i]; if (c && c[0] === C[0] && c[1] === C[1] && c[2] === C[2]) { const r = fn(i % W, (i / W) | 0); if (r) { b.c[i] = [r[0], r[1], r[2]]; if (r.length > 3) b.a[i] = r[3]; } } }
        };
        // coordenadas de píxel absolutas y sprites ASCII (cada char = color de la paleta, '.' = vacío)
        b.pp = put;
        b.spr = (rows, pal, x0, y0, fx, fy, fl) => {
          const h = rows.length, w = rows[0].length;
          for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) { const ch = rows[fy ? h - 1 - r : r][fx ? w - 1 - c : c]; if (ch !== '.' && pal[ch]) put(Math.floor(b.cx + x0) + c, Math.floor(b.cy + y0) + r, pal[ch], fl === undefined ? 1 : fl); }
        };
        return b;
      }

      function pixFinish(b) {
        const W = b.W, H = b.H, C = b.c, A = b.a, F = b.f;
        const S_ = (x, y) => { if (x < 0 || y < 0 || x >= W || y >= H) return false; const i = y * W + x; return !!C[i] && A[i] > .5 && F[i] !== 2; };
        const img = new ImageData(W, H), d = img.data, fl = new ImageData(W, H), fd = fl.data;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x; let col = null, al = 0;
          if (S_(x, y)) {
            col = C[i]; al = A[i];
            if (F[i] === 0) {
              if (!S_(x, y - 1) || !S_(x - 1, y)) col = lt(col, .36);
              else if (!S_(x, y - 2) || !S_(x - 1, y - 1)) col = lt(col, .13);
              if (!S_(x, y + 1) || !S_(x + 1, y)) col = dk(col, .3);
              else if (!S_(x, y + 2) || !S_(x + 1, y + 1)) col = dk(col, .12);
            }
          } else {
            const n = S_(x, y + 1) ? i + W : S_(x, y - 1) ? i - W : S_(x - 1, y) ? i - 1 : S_(x + 1, y) ? i + 1 : -1;
            if (n >= 0) { col = mixc(C[n], NIGHTC, .8); al = 1; }
            else if (C[i]) { col = C[i]; al = A[i]; }
          }
          if (col) { const o = i * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = al * 255; fd[o] = fd[o + 1] = fd[o + 2] = 255; fd[o + 3] = al * 255; }
        }
        const up = im => {
          const s = document.createElement('canvas'); s.width = W; s.height = H; s.getContext('2d').putImageData(im, 0, 0);
          const c = document.createElement('canvas'); c.width = W * PX_UP; c.height = H * PX_UP; const g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(s, 0, 0, c.width, c.height); return c;
        };
        return { img: up(img), flash: up(fl) };
      }

      // patitas de caminante: s=-1/1, devuelve [x,y] del pie
      const legPos = (ph, s, dx, y) => { const o = Math.sin(ph + (s > 0 ? Math.PI : 0)); return [s * dx + o * .1, y - Math.max(0, o) * .14]; };

      const PIX = {
        sombra(b, T, ph) {
          const body = T.col;
          for (let i = 0; i < 5; i++) b.ellD(-.8 + i * .4, 1.02 + Math.sin(ph + i * 1.9) * .1, .26, .16, dk(body, .15), 2, .6, i & 1);
          const pts = []; for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; pts.push([Math.cos(a), -.1 + Math.sin(a)]); }
          pts.push([1.02, .5]);
          for (let i = 0; i <= 5; i++) { const x = 1 - (i / 5) * 2; pts.push([x, .72 + (i % 2 ? .2 : 0) + Math.sin(ph + i * 1.7) * .1]); }
          pts.push([-1.02, .5]);
          b.poly(pts, body);
          b.ell(0, .42, .62, .36, dk(body, .3));
          b.tex(body, (x, y) => hash(x * 7 + 1, y * 13 + 2) < .1 ? dk(body, .18) : hash(x * 3, y * 5) < .04 ? lt(body, .18) : null);
          const eye = [[-.66, -.34], [-.14, -.2], [-.2, -.02], [-.58, -.06]];
          b.poly(eye, T.eye, 1); b.poly(mir(eye), T.eye, 1);
          b.dot(-.3, -.16, '#fffbe6', 1); b.dot(.26, -.16, '#fffbe6', 1);
          b.line([[-.32, .22], [-.16, .31], [0, .22], [.16, .31], [.32, .22]], .08, dk(body, .75), 1);
        },
        anima(b, T, ph) {
          b.ellD(0, -.1, 2.15, 2.15, [140, 175, 240], 2, .16, 0);
          b.ell(0, -.1, 1.55, 1.55, [150, 185, 245], 2, .13);
          b.ellD(0, -.1, 1.55, 1.55, [175, 205, 255], 2, .22, 1);
          const hx = .95, top = -.35, pts = [];
          for (let i = 0; i <= 14; i++) { const a = Math.PI + i / 14 * Math.PI; pts.push([hx * Math.cos(a), top + hx * Math.sin(a)]); }
          pts.push([hx * 1.02, .3], [hx * .92 + Math.sin(ph) * .12, .85], [hx * .8, 1.1]);
          for (let i = 1; i <= 6; i++) { const x = hx * .8 - i / 6 * hx * 1.6; pts.push([x, 1.1 + Math.sin(ph + i * 1.7) * .22 + (i % 2 ? -.28 : .32)]); }
          pts.push([-hx * .92 + Math.sin(ph + 1) * .12, .85], [-hx * 1.02, .3]);
          b.poly(pts, '#c8d8f2');
          b.tex('#c8d8f2', (x, y) => { const yy = (y + .5 - b.cy) / b.u; return yy < -.7 ? [246, 250, 255] : yy < .05 ? [216, 229, 249] : yy < .7 ? [182, 203, 241] : yy < .95 ? [160, 186, 236, .7] : [150, 178, 235, .42]; });
          const aw = Math.sin(ph) * .15;
          b.line([[-hx * .85, .05], [-hx * 1.3, .25 + aw], [-hx * 1.22, .6 + aw]], .26, [216, 229, 249], 0, .95, .2);
          b.line([[hx * .85, .05], [hx * 1.3, .25 - aw], [hx * 1.22, .6 - aw]], .26, [216, 229, 249], 0, .95, .2);
          b.ell(-.34, -.35, .17, .27, '#141c3a', 1); b.ell(.34, -.35, .17, .27, '#141c3a', 1);
          b.dot(-.3, -.32, '#96e6ff', 1); b.dot(.38, -.32, '#96e6ff', 1);
          b.ell(0, .18, .13, .2 + Math.sin(ph) * .04, '#141c3a', 1);
          b.ell(-.42, -.86, .22, .09, [255, 255, 255], 1);
        },
        calavera(b, T, ph) {
          const bone = '#d9d1b8', boneD = '#b3a98c', dark = '#1c1a17';
          for (const s of [-1, 1]) { const [fx, fy] = legPos(ph, s, .34, 1.08); b.line([[s * .22, .72], [fx, fy]], .13, boneD); b.ell(fx + s * .06, fy + .02, .17, .08, boneD); }
          b.line([[0, .5], [0, .94]], .13, boneD);
          for (let i = 0; i < 2; i++) { const y = .6 + i * .15; b.line([[-.36, y + .07], [-.13, y], [.13, y], [.36, y + .07]], .08, boneD); }
          b.ell(0, -.2, .95, .85, bone); b.rect(-.5, .34, 1, .32, bone); b.ell(0, .34, .64, .2, bone);
          b.tex(bone, (x, y) => hash(x * 5 + 3, y * 11) < .08 ? [198, 188, 160] : null);
          b.ell(-.38, -.12, .27, .3, dark, 1); b.ell(.38, -.12, .27, .3, dark, 1);
          b.dot(-.36, -.06, '#ff9a3c', 1); b.dot(.4, -.06, '#ff9a3c', 1); b.dot(-.36, -.14, '#7a2a14', 1); b.dot(.4, -.14, '#7a2a14', 1);
          b.poly([[0, .1], [-.13, .32], [.13, .32]], dark, 1);
          b.line([[-.44, .5], [.44, .5]], .05, '#5a5242', 1);
          for (let i = -2; i <= 2; i++) b.line([[i * .17, .4], [i * .17, .64]], .045, '#5a5242', 1);
          b.line([[.25, -.98], [.32, -.76], [.2, -.62], [.34, -.46]], .05, '#7a735f', 1);
        },
        lobizon(b, T, ph) {
          const fur = T.col, furD = dk(fur, .32), furL = '#a07a55', claw = '#ece4cc';
          for (const s of [-1, 1]) {
            const [fx, fy] = legPos(ph, s, .42, 1.02);
            b.line([[s * .35, .68], [fx, fy]], .3, furD); b.ell(fx + s * .05, fy + .04, .22, .1, furD);
            for (let c = -1; c <= 1; c++) b.dot(fx + s * .05 + c * .1, fy + .13, claw, 1);
          }
          for (const s of [-1, 1]) {
            const sw = Math.sin(ph + (s > 0 ? 0 : Math.PI)) * .1, hand = [s * .93, .78 + sw];
            b.line([[s * .62, -.05], [s * 1.0, .36 + sw * .5], hand], .3, furD);
            for (let c = -1; c <= 1; c++) b.line([hand, [hand[0] + c * .1 + s * .04, hand[1] + .24]], .07, claw, 1);
          }
          b.ell(0, .3, .82, .66, fur);
          b.ell(0, .44, .42, .34, furL);
          for (let i = 0; i < 9; i++) {
            const a = -Math.PI + .3 + i / 8 * (Math.PI - .6), bx = Math.cos(a) * .7, by = -.3 + Math.sin(a) * .58, tx = Math.cos(a) * 1.06, ty = -.3 + Math.sin(a) * .94, pa = a + Math.PI / 2;
            b.poly([[bx + Math.cos(pa) * .17, by + Math.sin(pa) * .17], [tx, ty], [bx - Math.cos(pa) * .17, by - Math.sin(pa) * .17]], furD);
          }
          b.ell(0, -.32, .66, .56, fur);
          const ear = [[-.52, -.6], [-.76, -1.34], [-.2, -.82]], inner = [[-.5, -.72], [-.65, -1.12], [-.32, -.84]];
          b.poly(ear, fur); b.poly(mir(ear), fur); b.poly(inner, '#b0605a'); b.poly(mir(inner), '#b0605a');
          b.tex(fur, (x, y) => hash(x * 3, y * 5 + 1) < .17 ? dk(fur, .2) : hash(x + 9, y * 2) < .05 ? lt(fur, .15) : null);
          b.ell(0, -.1, .4, .27, furL);
          b.ell(0, -.24, .14, .09, '#1a120c', 1); b.dot(-.04, -.27, '#6a5a50', 1);
          b.line([[-.25, .05], [.25, .05]], .06, '#1a120c', 1);
          const fang = [[-.2, .05], [-.14, .22], [-.08, .05]];
          b.poly(fang, '#f4efe0', 1); b.poly(mir(fang), '#f4efe0', 1);
          const eye = [[-.48, -.54], [-.13, -.43], [-.19, -.34], [-.43, -.38]];
          b.poly(eye, T.eye, 1); b.poly(mir(eye), T.eye, 1);
          b.dot(-.28, -.45, '#ffe0b0', 1); b.dot(.24, -.45, '#ffe0b0', 1);
        },
        bruja(b, T, ph) {
          const skin = T.col, cloak = '#2a2138', trim = '#8c5ec9', hat = '#17131f', o = Math.sin(ph), oy = .1 + o * .06;
          for (const s of [-1, 1]) { const [fx, fy] = legPos(ph, s, .34, 1.08); b.ell(fx, fy, .22, .12, hat); }
          b.ellD(1.12, oy, .5, .5, [231, 247, 106], 2, .3, 0);
          b.poly([[-.5, .2], [.5, .2], [.9 + o * .04, 1.02], [.45, .95], [0, 1.04], [-.45, .95], [-.9 + o * .04, 1.02]], cloak);
          b.tex(cloak, (x, y) => ((x * 3 + y) % 7 === 0) ? lt(cloak, .1) : null);
          b.line([[-.84, .88], [.84, .88]], .08, trim);
          b.line([[.4, .3], [.95, oy + .18]], .24, cloak); b.ell(.98, oy + .16, .13, .13, skin);
          b.ell(1.12, oy, .22, .22, T.eye, 1); b.dot(1.05, oy - .08, '#ffffff', 1);
          const hair = [[-.66, -.25], [-.88, .56], [-.46, .4], [-.5, -.05]];
          b.poly(hair, '#8a8f96'); b.poly(mir(hair), '#8a8f96');
          b.ell(0, .02, .6, .56, skin);
          b.tex(skin, (x, y) => hash(x * 4, y * 9 + 2) < .06 ? dk(skin, .15) : null);
          b.poly([[.04, -.02], [.36, .22], [.1, .25]], dk(skin, .2));
          b.ell(-.24, -.06, .11, .08, T.eye, 1); b.ell(.2, -.06, .11, .08, T.eye, 1);
          b.dot(-.22, -.06, '#1b2a20', 1); b.dot(.22, -.06, '#1b2a20', 1);
          b.dot(.32, .13, dk(skin, .5), 1);
          b.line([[-.22, .34], [-.05, .39], [.14, .34]], .06, '#1b2a20', 1);
          b.ell(0, -.5, 1.22, .26, hat);
          b.poly([[-.58, -.55], [.58, -.55], [.36, -1.35], [.74, -1.96], [.08, -1.48]], hat);
          b.poly([[-.53, -.72], [.53, -.72], [.47, -.9], [-.47, -.9]], trim);
          b.rect(-.1, -.9, .2, .2, '#e0b75a', 1);
        },
        mandinga(b, T, ph) {
          const red = T.col, cape = '#1a0a10', horn = '#e8d8b0';
          b.poly([[-1.25, 1.15], [-.62, -.05], [0, -.4], [.62, -.05], [1.25, 1.15], [.7, 1.05], [0, 1.15], [-.7, 1.05]], cape);
          b.poly([[-.62, 1.08], [-.3, .3], [.3, .3], [.62, 1.08]], '#6a1020');
          b.poly([[-.36, 1.12], [-.2, .36], [.2, .36], [.36, 1.12]], '#241018');
          for (let i = 0; i < 3; i++) b.ell(0, .58 + i * .17, .045, .045, '#c8c8d0', 1);
          b.poly([[-.22, .34], [.22, .34], [0, .62]], '#b01c30');
          for (const s of [-1, 1]) {
            const hp = qb([s * .45, -.62], [s * 1.2, -1.05], [s * .9, -1.72], 12); b.line(hp, .34, horn, 0, 1, .05);
            for (let i = 2; i < 9; i += 2) b.dot(hp[i][0] - s * .04, hp[i][1], dk(horn, .3), 1);
          }
          b.ell(0, -.12, .8, .78, red);
          b.tex(red, (x, y) => hash(x * 3 + 5, y * 7) < .08 ? dk(red, .2) : null);
          const brow = [[-.62, -.42], [-.1, -.22], [-.12, -.13], [-.64, -.31]], eye = [[-.56, -.27], [-.14, -.11], [-.52, -.02]];
          b.poly(brow, cape, 1); b.poly(mir(brow), cape, 1); b.poly(eye, T.eye, 1); b.poly(mir(eye), T.eye, 1);
          b.line([[-.33, -.2], [-.33, -.07]], .05, cape, 1); b.line([[.33, -.2], [.33, -.07]], .05, cape, 1);
          b.line(qb([-.5, .04], [-.2, .14], [0, .08], 6), .08, cape, 1); b.line(qb([.5, .04], [.2, .14], [0, .08], 6), .08, cape, 1);
          b.poly([[-.42, .14], [.42, .14], [.28, .35], [0, .41], [-.28, .35]], cape, 1);
          for (let i = -3; i <= 3; i++) b.poly([[i * .11 - .045, .15], [i * .11 + .045, .15], [i * .11, .25]], '#f4efe0', 1);
          b.poly([[-.22, .45], [.22, .45], [0, 1.0]], cape);
        },
        chonchon(b, T, ph) {
          const skin = T.col, mem = '#6a5540', bone = '#3e2f22', hair = '#2a1d14', fl = Math.sin(ph) * .45;
          for (const s of [-1, 1]) {
            const tip = [s * 2.12, .05 - fl * .5], low = [s * 1.3, .45 - fl * .3];
            const c1 = qb([s * .55, -.25], [s * 1.9, -1.15 - fl], tip, 8);
            const pts = [...c1, ...qb(tip, [s * 1.55, -.05], low, 5).slice(1), ...qb(low, [s * 1.0, .1], [s * .65, .35], 5).slice(1)];
            b.poly(pts, mem);
            for (const p of [c1[3], c1[6], tip, low]) b.line([[s * .62, -.05], p], .06, bone, 1);
            b.ell(s * .72, -.02, .15, .24, '#b88a74');
          }
          b.ell(0, 0, .85, .85, skin);
          b.ell(0, -.36, .86, .52, hair);
          b.ell(0, .12, .8, .66, skin);
          for (let i = -3; i <= 3; i++) b.poly([[i * .2 - .11, -.3], [i * .2 + .11, -.3], [i * .2, -.1 + (i & 1) * .05]], hair);
          b.tex(hair, (x, y) => (x % 3 === 0 && hash(x, y) < .5) ? lt(hair, .2) : null);
          b.ell(-.3, -.02, .17, .15, T.eye, 1); b.ell(.3, -.02, .17, .15, T.eye, 1);
          b.dot(-.28, 0, '#b02a1a', 1); b.dot(.32, 0, '#b02a1a', 1);
          b.dot(-.56, .22, '#c07a60', 1); b.dot(.56, .22, '#c07a60', 1);
          b.ell(0, .42, .2, .16, '#3a1a14', 1); b.line([[-.12, .32], [.12, .32]], .05, '#f4efe0', 1);
        },
        cuero(b, T, ph) {
          const hide = T.col, claw = '#e8dcc0';
          for (let i = 0; i < 12; i++) {
            const a = i / 12 * TAU + .1 + Math.sin(ph + i) * .05;
            b.poly([[Math.cos(a - .1), Math.sin(a - .1) * .72], [Math.cos(a) * 1.4, Math.sin(a) * 1.02], [Math.cos(a + .13), Math.sin(a + .13) * .72]], claw);
          }
          const pts = []; for (let i = 0; i < 32; i++) { const a = i / 32 * TAU, rr = 1 + Math.sin(i * 2.7 + ph * 2) * .06; pts.push([Math.cos(a) * 1.12 * rr, Math.sin(a) * .8 * rr]); }
          b.poly(pts, hide);
          b.tex(hide, (x, y) => hash(x * 2, y * 9) < .12 ? dk(hide, .2) : hash(x * 5, y) < .05 ? lt(hide, .12) : null);
          for (const [x, y, r_, c] of [[-.55, .22, .26, '#d8c8a4'], [.46, .3, .22, '#4e3620'], [.05, .5, .18, '#d8c8a4'], [-.12, -.1, .15, '#4e3620'], [.66, -.22, .14, '#d8c8a4'], [-.78, -.18, .13, '#4e3620']]) b.ell(x, y, r_, r_ * .66, c);
          b.line([[-.3, -.04], [.3, -.04]], .06, '#2a1a0c', 1);
          for (let i = -2; i <= 2; i++) b.poly([[i * .12 - .045, -.04], [i * .12 + .045, -.04], [i * .12, .07]], '#f4efe0', 1);
          for (const [x, y] of [[-.34, -.32], [.34, -.32], [-.13, -.5], [.13, -.5]]) { b.ell(x, y, .1, .1, T.eye, 1); b.dot(x - .03, y - .03, '#ffd0a0', 1); }
        },
        basilisco(b, T, ph) {
          const g = T.col, gd = '#4f6a2a', yel = '#e0b030', red = '#c23a2a';
          const tail = [...qb([-.3, .5], [-1.5, 1.0], [-1.35, -.1], 7), ...qb([-1.35, -.1], [-1.25, -.7], [-1.7, -.9 + Math.sin(ph) * .3], 7).slice(1)];
          b.line(tail, .44, gd, 0, 1, .12);
          for (let i = 1; i < tail.length - 1; i += 2) b.ell(tail[i][0], tail[i][1], .06, .06, '#a8c060', 1);
          for (const s of [-1, 1]) {
            const [fx, fy] = legPos(ph, s, .32, 1.0);
            b.line([[s * .25, .7], [fx, fy]], .09, yel); for (let c = -1; c <= 1; c++) b.line([[fx, fy], [fx + c * .14 + .05, fy + .09]], .06, yel);
          }
          b.ell(-.25, -.95, .2, .22, red); b.ell(.05, -1.08, .24, .26, red); b.ell(.34, -.94, .19, .2, red);
          b.ell(0, 0, 1, 1, g);
          b.tex(g, (x, y) => ((x + ((y >> 1) & 1) * 2) % 4 === 0 && (y & 1)) ? dk(g, .2) : null);
          b.ell(-.2, .3, .52, .34, gd);
          for (let i = 0; i < 4; i++) b.line([[-.56 + i * .2, .24], [-.46 + i * .2, .54]], .05, dk(gd, .35), 1);
          b.poly([[.84, -.18], [1.46, .02], [.84, .24]], yel); b.line([[.88, .03], [1.3, .03]], .04, dk(yel, .45), 1);
          b.ell(.78, .46, .13, .24, red);
          b.ell(.38, -.26, .25, .25, T.eye, 1); b.rect(.35, -.45, .07, .4, '#1a1a0a', 1); b.dot(.29, -.38, '#ffffff', 1);
        },
        caleuche(b, T, ph) {
          b.ellD(0, -.3, 2.05, 2.05, [140, 230, 255], 2, .14, 0);
          b.ellD(0, -.3, 1.5, 1.5, [160, 236, 255], 2, .2, 1);
          b.line([[-.4, .1], [-.4, -1.48]], .07, '#1a2230'); b.line([[.45, .1], [.45, -1.64]], .07, '#1a2230');
          b.line([[-1.3, -.1], [-.4, -1.4], [.45, -1.6], [1.35, -.1]], .02, '#2a3444', 1);
          for (const [x, t, bt, w] of [[-.4, -1.36, -.25, .78], [.45, -1.52, -.2, .88]]) {
            const pts = [...qb([x - w / 2, t], [x, t + .2], [x + w / 2, t], 6), ...qb([x + w / 2 * .9, bt], [x, bt + .25], [x - w / 2 * .9, bt], 6)];
            b.poly(pts, [205, 238, 255], 0, .75);
            b.line([[x - w / 2 * .9, (t + bt) / 2], [x + w / 2 * .9, (t + bt) / 2]], .03, [150, 210, 245], 1, .8);
            b.poly([[x - .12, t + .38], [x + .06, t + .52], [x - .04, t + .62]], [60, 90, 120], 1, .8);
          }
          b.poly([[.45, -1.64], [.92, -1.54], [.45, -1.44]], '#c23a4a');
          b.poly([[-1.38, -.06], [1.42, -.06], [1.02, .7], [-1.0, .7]], T.col);
          b.poly([[1.2, -.06], [1.62, -.36], [1.42, -.06]], T.col);
          for (let i = 1; i <= 3; i++) b.line([[-1.3 + i * .1, -.06 + i * .19], [1.36 - i * .12, -.06 + i * .19]], .03, dk(T.col, .35), 1);
          b.line([[-1.36, -.04], [1.44, -.04]], .06, '#4a6280', 1);
          for (let i = 0; i < 6; i++) { b.rect(-.85 + i * .34, .26, .14, .14, T.eye, 1); b.dot(-.83 + i * .34, .28, '#ffffff', 1); }
          for (let i = 0; i < 7; i++) b.ellD(-1.3 + i * .43, .78 + Math.sin(i * 2.1) * .05, .32, .13, [210, 235, 250], 2, .45, i & 1);
        },
        farol(b, T, ph) {
          b.ellD(0, -.6, 2.0, 2.0, [255, 200, 110], 2, .16, 0);
          b.ellD(0, -.6, 1.3, 1.3, [255, 210, 130], 2, .24, 1);
          b.rect(-.12, -.1, .24, 1.4, '#3a2e22'); b.rect(-.5, 1.2, 1, .22, '#3a2e22');
          b.rect(-.55, -1.25, 1.1, 1.15, '#2a2018');
          b.rect(-.38, -1.08, .76, .82, '#ffcf6a', 1);
          b.line([[-.38, -.67], [.38, -.67]], .06, '#8a5a20', 1);
          b.ell(0, -.6, .14, .26, '#fff3c4', 1); b.dot(0, -.46, '#ff9a3c', 1);
          b.poly([[-.74, -1.22], [0, -1.74], [.74, -1.22]], '#2a2018');
          b.ell(0, -1.82, .1, .1, '#2a2018');
        }
      };

      /* ---- personajes: gaucho en unidades de mundo, mirando a la derecha ---- */
      const GAUCHO = {
        baqueano: { hat: 'chambergo', hatCol: '#2a221c', band: '#7a2a22', hair: '#2a1d14', stache: true, scarf: '#ece6d2' },
        cuchillero: { hat: 'boina', hatCol: '#1f2a44', hair: '#2a1d14', stache: true, beard: true, scarf: '#c9a45c' },
        pialadora: { hat: 'vincha', hair: '#1a1410', braid: true, band: '#b8322f', scarf: '#ece6d2' },
        fueguera: { hat: 'suelto', hair: '#4a1e12', scarf: '#3a2a20' },
        tormentera: { hat: 'capucha', hair: '#1a1410', scarf: '#bfe3ff' },
        rastreadora: { hat: 'pluma', hatCol: '#5a4630', band: '#3f7a5a', hair: '#2a1d14', braid: true, scarf: '#e0b75a' },
        payador: { hat: 'chambergo', hatCol: '#3b2a1c', band: '#c9a45c', hair: '#2a1d14', stache: true, scarf: '#ece6d2' }
      };
      function gaucho(b, id, ph, walk) {
        const col = CHARS[id].col, cf = GAUCHO[id], skin = '#e0b48a', pants = '#3a3246', boot = '#2a1d14', st = walk ? Math.sin(ph) : 0, sw = st * .7;
        if (id === 'payador') { b.line([[-6, 0], [-10.5, -15]], 1.6, '#5a3a22'); b.rect(-11.6, -17.4, 2.6, 2.8, '#3b2a1c'); b.ell(-7, 3, 4.4, 5.4, '#a0602c'); b.ell(-6.8, 3.4, 1.4, 1.4, '#2a1d14', 1); }
        if (cf.hat === 'capucha') b.ell(-.6, -7.8, 6.8, 7, dk(col, .25));
        if (cf.hat === 'suelto') { b.ell(-1.2, -6, 6.4, 7.2, cf.hair); b.tex(cf.hair, (x, y) => ((x + y) % 4 === 0) ? lt(cf.hair, .15) : null); }
        if (cf.hat === 'vincha') b.ell(-.8, -7.2, 5.9, 5.9, cf.hair);
        if (cf.braid) { b.line([[-4.4, -5], [-6, 1], [-5.4, 6.5]], 2.2, cf.hair); for (let i = 0; i < 4; i++) b.dot(-4.9 - i * .3, -3 + i * 2.6, lt(cf.hair, .2), 1); b.dot(-5.4, 7, '#b8322f', 1); }
        for (const s of [-1, 1]) {
          const k = s < 0 ? st : -st, lift = Math.max(0, k) * 2.2, fx = s * 3.2 + k * 1.6, fy = 13 - lift;
          b.line([[s * 2.6, 7], [fx, fy - 1.4]], 3.4, pants); b.ell(fx + 1, fy, 2.6, 1.6, boot);
        }
        const hw = y => 7.5 + 4 * (y + 3.5) / 12.5;
        b.poly([[-7.5, -3.5], [7.5, -3.5], [11.5 + sw, 9], [-11.5 + sw, 9]], col);
        b.tex(col, (x, y) => (x % 4 === 1) ? dk(col, .1) : null);
        const lc = lt(col, .5), dc = dk(col, .55);
        b.poly([[-hw(5.2) + sw * .7, 5.2], [hw(5.2) + sw * .7, 5.2], [hw(7.4) + sw * .87, 7.4], [-hw(7.4) + sw * .87, 7.4]], lc);
        for (let x = -9; x <= 9; x += 3) b.dot(x + sw * .8, 6.1, dc, 1);
        if (id === 'baqueano') b.line([[-6.5, 3], [-9.5, 6.5], [-7.5, 8.5]], 1.1, '#5a3a22', 1);
        if (id === 'cuchillero') { b.line([[-7, 4.6], [-4, 3.8]], 1.8, '#6a4a2a', 1); b.line([[-4, 3.8], [4.5, 1.6]], 1.3, '#cfd6e0', 1); }
        b.ell(8.5 + sw, 4, 1.8, 1.8, skin);
        if (id === 'pialadora') { for (const [x, y] of [[7, 11.5], [9.6, 12.6], [11.4, 10.4]]) { b.line([[8.6 + sw, 5], [x, y]], .5, '#8a6a40', 1); b.ell(x, y, 1.3, 1.3, '#8a8a80'); } }
        if (id === 'fueguera') { b.ellD(9.5 + sw, 1.5, 4, 4, [255, 160, 60], 2, .35, 0); b.ell(9.5 + sw, 1.8, 1.9, 2.2, '#ff8a2a', 1); b.ell(9.5 + sw, 2.3, 1, 1.2, '#fff0b0', 1); }
        if (id === 'tormentera') b.line([[9 + sw, 1.5], [10.5 + sw, -.5], [9.5 + sw, -.8], [11 + sw, -3]], .7, '#bfe3ff', 1);
        b.ell(0, -3.2, 3.6, 1.6, cf.scarf);
        b.ell(0, -7.5, 5, 5, skin);
        if (cf.hat !== 'capucha' && cf.hat !== 'suelto') b.rect(-5, -9, 2, 4, cf.hair);
        b.dot(2.7, -8.2, '#1c140e', 1); b.dot(2.7, -7.2, '#1c140e', 1);
        b.dot(3.2, -5.8, '#d08a6a', 1);
        if (cf.stache) b.line([[1.2, -4.7], [4.6, -5]], .9, cf.hair, 1);
        if (cf.beard) b.poly([[-2, -4], [4, -4.4], [2, -2.6], [-1, -2.8]], cf.hair, 1);
        if (cf.hat === 'chambergo') { b.ell(0, -11.2, 10.5, 2, cf.hatCol); b.poly([[-5, -11], [5, -11], [4.2, -17.6], [-4.2, -17.6]], cf.hatCol); b.rect(-5, -13.4, 10, 1.5, cf.band); }
        else if (cf.hat === 'boina') { b.ell(-.6, -11, 6.4, 2.8, cf.hatCol); b.dot(-.6, -14, cf.hatCol); }
        else if (cf.hat === 'vincha') { b.ell(-.6, -10.6, 5.2, 2.4, cf.hair); b.line([[-5.2, -10], [5.2, -10]], 1.3, cf.band); }
        else if (cf.hat === 'suelto') { b.ell(-.4, -10.6, 5.4, 2.6, cf.hair); b.poly([[1, -10], [5.4, -8], [4.6, -11]], cf.hair); }
        else if (cf.hat === 'capucha') { b.ell(-.8, -10.4, 6, 3.4, dk(col, .25)); b.line([[-5.6, -9.5], [-5.2, -3]], 1.6, dk(col, .25)); }
        else if (cf.hat === 'pluma') { b.ell(0, -11, 12, 2, cf.hatCol); b.ell(0, -13.2, 5, 3, cf.hatCol); b.rect(-5, -12.2, 10, 1.2, cf.band); b.line([[3, -13], [7, -18], [9.4, -19.6]], 1.3, '#f4efe0', 0, 1, .5); }
      }

      const WALK = new Set(['sombra', 'calavera', 'lobizon', 'bruja', 'cuero', 'basilisco']);
      function makeSprites() {
        for (const k in ETYPES) {
          const T = ETYPES[k], G = Math.round(T.r * 4.6 / PXS), u = T.r / PXS, nf = k === 'anima' ? 8 : k === 'chonchon' ? 6 : WALK.has(k) ? 4 : 1, frames = [];
          for (let fi = 0; fi < nf; fi++) { const b = PixBuf(G, u); PIX[k](b, T, fi / nf * TAU); frames.push(pixFinish(b)); }
          SPR[k] = { img: frames[0].img, flash: frames[0].flash, frames, size: G * PXS };
        }
        for (const id in CHARS) {
          const G = 44, frames = [];  // el jugador se dibuja 20% más grande que antes para que no se pierda en las hordas
          for (let fi = 0; fi < 5; fi++) { const b = PixBuf(G, 1.2 / PXS, -2); gaucho(b, id, (fi - 1) / 4 * TAU, fi > 0); frames.push(pixFinish(b).img); }
          const sil = document.createElement('canvas'); sil.width = sil.height = frames[0].width;
          const sg = sil.getContext('2d'); sg.drawImage(frames[0], 0, 0); sg.globalCompositeOperation = 'source-atop'; sg.fillStyle = CHARS[id].col; sg.fillRect(0, 0, sil.width, sil.height);
          PSPR[id] = { frames, sil, size: G * PXS, url: null };
        }
      }

