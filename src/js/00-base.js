      const $ = id => document.getElementById(id);
      const cv = $('c'), cx = cv.getContext('2d');
      const TAU = Math.PI * 2;
      const rnd = (a, b) => a + Math.random() * (b - a);
      const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const FONT = '"Pixelify Sans","Trebuchet MS",sans-serif';

      let W = 0, H = 0, DPR = 1, ZOOM = 1, vignette = null, GFX_LOW = false;
      // RES_K: resolución dinámica (31-loop la baja si el equipo no sostiene ~48 fps). PART_K: tope de partículas según la calidad
      let RES_K = 1, PART_K = 1;
      // modo de prueba (?dev en la URL): ver 32-dev.js. Acá solo se declara para que el resto del código pueda consultarlo
      const DEV = new URLSearchParams(location.search).has('dev') ? { god: true, off: new Set() } : null;
      function resize() {
        // en gráficos bajos se dibuja a 1 píxel por píxel CSS: en pantallas de alta densidad es 4 veces menos trabajo
        // si la resolución dinámica baja de 1x se salta directo a 0,5x: escala entera (cada píxel interno = 2x2 de pantalla),
        // nítida con image-rendering: pixelated y con 4 veces menos píxeles que 1x
        const d = (GFX_LOW ? 1 : Math.min(window.devicePixelRatio || 1, 2)) * RES_K;
        DPR = d >= 1 ? d : .5;
        cv.style.imageRendering = DPR < 1 ? 'pixelated' : '';
        PART_K = GFX_LOW ? .45 : RES_K < 1 ? .7 : 1;
        W = window.innerWidth; H = window.innerHeight;
        cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
        ZOOM = clamp(Math.min(W, H) / 620, 0.62, 1.1);
        vignette = document.createElement('canvas');
        vignette.width = Math.max(2, Math.round(W / 2)); vignette.height = Math.max(2, Math.round(H / 2));
        const g = vignette.getContext('2d'), vw = vignette.width, vh = vignette.height, r = Math.hypot(vw, vh) / 2;
        const gr = g.createRadialGradient(vw / 2, vh / 2, r * .3, vw / 2, vh / 2, r);
        gr.addColorStop(0, 'rgba(8,10,26,0)'); gr.addColorStop(1, 'rgba(8,10,26,.78)');
        g.fillStyle = gr; g.fillRect(0, 0, vw, vh);
      }
      window.addEventListener('resize', resize); resize();

