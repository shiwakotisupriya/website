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
  document.querySelectorAll('.project-card').forEach((card, index) => {
    card.dataset.motionSide = index % 2 === 0 ? 'left' : 'right';
  });
  const revealObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      revealObserver.unobserve(entry.target);
      playMotion(entry.target, [
        { opacity: 0, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], {
        duration: 600,
        delay: Number(entry.target.dataset.motionDelay || 0),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards'
      });
    }
  }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
  document.querySelectorAll(
    '.hero-copy > *, .portrait-frame, .section-label, .about-grid > *, ' +
    '.section-heading > *, .facts > *, .journey-intro, ' +
    '.membership-grid > *, .timeline > *, .skill-grid > *, .learning, .contact-grid > div:first-child > *, .contact-links > *'
  ).forEach(element => revealObserver.observe(element));

  // Project entrances replay on every viewport entry, rather than being unobserved.
  const projectAnimations = new WeakMap();
  const enteredProjects = new WeakSet();
  const projectObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      const card = entry.target;
      if (!entry.isIntersecting) {
        enteredProjects.delete(card);
        const previous = projectAnimations.get(card);
        if (previous) previous.cancel();
        projectAnimations.delete(card);
        continue;
      }
      if (enteredProjects.has(card)) continue;
      // Wait until half of the card (or half a screen for tall cards) is visible.
      const visibleHeight = Math.min(entry.boundingClientRect.height, entry.rootBounds.height) * 0.5;
      if (!entry.isIntersecting || entry.intersectionRect.height < visibleHeight || motionPreference.matches) continue;
      const compact = window.matchMedia('(max-width: 760px)').matches;
      const direction = card.dataset.motionSide === 'right' ? 1 : -1;
      const distance = compact ? 26 : 64;
      const angle = compact ? 2 : 4;
      const animation = playMotion(card, [
        { opacity: 0, transform: `translateX(${direction * distance}px) translateY(16px) rotate(${direction * angle}deg) scale(0.98)` },
        { opacity: 1, transform: 'translateX(0) translateY(0) rotate(0deg) scale(1)' }
      ], {
        duration: 850,
        delay: Number(card.dataset.motionDelay || 0),
        easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
        fill: 'backwards'
      });
      if (animation) {
        projectAnimations.set(card, animation);
        enteredProjects.add(card);
      }
    }
  }, { threshold: Array.from({ length: 101 }, (_, index) => index / 100), rootMargin: '0px' });
  document.querySelectorAll('.project-card').forEach(card => projectObserver.observe(card));
}

document.querySelectorAll('details').forEach(details => {
  details.addEventListener('toggle', () => {
    const content = details.querySelector('.project-details');
    if (details.open && content) {
      playMotion(content, [
        { opacity: 0, transform: 'translateY(-5px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 220, easing: 'ease-out' });
    }
  });
});

motionPreference.addEventListener('change', event => {
  if (event.matches) {
    for (const animation of runningMotion) animation.cancel();
    runningMotion.clear();
  }
});
