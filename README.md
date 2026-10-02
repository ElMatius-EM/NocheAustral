# Noche Austral — código fuente

El juego se sigue publicando como **un solo archivo** (`dist/index.html`). El código se edita en `src/` y se arma con:

```
python build.py            # arma dist/index.html
python build.py --watch    # rearma solo al guardar cambios
```

No usa dependencias. Todo el JS se concatena en orden de nombre dentro de un único IIFE, así que los archivos comparten el mismo scope, como antes: no hay `import`/`export`. **El orden importa**: un archivo puede usar al cargarse lo que definieron los anteriores (las funciones se pueden llamar desde cualquier lado).

## Mapa de archivos

| Archivo | Qué tiene |
|---|---|
| `src/index.html` | Marcado de menús, HUD y overlays (con los marcadores `@css` y `@js`) |
| `css/00-fuentes.css` | Pixelify Sans embebida |
| `css/10-estilos.css` | Todos los estilos |
| `00-base` | Canvas, `$`, `rnd`, `clamp`, resize |
| `01-audio` | Web Audio, efectos y música |
| `02-datos` | `ETYPES`, `WAVES`, `PASSIVES`, `WEAPONS`, `CHARS`, `ARCANAS`, `BAL` |
| `03-mapas` | `MAPS`, oleadas por mapa y biomas de las regiones (`bioMix`, `MAP`, `MAPR`) |
| `04-guardado-logros` | `SAVE`, Tienda, lista de logros (`ACH`) |
| `05-iconos` | Íconos procedurales |
| `06-sprites` | `PixBuf`, `pixSprite`, sprites de personajes y enemigos |
| `07-sprites-mundo` | Obstáculos, pickups, proyectiles |
| `08-sprites-cartas` | Baraja española |
| `09-estado` | `newGame`, spatial hash, obstáculos del mundo |
| `10-spawns` | `spawnEnemy`, eventos, hordas, grietas |
| `11-combate` | `hurt`, `kill`, golpes, números de daño (agregador) |
| `12-niveles-cartas` | Subir de nivel, cofres, cartas de truco |
| `13-update` | Loop de la partida (`update`), dash |
| `14-render` | Dibujo del mundo |
| `15-hud` | HUD, pausa, `checkAch`, fin de partida |
| `16-menus` | Navegación y menús |
| `17-galeria` | Galería de sprites |
| `18-titulo` | Pantalla de título, modo prueba |
| `19-input` | Teclado y joystick |
| `20-monturas` | Caballos y guanacos, jineteada |
| `21-puesto-progresion` | Materiales, Ñire, fragua, corral, obras (y constantes del campo) |
| `22-campo` | Recorrer el campo |
| `23-fin-de-partida` | Fama, materiales, `bankRun`, silbido |
| `24-puesto-escena` | Estaciones del Puesto, movimiento e interacción |
| `25-puesto-sprites` | Sprites y dibujo de la escena del Puesto |
| `26-puesto-paneles` | Paneles del Puesto |
| `27-puesto-eventos` | Eventos del Puesto |
| `28-mundo-vivo` | Terreno, mallines, marcas, animitas, fauna |
| `29-luz` | Iluminación nocturna |
| `30-ambiente` | Viento de fondo |
| `30b-campo-kit` | Recorrer el campo: herramientas (cuchillo, hacha, lazo), tala y fauna |
| `31-loop` | `frame()` y arranque |

Para agregar un archivo nuevo, ponele un número que lo ubique después de lo que usa al cargarse.

## Rendimiento

En el peor caso (cientos de enemigos y muchas armas) la lógica (`update`) cuesta poco; lo caro es la cantidad de llamadas al canvas. En `14-render` hay ayudas para dibujar en lote y conviene usarlas en código nuevo de dibujo:

- `wSet(x, y, sx, sy, rot)` pone la transformación de un objeto con un solo `setTransform` (sin `save`/`restore`); `wReset()` vuelve a la matriz del mundo. Solo valen dentro de `drawWorld`.
- `mkBatch()` agrupa por color y opacidad para hacer un `fill` por grupo (partículas, huellas).
- `dotSpr`, `zoneSpr`, `trailSpr`: degradados y resplandores horneados una vez, en vez de crearlos cada frame.
- Números de daño: atlas de dígitos (`drawTxt`), sin `fillText`/`strokeText` por número.

En `00-base`, `RES_K` es la resolución dinámica (`31-loop` la baja si el promedio pasa de ~21 ms por frame) y `PART_K` escala los topes de partículas según la calidad.

Mundo (lo que más pesa al caminar, aunque haya pocos enemigos):

- Terreno (`28-mundo-vivo`): los ruidos se calculan en una grilla gruesa y se interpolan; cada chunk se arma de a filas en segundo plano (`chunkJob`/`chunkRows`, tope de ~2,5 ms por frame) priorizando hacia donde se mueve el jugador.
- Decoración del suelo (`14-render`, `decorChunk`): la lista de pasto/piedras/juncos se calcula una vez por zona de 3x3 baldosas. En pantallas táctiles y con calidad reducida se hornea en una imagen por zona (el pasto no se mece; los brillos del agua sí).
- Sprites: la versión de destello (`flash`) se arma recién cuando se pide, y `prewarmObs` crea como mucho un sprite de obstáculo por frame antes de que entre en pantalla.

Para medir: `python tools/bench.py` (ver el encabezado del archivo).
