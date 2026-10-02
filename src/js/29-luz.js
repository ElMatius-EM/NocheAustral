      /* ---------------- hora de la noche ----------------
         La oscuridad nocturna (capa de luces) se sacó por rendimiento: era el mayor costo en la placa de video.
         nightState queda solo como reloj de la noche (los grillos suenan en noche cerrada). */
      function nightState() {
        if (!S) return null;
        const t = S.t; let a = .55 * (S.hyper ? 1.15 : 1);
        if (t < 45) a *= .5 + .5 * t / 45;
        else if (t > 720 && t <= 900) a *= 1 - .8 * (t - 720) / 180;
        else if (t > 900) a *= .2 + .9 * clamp((t - 900) / 45, 0, 1);
        return { a };
      }

      // dibuja un enemigo con su animación. Dentro de drawWorld (BM) usa setTransform directo: sin save/translate/scale/restore
      // destello al recibir un golpe: los comunes no cambian de imagen (el destello blanco de cientos de enemigos era muy
      // caro en el celular); élites y jefes muestran un tinte rojo corto, horneado una vez por cuadro de animación
      function hitImg(e, fr) {
        if (!(e.elite && e.flash > .045)) return fr.img;
        if (!fr.red) {
          const c = document.createElement('canvas'); c.width = fr.img.width; c.height = fr.img.height; const g = c.getContext('2d');
          g.drawImage(fr.img, 0, 0); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(255,40,40,.5)'; g.fillRect(0, 0, c.width, c.height);
          fr.red = c;
        }
        return fr.red;
      }
      function blitEnemy(e, sp, sz, bob) {
        const T = ETYPES[e.type];
        if (sp.frames.length > 1 && T.fly) {
          const fr = sp.frames[((S.t * 9 + e.wob * 4) | 0) % sp.frames.length], rot = clamp((e.mvx || 0) / 140, -1, 1) * .28;
          if (BM) { wSet(e.x, e.y + bob, 1, 1, rot); gA(.9); cx.drawImage(hitImg(e, fr), -sz / 2, -sz / 2, sz, sz); gA(1); return; }
          cx.save(); cx.translate(e.x, e.y + bob); cx.rotate(rot);
          cx.globalAlpha = .9; cx.drawImage(hitImg(e, fr), -sz / 2, -sz / 2, sz, sz); cx.globalAlpha = 1; cx.restore();
        } else if (sp.frames.length > 1) {
          const fz = S.freezeT > 0, fr = sp.frames[fz ? 0 : ((S.t * 8 + e.wob * 3) | 0) % sp.frames.length], sq = fz ? 0 : Math.sin(S.t * 16 + e.wob) * .02, fl = (e.mvx || 0) < -5 ? -1 : 1;
          if (BM) { wSet(e.x, e.y, fl * (1 - sq), 1 + sq, 0); cx.drawImage(hitImg(e, fr), -sz / 2, -sz / 2, sz, sz); return; }
          cx.save(); cx.translate(e.x, e.y); cx.scale(fl * (1 - sq), 1 + sq); cx.drawImage(hitImg(e, fr), -sz / 2, -sz / 2, sz, sz); cx.restore();
        } else { if (BM) wReset(); cx.drawImage(hitImg(e, sp), e.x - sz / 2, e.y - sz / 2 + bob, sz, sz); }
      }
      // capa sobre la oscuridad: números de daño y textos flotantes
      function drawOverlay(sx, sy) {
        const P = S.player;
        cx.save(); cx.translate(W / 2 + sx, H / 2 + sy); cx.scale(ZOOM, ZOOM); cx.translate(-P.x, -P.y);
        if (S.mode === 'campo') drawKitTop();
        drawTexts();
        cx.restore();
      }


