      /* ---------------- luz nocturna ---------------- */
      function glowSpr(col) {
        glowSpr.c = glowSpr.c || {}; if (glowSpr.c[col]) return glowSpr.c[col];
        const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64), C = rgb(col).map(v => v | 0).join(',');
        gr.addColorStop(0, `rgba(${C},1)`); gr.addColorStop(.35, `rgba(${C},.8)`); gr.addColorStop(.72, `rgba(${C},.25)`); gr.addColorStop(1, `rgba(${C},0)`);
        g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return glowSpr.c[col] = c;
      }
      function mixA(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
      // oscuridad según la hora: anochece, noche cerrada, amanece a los 15 min; en la noche eterna vuelve rojiza
      function nightState() {
        if (!S || SAVE.opts.dark === false) return null;
        const t = S.t, ice = !!MAP().ice; let a = (ice ? .46 : .55) * (S.hyper ? 1.15 : 1), col = [6, 9, 26];
        if (t < 45) a *= .5 + .5 * t / 45;
        else if (t > 720 && t <= 900) { const k = (t - 720) / 180; a *= 1 - .8 * k; col = k < .5 ? mixA([6, 9, 26], [42, 18, 56], k * 2) : mixA([42, 18, 56], [74, 40, 16], (k - .5) * 2); }
        else if (t > 900) { const k = clamp((t - 900) / 45, 0, 1); a *= .2 + .9 * k; col = mixA([74, 40, 16], [32, 4, 10], k); }
        if (S.whiteFlash > 0) a *= 1 - Math.min(.85, S.whiteFlash * 2);
        return { a, col };
      }
      let LIT = null, LX = null;
      function drawLighting(sx, sy, n) {
        if (!n || n.a < .02) return false;
        const lw = Math.max(2, Math.round(W / 4)), lh = Math.max(2, Math.round(H / 4));
        if (!LIT || LIT.width !== lw || LIT.height !== lh) { LIT = document.createElement('canvas'); LIT.width = lw; LIT.height = lh; LX = LIT.getContext('2d'); }
        const g = LX, k = lw / W, P = S.player, z = ZOOM * k, ox = (W / 2 + sx) * k - P.x * z, oy = (H / 2 + sy) * k - P.y * z, C = n.col.map(v => v | 0);
        g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, lw, lh);
        g.fillStyle = `rgba(${C[0]},${C[1]},${C[2]},${n.a})`; g.fillRect(0, 0, lw, lh);
        if (vignette) g.drawImage(vignette, 0, 0, lw, lh);
        // sombras de nubes que tapan la luna
        const cs = glowSpr('#03050d');
        for (let i = 0; i < (GFX_LOW ? 0 : 4); i++) {
          const span = 2600, wx = ((i * 730 + S.t * 15 - P.x) % span + span) % span - span / 2 + P.x, wy = ((i * -910 + S.t * 5 - P.y) % span + span) % span - span / 2 + P.y, R = (380 + i * 90) * z;
          g.globalAlpha = .3; g.drawImage(cs, ox + wx * z - R, oy + wy * z - R * .7, R * 2, R * 1.4);
        }
        g.globalCompositeOperation = 'destination-out';
        const LS = LSPR(), L = (x, y, r, i) => { const R = r * z, X = ox + x * z, Y = oy + y * z; if (X < -R || Y < -R || X > lw + R || Y > lh + R) return 0; g.globalAlpha = Math.min(1, i); g.drawImage(LS, X - R, Y - R, R * 2, R * 2); return 1; };
        const vr = Math.max(W, H) / ZOOM;
        L(P.x, P.y, vr * .5, .9); L(P.x, P.y, vr * .2, .85);
        const warm = [];
        for (const w of S.weapons) if (w.id === 'fogon' && w.R) { L(P.x, P.y, w.R * 1.7, .9); warm.push([P.x, P.y, w.R * 1.5, .5]); }
        for (const zn of S.zones) if (zn.fire) { L(zn.x, zn.y, zn.R * 2.4, .6 * clamp(zn.life / zn.max * 2, 0, 1)); }
        for (const e of S.enemies) if (e.prop && !e.dead) { L(e.x, e.y, 130, .95); warm.push([e.x, e.y, 90, .6]); }
        forAnimitas(P.x, P.y, vr * .6, a => { const l = aniLeft(a); if (l > 0) { L(a.x, a.y + 8, 120 * (.4 + .6 * l), .9); warm.push([a.x, a.y + 8, 70 * (.4 + .6 * l), .55]); } });
        for (const f of S.fx) if (f.type === 'bolt') L(f.x, f.y, (f.R || 120) * 2.2, f.life / f.max);
        if (S.mode === 'campo') { L(CAMPO_HOME.x + 26, CAMPO_HOME.y - 30, 150, .9); warm.push([CAMPO_HOME.x + 26, CAMPO_HOME.y - 30, 70, .5]); forCampoNodes(P.x, P.y, vr * .6, n => { L(n.x, n.y, 46, .4); }); }
        // luces chicas con tope fijo por frame: el costo no crece aunque se dupliquen enemigos o disparos
        if (!GFX_LOW) {
          let c2 = 0; for (const b of S.ebul) { c2 += L(b.x, b.y, 24, .55); if (c2 >= 50) break; }
          c2 = 0; for (const p of S.proj) { c2 += L(p.x, p.y, 26, .4); if (c2 >= 40) break; }
          c2 = 0; for (const gm of S.gems) { c2 += L(gm.x, gm.y, 20, .35); if (c2 >= 30) break; }
          c2 = 0; for (const pk of S.picks) { c2 += L(pk.x, pk.y, 44, .5); if (c2 >= 12) break; }
          c2 = 0; for (const p of S.parts) { if (p.glow) { c2 += L(p.x, p.y, p.size * 5, .45 * p.life / p.max); if (c2 >= 20) break; } }
        }
        // resplandor cálido del fuego y los faroles, pintado en la misma capa (sin pasada extra a pantalla completa)
        g.globalCompositeOperation = 'source-over';
        const wk = clamp(n.a / .5, 0, 1), ws = glowSpr('#ff9a3c');
        if (warm.length > 8) warm.length = 8;
        for (const [x, y, r, i] of warm) { const R = r * z, X = ox + x * z, Y = oy + y * z; if (X < -R || Y < -R || X > lw + R || Y > lh + R) continue; g.globalAlpha = i * .3 * wk * (.92 + .08 * Math.sin(S.t * 9 + x)); g.drawImage(ws, X - R, Y - R, R * 2, R * 2); }
        g.globalAlpha = 1;
        cx.drawImage(LIT, 0, 0, W, H);
        return true;
      }
      function LSPR() { return glowSpr('#ffffff'); }

      // dibuja un enemigo con su animación
      function blitEnemy(e, sp, sz, bob) {
        const T = ETYPES[e.type];
        if (sp.frames.length > 1 && T.fly) {
          const fr = sp.frames[((S.t * 9 + e.wob * 4) | 0) % sp.frames.length];
          cx.save(); cx.translate(e.x, e.y + bob); cx.rotate(clamp((e.mvx || 0) / 140, -1, 1) * .28);
          cx.globalAlpha = .9; cx.drawImage(e.flash > 0 ? fr.flash : fr.img, -sz / 2, -sz / 2, sz, sz); cx.globalAlpha = 1; cx.restore();
        } else if (sp.frames.length > 1) {
          const fz = S.freezeT > 0, fr = sp.frames[fz ? 0 : ((S.t * 8 + e.wob * 3) | 0) % sp.frames.length], sq = fz ? 0 : Math.sin(S.t * 16 + e.wob) * .02, fl = (e.mvx || 0) < -5 ? -1 : 1;
          cx.save(); cx.translate(e.x, e.y); cx.scale(fl * (1 - sq), 1 + sq); cx.drawImage(e.flash > 0 ? fr.flash : fr.img, -sz / 2, -sz / 2, sz, sz); cx.restore();
        } else cx.drawImage(e.flash > 0 ? sp.flash : sp.img, e.x - sz / 2, e.y - sz / 2 + bob, sz, sz);
      }
      // capa sobre la oscuridad: números de daño y textos flotantes
      function drawOverlay(sx, sy) {
        const P = S.player;
        cx.save(); cx.translate(W / 2 + sx, H / 2 + sy); cx.scale(ZOOM, ZOOM); cx.translate(-P.x, -P.y);
        drawTexts();
        cx.restore();
      }

      /* cielo: aurora austral en el glaciar, estrellas fugaces en la estepa */
      function drawSky(n) {
        if (!n || GFX_LOW) return; const k = clamp(n.a / .44, 0, 1); if (k < .05) return;
        const P = S.player, t = reduceMotion ? 0 : S.t;
        cx.globalCompositeOperation = 'lighter';
        if (MAP().ice) {
          const hTop = H * .45;
          for (const [c, al, ph] of [['80,255,170', .11, 0], ['90,200,255', .07, 2.1], ['200,110,255', .045, 4.2]]) {
            const gr = cx.createLinearGradient(0, 0, 0, hTop); gr.addColorStop(0, `rgba(${c},0)`); gr.addColorStop(.45, `rgba(${c},${al * k})`); gr.addColorStop(1, `rgba(${c},0)`); cx.fillStyle = gr;
            for (let x = 0; x < W; x += 4) {
              const u = (x + P.x * ZOOM * .12) / W, y0 = hTop * (.1 + .16 * Math.sin(u * 5 + t * .22 + ph) + .07 * Math.sin(u * 13 - t * .37 + ph)), hh = hTop * (.5 + .2 * Math.sin(u * 7 + t * .3 + ph * 2));
              cx.globalAlpha = .55 + .45 * Math.sin(u * 38 + t * 1.2 + ph); cx.fillRect(x, y0, 4, hh);
            }
          }
        } else if (S.star) {
          const s = S.star, a = s.life / s.max, L = .09;
          const gr = cx.createLinearGradient(s.x, s.y, s.x - s.vx * L, s.y - s.vy * L); gr.addColorStop(0, `rgba(255,250,230,${.9 * a * k})`); gr.addColorStop(1, 'rgba(255,250,230,0)');
          cx.strokeStyle = gr; cx.lineWidth = 2; cx.beginPath(); cx.moveTo(s.x, s.y); cx.lineTo(s.x - s.vx * L, s.y - s.vy * L); cx.stroke();
        }
        cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
      }

