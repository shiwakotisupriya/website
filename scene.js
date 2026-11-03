// Locally hosted Three.js; the rest of the portfolio never depends on WebGL.
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const scenes = [];
let frame = 0;
let previousTime = 0;
let motionPaused = false;
const motionButton = document.querySelector('.scene-toggle');

function animate(time) {
  frame = 0;
  const delta = Math.min((time - previousTime) / 1000 || 0, 0.05);
  previousTime = time;
  for (const item of scenes) {
    if (!item.visible || item.lost) continue;
    if (!reducedMotion.matches && !motionPaused) {
      item.spin += delta * (item.kind === 'orbit' ? 0.22 : 0.12);
      if (item.kind === 'orbit') {
        item.group.rotation.y = item.spin;
        item.group.rotation.z = 0.18;
        item.group.rotation.x = 0.12;
      } else {
        item.group.rotation.y = item.spin + item.pointer.x * 0.18;
        item.group.rotation.x += (item.pointer.y * 0.12 - item.group.rotation.x) * 0.04;
      }
    }
    item.renderer.render(item.scene, item.camera);
    item.frontRenderer?.render(item.scene, item.camera);
  }
  if (!document.hidden && !reducedMotion.matches && !motionPaused && scenes.some(item => item.visible && !item.lost)) {
    frame = requestAnimationFrame(animate);
  }
}
function wake() {
  if (document.hidden || frame) return;
  previousTime = performance.now();
  frame = requestAnimationFrame(animate);
}
function dispose(item) {
  item.resize.disconnect();
  item.scene.traverse(object => {
    object.geometry?.dispose();
    if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
    else object.material?.dispose();
  });
  item.renderer.dispose();
  item.frontRenderer?.dispose();
  item.frontHost?.remove();
}

