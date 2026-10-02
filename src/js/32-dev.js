      /* ---------------- modo de prueba: ?dev ----------------
         Abre directo una partida avanzada para medir rendimiento y probar el final, sin tocar el guardado:
           ?dev                      estepa, minuto 14 (el Mandinga llega en un minuto), horda llena, invencible
           ?dev&map=glaciar&min=10   otro mapa y otro minuto de arranque (min entre 0 y 14,9)
           ?dev&char=fueguera&low    otro personaje y gráficos bajos
         Panel a la izquierda, debajo de las armas: Dios (invencible sí/no), +30 s, "Al Mandinga" (salta a 14:55) y "Horda" (llena la pantalla).
         Nada se guarda: writeSave queda anulado mientras dure la sesión. */
      if (DEV) {
        writeSave = () => { };
        const q = new URLSearchParams(location.search);
        const mapId = MAPS[q.get('map')] && !MAPS[q.get('map')].region ? q.get('map') : 'estepa';
        const charId = CHARS[q.get('char')] ? q.get('char') : 'baqueano';
        const startMin = clamp(parseFloat(q.get('min')) || 14, 0, 14.9);
        SAVE.opts.fps = true; $('fpsMeter').classList.add('on');
        if (q.has('low')) { SAVE.opts.gfx = 'bajo'; GFX_LOW = true; resize(); }

        // build de mitad de partida avanzada: 6 armas (2 evolucionadas) y algunos pasivos
        const BUILD = { weapons: [['cruz', 8, true], ['relampago', 8, true], ['fogon', 7, false], ['rebenque', 6, false], ['boleadoras', 6, false], ['facon', 5, false]],
          passives: [['yerba', 3], ['mate', 3], ['tientos', 1], ['ojo', 2], ['corazon', 2]] };

        // llena la pantalla con la gente del mapa para el minuto actual, repartida alrededor del jugador
        const devHorde = n => {
          const P = S.player, m = minute();
          for (let i = 0; i < n && S.enemies.length < 420; i++) {
            const a = Math.random() * TAU, d = rnd(140, viewR() + 60), x = P.x + Math.cos(a) * d, y = P.y + Math.sin(a) * d;
            const WV = MAPS[bioKey(x, y)].waves; spawnEnemy(pickW(WV[Math.min(m, WV.length - 1)]), x, y);
          }
        };
        const jumpTo = t => {
          S.t = t;
          for (const ev of S.events) if (ev.t < t && ev.type !== 'win') ev.done = true;
          S.weatherNext = Math.max(S.weatherNext || 0, t + 20);
        };

        initAudio(); newGame(charId, mapId);
        S.weapons.length = 0;
        for (const [id, lvl, evo] of BUILD.weapons) if (WEAPONS[id]) { S.weapons.push({ id, lvl, cd: 0, evo }); S.dmgBy[id] = 0; }
        for (const [id, lvl] of BUILD.passives) if (PASSIVES[id]) S.passives.push({ id, lvl });
        S.level = 40; S.xp = 0; S.xpNext = xpNeed(40);
        recompute(); S.player.hp = ST.maxHp;
        jumpTo(startMin * 60);
        devHorde(Math.round(Math.min(8 + startMin * 15 + startMin * startMin * .5, 380) * BAL.dens));
        hide('startOv'); $('hud').classList.add('on'); $('hud').classList.remove('campo'); $('dashBtn').classList.add('on');
        musicStart();
        banner('Modo prueba: invencible, nada se guarda');

        // panel táctil (en el celular no hay teclado)
        const pn = document.createElement('div');
        pn.style.cssText = 'position:fixed;left:6px;top:calc(env(safe-area-inset-top, 0px) + 150px);z-index:9999;display:flex;flex-direction:column;gap:4px;align-items:flex-start;font:12px monospace';
        const btn = (txt, fn) => { const b = document.createElement('button'); b.textContent = txt; b.style.cssText = 'padding:6px 8px;background:#0c1120cc;color:#ecd9a0;border:1px solid #c9a45c;border-radius:4px'; b.addEventListener('click', e => { e.stopPropagation(); fn(b); }); b.addEventListener('pointerdown', e => e.stopPropagation()); pn.appendChild(b); return b; };
        btn('Dios: sí', b => { DEV.god = !DEV.god; b.textContent = 'Dios: ' + (DEV.god ? 'sí' : 'no'); });
        btn('+30 s', () => { if (S && S.state === 'play' && !S.finale) jumpTo(Math.min(S.t + 30, 899)); });
        btn('Al Mandinga', () => { if (S && S.state === 'play' && !S.finale && !S.endless) jumpTo(895); });
        btn('Horda', () => { if (S && S.state === 'play') devHorde(200); });
        document.body.appendChild(pn);
      }
