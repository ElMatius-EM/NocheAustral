      /* ---------------- HUD / UI ---------------- */
      const hud = { last: {} };
      const fmt = t => { t = Math.floor(t); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); };
      function setIf(id, prop, val) { if (hud.last[id + prop] !== val) { hud.last[id + prop] = val; if (prop === 'w') $(id).style.width = val; else if (prop === 'bg') $(id).style.background = val; else $(id).textContent = val; } }
      function updateHUD() {
        if (!S) return;
        setIf('xpfill', 'w', (S.xp / S.xpNext * 100).toFixed(1) + '%');
        setIf('lvl', 't', S.mode === 'campo' ? MAT_KEYS.map(m => MATS[m].name.charAt(0).toUpperCase() + MATS[m].name.slice(1) + ' ' + (S.mat[m] || 0)).join(' · ') : 'Nivel ' + S.level);
        setIf('timer', 't', fmt(S.t));
        const cm = S.comida, cmOn = !!(cm && !cm.done && S.state !== 'end');
        if (hud.last.cmOn !== cmOn) { hud.last.cmOn = cmOn; $('comidaB').classList.toggle('on', cmOn); }
        if (cmOn) {
          if (hud.last.cmId !== cm.id) { hud.last.cmId = cm.id; const R = FOGON_REC[cm.id]; $('comidaI').src = recURL(cm.id); $('comidaB').title = R.name + ': ' + R.fx; }
          const left = cm.until - S.t; setIf('comidaT', 't', fmt(Math.ceil(left))); if (hud.last.cmLow !== (left < 30)) { hud.last.cmLow = left < 30; $('comidaB').classList.toggle('low', left < 30); }
        }
        setIf('kills', 't', '☠ ' + S.kills);
        setIf('goldN', 't', String(S.gold));
        const br = S.bossRef, bOn = !!(br && !br.dead && br.elite && S.state !== 'end');
        if (hud.bossOn !== bOn) { hud.bossOn = bOn; $('bossbar').classList.toggle('on', bOn); }
        if (bOn) { const cap = t => t.charAt(0).toUpperCase() + t.slice(1), nm = br.boss ? cap(MAP().bossName) : br.mini ? cap(MAP().miniName) : ETYPES[br.type].name + ' élite'; setIf('bossName', 't', nm); setIf('bossFill', 'w', (clamp(br.hp / br.maxHp, 0, 1) * 100).toFixed(1) + '%'); }
        const on = S.combo >= 5 && S.state !== 'end';
        if (hud.comboOn !== on) { hud.comboOn = on; $('combo').classList.toggle('on', on); }
        if (on) { setIf('comboN', 't', '×' + S.combo); setIf('cbar', 'w', (clamp(S.comboT / 2.2, 0, 1) * 100).toFixed(0) + '%'); }
        if (hud.pop) { hud.pop = false; const n = $('comboN'); n.classList.remove('pop'); void n.offsetWidth; n.classList.add('pop'); }
        const dc = S.player.dashCD > 0 ? clamp(1 - S.player.dashCD / dashCooldown(), 0, 1) : 1;
        setIf('dashBtn', 'bg', dc >= 1 ? 'rgba(201,164,92,.35)' : `conic-gradient(rgba(201,164,92,.35) ${Math.round(dc * 360)}deg, rgba(20,27,45,.8) 0)`);
        if (S.invDirty) {
          S.invDirty = false;
          $('invW').innerHTML = S.weapons.map(w => `<div class="slot${w.evo ? ' evo' : ''}" title="${w.evo ? WEAPONS[w.id].evoName : WEAPONS[w.id].name}">${w.evo ? WEAPONS[w.id].evoIcon : WEAPONS[w.id].icon}<b>${w.evo ? '★' : w.lvl}</b></div>`).join('');
          $('invA').innerHTML = [...S.arc].map(k => `<div class="slot arcs_" title="${ARCANAS[k].name}"><img class="ico" src="${cardURL(k)}" alt=""></div>`).join('');
          $('invP').innerHTML = S.passives.map(p => `<div class="slot pas" title="${PASSIVES[p.id].name}">${PASSIVES[p.id].icon}<b>${p.lvl}</b></div>`).join('');
        }
      }
      let bannerTO = 0;
      function banner(txt) { const b = $('banner'); b.textContent = txt; b.classList.add('on'); clearTimeout(bannerTO); bannerTO = setTimeout(() => b.classList.remove('on'), 2800); }
      function show(id) { $(id).classList.add('on'); if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }
      function hide(id) { $(id).classList.remove('on'); }

      function statsHTML() {
        const r = [['Vida', `${Math.ceil(S.player.hp)} / ${Math.round(ST.maxHp)}`], ['Daño', `${Math.round(ST.might * 100)}%`], ['Área', `${Math.round(ST.area * 100)}%`],
        ['Recarga', `${Math.round(ST.cd * 100)}%`], ['Duración', `${Math.round(ST.dur * 100)}%`], ['Proyectiles extra', `+${ST.amount}`],
        ['Velocidad', `${Math.round(ST.speed)}`], ['Armadura', `${ST.armor} (−${Math.round(armorRed() * 100)}%)`], ['Regeneración', `${ST.regen.toFixed(1)}/s`], ['Imán', `${Math.round(ST.magnet)}`]];
        return r.map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join('');
      }
      function pause() {
        if (!S || S.state !== 'play') return;
        S.state = 'pause'; joy = null;
        $('pstats').innerHTML = statsHTML();
        $('pinv').innerHTML = S.weapons.map(w => { const d = WEAPONS[w.id]; return `<div class="card${w.evo ? ' evo' : ''}"><span class="ci">${w.evo ? d.evoIcon : d.icon}</span><span class="ct"><strong>${w.evo ? d.evoName : d.name}<span>${w.evo ? 'evolucionada' : 'nivel ' + w.lvl}</span></strong><small>${w.evo ? d.evoDesc : d.desc}</small><em>Evoluciona con ${PASSIVES[d.evoWith].icon} ${PASSIVES[d.evoWith].name}</em></span></div>`; }).join('') + [...S.arc].map(k => `<div class="card"><span class="ci"><img class="ico" style="width:26px;height:39px" src="${cardURL(k)}" alt=""></span><span class="ct"><strong>${ARCANAS[k].name}<span>carta</span></strong><small>${ARCANAS[k].desc}</small></span></div>`).join('');
        $('mute').textContent = muted ? 'Activar sonido' : 'Silenciar';
        $('quit').textContent = S.mode === 'campo' ? 'Volver al Puesto' : 'Abandonar partida';
        show('pauseOv');
      }
      function resume() { if (!S || S.state !== 'pause') return; hide('pauseOv'); S.state = 'play'; }
      $('pauseBtn').addEventListener('click', () => { if (S && S.state === 'play') pause(); else resume(); });
      $('resume').addEventListener('click', resume);
      $('mute').addEventListener('click', () => { muted = !muted; $('mute').textContent = muted ? 'Activar sonido' : 'Silenciar'; });
      $('quit').addEventListener('click', () => { hide('pauseOv'); if (S && S.mode === 'campo') endCampo('pausa'); else endGame(false, true); });

      function runCtx() { return { t: S.t, map: S.map, win: S.won, level: S.level, kills: S.kills, combo: S.comboBest, hyper: S.hyper, char: S.char }; }
      function checkAch() {
        if (!S) return;
        const r = runCtx();
        for (const a of ACH) {
          if (SAVE.ach[a.id]) continue;
          let ok = false; try { ok = a.test(r); } catch (e) { }
          if (ok) {
            SAVE.ach[a.id] = true; if (a.gold) SAVE.gold += a.gold; S.newAch.push(a);
            banner('Logro: ' + a.name + '. ' + a.reward);
            sfx(784, .15, 'triangle', .05); setTimeout(() => sfx(1047, .25, 'triangle', .05), 120);
            writeSave();
          }
        }
      }
      function endGame(win, quit) {
        S.state = 'end'; joy = null;
        if (win && !S.won) { const bonus = Math.round(200 * ST.greed); S.gold += bonus; }
        if (win) S.won = true;
        const M = MAP();
        SAVE.gold += S.gold - S.goldBanked; S.goldBanked = S.gold;
        if (!S.counted) { S.counted = true; SAVE.stats.runs++; }
        const bk = S.map + (S.hyper ? '-h' : ''); SAVE.stats.best[bk] = Math.max(SAVE.stats.best[bk] || 0, Math.floor(S.t));
        const post = S.endless ? Math.floor(S.t - 900) : 0; if (post > 0) SAVE.stats.best[bk + '-post'] = Math.max(SAVE.stats.best[bk + '-post'] || 0, post);
        checkAch(); writeSave();
        if (!win) musicStop();
        $('endTitle').textContent = win ? M.txt.win : quit ? 'Partida abandonada' : 'La noche te ganó';
        $('endSub').textContent = win ? 'Aguantaste los quince minutos. Podés seguir, pero el Mandinga sale a cazarte.' :
          (S.endless ? 'El Mandinga te alcanzó.' : 'El oro, los materiales y la fama quedan guardados para el Puesto.');
        $('estats').innerHTML = [['Mapa', M.name + (S.hyper ? ' (Noche cerrada)' : '')], ['Tiempo', fmt(S.t)], ['Nivel', S.level], ['Enemigos', S.kills], ['Mejor combo', S.comboBest], ...(S.endless ? [['Después del amanecer', fmt(Math.max(0, S.t - 900)) + ' (récord ' + fmt(SAVE.stats.best[bk + '-post'] || 0) + ')']] : []), ['Oro juntado', '+' + S.gold], ['Oro total', SAVE.gold]].map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join('');
        const rows = S.weapons.map(w => ({ w, d: S.dmgBy[w.id] || 0 })).sort((a, b) => b.d - a.d);
        $('estats').innerHTML += bankRun().map(([a, b]) => `<span>${a}</span><span>${b}</span>`).join(''); writeSave();
        $('etable').innerHTML = rows.map(({ w, d }) => { const W_ = WEAPONS[w.id]; return `<tr><td>${w.evo ? W_.evoIcon : W_.icon} ${w.evo ? W_.evoName : W_.name}</td><td>${w.evo ? '★' : 'Nv ' + w.lvl}</td><td>${Math.round(d).toLocaleString('es-AR')}</td></tr>`; }).join('')
          + (S.dmgBy.jinete ? `<tr><td>🐎 Montado</td><td>—</td><td>${Math.round(S.dmgBy.jinete).toLocaleString('es-AR')}</td></tr>` : '');
        $('eachs').innerHTML = S.newAch.length ? '<div class="subh">Logros nuevos</div><div class="cards">' + S.newAch.map(a => `<div class="card done"><span class="ct"><strong>${a.name}</strong><small>${a.reward}</small></span></div>`).join('') + '</div>' : '';
        $('cont').style.display = win ? '' : 'none';
        hide('lvlOv'); hide('chestOv'); hide('arcOv'); CA.timers.forEach(clearTimeout); CA.done = true;
        show('endOv');
        if (!win) sfx(160, .8, 'sawtooth', .06, .3);
      }
      $('cont').addEventListener('click', () => { hide('endOv'); S.endless = true; S.state = 'play'; S.nextMandinga = S.t; });
      function backToMenu(view) {
        if (!S || S.state !== 'end') return;
        hide('endOv'); $('hud').classList.remove('on'); $('dashBtn').classList.remove('on'); $('whBtn').classList.remove('on'); $('combo').classList.remove('on'); hud.comboOn = false; hud.bossOn = false; $('bossbar').classList.remove('on');
        S = null; musicStop(); show('startOv'); go(view);
      }
      $('again').addEventListener('click', () => backToMenu('vChars'));
      $('toMenu').addEventListener('click', () => backToMenu('vMain'));
      $('banish').addEventListener('click', () => { if (!S || S.state !== 'levelup' || S.banishes <= 0) return; S.banishMode = !S.banishMode; renderChoices(); });

