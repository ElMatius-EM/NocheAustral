      /* ---------------- data ---------------- */
      const ETYPES = {
        sombra: { name: 'Sombra', r: 11, hp: 7, spd: 60, dmg: 6, xp: 1, w: 1, col: '#4b3d6e', eye: '#f2d45c' },
        anima: { name: 'Ánima', r: 11, hp: 4, spd: 82, dmg: 4, xp: 1, w: .55, col: '#9db4d6', eye: '#1a2440', erratic: true, fly: true },
        calavera: { name: 'Calavera', r: 11, hp: 16, spd: 72, dmg: 9, xp: 2, w: 1.3, col: '#d9d1b8', eye: '#1c1a17' },
        lobizon: { name: 'Lobizón', r: 16, hp: 42, spd: 52, dmg: 13, xp: 4, w: 2.6, col: '#6e4a2f', eye: '#ff5a3c' },
        bruja: { name: 'Bruja', r: 12, hp: 20, spd: 44, dmg: 8, xp: 3, w: 1.5, col: '#3f6e52', eye: '#e7f76a', ranged: true },
        mandinga: { name: 'Mandinga', r: 24, hp: 1e7, spd: 205, dmg: 999, xp: 0, w: 99, col: '#8a1424', eye: '#ffd23c' },
        chonchon: { name: 'Chonchón', r: 10, hp: 6, spd: 96, dmg: 5, xp: 1, w: .5, col: '#d8b894', eye: '#ffe066', erratic: true, fly: true },
        cuero: { name: 'Cuero', r: 19, hp: 80, spd: 36, dmg: 14, xp: 6, w: 3.6, col: '#7a5a3a', eye: '#ff5a3c' },
        basilisco: { name: 'Basilisco', r: 12, hp: 26, spd: 48, dmg: 9, xp: 3, w: 1.4, col: '#6f8f3a', eye: '#ffe066', ranged: true, shotCol: '#c8f59a', shotGlow: 'rgba(140,220,90,.35)' },
        caleuche: { name: 'Caleuche', r: 30, hp: 60, spd: 58, dmg: 18, xp: 0, w: 99, col: '#2a3a4e', eye: '#9fe8ff', volley: true },
        // bosque andino. charge: embestida propia de bichos comunes [alcance, apunte s, velocidad, duración s, espera mín, espera máx]
        bandurria: { name: 'Bandurria', r: 9, hp: 5, spd: 94, dmg: 5, xp: 1, w: .5, col: '#8a8270', eye: '#ffd23c', erratic: true, fly: true, nf: 6 },
        chancho: { name: 'Chancho cimarrón', r: 11, hp: 15, spd: 70, dmg: 8, xp: 2, w: 1.3, col: '#6e5444', eye: '#ff7a3c' },
        puma: { name: 'Puma', r: 13, hp: 26, spd: 64, dmg: 11, xp: 3, w: 1.5, col: '#b08a5a', eye: '#ffe066', charge: [250, .4, 540, .3, 2.5, 4] },
        jabali: { name: 'Jabalí', r: 15, hp: 40, spd: 50, dmg: 12, xp: 4, w: 2.5, col: '#4a3e36', eye: '#ff5a3c', charge: [320, .65, 430, .5, 4, 6] },
        cuchivilu: { name: 'Cuchivilu', r: 22, hp: 60, spd: 56, dmg: 18, xp: 0, w: 99, col: '#4e6a4a', eye: '#ffd23c' },
        farol: { name: 'Farol', r: 10, hp: 1, spd: 0, dmg: 0, xp: 0, w: 99, col: '#3a2e22', eye: '#ffcf6a', prop: true }
      };
      const WAVES = [
        { sombra: 1 },
        { sombra: 4, anima: 1 },
        { sombra: 3, anima: 2 },
        { sombra: 2, calavera: 2, anima: 1 },
        { calavera: 3, lobizon: 1, sombra: 1 },
        { anima: 2, bruja: 1, sombra: 2 },
        { lobizon: 2, calavera: 2, anima: 1 },
        { bruja: 2, anima: 3, calavera: 1 },
        { lobizon: 3, bruja: 1, calavera: 2 },
        { calavera: 3, anima: 3, lobizon: 1 },
        { lobizon: 3, bruja: 2, sombra: 2 },
        { anima: 4, calavera: 3, bruja: 1 },
        { lobizon: 4, calavera: 2, bruja: 2 },
        { sombra: 2, anima: 2, calavera: 2, lobizon: 2, bruja: 2 },
        { lobizon: 5, bruja: 3, calavera: 3 }
      ];

      const PASSIVES = {
        corazon: { name: 'Corazón de guanaco', icon: '❤️', desc: '+20% de vida máxima.', max: 5, apply: (p, l) => { p.maxHp *= 1 + .2 * l } },
        mate: { name: 'Mate cebado', icon: '🧉', desc: 'Las armas recargan 8% más rápido.', max: 5, apply: (p, l) => { p.cd *= 1 - .08 * l } },
        ojo: { name: 'Ojo de cóndor', icon: '👁️', desc: '+10% de área de ataque.', max: 5, apply: (p, l) => { p.area *= 1 + .1 * l } },
        poncho: { name: 'Poncho de lana', icon: '🧥', desc: '+1 de armadura: cada golpe te saca 6% menos (tope 60%).', max: 5, apply: (p, l) => { p.armor += l } },
        luna: { name: 'Luna menguante', icon: '🌙', desc: 'Los efectos duran 15% más.', max: 5, apply: (p, l) => { p.dur *= 1 + .15 * l } },
        espuela: { name: 'Espuelas', icon: '👢', desc: '+10% de velocidad de movimiento.', max: 5, apply: (p, l) => { p.speed *= 1 + .1 * l } },
        iman: { name: 'Piedra imán', icon: '🧲', desc: '+30% de radio para juntar experiencia.', max: 5, apply: (p, l) => { p.magnet *= 1 + .3 * l } },
        yerba: { name: 'Yerba del monte', icon: '🌿', desc: '+10% de daño.', max: 5, apply: (p, l) => { p.might *= 1 + .1 * l } },
        tientos: { name: 'Tientos', icon: '🪢', desc: '+1 proyectil para las armas que lanzan cosas.', max: 2, apply: (p, l) => { p.amount += l } },
        caldo: { name: 'Caldo caliente', icon: '🍲', desc: 'Recuperás 0,3 de vida por segundo.', max: 5, apply: (p, l) => { p.regen += .3 * l } }
      };

      const WEAPONS = {
        rebenque: {
          name: 'Rebenque', icon: '➰', desc: 'Azota en horizontal hacia donde mirás.', evoWith: 'corazon',
          evoName: 'Rebenque carmesí', evoDesc: 'Golpes enormes que te curan con cada impacto.',
          ups: ['', 'Golpea también hacia atrás', '+5 de daño', '+15% de área', '+5 de daño', '+15% de área', '+5 de daño', '+5 de daño'],
          stats: l => ({ dmg: 10 + 5 * ((l >= 3) + (l >= 5) + (l >= 7) + (l >= 8)), area: 1 + .15 * ((l >= 4) + (l >= 6)), dirs: l >= 2 ? 2 : 1, cd: 1.35 }),
          evo: { dmg: 34, area: 1.5, dirs: 2, cd: 1.05, steal: .5 },
          fire(w, s) {
            const reps = 1 + ST.amount;
            for (let i = 0; i < reps; i++) {
              const yo = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 16;
              later(i * .14, () => swing(w, s, S.player.face, yo));
              if (s.dirs > 1) later(i * .14 + .07, () => swing(w, s, -S.player.face, yo));
            }
          }
        },
        facon: {
          name: 'Facón', icon: '🔪', desc: 'Lanza cuchillos hacia donde te movés.', evoWith: 'mate',
          evoName: 'Tormenta de facones', evoDesc: 'Un chorro constante de cuchillos que atraviesan.',
          ups: ['', '+1 facón', '+1 facón y +5 de daño', '+1 facón', 'Atraviesa 1 enemigo más', '+1 facón', '+1 facón y +5 de daño', 'Atraviesa 1 enemigo más'],
          stats: l => ({ dmg: 7 + 5 * ((l >= 3) + (l >= 7)), amt: 1 + (l >= 2) + (l >= 3) + (l >= 4) + (l >= 6) + (l >= 7), pierce: 1 + (l >= 5) + (l >= 8), cd: 1.0 }),
          evo: { dmg: 14, amt: 1, pierce: 3, cd: .11 },
          fire(w, s) {
            const n = s.amt + ST.amount;
            for (let i = 0; i < n; i++) later(i * .045, () => {
              const P = S.player, a = Math.atan2(P.fy, P.fx) + rnd(-.07, .07), sp = 540;
              const off = (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 6;
              spawnProj({
                kind: 'knife', x: P.x - Math.sin(a) * off, y: P.y + Math.cos(a) * off, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                r: 6 * ST.area, dmg: s.dmg, pierce: s.pierce, life: .9, w, rot: a
              });
            });
            sfx(900, .04, 'triangle', .02, .6);
            const P = S.player; if (!(P.atkT > 0)) { P.atkT = P.atkMax = .16; P.atkDir = 1; P.atkKind = 'throw'; }
          }
        },
        boleadoras: {
          name: 'Boleadoras', icon: '🪨', desc: 'Piedras que giran a tu alrededor un rato.', evoWith: 'luna',
          evoName: 'Remolino del sur', evoDesc: 'Cinco boleadoras que giran para siempre.',
          ups: ['', '+1 boleadora', '+25% de radio y velocidad', '+1 boleadora', '+8 de daño', '+0,5 s de duración', '+1 boleadora', '+8 de daño y +0,5 s'],
          stats: l => ({ n: 1 + (l >= 2) + (l >= 4) + (l >= 7), rad: 78 * (1 + .25 * (l >= 3)), spd: 3.3 * (1 + .3 * (l >= 3)), dmg: 10 + 8 * ((l >= 5) + (l >= 8)), dur: 3 + .5 * ((l >= 6) + (l >= 8)), cd: 3.6 }),
          evo: { n: 5, rad: 118, spd: 4.6, dmg: 30, dur: 1, cd: 1, perm: true },
          update(w, dt) {
            const s = st(w), P = S.player;
            w.ang = (w.ang || 0) + s.spd * dt;
            if (s.perm) w.on = 1;
            else if (w.on > 0) w.on -= dt;
            else { w.cd -= dt; if (w.cd <= 0) { w.on = s.dur * ST.dur; w.onMax = w.on; w.cd = s.cd * ST.cd; } }
            w.pos = w.pos || []; w.pos.length = 0;
            if (w.on > 0) {
              const n = s.n + ST.amount, R = s.rad * ST.area, sr = 11 * Math.sqrt(ST.area);
              for (let i = 0; i < n; i++) {
                const a = w.ang + i * TAU / n, x = P.x + Math.cos(a) * R, y = P.y + Math.sin(a) * R;
                w.pos.push(x, y);
                if (S.ebul.length) clearBullets(b => { const dx = b.x - x, dy = b.y - y; return dx * dx + dy * dy < (sr + b.r + 3) * (sr + b.r + 3); });
                forNear(x, y, sr, e => { const rr = e.r + sr; if (dist2(e, x, y) < rr * rr && canHit(e, 'bol', .45)) hurt(e, s.dmg, w, 7); });
              }
            }
          }
        },
        fogon: {
          name: 'Fogón', icon: '🔥', desc: 'Brasas a tu alrededor que queman a quien se acerca.', evoWith: 'poncho',
          evoName: 'Fogón eterno', evoDesc: 'Un fuego enorme que además frena a los enemigos.',
          ups: ['', '+20% de radio', '+2 de daño', '+20% de radio', '+2 de daño', '+20% de radio', '+2 de daño', '+20% de radio'],
          stats: l => ({ rad: 52 * (1 + .2 * ((l >= 2) + (l >= 4) + (l >= 6) + (l >= 8))), dmg: 5 + 2 * ((l >= 3) + (l >= 5) + (l >= 7)), tick: .55 }),
          evo: { rad: 128, dmg: 15, tick: .45, slow: true },
          update(w, dt) {
            const s = st(w), P = S.player, R = s.rad * ST.area; w.R = R; if (w.pulse > 0) w.pulse -= dt;
            if (S.parts.length < 520 && Math.random() < dt * (w.evo ? 22 : 12)) { const a = Math.random() * TAU, d = R * rnd(.35, 1); S.parts.push({ x: P.x + Math.cos(a) * d, y: P.y + Math.sin(a) * d * .9, vx: rnd(-12, 12), vy: rnd(-70, -35), life: rnd(.4, .8), max: .8, col: Math.random() < .5 ? '#ffb040' : '#ff7a2a', size: rnd(1.5, 3), glow: true }); }
            if (w.evo && S.ebul.length) clearBullets(b => { const dx = b.x - P.x, dy = b.y - P.y; return dx * dx + dy * dy < (R + b.r) * (R + b.r); });
            if (s.slow) forNear(P.x, P.y, R, e => { const rr = R + e.r; if (!e.elite && dist2(e, P.x, P.y) < rr * rr) e.slowT = .25; });
            w.cd -= dt;
            if (w.cd <= 0) {
              w.cd = s.tick * Math.max(.6, ST.cd); w.pulse = .22;
              forNear(P.x, P.y, R, e => { const rr = R + e.r; if (dist2(e, P.x, P.y) < rr * rr) hurt(e, s.dmg, w, 3); });
            }
          }
        },
        relampago: {
          name: 'Relámpago', icon: '⚡', desc: 'Rayos que caen sobre enemigos al azar.', evoWith: 'ojo',
          evoName: 'Tormenta patagónica', evoDesc: 'Siete rayos gigantes por descarga.',
          ups: ['', '+1 rayo', '+8 de daño', '+1 rayo', '+8 de daño', '+1 rayo', '+8 de daño', '+1 rayo'],
          stats: l => ({ n: 2 + (l >= 2) + (l >= 4) + (l >= 6) + (l >= 8), dmg: 18 + 8 * ((l >= 3) + (l >= 5) + (l >= 7)), aoe: 34, cd: 2.4 }),
          evo: { n: 7, dmg: 55, aoe: 72, cd: 1.5 },
          fire(w, s) {
            const P = S.player, hw = W / 2 / ZOOM, hh = H / 2 / ZOOM, cand = [];
            for (const e of S.enemies) if (!e.dead && !e.prop && Math.abs(e.x - P.x) < hw && Math.abs(e.y - P.y) < hh) cand.push(e);
            const n = s.n + ST.amount;
            for (let i = 0; i < n; i++) {
              let x, y;
              if (cand.length) { const j = (Math.random() * cand.length) | 0, e = cand[j]; cand[j] = cand[cand.length - 1]; cand.pop(); x = e.x; y = e.y; }
              else { x = P.x + rnd(-hw * .7, hw * .7); y = P.y + rnd(-hh * .7, hh * .7); }
              later(i * .07, () => strike(w, s, x, y));
            }
          }
        },
        cruz: {
          name: 'Cruz del Sur', icon: '✴️', desc: 'Una estrella que va hacia el enemigo más cercano y vuelve.', evoWith: 'yerba',
          evoName: 'Constelación', evoDesc: 'Cuatro estrellas en espiral que atraviesan todo.',
          ups: ['', '+1 cruz', '+6 de daño', '+20% de tamaño', '+1 cruz', '+6 de daño', '+20% de tamaño', '+1 cruz'],
          stats: l => ({ n: 1 + (l >= 2) + (l >= 5) + (l >= 8), dmg: 12 + 6 * ((l >= 3) + (l >= 6)), size: 1 + .2 * ((l >= 4) + (l >= 7)), cd: 1.9 }),
          evo: { n: 4, dmg: 36, size: 1.6, cd: 1.25, spiral: true },
          fire(w, s) {
            const P = S.player, n = s.n + ST.amount;
            let base;
            if (s.spiral) base = S.t * 1.7;
            else { const e = nearest(P.x, P.y); base = e ? Math.atan2(e.y - P.y, e.x - P.x) : Math.atan2(P.fy, P.fx); }
            for (let i = 0; i < n; i++) {
              const a = s.spiral ? base + i * TAU / n : base + (i - (n - 1) / 2) * .28;
              later(s.spiral ? 0 : i * .08, () => {
                const sp = 400;
                spawnProj({
                  kind: 'cross', x: S.player.x, y: S.player.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
                  ax: -Math.cos(a) * sp / .75, ay: -Math.sin(a) * sp / .75, r: 11 * s.size * ST.area, dmg: s.dmg, pierce: Infinity,
                  life: 2.3 * ST.dur, w, rep: .45, rot: 0
                });
              });
            }
          }
        },
        trabuco: {
          name: 'Trabuco', icon: '', desc: 'Escopetazo en cono hacia el enemigo más cercano.', evoWith: 'tientos', lock: 'lvl20',
          evoName: 'Trabuco naranjero', evoDesc: 'Un cono enorme de perdigones que atraviesan y empujan fuerte.',
          ups: ['', '+2 perdigones', '+3 de daño', '+2 perdigones', '+3 de daño', '+25% de alcance', '+2 perdigones', '+3 de daño'],
          stats: l => ({ n: 5 + 2 * ((l >= 2) + (l >= 4) + (l >= 7)), dmg: 8 + 3 * ((l >= 3) + (l >= 5) + (l >= 8)), range: 1 + .25 * (l >= 6), pierce: 1, spread: .55, cd: 1.7 }),
          evo: { n: 15, dmg: 15, range: 1.45, pierce: 3, spread: .75, cd: 1.15 },
          fire(w, s) {
            const P = S.player, e = nearest(P.x, P.y), base = e ? Math.atan2(e.y - P.y, e.x - P.x) : Math.atan2(P.fy, P.fx), n = s.n + ST.amount * 2;
            for (let i = 0; i < n; i++) {
              const a = base + rnd(-s.spread / 2, s.spread / 2), sp = rnd(430, 560);
              spawnProj({ kind: 'pellet', x: P.x, y: P.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: 4.5 * Math.sqrt(ST.area), dmg: s.dmg, pierce: s.pierce, life: .42 * s.range, w, kb: w.evo ? 9 : 6 });
            }
            S.shake = Math.min(.5, S.shake + .1);
            burst(P.x + Math.cos(base) * 14, P.y + Math.sin(base) * 14, 6, '#ffcf6a', 160, Math.cos(base) * 200, Math.sin(base) * 200);
            sfx(160, .18, 'sawtooth', .05, .3);
          }
        },
        guitarra: {
          name: 'Guitarra criolla', icon: '', desc: 'Rasguidos que salen en ondas y empujan todo.', evoWith: 'caldo', lock: 'kills1000',
          evoName: 'Payada eterna', evoDesc: 'Ondas enormes y seguidas; cada acorde te cura un poco.',
          ups: ['', '+20% de alcance', '+5 de daño', '+1 onda', '+20% de alcance', '+5 de daño', 'Recarga 15% más rápida', '+1 onda'],
          stats: l => ({ n: 1 + (l >= 4) + (l >= 8), R: 115 * (1 + .2 * ((l >= 2) + (l >= 5))), dmg: 8 + 5 * ((l >= 3) + (l >= 6)), cd: 2.8 * (l >= 7 ? .85 : 1) }),
          evo: { n: 3, R: 230, dmg: 28, cd: 1.6, heal: 2 },
          fire(w, s) {
            const n = s.n + ST.amount;
            for (let i = 0; i < n; i++) later(i * .28, () => {
              const P = S.player;
              S.waves.push({ x: P.x, y: P.y, r: 6, R: s.R * ST.area, spd: 300, dmg: s.dmg, w, hit: new Set(), evo: w.evo });
              if (s.heal) healFromWeapon(s.heal);
              sfx(196 * (1 + i * .25), .35, 'triangle', .05); sfx(294 * (1 + i * .25), .3, 'triangle', .03);
            });
          }
        },
        pava: {
          name: 'Pava hirviendo', icon: '', desc: 'Tira pavas que dejan charcos de agua hirviendo.', evoWith: 'iman', lock: 'chests10',
          evoName: 'Caldera del diablo', evoDesc: 'Charcos enormes que además chupan a los enemigos hacia el centro.',
          ups: ['', '+1 pava', '+20% de área', '+4 de daño', '+1 pava', '+1 s de duración', '+4 de daño', '+1 pava'],
          stats: l => ({ n: 1 + (l >= 2) + (l >= 5) + (l >= 8), R: 44 * (1 + .2 * (l >= 3)), dmg: 6 + 4 * ((l >= 4) + (l >= 7)), dur: 2.6 + (l >= 6), cd: 3.8 }),
          evo: { n: 4, R: 74, dmg: 16, dur: 4, cd: 3.2, pull: true },
          fire(w, s) {
            const P = S.player, n = s.n + ST.amount, hw = W / 2 / ZOOM * .8, hh = H / 2 / ZOOM * .8, cand = [];
            for (const e of S.enemies) if (!e.dead && !e.prop && Math.abs(e.x - P.x) < hw && Math.abs(e.y - P.y) < hh) cand.push(e);
            for (let i = 0; i < n; i++) {
              let tx, ty;
              if (cand.length) { const e = cand[(Math.random() * cand.length) | 0]; tx = e.x + rnd(-20, 20); ty = e.y + rnd(-20, 20); }
              else { const a = Math.random() * TAU, d = rnd(60, 160); tx = P.x + Math.cos(a) * d; ty = P.y + Math.sin(a) * d; }
              S.throws.push({ x0: P.x, y0: P.y, x: tx, y: ty, t: -i * .08, T: .5, s, w });
            }
            sfx(700, .1, 'triangle', .02, .5);
          }
        },
        lanza: {
          name: 'Lanza', icon: '', desc: 'Lanzas arrojadas en arco que atraviesan enemigos.', evoWith: 'espuela', lock: 'evo1',
          evoName: 'Lluvia montonera', evoDesc: 'Salvas de lanzas que atraviesan todo lo que tocan.',
          ups: ['', '+1 lanza', '+6 de daño', 'Atraviesa 2 más', '+1 lanza', '+6 de daño', '+25% de tamaño', '+1 lanza'],
          stats: l => ({ n: 1 + (l >= 2) + (l >= 5) + (l >= 8), dmg: 15 + 6 * ((l >= 3) + (l >= 6)), pierce: 3 + 2 * (l >= 4), size: 1 + .25 * (l >= 7), cd: 1.45 }),
          evo: { n: 6, dmg: 34, pierce: Infinity, size: 1.4, cd: 1.05 },
          fire(w, s) {
            const n = s.n + ST.amount;
            for (let i = 0; i < n; i++) later(i * .09, () => {
              const P = S.player, vx = (i % 2 ? -1 : 1) * rnd(40, 170) + P.face * 50, vy = -rnd(520, 620);
              spawnProj({ kind: 'spear', x: P.x, y: P.y - 8, vx, vy, g: 1150, r: 9 * s.size * ST.area, dmg: s.dmg, pierce: s.pierce, life: 1.7 * ST.dur, w, rot: Math.atan2(vy, vx), kb: 5 });
            });
            sfx(420, .12, 'triangle', .03, .6);
          }
        }
      };

      const CHARS = {
        baqueano: { name: 'Baqueano', weapon: 'rebenque', perk: '+10% de velocidad', col: '#b8322f', bonus: { speed: 1.1 } },
        cuchillero: { name: 'Cuchillero', weapon: 'facon', perk: '+10% de daño', col: '#2f5fa8', bonus: { might: 1.1 } },
        pialadora: { name: 'Pialadora', weapon: 'boleadoras', perk: '+20% de duración', col: '#c9a45c', bonus: { dur: 1.2 } },
        fueguera: { name: 'Fueguera', weapon: 'fogon', perk: '+20% de vida máxima', col: '#d9702a', bonus: { maxHp: 1.2 } },
        tormentera: { name: 'Tormentera', weapon: 'relampago', perk: '+10% de área', col: '#5a6fb8', bonus: { area: 1.1 }, lock: 'min5' },
        rastreadora: { name: 'Rastreadora', weapon: 'cruz', perk: '+30% de imán', col: '#3f7a5a', bonus: { magnet: 1.3 }, lock: 'kills10k' },
        payador: { name: 'Payador', weapon: 'guitarra', perk: '+15% de duración y +10% de área', col: '#7a3f8a', bonus: { dur: 1.15, area: 1.1 }, lock: 'glaciar10' },
        /* oficios: cada uno sale de otro personaje o del Puesto (ver los logros que los desbloquean).
           wdmg: daño por arma · add: suma a un stat · elite: daño extra a élites y jefes · aviso: avisa las hordas
           asado: curación de asados · doma: tiempo de amansar · monta: segundos extra de monta
           fogon: la comida del fogón dura toda la noche · rerolls: cambios de opciones · drunk: camina tambaleando */
        cazador: { name: 'Cazador', weapon: 'trabuco', perk: '+20% de daño con trabuco y boleadoras, +8% de velocidad · −10% de vida', col: '#5a6a3a', bonus: { speed: 1.08, maxHp: .9 }, wdmg: { trabuco: 1.2, boleadoras: 1.2 }, lock: 'ojoCazador' },
        tehuelche: { name: 'Lancero tehuelche', weapon: 'lanza', perk: '+20% de daño con lanza, +10% con boleadoras y facón · −10% de área', col: '#9a6a40', bonus: { area: .9 }, wdmg: { lanza: 1.2, boleadoras: 1.1, facon: 1.1 }, lock: 'lanzaBola' },
        curandero: { name: 'Curandero', weapon: 'cruz', perk: '+0,5 de vida/s; +15% con cruz, relámpago y fogón · −10% de daño', col: '#3f3a5a', bonus: { might: .9 }, add: { regen: .5 }, wdmg: { cruz: 1.15, relampago: 1.15, fogon: 1.15 }, lock: 'curar' },
        paisano: { name: 'Paisano Viejo', weapon: 'rebenque', perk: '+20% de daño a élites y jefes; ve venir las hordas · −15% de imán', col: '#5f6b7a', bonus: { magnet: .85 }, elite: .2, aviso: true, lock: 'manas' },
        puestero: { name: 'Puestero viejo', weapon: 'pava', perk: 'Asados +50%, lo del fogón dura toda la noche, amansa 40% más rápido · −10% de velocidad', col: '#7a5a3a', bonus: { speed: .9 }, asado: 1.5, fogon: true, doma: .6, lock: 'fogonero' },
        estanciero: { name: 'Estanciero', weapon: 'boleadoras', perk: '+25% de oro, montas 5 s más largas · un cambio de opciones menos', col: '#2a2a34', bonus: { greed: 1.25 }, monta: 5, rerolls: -1, lock: 'patron' },
        borracho: { name: 'Borracho', weapon: 'facon', perk: '−20% de daño recibido, +15% con el facón · camina tambaleando', col: '#8a5a5a', bonus: { taken: .8 }, wdmg: { facon: 1.15 }, drunk: true, lock: 'pulperia' }
      };

