      /* ---------------- paneles ---------------- */
      function openPuPanel(k) {
        PU.ui = k; PU.sel = PU.sel || 'b1'; show('puOv'); renderPuPanel();
      }
      function closePuPanel() {
        if (!PU) return; if (PU.forge && PU.forge.timer) cancelAnimationFrame(PU.forge.timer); cancelAnimationFrame(PU.nireRAF);
        PU.forge = null; PU.ui = null; hide('puOv'); puHudUpdate(); PU.near = null; PU.nearK = null;
      }
      function renderPuPanel() {
        const k = PU.ui, el = $('puPanel');
        if (k === 'nire') el.innerHTML = nireHTML();
        else if (k === 'rancho') el.innerHTML = ranchoHTML();
        else if (k === 'fragua') el.innerHTML = fraguaHTML();
        else if (k === 'corral') el.innerHTML = corralHTML();
        else if (k === 'fogon') el.innerHTML = fogonHTML();
        else if (k === 'tranquera') el.innerHTML = tranqueraHTML();
        if (k === 'nire') {
          drawNire();
          const ids = Object.keys(NIRE);
          reserveText(el.querySelector('.ninfo strong'), 'nn', ids.map(i => NIRE[i].name));
          reserveText(el.querySelector('.ninfo p'), 'nd', ids.map(i => NIRE[i].desc));
          reserveText(el.querySelector('.nst'), 'ns', ['Aprendido', 'Bloqueado: elegiste la otra punta de la rama', 'Primero aprendé el nudo anterior', 'Te falta fama']);
        }
        puHudUpdate();
        const f = el.querySelector('button:not([disabled])'); if (f && k !== 'nire') f.focus({ preventScroll: true });
      }
      const obraCard = (id) => {
        const O = OBRAS[id], lv = SAVE.puesto[id], nx = O.lv[lv + 1];
        if (!nx) return `<div class="card done"><span class="ct"><strong>${O.lv[lv].name}</strong><small>Nivel máximo.</small></span></div>`;
        const ok = canPay(nx.cost);
        return `<button class="card${ok ? '' : ' poor'}" data-obra="${id}"><span class="ct"><strong>${lv === 0 ? 'Construir' : 'Mejorar a'}: ${nx.name}</strong><small>${nx.desc}</small><span class="costs">${costHTML(nx.cost)}</span></span></button>`;
      };
      function ranchoHTML() {
        const lv = SAVE.puesto.rancho;
        return `<h2>${OBRAS.rancho.lv[lv].name}</h2><p class="sub">Las obras cambian el puesto y dan ventajas en cada partida.</p>
  <div class="cards">${obraCard('rancho')}</div>
  <h3 class="subh">Trofeos</h3><div class="troph">${TROFEOS.map(tr => { const h = hasTrophy(tr.id); return `<div class="card${h ? ' done' : ' locked'}"><span class="ct"><strong>${h ? '✓ ' + tr.name : '???'}</strong><small>${h ? 'Colgado en la ' + (lv >= 2 ? 'tabla del rancho' : 'estaca de la carpa') : tr.how}</small></span></div>`; }).join('')}</div>
  <div class="btns"><button class="btn" data-pu-close>Volver<kbd>Esc</kbd></button></div>`;
      }
      function fraguaHTML() {
        const lv = SAVE.puesto.fragua;
        if (lv < 1) return `<h2>Fragua</h2><p class="sub">Un montón de ladrillos esperando. Con la fragua forjás facones propios que te acompañan en cada partida.</p><div class="cards">${obraCard('fragua')}</div><div class="btns"><button class="btn" data-pu-close>Volver<kbd>Esc</kbd></button></div>`;
        const F = PU.forgeSel = PU.forgeSel || { hoja: 'criolla', cabo: 'hueso', name: '' };
        const part = (set, key, cur) => Object.entries(set).map(([id, p]) => { const lock = p.lvl > lv; return `<button class="card${cur === id ? ' sel' : ''}${lock ? ' locked' : ''}" data-part="${key}:${id}" ${lock ? 'disabled' : ''}><span class="ct"><strong>${p.name}</strong><small>${lock ? 'Necesita la fragua completa' : p.desc}</small><span class="costs">${costHTML(p.cost)}</span></span></button>`; }).join('');
        const cost = Object.assign({}, HOJAS[F.hoja].cost); for (const [k, v] of Object.entries(CABOS[F.cabo].cost)) cost[k] = (cost[k] || 0) + v;
        const full = SAVE.knives.length >= MAX_KNIVES, ok = canPay(cost) && !full;
        return `<h2>Fragua</h2><p class="sub">Elegí hoja y cabo, martillá tres veces y el facón queda en el puesto. El que equipes te da su efecto en cada partida.</p>
  <div class="forge"><div><h3 class="subh">Hoja</h3><div class="cards">${part(HOJAS, 'hoja', F.hoja)}</div><h3 class="subh">Cabo</h3><div class="cards">${part(CABOS, 'cabo', F.cabo)}</div></div>
  <div class="fprev"><canvas id="kprev" width="128" height="64"></canvas><input id="kname" maxlength="18" placeholder="Nombre del facón" value="${F.name.replace(/"/g, '')}">
  <div class="costs big">${costHTML(cost)}</div>
  <div id="fgame" class="fgame"><canvas id="fbar" width="220" height="26"></canvas><small id="fmsg">${full ? 'Tenés el máximo de facones: fundí uno para hacer lugar.' : 'Martillá cuando la marca pase por el centro.'}</small></div>
  <button class="btn main" id="forgeGo" ${ok ? '' : 'disabled'}>Forjar<kbd>Enter</kbd></button></div></div>
  ${lv < 2 ? `<div class="cards" style="margin-top:8px">${obraCard('fragua')}</div>` : ''}
  <h3 class="subh">Tus facones</h3><div class="cards">${SAVE.knives.length ? SAVE.knives.map((kn, i) => `<div class="card${SAVE.knife === i ? ' sel' : ''}"><img class="kimg" src="${knifeURL(kn)}" alt=""><span class="ct"><strong>${kn.name}</strong><small>Calidad ${QUAL[kn.q].name}: ${knifeDesc(kn)}</small></span><span class="kbtns"><button class="btn" data-kequip="${i}">${SAVE.knife === i ? 'Guardar' : 'Equipar'}</button><button class="btn" data-kmelt="${i}">Fundir</button></span></div>`).join('') : '<p class="sub">Todavía no forjaste ninguno.</p>'}</div>
  <div class="btns"><button class="btn" data-pu-close>Volver<kbd>Esc</kbd></button></div>`;
      }
      function corralHTML() {
        const lv = SAVE.puesto.corral;
        if (lv < 1) return `<h2>Corral</h2><p class="sub">Unos palos tirados. Con el corral te quedás con los caballos que amansás y podés llamar a uno con un silbido en cada partida.</p><div class="cards">${obraCard('corral')}</div><div class="btns"><button class="btn" data-pu-close>Volver<kbd>Esc</kbd></button></div>`;
        const cards = SAVE.horses.map((h, i) => {
          const img = animSpr('caballo', false, h.pelaje).frames[0].img.toDataURL(), mx = h.lvl >= 5, c = trainCost(h.lvl);
          return `<div class="card${SAVE.horse === i ? ' sel' : ''}"><img class="himg" src="${img}" alt=""><span class="ct"><strong>${horseName(h)} <span>Nv ${h.lvl}</span></strong><small>${RASGOS[h.rasgo].desc}. Entrenamiento: +${h.lvl - 1} s de monta, +${(h.lvl - 1) * 3}% de velocidad.</small>${mx ? '' : `<span class="costs">${costHTML(c)}</span>`}</span>
    <span class="kbtns"><button class="btn" data-hfav="${i}">${SAVE.horse === i ? 'Es tu caballo' : 'Elegir'}</button>${mx ? '' : `<button class="btn" data-htrain="${i}" ${canPay(c) ? '' : 'disabled'}>Entrenar</button>`}<button class="btn" data-hfree="${i}">Soltar</button></span></div>`;
        }).join('');
        return `<h2>${OBRAS.corral.lv[lv].name}</h2><p class="sub">${SAVE.horses.length}/${corralCap()} lugares. Los caballos que amanses se quedan si aguantás al menos 5 minutos. En la partida, <kbd>H</kbd> silba a tu caballo una vez.</p>
  <div class="cards">${cards || '<p class="sub">Todavía no hay caballos. Amansá uno en la Estepa.</p>'}</div>
  ${lv < 2 ? `<div class="cards" style="margin-top:8px">${obraCard('corral')}</div>` : ''}
  <div class="btns"><button class="btn" data-pu-close>Volver<kbd>Esc</kbd></button></div>`;
      }
      function fogonHTML() {
        const lv = SAVE.puesto.fogon, id0 = SAVE.comida, cur = id0 && FOGON_REC[id0];
        const recs = Object.entries(FOGON_REC).map(([id, r]) => {
          const lock = r.lvl > lv, poor = !lock && !canPay(r.cost), off = lock || !!cur;
          const note = lock ? `Necesita el ${OBRAS.fogon.lv[r.lvl].name.toLowerCase()}.` : r.desc;
          return `<button class="card rec${lock ? ' locked' : ''}${poor && !cur ? ' poor' : ''}" data-rec="${id}" ${off ? 'disabled' : ''}><img class="rimg" src="${recURL(id)}" alt=""><span class="ct"><strong>${r.name}</strong><small>${note}</small>${lock ? '' : `<span class="costs">${costHTML(r.cost)}</span>`}</span></button>`;
        }).join('');
        return `<h2>Fogón</h2><p class="sub">Lo que prepares acá te lo llevás a la próxima noche y dura la primera mitad (${COMIDA_T / 60 | 0}:${String(COMIDA_T % 60).padStart(2, '0')}). Una sola cosa por vez; recorrer el campo no la gasta.</p>
  ${cur ? `<div class="card sel listo"><img class="rimg" src="${recURL(id0)}" alt=""><span class="ct"><strong>Listo: ${cur.name}</strong><small>${cur.fx} en la primera mitad de la próxima noche. Salí por la tranquera cuando quieras.</small></span></div>` : ''}
  <div class="cards">${recs}</div>
  ${lv < OBRAS.fogon.lv.length - 1 ? `<h3 class="subh">Mejorar el fogón</h3><div class="cards">${obraCard('fogon')}</div>` : ''}
  <div class="btns"><button class="btn" data-pu-close>Quedarse un rato<kbd>Esc</kbd></button></div>`;
      }
      const SAL_URL = {};
      function salidaURL(k) {
        const pel = SAVE.horses[SAVE.horse] ? SAVE.horses[SAVE.horse].pelaje : 'zaino', key = k === 'campo' ? k + pel : k;
        if (SAL_URL[key]) return SAL_URL[key];
        if (k === 'campo') return SAL_URL[key] = animSpr('caballo', false, pel).frames[0].img.toDataURL();
        return SAL_URL[key] = pixSprite(24, 1, b => {
          b.ell(0, 0, 8, 8, '#f2ecd8'); b.ell(3.5, -1.5, 7, 7.5, '#141b2d', 1);
          for (const [x, y] of [[-3, -3], [-4.5, 2], [-1.5, 4]]) b.dot(x, y, '#d9d2b3', 1);
          for (const [x, y] of [[7, -7], [9, 4], [5, 8]]) b.dot(x, y, '#e8ecf8', 1);
        }).img.toDataURL();
      }
      function tranqueraHTML() {
        const id0 = SAVE.comida, cur = id0 && FOGON_REC[id0];
        const lleva = cur ? `<span class="lleva"><img class="ico" src="${recURL(id0)}" alt="">Llevás ${cur.name.toLowerCase()}: ${cur.fx}</span>` : `<span class="lleva no">Sin nada del fogón</span>`;
        return `<h2>Tranquera</h2><p class="sub">¿Para dónde salís?</p>
  <div class="cards salida">
  <button class="card sal" data-salir="noche"><img class="rimg" src="${salidaURL('noche')}" alt=""><span class="ct"><strong>Aguantar la noche</strong><small>Quince minutos bajo la luna. Elegís personaje y mapa.</small>${lleva}</span></button>
  <button class="card sal" data-salir="campo"><img class="rimg" src="${salidaURL('campo')}" alt=""><span class="ct"><strong>Recorrer el campo</strong><small>Tranquilo, con pocos enemigos: andás a caballo y juntás materiales a tu ritmo.${cur ? ' Lo del fogón te espera para la noche.' : ''}</small></span></button>
  </div>
  <div class="btns"><button class="btn" data-pu-close>Quedarse en el puesto<kbd>Esc</kbd></button></div>`;
      }
      function nireHTML() {
        const id = PU.sel, n = NIRE[id], st = nireState(id), br = NIRE_BR[n.br];
        const stTxt = { own: 'Aprendido', blocked: 'Bloqueado: elegiste la otra punta de la rama', locked: 'Primero aprendé el nudo anterior', buy: '', poor: 'Te falta fama' }[st];
        return `<h2>Ñire</h2><p class="sub">Cada partida te da fama según cuánto aguantes y a quién derrotes. Aprendé nudos para que la rama se llene de hojas.</p>
  <div class="nwrap"><canvas id="nireCv" width="400" height="320"></canvas>
  <div class="ninfo"><small style="color:${br.col}">Rama del ${br.name}${n.ex ? ' · punta a elegir' : ''}</small><strong>${n.name}</strong><p>${n.desc}</p>
  <div class="costs big">${famaIco} ${NIRE_COST[n.t]} <small>(tenés ${SAVE.fama})</small></div>
  <small class="nst">${stTxt}</small>
  <button class="btn main" id="nireBuy" ${st === 'buy' ? '' : 'disabled'}>Aprender<kbd>Enter</kbd></button>
  <button class="btn" id="nireReset" ${Object.keys(SAVE.nire).length ? '' : 'disabled'}>Olvidar todo (devuelve la fama)</button></div></div>
  <div class="btns"><button class="btn" data-pu-close>Volver<kbd>Esc</kbd></button></div>`;
      }
      /* dibujo del ñire: grilla de 200x160 "píxeles" de 2x2 */
      const NPOS = {
        b1: [74, 104], b2: [56, 96], b3: [38, 86], b4a: [18, 72], b4b: [26, 58],
        c1: [82, 82], c2: [72, 62], c3: [62, 42], c4a: [46, 24], c4b: [64, 18],
        p1: [118, 82], p2: [128, 62], p3: [138, 42], p4a: [136, 18], p4b: [154, 24],
        h1: [126, 104], h2: [144, 96], h3: [162, 86], h4a: [174, 58], h4b: [182, 72]
      };
      function drawNire() {
        const c = $('nireCv'); if (!c) return; const g = c.getContext('2d'); g.clearRect(0, 0, 400, 320);
        const px = (x, y, col) => { g.fillStyle = col; g.fillRect(Math.round(x) * 2, Math.round(y) * 2, 2, 2); };
        const seg = (a, b, w, col) => { const n = Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1])); for (let i = 0; i <= n; i++) { const t = i / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t, ww = w; for (let dx = -ww; dx <= ww; dx++) for (let dy = -ww; dy <= ww; dy++) if (dx * dx + dy * dy <= ww * ww) px(x + dx, y + dy, col); } };
        // suelo y tronco
        for (let x = 0; x < 200; x++) for (let y = 150; y < 160; y++) px(x, y, (x + y) % 3 ? '#1c2621' : '#2d3b2e');
        const TR = '#4a3a2e', TRL = '#6a5444';
        seg([100, 152], [97, 126], 6, TR); seg([97, 126], [100, 108], 5, TR); seg([100, 108], [100, 96], 4, TR);
        for (let y = 100; y < 150; y += 3) px(97 + Math.sin(y) * 2, y, TRL);
        const own = id => NI(id);
        const branch = (pts, on) => { for (let i = 0; i < pts.length - 1; i++) seg(pts[i], pts[i + 1], i === 0 ? 3 : 2, on ? TR : '#3a3029'); };
        const root = { b: [98, 108], c: [98, 100], p: [102, 100], h: [102, 108] };
        for (const br of ['b', 'c', 'p', 'h']) {
          const ids = Object.keys(NIRE).filter(k => NIRE[k].br === br);
          const [n1, n2, n3, ta, tb] = ids;
          branch([root[br], NPOS[n1], NPOS[n2], NPOS[n3]], own(n1));
          branch([NPOS[n3], NPOS[ta]], own(ta)); branch([NPOS[n3], NPOS[tb]], own(tb));
        }
        // hojas: se agrupan alrededor de lo aprendido, con los colores del ñire en otoño
        const LC = ['#8a3222', '#b8482a', '#d8743a', '#e89a48'];
        for (const id in NPOS) {
          if (!own(id)) continue; const [x, y] = NPOS[id];
          for (let i = 0; i < 46; i++) { const a = hash(i, id.charCodeAt(0) * 7 + id.length) * TAU, r = 2 + hash(i * 3, id.charCodeAt(1) || 5) * 9; px(x + Math.cos(a) * r, y + Math.sin(a) * r * .75, LC[i % 4]); }
        }
        // nudos
        const t = performance.now() / 1000;
        for (const id in NPOS) {
          const [x, y] = NPOS[id], st = nireState(id), sel = PU && PU.sel === id;
          const ring = st === 'own' ? '#ffd070' : st === 'buy' ? '#e0c078' : st === 'poor' ? '#8a7a5a' : '#3a3440';
          for (let dx = -3; dx <= 3; dx++) for (let dy = -3; dy <= 3; dy++) { const d = dx * dx + dy * dy; if (d <= 9) px(x + dx, y + dy, d >= 6 ? '#0c1120' : st === 'own' ? '#e89a48' : st === 'buy' || st === 'poor' ? '#5e6e3e' : '#2a2430'); }
          for (let a = 0; a < 12; a++) { const aa = a / 12 * TAU; px(x + Math.cos(aa) * 3.2, y + Math.sin(aa) * 3.2, ring); }
          if (st === 'own') px(x, y, '#fff4c8');
          if (st === 'blocked') { px(x - 1, y - 1, '#8a3a3a'); px(x + 1, y + 1, '#8a3a3a'); px(x + 1, y - 1, '#8a3a3a'); px(x - 1, y + 1, '#8a3a3a'); }
          if (sel && Math.sin(t * 6) > -.3) for (let a = 0; a < 20; a++) { const aa = a / 20 * TAU; px(x + Math.cos(aa) * 5.5, y + Math.sin(aa) * 5.5, '#6fd3e0'); }
        }
        // nombres de las ramas
        g.font = '600 12px ' + getComputedStyle(document.body).fontFamily; g.textAlign = 'center';
        for (const [br, x, y] of [['b', 44, 124], ['c', 56, 6], ['p', 146, 6], ['h', 156, 124]]) { g.fillStyle = NIRE_BR[br].col; g.fillText(NIRE_BR[br].name, x * 2, y * 2 + 10); }
        if (PU && PU.ui === 'nire') PU.nireRAF = requestAnimationFrame(drawNire);
      }
      function nireHit(ev) {
        const c = $('nireCv'), r = c.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 200, y = (ev.clientY - r.top) / r.height * 160;
        let best = null, bd = 64; for (const id in NPOS) { const d = (NPOS[id][0] - x) ** 2 + (NPOS[id][1] - y) ** 2; if (d < bd) { bd = d; best = id; } }
        if (best) { PU.sel = best; sfx(880, .04, 'triangle', .02); rerenderNireInfo(); }
      }
      function rerenderNireInfo() { cancelAnimationFrame(PU.nireRAF); renderPuPanel(); }
      function nireBuy() {
        const id = PU.sel; if (nireState(id) !== 'buy') return;
        SAVE.fama -= NIRE_COST[NIRE[id].t]; SAVE.nire[id] = 1; writeSave();
        sfx(523, .1, 'triangle', .05); setTimeout(() => sfx(784, .18, 'triangle', .05), 90);
        rerenderNireInfo();
      }
      const NIRE_ORDER = ['b1', 'b2', 'b3', 'b4a', 'b4b', 'c1', 'c2', 'c3', 'c4a', 'c4b', 'p1', 'p2', 'p3', 'p4a', 'p4b', 'h1', 'h2', 'h3', 'h4a', 'h4b'];

      /* minijuego de la fragua: tres martillazos sobre una barra */
      function forgeStart() {
        const F = PU.forgeSel, cost = Object.assign({}, HOJAS[F.hoja].cost); for (const [k, v] of Object.entries(CABOS[F.cabo].cost)) cost[k] = (cost[k] || 0) + v;
        if (!canPay(cost) || SAVE.knives.length >= MAX_KNIVES) return;
        F.name = ($('kname').value || '').trim();
        pay(cost); writeSave(); puHudUpdate();
        PU.forge = { hits: [], t0: performance.now(), timer: 0, done: false };
        $('forgeGo').textContent = 'Martillar'; $('forgeGo').insertAdjacentHTML('beforeend', '<kbd>Espacio</kbd>');
        $('fmsg').textContent = 'Martillazo 1 de 3';
        const loop = () => { if (!PU || !PU.forge) return; drawForgeBar(); PU.forge.timer = requestAnimationFrame(loop); }; loop();
      }
      const forgePos = () => { const s = (performance.now() - PU.forge.t0) / 1000; return (Math.sin(s * (3.2 + PU.forge.hits.length * .9)) + 1) / 2; };
      function drawForgeBar() {
        const c = $('fbar'); if (!c) return; const g = c.getContext('2d'), w = 220;
        g.fillStyle = '#0c1120'; g.fillRect(0, 0, w, 26); g.fillStyle = '#3a1a10'; g.fillRect(2, 6, w - 4, 14);
        const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#5a2a14'); gr.addColorStop(.42, '#ff8a2a'); gr.addColorStop(.5, '#fff0a0'); gr.addColorStop(.58, '#ff8a2a'); gr.addColorStop(1, '#5a2a14');
        g.fillStyle = gr; g.fillRect(2, 8, w - 4, 10);
        for (const h of PU.forge.hits) { g.fillStyle = '#ffffff'; g.fillRect(2 + h.p * (w - 4) - 1, 4, 2, 18); }
        if (!PU.forge.done) { const p = forgePos(); g.fillStyle = '#ece6d2'; g.fillRect(2 + p * (w - 4) - 2, 0, 4, 26); }
      }
      function forgeHit() {
        const Fg = PU.forge; if (!Fg || Fg.done) return;
        const p = forgePos(), sc = 1 - Math.min(1, Math.abs(p - .5) / .5); Fg.hits.push({ p, sc });
        sfx(900 + sc * 600, .08, 'square', .05, .4); setTimeout(() => sfx(2600, .04, 'square', .02), 30);
        if (Fg.hits.length < 3) { $('fmsg').textContent = `Martillazo ${Fg.hits.length + 1} de 3`; return; }
        Fg.done = true; const avg = Fg.hits.reduce((a, h) => a + h.sc, 0) / 3, q = avg > .8 ? 2 : avg > .45 ? 1 : 0, F = PU.forgeSel;
        const kn = { hoja: F.hoja, cabo: F.cabo, q, name: F.name || `Facón ${CABOS[F.cabo].name.split(' ').pop()}` };
        SAVE.knives.push(kn); if (SAVE.knife < 0) SAVE.knife = SAVE.knives.length - 1; writeSave();
        drawForgeBar(); $('fmsg').textContent = `Salió un facón de calidad ${QUAL[q].name}.`;
        sfx(523, .12, 'triangle', .05); setTimeout(() => sfx(784, .2, 'triangle', .05), 110);
        setTimeout(() => { if (PU && PU.ui === 'fragua') { if (PU.forge) cancelAnimationFrame(PU.forge.timer); PU.forge = null; PU.forgeSel.name = ''; renderPuPanel(); } }, 1100);
      }
      function drawKnifePreview() {
        const c = $('kprev'); if (!c || !PU.forgeSel) return; const g = c.getContext('2d'); g.clearRect(0, 0, 128, 64);
        drawKnife(g, 12, 32, 2, PU.forgeSel.hoja, PU.forgeSel.cabo);
      }

