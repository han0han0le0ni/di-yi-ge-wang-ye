// ===== 基础设置 =====
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- 打字机效果：改这里可换身份文案 ---------- */
const roles = ['AI 的甲方', '边界设定者', '实验记录员', '桌宠人格饲养员'];
const typedEl = document.getElementById('typed');
let roleIndex = 0;
let charIndex = 0;
let deleting = false;

function typeLoop() {
  const word = roles[roleIndex];
  typedEl.textContent = word.slice(0, charIndex);

  if (!deleting && charIndex < word.length) {
    charIndex++;
    setTimeout(typeLoop, 110);
  } else if (!deleting && charIndex === word.length) {
    deleting = true;
    setTimeout(typeLoop, 1600);
  } else if (deleting && charIndex > 0) {
    charIndex--;
    setTimeout(typeLoop, 55);
  } else {
    deleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
    setTimeout(typeLoop, 320);
  }
}

if (typedEl) {
  if (reduceMotion) typedEl.textContent = roles[0];
  else typeLoop();
}

/* ---------- 数字滚动 ---------- */
const counters = document.querySelectorAll('[data-count]');

const countUp = (el) => {
  const target = Number(el.dataset.count);
  const suffix = el.dataset.suffix || '';
  const duration = 1300;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.round(target * eased) + suffix;
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
};

/* ---------- 滚动揭示 ---------- */
const revealEls = document.querySelectorAll('.reveal');
const statsEl = document.querySelector('.stats');

const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    entry.target.classList.add('visible');
    if (entry.target === statsEl) counters.forEach(countUp);
    io.unobserve(entry.target);
  });
}, { threshold: 0.18 });

revealEls.forEach((el) => io.observe(el));
if (statsEl) io.observe(statsEl);

/* ---------- 导航高亮 ---------- */
const navLinks = [...document.querySelectorAll('.nav-links a')];
const sections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
    });
  });
}, { rootMargin: '-45% 0px -50% 0px' });

sections.forEach((section) => navObserver.observe(section));

/* ---------- 卡片跟随光斑 ---------- */
document.querySelectorAll('.skill').forEach((card) => {
  card.addEventListener('pointermove', (event) => {
    const rect = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    card.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
});

/* ---------- 神经元背景 ---------- */
const neuralCanvas = document.getElementById('neural-bg');

if (neuralCanvas && !reduceMotion) {
  const ctx = neuralCanvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const colors = [
    { rgb: '217, 119, 87', core: 'rgba(217, 119, 87,' },
    { rgb: '120, 140, 93', core: 'rgba(120, 140, 93,' },
    { rgb: '106, 155, 204', core: 'rgba(106, 155, 204,' },
    { rgb: '232, 230, 220', core: 'rgba(232, 230, 220,' },
  ];
  const pointer = { x: -9999, y: -9999, active: false };
  let width = 0;
  let height = 0;
  let nodes = [];
  let signals = [];
  let rafId = 0;
  let lastTime = 0;

  const createNodes = () => {
    const count = Math.min(64, Math.max(26, Math.round((width * height) / 24000)));
    nodes = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: 1 + Math.random() * 1.5,
      phase: Math.random() * Math.PI * 2,
      energy: 0,
      color: colors[i % colors.length],
    }));
  };

  const emitSignal = (from, to) => {
    if (signals.length >= 22) return;
    signals.push({
      from,
      to,
      t: 0,
      speed: 0.006 + Math.random() * 0.01,
      color: colors[Math.floor(Math.random() * 3)],
    });
  };

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    neuralCanvas.width = width * dpr;
    neuralCanvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    signals = [];
    createNodes();
  };

  const draw = (now) => {
    const dt = Math.min(2, (now - lastTime) / 16.67 || 1);
    lastTime = now;
    ctx.clearRect(0, 0, width, height);

    for (const node of nodes) {
      node.x += node.vx * dt;
      node.y += node.vy * dt;
      if (node.x < 0 || node.x > width) node.vx *= -1;
      if (node.y < 0 || node.y > height) node.vy *= -1;
      node.phase += 0.018 * dt;

      if (pointer.active) {
        const pd = Math.hypot(node.x - pointer.x, node.y - pointer.y);
        if (pd < 170) node.energy = Math.min(1, node.energy + (1 - pd / 170) * 0.09);
      }
      node.energy *= 0.965;
    }

    const linkDist = 150;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i];
        const b = nodes[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist > linkDist) continue;

        let alpha = (1 - dist / linkDist) * 0.13;
        let tint = '176, 174, 165';

        if (pointer.active) {
          const mx = (a.x + b.x) / 2;
          const my = (a.y + b.y) / 2;
          const md = Math.hypot(mx - pointer.x, my - pointer.y);
          if (md < 190) {
            alpha += (1 - md / 190) * 0.18;
            tint = '217, 119, 87';
          }
        }

        alpha += (a.energy + b.energy) * 0.05;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = `rgba(${tint}, ${Math.min(alpha, 0.34)})`;
        ctx.lineWidth = dist < 70 ? 0.8 : 0.55;
        ctx.stroke();

        if (Math.random() < 0.0007 + (a.energy + b.energy) * 0.002) {
          emitSignal(i, j);
        }
      }
    }

    if (pointer.active) {
      for (const node of nodes) {
        const pd = Math.hypot(node.x - pointer.x, node.y - pointer.y);
        if (pd > 180) continue;
        ctx.beginPath();
        ctx.moveTo(pointer.x, pointer.y);
        ctx.lineTo(node.x, node.y);
        ctx.strokeStyle = `rgba(217, 119, 87, ${(1 - pd / 180) * 0.16})`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }
    }

    for (let s = signals.length - 1; s >= 0; s--) {
      const signal = signals[s];
      const a = nodes[signal.from];
      const b = nodes[signal.to];
      if (!a || !b) {
        signals.splice(s, 1);
        continue;
      }

      signal.t += signal.speed * dt;
      if (signal.t >= 1) {
        b.energy = Math.min(1, b.energy + 0.45);
        signals.splice(s, 1);
        continue;
      }

      const x = a.x + (b.x - a.x) * signal.t;
      const y = a.y + (b.y - a.y) * signal.t;
      const fade = 1 - Math.abs(signal.t - 0.5) * 1.2;
      ctx.beginPath();
      ctx.arc(x, y, 1.7, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${signal.color.rgb}, ${Math.max(0, fade) * 0.6})`;
      ctx.fill();
    }

    for (const node of nodes) {
      const pulse = 0.5 + 0.5 * Math.sin(node.phase);
      const r = node.r + pulse * 0.45 + node.energy * 1.2;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
      ctx.fillStyle = `${node.color.core}${0.2 + pulse * 0.12 + node.energy * 0.5})`;
      ctx.fill();

      if (node.energy > 0.25) {
        ctx.beginPath();
        ctx.arc(node.x, node.y, r + 4, 0, Math.PI * 2);
        ctx.strokeStyle = `${node.color.core}${node.energy * 0.24})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }

    rafId = requestAnimationFrame(draw);
  };

  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    pointer.active = false;
  }, { passive: true });

  window.addEventListener('blur', () => {
    pointer.active = false;
  });

  window.addEventListener('resize', resize, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    } else if (!rafId) {
      lastTime = performance.now();
      rafId = requestAnimationFrame(draw);
    }
  });

  resize();
  lastTime = performance.now();
  rafId = requestAnimationFrame(draw);
}

