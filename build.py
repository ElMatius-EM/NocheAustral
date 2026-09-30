#!/usr/bin/env python3
"""Arma dist/index.html (un solo archivo, igual al que se juega y publica) a partir de src/.

  python build.py           arma una vez
  python build.py --watch   rearma cada vez que cambia algo en src/

El JS se concatena en orden de nombre (00-, 01-, ...) dentro de un único IIFE con 'use strict',
así que todos los archivos comparten el mismo scope, igual que antes de dividirlo: no hace falta
import/export. El orden importa: un archivo puede usar lo que definieron los anteriores al cargarse.
"""
import sys
import time
from pathlib import Path

ROOT = Path(__file__).parent
SRC, DIST = ROOT / 'src', ROOT / 'docs'


def read(p): return p.read_text(encoding='utf-8').replace('\r\n', '\n')


def build():
    html = read(SRC / 'index.html')
    css = ''.join(read(p) for p in sorted((SRC / 'css').glob('*.css')))
    js = ''.join(read(p) for p in sorted((SRC / 'js').glob('*.js')))
    for tag, body in (('<!-- @css -->\n', css), ('<!-- @js -->\n', js)):
        if html.count(tag) != 1:
            sys.exit(f'falta el marcador {tag.strip()} en src/index.html')
        html = html.replace(tag, body)
    DIST.mkdir(exist_ok=True)
    (DIST / 'index.html').write_text(html, encoding='utf-8')
    return len(html)


def stamp(): return max(p.stat().st_mtime for p in SRC.rglob('*') if p.is_file())


if __name__ == '__main__':
    n = build()
    print(f'dist/index.html listo ({n:,} caracteres)')
    if '--watch' in sys.argv:
        last = stamp()
        print('Mirando src/ (Ctrl+C para salir)')
        while True:
            time.sleep(.5)
            s = stamp()
            if s != last:
                last = s
                try:
                    print(time.strftime('%H:%M:%S'), 'rearmado',
                          f'({build():,} caracteres)')
                except SystemExit as e:
                    print('error:', e)
