      /* ---------------- mapas ---------------- */
      const WAVES3 = [
        { bandurria: 1 },
        { bandurria: 3, chancho: 1 },
        { chancho: 3, bandurria: 2 },
        { chancho: 2, bandurria: 2, puma: 1 },
        { puma: 2, chancho: 3 },
        { jabali: 1, chancho: 3, bandurria: 2 },
        { puma: 2, jabali: 1, anima: 2 },
        { chancho: 4, jabali: 2 },
        { jabali: 2, puma: 2, bandurria: 2 },
        { bandurria: 3, chancho: 3, jabali: 2 },
        { puma: 3, jabali: 2, sombra: 2 },
        { chancho: 4, jabali: 3, puma: 1 },
        { jabali: 4, puma: 3 },
        { bandurria: 3, chancho: 2, jabali: 3, puma: 2 },
        { jabali: 5, puma: 3, chancho: 3 }
      ];
      const WAVES2 = [
        { chonchon: 1 },
        { chonchon: 3, anima: 1 },
        { chonchon: 3, basilisco: 1 },
        { anima: 2, chonchon: 2, cuero: 1 },
        { basilisco: 2, chonchon: 3 },
        { cuero: 2, anima: 2, chonchon: 1 },
        { basilisco: 2, cuero: 1, calavera: 2 },
        { chonchon: 4, cuero: 2 },
        { cuero: 3, basilisco: 2 },
        { anima: 3, chonchon: 3, cuero: 2 },
        { basilisco: 3, cuero: 2, calavera: 2 },
        { chonchon: 4, cuero: 3, basilisco: 1 },
        { cuero: 4, basilisco: 3 },
        { chonchon: 3, anima: 2, cuero: 3, basilisco: 2 },
        { cuero: 5, basilisco: 3, calavera: 3 }
      ];
      const MAPS = {
        estepa: {
          name: 'Estepa', desc: 'Pastizal abierto bajo la luna. Sombras, ánimas, brujas y lobizones.', waves: WAVES,
          bg: '#1c2621', tuft: '#2d3b2e', stone: '#343c3c', spot: '#8a7b4f', bone: '#6b6858', decor: 'grass', ice: false,
          swarm: 'anima', ring: 'calavera', ring2: 'lobizon', rush: 'sombra', elites: ['calavera', 'bruja', 'lobizon'], boss: 'lobizon', bossName: 'el Lobizón Mayor', bossScale: 3, mini: 'bruja', miniName: 'la Bruja de la Salamanca',
          weather: 'viento', obs: ['roca', 'arbusto'],
          txt: { swarm: 'Una bandada de ánimas cruza la estepa', ring: 'Las calaveras te rodean', ring2: 'Doble cerco: calaveras y lobizones', rush: '¡Estampida de sombras!', win: 'Amaneció en la estepa' },
          music: { root: 0, tempo: 104 }
        },
        glaciar: {
          name: 'Glaciar', desc: 'Hielo resbaladizo: te cuesta frenar. Chonchones, cueros, basiliscos y el Caleuche.', waves: WAVES2, lock: 'min10',
          bg: '#1b2633', tuft: '#3a5068', stone: '#43586e', spot: '#d6e6f2', bone: '#6f879e', decor: 'ice', ice: true,
          swarm: 'chonchon', ring: 'chonchon', ring2: 'cuero', rush: 'calavera', elites: ['basilisco', 'cuero', 'cuero'], boss: 'caleuche', bossName: 'el Caleuche', bossScale: 1.5, mini: 'basilisco', miniName: 'el Basilisco Viejo',
          weather: 'ventisca', obs: ['hielo', 'seraque'],
          txt: { swarm: 'Una bandada de chonchones cruza el hielo', ring: 'Los chonchones te rodean', ring2: 'Doble cerco: chonchones y cueros', rush: '¡Avalancha de calaveras!', win: 'Amaneció sobre el glaciar' },
          music: { root: 5, tempo: 96 }
        },
        bosque: {
          name: 'Bosque andino', desc: 'Lengas y coihues al pie de la cordillera, con lluvia fina. Bandurrias, chanchos cimarrones, pumas, jabalíes y el Cuchivilu.', waves: WAVES3, lock: 'min10',
          bg: '#1e2c17', tuft: '#4a7a3c', stone: '#3e4a40', spot: '#c8463a', bone: '#6b6858', decor: 'grass', ice: false, obsN: 4, obsGap: 26, obsW: .75,
          swarm: 'bandurria', ring: 'chancho', ring2: 'puma', rush: 'jabali', elites: ['chancho', 'puma', 'jabali'], boss: 'cuchivilu', bossName: 'el Cuchivilu', bossScale: 2.2, mini: 'puma', miniName: 'el Puma Viejo',
          weather: 'lluvia', obs: ['lenga', 'tronco'],
          txt: { swarm: 'Una bandada de bandurrias se larga del monte', ring: 'Una piara de cimarrones te rodea', ring2: 'Doble cerco: chanchos y pumas', rush: '¡Estampida de jabalíes!', win: 'Amaneció en el bosque' },
          music: { root: 7, tempo: 92 }
        },
        /* región: no tiene enemigos propios; mezcla biomas (otros mapas) según dónde estés */
        patagonia: {
          name: 'Patagonia', desc: 'De la estepa a la cordillera: alejándote del fogón el pastizal da paso al bosque andino y, más allá, al hielo. Cada zona trae sus enemigos.', lock: 'min10',
          region: { biomes: ['estepa', 'bosque', 'glaciar'], cuts: [.44, .58] },
          music: { root: 2, tempo: 100 }
        }
      };
      MAPS.estepa.enter = 'Volvés al pastizal de la estepa';
      MAPS.glaciar.enter = 'El suelo se congela: entrás al glaciar';
      MAPS.bosque.enter = 'Huele a lenga mojada: entrás al bosque';

      /* ---------------- biomas ----------------
         En una región, un ruido de baja frecuencia (escala BIO_SCALE) ordena los biomas como una temperatura:
         cada corte de region.cuts separa uno del siguiente, con una franja de mezcla de ±BIO_BAND.
         Cerca del punto de partida siempre domina el primero. MAP() devuelve el bioma donde está el jugador
         (con histéresis para que no titile en el borde); MAPR() el mapa elegido (nombre, música, récord). */
      const BIO_SCALE = 1500, BIO_BAND = .04;
      const MAPR = () => MAPS[S ? S.map : 'estepa'];
      const MAP = () => MAPS[S ? (S.bio || S.map) : 'estepa'];
      const REGION = () => S && MAPS[S.map] && MAPS[S.map].region;
      // valor de bioma (suave, escala 1500) y su reparto entre biomas; separados para que el terreno pueda interpolar el valor
      function bioN(x, y) {
        const o = S.terrSeed, home = Math.max(0, 1 - Math.hypot(x, y) / 1300) * .45;
        return vnoise(x, y, BIO_SCALE, o + 41) * .75 + vnoise(x, y, BIO_SCALE * .3, o + 43) * .25 - home;
      }
      function bioFromN(n, out, R) {
        R = R || REGION(); const B = R.biomes, C = R.cuts; out = out || [];
        for (let i = 0; i < C.length; i++) {
          if (n < C[i] - BIO_BAND) { out[0] = out[1] = B[i]; out[2] = 0; return out; }
          if (n < C[i] + BIO_BAND) { const t = (n - (C[i] - BIO_BAND)) / (2 * BIO_BAND); out[0] = B[i]; out[1] = B[i + 1]; out[2] = t * t * (3 - 2 * t); return out; }
        }
        out[0] = out[1] = B[B.length - 1]; out[2] = 0; return out;
      }
      function bioMix(x, y) { if (!REGION()) return [S.map, S.map, 0]; return bioFromN(bioN(x, y)); }
      const bioKey = (x, y) => { if (!REGION()) return S.map; const m = bioMix(x, y); return m[2] < .5 ? m[0] : m[1]; };
      // en la franja de mezcla cada píxel elige un bioma (sin colores intermedios): manchas de ruido chico
      // —parches de nieve sobre el pasto— y un poco de tramado 4x4 solo en el borde de cada mancha
      const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
      const bioPick = (m, px, py, x, y) => m[2] > vnoise(x, y, 46, S.terrSeed + 5) * .8 + (BAYER4[(py & 3) * 4 + (px & 3)] + .5) / 16 * .2 ? m[1] : m[0];
      function updateBiome(dt) {
        const P = S.player;
        if (REGION()) {
          const m = bioMix(P.x, P.y); let k = S.bio;
          if (m[0] === m[1]) k = m[0];
          else if (k !== m[0] && k !== m[1]) k = m[2] < .5 ? m[0] : m[1];
          else if (k === m[0] && m[2] > .62) k = m[1];
          else if (k === m[1] && m[2] < .38) k = m[0];
          if (k !== S.bio) {
            S.bio = k; S.weatherNext = Math.max(S.weatherNext, S.t + 8);
            if (S.t - (S.bioBan || -99) > 6) { S.bioBan = S.t; banner(MAPS[k].enter); }
          }
        }
        S.iceK += ((MAP().ice ? 1 : 0) - S.iceK) * Math.min(1, dt * 1.5);
      }

