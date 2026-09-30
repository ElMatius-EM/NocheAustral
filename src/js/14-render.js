      /* ---------------- render ---------------- */
      function hash(x, y) { let h = (x * 374761393 + y * 668265263) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
      function drawGround(px, py) {
        const T = 96, hw = W / 2 / ZOOM + T, hh = H / 2 / ZOOM + T;
        const tx0 = Math.floor((px - hw) / T), tx1 = Math.floor((px + hw) / T), ty0 = Math.floor((py - hh) / T), ty1 = Math.floor((py + hh) / T);
        const ice = MAP().decor === 'ice', D = decorSpr(), V = vivoSpr();
        if (S) drawTerrain(px, py);
        for (let tx = tx0; tx <= tx1; tx++) for (let ty = ty0; ty <= ty1; ty++) {
          for (let k = 0; k < 3; k++) {
            const h1 = hash(tx * 3 + k, ty * 7 - k), h2 = hash(tx * 5 - k, ty * 3 + k * 11), h3 = hash(tx + k * 17, ty - k * 5);
            const x = tx * T + h1 * T, y = ty * T + h2 * T;
            if (S && terrWet(x, y)) {
              if (ice) { if (h3 < .25) dimg(V.drift, x, y); }
              else if (h3 < .5) swayDraw(V.reed[(h2 * 2) | 0], x + 3, y - 4, h1, 1.3);
              else if (h3 < .62) { cx.globalAlpha = .2 + .5 * Math.max(0, Math.sin(S.t * 2.2 + h1 * 40)); dimg(V.glint, x, y); cx.globalAlpha = 1; }
              continue;
            }
            if (h3 < .6) { if (ice) { if (h3 < .3) dimg(D.crack[k & 1], x + 8, y + 3); } else swayDraw(D.tuft[(h2 * 3) | 0], x + 3, y - 3, h1, 1); }
            else if (h3 < .85) dimg(D.stone[Math.min(2, (h1 * 3) | 0)], x, y);
            else if (h3 < .97) dimg(ice ? D.patch : D.flower, x, y + 2);
            else { if (ice) cx.globalAlpha = .5; dimg(D.bone, x, y + 1); cx.globalAlpha = 1; }
          }
        }
      }
      function drawObstacle(o) { dimg(obsSprite(o), o.x, o.y); }
      function drawWeather(dt) {
        const w = S.weather, k = w.k || 0, vent = w.type === 'ventisca', st = S.streaks, want = vent ? 170 : 70;
        while (st.length < want) st.push({ x: Math.random() * W, y: Math.random() * H, l: rnd(12, 42), v: rnd(.7, 1.3) });
        if (vent) { const g = cx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .14, W / 2, H / 2, Math.max(W, H) * .62); g.addColorStop(0, 'rgba(205,222,240,0)'); g.addColorStop(1, `rgba(205,222,240,${.88 * k})`); cx.fillStyle = g; cx.fillRect(0, 0, W, H); }
        const sp = vent ? 520 : 720, mv = S.state === 'play' ? dt : 0;
        cx.strokeStyle = vent ? `rgba(248,252,255,${.85 * k})` : `rgba(225,212,178,${.4 * k})`; cx.lineWidth = vent ? 2.6 : 1.5; cx.lineCap = 'round'; cx.beginPath();
        for (const p of st) {
          p.x += w.dx * sp * p.v * mv; p.y += w.dy * sp * p.v * mv + (vent ? 45 * mv : 0);
          if (p.x < -60) p.x += W + 120; else if (p.x > W + 60) p.x -= W + 120;
          if (p.y < -60) p.y += H + 120; else if (p.y > H + 60) p.y -= H + 120;
          const L = vent ? 3 : p.l; cx.moveTo(p.x, p.y); cx.lineTo(p.x - w.dx * L, p.y - w.dy * L);
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
        if (S.mode === 'campo') drawCampo(vis, hw, hh);

        for (const z of S.zones) {
          if (!vis(z.x, z.y)) continue;
          const a = clamp(z.life / .4, 0, 1) * clamp((z.max - z.life) / .15, 0, 1);
          const gr = cx.createRadialGradient(z.x, z.y, z.R * .1, z.x, z.y, z.R);
          gr.addColorStop(0, z.fire ? 'rgba(255,150,50,.6)' : z.pull ? 'rgba(150,90,230,.55)' : 'rgba(170,215,255,.45)'); gr.addColorStop(1, z.fire ? 'rgba(255,90,30,.05)' : z.pull ? 'rgba(110,60,200,.08)' : 'rgba(120,180,240,.08)');
          cx.globalAlpha = a; cx.fillStyle = gr; cx.beginPath(); cx.ellipse(z.x, z.y, z.R, z.R * .8, 0, 0, TAU); cx.fill();
          cx.fillStyle = z.fire ? 'rgba(255,220,120,.85)' : 'rgba(235,245,255,.7)';
          for (let i = 0; i < 6; i++) { const ph = S.t * 3 + i * 1.7 + z.x, bx = z.x + Math.cos(i * 2.4 + z.y) * z.R * .55, by = z.y + Math.sin(i * 1.9 + z.x) * z.R * .42; cx.beginPath(); cx.arc(bx, by, 1.2 + (Math.sin(ph) + 1) * 1.4, 0, TAU); cx.fill(); }
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

        drawMounts();
        cx.fillStyle = 'rgba(0,0,0,.25)'; cx.beginPath();
        for (const e of S.enemies) { if (ETYPES[e.type].fly || !vis(e.x, e.y)) continue; cx.moveTo(e.x + e.r, e.y + e.r * .9); cx.ellipse(e.x, e.y + e.r * .9, e.r, e.r * .35, 0, 0, TAU); }
        cx.fill();
        for (const e of S.enemies) {
          if (!vis(e.x, e.y)) continue;
          const sp = SPR[e.type], sz = sp.size * (e.r / ETYPES[e.type].r);
          cx.imageSmoothingEnabled = !e.elite;
          const bob = ETYPES[e.type].fly ? Math.sin(S.t * 6 + e.wob) * 2 : 0;
          if (e.aimT > 0) {
            const k = 1 - e.aimT / .55, col = ETYPES[e.type].shotCol || '#e2b6ff';
            cx.globalAlpha = .35 + .5 * k; cx.strokeStyle = col; cx.lineWidth = 2.5;
            cx.beginPath(); cx.arc(e.x, e.y, e.r + 14 * (1 - k) + 3, 0, TAU); cx.stroke();
            cx.fillStyle = col; cx.beginPath(); cx.arc(e.x, e.y - e.r - 6, 2 + k * 3, 0, TAU); cx.fill();
            cx.globalAlpha = 1;
          }
          if (e.phase === 'aim') { const a = Math.atan2(e.cdy, e.cdx); cx.save(); cx.translate(e.x, e.y); cx.rotate(a); cx.globalAlpha = .25 + .25 * Math.sin(S.t * 30); cx.fillStyle = '#ff3c3c'; cx.fillRect(0, -e.r * .8, e.dashLen || (560 * .55 + e.r), e.r * 1.6); cx.globalAlpha = 1; cx.restore(); }
          if (e.elite) { cx.strokeStyle = e.type === 'mandinga' ? 'rgba(255,60,60,.7)' : 'rgba(224,183,90,.75)'; cx.lineWidth = 2; cx.beginPath(); cx.arc(e.x, e.y, e.r + 5 + Math.sin(S.t * 6) * 1.5, 0, TAU); cx.stroke(); }
          blitEnemy(e, sp, sz, bob);
          if (S.freezeT > 0 && e.type !== 'mandinga' && !e.prop) { cx.fillStyle = 'rgba(160,220,255,.4)'; cx.beginPath(); cx.arc(e.x, e.y, e.r * 1.05, 0, TAU); cx.fill(); }
          if (e.elite && e.type !== 'mandinga') {
            const bw = Math.min(e.r * 2, 90), f = clamp(e.hp / e.maxHp, 0, 1);
            cx.fillStyle = '#0c1120'; cx.fillRect(e.x - bw / 2 - 1, e.y - e.r - 12, bw + 2, 5);
            cx.fillStyle = '#e0b75a'; cx.fillRect(e.x - bw / 2, e.y - e.r - 11, bw * f, 3);
          }
        }

        cx.imageSmoothingEnabled = true;
        for (const b of S.ebul) {
          if (!vis(b.x, b.y)) continue;
          dimg(bulletSprite(b.col, b.glow), b.x, b.y, b.r / 8);
        }

        for (const p of S.proj) {
          if (!vis(p.x, p.y)) continue;
          cx.save(); cx.translate(p.x, p.y);
          if (p.kind === 'knife') {
            cx.rotate(p.rot); const s = p.r / 6;
            const tg = cx.createLinearGradient(-8 * s, 0, -38 * s, 0); tg.addColorStop(0, p.w.evo ? 'rgba(170,210,255,.7)' : 'rgba(255,255,255,.55)'); tg.addColorStop(1, 'rgba(255,255,255,0)');
            cx.strokeStyle = tg; cx.lineWidth = 3.2 * s; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(-8 * s, 0); cx.lineTo(-38 * s, 0); cx.stroke(); cx.lineCap = 'butt';
            dimg(ITEM['knife' + (p.w.evo ? 1 : 0)], 0, 0, s);
            if (Math.sin(S.t * 40 + p.x * .05) > .6) { cx.fillStyle = '#fff'; cx.fillRect(8 * s, -.75, 3, 1.5); cx.fillRect(9 * s, -2, 1.5, 4); }
          } else if (p.kind === 'pellet') {
            const v = Math.hypot(p.vx, p.vy) || 1;
            cx.strokeStyle = p.w.evo ? 'rgba(255,190,90,.5)' : 'rgba(236,230,210,.35)'; cx.lineWidth = p.r * .9; cx.lineCap = 'round';
            cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-p.vx / v * 12, -p.vy / v * 12); cx.stroke(); cx.lineCap = 'butt';
            dimg(ITEM['pellet' + (p.w.evo ? 1 : 0)], 0, 0, p.r / 4.5);
          } else if (p.kind === 'spear') {
            cx.rotate(p.rot); const s = p.r / 9;
            dimg(ITEM['spear' + (p.w.evo ? 1 : 0)][Math.sin(S.t * 30) > 0 ? 1 : 0], 0, 0, s);
          } else if (p.kind === 'spit') {
            const v = Math.hypot(p.vx, p.vy) || 1;
            cx.strokeStyle = 'rgba(220,235,200,.35)'; cx.lineWidth = p.r; cx.lineCap = 'round'; cx.beginPath(); cx.moveTo(0, 0); cx.lineTo(-p.vx / v * 16, -p.vy / v * 16); cx.stroke(); cx.lineCap = 'butt';
            cx.fillStyle = OL; cx.beginPath(); cx.arc(0, 0, p.r * .7 + 1.5, 0, TAU); cx.fill();
            cx.fillStyle = '#e6f0d0'; cx.beginPath(); cx.arc(0, 0, p.r * .7, 0, TAU); cx.fill();
            cx.fillStyle = '#ffffff'; cx.beginPath(); cx.arc(-p.r * .2, -p.r * .2, p.r * .25, 0, TAU); cx.fill();
          } else {
            cx.rotate(p.rot); const R = p.r;
            const pu = 1 + Math.sin(S.t * 18 + p.x * .03) * .08;
            dimg(ITEM['cross' + (p.w.evo ? 1 : 0)], 0, 0, R / 11 * pu);
          }
          cx.restore();
        }

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
          const a = f.life / f.max;
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
            cx.save();
            if (f.etype === 'anima') {
              cx.translate(f.x, f.y - k * 34); cx.rotate(f.tilt + f.rot); cx.scale(1 - k * .45, 1 + k * .9);
              cx.globalAlpha = a * .9; cx.drawImage(k < .12 ? fr.flash : fr.img, -sz / 2, -sz / 2, sz, sz);
            } else {
              cx.translate(f.x, f.y + k * sz * .2); cx.rotate(f.rot); cx.scale(1 + k * .35, 1 - k * .75);
              cx.globalAlpha = a; cx.drawImage(k < .35 ? fr.flash : fr.img, -sz / 2, -sz / 2, sz, sz);
            }
            cx.restore(); cx.globalAlpha = 1;
          } else if (f.type === 'ring') {
            cx.globalAlpha = a; cx.strokeStyle = f.col; cx.lineWidth = 3; cx.beginPath(); cx.arc(f.x, f.y, f.R * (1 - a) + 8, 0, TAU); cx.stroke(); cx.globalAlpha = 1;
          }
        }

        for (const p of S.parts) {
          const a = clamp(p.life / p.max, 0, 1); cx.globalAlpha = a; cx.fillStyle = p.col;
          if (p.glow) { cx.beginPath(); cx.arc(p.x, p.y, p.size * (.6 + a * .4), 0, TAU); cx.fill(); cx.globalAlpha = a * .25; cx.beginPath(); cx.arc(p.x, p.y, p.size * 2.2, 0, TAU); cx.fill(); }
          else cx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
        }
        cx.globalAlpha = 1;

      }
      function drawTexts() {
        cx.font = `600 13px ${FONT}`; cx.textAlign = 'center'; cx.lineWidth = 3; cx.strokeStyle = 'rgba(0,0,0,.75)';
        const fN = `600 13px ${FONT}`, fB = `700 19px ${FONT}`, FNUM = [fN, `700 16px ${FONT}`, fB, `700 24px ${FONT}`];
        for (const t of S.texts) {
          cx.globalAlpha = clamp(t.life / .3, 0, 1);
          if (t.tier !== undefined) cx.font = FNUM[Math.min(3, t.tier + (t.pop > 0 ? 1 : 0))]; else if (t.big) cx.font = fB;
          cx.strokeText(t.txt, t.x, t.y); cx.fillStyle = t.col; cx.fillText(t.txt, t.x, t.y);
          if (t.tier !== undefined || t.big) cx.font = fN;
        }
        cx.globalAlpha = 1;
      }
      let demoT = 0;
      function render(dt) {
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
        drawMarks(); drawAnimitas(); drawCrits(false);
        if (S) drawWorld();
        drawCrits(true);
        cx.restore();
        const NS = nightState(), lit = drawLighting(sx, sy, NS); drawOverlay(sx, sy); drawSky(NS);
        if (S && S.weather) drawWeather(dt);
        if (!lit) cx.drawImage(vignette, 0, 0, W, H);
        if (!S) return;
        if (S.freezeT > 0) { cx.fillStyle = 'rgba(120,190,255,.10)'; cx.fillRect(0, 0, W, H); }
        if (S.whiteFlash > 0) { cx.fillStyle = `rgba(255,250,235,${Math.min(.6, S.whiteFlash * 1.6)})`; cx.fillRect(0, 0, W, H); }
        if (S.hurtFlash > 0) { cx.fillStyle = `rgba(194,58,74,${S.hurtFlash * .9})`; cx.fillRect(0, 0, W, H); }
        const br = S.bossRef;
        if (br && !br.dead && br.elite && br.type !== 'mandinga') {
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

