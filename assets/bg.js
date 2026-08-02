// 全屏模糊动态背景 —— 仿 lvy-neko 的 canvas blob 动画
// 几个柔和的色块在画布上缓慢漂浮，外层用 CSS filter:blur(50px) 营造光晕感
(() => {
  const canvas = document.querySelector('canvas[data-bg]');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const COLORS = ['#c27a3a', '#d4944f', '#a56427', '#e0b07a', '#c27a3a'];
  let blobs = [];
  let w, h;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.width = innerWidth * dpr;
    h = canvas.height = innerHeight * dpr;
    canvas.style.width = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function makeBlobs() {
    const count = innerWidth < 768 ? 4 : 6;
    blobs = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: 180 + Math.random() * 220,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      color: COLORS[i % COLORS.length],
    }));
  }

  function step() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const b of blobs) {
      b.x += b.vx;
      b.y += b.vy;
      if (b.x < -b.r) b.x = innerWidth + b.r;
      if (b.x > innerWidth + b.r) b.x = -b.r;
      if (b.y < -b.r) b.y = innerHeight + b.r;
      if (b.y > innerHeight + b.r) b.y = -b.r;

      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
      g.addColorStop(0, b.color + 'cc');
      g.addColorStop(1, b.color + '00');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.fill();
    }
    requestAnimationFrame(step);
  }

  resize();
  makeBlobs();
  step();
  window.addEventListener('resize', () => { resize(); makeBlobs(); });
})();
