interface TrailPixel {
  x: number;
  y: number;
  born: number;
  opacity: number;
}

const PIXEL_SIZE = 12;
const FADE_DURATION = 800;
const SPAWN_INTERVAL = 12;
const MIN_DISTANCE = 8;
const INITIAL_OPACITY = 0.55;
const COLOR = '#AA4E7E';

const canvas = document.getElementById('trail') as HTMLCanvasElement | null;
if (canvas) {
  const ctx = canvas.getContext('2d');
  if (ctx) {
    let w: number;
    let h: number;
    let dpr: number;

    function resize() {
      dpr = window.devicePixelRatio || 1;
      w = window.innerWidth;
      h = window.innerHeight;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = w + 'px';
      canvas!.style.height = h + 'px';
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    resize();
    window.addEventListener('resize', resize);

    const pixels: TrailPixel[] = [];
    let mouseX = -100;
    let mouseY = -100;
    let prevX = -100;
    let prevY = -100;
    let hasMoved = false;

    document.addEventListener('mousemove', (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!hasMoved) {
        prevX = mouseX;
        prevY = mouseY;
        hasMoved = true;
      }
    });

    function spawnPixels() {
      const dx = mouseX - prevX;
      const dy = mouseY - prevY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < MIN_DISTANCE) return;

      const steps = Math.max(1, Math.floor(dist / SPAWN_INTERVAL));
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        const x = prevX + dx * t;
        const y = prevY + dy * t;

        const sx = Math.round(x / PIXEL_SIZE) * PIXEL_SIZE;
        const sy = Math.round(y / PIXEL_SIZE) * PIXEL_SIZE;

        pixels.push({
          x: sx,
          y: sy,
          born: performance.now(),
          opacity: INITIAL_OPACITY,
        });
      }

      prevX = mouseX;
      prevY = mouseY;
    }

    function animate(now: number) {
      ctx!.clearRect(0, 0, w, h);
      spawnPixels();

      ctx!.fillStyle = COLOR;

      for (let i = pixels.length - 1; i >= 0; i--) {
        const p = pixels[i];
        const age = now - p.born;

        if (age > FADE_DURATION) {
          pixels.splice(i, 1);
          continue;
        }

        const progress = age / FADE_DURATION;
        const ease = 1 - progress * progress;
        ctx!.globalAlpha = p.opacity * ease;
        ctx!.fillRect(
          p.x - PIXEL_SIZE / 2,
          p.y - PIXEL_SIZE / 2,
          PIXEL_SIZE,
          PIXEL_SIZE,
        );
      }

      ctx!.globalAlpha = 1;
      requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
  }
}
