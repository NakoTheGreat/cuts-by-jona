/* ============================================================
   CUTS BY JONA — main.js
   Navigation · Animations · Particles · Reviews · PWA · Form
   ============================================================ */

const BOOKSY_URL = 'https://booksy.com/en-us/114670_cuts-by-jona_barber-shop_14095_west-milwaukee';

/* ── DOM Ready ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initParticles();
  initReveal();
  initCountUp();
  initReviewsCarousel();
  initContactForm();
  initPWA();
  registerSW();
  setBooksy();
});

/* ── Set Booksy links ───────────────────────────────────── */
function setBooksy() {
  document.querySelectorAll('[data-booksy]').forEach(el => {
    el.href = BOOKSY_URL;
    el.target = '_blank';
    el.rel = 'noopener noreferrer';
  });
}

/* ── Navigation ─────────────────────────────────────────── */
function initNav() {
  const nav    = document.getElementById('nav');
  const burger = document.getElementById('nav-burger');
  const drawer = document.getElementById('nav-drawer');
  const veil   = document.getElementById('nav-veil');
  const links  = document.querySelectorAll('.nav-links a[data-section], .nav-drawer a[data-section]');

  // Scroll: shrink + active highlight
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        nav.classList.toggle('scrolled', window.scrollY > 40);
        highlightActive(links);
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Hamburger
  burger.addEventListener('click', () => toggleDrawer(true));
  veil.addEventListener('click', () => toggleDrawer(false));
  drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', () => toggleDrawer(false)));

  function toggleDrawer(open) {
    burger.classList.toggle('open', open);
    drawer.classList.toggle('open', open);
    veil.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  // Smooth scroll
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });
}

function highlightActive(links) {
  const sections = ['hero','services','work','about','reviews','booking','location'];
  const offset   = window.innerHeight * 0.35;
  let current    = 'hero';
  sections.forEach(id => {
    const el = document.getElementById(id);
    if (el && el.getBoundingClientRect().top < offset) current = id;
  });
  links.forEach(a => a.classList.toggle('active', a.dataset.section === current));
}

/* ── Hero Particles ─────────────────────────────────────── */
function initParticles() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, particles = [];

  const resize = () => {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
  };
  resize();
  window.addEventListener('resize', resize, { passive: true });

  const gold = [
    'rgba(201,168,76,', 'rgba(226,192,105,', 'rgba(180,148,60,'
  ];

  for (let i = 0; i < 55; i++) {
    particles.push({
      x:     Math.random() * 1200,
      y:     Math.random() * 900,
      r:     Math.random() * 1.4 + 0.4,
      dx:    (Math.random() - 0.5) * 0.18,
      dy:    (Math.random() - 0.5) * 0.14 - 0.05,
      alpha: Math.random() * 0.45 + 0.08,
      fade:  (Math.random() - 0.5) * 0.003,
      color: gold[Math.floor(Math.random() * gold.length)]
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    particles.forEach(p => {
      p.x += p.dx; p.y += p.dy; p.alpha += p.fade;
      if (p.alpha <= 0.04) { p.alpha = 0.04; p.fade *= -1; }
      if (p.alpha >= 0.55) { p.alpha = 0.55; p.fade *= -1; }
      if (p.x < -10)  p.x = W + 10;
      if (p.x > W+10) p.x = -10;
      if (p.y < -10)  p.y = H + 10;
      if (p.y > H+10) p.y = -10;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color + p.alpha + ')';
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ── Scroll Reveal ──────────────────────────────────────── */
function initReveal() {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const delay = el.dataset.delay || 0;
        setTimeout(() => el.classList.add('visible'), +delay);
        io.unobserve(el);
      }
    });
  }, { threshold: 0.12 });

  // Stagger children in grids
  document.querySelectorAll('.services-grid, .work-grid, .reviews-grid').forEach(grid => {
    Array.from(grid.children).forEach((child, i) => {
      child.classList.add('reveal');
      child.dataset.delay = i * 80;
    });
  });

  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Also observe top-level section headers
  document.querySelectorAll('.services-hd, .work-hd, .about-inner, .reviews-hd, .booking-inner, .location-info, .location-map').forEach(el => {
    el.classList.add('reveal');
    io.observe(el);
  });
}

