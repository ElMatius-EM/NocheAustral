      /* ---------------- pantalla de título ---------------- */
      const VERSION = 'v1.1';
      // marcos 9-slice en pixel art para paneles y botones (se generan una vez y quedan como variables CSS)
      function nineSlice(n, paint) {
        const c = document.createElement('canvas'); c.width = c.height = n; const g = c.getContext('2d');
        for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const col = paint(x, y, Math.min(x, y, n - 1 - x, n - 1 - y), x <= y ? (x + y < n - 1 ? 'tl' : 'bl') : (x + y < n - 1 ? 'tr' : 'br')); if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); } }
        const o = document.createElement('canvas'); o.width = o.height = n * 3; const og = o.getContext('2d'); og.imageSmoothingEnabled = false; og.drawImage(c, 0, 0, n * 3, n * 3);
        return `url(${o.toDataURL()})`;
      }
      function makeFrames() {
        const R = document.documentElement.style, corner = (x, y, n) => (x === 0 || x === n - 1) && (y === 0 || y === n - 1);
        R.setProperty('--frame', nineSlice(12, (x, y, d, q) => {
          if (corner(x, y, 12)) return null;
          const lit = q === 'tl' || (q === 'tr' && y < x && y <= d) || (q === 'bl' && x <= d && x < y);
          if (d === 0) return '#0c1120';
          if (d === 1) return lit ? '#8a6238' : '#3e2814';
          if (d === 2) { if ((x === 2 || x === 9) && (y === 2 || y === 9)) return '#f0d080'; return lit ? '#6b4a2a' : '#4e3420'; }
          if (d === 3) return lit ? '#e0c078' : '#9a7a3e';
          return '#1b2233';
        }));
        const btn = (el, ed, fill) => nineSlice(6, (x, y, d, q) => { if (corner(x, y, 6)) return null; if (d === 0) return '#0c1120'; if (d === 1) return (q === 'tl' || (q === 'tr' && y <= 1) || (q === 'bl' && x <= 1)) ? el : ed; return fill; });
        R.setProperty('--pb', btn('#465274', '#161c2c', '#242d42'));
        // variantes translúcidas: el borde queda sólido y el relleno deja ver el mundo
        R.setProperty('--frameT', nineSlice(12, (x, y, d, q) => {
          if (corner(x, y, 12)) return null;
          const lit = q === 'tl' || (q === 'tr' && y < x && y <= d) || (q === 'bl' && x <= d && x < y);
          if (d === 0) return '#0c1120';
          if (d === 1) return lit ? '#8a6238' : '#3e2814';
          if (d === 2) { if ((x === 2 || x === 9) && (y === 2 || y === 9)) return '#f0d080'; return lit ? '#6b4a2a' : '#4e3420'; }
          if (d === 3) return lit ? '#e0c078' : '#9a7a3e';
          return 'rgba(16,22,38,.6)';
        }));
        R.setProperty('--pbT', btn('rgba(120,140,190,.45)', 'rgba(8,12,22,.6)', 'rgba(36,45,66,.38)'));
        R.setProperty('--pbOnT', btn('#f0d890', '#8a6a32', 'rgba(58,66,96,.55)'));
        R.setProperty('--pbOn', btn('#f0d890', '#8a6a32', '#2e3650'));
        R.setProperty('--pbMain', btn('#fff0b8', '#8a6a32', '#c9a45c'));
        R.setProperty('--pbMainOn', btn('#ffffff', '#a07a38', '#e0bc6a'));
        R.setProperty('--cursor', `url(${ITEM.knife0.img.toDataURL()})`);
      }

      // logo: texto con la fuente pixel rasterizado a resolución nativa, sombreado y contorneado con el mismo motor de los sprites
      async function makeLogo() {
        const cv = $('logo'); if (!cv) return;
        try { await document.fonts.load('700 18px "Pixelify Sans"'); } catch (e) { }
        const F = '700 20px "Pixelify Sans","Trebuchet MS",sans-serif', mm = document.createElement('canvas').getContext('2d'); mm.font = F;
        const wN = Math.ceil(mm.measureText('NOCHE').width), wA = Math.ceil(mm.measureText('AUSTRAL').width);
        const xN = 31, xA = 6, Wn = Math.max(xN + wN, xA + wA) + 4, Hn = 52, m = document.createElement('canvas'); m.width = Wn; m.height = Hn;
        const mg = m.getContext('2d'); mg.fillStyle = '#fff'; mg.font = F; mg.textBaseline = 'alphabetic';
        mg.fillText('NOCHE', xN, 23); mg.fillText('AUSTRAL', xA, 46);
        const md = mg.getImageData(0, 0, Wn, Hn).data;
        const b = PixBuf(Wn, 1, 0, Hn);
        // luna en cuarto creciente detrás, a la izquierda
        b.ell(16 - Wn / 2, 15 - Hn / 2, 10, 10, '#ece6d2'); b.ell(21 - Wn / 2, 12 - Hn / 2, 9, 9, null);
        for (let i = 0; i < Wn * Hn; i++) if (b.c[i] === null) b.a[i] = 0;
        b.tex('#ece6d2', (x, y) => hash(x * 3, y * 5) < .12 ? [214, 206, 178] : null);
        for (let y = 0; y < Hn; y++) for (let x = 0; x < Wn; x++) {
          if (md[(y * Wn + x) * 4 + 3] < 128) continue;
          const line = y < 27 ? 0 : 1, ly = line ? y - 32 : y - 9, t = clamp(ly / 14, 0, 1);
          const col = line ? (t < .35 ? '#f3dca0' : t < .7 ? '#e0b75a' : '#b98a3a') : (t < .35 ? '#fffbe8' : t < .7 ? '#ece6d2' : '#cfc7a8');
          b.pp(x, y, col, 0);
        }
        const fin = pixFinish(b), S_ = PX_UP, o = cv.getContext('2d');
        cv.width = Wn * S_; cv.height = (Hn + 3) * S_;
        // sombra paralela de 2 píxeles
        const sh = document.createElement('canvas'); sh.width = fin.flash.width; sh.height = fin.flash.height;
        const sg = sh.getContext('2d'); sg.drawImage(fin.flash, 0, 0); sg.globalCompositeOperation = 'source-atop'; sg.fillStyle = '#070a14'; sg.fillRect(0, 0, sh.width, sh.height);
        o.imageSmoothingEnabled = false; o.drawImage(sh, 0, 2 * S_); o.drawImage(fin.img, 0, 0);
        cv.dataset.nw = Wn; cv.dataset.nh = Hn + 3; sizeLogo();
      }
      function sizeLogo() {
        const cv = $('logo'); if (!cv || !cv.dataset.nw) return;
        const nw = +cv.dataset.nw, nh = +cv.dataset.nh, max = Math.min(window.innerWidth * .9, window.innerWidth >= 900 ? 560 : 440, window.innerHeight * .34 / nh * nw);
        const k = Math.max(1, Math.floor(max / nw * 2) / 2);
        cv.style.width = nw * k + 'px'; cv.style.height = nh * k + 'px';
      }
      window.addEventListener('resize', sizeLogo);

      // escena de fondo: fogón en la estepa, con el último personaje usado, ánimas lejos y ojos en la oscuridad
      const TS = { embers: [], eyes: [] };
      for (let i = 0; i < 9; i++) TS.eyes.push({ a: hash(i, 3) * TAU, d: 210 + hash(i, 7) * 170, ph: hash(i, 11) * 20, col: i % 3 ? '#f2d45c' : '#ff5a3c' });
      function drawTitleScene(dt) {
        const t = demoT, wide = W >= 860, z = ZOOM * (wide ? 1.7 : 1.5);
        const fx = wide ? W * .7 : W * .5, fy = wide ? H * .58 : H * .9;
        const cam = { x: Math.sin(t * .07) * 18, y: Math.cos(t * .05) * 10 };
        cx.save(); cx.translate(fx, fy); cx.scale(z, z); cx.translate(-cam.x, -cam.y);
        drawGround(cam.x, cam.y);
        const rocks = [['roca', -150, -60, 30, 1], ['arbusto', 120, -90, 26, 2], ['roca', 170, 70, 22, 3], ['arbusto', -120, 110, 30, 4], ['roca', -260, 20, 36, 0], ['arbusto', 260, -10, 24, 1]];
        for (const [k, x, y, r, s] of rocks) dimg(obsSprite({ kind: k, r, seed: s }), x, y);
        // ánimas lejanas
        const an = SPR.anima;
        for (let i = 0; i < 3; i++) {
          const x = ((t * 14 + i * 260) % 900) - 450, y = -150 + i * 120 + Math.sin(t * .8 + i) * 10;
          cx.globalAlpha = .45; dimg({ img: an.frames[((t * 9 + i * 3) | 0) % an.frames.length].img, size: an.size }, x, y); cx.globalAlpha = 1;
        }
        // leños y fuego
        cx.fillStyle = 'rgba(0,0,0,.35)'; cx.beginPath(); cx.ellipse(0, 8, 22, 7, 0, 0, TAU); cx.fill();
        const log = (a) => { cx.save(); cx.rotate(a); cx.fillStyle = '#0c1120'; cx.fillRect(-15, -3.5, 30, 7); cx.fillStyle = '#5a3a22'; cx.fillRect(-14, -2.5, 28, 5); cx.fillStyle = '#7a5236'; cx.fillRect(-14, -2.5, 28, 1.5); cx.fillStyle = '#ff9a3c'; cx.fillRect(-3, -2.5, 6, 1.5); cx.restore(); };
        cx.save(); cx.translate(0, 5); log(.35); log(-.35); cx.restore();
        for (let i = 0; i < 3; i++) { const fr = ITEM.flame0, h = 1 + Math.floor((Math.sin(t * 9 + i * 2.1) + 1) * 1.5); dimg(fr[Math.min(3, h)], (i - 1) * 6, 2 - i % 2 * 2, 1.15); }
        if (Math.random() < dt * 9) TS.embers.push({ x: rnd(-6, 6), y: -8, vx: rnd(-8, 8), vy: rnd(-40, -22), l: rnd(1, 2.2), m: 2.2 });
        for (const e of TS.embers) { e.l -= dt; e.x += e.vx * dt + Math.sin(t * 3 + e.y) * .2; e.y += e.vy * dt; }
        TS.embers = TS.embers.filter(e => e.l > 0);
        for (const e of TS.embers) { cx.globalAlpha = clamp(e.l / e.m, 0, 1); cx.fillStyle = e.l > 1 ? '#ffd070' : '#ff7a2a'; cx.fillRect(Math.round(e.x), Math.round(e.y), 1.5, 1.5); }
        cx.globalAlpha = 1;
        // personaje junto al fuego
        const ch = PSPR[SAVE.lastChar && CHARS[SAVE.lastChar] ? SAVE.lastChar : 'baqueano'];
        cx.fillStyle = 'rgba(0,0,0,.3)'; cx.beginPath(); cx.ellipse(-40, 19, 11, 4, 0, 0, TAU); cx.fill();
        dimg({ img: ch.frames[0], size: ch.size }, -40, 6 + Math.sin(t * 1.6) * .6);
        cx.restore();
        // oscuridad con el fuego como única luz
        const fl = 1 + Math.sin(t * 11) * .02 + Math.sin(t * 4.3) * .03, R0 = 70 * z * fl, R1 = Math.max(W, H) * .75;
        const g = cx.createRadialGradient(fx, fy, R0 * .4, fx, fy, R1);
        g.addColorStop(0, 'rgba(255,160,70,.10)'); g.addColorStop(.12, 'rgba(6,9,20,.05)'); g.addColorStop(.45, 'rgba(6,9,20,.62)'); g.addColorStop(1, 'rgba(4,6,14,.9)');
        cx.fillStyle = g; cx.fillRect(0, 0, W, H);
        // ojos en la oscuridad
        for (const e of TS.eyes) {
          const blink = ((t + e.ph) % 6) < .15, vis = ((t * .3 + e.ph) % 9) < 6; if (blink || !vis) continue;
          const ex = fx + Math.cos(e.a) * e.d * z * .6, ey = fy + Math.sin(e.a) * e.d * z * .42; if (ey < 0 || ey > H) continue;
          cx.fillStyle = e.col; const s = Math.max(2, Math.round(z * 1.3)); cx.fillRect(ex - s * 2, ey, s, s); cx.fillRect(ex + s, ey, s, s);
        }
        // más oscuro detrás del menú para que se lea
        if (wide) { const lg = cx.createLinearGradient(0, 0, W * .55, 0); lg.addColorStop(0, 'rgba(6,9,20,.75)'); lg.addColorStop(1, 'rgba(6,9,20,0)'); cx.fillStyle = lg; cx.fillRect(0, 0, W * .55, H); }
        else { const lg = cx.createLinearGradient(0, 0, 0, H * .72); lg.addColorStop(0, 'rgba(6,9,20,.55)'); lg.addColorStop(1, 'rgba(6,9,20,0)'); cx.fillStyle = lg; cx.fillRect(0, 0, W, H * .72); }
      }

      // reserva el alto del texto más largo posible, así el panel no cambia de tamaño al cambiar la selección
      const RSV = new Map();
      function reserveText(el, key, variants, html) {
        if (!el || !el.offsetWidth) return;
        const ck = key + '|' + el.offsetWidth; let h = RSV.get(ck);
        if (h === undefined) {
          const keep = html ? el.innerHTML : el.textContent; el.style.minHeight = ''; h = 0;
          for (const v of variants) { if (html) el.innerHTML = v; else el.textContent = v; h = Math.max(h, el.offsetHeight); }
          if (html) el.innerHTML = keep; else el.textContent = keep; RSV.set(ck, h);
        }
        el.style.minHeight = h + 'px';
      }
      window.addEventListener('resize', () => RSV.clear());
      // selector de personaje con vista previa grande
      let pvChar = null;
      function charPreview(k) {
        pvChar = k; const c = CHARS[k], ok = unlocked(c.lock), w = WEAPONS[c.weapon];
        $('cpName').textContent = c.name;
        $('cpWeapon').innerHTML = `${w.icon} ${w.name}`;
        $('cpPerk').textContent = ok ? `${c.perk}. ${CHAR_BIO[k] || ''}` : lockTxt(c.lock);
        $('cpGo').disabled = !ok;
        const ks = Object.keys(CHARS);
        reserveText($('cpPerk'), 'perk', ks.map(q => `${CHARS[q].perk}. ${CHAR_BIO[q] || ''}`).concat(ks.map(q => lockTxt(CHARS[q].lock))));
        reserveText($('cpWeapon'), 'weap', ks.map(q => `${WEAPONS[CHARS[q].weapon].icon} ${WEAPONS[CHARS[q].weapon].name}`), true);
        document.querySelectorAll('#chars .char').forEach(b => b.classList.toggle('sel', b.dataset.c === k));
      }
      const CHAR_BIO = {
        baqueano: 'Conoce cada senda de la estepa y no se deja alcanzar.',
        cuchillero: 'Tira el facón antes de que lo vean venir.',
        pialadora: 'Con las boleadoras no se le escapa nada que corra.',
        fueguera: 'Donde ella se para, la noche retrocede.',
        tormentera: 'Dicen que el viento del oeste le hace caso.',
        rastreadora: 'Lee el campo como un libro y nunca se pierde.',
        payador: 'Cada acorde suyo empuja a las ánimas lejos.'
      };
      const PBOX = {};
      function drawCharPreview() {
        const c = $('cpv'); if (!c || !pvChar || !$('vChars').classList.contains('on')) return;
        const d = fitCanvas(c), g = c.getContext('2d'), P = PSPR[pvChar], ok = unlocked(CHARS[pvChar].lock);
        g.clearRect(0, 0, c.width, c.height);
        if (!PBOX[pvChar]) { const bs = P.frames.map(f => spriteBox(f, 3)); const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h)); PBOX[pvChar] = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; for (const f of P.frames) { let m = GAL_BOX.get(f); if (!m) { m = {}; GAL_BOX.set(f, m); } m.u = PBOX[pvChar]; } }
        const bx = PBOX[pvChar], k = Math.max(1, Math.floor(Math.min(c.width * .8 / bx.w, c.height * .82 / bx.h)));
        g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(c.width / 2, c.height / 2 + bx.h * k / 2 - k, bx.w * k * .42, k * 2.2, 0, 0, TAU); g.fill();
        if (!ok) g.filter = 'brightness(0) opacity(.55)';
        galBlit(g, P.frames[1 + ((demoT * 8.9) | 0) % 4], 0, 0, c.width, c.height, false, 'u');
        g.filter = 'none';
      }

      function renderCredits() { }
      function menuTick() { if (AC) sfx(880, .03, 'square', .02); }
      function menuOk() { if (AC) sfx(660, .06, 'triangle', .04); }
      makeFrames(); makeLogo();
      (function extrasIcons() {
        const set = (id, src) => { const e = $(id); if (e) e.src = src; };
        set('exAch', ITEM.cofre.img.toDataURL()); set('exBest', SPR.lobizon.frames[0].img.toDataURL());
        set('exGal', cardURL('anchoEspadas')); set('exCred', iconURL('mate'));
      })();
      $('verTxt').textContent = VERSION;
      // modo prueba: tocar la versión 7 veces seguidas carga oro, materiales y fama al máximo, y desbloquea todos los logros y trofeos
      (() => {
        const el = $('verTxt'); let n = 0, tm = 0;
        el.style.pointerEvents = 'auto'; el.style.padding = '8px 10px'; el.style.margin = '-8px -10px'; el.style.cursor = 'default'; el.style.touchAction = 'manipulation';
        el.addEventListener('click', ev => {
          ev.stopPropagation(); clearTimeout(tm); tm = setTimeout(() => { n = 0; }, 2000);
          if (++n < 7) return; n = 0;
          SAVE.gold = 999999; SAVE.mat = { cuero: 9999, hueso: 9999, hierro: 9999 }; SAVE.fama = 9999; SAVE.dev = true;
          // todos los logros (sin sumar su oro) y todos los trofeos; la herradura sale del logro Domador
          for (const a of ACH) SAVE.ach[a.id] = true;
          for (const t of TROFEOS) if (t.id !== 'herradura') SAVE.trophies[t.id] = 1;
          SAVE.stats.rides = Math.max(SAVE.stats.rides || 0, 5);
          devHorse(); writeSave(); renderGold();
          initAudio(); sfx(660, .08, 'triangle', .05); setTimeout(() => sfx(990, .12, 'triangle', .05), 70);
          banner('Modo prueba activado');
        });
      })();

      $('chars').addEventListener('focusin', ev => { const c = ev.target.closest('.char'); if (c) { charPreview(c.dataset.c); } });
      $('chars').addEventListener('mouseover', ev => { const c = ev.target.closest('.char'); if (c && c.dataset.c !== pvChar) charPreview(c.dataset.c); });
      go('vMain');

