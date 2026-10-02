#!/usr/bin/env python3
"""Banco de pruebas de rendimiento de Noche Austral (no forma parte del juego publicado).

  pip install playwright && playwright install chromium
  python tools/bench.py              # peor caso: 400 enemigos, 10 armas evolucionadas, Tientos 2
  python tools/bench.py --low        # lo mismo con gráficos bajos
  python tools/bench.py --frames 60  # cantidad de frames medidos (por defecto 90)
  python tools/bench.py --src ../vieja/src   # mide otra versión para comparar

Arma una copia del juego con un archivo extra que expone funciones internas, la abre en Chromium headless con
pantalla de celular (412x915, DPR 2) y reporta:
  - llamadas al canvas en un frame (lo que más pesa en un celular: menos es mejor)
  - ms promedio de update y render, y desglose del render por sección

Ojo: Chromium headless rasteriza por software, así que los ms de render dependen sobre todo de la cantidad de píxeles
y sirven para comparar entre versiones, no como fps reales. Los fps reales se miden en el teléfono (Opciones > medidor de FPS).
"""
import argparse, asyncio, json, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'src'

EXPOSE = r'''
      window.__B = { spawnEnemy, recompute, get ST() { return ST }, setLow(v) { GFX_LOW = v; if (typeof RES_K !== 'undefined') RES_K = 1; resize(); } };
      window.__T = {};
      { const wrap = (name, f) => function (...a) { const t = performance.now(); try { return f.apply(this, a); } finally { window.__T[name] = (window.__T[name] || 0) + performance.now() - t; } };
        drawGround = wrap('suelo', drawGround); drawMarks = wrap('marcas', drawMarks); drawWorld = wrap('mundo', drawWorld);
        drawOverlay = wrap('textos', drawOverlay); drawWeather = wrap('clima', drawWeather); }
'''

SETUP = r'''
({ low }) => {
  Math.random = (() => { let s = 12345; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
  const G = window.__game, B = window.__B;
  G.SAVE.opts.nums = true; B.setLow(low);
  G.newGame('baqueano', 'estepa');
  const S = G.S; S.weapons.length = 0;
  for (const id of ['facon', 'boleadoras', 'fogon', 'relampago', 'cruz', 'trabuco', 'rebenque', 'guitarra', 'pava', 'lanza']) S.weapons.push({ id, lvl: 8, cd: 0, evo: true });
  S.passives.push({ id: 'tientos', lvl: 2 }); B.recompute(); S.t = 600; S.events = [];
  const types = ['sombra', 'anima', 'calavera'];
  window.__top = () => {
    const P = S.player;
    while (S.enemies.length < 400) { const a = Math.random() * 6.283, d = 150 + Math.random() * 350; B.spawnEnemy(types[(Math.random() * 3) | 0], P.x + Math.cos(a) * d, P.y + Math.sin(a) * d); }
    P.hp = 1e9; B.ST.maxHp = 1e9; S.pendingLevels = 0; S.pendingChests = 0; S.state = 'play'; P.x += 1.5;
  };
}
'''

RUN = r'''
({ frames }) => {
  const G = window.__game, S = G.S; let tu = 0, tr = 0; window.__T = {};
  for (let i = 0; i < frames; i++) { window.__top(); const a = performance.now(); G.update(1 / 60); const b = performance.now(); G.render(1 / 60); tu += b - a; tr += performance.now() - b; }
  const T = {}; for (const k in window.__T) T[k] = +(window.__T[k] / frames).toFixed(2);
  return { update: +(tu / frames).toFixed(2), render: +(tr / frames).toFixed(2), secciones: T,
           enemigos: S.enemies.length, proyectiles: S.proj.length, particulas: S.parts.length, textos: S.texts.length };
}
'''

COUNT = r'''
() => {
  const G = window.__game, P = CanvasRenderingContext2D.prototype, c = {}, undo = [];
  for (const k of Object.getOwnPropertyNames(P)) {
    const d = Object.getOwnPropertyDescriptor(P, k);
    if (typeof d.value === 'function') { const f = d.value; P[k] = function (...a) { c[k] = (c[k] || 0) + 1; return f.apply(this, a); }; undo.push(() => P[k] = f); }
    else if (d.set) { Object.defineProperty(P, k, { ...d, set(v) { c['=' + k] = (c['=' + k] || 0) + 1; d.set.call(this, v); } }); undo.push(() => Object.defineProperty(P, k, d)); }
  }
  window.__top(); G.update(1 / 60); G.render(1 / 60);
  undo.forEach(u => u());
  const total = Object.values(c).reduce((a, b) => a + b, 0);
  return { total, top: Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 15) };
}
'''


def build_bench(out, SRC=SRC):
    html = (SRC / 'index.html').read_text(encoding='utf-8')
    css = ''.join(p.read_text(encoding='utf-8') for p in sorted((SRC / 'css').glob('*.css')))
    js = ''.join(p.read_text(encoding='utf-8') for p in sorted((SRC / 'js').glob('*.js'))) + EXPOSE
    out.write_text(html.replace('<!-- @css -->\n', css).replace('<!-- @js -->\n', js), encoding='utf-8')


async def main(a):
    from playwright.async_api import async_playwright
    page_file = Path(tempfile.gettempdir()) / 'noche-austral-bench.html'
    build_bench(page_file, Path(a.src) if a.src else SRC)
    async with async_playwright() as p:
        br = await p.chromium.launch()
        ctx = await br.new_context(viewport={'width': 412, 'height': 915}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs = []; pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto(page_file.as_uri()); await pg.wait_for_timeout(1000)
        if errs: print('Error al cargar:', errs[0]); return
        await pg.evaluate(SETUP, {'low': a.low})
        await pg.evaluate(RUN, {'frames': 20})  # calentamiento (hornea sprites y atlas)
        cnt = await pg.evaluate(COUNT)
        print(f"Llamadas al canvas en un frame: {cnt['total']}")
        for k, v in cnt['top']: print(f'  {v:6} {k}')
        r = await pg.evaluate(RUN, {'frames': a.frames})
        print('Tiempos (ms por frame, rasterizado por software):'); print(json.dumps(r, ensure_ascii=False, indent=2))
        if errs: print('Errores durante la prueba:', errs[:3])
        await br.close()


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--low', action='store_true'); ap.add_argument('--frames', type=int, default=90); ap.add_argument('--src', help='otra carpeta src/ para comparar (por ejemplo, una versión anterior)')
    asyncio.run(main(ap.parse_args()))
