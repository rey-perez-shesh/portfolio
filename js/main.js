const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

document.getElementById('year').textContent = new Date().getFullYear();

// Mobile menu
const menuToggle = document.getElementById('menu-toggle');
const siteNav = document.getElementById('site-nav');

function setMenu(open) {
  siteNav.classList.toggle('is-open', open);
  menuToggle.setAttribute('aria-expanded', String(open));
}

menuToggle.addEventListener('click', () => setMenu(!siteNav.classList.contains('is-open')));
siteNav.addEventListener('click', (event) => {
  if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && siteNav.classList.contains('is-open')) {
    setMenu(false);
    menuToggle.focus();
  }
});

const heroStage = document.querySelector('.hero-stage');
const heroPanel = document.getElementById('hero-panel');
const heroNames = [...document.querySelectorAll('.hero-name span')];
const threeColumns = matchMedia('(min-width: 1000px) and (min-height: 560px)'); // same query as the hero's CSS

// The hero name is sized for Gambarino: if that font fails, shrink the wider fallback so the name isn't clipped or covered
document.fonts.ready.then(() => {
  const side = heroNames[0].getBoundingClientRect().left;
  const room = threeColumns.matches ? (heroStage.clientWidth - heroPanel.offsetWidth) / 2 - side * 2 : heroStage.clientWidth - side * 2;
  const width = threeColumns.matches ? heroNames[1].offsetWidth : heroNames[1].getBoundingClientRect().right - side;
  if (width > room) document.querySelector('.hero-name').style.fontSize = `calc(var(--name) / ${(width / room) * 1.04})`;
});

// Hero and About. On scroll the name parts off both sides, the side text fades and the picture wipes away from the bottom;
// then the About sentence lights up word by word. Without this (reduced motion, no script) everything stays in place and lit.
if (!reducedMotion) {
  const hero = document.querySelector('.hero');
  const stage = heroStage;
  const fades = [...document.querySelectorAll('.hero-lead, .hero-stat, .hero-cue')];
  const bands = [...document.querySelectorAll('.hero-panel .band, .hero-fringe')];
  const role = document.getElementById('hero-role');
  const lead = document.getElementById('about-lead');
  lead.innerHTML = lead.textContent.split(' ').map((word) => `<span>${word}</span>`).join(' ');
  const words = [...lead.children];
  hero.classList.add('is-pinned');

  const clamp = (value) => Math.min(1, Math.max(0, value));
  const lerp = (from, to, t) => from + (to - from) * t;
  let queued = false;

  function render() {
    queued = false;
    const rect = hero.getBoundingClientRect();
    if (rect.bottom > 0) {
      // Stacked layouts just scroll: p stays 0, which also clears anything left from a wider window
      const p = threeColumns.matches ? clamp((stage.getBoundingClientRect().top - rect.top) / (rect.height - stage.offsetHeight)) : 0;
      const parted = clamp(p / 0.35);
      heroNames.forEach((name, index) => {
        name.style.transform = parted ? `translateX(${(index ? 1 : -1) * parted * 34}vw)` : '';
        name.style.opacity = parted ? 1 - parted : '';
      });
      const fade = 1 - clamp(p / 0.18);
      fades.forEach((element) => {
        element.style.opacity = fade === 1 ? '' : fade;
        element.style.transform = fade === 1 || element.classList.contains('hero-cue') ? '' : `translateY(${(fade - 1) * 40}px)`;
        element.style.visibility = fade === 0 ? 'hidden' : '';
      });
      const bandsFade = 1 - clamp((p - 0.05) / 0.2);
      bands.forEach((band) => { band.style.opacity = bandsFade === 1 ? '' : bandsFade; });
      const wipe = clamp((p - 0.35) / 0.5);
      heroPanel.style.clipPath = wipe ? `inset(0 0 ${wipe * 100}% 0)` : '';
    }
    const leadRect = lead.getBoundingClientRect();
    const lit = clamp((innerHeight * 0.85 - leadRect.top) / (leadRect.height + innerHeight * 0.25));
    words.forEach((word, index) => {
      word.style.opacity = lerp(0.2, 1, clamp(lit * words.length - index * 0.92));
    });
  }

  function queueRender() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  }

  addEventListener('scroll', queueRender, { passive: true });
  addEventListener('resize', queueRender);
  render();

  // The role line decodes from scrambled letters into each role in turn
  const roles = ['Web & mobile development', 'BS Information Technology', 'Bacoor City, Philippines'];
  const scramble = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/';
  let roleIndex = 0;
  function decode(text) {
    const start = performance.now();
    (function frame(now) {
      const shown = Math.floor(((now - start) / 900) * text.length);
      role.textContent = [...text].map((letter, index) => (index < shown || letter === ' ' ? letter : scramble[Math.floor(Math.random() * scramble.length)])).join('');
      if (shown < text.length) requestAnimationFrame(frame);
    })(start);
  }
  setInterval(() => {
    if (!document.hidden && hero.getBoundingClientRect().bottom > 0) {
      roleIndex = (roleIndex + 1) % roles.length;
      decode(roles[roleIndex]);
    }
  }, 3500);
}

