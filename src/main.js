// -*- coding: utf-8 -*-
// -------------------------------------------------------------------------------
// Author: Mohamed Salem (Expert AI Engineer & Automation Architect)
// Focus: AI Engineering | Automation | Agentic Systems
// Copyright (c) 2026. All Rights Reserved.
// -------------------------------------------------------------------------------
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Sky } from 'three/examples/jsm/objects/Sky.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { upgradeAssets } from './assets.js';

const T = {
  ar: { title: 'عين حورس · معبد سيتي الأول وأوزيريون، أبيدوس', explore: 'استكشاف', walk: 'مشي', pano: 'صور 360° حقيقية', time: 'الوقت', ar: 'واقع معزز', vr: 'واقع افتراضي', loading: 'جارٍ تحميل المعبد…', noxr: 'غير مدعوم على هذا الجهاز' },
  en: { title: 'Eye of Horus · Temple of Seti I & Osireion, Abydos', explore: 'Explore', walk: 'Walk', pano: 'Real 360° photos', time: 'Time of day', ar: 'Augmented reality', vr: 'Virtual reality', loading: 'Loading the temple…', noxr: 'Not supported on this device' }
};
let lang = 'ar';
const $ = (s) => document.querySelector(s);
function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  document.querySelectorAll('[data-i18n]').forEach((e) => (e.textContent = T[lang][e.dataset.i18n]));
  $('#lang').textContent = lang === 'ar' ? 'EN' : 'عربي';
  $('#loadtxt').textContent = T[lang].loading;
}
$('#lang').onclick = () => { lang = lang === 'ar' ? 'en' : 'ar'; applyLang(); };
applyLang();

// ---------- renderer ----------
const canvas = $('#c');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.55;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.xr.enabled = true;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 5000);
camera.position.set(120, 60, 160);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI * 0.495;

// ---------- sky, sun, light ----------
const sky = new Sky();
sky.scale.setScalar(10000);
scene.add(sky);
const su = sky.material.uniforms;
su.turbidity.value = 4; su.rayleigh.value = 1.6; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.85;
const sun = new THREE.DirectionalLight(0xfff0d0, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(4096, 4096);
Object.assign(sun.shadow.camera, { left: -250, right: 250, top: 250, bottom: -250, near: 1, far: 1200 });
sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.6;
scene.add(sun, sun.target);
const hemi = new THREE.HemisphereLight(0xbfd8ff, 0xc9a26a, 0.7);
scene.add(hemi);
const pmrem = new THREE.PMREMGenerator(renderer);
const envScene = new THREE.Scene();
const envSky = sky.clone(); envSky.material = sky.material; envScene.add(envSky);

let hour = 15.5;
const sunV = new THREE.Vector3();
function setTime(h) {
  const el = Math.sin(((h - 6) / 12) * Math.PI) * 70 + 2; // elevation deg
  const az = ((h - 6) / 12) * 180 + 90;
  sunV.setFromSphericalCoords(1, THREE.MathUtils.degToRad(90 - el), THREE.MathUtils.degToRad(az));
  su.sunPosition.value.copy(sunV);
  sun.position.copy(sunV).multiplyScalar(600);
  const k = THREE.MathUtils.clamp(el / 25, 0.05, 1);
  sun.intensity = 3.2 * k;
  sun.color.setHSL(0.09, 0.7 - 0.2 * k, 0.55 + 0.25 * k);
  hemi.intensity = 0.15 + 0.6 * k;
  renderer.toneMappingExposure = 0.35 + 0.3 * k;
  if (scene.environment) scene.environment.dispose();
  scene.environment = pmrem.fromScene(envScene, 0.02).texture;
}
setTime(hour);
$('#bTime').onclick = () => { hour = hour >= 18 ? 6 : hour + 1.5; setTime(hour); };

// ---------- atmosphere & procedural surface detail ----------
scene.fog = new THREE.FogExp2(0xe6d2a8, 0.0006);
function noiseTexture(size = 512, octaves = 5) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  const g = c.getContext('2d'), img = g.createImageData(size, size);
  const grid = [];
  for (let o = 0; o < octaves; o++) { const n = 4 << o; grid.push({ n, v: Array.from({ length: n * n }, Math.random) }); }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let v = 0, a = 0.5;
    for (const { n, v: d } of grid) {
      const fx = (x / size) * n, fy = (y / size) * n, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
      const f = (i, j) => d[((j % n) * n) + (i % n)];
      const top = f(x0, y0) * (1 - tx) + f(x0 + 1, y0) * tx, bot = f(x0, y0 + 1) * (1 - tx) + f(x0 + 1, y0 + 1) * tx;
      v += (top * (1 - ty) + bot * ty) * a; a *= 0.5;
    }
    const k = Math.min(255, v * 255 * 1.9), i = (y * size + x) * 4;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = k; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 6);
  return t;
}
const detail = noiseTexture();

