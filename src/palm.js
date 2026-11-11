// -*- coding: utf-8 -*-
// -------------------------------------------------------------------------------
// Author: Mohamed Salem (Expert AI Engineer & Automation Architect)
// Focus: AI Engineering | Automation | Agentic Systems
// Copyright (c) 2026. All Rights Reserved.
// -------------------------------------------------------------------------------
// Procedural, detailed date palm (Phoenix dactylifera): ringed trunk with leaf-base
// scars, ~36 pinnate fronds with individual leaflets, and date clusters.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

function rng(seed) { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); }

function barkTexture() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 512;
  const g = c.getContext('2d'), r = rng(7);
  g.fillStyle = '#6b5236'; g.fillRect(0, 0, 256, 512);
  for (let y = 0; y < 512; y += 18) { // diamond leaf-base scars in rings
    for (let x = -20; x < 276; x += 34) {
      const ox = x + ((y / 18) % 2) * 17, sh = 70 + r() * 40;
      g.fillStyle = `rgb(${sh + 30},${sh},${sh - 25})`;
      g.beginPath(); g.moveTo(ox, y); g.lineTo(ox + 15, y + 9); g.lineTo(ox, y + 18); g.lineTo(ox - 15, y + 9); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(25,15,5,.55)'; g.lineWidth = 2; g.stroke();
    }
  }
  for (let i = 0; i < 4000; i++) { g.fillStyle = `rgba(${r() < .5 ? '20,12,4' : '170,140,100'},${r() * .25})`; g.fillRect(r() * 256, r() * 512, 1 + r() * 2, 2 + r() * 6); }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function buildPalm(seed = 1) {
  const r = rng(seed), H = 9, geos = { trunk: [], frond: [], fruit: [] };
  // trunk: slightly curved, tapered, with a bulged base and swollen crown
  const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector3(Math.sin(t * 2.2) * 0.25, t * H, Math.cos(t * 1.4) * 0.12)); }
  const curve = new THREE.CatmullRomCurve3(pts), seg = 40, rad = 10;
  const tg = new THREE.TubeGeometry(curve, seg, 0.3, rad, false);
  const p = tg.attributes.position, uv = tg.attributes.uv, tmp = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    const t = Math.floor(i / (rad + 1)) / seg, c = curve.getPoint(t);
    tmp.set(p.getX(i), p.getY(i), p.getZ(i)).sub(c);
    const k = (0.62 - 0.22 * t + 0.35 * Math.pow(1 - t, 8) + 0.16 * Math.pow(t, 14)) / 0.3;
    p.setXYZ(i, c.x + tmp.x * k, c.y + tmp.y * k, c.z + tmp.z * k); uv.setXY(i, uv.getX(i) * 2, t * 5);
  }
  tg.computeVertexNormals(); geos.trunk.push(tg);
  const top = curve.getPoint(1);
  // fronds
  const FR = 38, leaflet = new THREE.PlaneGeometry(0.05, 1, 1, 1).translate(0, 0.5, 0);
  for (let f = 0; f < FR; f++) {
    const ring = f / FR, az = f * 2.39996 + r() * 0.3;           // golden-angle phyllotaxy
    const pitch = THREE.MathUtils.lerp(1.15, -0.25, Math.pow(ring, 0.8)); // young fronds upright, old ones droop
    const len = 4.2 + r() * 1.2 - ring * 0.5, M = 14, rachis = [];
    for (let i = 0; i <= M; i++) {
      const t = i / M, ang = pitch - t * t * (1.0 + ring * 0.9);
      rachis.push(new THREE.Vector3(Math.cos(ang) * t * len * 0.5 + (i ? rachis[i - 1].x : 0) * 0, 0, 0));
    }
    // integrate a drooping arc
    const arc = [new THREE.Vector3()]; let a = pitch, step = len / M;
    for (let i = 1; i <= M; i++) { a -= (0.05 + 0.2 * (i / M)) * (0.8 + ring * 0.8); const q = arc[i - 1]; arc.push(new THREE.Vector3(q.x + Math.cos(a) * step, q.y + Math.sin(a) * step, 0)); }
    const m = new THREE.Matrix4().makeRotationY(az).setPosition(top.x, top.y + 0.1, top.z);
    const rg = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(arc), M, 0.028 * (1 - ring * 0.3), 4);
    rg.applyMatrix4(m); geos.frond.push(rg);
    // leaflets on both sides along the rachis
    for (let i = 3; i <= M; i++) {
      const t = i / M, q = arc[i], next = arc[Math.min(i + 1, M)], dir = next.clone().sub(q).normalize();
      const ll = (0.95 - Math.abs(t - 0.45) * 1.1) * (0.9 + r() * 0.2) + 0.15;
      for (const side of [-1, 1]) for (let k = 0; k < 3; k++) {
        const g2 = leaflet.clone();
        const base = q.clone().lerp(next, k / 3);
        const lm = new THREE.Matrix4();
        const qz = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.atan2(dir.y, dir.x) - Math.PI / 2 + 0.0);
        const qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), side * (0.9 + (r() - .5) * 0.25));
        const qd = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -side * 0.45); // V-shaped fold & droop
        const quat = new THREE.Quaternion().multiplyQuaternions(qz, qy).multiply(qd);
        lm.compose(base, quat, new THREE.Vector3(1, ll, 1));
        g2.applyMatrix4(lm); g2.applyMatrix4(m); geos.frond.push(g2);
      }
    }
  }
  // date clusters hanging under the crown
  for (let c = 0; c < 4; c++) {
    const az = r() * Math.PI * 2, base = new THREE.Vector3(top.x + Math.cos(az) * 0.35, top.y - 0.15, top.z + Math.sin(az) * 0.35);
    for (let i = 0; i < 40; i++) {
      const s = new THREE.SphereGeometry(0.045, 6, 5).scale(1, 1.5, 1);
      s.translate(base.x + (r() - .5) * 0.35, base.y - r() * 0.6, base.z + (r() - .5) * 0.35); geos.fruit.push(s);
    }
  }
  const merge = (a) => { a.forEach((g) => { g.deleteAttribute('uv1'); }); return mergeGeometries(a.map((g) => g.index ? g.toNonIndexed() : g)); };
  const bark = barkTexture();
  const mats = {
    trunk: new THREE.MeshStandardMaterial({ map: bark, bumpMap: bark, bumpScale: 3, roughness: 1, color: 0xd0b79a }),
    frond: new THREE.MeshStandardMaterial({ color: 0x5f7a2e, roughness: 0.65, side: THREE.DoubleSide }),
    fruit: new THREE.MeshStandardMaterial({ color: 0x8a3b10, roughness: 0.4 })
  };
  const group = new THREE.Group();
  for (const k of ['trunk', 'frond', 'fruit']) { const m = new THREE.Mesh(merge(geos[k]), mats[k]); m.castShadow = true; m.receiveShadow = k === 'trunk'; group.add(m); }
  group.userData.height = top.y + 3;
  return group;
}
