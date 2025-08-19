// Theme toggle + remember
const root = document.documentElement;
const themeToggle = document.getElementById('themeToggle');
const savedTheme = localStorage.getItem('theme');
if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    const next = current === 'light' ? '' : 'light';
    if (next) root.setAttribute('data-theme', next); else root.removeAttribute('data-theme');
    if (next) localStorage.setItem('theme', next); else localStorage.removeItem('theme');
  });
}

// Mobile nav
const navToggle = document.querySelector('.nav-toggle');
const navMenu = document.getElementById('nav-menu');
if (navToggle) {
  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('show');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  navMenu.querySelectorAll('a').forEach(a => a.addEventListener('click', ()=>navMenu.classList.remove('show')));
}

// Smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.pushState(null, '', `#${id}`);
    }
  });
});

// Intersection reveal
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.14 });
document.querySelectorAll('.section, .project-card, .card').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

// Back to top
const btt = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
  if (window.scrollY > 400) btt.classList.add('show'); else btt.classList.remove('show');
});
btt.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Contact form (AJAX)
const form = document.getElementById('contactForm');
const statusEl = document.getElementById('formStatus');

// Simple CSRF token (per session)
const csrf = (Math.random().toString(36).slice(2) + Date.now().toString(36));
const csrfInput = document.getElementById('csrf');
csrfInput.value = csrf;
sessionStorage.setItem('csrf', csrf);

const validators = {
  name: v => v.trim().length >= 2 || 'Please enter your name.',
  email: v => /^\S+@\S+\.\S+$/.test(v) || 'Please enter a valid email.',
  message: v => v.trim().length >= 10 || 'Message should be at least 10 characters.'
};

function showError(name, msg){
  const el = document.querySelector(`.error[data-for="${name}"]`);
  if (el) el.textContent = msg || '';
}
function validateField(name, value){
  const res = validators[name](value);
  showError(name, res === true ? '' : res);
  return res === true;
}

['name','email','message'].forEach(id => {
  const input = document.getElementById(id);
  input.addEventListener('blur', () => validateField(id, input.value));
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const data = new FormData(form);
  let ok = true;
  ['name','email','message'].forEach(id => {
    const v = data.get(id);
    if (!validateField(id, v)) ok = false;
  });
  if (!ok) return;

  statusEl.textContent = 'Sending...';
  try {
    const res = await fetch(form.action, { method: 'POST', body: data });
    const json = await res.json();
    if (json.success) {
      statusEl.textContent = 'Thanks! Your message has been sent.';
      form.reset();
      // regenerate token
      const newCsrf = Math.random().toString(36).slice(2) + Date.now().toString(36);
      csrfInput.value = newCsrf;
      sessionStorage.setItem('csrf', newCsrf);
    } else {
      statusEl.textContent = json.error || 'Something went wrong.';
    }
  } catch (err) {
    statusEl.textContent = 'Network error. Please try again later.';
  }
});