async function initialiseScenes() {
  let THREE;
  try { THREE = await import('./vendor/three/three.module.js'); }
  catch { return; }
  for (const host of document.querySelectorAll('[data-three-scene]')) {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch { continue; }
    const kind = host.dataset.threeScene;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 30);
    camera.position.z = kind === 'orbit' ? 6.2 : 5.5;
    const group = new THREE.Group();
    scene.add(group);
    const accent = 0x2dd4bf;
    if (kind === 'orbit') {
      // A revolving cage of orbital rings surrounds the rounded portrait.
      for (let index = 0; index < 3; index++) {
        const orbit = new THREE.Group();
        orbit.rotation.set(0.4 + index * 0.55, index * 0.8, 0.2);
        const radius = 1.82 + index * 0.12;
        orbit.add(new THREE.Mesh(
          new THREE.TorusGeometry(radius, 0.008, 6, 128),
          new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.42 - index * 0.06 })
        ));
        for (let satellite = 0; satellite < 2; satellite++) {
          const angle = index * 0.9 + satellite * Math.PI;
          const node = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), new THREE.MeshBasicMaterial({ color: accent }));
          node.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0);
          orbit.add(node);
        }
        group.add(orbit);
      }
    } else {
      // Deterministic points on a sphere, linked to nearby neighbours.
      const points = [];
      for (let index = 0; index < 48; index++) {
        const y = 1 - 2 * (index + 0.5) / 48;
        const radius = Math.sqrt(1 - y * y);
        const angle = index * Math.PI * (3 - Math.sqrt(5));
        points.push(new THREE.Vector3(Math.cos(angle) * radius * 1.35, y * 1.35, Math.sin(angle) * radius * 1.35));
      }
      const edges = [];
      for (let a = 0; a < points.length; a++) {
        for (let b = a + 1; b < points.length; b++) {
          if (points[a].distanceTo(points[b]) < 0.74) edges.push(points[a], points[b]);
        }
      }
      group.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(edges), new THREE.LineBasicMaterial({ color: accent, transparent: true, opacity: 0.32 })));
      group.add(new THREE.Points(new THREE.BufferGeometry().setFromPoints(points), new THREE.PointsMaterial({ color: 0xf8fafc, size: 0.045, sizeAttenuation: true })));
      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 0), new THREE.MeshBasicMaterial({ color: accent, wireframe: true, transparent: true, opacity: 0.6 }));
      group.add(core);
    }
    // Split the same orbit at the photo plane: rear arcs behind, near arcs in front.
    let frontRenderer = null;
    let frontHost = null;
    if (kind === 'orbit') {
      try {
        frontRenderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
        renderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, -1), 0)];
        frontRenderer.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)];
        frontHost = document.createElement('div');
        frontHost.className = 'hero-orbit orbit-front';
        frontHost.setAttribute('aria-hidden', 'true');
        frontHost.appendChild(frontRenderer.domElement);
        host.parentElement.appendChild(frontHost);
      } catch {
        frontRenderer?.dispose();
        frontRenderer = null;
        renderer.clippingPlanes = [];
      }
    }
    const item = { host, kind, scene, camera, group, renderer, frontRenderer, frontHost, pointer: { x: 0, y: 0 }, visible: false, lost: false, spin: 0.3 };
    function resize() {
      const width = host.clientWidth;
      const height = host.clientHeight;
      if (!width || !height) return;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(width, height, false);
      frontRenderer?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      frontRenderer?.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      wake();
    }
    item.resize = new ResizeObserver(resize);
    host.appendChild(renderer.domElement);
    try {
      resize();
      renderer.render(scene, camera);
      frontRenderer?.render(scene, camera);
    } catch {
      dispose(item);
      renderer.domElement.remove();
      continue;
    }
    host.classList.add('three-ready');
    host.parentElement.classList.add('has-three');
    item.resize.observe(host);
    const pointerSurface = host.closest('.project-card, .portrait-block') || host;
    pointerSurface.addEventListener('pointermove', event => {
      if (reducedMotion.matches || motionPaused || !finePointer.matches) return;
      const bounds = pointerSurface.getBoundingClientRect();
      item.pointer.x = (event.clientX - bounds.left) / bounds.width * 2 - 1;
      item.pointer.y = (event.clientY - bounds.top) / bounds.height * 2 - 1;
    }, { passive: true });
    pointerSurface.addEventListener('pointerleave', () => { item.pointer.x = 0; item.pointer.y = 0; });
    for (const surface of [renderer.domElement, frontRenderer?.domElement].filter(Boolean)) {
    surface.addEventListener('webglcontextlost', event => {
      event.preventDefault();
      item.lost = true;
      if (frontHost) frontHost.hidden = true;
      host.classList.remove('three-ready');
      host.parentElement.classList.remove('has-three');
    });
    surface.addEventListener('webglcontextrestored', () => {
      item.lost = false;
      if (frontHost) frontHost.hidden = false;
      host.classList.add('three-ready');
      host.parentElement.classList.add('has-three');
      wake();
    });
    }
    scenes.push(item);
  }
  if (motionButton) motionButton.hidden = !scenes.length || reducedMotion.matches;
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        const item = scenes.find(candidate => candidate.host === entry.target);
        if (item) item.visible = entry.isIntersecting;
      }
      wake();
    });
    scenes.forEach(item => observer.observe(item.host));
  } else {
    scenes.forEach(item => item.visible = true);
    wake();
  }
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(frame); frame = 0; }
  else wake();
});
reducedMotion.addEventListener('change', () => {
  if (motionButton) motionButton.hidden = !scenes.length || reducedMotion.matches;
  cancelAnimationFrame(frame); frame = 0;
  wake();
});
window.addEventListener('pagehide', event => {
  if (event.persisted) return;
  cancelAnimationFrame(frame);
  scenes.forEach(dispose);
});

