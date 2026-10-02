      /* ---------------- efectos en la partida ---------------- */
      function nireApply(p) {
        if (NI('c2')) p.cd *= .94;
        if (NI('c4a')) { p.might *= 1.15; p.speed *= .9; }
        if (NI('c4b')) p.amount += 1;
        if (NI('h1')) p.regen += .3;
        if (NI('h3')) p.armor += 1;
        if (NI('h4b')) p.maxHp *= 1.25;
        if (NI('p1')) p.greed *= 1.1;
        if (NI('p2')) p.growth *= 1.08;
        if (SAVE.puesto.rancho >= 3) p.greed *= 1.05;
        if (S.comida && !S.comida.done) FOGON_REC[S.comida.id].apply(p);
        const kn = knifeEq();
        p.eliteDmg = 0;
        if (kn) {
          const q = QUAL[kn.q].k;
          if (kn.hoja === 'criolla') p.might *= 1 + .08 * q; else if (kn.hoja === 'caronera') p.area *= 1 + .12 * q; else p.eliteDmg = .2 * q;
          if (kn.cabo === 'hueso') p.regen += .3 * q; else if (kn.cabo === 'guampa') p.speed *= 1 + .08 * q; else p.greed *= 1 + .15 * q;
        }
      }
      function dropMats(e) {
        if (e.prop) return;
        const push = (m, v) => S.picks.push({ type: 'mat', m, v, x: e.x + rnd(-10, 10), y: e.y + rnd(-10, 10), t: 0 });
        if (e.elite && e.type !== 'mandinga') {
          const main = (MAT_DROP[e.type] || ['cuero'])[0];
          push(main, e.boss ? 5 : e.mini ? 3 : 2); push('hierro', e.boss ? 3 : 1);
          if (e.boss) SAVE.trophies[e.type] = 1;
          if (e.mini) SAVE.trophies['mini_' + e.type] = 1;
          return;
        }
        const d = MAT_DROP[e.type]; if (d && Math.random() < d[1]) push(d[0], 1);
      }
      function runFama() {
        if (!S) return 0;
        return Math.floor(S.t / 60) + S.eliteK + S.miniK * 2 + S.bossK * 4 + (S.won ? 5 : 0) + (SAVE.puesto.rancho >= 3 ? 2 : SAVE.puesto.rancho >= 2 ? 1 : 0);
      }
      /* se llama al terminar la partida; guarda solo lo nuevo (el modo sin fin puede terminar más de una vez) */
      function bankRun() {
        const rows = [];
        const mk = NI('p4b') ? 1.5 : 1, got = [];
        for (const m of MAT_KEYS) { const v = Math.floor((S.mat[m] || 0) * mk) - (S.matBanked[m] || 0); if (v > 0) { SAVE.mat[m] += v; S.matBanked[m] = (S.matBanked[m] || 0) + v; } if (S.matBanked[m]) got.push(matIco(m) + S.matBanked[m]); }
        rows.push(['Materiales', got.length ? got.join(' ') : '—']);
        const f = runFama() - S.famaGiven; if (f > 0) { SAVE.fama += f; S.famaGiven += f; }
        rows.push(['Fama', famaIco + ' ' + S.famaGiven]);
        if (S.won) SAVE.trophies.amanecer = 1;
        if (S.endless && S.t - (S.dawnT || 900) >= 120) SAVE.trophies.mandinga = 1;
        if (S.tamed && !S.horseKept) {
          if (S.t < 300) rows.push(['Caballo', 'Se te escapó: aguantá 5 minutos para arriarlo']);
          else if (!corralCap()) rows.push(['Caballo', 'Construí el corral en el Puesto para quedártelo']);
          else if (SAVE.horses.length >= corralCap()) rows.push(['Caballo', 'El corral está lleno']);
          else { SAVE.horses.push({ pelaje: S.tamed.pelaje, rasgo: S.tamed.rasgo, lvl: 1 }); S.horseKept = true; rows.push(['Caballo', horseName(S.tamed) + ' quedó en tu corral']); }
        }
        return rows;
      }
      /* silbido: una vez por partida llega tu caballo del corral, ya amansado */
      function whistle() {
        if (S && S.state === 'play' && S.mode === 'campo' && S.ride) { dismount(); return; }
        if (!S || S.state !== 'play' || S.whistled || S.ride) return;
        const h = SAVE.horses[SAVE.horse]; if (!h) { if (!S.whistleTip) { S.whistleTip = true; banner('No tenés caballo elegido en el corral'); } return; }
        S.whistled = S.mode !== 'campo'; const P = S.player;
        sfx(1500, .12, 'sine', .04, 1.3); setTimeout(() => sfx(1900, .2, 'sine', .04, .8), 130);
        banner('Silbaste: llega tu ' + horseName(h).toLowerCase());
        later(.6, () => { if (!S || S.ride) return; startRide({ kind: 'caballo', key: 'propio', x: P.x, y: P.y, vx: P.vx, vy: P.vy, pelaje: h.pelaje, rasgo: h.rasgo, lvl: h.lvl, own: true, r: MOUNTS.caballo.r }); });
      }

