      /* ---------------- galería de sprites ---------------- */
      const GAL = { tab: 'chars', sel: 0, play: true, flash: false, grid: false, bg: 0, t: 0, timer: 0, items: [] };
      const GAL_BG = [['noche', '#141b2d'], ['estepa', '#1c2621'], ['glaciar', '#1b2633'], ['claro', '#e8e2cf']];
      const GAL_TABS = [['chars', 'Personajes'], ['enemies', 'Enemigos'], ['weapons', 'Armas'], ['passives', 'Pasivas'], ['cards', 'Cartas'], ['items', 'Objetos']];
      const GAL_PROJ = { facon: 'knife', lanza: 'spear', cruz: 'cross', trabuco: 'pellet', pava: 'pava', boleadoras: 'bol', fogon: 'flame' };
      const urlImg = u => { const i = new Image(); i.onload = () => { if (GAL.timer) galDrawTiles(); }; i.src = u; return i; };
      const sprFrames = s => Array.isArray(s) ? s.map(x => x.img) : [s.img];
      function galItems(tab) {
        if (tab === 'chars') return Object.keys(CHARS).map(k => {
          const c = CHARS[k];
          return {
            name: c.name, sub: `Arma inicial: ${WEAPONS[c.weapon].name}. ${c.perk}.`, desc: unlocked(c.lock) ? '' : 'Se desbloquea con: ' + achById(c.lock).name + '.',
            parts: [{ label: 'Quieto', frames: [PSPR[k].frames[0]] }, { label: 'Caminando', frames: PSPR[k].frames.slice(1) }, { label: 'Dash', frames: [PSPR[k].sil] }]
          };
        });
        if (tab === 'enemies') return Object.keys(ETYPES).map(k => {
          const T = ETYPES[k], L = LORE[k], sp = SPR[k];
          return {
            name: T.name, sub: L ? L.where : 'Objeto del mapa', desc: L ? L.desc : 'Farol de campo. Rompelo para que suelte oro, asado, imán, bomba o helada.',
            parts: [{ label: sp.frames.length > 1 ? `${sp.frames.length} frames` : '', frames: sp.frames.map(f => f.img), flash: sp.frames.map(f => f.flash) }]
          };
        });
        if (tab === 'weapons') return Object.keys(WEAPONS).map(k => {
          const d = WEAPONS[k], pj = GAL_PROJ[k], parts = [{ label: 'Normal', frames: [urlImg(iconURL(k))] }, { label: 'Evolución', frames: [urlImg(iconURL(k, true))] }];
          if (pj) { parts.push({ label: 'Proyectil', frames: sprFrames(ITEM[pj + '0']) }); parts.push({ label: 'Evolucionado', frames: sprFrames(ITEM[pj + '1']) }); }
          return { name: d.name, sub: `Evoluciona con ${PASSIVES[d.evoWith].name} en ${d.evoName}.`, desc: `${d.desc} ${d.evoDesc}`, parts };
        });
        if (tab === 'passives') return Object.keys(PASSIVES).map(k => {
          const p = PASSIVES[k], wk = Object.keys(WEAPONS).find(w => WEAPONS[w].evoWith === k);
          return { name: p.name, sub: wk ? `Hace evolucionar: ${WEAPONS[wk].name}.` : '', desc: p.desc, parts: [{ label: '', frames: [urlImg(iconURL(k))] }] };
        });
        if (tab === 'cards') return Object.keys(ARCANAS).map(k => { const a = ARCANAS[k]; return { name: a.name, sub: 'Carta de truco', desc: a.desc, parts: [{ label: '', frames: [urlImg(cardURL(k))] }] }; });
        const obs = kind => ({ label: '', frames: [0, 1, 2, 3, 4].map(v => obsSprite({ kind, r: 36, seed: v }).img) });
        return [
          { name: 'Cofre', sub: 'Lo sueltan élites y jefes', desc: 'Evoluciona un arma si está lista; si no, da mejoras.', parts: [{ label: '', frames: [ITEM.cofre.img] }] },
          { name: 'Asado', sub: 'Curación', desc: 'Recupera 30 de vida.', parts: [{ label: '', frames: [ITEM.asado.img] }] },
          { name: 'Moneda y bolsa', sub: 'Oro', desc: 'Se guarda para el Almacén.', parts: [{ label: 'Moneda', frames: ITEM.oro.map(s => s.img) }, { label: 'Bolsa', frames: [ITEM.bolsa.img] }] },
          {
            name: 'Bomba, helada e imán', sub: 'Sale de los faroles', desc: 'La bomba limpia la pantalla, la helada congela a los enemigos y el imán junta toda la experiencia.',
            parts: [{ label: 'Bomba', frames: ITEM.bomba.map(s => s.img) }, { label: 'Helada', frames: [ITEM.helada.img] }, { label: 'Imán', frames: [ITEM.iman.img] }]
          },
          {
            name: 'Gemas de experiencia', sub: 'Por valor', desc: 'Celeste, verde y roja según cuánta experiencia dan.',
            parts: [['#6fd3e0', 'Chica'], ['#8fe07a', 'Mediana'], ['#ff5a6a', 'Grande']].map(([c, l]) => ({ label: l, frames: [gemSprite(c, 7.5).img] }))
          },
          {
            name: 'Balas enemigas', sub: 'Bruja, basilisco y Caleuche', desc: 'Las comunes se pueden cortar con el rebenque, las boleadoras, las ondas y el fogón evolucionado. Las de halo rojo vienen de élites y jefes: solo las borra la bomba.',
            parts: [['#e2b6ff', 'rgba(197,108,240,.35)', 'Bruja'], ['#c8f59a', 'rgba(140,220,90,.35)', 'Basilisco'], ['#bff0ff', 'rgba(120,220,255,.35)', 'Caleuche'], ['#c8f59a', HARD_GLOW, 'Élite']].map(([c, g, l]) => ({ label: l, frames: [bulletSprite(c, g).img] }))
          },
          { name: 'Roca', sub: 'Estepa', desc: 'Cinco variantes.', parts: [obs('roca')] },
          { name: 'Arbusto de calafate', sub: 'Estepa', desc: 'Cinco variantes.', parts: [obs('arbusto')] },
          { name: 'Bloque de hielo', sub: 'Glaciar', desc: 'Cinco variantes.', parts: [obs('hielo')] },
          { name: 'Serac', sub: 'Glaciar', desc: 'Cinco variantes.', parts: [obs('seraque')] }
        ];
      }
      const natW = i => (i.naturalWidth || i.width) / PX_UP, natH = i => (i.naturalHeight || i.height) / PX_UP;
      const imgReady = i => !(i instanceof HTMLImageElement) || (i.complete && i.naturalWidth > 0);
      // recorte al contenido visible (en píxeles nativos), cacheado por imagen y umbral de alfa
      const GAL_BOX = new WeakMap();
      function spriteBox(img, thr) {
        let m = GAL_BOX.get(img); if (!m) { m = {}; GAL_BOX.set(img, m); } if (m[thr]) return m[thr];
        const nw = Math.round(natW(img)), nh = Math.round(natH(img)), t = document.createElement('canvas'); t.width = nw; t.height = nh;
        const tg = t.getContext('2d'); tg.imageSmoothingEnabled = false; tg.drawImage(img, 0, 0, nw, nh);
        const d = tg.getImageData(0, 0, nw, nh).data; let x0 = nw, y0 = nh, x1 = -1, y1 = -1;
        for (let y = 0; y < nh; y++) for (let x = 0; x < nw; x++) if (d[(y * nw + x) * 4 + 3] > thr) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
        if (x1 < 0) { x0 = 0; y0 = 0; x1 = nw - 1; y1 = nh - 1; }
        return m[thr] = { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
      }
      // dibuja un sprite recortado, con escala entera, centrado en (x,y,w,h)
      function galBlit(g, img, x, y, w, h, grid, thr) {
        if (!imgReady(img)) return 0;
        const bx = spriteBox(img, thr === undefined ? 20 : thr), k = Math.max(1, Math.floor(Math.min(w / bx.w, h / bx.h)));
        const dx = Math.round(x + (w - bx.w * k) / 2), dy = Math.round(y + (h - bx.h * k) / 2);
        g.imageSmoothingEnabled = false; g.drawImage(img, bx.x * PX_UP, bx.y * PX_UP, bx.w * PX_UP, bx.h * PX_UP, dx, dy, bx.w * k, bx.h * k);
        if (grid && k >= 5) { g.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i <= bx.w; i++) g.fillRect(dx + i * k, dy, 1, bx.h * k); for (let j = 0; j <= bx.h; j++) g.fillRect(dx, dy + j * k, bx.w * k, 1); }
        return k;
      }
      function fitCanvas(c) { const r = c.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2), w = Math.max(1, Math.round(r.width * d)), h = Math.max(1, Math.round(r.height * d)); if (c.width !== w || c.height !== h) { c.width = w; c.height = h; } return d; }
      function galDrawStage() {
        const it = GAL.items[GAL.sel], c = $('gcv'); if (!it || !c) return;
        const d = fitCanvas(c), g = c.getContext('2d'), W_ = c.width, H_ = c.height, light = GAL.bg === 3;
        g.fillStyle = GAL_BG[GAL.bg][1]; g.fillRect(0, 0, W_, H_);
        const n = it.parts.length, cw = W_ / n, lab = it.parts.some(p => p.label), lh = lab ? 22 * d : 0, pad = 10 * d;
        it.parts.forEach((p, i) => {
          const fi = GAL.play ? Math.floor(GAL.t * 8) % p.frames.length : 0, img = (GAL.flash && p.flash ? p.flash : p.frames)[fi];
          if (!p.box && p.frames.every(imgReady)) {
            const bs = p.frames.map(f => spriteBox(f, 3)); const x0 = Math.min(...bs.map(b => b.x)), y0 = Math.min(...bs.map(b => b.y)), x1 = Math.max(...bs.map(b => b.x + b.w)), y1 = Math.max(...bs.map(b => b.y + b.h));
            p.box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 }; for (const f of [...p.frames, ...(p.flash || [])]) { let m = GAL_BOX.get(f); if (!m) { m = {}; GAL_BOX.set(f, m); } m.u = p.box; }
          }
          galBlit(g, img, i * cw + pad, pad, cw - pad * 2, H_ - pad * 2 - lh, GAL.grid, p.box ? 'u' : 3);
          if (p.label) { g.font = `500 ${13 * d}px ${FONT}`; g.textAlign = 'center'; g.fillStyle = light ? '#3a3428' : '#a9a594'; g.fillText(p.label, i * cw + cw / 2, H_ - 8 * d); }
        });
      }
      function galDrawTiles() {
        document.querySelectorAll('#ggrid .gtile canvas').forEach((c, i) => {
          const it = GAL.items[i]; if (!it) return; const d = fitCanvas(c), g = c.getContext('2d');
          g.clearRect(0, 0, c.width, c.height); galBlit(g, it.parts[0].frames[0], 3 * d, 3 * d, c.width - 6 * d, c.height - 6 * d, false, 3);
        });
      }
      function galSelect(i) {
        GAL.sel = i; const it = GAL.items[i]; if (!it) return;
        $('gName').textContent = it.name; $('gSub').textContent = it.sub; $('gDesc').textContent = it.desc;
        document.querySelectorAll('#ggrid .gtile').forEach((b, j) => b.classList.toggle('sel', j === i));
        galDrawStage();
      }
      function galTab(tab) {
        GAL.tab = tab; GAL.items = galItems(tab);
        $('gtabs').innerHTML = GAL_TABS.map(([k, l]) => `<button class="btn gtab${k === tab ? ' on' : ''}" data-gt="${k}">${l}</button>`).join('');
        $('ggrid').innerHTML = GAL.items.map((it, i) => `<button class="gtile" data-gi="${i}"><canvas></canvas><span>${it.name}</span></button>`).join('');
        galSelect(0); requestAnimationFrame(galDrawTiles);
      }
      function galOpts() {
        $('gPlay').textContent = GAL.play ? 'Pausar' : 'Animar';
        $('gFlash').classList.toggle('on', GAL.flash); $('gGrid').classList.toggle('on', GAL.grid);
        $('gBg').textContent = 'Fondo: ' + GAL_BG[GAL.bg][0];
      }
      function renderGal() {
        galTab(GAL.tab); galOpts();
        if (!GAL.timer) { let last = performance.now(); GAL.timer = setInterval(() => { const now = performance.now(); if (GAL.play) GAL.t += (now - last) / 1000; last = now; galDrawStage(); }, 1000 / 15); }
      }
      function stopGal() { if (GAL.timer) { clearInterval(GAL.timer); GAL.timer = 0; } }
      $('vGal').addEventListener('click', ev => {
        const t = ev.target.closest('[data-gt]'); if (t) { galTab(t.dataset.gt); const f = $('gtabs').querySelector('.on'); if (f) f.focus({ preventScroll: true }); return; }
        const ti = ev.target.closest('[data-gi]'); if (ti) { galSelect(+ti.dataset.gi); if (window.innerWidth < 700) $('gcv').scrollIntoView({ block: 'nearest', behavior: 'smooth' }); return; }
        if (ev.target.closest('#gPlay')) { GAL.play = !GAL.play; galOpts(); }
        else if (ev.target.closest('#gFlash')) { GAL.flash = !GAL.flash; galOpts(); galDrawStage(); }
        else if (ev.target.closest('#gGrid')) { GAL.grid = !GAL.grid; galOpts(); galDrawStage(); }
        else if (ev.target.closest('#gBg')) { GAL.bg = (GAL.bg + 1) % GAL_BG.length; galOpts(); galDrawStage(); }
      });
      $('vGal').addEventListener('focusin', ev => { const ti = ev.target.closest && ev.target.closest('[data-gi]'); if (ti) galSelect(+ti.dataset.gi); });
      window.addEventListener('resize', () => { if (GAL.timer) { galDrawStage(); galDrawTiles(); } });


