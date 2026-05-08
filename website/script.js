/* ===========================
   NAV SCROLL EFFECT
=========================== */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 20);
});

/* ===========================
   MOBILE BURGER
=========================== */
const burger = document.getElementById('navBurger');
const mobileMenu = document.getElementById('navMobile');

burger.addEventListener('click', () => {
  const open = mobileMenu.classList.toggle('open');
  burger.setAttribute('aria-expanded', open);
});

// Close mobile menu on link click
mobileMenu.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => mobileMenu.classList.remove('open'));
});

/* ===========================
   SCROLL REVEAL ANIMATION
=========================== */
const observerOpts = {
  threshold: 0.12,
  rootMargin: '0px 0px -40px 0px'
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOpts);

// Add reveal class to elements and observe
document.querySelectorAll(
  '.feature-card, .module-card, .stat-item, .step, .pricing-card, .contact-info-card, .contact-highlight'
).forEach((el, i) => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = `opacity .5s ease ${i * 0.06}s, transform .5s ease ${i * 0.06}s`;
  revealObserver.observe(el);
});

document.addEventListener('DOMContentLoaded', () => {
  document.head.insertAdjacentHTML('beforeend', `
    <style>
      .revealed { opacity: 1 !important; transform: translateY(0) !important; }
    </style>
  `);
});

/* ===========================
   COUNTER ANIMATION
=========================== */
function animateCounter(el) {
  const target = el.dataset.target;
  const isFloat = target.includes('.');
  const num = parseFloat(target);
  const duration = 1800;
  const start = performance.now();

  function update(ts) {
    const progress = Math.min((ts - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = eased * num;
    el.textContent = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString('tr-TR');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = isFloat ? num.toFixed(1) : num.toLocaleString('tr-TR');
  }
  requestAnimationFrame(update);
}

// Attach counter animation to stat numbers
document.querySelectorAll('.stat-number').forEach(el => {
  const text = el.childNodes[0].textContent.trim().replace('.', '').replace(',', '.');
  const num = parseFloat(text);
  if (!isNaN(num)) {
    el.childNodes[0].dataset = el.childNodes[0].dataset || {};
    const span = el.querySelector('span');
    const suffix = span ? span.textContent : '';
    el.dataset.rawNum = num;
    el.dataset.suffix = suffix;
    el.dataset.isFloat = text.includes('.');
  }
});

const statsSection = document.querySelector('.stats');
let statsAnimated = false;

const statsObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting && !statsAnimated) {
    statsAnimated = true;
    document.querySelectorAll('.stat-number').forEach(el => {
      const num = parseFloat(el.dataset.rawNum || '0');
      const suffix = el.dataset.suffix || '';
      const isFloat = el.dataset.isFloat === 'true';
      const duration = 1800;
      const start = performance.now();

      function update(ts) {
        const progress = Math.min((ts - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = eased * num;
        const displayed = isFloat ? current.toFixed(1) : Math.floor(current).toLocaleString('tr-TR');
        el.innerHTML = displayed + '<span>' + suffix + '</span>';
        if (progress < 1) requestAnimationFrame(update);
        else el.innerHTML = (isFloat ? num.toFixed(1) : num.toLocaleString('tr-TR')) + '<span>' + suffix + '</span>';
      }
      requestAnimationFrame(update);
    });
    statsObserver.disconnect();
  }
}, { threshold: 0.5 });

if (statsSection) statsObserver.observe(statsSection);

/* ===========================
   CONTACT FORM
=========================== */
const form = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (form) {
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Gönderiliyor...';

    // Simulate async submit
    setTimeout(() => {
      btn.style.display = 'none';
      formSuccess.classList.add('visible');
      form.querySelectorAll('input, select, textarea').forEach(el => el.disabled = true);
    }, 900);
  });
}

/* ===========================
   SMOOTH ANCHOR OFFSET
=========================== */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    const offset = 76; // nav height
    const top = target.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top, behavior: 'smooth' });
  });
});
