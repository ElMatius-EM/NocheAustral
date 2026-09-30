      const $ = id => document.getElementById(id);
      const cv = $('c'), cx = cv.getContext('2d');
      const TAU = Math.PI * 2;
      const rnd = (a, b) => a + Math.random() * (b - a);
      const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
      const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const FONT = '"Pixelify Sans","Trebuchet MS",sans-serif';

      let W = 0, H = 0, DPR = 1, ZOOM = 1, vignette = null, GFX_LOW = false;
      function resize() {
        // en gráficos bajos se dibuja a 1 píxel por píxel CSS: en pantallas de alta densidad es 4 veces menos trabajo
        DPR = GFX_LOW ? 1 : Math.min(window.devicePixelRatio || 1, 2);
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