// Tilt uses the card transform, while the existing scroll entrance takes priority.
for (const card of document.querySelectorAll('.project-card')) {
  let pending = 0;
  const reset = () => {
    cancelAnimationFrame(pending); pending = 0;
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
  };
  card.addEventListener('pointermove', event => {
    if (reducedMotion.matches || !finePointer.matches || pending) return;
    const x = event.clientX, y = event.clientY;
    pending = requestAnimationFrame(() => {
      pending = 0;
      const bounds = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${((y - bounds.top) / bounds.height - 0.5) * -5}deg`);
      card.style.setProperty('--tilt-y', `${((x - bounds.left) / bounds.width - 0.5) * 5}deg`);
    });
  }, { passive: true });
  card.addEventListener('pointerleave', reset);
  reducedMotion.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
}
motionButton?.addEventListener('click', () => {
  motionPaused = !motionPaused;
  motionButton.setAttribute('aria-pressed', String(motionPaused));
  motionButton.textContent = motionPaused ? 'Resume 3D' : 'Pause 3D';
  cancelAnimationFrame(frame); frame = 0;
  wake();
});
initialiseScenes().catch(() => { /* Static artwork remains available. */ });


// Build the portrait from hexagonal fragments, leaving the real image as fallback.
const portrait = document.querySelector('.portrait-image');
const portraitImage = portrait?.querySelector('img');
const hexLayer = portrait?.querySelector('.hex-layer');
let assemblyAnimations = [];
let assembling = false;
let assembled = false;
function finishAssembly() {
  assemblyAnimations.forEach(animation => animation.cancel());
  assemblyAnimations = [];
  portrait?.classList.remove('is-assembling');
  hexLayer?.replaceChildren();
  assembling = false;
}
async function assemblePortrait() {
  if (!portrait || !hexLayer || !portraitImage?.complete || !portraitImage.naturalWidth ||
      reducedMotion.matches || motionPaused || assembling || assembled || typeof portrait.animate !== 'function') return;
  const width = portrait.clientWidth, height = portrait.clientHeight;
  if (!width || !height) return;
  assembled = true;
  assembling = true;
  const radius = width / 9;
  const stepY = Math.sqrt(3) * radius;
  const compact = width < 350;
  try {
    for (let column = -1; column * radius * 1.5 < width + radius; column++) {
      for (let row = -1; row * stepY < height + stepY; row++) {
        const cx = column * radius * 1.5;
        const cy = row * stepY + (Math.abs(column % 2) ? stepY / 2 : 0);
        const piece = document.createElement('span');
        piece.className = 'hex-piece';
        piece.style.backgroundImage = `url("${portraitImage.currentSrc || portraitImage.src}")`;
        const vertices = Array.from({ length: 6 }, (_, index) => {
          const angle = index * Math.PI / 3;
          return `${cx + Math.cos(angle) * (radius + 0.6)}px ${cy + Math.sin(angle) * (radius + 0.6)}px`;
        });
        piece.style.clipPath = `polygon(${vertices.join(',')})`;
        hexLayer.appendChild(piece);
        const dx = (cx - width / 2) * (compact ? 0.4 : 0.65);
        const dy = (cy - height / 2) * 0.45;
        const delay = Math.min(420, Math.hypot(cx - width / 2, cy - height / 2) * 1.1);
        const animation = piece.animate([
          { opacity: 0, transform: `translate(${dx}px, ${dy}px) rotate(${column % 2 ? -12 : 12}deg) scale(.65)` },
          { opacity: 1, transform: 'translate(0,0) rotate(0deg) scale(1)' }
        ], { duration: 1050, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
        assemblyAnimations.push(animation);
      }
    }
    portrait.classList.add('is-assembling');
    await Promise.allSettled(assemblyAnimations.map(animation => animation.finished));
  } catch {
    // Keep the original photo if fragment animation is unsupported.
  } finally { finishAssembly(); }
}
if (portrait && portraitImage && hexLayer) {
  let portraitVisible = false;
  if ('IntersectionObserver' in window) {
    const portraitObserver = new IntersectionObserver(entries => {
      portraitVisible = entries[0].isIntersecting && entries[0].intersectionRatio >= 0.25;
      if (portraitVisible) assemblePortrait();
    }, { threshold: .25 });
    portraitObserver.observe(portrait);
  } else { portraitVisible = true; assemblePortrait(); }
  portraitImage.addEventListener('load', () => { if (portraitVisible) assemblePortrait(); });
  reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) finishAssembly(); });
  window.addEventListener('resize', finishAssembly, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishAssembly(); });
  motionButton?.addEventListener('click', () => { if (motionPaused) finishAssembly(); });
}