// Tech stack scroll sequence: each category's icon row rises in, holds, then leaves through the top.
// Without this (reduced motion, no script) the rows stay plain and stacked.
if (!reducedMotion) {
  const tech = document.querySelector('.tech');
  const techChapters = [...document.querySelectorAll('.tech-chapter')];
  const count = techChapters.length;
  const indexButtons = [...document.querySelectorAll('.tech-index button')];
  const progressBar = document.getElementById('tech-progress');
  tech.classList.add('is-scene');

  const goToChapter = (index) => {
    const rect = tech.getBoundingClientRect();
    window.scrollTo({ top: window.scrollY + rect.top + (rect.height - innerHeight) * (index + 0.5) / count });
  };

  let active = -1;
  let queued = false;

  function render() {
    queued = false;
    const rect = tech.getBoundingClientRect();
    const progress = Math.min(1, Math.max(0, -rect.top / (rect.height - innerHeight)));
    const position = progress * count;
    const current = Math.min(count - 1, Math.floor(position));

    if (current !== active) {
      active = current;
      indexButtons.forEach((button, index) => button.classList.toggle('is-active', index === active));
      techChapters.forEach((chapter, index) => chapter.classList.toggle('is-active', index === active));
    }
    progressBar.style.transform = `scaleX(${progress})`;

    techChapters.forEach((chapter, index) => {
      // d: 0 when this row faces the camera, negative while approaching, positive once passing.
      // The first and last rows hold at 0 so the sequence starts and ends on a full row.
      let d = position - index - 0.5;
      if (index === 0) d = Math.max(d, 0);
      if (index === count - 1) d = Math.min(d, 0);
      // e stays 0 through the middle of each chapter so there is time to read the row
      const e = Math.sign(d) * Math.max(0, Math.abs(d) - 0.2) * 1.25;
      const side = index % 2 ? -1 : 1;
      const z = e < 0 ? e * 2600 : e * 500;
      const y = e < 0 ? -e * (innerWidth <= 768 ? 25 : 70) : -e * 130;
      const blur = Math.round(Math.max(0, Math.abs(e) - 0.1) * 12);
      chapter.style.opacity = Math.max(0, Math.min(1, (0.8 - e) / 0.35, (e + 0.9) / 0.3));
      chapter.style.filter = blur ? `blur(${blur}px)` : 'none';
      chapter.style.transform = `translateY(-50%) translate3d(0, ${y}vh, ${z}px) rotateX(${e * 20}deg) rotateY(${side * e * 18}deg) rotateZ(${side * e * 6}deg)`;
      // Icons arrive one after another, left to right, and line up by the time the row settles
      [...chapter.querySelector('.tool-list').children].forEach((tool, toolIndex) => {
        tool.style.transform = e < 0 ? `translateY(${-e * toolIndex * 6}vh)` : 'none';
      });
    });
  }

  function queueRender() {
    if (!queued) {
      queued = true;
      requestAnimationFrame(render);
    }
  }

  indexButtons.forEach((button, index) => button.addEventListener('click', () => goToChapter(index)));
  addEventListener('scroll', queueRender, { passive: true });
  addEventListener('resize', queueRender);
  render();
}

// Section entrances
if (!reducedMotion) {
  document.documentElement.classList.add('js');
  const observer = new IntersectionObserver((entries) => {
    entries.filter((entry) => entry.isIntersecting).forEach((entry, index) => {
      entry.target.style.transitionDelay = `${index * 70}ms`;
      entry.target.classList.add('is-in');
      observer.unobserve(entry.target);
    });
  }, { rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
}

// Wave background: decoration only, so a failed download or missing WebGL just leaves the plain dark ground
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });
}

if (!reducedMotion) {
  loadScript('https://cdnjs.cloudflare.com/ajax/libs/three.js/r134/three.min.js')
    .then(() => loadScript('https://cdn.jsdelivr.net/npm/vanta@0.5.24/dist/vanta.waves.min.js'))
    .then(() => {
      VANTA.WAVES({
        el: '#hero-bg',
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        scale: 1,
        scaleMobile: 1,
        color: 0x202020,
        shininess: 80,
        waveHeight: 22.5,
        zoom: 0.65,
      });
    })
    .catch((error) => console.warn('Wave background unavailable:', error));
}
