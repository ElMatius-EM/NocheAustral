      /* ---------------- mapas ---------------- */
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
        }
      };
      const MAP = () => MAPS[S ? S.map : 'estepa'];

