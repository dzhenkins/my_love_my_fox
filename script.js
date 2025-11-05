window.isDevice = (/android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i
  .test(((navigator.userAgent || navigator.vendor || window.opera)).toLowerCase()));

let loaded = false;

function init() {
  if (loaded) return;
  loaded = true;

  const canvas = document.getElementById('heart');
  const ctx = canvas.getContext('2d');

  const mobile = window.isDevice;
  const rand = Math.random;

  let width, height, dpr;

  function resizeCanvas() {
    dpr = window.devicePixelRatio || 1;
    const koef = mobile ? 0.6 : 1;

    width = Math.floor(window.innerWidth * koef);
    height = Math.floor(window.innerHeight * koef);

    // Фізичні розміри для Retina
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Візуальні CSS-розміри
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";

    ctx.setTransform(1, 0, 0, 1, 0, 0); // скидаємо попередній масштаб
    ctx.scale(dpr, dpr);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, width, height);
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  window.addEventListener('orientationchange', resizeCanvas);

  const heartPosition = rad => [
    Math.pow(Math.sin(rad), 3),
    -(15 * Math.cos(rad) - 5 * Math.cos(2 * rad) - 2 * Math.cos(3 * rad) - Math.cos(4 * rad))
  ];

  const scaleAndTranslate = (pos, sx, sy, dx, dy) => [dx + pos[0] * sx, dy + pos[1] * sy];

  const traceCount = mobile ? 20 : 50;
  const dr = mobile ? 0.3 : 0.1;
  const pointsOrigin = [];

  for (let i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 210, 13, 0, 0));
  for (let i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 150, 9, 0, 0));
  for (let i = 0; i < Math.PI * 2; i += dr)
    pointsOrigin.push(scaleAndTranslate(heartPosition(i), 90, 5, 0, 0));

  const heartPointsCount = pointsOrigin.length;
  const targetPoints = [];

  function pulse(kx, ky) {
    for (let i = 0; i < pointsOrigin.length; i++) {
      targetPoints[i] = [
        kx * pointsOrigin[i][0] + width / 2,
        ky * pointsOrigin[i][1] + height / 2
      ];
    }
  }

  const e = [];
  for (let i = 0; i < heartPointsCount; i++) {
    const x = rand() * width;
    const y = rand() * height;
    e[i] = {
      vx: 0, vy: 0, R: 2, speed: rand() + 5,
      q: ~~(rand() * heartPointsCount),
      D: 2 * (i % 2) - 1,
      force: 0.2 * rand() + 0.7,
      f: `hsla(0,${~~(40 * rand() + 100)}%,${~~(60 * rand() + 20)}%,.3)`,
      trace: Array.from({ length: traceCount }, () => ({ x, y }))
    };
  }

  const config = { traceK: 0.4, timeDelta: 0.01 };
  let time = 0;

  function loop() {
    const n = -Math.cos(time);
    pulse((1 + n) * 0.5, (1 + n) * 0.5);
    time += ((Math.sin(time)) < 0 ? 9 : (n > 0.8) ? 0.2 : 1) * config.timeDelta;
    ctx.fillStyle = "rgba(0,0,0,.1)";
    ctx.fillRect(0, 0, width, height);

    for (let i = e.length; i--;) {
      const u = e[i];
      const q = targetPoints[u.q];
      let dx = u.trace[0].x - q[0];
      let dy = u.trace[0].y - q[1];
      let length = Math.sqrt(dx * dx + dy * dy);

      if (length < 10) {
        if (rand() > 0.95) u.q = ~~(rand() * heartPointsCount);
        else {
          if (rand() > 0.99) u.D *= -1;
          u.q += u.D;
          u.q %= heartPointsCount;
          if (u.q < 0) u.q += heartPointsCount;
        }
      }

      u.vx += -dx / length * u.speed;
      u.vy += -dy / length * u.speed;
      u.trace[0].x += u.vx;
      u.trace[0].y += u.vy;
      u.vx *= u.force;
      u.vy *= u.force;

      for (let k = 0; k < u.trace.length - 1;) {
        const T = u.trace[k];
        const N = u.trace[++k];
        N.x -= config.traceK * (N.x - T.x);
        N.y -= config.traceK * (N.y - T.y);
      }

      ctx.fillStyle = u.f;
      for (let k = 0; k < u.trace.length; k++)
        ctx.fillRect(u.trace[k].x, u.trace[k].y, 1, 1);
    }
    requestAnimationFrame(loop);
  }

  loop();
}

if (document.readyState === 'complete' || document.readyState === 'interactive')
  init();
else
  document.addEventListener('DOMContentLoaded', init);