/* ---------- 鼠标粒子 ---------- */
const particleCanvas = document.getElementById('pointer-particles');

if (particleCanvas && !reduceMotion && window.matchMedia('(pointer: fine)').matches) {
  const ctx = particleCanvas.getContext('2d');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const palette = ['217, 119, 87', '120, 140, 93', '106, 155, 204', '232, 230, 220'];
  const particles = [];
  const cursor = { x: -9999, y: -9999, alpha: 0 };
  let width = 0;
  let height = 0;
  let rafId = 0;
  let lastSpawn = 0;

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    particleCanvas.width = width * dpr;
    particleCanvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const spawn = (x, y, count) => {
    for (let i = 0; i < count; i++) {
      particles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
        size: 1 + Math.random() * 2,
        life: 1,
        decay: 0.014 + Math.random() * 0.018,
        color: palette[Math.floor(Math.random() * palette.length)],
      });
    }
  };

  const draw = () => {
    ctx.clearRect(0, 0, width, height);

    if (cursor.alpha > 0) {
      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 16, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(217, 119, 87, ${cursor.alpha * 0.09})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(cursor.x, cursor.y, 2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(250, 249, 245, ${cursor.alpha * 0.5})`;
      ctx.fill();

      cursor.alpha -= 0.035;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.006;
      p.life -= p.decay;

      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (0.5 + p.life * 0.5), 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${p.color}, ${p.life * 0.7})`;
      ctx.fill();
    }

    if (particles.length || cursor.alpha > 0) {
      rafId = requestAnimationFrame(draw);
    } else {
      rafId = 0;
      ctx.clearRect(0, 0, width, height);
    }
  };

  const ensureLoop = () => {
    if (!rafId) rafId = requestAnimationFrame(draw);
  };

  window.addEventListener('pointermove', (event) => {
    const now = performance.now();
    if (now - lastSpawn < 28) return;
    lastSpawn = now;

    const speed = Math.hypot(event.clientX - cursor.x, event.clientY - cursor.y);
    const count = Math.min(5, 2 + Math.floor(speed / 50));
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    cursor.alpha = 1;
    spawn(event.clientX, event.clientY, count);
    ensureLoop();
  }, { passive: true });

  window.addEventListener('pointerdown', (event) => {
    spawn(event.clientX, event.clientY, 14);
    cursor.x = event.clientX;
    cursor.y = event.clientY;
    cursor.alpha = 1;
    ensureLoop();
  }, { passive: true });

  window.addEventListener('pointerleave', () => {
    cursor.alpha = 0;
  }, { passive: true });

  window.addEventListener('resize', resize, { passive: true });
  resize();
}

