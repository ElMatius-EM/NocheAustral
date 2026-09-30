      /* ---------------- íconos procedurales ---------------- */
      const OL = '#0c1120', ICONS = {};
      function fs(g, fill, lw) { g.fillStyle = fill; g.fill(); g.strokeStyle = OL; g.lineWidth = lw || 3; g.stroke(); }
      function glow(g, col) { const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
      function star4(g, x, y, R, r) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r : R; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); }
      function rstroke(g, path, cols) { for (const [c, w] of cols) { g.strokeStyle = c; g.lineWidth = w; path(); g.stroke(); } }
      const ICON_DRAW = {
        rebenque(g, evo) {
          if (evo) glow(g, 'rgba(255,60,80,.5)');
          g.save(); g.translate(16, 50); g.rotate(-Math.PI / 4);
          g.beginPath(); g.rect(-4.5, -13, 9, 24); fs(g, '#6b4220', 2.5);
          g.fillStyle = '#c9a45c'; g.fillRect(-4.5, -6, 9, 3); g.fillRect(-4.5, 3, 9, 3);
          g.restore();
          const th = () => { g.beginPath(); g.moveTo(23, 41); g.bezierCurveTo(34, 26, 60, 32, 52, 14); g.bezierCurveTo(47, 4, 33, 9, 38, 19); };
          rstroke(g, th, [[OL, 8], [evo ? '#d62c48' : '#a8743f', 4.5], [evo ? '#ff9aa8' : '#d9ac72', 1.5]]);
          g.fillStyle = evo ? '#ff5a6a' : '#d9ac72'; g.beginPath(); g.arc(38, 19, 2.5, 0, TAU); g.fill();
        },
        facon(g, evo) {
          const knife = (x, y, a, sc) => {
            g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, sc);
            g.beginPath(); g.moveTo(-2, -5); g.lineTo(26, -3.5); g.lineTo(34, 1); g.lineTo(-2, 5); g.closePath(); fs(g, evo ? '#d6e9ff' : '#dfe6ee', 2.5);
            g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(2, -2); g.lineTo(26, -1.5); g.stroke();
            g.beginPath(); g.rect(-5, -8, 4, 16); fs(g, '#c9a45c', 2.5);
            g.beginPath(); g.rect(-19, -4.5, 14, 9); fs(g, '#5a3a22', 2.5);
            g.fillStyle = '#c9a45c'; g.fillRect(-15, -4.5, 2, 9);
            g.restore();
          };
          if (evo) { glow(g, 'rgba(120,180,255,.45)'); knife(17, 49, -1.2, .95); knife(17, 49, -.8, .95); knife(17, 49, -.4, .95); }
          else knife(19, 45, -Math.PI / 4, 1);
        },
        boleadoras(g, evo) {
          if (evo) { glow(g, 'rgba(110,200,230,.45)'); g.strokeStyle = 'rgba(170,225,245,.85)'; g.lineWidth = 2.5; g.beginPath(); g.arc(32, 32, 27, -.5, 1.3); g.stroke(); g.beginPath(); g.arc(32, 32, 27, 2.6, 4.4); g.stroke(); }
          const pts = [[14, 17], [51, 21], [29, 52]];
          const cords = () => { g.beginPath(); for (const p of pts) { g.moveTo(32, 32); g.lineTo(p[0], p[1]); } };
          rstroke(g, cords, [[OL, 5], ['#c2a172', 2.2]]);
          g.beginPath(); g.arc(32, 32, 4, 0, TAU); fs(g, '#8a6a42', 2.5);
          for (const [x, y] of pts) {
            g.beginPath(); g.arc(x, y, 9, 0, TAU); fs(g, evo ? '#9fd0e8' : '#8d8676');
            g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.arc(x - 3, y - 3, 3, 0, TAU); g.fill();
            g.strokeStyle = '#5a3a22'; g.lineWidth = 2; g.beginPath(); g.arc(x, y, 6, .3, 2.2); g.stroke();
          }
        },
        fogon(g, evo) {
          if (evo) glow(g, 'rgba(255,120,40,.55)');
          for (const a of [.35, -.35]) { g.save(); g.translate(32, 53); g.rotate(a); g.beginPath(); g.rect(-21, -4.5, 42, 9); fs(g, '#6b4220', 2.5); g.fillStyle = '#8a5a2c'; g.fillRect(-19, -3, 38, 2); g.restore(); }
          g.beginPath(); g.moveTo(32, 5); g.bezierCurveTo(44, 17, 53, 28, 47, 41); g.quadraticCurveTo(32, 54, 17, 41); g.bezierCurveTo(11, 28, 23, 21, 32, 5); g.closePath();
          fs(g, evo ? '#ff4a2a' : '#f07a22');
          g.fillStyle = evo ? '#ffd25a' : '#ffd23c'; g.beginPath(); g.moveTo(32, 19); g.bezierCurveTo(39, 27, 43, 34, 39, 42); g.quadraticCurveTo(32, 48, 25, 42); g.bezierCurveTo(21, 34, 27, 28, 32, 19); g.fill();
          if (evo) { g.fillStyle = '#fffbe6'; g.beginPath(); g.ellipse(32, 40, 4, 6, 0, 0, TAU); g.fill(); }
        },
        relampago(g, evo) {
          if (evo) {
            glow(g, 'rgba(120,170,255,.55)');
            const cl = () => { g.beginPath(); g.arc(20, 17, 9, 0, TAU); g.arc(33, 12, 11, 0, TAU); g.arc(46, 17, 9, 0, TAU); g.rect(20, 14, 26, 12); };
            g.strokeStyle = OL; g.lineWidth = 5; cl(); g.stroke(); g.fillStyle = '#4a5670'; cl(); g.fill();
            g.save(); g.translate(4, 12); g.scale(.86, .86);
          }
          g.beginPath(); g.moveTo(37, 5); g.lineTo(19, 34); g.lineTo(31, 34); g.lineTo(24, 59); g.lineTo(47, 25); g.lineTo(35, 25); g.lineTo(43, 5); g.closePath();
          fs(g, evo ? '#dcecff' : '#ffd84a');
          g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(38, 9); g.lineTo(25, 31); g.stroke();
          if (evo) g.restore();
        },
        cruz(g, evo) {
          if (!evo) {
            glow(g, 'rgba(255,220,130,.35)');
            star4(g, 32, 32, 27, 7); fs(g, '#ffe9a8');
            star4(g, 32, 32, 13, 3.5); g.fillStyle = '#fffbe8'; g.fill();
            g.fillStyle = '#ffe9a8'; for (const [x, y] of [[12, 12], [52, 50], [50, 12]]) { g.beginPath(); g.arc(x, y, 2, 0, TAU); g.fill(); }
          } else {
            glow(g, 'rgba(140,190,255,.5)');
            g.strokeStyle = 'rgba(160,200,255,.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(32, 9); g.lineTo(32, 55); g.moveTo(11, 33); g.lineTo(52, 27); g.stroke();
            for (const [x, y, R] of [[32, 9, 9], [32, 55, 10], [11, 33, 7], [52, 27, 8], [43, 42, 5]]) { star4(g, x, y, R, R * .3); fs(g, '#dcecff', 2); }
          }
        },
        corazon(g) {
          g.beginPath(); g.moveTo(32, 55); g.bezierCurveTo(9, 40, 5, 24, 15, 15); g.bezierCurveTo(23, 8, 32, 14, 32, 21); g.bezierCurveTo(32, 14, 41, 8, 49, 15); g.bezierCurveTo(59, 24, 55, 40, 32, 55); g.closePath();
          fs(g, '#d0303a');
          g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.ellipse(21, 23, 5, 3.5, -.6, 0, TAU); g.fill();
        },
        mate(g) {
          const bomb = () => { g.beginPath(); g.moveTo(35, 22); g.lineTo(47, 4); };
          rstroke(g, bomb, [[OL, 6], ['#d8dde6', 3.2]]);
          g.beginPath(); g.ellipse(30, 39, 17, 18, 0, 0, TAU); fs(g, '#7a4a26');
          g.beginPath(); g.ellipse(30, 22, 13, 4.5, 0, 0, TAU); fs(g, '#c9a45c', 2.5);
          g.fillStyle = '#6f9a3a'; g.beginPath(); g.ellipse(30, 22, 10, 2.8, 0, 0, TAU); g.fill();
          rstroke(g, bomb, [['#d8dde6', 3.2]]);
          g.strokeStyle = '#c9a45c'; g.lineWidth = 2; g.beginPath(); g.ellipse(30, 40, 16, 5, 0, .1, Math.PI - .1); g.stroke();
          g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.ellipse(21, 34, 3.5, 7, .3, 0, TAU); g.fill();
        },
        ojo(g) {
          g.strokeStyle = OL; g.lineWidth = 3; g.beginPath();
          for (const [x1, y1, x2, y2] of [[20, 18, 16, 9], [32, 14, 32, 5], [44, 18, 48, 9]]) { g.moveTo(x1, y1); g.lineTo(x2, y2); }
          g.stroke();
          g.beginPath(); g.moveTo(5, 34); g.quadraticCurveTo(32, 8, 59, 34); g.quadraticCurveTo(32, 58, 5, 34); g.closePath(); fs(g, '#f1ead6');
          g.beginPath(); g.arc(32, 34, 11, 0, TAU); fs(g, '#c98a2a', 2.5);
          g.fillStyle = OL; g.beginPath(); g.arc(32, 34, 5, 0, TAU); g.fill();
          g.fillStyle = '#fff'; g.beginPath(); g.arc(28, 30, 2.5, 0, TAU); g.fill();
        },
        poncho(g) {
          const body = () => { g.beginPath(); g.moveTo(21, 9); g.lineTo(43, 9); g.lineTo(59, 50); g.lineTo(5, 50); g.closePath(); };
          body(); fs(g, '#b8322f');
          g.save(); body(); g.clip();
          g.fillStyle = '#ece6d2'; g.fillRect(0, 34, 64, 5); g.fillStyle = '#1c140e'; g.fillRect(0, 41, 64, 3); g.fillStyle = '#c9a45c'; g.fillRect(0, 24, 64, 2);
          g.restore(); body(); g.strokeStyle = OL; g.lineWidth = 3; g.stroke();
          g.fillStyle = OL; g.beginPath(); g.ellipse(32, 11, 6, 3, 0, 0, TAU); g.fill();
          g.strokeStyle = '#8a2420'; g.lineWidth = 2; g.beginPath(); for (let x = 9; x <= 55; x += 5) { g.moveTo(x, 51); g.lineTo(x, 57); } g.stroke();
        },
        luna(g) {
          g.fillStyle = OL; g.beginPath(); g.arc(32, 32, 24, 0, TAU); g.fill();
          g.fillStyle = '#ece6c8'; g.beginPath(); g.arc(32, 32, 21.5, 0, TAU); g.fill();
          g.fillStyle = '#cfc7a4'; for (const [x, y, r] of [[18, 30, 3.5], [24, 45, 4], [15, 40, 2]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }
          g.globalCompositeOperation = 'destination-out'; g.beginPath(); g.arc(44, 24, 18, 0, TAU); g.fill();
          g.globalCompositeOperation = 'source-over';
          g.save(); g.beginPath(); g.arc(32, 32, 23, 0, TAU); g.clip(); g.strokeStyle = OL; g.lineWidth = 3; g.beginPath(); g.arc(44, 24, 18, 0, TAU); g.stroke(); g.restore();
        },
        espuela(g) {
          const band = () => { g.beginPath(); g.arc(22, 30, 15, 1.1, 5.2); };
          rstroke(g, band, [[OL, 9], ['#a9adb6', 5]]);
          const sh = () => { g.beginPath(); g.moveTo(35, 33); g.lineTo(42, 36); };
          rstroke(g, sh, [[OL, 8], ['#a9adb6', 4]]);
          g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, rr = i % 2 ? 5.5 : 15; g.lineTo(44 + Math.cos(a) * rr, 37 + Math.sin(a) * rr); } g.closePath();
          fs(g, '#d4d8e0', 2.5);
          g.beginPath(); g.arc(44, 37, 4, 0, TAU); fs(g, '#c9a45c', 2);
        },
        iman(g) {
          const hs = () => { g.beginPath(); g.moveTo(16, 54); g.lineTo(16, 30); g.arc(32, 30, 16, Math.PI, 0); g.lineTo(48, 54); };
          g.lineCap = 'butt';
          rstroke(g, hs, [[OL, 17], ['#d0303a', 11]]);
          g.strokeStyle = '#dcdcdc'; g.lineWidth = 11; g.beginPath(); g.moveTo(16, 53); g.lineTo(16, 44); g.moveTo(48, 53); g.lineTo(48, 44); g.stroke();
          g.strokeStyle = 'rgba(255,150,150,.8)'; g.lineWidth = 2; g.beginPath(); g.arc(32, 30, 19, Math.PI + .4, -.4); g.stroke();
          g.lineCap = 'round'; g.strokeStyle = '#ffd84a'; g.lineWidth = 2;
          g.beginPath(); g.moveTo(8, 60); g.lineTo(4, 63); g.moveTo(56, 60); g.lineTo(60, 63); g.moveTo(32, 56); g.lineTo(32, 61); g.stroke();
        },
        yerba(g) {
          const stem = () => { g.beginPath(); g.moveTo(30, 60); g.quadraticCurveTo(30, 44, 34, 30); };
          rstroke(g, stem, [[OL, 5], ['#557a2c', 2.5]]);
          const leaf = (x, y, a, len, col) => {
            g.save(); g.translate(x, y); g.rotate(a);
            g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(len * .5, -len * .38, len, 0); g.quadraticCurveTo(len * .5, len * .38, 0, 0); g.closePath(); fs(g, col, 2.5);
            g.strokeStyle = 'rgba(220,240,180,.7)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(2, 0); g.lineTo(len * .85, 0); g.stroke(); g.restore();
          };
          leaf(31, 46, -2.4, 22, '#557a2c'); leaf(33, 40, -.5, 24, '#6f9a3a'); leaf(34, 30, -1.5, 26, '#8fb35a');
        },
        tientos(g) {
          const coils = [[30, 24, 19, 11, -.15], [31, 30, 17, 10, -.1], [32, 36, 15, 9, -.05]];
          const braid = (pts) => {
            g.strokeStyle = '#5a3a22'; g.lineWidth = 1.6; g.beginPath();
            for (let i = 0; i < pts.length - 1; i++) { const [x, y] = pts[i], [nx, ny] = pts[i + 1], dx = nx - x, dy = ny - y, l = Math.hypot(dx, dy) || 1, px = -dy / l * 2.6, py = dx / l * 2.6; g.moveTo(x - px - dx * .3, y - py - dy * .3); g.lineTo(x + px + dx * .3, y + py + dy * .3); }
            g.stroke();
          };
          const ell = (c) => { const pts = []; for (let a = 0; a <= TAU + .01; a += TAU / 26) pts.push([c[0] + Math.cos(a) * c[2] * Math.cos(c[4]) - Math.sin(a) * c[3] * Math.sin(c[4]), c[1] + Math.cos(a) * c[2] * Math.sin(c[4]) + Math.sin(a) * c[3] * Math.cos(c[4])]); return pts; };
          const tailPts = []; for (let t = 0; t <= 1.001; t += 1 / 8) { tailPts.push([44 + t * 12 + Math.sin(t * 6) * 2, 40 + t * 20]); }
          const path = pts => () => { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (const q of pts) g.lineTo(q[0], q[1]); };
          for (const c of coils) { const pts = ell(c); rstroke(g, path(pts), [[OL, 8], ['#b07a45', 5]]); braid(pts); }
          rstroke(g, path(tailPts), [[OL, 7], ['#b07a45', 4]]); braid(tailPts);
          g.beginPath(); g.arc(44, 40, 4, 0, TAU); fs(g, '#c9a45c', 2);
        },
        caldo(g) {
          g.strokeStyle = 'rgba(236,230,210,.85)'; g.lineWidth = 3;
          for (const x of [22, 32, 42]) { g.beginPath(); g.moveTo(x, 26); g.bezierCurveTo(x - 5, 20, x + 5, 15, x, 8); g.stroke(); }
          g.beginPath(); g.moveTo(8, 33); g.lineTo(56, 33); g.quadraticCurveTo(54, 57, 32, 57); g.quadraticCurveTo(10, 57, 8, 33); g.closePath(); fs(g, '#b0643a');
          g.fillStyle = '#e0a040'; g.beginPath(); g.ellipse(32, 33, 22, 4.5, 0, 0, TAU); g.fill();
          g.strokeStyle = '#ece6d2'; g.lineWidth = 2; g.beginPath(); g.moveTo(14, 42); g.quadraticCurveTo(32, 48, 50, 42); g.stroke();
        },
        trabuco(g, evo) {
          if (evo) glow(g, 'rgba(255,170,60,.55)');
          g.save(); g.translate(30, 36); g.rotate(-.5);
          g.beginPath(); g.moveTo(-27, 4); g.lineTo(-7, -3); g.lineTo(-5, 5); g.lineTo(-23, 14); g.closePath(); fs(g, '#6b4220', 2.5);
          g.beginPath(); g.moveTo(-8, -4); g.lineTo(17, -4); g.lineTo(27, -10); g.lineTo(27, 8); g.lineTo(17, 3); g.lineTo(-8, 3); g.closePath(); fs(g, evo ? '#e0b75a' : '#8a8f99', 2.5);
          g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(-6, -3, 21, 1.5);
          g.strokeStyle = OL; g.lineWidth = 2; g.beginPath(); g.arc(-9, 7, 3.5, 0, Math.PI); g.stroke();
          if (evo) { star4(g, 36, -1, 10, 3); g.fillStyle = '#ffd25a'; g.fill(); }
          g.restore();
          g.fillStyle = evo ? '#ffcf6a' : '#c8ccd4';
          for (const [x, y] of [[55, 12], [58, 21], [51, 5]]) { g.beginPath(); g.arc(x, y, 2.6, 0, TAU); g.fill(); }
        },
        guitarra(g, evo) {
          if (evo) glow(g, 'rgba(200,120,255,.5)');
          g.save(); g.translate(25, 41); g.rotate(-.75);
          g.beginPath(); g.rect(10, -3, 30, 6); fs(g, '#3a2616', 2.5);
          g.beginPath(); g.rect(38, -5, 9, 10); fs(g, '#3a2616', 2.5);
          const body = () => { g.beginPath(); g.ellipse(-12, 0, 13, 12.5, 0, 0, TAU); g.ellipse(4, 0, 10, 9.5, 0, 0, TAU); };
          g.strokeStyle = OL; g.lineWidth = 5; body(); g.stroke(); g.fillStyle = evo ? '#b86ad9' : '#c98a4a'; body(); g.fill();
          g.fillStyle = OL; g.beginPath(); g.arc(-2, 0, 4.2, 0, TAU); g.fill();
          g.fillStyle = '#3a2616'; g.fillRect(-18, -4, 3, 8);
          g.strokeStyle = '#ece6d2'; g.lineWidth = .8; g.beginPath(); for (const y of [-1.8, 0, 1.8]) { g.moveTo(-17, y); g.lineTo(44, y); } g.stroke();
          g.restore();
          g.fillStyle = '#ece6d2'; g.strokeStyle = '#ece6d2'; g.lineWidth = 2;
          g.beginPath(); g.ellipse(50, 20, 3.5, 2.6, -.4, 0, TAU); g.fill(); g.beginPath(); g.moveTo(53, 19); g.lineTo(53, 8); g.lineTo(57, 10); g.stroke();
        },
        pava(g, evo) {
          if (evo) glow(g, 'rgba(180,90,255,.55)');
          g.strokeStyle = 'rgba(236,230,210,.85)'; g.lineWidth = 2.5;
          for (const x of [56, 61]) { g.beginPath(); g.moveTo(x, 22); g.bezierCurveTo(x - 4, 17, x + 3, 12, x - 1, 6); g.stroke(); }
          const hd = () => { g.beginPath(); g.arc(30, 28, 13, Math.PI * 1.05, -Math.PI * .05); };
          rstroke(g, hd, [[OL, 6], ['#a9adb6', 3]]);
          const col = evo ? '#6a3fa0' : '#8a8f99';
          g.beginPath(); g.moveTo(44, 38); g.lineTo(58, 25); g.lineTo(59, 30); g.lineTo(46, 46); g.closePath(); fs(g, col, 2.5);
          g.beginPath(); g.moveTo(12, 52); g.quadraticCurveTo(8, 30, 30, 29); g.quadraticCurveTo(52, 30, 48, 52); g.closePath(); fs(g, col);
          g.beginPath(); g.ellipse(30, 30, 9, 3, 0, 0, TAU); fs(g, evo ? '#8a5fc0' : '#b0b5be', 2);
          g.beginPath(); g.arc(30, 26, 2.8, 0, TAU); fs(g, '#3a2616', 2);
          g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(20, 40, 3, 7, .2, 0, TAU); g.fill();
        },
        lanza(g, evo) {
          if (evo) glow(g, 'rgba(255,220,130,.5)');
          const one = (x, y, a, sc) => {
            g.save(); g.translate(x, y); g.rotate(a); g.scale(sc, sc);
            g.beginPath(); g.rect(-27, -2, 42, 4); fs(g, '#8a5a2c', 2);
            g.beginPath(); g.moveTo(14, -6); g.lineTo(31, 0); g.lineTo(14, 6); g.closePath(); fs(g, evo ? '#ffe9a8' : '#dfe6ee', 2.5);
            g.fillStyle = '#c23a4a'; g.beginPath(); g.moveTo(11, -2); g.lineTo(3, -10); g.lineTo(7, -2); g.closePath(); g.fill();
            g.restore();
          };
          if (evo) { one(24, 42, -1.15, .82); one(30, 40, -.8, .82); one(36, 42, -.45, .82); }
          else one(31, 34, -Math.PI / 4, 1);
        },
        oro(g) {
          g.beginPath(); g.arc(32, 32, 22, 0, TAU); fs(g, '#e0b75a');
          g.strokeStyle = '#a8842e'; g.lineWidth = 3; g.beginPath(); g.arc(32, 32, 15, 0, TAU); g.stroke();
          g.fillStyle = '#fff3c4'; g.beginPath(); g.ellipse(23, 23, 5, 3, -.6, 0, TAU); g.fill();
          star4(g, 32, 32, 9, 3); g.fillStyle = '#a8842e'; g.fill();
        },
        cofre(g) {
          g.beginPath(); g.rect(9, 30, 46, 26); fs(g, '#6b4220');
          g.beginPath(); g.moveTo(9, 31); g.lineTo(9, 22); g.quadraticCurveTo(32, 6, 55, 22); g.lineTo(55, 31); g.closePath(); fs(g, '#8a5a2c');
          g.fillStyle = '#e0b75a'; g.fillRect(15, 20, 5, 36); g.fillRect(44, 20, 5, 36); g.fillRect(9, 29, 46, 4);
          g.beginPath(); g.rect(27, 26, 10, 12); fs(g, '#e0b75a', 2.5); g.fillStyle = OL; g.fillRect(31, 31, 2, 4);
          g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(12, 34, 40, 3);
        },
        cofreAbierto(g) {
          const gl = g.createRadialGradient(32, 28, 2, 32, 28, 30); gl.addColorStop(0, 'rgba(255,230,140,.95)'); gl.addColorStop(1, 'rgba(255,230,140,0)');
          g.fillStyle = gl; g.fillRect(0, 0, 64, 60);
          g.beginPath(); g.moveTo(12, 20); g.lineTo(16, 4); g.lineTo(48, 4); g.lineTo(52, 20); g.closePath(); fs(g, '#5a3818');
          g.fillStyle = '#3a2410'; g.fillRect(18, 8, 28, 9);
          g.beginPath(); g.rect(9, 30, 46, 26); fs(g, '#6b4220');
          g.fillStyle = '#ffe9a8'; g.beginPath(); g.ellipse(32, 30, 22, 5, 0, 0, TAU); g.fill();
          g.fillStyle = '#e0b75a'; g.fillRect(15, 30, 5, 26); g.fillRect(44, 30, 5, 26);
          g.fillStyle = '#fff8dc'; for (const [x, y] of [[22, 24], [40, 20], [31, 14]]) { star4(g, x, y, 5, 1.5); g.fill(); }
        },
        asado(g) {
          const bone = () => { g.beginPath(); g.moveTo(34, 30); g.lineTo(50, 13); };
          rstroke(g, bone, [[OL, 10], ['#efe6d0', 6]]);
          for (const [x, y] of [[49, 9], [54, 14]]) { g.beginPath(); g.arc(x, y, 4.5, 0, TAU); fs(g, '#efe6d0', 2.5); }
          g.beginPath(); g.ellipse(25, 39, 18, 13, -.65, 0, TAU); fs(g, '#8a3d1c');
          g.strokeStyle = '#4f200d'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(14, 40); g.lineTo(28, 28); g.moveTo(19, 47); g.lineTo(33, 35); g.stroke();
          g.fillStyle = 'rgba(230,140,80,.6)'; g.beginPath(); g.ellipse(20, 33, 5, 2.5, -.65, 0, TAU); g.fill();
        }
      };
      function iconURL(id, evo) {
        const key = id + (evo ? '*' : '');
        if (ICONS[key]) return ICONS[key];
        const c = document.createElement('canvas'); c.width = c.height = 128;
        const g = c.getContext('2d'); g.scale(2, 2); g.lineJoin = 'round'; g.lineCap = 'round';
        ICON_DRAW[id](g, evo);
        return ICONS[key] = pixelize(c, 32, 32).toDataURL();
      }
      const ico = (id, evo) => `<img class="ico" src="${iconURL(id, evo)}" alt="">`;
      for (const k in WEAPONS) { WEAPONS[k].icon = ico(k, false); WEAPONS[k].evoIcon = ico(k, true); }
      for (const k in PASSIVES) PASSIVES[k].icon = ico(k);
      const ICON_ASADO = ico('asado'), ICON_ORO = ico('oro');
      const SUITCOL = { oro: '#b8862e', espada: '#2f5fa8', copa: '#b8322f', basto: '#3f7a3a' };
      function drawSuit(g, suit, x, y, s) {
        g.save(); g.translate(x, y); g.scale(s, s);
        if (suit === 'oro') { g.translate(-32, -32); ICON_DRAW.oro(g); }
        else if (suit === 'espada') {
          g.beginPath(); g.moveTo(-4, -8); g.lineTo(0, -30); g.lineTo(4, -8); g.closePath(); fs(g, '#9fb6d6', 2.5);
          g.beginPath(); g.rect(-11, -9, 22, 5); fs(g, '#e0b75a', 2.5);
          g.beginPath(); g.rect(-3.5, -4, 7, 16); fs(g, '#b8322f', 2.5);
          g.beginPath(); g.arc(0, 15, 4.5, 0, TAU); fs(g, '#e0b75a', 2.5);
        } else if (suit === 'copa') {
          g.beginPath(); g.moveTo(-16, -22); g.lineTo(16, -22); g.quadraticCurveTo(16, 2, 0, 4); g.quadraticCurveTo(-16, 2, -16, -22); g.closePath(); fs(g, '#e0b75a');
          g.fillStyle = '#b8322f'; g.beginPath(); g.ellipse(0, -21, 15, 4, 0, 0, TAU); g.fill();
          g.beginPath(); g.rect(-3, 3, 6, 14); fs(g, '#e0b75a', 2.5);
          g.beginPath(); g.ellipse(0, 19, 12, 4, 0, 0, TAU); fs(g, '#e0b75a', 2.5);
        } else {
          g.beginPath(); g.moveTo(-6, 22); g.quadraticCurveTo(-10, -4, -6, -26); g.quadraticCurveTo(6, -32, 9, -22); g.quadraticCurveTo(8, 0, 6, 22); g.closePath(); fs(g, '#8a5a2c');
          g.fillStyle = '#5e3a1a'; for (const [a, b] of [[-3, -12], [3, 2], [-2, 12]]) { g.beginPath(); g.ellipse(a, b, 2.5, 1.6, 0, 0, TAU); g.fill(); }
          g.beginPath(); g.ellipse(10, -14, 6, 3, -.6, 0, TAU); fs(g, '#4f8a3a', 2);
        }
        g.restore();
      }
      function spriteURL(k, sil) {
        const key = 'spr_' + k + (sil ? '_s' : ''); if (ICONS[key]) return ICONS[key];
        const src = SPR[k].frames[0].img, c = document.createElement('canvas'); c.width = src.width; c.height = src.height;
        const g = c.getContext('2d'); g.drawImage(src, 0, 0);
        if (sil) { g.globalCompositeOperation = 'source-atop'; g.fillStyle = '#0c1120'; g.fillRect(0, 0, c.width, c.height); }
        return ICONS[key] = c.toDataURL();
      }