// ---------- optional AI/photographic textures (public/textures) ----------
// Each entry maps a texture file to GLB material names. Missing files are skipped silently.
const TEXTURE_MAP = {
  relief_painted: { re: /relief|kinglist|kadesh|stela|osiride|gates|chapel|nut|rii/, repeat: [2, 2] },
  column_painted: { re: /column|pillar|egypt_band|kheker|capital/, repeat: [1, 2] },
  ceiling_stars: { re: /vault/, repeat: [4, 4] },
  sandstone: { re: /^sandstone|sandstone_blocks|pylon/, repeat: [6, 6] },
  limestone: { re: /limestone/, repeat: [6, 6] },
  granite: { re: /granite/, repeat: [4, 4] },
  mudbrick: { re: /mud/, repeat: [8, 8] },
  sand: { re: /^sand$|desert|redsand/, repeat: [40, 40] }
};
function applyCustomTextures(root) {
  const loader = new THREE.TextureLoader();
  const mats = new Set();
  root.traverse((o) => o.isMesh && (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m)));
  for (const [file, { re, repeat }] of Object.entries(TEXTURE_MAP)) {
    const targets = [...mats].filter((m) => re.test(m.name));
    if (!targets.length) continue;
    const load = (suffix, cs, apply) => loader.load(`/textures/${file}${suffix}.jpg`, (t) => {
      t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(...repeat); t.colorSpace = cs;
      t.anisotropy = renderer.capabilities.getMaxAnisotropy();
      targets.forEach((m) => { apply(m, t); m.needsUpdate = true; });
    }, undefined, () => {});
    load('', THREE.SRGBColorSpace, (m, t) => { m.map = t; m.color.set(0xffffff); });
    load('_normal', THREE.NoColorSpace, (m, t) => { m.normalMap = t; m.bumpMap = null; });
    load('_rough', THREE.NoColorSpace, (m, t) => { m.roughnessMap = t; });
  }
}

const windTime = { value: 0 };
// ---------- model ----------
const draco = new DRACOLoader().setDecoderPath('/draco/');
const gltf = new GLTFLoader().setDRACOLoader(draco);
let model;
gltf.load('/models/abydos.glb', (g) => {
  model = g.scene;
  const maxAniso = renderer.capabilities.getMaxAnisotropy();
  model.traverse((o) => {
    if (!o.isMesh) return;
    o.castShadow = o.receiveShadow = true;
    const ms = Array.isArray(o.material) ? o.material : [o.material];
    ms.forEach((m) => {
      for (const k of ['map', 'normalMap', 'roughnessMap']) if (m[k]) { m[k].anisotropy = maxAniso; m[k].needsUpdate = true; }
      m.envMapIntensity = 0.8;
      if (/sandstone|limestone|granite|rock|cliff|pillar|column|pylon|dado|flagstones|paving|mud|sand|dirt/.test(m.name)) {
        m.bumpMap = detail; m.bumpScale = 1.2; m.roughnessMap = m.roughnessMap || detail;
        m.roughness = Math.max(m.roughness ?? 0.9, 0.85);
        if (m.map && /sand|desert|dirt|redsand/.test(m.name)) m.color.setRGB(1.05, 0.98, 0.88);
      }
      if (/water/.test(m.name)) { m.roughness = 0.05; m.metalness = 0.1; m.transparent = true; m.opacity = 0.85; }
      if (/foliage|palm|trees/.test(m.name)) { m.alphaTest = 0.4; m.side = THREE.DoubleSide; }
      if (/gold|bronze/.test(m.name)) { m.metalness = 1; m.roughness = 0.25; }
    });
  });
  applyCustomTextures(model);
  upgradeAssets(scene, model, gltf, windTime).catch((e) => console.warn('asset upgrade skipped', e));
  scene.add(model);
  const box = new THREE.Box3().setFromObject(model);
  const c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3());
  controls.target.copy(c);
  camera.position.set(c.x + s.x * 0.35, c.y + s.y * 0.5 + 40, c.z + s.z * 0.45);
  sun.target.position.copy(c);
  Object.assign(sun.shadow.camera, { left: -s.x / 2, right: s.x / 2, top: s.z / 2, bottom: -s.z / 2 });
  sun.shadow.camera.updateProjectionMatrix();
  $('#loader').style.opacity = 0;
  setTimeout(() => { $('#loader').remove(); $('#hud').hidden = false; }, 800);
}, (e) => { if (e.total) $('#prog').style.width = (e.loaded / e.total) * 100 + '%'; }, (err) => { $('#loadtxt').textContent = 'Error: ' + err.message; });

