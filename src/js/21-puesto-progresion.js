      /* =====================================================================
         EL PUESTO — progresión entre partidas
         Monedas: oro (Almacén y obras del puesto), fama (Ñire) y materiales
         (cuero, hueso, hierro: fragua, corral y obras). Todo vive en SAVE.
         ===================================================================== */
      const MATS = { cuero: { name: 'cuero', col: '#b0703e' }, hueso: { name: 'hueso', col: '#e8e0c8' }, hierro: { name: 'hierro', col: '#9aa4b4' } };
      const MAT_KEYS = ['cuero', 'hueso', 'hierro'];
      const MAT_DROP = { calavera: ['hueso', .04], bruja: ['hueso', .05], lobizon: ['cuero', .08], chonchon: ['hueso', .02], cuero: ['cuero', .08], basilisco: ['hueso', .05], anima: ['hierro', .004], sombra: ['hierro', .003] };

      /* ---------------- guardado: campos nuevos y migración ---------------- */
      /* ---------------- Recorrer el campo: constantes (antes de normSave) ---------------- */
      const CAMPO_CELL = 380, CAMPO_REGROW = 20 * 60 * 1000, CAMPO_HOME = { x: 0, y: 70 }, campoCache = new Map();
      function normSave() {
        SAVE.campo = Object.assign({ seed: 1 + ((Math.random() * 99999) | 0), taken: {}, salidas: 0, tiempo: 0 }, SAVE.campo || {});
        { const now = Date.now(); for (const k in SAVE.campo.taken) if (now - SAVE.campo.taken[k] > CAMPO_REGROW) delete SAVE.campo.taken[k]; }
        SAVE.mat = Object.assign({ cuero: 0, hueso: 0, hierro: 0 }, SAVE.mat || {});
        SAVE.puesto = Object.assign({ rancho: 1, fragua: 0, corral: 0, fogon: 0 }, SAVE.puesto || {});
        SAVE.nire = SAVE.nire || {}; SAVE.trophies = SAVE.trophies || {};
        SAVE.knives = SAVE.knives || []; SAVE.horses = SAVE.horses || [];
        if (typeof SAVE.fama !== 'number') SAVE.fama = 0;
        if (typeof SAVE.knife !== 'number') SAVE.knife = -1;
        if (typeof SAVE.horse !== 'number') SAVE.horse = -1;
        if (!SAVE.ver) {
          // partidas guardadas anteriores al puesto: algo de fama y los trofeos que se puedan deducir
          SAVE.fama += Math.min(60, (SAVE.stats.runs || 0) * 2 + (SAVE.stats.bosses || 0) * 4);
          if ((SAVE.bestiary.caleuche || 0) > 0) SAVE.trophies.caleuche = 1;
          if (hasAch('boss1') && (SAVE.bestiary.lobizon || 0) > 0) SAVE.trophies.lobizon = 1;
          if (hasAch('win')) SAVE.trophies.amanecer = 1;
          SAVE.ver = 2;
        }
      }
      normSave(); writeSave();

      /* ---------------- Ñire: rama de habilidades ----------------
         4 ramas de 3 nudos seguidos más una punta con dos opciones excluyentes. Se paga con fama. */
      const NIRE_COST = [4, 7, 11, 16];
      const NIRE_BR = {
        b: { name: 'Baqueano', col: '#d98a3a' },
        c: { name: 'Cuchillero', col: '#c24a3a' },
        h: { name: 'Curandero', col: '#8fb36a' },
        p: { name: 'Payador', col: '#e0b75a' }
      };
      const NIRE = {
        b1: { br: 'b', t: 0, name: 'Paso liviano', desc: 'El dash recarga 15% más rápido.' },
        b2: { br: 'b', t: 1, name: 'Mano de domador', desc: 'Amansás caballos y guanacos 40% más rápido.' },
        b3: { br: 'b', t: 2, name: 'Jinete de ley', desc: 'Las montas duran 5 segundos más.' },
        b4a: { br: 'b', t: 3, ex: 'b4b', name: 'Polvareda', desc: 'El dash levanta un remolino de tierra que empuja y daña.' },
        b4b: { br: 'b', t: 3, ex: 'b4a', name: 'Tropilla', desc: 'Hay casi el doble de potreros y aguadas en el mapa.' },
        c1: { br: 'c', t: 0, name: 'Filo asentado', desc: '5% de probabilidad de golpe crítico que hace el doble.' },
        c2: { br: 'c', t: 1, name: 'Muñeca rápida', desc: 'Las armas recargan 6% más rápido.' },
        c3: { br: 'c', t: 2, name: 'Remate', desc: 'Los enemigos comunes con menos de 12% de vida caen de un golpe.' },
        c4a: { br: 'c', t: 3, ex: 'c4b', name: 'Mano pesada', desc: '+15% de daño, pero 10% menos de velocidad.' },
        c4b: { br: 'c', t: 3, ex: 'c4a', name: 'Lluvia de acero', desc: '+1 proyectil para las armas que lanzan cosas.' },
        h1: { br: 'h', t: 0, name: 'Yuyos del monte', desc: 'Recuperás 0,3 de vida por segundo.' },
        h2: { br: 'h', t: 1, name: 'Buen asado', desc: 'Los asados curan 50% más.' },
        h3: { br: 'h', t: 2, name: 'Cuero duro', desc: '+1 de armadura.' },
        h4a: { br: 'h', t: 3, ex: 'h4b', name: 'Segundo aire', desc: 'Una vez por partida, al bajar de 25% de vida: 3 s de invulnerabilidad y curás 30%.' },
        h4b: { br: 'h', t: 3, ex: 'h4a', name: 'Caldo de huesos', desc: '+25% de vida máxima.' },
        p1: { br: 'p', t: 0, name: 'Labia', desc: '+10% de oro.' },
        p2: { br: 'p', t: 1, name: 'Memoria de payador', desc: '+8% de experiencia.' },
        p3: { br: 'p', t: 2, name: 'Rebusque', desc: '+1 cambio de opciones por partida.' },
        p4a: { br: 'p', t: 3, ex: 'p4b', name: 'Mano de truco', desc: 'Elegís entre 4 cartas de truco en vez de 3.' },
        p4b: { br: 'p', t: 3, ex: 'p4a', name: 'Ojo de acopiador', desc: '+50% de materiales al terminar la partida.' }
      };
      const NI = id => !!(SAVE.nire && SAVE.nire[id]);
      function nireState(id) {
        const n = NIRE[id]; if (NI(id)) return 'own';
        if (n.ex && NI(n.ex)) return 'blocked';
        const prev = Object.keys(NIRE).filter(k => NIRE[k].br === n.br && NIRE[k].t === n.t - 1);
        if (n.t > 0 && !prev.some(NI)) return 'locked';
        return SAVE.fama >= NIRE_COST[n.t] ? 'buy' : 'poor';
      }

      /* ---------------- fragua: facones propios ---------------- */
      const HOJAS = {
        criolla: { name: 'Hoja criolla', desc: '+8% de daño', cost: { hierro: 6 }, lvl: 1 },
        caronera: { name: 'Hoja caronera', desc: '+12% de área', cost: { hierro: 10 }, lvl: 1 },
        riel: { name: 'Acero de riel', desc: '+20% de daño a élites y jefes', cost: { hierro: 16 }, lvl: 2 }
      };
      const CABOS = {
        hueso: { name: 'Cabo de hueso', desc: '+0,3 de vida por segundo', cost: { hueso: 6 }, lvl: 1 },
        guampa: { name: 'Cabo de guampa', desc: '+8% de velocidad', cost: { hueso: 4, cuero: 4 }, lvl: 1 },
        plata: { name: 'Cabo de plata', desc: '+15% de oro', cost: { hierro: 6, hueso: 6, oro: 300 }, lvl: 2 }
      };
      const QUAL = [{ name: 'ordinaria', k: .8 }, { name: 'buena', k: 1 }, { name: 'excelente', k: 1.25 }];
      const MAX_KNIVES = 4;
      const knifeEq = () => SAVE.knife >= 0 ? SAVE.knives[SAVE.knife] : null;
      function knifeDesc(kn) {
        const q = QUAL[kn.q].k, f = v => String(Math.round(v * 10) / 10).replace('.', ',');
        const h = { criolla: `+${f(8 * q)}% de daño`, caronera: `+${f(12 * q)}% de área`, riel: `+${f(20 * q)}% a élites y jefes` }[kn.hoja];
        const c = { hueso: `+${f(.3 * q)} de vida/s`, guampa: `+${f(8 * q)}% de velocidad`, plata: `+${f(15 * q)}% de oro` }[kn.cabo];
        return h + ' · ' + c;
      }

      /* ---------------- corral: caballos propios ---------------- */
      const PELAJES = {
        zaino: { name: 'Zaino', body: '#7a4a2a', mane: '#1e140e' },
        alazan: { name: 'Alazán', body: '#a8582c', mane: '#6a2e18' },
        tordillo: { name: 'Tordillo', body: '#8f9296', mane: '#4a4c52' },
        moro: { name: 'Moro', body: '#454656', mane: '#16161c' },
        bayo: { name: 'Bayo', body: '#c49a5a', mane: '#2a1d14' },
        overo: { name: 'Overo', body: '#7a4a2a', mane: '#1e140e', spots: true }
      };
      const RASGOS = {
        ligero: { name: 'ligero', desc: '+15% de velocidad montado' },
        aguantador: { name: 'aguantador', desc: '+5 s de monta' },
        guapo: { name: 'guapo', desc: '+35% de aguante' },
        manero: { name: 'mañero', desc: '+30% de daño al atropellar; corcovea más fuerte' }
      };
      // modo prueba: con el corral al máximo aparece un caballo ya amansado (uno solo)
      function devHorse() {
        if (!SAVE.dev || SAVE.devHorse || SAVE.puesto.corral < 2 || SAVE.horses.length >= corralCap()) return;
        SAVE.horses.push({ pelaje: pick(PELAJES), rasgo: pick(RASGOS), lvl: 1 }); SAVE.devHorse = true;
        if (SAVE.horse < 0) SAVE.horse = SAVE.horses.length - 1;
        if (typeof puSyncHorses === 'function' && PU) puSyncHorses();
      }
      const horseName = h => PELAJES[h.pelaje].name + ' ' + RASGOS[h.rasgo].name;
      const corralCap = () => SAVE.puesto.corral >= 2 ? 6 : SAVE.puesto.corral >= 1 ? 3 : 0;
      const trainCost = l => ({ oro: 90 * l, cuero: 3 * l });
      const pick = o => { const k = Object.keys(o); return k[(Math.random() * k.length) | 0]; };

      /* ---------------- obras del puesto ---------------- */
      const OBRAS = {
        rancho: {
          name: 'Rancho', lv: [
            null,
            { name: 'Carpa', desc: 'Donde empezó todo.' },
            { name: 'Rancho de adobe', desc: '+1 de fama por partida. Aparece la tabla de trofeos.', cost: { oro: 500, cuero: 12, hueso: 8 } },
            { name: 'Rancho con galería', desc: '+2 de fama por partida y +5% de oro.', cost: { oro: 1400, cuero: 25, hierro: 15 } }]
        },
        fragua: {
          name: 'Fragua', lv: [
            { name: 'Sin construir' },
            { name: 'Fragua', desc: 'Forjás facones con hoja criolla o caronera y cabo de hueso o guampa.', cost: { oro: 350, hierro: 8 } },
            { name: 'Fragua completa', desc: 'Suma el acero de riel y el cabo de plata.', cost: { oro: 900, hierro: 20, hueso: 10 } }]
        },
        corral: {
          name: 'Corral', lv: [
            { name: 'Sin construir' },
            { name: 'Corral', desc: '3 lugares. Los caballos que amanses se quedan acá si aguantás al menos 5 minutos en la partida.', cost: { oro: 300, cuero: 10 } },
            { name: 'Corral grande', desc: '6 lugares y bebedero.', cost: { oro: 800, cuero: 22, hierro: 8 } }]
        },
        fogon: {
          name: 'Fogón', lv: [
            { name: 'Fogón', desc: 'Unos troncos, la pava y el mate.' },
            { name: 'Asador de hierro', desc: 'Una cruz para el cordero y una parrilla: suma las tortas fritas y el cordero al asador.', cost: { oro: 300, hierro: 6 } }]
        }
      };

      /* ---------------- fogón: comidas para la próxima noche ----------------
         Se prepara una sola por vez; queda en SAVE.comida hasta que empieza una noche saliendo del Puesto
         (Recorrer el campo no la gasta) y dura la primera mitad de esa noche. Para sumar una receta: una línea acá. */
      const COMIDA_T = 450;
      const FOGON_REC = {
        mate: { name: 'Mate amargo', fx: '+10% de recarga', desc: 'Las armas recargan 10% más rápido.', end: 'Se enfrió el mate', cost: { oro: 60, hueso: 1 }, lvl: 0, apply: p => { p.cd *= .9; } },
        tortas: { name: 'Tortas fritas', fx: '+10% de velocidad', desc: 'Te movés 10% más rápido.', end: 'Se terminaron las tortas fritas', cost: { oro: 80, cuero: 2 }, lvl: 1, apply: p => { p.speed *= 1.1; } },
        cordero: { name: 'Cordero al asador', fx: '+15% de vida máxima', desc: '+15% de vida máxima.', end: 'Se te bajó el asado', cost: { oro: 120, hueso: 3 }, lvl: 1, apply: p => { p.maxHp *= 1.15; } }
      };
      if (SAVE.comida && !FOGON_REC[SAVE.comida]) { SAVE.comida = null; writeSave(); }
      const TROFEOS = [
        { id: 'lobizon', name: 'Cuero del Lobizón Mayor', how: 'Derrotá al jefe de la Estepa.' },
        { id: 'caleuche', name: 'Farol del Caleuche', how: 'Derrotá al jefe del Glaciar.' },
        { id: 'mini_bruja', name: 'Escoba de la Salamanca', how: 'Derrotá a la Bruja de la Salamanca.' },
        { id: 'mini_basilisco', name: 'Huevo del Basilisco', how: 'Derrotá al Basilisco Viejo.' },
        { id: 'amanecer', name: 'Primer sol', how: 'Sobreviví hasta el amanecer.' },
        { id: 'herradura', name: 'Herradura de domador', how: 'Amansá 5 animales (logro Domador).' },
        { id: 'mandinga', name: 'Cuerno del Mandinga', how: 'Escapale al Mandinga 2 minutos después del amanecer.' }
      ];
      const hasTrophy = id => id === 'herradura' ? hasAch('domador') : !!SAVE.trophies[id];

      function canPay(c) { for (const k in c) { if (k === 'oro') { if (SAVE.gold < c[k]) return false; } else if ((SAVE.mat[k] || 0) < c[k]) return false; } return true; }
      function pay(c) { for (const k in c) { if (k === 'oro') SAVE.gold -= c[k]; else SAVE.mat[k] -= c[k]; } }
      function costHTML(c) {
        return Object.entries(c).map(([k, v]) => {
          const have = k === 'oro' ? SAVE.gold : (SAVE.mat[k] || 0), ok = have >= v;
          return `<span class="cst${ok ? '' : ' no'}">${k === 'oro' ? ICON_ORO : matIco(k)}${v}</span>`;
        }).join('');
      }

      /* ---------------- sprites de materiales e íconos ---------------- */
      const MAT_SPR = {};
      function matSprite(m) {
        if (MAT_SPR[m]) return MAT_SPR[m];
        return MAT_SPR[m] = pixSprite(24, 1, b => {
          if (m === 'cuero') { b.poly([[-7, -4], [-3, -7], [3, -6], [7, -3], [6, 4], [1, 7], [-5, 6], [-8, 1]], '#b0703e'); b.tex('#b0703e', (x, y) => hash(x * 3, y * 5) < .18 ? [140, 86, 46] : null); b.line([[-4, -2], [3, 3]], .8, '#7a4a26', 1); }
          else if (m === 'hueso') { b.line([[-6, 4], [6, -4]], 3, '#e8e0c8'); for (const [x, y] of [[-7, 3], [-5.5, 5.5], [7, -3], [5.5, -5.5]]) b.ell(x, y, 2, 2, '#e8e0c8'); }
          else { b.poly([[-7, 1], [-4, -4], [7, -4], [4, 1]], '#b8c2d0'); b.poly([[-7, 1], [4, 1], [4, 5], [-7, 5]], '#7a8496'); b.poly([[4, 1], [7, -4], [7, 0], [4, 5]], '#5a6272'); }
        });
      }
      const MAT_URL = {};
      const matIco = m => `<img class="ico" src="${MAT_URL[m] || (MAT_URL[m] = matSprite(m).img.toDataURL())}" alt="${MATS[m].name}">`;
      const famaIco = '<span class="fama-i">✦</span>';
      /* íconos de las comidas del fogón (panel, tranquera y HUD) */
      const REC_SPR = {}, REC_URL = {};
      function recSprite(id) {
        if (REC_SPR[id]) return REC_SPR[id];
        return REC_SPR[id] = pixSprite(24, 1, b => {
          if (id === 'mate') {
            b.ell(0, 2.5, 6, 6, '#7a3424'); b.ell(-2, 1, 2.2, 3, '#9a4a30', 1); b.rect(-4.5, 6.5, 9, 1.6, '#5a2418', 1);
            b.ell(0, -3.2, 4.4, 1.6, '#c8ccd4'); b.ell(0, -3.4, 3.2, 1, '#5e7a34', 1);
            b.line([[1, -3.4], [4.5, -9.5]], 1.2, '#d8dce4', 1); b.dot(4.6, -9.8, '#eef2f8', 1);
          } else if (id === 'tortas') {
            b.ell(-1.5, 3.5, 7.5, 3.4, '#b87a34'); b.ell(-1.5, 2.6, 6.6, 2.6, '#d89a48', 1);
            b.ell(1.5, -1.5, 7.5, 3.4, '#c8883c'); b.ell(1.5, -2.4, 6.6, 2.6, '#e8b058', 1); b.ell(1.5, -2.6, 1.3, 1, '#8a5a24', 1);
            for (const [x, y] of [[-2, -3], [4, -1.8], [0, -1], [-4.5, 2.4], [2, 3.2]]) b.dot(x, y, '#fff6e0', 1);
          } else {
            b.line([[-7.5, 6.5], [-3, 2]], 2.2, '#e8e0c8'); b.ell(-8.2, 7.2, 1.8, 1.8, '#e8e0c8');
            b.ell(2, -1, 7, 5.6, '#8a3a22'); b.ell(1, -2.4, 5.4, 3.6, '#b0582e', 1); b.ell(-.5, -3.6, 2.2, 1.2, '#d88a4a', 1);
            for (const x of [-1, 2, 5]) b.line([[x, -5.5], [x + 1.5, 3]], .7, '#6a2a18', 1);
          }
        });
      }
      const recURL = id => REC_URL[id] || (REC_URL[id] = recSprite(id).img.toDataURL());

      /* facón compuesto (vista lateral, filo hacia la derecha), dibujado con rectángulos de píxel */
      function drawKnife(g, x, y, s, hoja, cabo) {
        const P = (px, py, w, h, c) => { g.fillStyle = c; g.fillRect(x + px * s, y + py * s, w * s, h * s); };
        const CAB = { hueso: ['#e8e0c8', '#c8bea4'], guampa: ['#3a2e28', '#6a564a'], plata: ['#d8dce4', '#9aa2b0'] }[cabo];
        P(-1, -3, 15, 6, OL); P(0, -2, 13, 4, CAB[0]); for (let i = 1; i < 13; i += 3) P(i, -2, 1, 4, CAB[1]);
        if (cabo === 'plata') { P(4, -1, 1, 1, '#fff'); P(8, 1, 1, 1, '#fff'); }
        P(12, -4, 4, 8, OL); P(13, -3, 2, 6, '#c9a45c');
        const L = hoja === 'caronera' ? 30 : hoja === 'riel' ? 24 : 22, hw = hoja === 'riel' ? 3 : 2;
        P(15, -hw - 1, L + 1, hw * 2 + 2, OL);
        P(16, -hw, L - 2, hw * 2, hoja === 'riel' ? '#8a94a4' : '#c8d0dc');
        P(16, -hw, L - 2, 1, '#f4f8ff');
        for (let i = 0; i < hw + 1; i++) P(16 + L - 2 + i, -hw + i, 1, hw * 2 - 2 * i > 0 ? hw * 2 - 2 * i : 1, hoja === 'riel' ? '#8a94a4' : '#c8d0dc');
        if (hoja === 'riel') P(18, 0, L - 8, 1, '#5a6272');
      }
      function knifeURL(kn) {
        const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
        drawKnife(g, 4, 32, 1.45, kn.hoja, kn.cabo); return c.toDataURL();
      }