/* ── Count-up on stats ──────────────────────────────────── */
function initCountUp() {
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.querySelectorAll('[data-count]').forEach(el => countUp(el));
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.4 });

  const statsBar = document.querySelector('.hero-stats');
  if (statsBar) io.observe(statsBar);

  function countUp(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    const prefix = el.dataset.prefix || '';
    const isDecimal = target % 1 !== 0;
    const duration = 1400;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const val = eased * target;
      el.textContent = prefix + (isDecimal ? val.toFixed(1) : Math.floor(val)) + suffix;
      if (progress < 1) requestAnimationFrame(animate);
      else el.textContent = prefix + (isDecimal ? target.toFixed(1) : target) + suffix;
    };
    requestAnimationFrame(animate);
  }
}

/* ── Reviews Carousel (mobile) ──────────────────────────── */
function initReviewsCarousel() {
  const grid = document.querySelector('.reviews-grid');
  if (!grid) return;
  const cards = Array.from(grid.children);
  let idx = 0, timer;

  function check() {
    if (window.innerWidth <= 600) startCarousel();
    else stopCarousel();
  }

  function startCarousel() {
    if (timer) return;
    cards.forEach((c, i) => c.style.display = i === 0 ? '' : 'none');
    timer = setInterval(() => {
      cards[idx].style.display = 'none';
      idx = (idx + 1) % cards.length;
      cards[idx].style.display = '';
    }, 3800);
  }

  function stopCarousel() {
    clearInterval(timer); timer = null;
    cards.forEach(c => c.style.display = '');
  }

  check();
  window.addEventListener('resize', check, { passive: true });
}

/* ── Contact Form ───────────────────────────────────────── */
function initContactForm() {
  const form    = document.getElementById('contact-form');
  const success = document.getElementById('form-success');
  if (!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const data = {
      id:        Date.now(),
      name:      form.elements['name'].value.trim(),
      email:     form.elements['email'].value.trim(),
      message:   form.elements['message'].value.trim(),
      timestamp: new Date().toISOString(),
      read:      false
    };
    if (!data.name || !data.email || !data.message) return;

    const msgs = JSON.parse(localStorage.getItem('cbj_messages') || '[]');
    msgs.unshift(data);
    localStorage.setItem('cbj_messages', JSON.stringify(msgs));

    form.style.display = 'none';
    success.style.display = 'block';
  });
}

/* ── PWA ────────────────────────────────────────────────── */
function initPWA() {
  // Android / Chrome install
  let deferredPrompt;
  const banner = document.getElementById('pwa-banner');
  const installBtn = document.getElementById('pwa-install');
  const laterBtn   = document.getElementById('pwa-later');

  if (banner && !localStorage.getItem('cbj_pwa_dismissed')) {
    window.addEventListener('beforeinstallprompt', e => {
      e.preventDefault();
      deferredPrompt = e;
      setTimeout(() => banner.classList.add('show'), 2500);
    });
    installBtn?.addEventListener('click', () => {
      deferredPrompt?.prompt();
      deferredPrompt?.userChoice.then(() => { deferredPrompt = null; });
      banner.classList.remove('show');
      localStorage.setItem('cbj_pwa_dismissed', '1');
    });
    laterBtn?.addEventListener('click', () => {
      banner.classList.remove('show');
      localStorage.setItem('cbj_pwa_dismissed', '1');
    });
  }

  // iOS Safari prompt
  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
  const isStandalone = window.navigator.standalone;
  const iosModal   = document.getElementById('ios-prompt');
  const iosDismiss = document.getElementById('ios-dismiss');

  if (isIOS && !isStandalone && !localStorage.getItem('cbj_ios_dismissed') && iosModal) {
    setTimeout(() => iosModal.classList.add('show'), 3500);
    iosDismiss?.addEventListener('click', () => {
      iosModal.classList.remove('show');
      localStorage.setItem('cbj_ios_dismissed', '1');
    });
  }
}

/* ── Service Worker ─────────────────────────────────────── */
function registerSW() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  }
}
