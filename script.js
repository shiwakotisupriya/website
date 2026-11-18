const toggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#nav-links');
toggle.hidden = false;
document.documentElement.classList.add('js');
function closeMenu() {
  toggle.setAttribute('aria-expanded', 'false');
  menu.classList.remove('is-open');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  menu.classList.toggle('is-open', open);
});
menu.addEventListener('click', (event) => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('click', (event) => { if (!event.target.closest('.nav')) closeMenu(); });
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { closeMenu(); toggle.focus(); }
});
window.matchMedia('(min-width: 761px)').addEventListener('change', closeMenu);
document.querySelector('#year').textContent = new Date().getFullYear();
if ('IntersectionObserver' in window) {
  const links = [...menu.querySelectorAll('a')];
  const observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        for (const link of links) {
          if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        }
      }
    }
  }, { rootMargin: '-15% 0px -55% 0px' });
  document.querySelectorAll('main section[id]').forEach(section => observer.observe(section));
}

// Progressive motion: elements remain visible if JavaScript or animation support is unavailable.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const runningMotion = new Set();
function playMotion(element, keyframes, options) {
  if (motionPreference.matches || typeof element.animate !== 'function') return;
  const animation = element.animate(keyframes, options);
  runningMotion.add(animation);
  const clear = () => runningMotion.delete(animation);
  animation.addEventListener('finish', clear, { once: true });
  animation.addEventListener('cancel', clear, { once: true });
  return animation;
}

if ('IntersectionObserver' in window) {
  // Stagger siblings, with a short cap to keep the page feeling responsive.
  document.querySelectorAll('.projects, .facts, .skill-grid, .timeline, .contact-links').forEach(group => {
    [...group.children].forEach((element, index) => {
      element.dataset.motionDelay = String(Math.min(index * 70, 140));
    });
  });
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      revealObserver.unobserve(entry.target);
      const isPortrait = entry.target.classList.contains('portrait-frame');
      playMotion(entry.target, [
        { opacity: 0, transform: isPortrait ? 'translateY(18px)' : 'translateY(8px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: isPortrait ? 600 : 420,
        delay: Number(entry.target.dataset.motionDelay || 0),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards'
      });
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll(
    '.hero-copy > *, .portrait-frame, .section-label, .about-grid > *, ' +
    '.section-heading > *, .facts > *, .project-card, .journey-intro, ' +
    '.collection-heading, .collection-card, .membership-grid > *, .timeline > *, .skill-grid > *, .learning, .contact-grid > div:first-child > *, .contact-links > *'
  ).forEach(element => revealObserver.observe(element));

}

motionPreference.addEventListener('change', event => {
  if (event.matches) {
    for (const animation of runningMotion) animation.cancel();
    runningMotion.clear();
  }
});
