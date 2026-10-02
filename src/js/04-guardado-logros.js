      /* ---------------- guardado, tienda y logros ---------------- */
      const SAVE_KEY = 'noche-austral-v1';
      const DEF_SAVE = () => ({
        gold: 0, spent: 0, shop: {}, ach: {}, hyper: false,
        bestiary: {}, stats: { kills: 0, runs: 0, chests: 0, evos: 0, bosses: 0, best: {} }, opts: { music: .6, sfx: .8, nums: true, shake: true, fastChest: false, clearUI: true, gfx: 'alto', fps: false }
      });
      let SAVE = DEF_SAVE();
      function loadSave() {
        try {
          const raw = localStorage.getItem(SAVE_KEY); if (!raw) return;
          const o = JSON.parse(raw), d = DEF_SAVE();
          SAVE = Object.assign(d, o); SAVE.opts = Object.assign(DEF_SAVE().opts, o.opts || {}); SAVE.stats = Object.assign(DEF_SAVE().stats, o.stats || {});
          SAVE.stats.best = SAVE.stats.best || {}; SAVE.bestiary = SAVE.bestiary || {}; SAVE.shop = SAVE.shop || {}; SAVE.ach = SAVE.ach || {};
        } catch (e) { }
      }
      function writeSave() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(SAVE)); } catch (e) { } }
      loadSave();
      GFX_LOW = SAVE.opts.gfx === 'bajo'; resize();
      document.documentElement.classList.toggle('clear', SAVE.opts.clearUI !== false);
      const SHOP = {
        fuerza: { name: 'Fuerza', desc: '+5% de daño por nivel.', max: 5, cost: 120, icon: 'yerba' },
        aguante: { name: 'Aguante', desc: '+10% de vida máxima por nivel.', max: 5, cost: 120, icon: 'corazon' },
        cuerocurtido: { name: 'Cuero curtido', desc: '+1 de armadura (6% menos de daño) por nivel.', max: 3, cost: 250, icon: 'poncho' },
        pulso: { name: 'Pulso firme', desc: 'Las armas recargan 3% más rápido por nivel.', max: 4, cost: 220, icon: 'mate' },
        brazo: { name: 'Brazo largo', desc: '+5% de área por nivel.', max: 4, cost: 180, icon: 'ojo' },
        caballo: { name: 'Buen caballo', desc: '+5% de velocidad por nivel.', max: 3, cost: 160, icon: 'espuela' },
        bolsillos: { name: 'Bolsillos grandes', desc: '+20% de imán por nivel.', max: 3, cost: 100, icon: 'iman' },
        baquiania: { name: 'Baquianía', desc: '+6% de experiencia por nivel.', max: 5, cost: 180, icon: 'luna' },
        codicia: { name: 'Codicia', desc: '+15% de oro por nivel.', max: 5, cost: 90, icon: 'oro' },
        matediario: { name: 'Mate diario', desc: '+0,2 de vida por segundo por nivel.', max: 3, cost: 200, icon: 'caldo' },
        otramano: { name: 'Otra mano', desc: '+1 cambio de opciones por partida.', max: 3, cost: 260, icon: 'tientos' },
        descarte: { name: 'Descarte', desc: '+1 descarte de opciones por partida.', max: 3, cost: 260, icon: 'boleadoras' },
        segunda: { name: 'Segunda vida', desc: 'Una vez por partida revivís con media vida.', max: 1, cost: 1500, icon: 'asado' }
      };
      const shopLvl = id => SAVE.shop[id] || 0;
      function shopCost(id) { let tot = 0; for (const k in SAVE.shop) tot += SAVE.shop[k]; return Math.round(SHOP[id].cost * (1 + shopLvl(id)) * (1 + .06 * tot)); }
      const ACH = [
        { id: 'min5', name: 'Primera noche', desc: 'Aguantá 5 minutos en cualquier mapa.', reward: 'Personaje: Tormentera', test: r => r.t >= 300 },
        { id: 'min10', name: 'Baqueano de ley', desc: 'Aguantá 10 minutos en la Estepa.', reward: 'Mapa: Glaciar', test: r => r.map === 'estepa' && r.t >= 600 },
        { id: 'win', name: 'Amanecer', desc: 'Sobreviví los 15 minutos en cualquier mapa.', reward: 'Modo Noche cerrada', test: r => r.win },
        { id: 'lvl20', name: 'Curtido', desc: 'Llegá al nivel 20 en una partida.', reward: 'Arma: Trabuco', test: r => r.level >= 20 },
        { id: 'kills1000', name: 'Mil almas', desc: 'Derrotá 1000 enemigos en una partida.', reward: 'Arma: Guitarra criolla', test: r => r.kills >= 1000 },
        { id: 'chests10', name: 'Cofre lleno', desc: 'Abrí 10 cofres en total.', reward: 'Arma: Pava hirviendo', test: () => SAVE.stats.chests >= 10 },
        { id: 'evo1', name: 'Evolución', desc: 'Evolucioná cualquier arma.', reward: 'Arma: Lanza', test: () => SAVE.stats.evos >= 1 },
        { id: 'boss1', name: 'Cazador', desc: 'Derrotá a un jefe.', reward: '300 de oro', gold: 300, test: () => SAVE.stats.bosses >= 1 },
        { id: 'combo500', name: 'Frenesí', desc: 'Hacé un combo de 500.', reward: '500 de oro', gold: 500, test: r => r.combo >= 500 },
        { id: 'kills10k', name: 'Leyenda', desc: 'Derrotá 10.000 enemigos en total.', reward: 'Personaje: Rastreadora', test: () => SAVE.stats.kills >= 10000 },
        { id: 'glaciar10', name: 'Pies de hielo', desc: 'Aguantá 10 minutos en el Glaciar.', reward: 'Personaje: Payador', test: r => r.map === 'glaciar' && r.t >= 600 },
        { id: 'domador', name: 'Domador', desc: 'Amansá 5 caballos o guanacos en total.', reward: '400 de oro', gold: 400, test: () => (SAVE.stats.rides || 0) >= 5 },
        { id: 'ojoCazador', name: 'Ojo de cazador', desc: 'Derrotá 3 jefes en total.', reward: 'Personaje: Cazador', test: () => SAVE.stats.bosses >= 3 },
        { id: 'lanzaBola', name: 'Lanza y boleadora', desc: 'Sobreviví hasta el amanecer con la Pialadora.', reward: 'Personaje: Lancero tehuelche', test: r => r.win && r.char === 'pialadora' },
        { id: 'curar', name: 'Manos que curan', desc: 'Aguantá 10 minutos con la Rastreadora.', reward: 'Personaje: Curandero', test: r => r.char === 'rastreadora' && r.t >= 600 },
        { id: 'manas', name: 'Mañas viejas', desc: 'Aguantá 10 minutos con el Baqueano.', reward: 'Personaje: Paisano Viejo', test: r => r.char === 'baqueano' && r.t >= 600 },
        { id: 'fogonero', name: 'Fogón de ley', desc: 'Prepará 10 comidas en el fogón del Puesto.', reward: 'Personaje: Puestero viejo', pu: true, test: () => (SAVE.stats.cooked || 0) >= 10 },
        { id: 'patron', name: 'Patrón', desc: 'Construí el corral grande en el Puesto.', reward: 'Personaje: Estanciero', pu: true, test: () => SAVE.puesto && SAVE.puesto.corral >= 2 },
        { id: 'pulperia', name: 'Noche de pulpería', desc: 'Sobreviví hasta el amanecer con el Cuchillero.', reward: 'Personaje: Borracho', test: r => r.win && r.char === 'cuchillero' },
        { id: 'hyperwin', name: 'Noche cerrada', desc: 'Sobreviví 15 minutos en Noche cerrada.', reward: '1000 de oro', gold: 1000, test: r => r.win && r.hyper }
      ];
      const ARCANAS = {
        anchoEspadas: { name: 'Ancho de espadas', suit: 'espada', num: 1, desc: 'Facones, perdigones y lanzas rebotan hacia otro enemigo cuando terminan.' },
        anchoBastos: { name: 'Ancho de bastos', suit: 'basto', num: 1, desc: 'Los enemigos que salen despedidos lastiman a los que chocan.' },
        sieteEspadas: { name: 'Siete de espadas', suit: 'espada', num: 7, desc: '15% de probabilidad de golpe crítico que hace 2,5 veces el daño.' },
        sieteOros: { name: 'Siete de oros', suit: 'oro', num: 7, desc: '+25% de oro, y cada moneda también te da experiencia.' },
        cuatroCopas: { name: 'Cuatro de copas', suit: 'copa', num: 4, desc: 'Caen más asados, curan el doble y cada uno suma 5 de vida máxima.' },
        caballoBastos: { name: 'Caballo de bastos', suit: 'basto', num: 11, desc: 'El dash recarga 40% más rápido y deja un rastro de fuego.' },
        sotaOros: { name: 'Sota de oros', suit: 'oro', num: 10, desc: 'Cada vez que subís de nivel sale una onda que empuja y daña.' },
        reyEspadas: { name: 'Rey de espadas', suit: 'espada', num: 12, desc: '+1 proyectil para todas las armas, pero recargan 15% más lento.' }
      };
      const PWG = { id: 'grieta', evo: false }, PWB = { id: 'bastos', evo: false }, PWF = { id: 'fuego', evo: false }, PWS = { id: 'sota', evo: false };
      const LORE = {
        sombra: { where: 'Estepa', desc: 'Restos de oscuridad que se juntan cuando cae la noche. Solas no asustan; en manada, sí.' },
        anima: { where: 'Estepa y Glaciar', desc: 'Almas en pena que vagan por el campo. La tradición rural dice que hay que rezarles, no pelearlas.' },
        calavera: { where: 'Estepa y Glaciar', desc: 'Huesos de viajeros que nunca llegaron. Se arrastran hacia el calor de los vivos.' },
        lobizon: { where: 'Estepa', desc: 'El séptimo hijo varón, que se transforma en las noches de luna llena. Pesado y difícil de mover.' },
        bruja: { where: 'Estepa', desc: 'Aprendió sus artes en la cueva de la Salamanca. Prefiere atacar de lejos.' },
        chonchon: { where: 'Glaciar', desc: 'Cabeza de brujo que vuela usando las orejas como alas. Su grito anuncia desgracias.' },
        cuero: { where: 'Glaciar', desc: 'Criatura de lagos y ríos del sur, como un cuero de vaca estirado con garras en el borde. Envuelve a sus presas.' },
        basilisco: { where: 'Glaciar', desc: 'El basilisco chilote nace de un huevo de gallo: mitad gallo, mitad serpiente. Escupe desde lejos.' },
        caleuche: { where: 'Glaciar (jefe)', desc: 'Barco fantasma de Chiloé tripulado por brujos. Navega iluminado entre la niebla y larga ánimas a bordo.' },
        bandurria: { where: 'Bosque andino', desc: 'Ave de pico curvo que anda en bandada. De noche, algo las espanta y vuelan en contra de todo.' },
        chancho: { where: 'Bosque andino', desc: 'Chanchos que se escaparon de los puestos y se hicieron monte. Andan en piara y no le temen a nada.' },
        puma: { where: 'Bosque andino', desc: 'El león de la cordillera. Acecha quieto y salta de golpe, corto y rápido.' },
        jabali: { where: 'Bosque andino', desc: 'Lo trajeron para cazar y se adueñó del bosque. Se frena, raspa la tierra y embiste en línea recta.' },
        cuchivilu: { where: 'Bosque andino (jefe)', desc: 'Mitad chancho, mitad serpiente, de los mitos mapuches de lagos y mallines. Llama a la piara cuando lo apuran.' },
        mandinga: { where: 'Cualquier mapa, al llegar el amanecer', desc: 'El diablo del campo, que ofrece pactos a los paisanos. Antes del amanecer sale a cobrarse la noche; si lo tumbás, los que vienen después no se dejan vencer: solo queda huirles.' }
      };
      const hasAch = id => !!SAVE.ach[id];
      const unlocked = lock => !lock || hasAch(lock);
      const achById = id => ACH.find(a => a.id === id);


