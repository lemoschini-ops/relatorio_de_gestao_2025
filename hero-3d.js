// Elemento 3D do destaque: série histórica do indicador da Figura 1 em barras tridimensionais.
// Carrega three.js apenas quando há WebGL e o destaque está visível; respeita prefers-reduced-motion,
// pausa fora da tela e oferece versão 2D (barras em HTML) quando o 3D não está disponível.
const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js';
const stage = document.getElementById('hero-3d-stage');
const desc = document.getElementById('hero-3d-desc');
const toggle = document.getElementById('hero-3d-toggle');
const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const compact = v => Number(v).toLocaleString('pt-BR', { notation: 'compact', maximumFractionDigits: 1 });
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

let detail = null, scene3d = null, loading = false;

function rows(d) {
  const ys = [...d.years].sort();
  return ys.map(y => ({ year: y, point: d.s.points.find(p => p.year === y), ref: y === String(d.year), base: y === String(d.baseline) }));
}

function describe(d) {
  const list = rows(d).map(r => `${r.year}: ${r.point ? Number(r.point.exact ?? r.point.value).toLocaleString('pt-BR', { maximumFractionDigits: 10 }) : 'N/D'}`).join('; ');
  desc.textContent = `${d.s.title} (${d.s.scope}, ${d.s.unit}) em barras 3D. Amarelo: ${d.year}, ano de referência; azul claro: ${d.baseline}, comparação. ${list}.`;
}

function fallback(d) {
  stage.classList.add('is-static');
  const rs = rows(d), max = Math.max(1, ...rs.map(r => r.point?.value || 0));
  stage.innerHTML = '<ul class="hero-3d-fallback" aria-hidden="true">' + rs.map(r =>
    `<li class="${r.ref ? 'ref' : r.base ? 'base' : ''}"><span>${r.point ? esc(compact(r.point.value)) : 'N/D'}</span><i style="height:${r.point ? Math.max(2, r.point.value / max * 70) : 0}%"></i><span>${esc(r.year)}</span></li>`).join('') + '</ul>';
}

function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

function show(d) {
  if (!d?.s) return;
  detail = d; describe(d);
  if (scene3d) scene3d.update(d); else { fallback(d); maybeLoad(); }
}

function maybeLoad() {
  if (loading || scene3d || !webglAvailable() || navigator.connection?.saveData) return;
  const start = () => {
    loading = true;
    import(THREE_URL).then(THREE => { scene3d = createScene(THREE); if (detail) scene3d.update(detail); })
      .catch(() => { loading = false; if (detail) fallback(detail); });
  };
  if (!('IntersectionObserver' in window)) return start();
  const io = new IntersectionObserver(entries => { if (entries.some(e => e.isIntersecting)) { io.disconnect(); start(); } });
  io.observe(stage);
}

function labelSprite(THREE, text, color, size) {
  const c = document.createElement('canvas'), ctx = c.getContext('2d'), font = `600 ${size * 4}px Rawline, Raleway, sans-serif`;
  ctx.font = font; const w = Math.ceil(ctx.measureText(text).width) + 16, h = size * 5;
  c.width = w; c.height = h; ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w / 2, h / 2);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false }));
  const scale = 0.0105 * size; sprite.scale.set(w / h * scale * 1.25, scale * 1.25, 1);
  return sprite;
}