// ---------- real 360 panoramas (from bootstrap.json) ----------
let nodes = [], pano = null, panoIdx = 0, mode = 'explore';
fetch('/data/bootstrap.json').then((r) => r.json()).then((b) => { nodes = b.space.space_data.nodes; });
const texLoader = new THREE.CubeTextureLoader();
function showPano(i) {
  const n = nodes[i]; if (!n) return;
  panoIdx = i;
  // faces are ordered px,nx,py,ny,pz,nz
  pano = texLoader.load(n.faces, () => { scene.background = pano; scene.backgroundRotation.set(0, 0, 0); });
  mode = 'pano'; sky.visible = false; if (model) model.visible = false;
  controls.enableZoom = false; controls.maxPolarAngle = Math.PI;
  camera.position.set(0, 0, 0.01); controls.target.set(0, 0, 0);
  $('#info').textContent = `${n.label} · ${i + 1}/${nodes.length}  (← →)`;
}
function exitPano() {
  mode = 'explore'; scene.background = null; sky.visible = true; if (model) model.visible = true;
  controls.enableZoom = true; controls.maxPolarAngle = Math.PI * 0.495; $('#info').textContent = '';
  if (model) { const c = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3()); controls.target.copy(c); camera.position.set(c.x + 120, c.y + 90, c.z + 150); }
}
$('#bPano').onclick = () => (mode === 'pano' ? exitPano() : showPano(panoIdx));
$('#bExplore').onclick = () => mode === 'pano' && exitPano();
addEventListener('keydown', (e) => {
  if (mode !== 'pano') return;
  if (e.key === 'ArrowRight') showPano((panoIdx + 1) % nodes.length);
  if (e.key === 'ArrowLeft') showPano((panoIdx - 1 + nodes.length) % nodes.length);
});

// ---------- walk mode (ground-level view) ----------
$('#bWalk').onclick = () => {
  if (!model) return;
  if (mode === 'pano') exitPano();
  const c = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
  const ray = new THREE.Raycaster(new THREE.Vector3(c.x, 500, c.z + 60), new THREE.Vector3(0, -1, 0));
  const hit = ray.intersectObject(model, true)[0];
  const y = hit ? hit.point.y + 1.7 : c.y + 1.7;
  camera.position.set(c.x, y, c.z + 60); controls.target.set(c.x, y, c.z);
  controls.maxDistance = 400;
};

// ---------- WebXR ----------
async function xrBtn(el, mk, sessionType) {
  if (!navigator.xr || !(await navigator.xr.isSessionSupported(sessionType).catch(() => false))) { el.disabled = true; el.title = T[lang].noxr; el.style.opacity = 0.4; return; }
  const b = mk(renderer, sessionType === 'immersive-ar' ? { requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: { root: document.body } } : undefined);
  b.style.display = 'none'; document.body.appendChild(b);
  el.onclick = () => b.click();
}
xrBtn($('#bAR'), (r, o) => ARButton.createButton(r, o), 'immersive-ar');
xrBtn($('#bVR'), (r) => VRButton.createButton(r), 'immersive-vr');

// AR: place a miniature of the temple on a detected surface by tapping
const reticle = new THREE.Mesh(new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xe6b84f }));
reticle.matrixAutoUpdate = false; reticle.visible = false; scene.add(reticle);
let hitSrc = null;
renderer.xr.addEventListener('sessionstart', async () => {
  const s = renderer.xr.getSession();
  if (s.environmentBlendMode === 'opaque') { controls.enabled = false; return; }
  sky.visible = false; scene.background = null; controls.enabled = false;
  if (model) { model.userData.p = model.position.clone(); model.userData.s = model.scale.clone(); model.scale.setScalar(0.004); model.visible = false; }
  const ref = await s.requestReferenceSpace('viewer');
  hitSrc = await s.requestHitTestSource({ space: ref });
  s.addEventListener('select', () => { if (reticle.visible && model) { model.position.setFromMatrixPosition(reticle.matrix); model.visible = true; } });
});
renderer.xr.addEventListener('sessionend', () => {
  hitSrc = null; reticle.visible = false; controls.enabled = true; sky.visible = mode !== 'pano';
  if (model) { model.scale.copy(model.userData.s); model.position.copy(model.userData.p); model.visible = mode !== 'pano'; }
});

addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });
renderer.setAnimationLoop((_, frame) => {
  if (frame && hitSrc) {
    const hits = frame.getHitTestResults(hitSrc);
    if (hits.length) { const p = hits[0].getPose(renderer.xr.getReferenceSpace()); reticle.visible = true; reticle.matrix.fromArray(p.transform.matrix); } else reticle.visible = false;
  }
  windTime.value = performance.now() / 1000;
  controls.update();
  renderer.render(scene, camera);
});

