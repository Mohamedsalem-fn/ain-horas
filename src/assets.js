// -*- coding: utf-8 -*-
// -------------------------------------------------------------------------------
// Author: Mohamed Salem (Expert AI Engineer & Automation Architect)
// Focus: AI Engineering | Automation | Agentic Systems
// Copyright (c) 2026. All Rights Reserved.
// -------------------------------------------------------------------------------
// Drop-in high-detail assets. Put GLB files in public/models/ with these names and
// they replace the low-detail built-in trees and statues automatically:
//   palm.glb            -> date palm (replaces the `trees` mesh, instanced)
//   statue_*.glb        -> listed in STATUES below (placed at x,z; y snapped to ground)
import * as THREE from 'three';
import { buildPalm } from './palm.js';

const exists = (url) => fetch(url, { method: 'HEAD' }).then((r) => r.ok && !/text\/html/.test(r.headers.get('content-type') || '')).catch(() => false);

// Editable placements (world units of abydos.glb). file, position [x,z], rotationY (deg), height in metres.
export const STATUES = [
  // Drop-in compatible: place authentic 19th-Dynasty statues (e.g. Seti I, Osiris, Horus, or Ramesses II) in public/models/
];

// Cluster the vertices of the `trees` mesh into individual tree positions.
function treePositions(treesMesh) {
  const pos = treesMesh.geometry.attributes.position, v = new THREE.Vector3(), cell = 2.5, map = new Map();
  treesMesh.updateWorldMatrix(true, false);
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(treesMesh.matrixWorld);
    const k = `${Math.floor(v.x / cell)},${Math.floor(v.z / cell)}`;
    const c = map.get(k) || { x: 0, z: 0, y: Infinity, n: 0, kx: Math.floor(v.x / cell), kz: Math.floor(v.z / cell) };
    c.x += v.x; c.z += v.z; c.n++; c.y = Math.min(c.y, v.y); map.set(k, c);
  }
  // union neighbouring cells
  const parent = new Map([...map.keys()].map((k) => [k, k]));
  const find = (k) => (parent.get(k) === k ? k : (parent.set(k, find(parent.get(k))), parent.get(k)));
  for (const c of map.values()) for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const nk = `${c.kx + dx},${c.kz + dz}`;
    if (map.has(nk)) parent.set(find(`${c.kx},${c.kz}`), find(nk));
  }
  const groups = new Map();
  for (const [k, c] of map) {
    const r = find(k), g = groups.get(r) || { x: 0, z: 0, y: Infinity, n: 0 };
    g.x += c.x; g.z += c.z; g.n += c.n; g.y = Math.min(g.y, c.y); groups.set(r, g);
  }
  return [...groups.values()].filter((g) => g.n > 20).map((g) => new THREE.Vector3(g.x / g.n, g.y, g.z / g.n));
}

export async function upgradeAssets(scene, model, gltfLoader, onWind) {
  // ----- remove and replace old tree mesh -----
  const trees = model.getObjectByName('trees');
  if (trees) {
    trees.visible = false;
    trees.traverse((child) => {
      if (child.isMesh) {
        child.visible = false;
        if (child.geometry) child.geometry.dispose();
      }
    });
  }

  // ----- palms -----
  if (await exists('/models/palm.glb')) {
    const g = await gltfLoader.loadAsync('/models/palm.glb');
    const meshes = []; g.scene.traverse((o) => o.isMesh && meshes.push(o));
    const box = new THREE.Box3().setFromObject(g.scene), h = box.max.y - box.min.y;
    const spots = trees ? treePositions(trees.isMesh ? trees : trees.children.find((c) => c.isMesh)) : [];
    if (spots.length) {
      const group = new THREE.Group(); group.name = 'palms';
      for (const m of meshes) {
        const inst = new THREE.InstancedMesh(m.geometry, m.material, spots.length);
        inst.castShadow = inst.receiveShadow = true;
        const d = new THREE.Object3D();
        spots.forEach((p, i) => {
          const s = (7 + Math.random() * 5) / h; // date palms ~7-12 m
          d.position.set(p.x, p.y - box.min.y * s, p.z);
          d.rotation.set(0, Math.random() * Math.PI * 2, 0); d.scale.setScalar(s); d.updateMatrix();
          d.matrix.multiply(m.matrixWorld.clone().multiply(new THREE.Matrix4().copy(g.scene.matrixWorld).invert()));
          inst.setMatrixAt(i, d.matrix);
        });
        const mat = Array.isArray(inst.material) ? inst.material[0] : inst.material;
        mat.side = THREE.DoubleSide; if (mat.transparent || mat.alphaMap) mat.alphaTest = 0.45;
        mat.onBeforeCompile = (sh) => { // gentle wind sway, stronger toward the crown
          sh.uniforms.uTime = onWind; sh.vertexShader = 'uniform float uTime;\n' + sh.vertexShader.replace('#include <begin_vertex>',
            `#include <begin_vertex>\nfloat w = smoothstep(0.0, ${h.toFixed(2)}, position.y - ${box.min.y.toFixed(2)});\n transformed.x += sin(uTime.value*1.3 + instanceMatrix[3].x*0.5) * 0.04 * w; transformed.z += cos(uTime.value*1.1 + instanceMatrix[3].z*0.5) * 0.04 * w;`.replace('uTime.value', 'uTime'));
        };
        group.add(inst);
      }
      scene.add(group);
    }
  }
  // ----- procedural palms (when no palm.glb is provided) -----
  else {
    const mesh = trees && (trees.isMesh ? trees : trees.children.find((c) => c.isMesh));
    const spots = mesh ? treePositions(mesh) : [];
    const palms = new THREE.Group(); palms.name = 'palms';
    const variants = [1, 2, 3, 4].map((sd) => buildPalm(sd));
    spots.forEach((p, i) => {
      const src = variants[i % variants.length], o = src.clone();
      const sc = 0.85 + ((i * 7919) % 100) / 300;
      o.position.copy(p); o.rotation.y = (i * 2.4) % (Math.PI * 2); o.scale.setScalar(sc); palms.add(o);
    });
    if (spots.length) { scene.add(palms); }
  }
  // ----- statues -----
  const ray = new THREE.Raycaster(); const ground = [];
  model.traverse((o) => o.isMesh && ground.push(o));
  for (const s of STATUES) {
    if (!(await exists('/models/' + s.file))) continue;
    const g = await gltfLoader.loadAsync('/models/' + s.file), obj = g.scene;
    const b = new THREE.Box3().setFromObject(obj); obj.scale.setScalar(s.height / (b.max.y - b.min.y));
    obj.rotation.y = THREE.MathUtils.degToRad(s.rotY || 0);
    ray.set(new THREE.Vector3(s.at[0], 1000, s.at[1]), new THREE.Vector3(0, -1, 0));
    const hit = ray.intersectObjects(ground, false)[0];
    const b2 = new THREE.Box3().setFromObject(obj);
    obj.position.set(s.at[0], (hit ? hit.point.y : 0) - b2.min.y, s.at[1]);
    obj.traverse((o) => o.isMesh && (o.castShadow = o.receiveShadow = true));
    scene.add(obj);
  }
}