function createScene(THREE) {
  stage.innerHTML = '';
  stage.classList.remove('is-static');
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.domElement.setAttribute('aria-hidden', 'true');
  stage.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 3.4, 9.2); camera.lookAt(0, 1.05, 0);
  scene.add(new THREE.HemisphereLight(0xdbe8fb, 0x071d41, 1.6));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(3, 6, 5); scene.add(sun);
  const group = new THREE.Group(); scene.add(group);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(7.4, 0.08, 1.9), new THREE.MeshStandardMaterial({ color: 0x0c326f, roughness: 0.9, transparent: true, opacity: 0.85 }));
  floor.position.y = -0.04; group.add(floor);
  let bars = [], growStart = 0, paused = false, visible = true, frame = 0, dragging = false, lastX = 0, userAngle = 0;
  const motionOK = () => !reduceQuery.matches;

  function clearBars() {
    for (const o of bars) { group.remove(o); o.traverse(m => { m.geometry?.dispose(); if (m.material) { m.material.map?.dispose(); m.material.dispose(); } }); }
    bars = [];
  }
  function update(d) {
    clearBars();
    const rs = rows(d), max = Math.max(1, ...rs.map(r => r.point?.value || 0)), gap = 7 / rs.length, ink = css('--hero3d-ink') || '#fff';
    rs.forEach((r, i) => {
      const x = -3.5 + gap * (i + 0.5), holder = new THREE.Group(); holder.position.x = x;
      const color = r.ref ? css('--hero3d-ref') : r.base ? css('--hero3d-base') : css('--hero3d-main');
      const target = r.point ? Math.max(0.03, r.point.value / max * 2.3) : 0;
      if (r.point) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(gap * 0.56, 1, gap * 0.56), new THREE.MeshStandardMaterial({ color: new THREE.Color(color || '#5992ed'), roughness: 0.45, metalness: 0.1 }));
        mesh.userData.target = target; mesh.scale.y = motionOK() ? 0.001 : target; mesh.position.y = mesh.scale.y / 2; holder.add(mesh);
        const value = labelSprite(THREE, compact(r.point.value), ink, 9); value.position.y = target + 0.28; value.userData.follow = mesh; holder.add(value);
      } else {
        const ghost = new THREE.Mesh(new THREE.BoxGeometry(gap * 0.56, 0.02, gap * 0.56), new THREE.MeshBasicMaterial({ color: 0xc5d4eb, wireframe: true }));
        holder.add(ghost); const nd = labelSprite(THREE, 'N/D', ink, 9); nd.position.y = 0.3; holder.add(nd);
      }
      const yl = labelSprite(THREE, r.year, ink, 10); yl.position.set(0, -0.32, 1.05); holder.add(yl);
      group.add(holder); bars.push(holder);
    });
    growStart = performance.now(); request();
  }
  function step(now) {
    frame = 0;
    const t = Math.min(1, (now - growStart) / 900), ease = 1 - Math.pow(1 - t, 3);
    let growing = false;
    for (const h of bars) h.children.forEach(m => {
      if (m.userData.target !== undefined) { const s = motionOK() ? Math.max(0.001, m.userData.target * ease) : m.userData.target; m.scale.y = s; m.position.y = s / 2; if (s < m.userData.target) growing = true; }
      if (m.userData.follow) m.position.y = m.userData.follow.scale.y + 0.28;
    });
    const auto = motionOK() && !paused ? Math.sin(now / 4200) * 0.32 : 0;
    group.rotation.y = auto + userAngle;
    renderer.render(scene, camera);
    if (visible && !document.hidden && (growing || (motionOK() && !paused))) request();
  }
  function request() { if (!frame) frame = requestAnimationFrame(step); }
  function resize() {
    const w = stage.clientWidth || 1, h = stage.clientHeight || 1;
    renderer.setSize(w, h, false); camera.aspect = w / h;
    camera.position.z = w / h < 1.6 ? 11.5 : 9.2; camera.updateProjectionMatrix(); request();
  }
  new ResizeObserver(resize).observe(stage); resize();
  new IntersectionObserver(es => { visible = es.some(e => e.isIntersecting); if (visible) request(); }).observe(stage);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) request(); });
  reduceQuery.addEventListener?.('change', () => { syncToggle(); request(); });
  new MutationObserver(() => detail && update(detail)).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

  stage.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; stage.setPointerCapture?.(e.pointerId); });
  stage.addEventListener('pointermove', e => { if (!dragging) return; userAngle = Math.max(-0.9, Math.min(0.9, userAngle + (e.clientX - lastX) * 0.008)); lastX = e.clientX; request(); });
  const end = () => { dragging = false; };
  stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);

  function syncToggle() {
    toggle.hidden = !motionOK();
    toggle.textContent = paused ? 'Retomar animação' : 'Pausar animação';
  }
  toggle.addEventListener('click', () => { paused = !paused; syncToggle(); request(); });
  syncToggle();
  return { update };
}

document.addEventListener('dashboard:trend', e => show(e.detail));
if (globalThis.__dashboardTrend) show(globalThis.__dashboardTrend);
