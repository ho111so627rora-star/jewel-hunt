import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Color, Kind, Play } from '../../game/types';

export const PALETTE: Record<Color, string> = { ruby: '#c23150', sapphire: '#2f6fae', emerald: '#1f8a6c', topaz: '#d6a12d' };
export const GOLD = '#b9923e';
const textureCache = new Map<string, THREE.CanvasTexture>();
export function texture(kind: 'wood' | 'felt' | 'leather') {
  if (textureCache.has(kind)) return textureCache.get(kind)!;
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = kind === 'wood' ? '#3c2612' : kind === 'felt' ? '#11241a' : '#382718'; ctx.fillRect(0, 0, 512, 512);
  let seed = 9182; const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  for (let i = 0; i < (kind === 'wood' ? 1400 : 22000); i++) {
    const x = rand() * 512, y = rand() * 512;
    ctx.strokeStyle = `rgba(${rand() > .5 ? '255,224,174' : '0,0,0'},${rand() * .13})`;
    ctx.lineWidth = kind === 'wood' ? .5 + rand() * 2 : .5;
    ctx.beginPath(); ctx.moveTo(x, y);
    if (kind === 'wood') ctx.bezierCurveTo(x + 40, y - 8, x + 140, y + 10, x + 270, y + 2);
    else ctx.lineTo(x + 1 + rand() * 3, y + 2);
    ctx.stroke();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; map.wrapS = map.wrapT = THREE.RepeatWrapping;
  if (kind === 'felt') map.repeat.set(5, 5);
  textureCache.set(kind, map); return map;
}
export function mesh(geometry: THREE.BufferGeometry, color: string, metalness = 0, roughness = .55) {
  const object = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, metalness, roughness }));
  object.castShadow = true; object.receiveShadow = true; return object;
}
export function box(w: number, h: number, d: number, color: string, radius = .04, metalness = 0) {
  return mesh(new RoundedBoxGeometry(w, h, d, 2, radius), color, metalness);
}
export function ring(radius: number, tube: number, color = GOLD) {
  const object = mesh(new THREE.TorusGeometry(radius, tube, 8, 48), color, .8, .26); object.rotation.x = Math.PI / 2; return object;
}
export function label(text: string, color = '#ddc99c', width = 2, height = .32) {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 100;
  const ctx = canvas.getContext('2d')!; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = color; ctx.font = '500 32px "Yu Gothic UI", sans-serif'; ctx.fillText(text, 256, 50, 490);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  const object = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map, transparent: true, depthWrite: false }));
  object.userData.disposeMap = true; return object;
}
export function dice(kind: Color, value = 1, size = .52) {
  const group = new THREE.Group(); const body = box(size, size, size, PALETTE[kind], size * .12, .12);
  (body.material as THREE.MeshStandardMaterial).roughness = .48; body.position.y = size / 2; group.add(body);
  const pips: Record<number, [number, number][]> = {
    1: [[0, 0]], 2: [[-.23, -.23], [.23, .23]], 3: [[-.23, -.23], [0, 0], [.23, .23]],
    4: [[-.23, -.23], [-.23, .23], [.23, -.23], [.23, .23]],
    5: [[-.23, -.23], [-.23, .23], [.23, -.23], [.23, .23], [0, 0]],
    6: [[-.23, -.23], [-.23, 0], [-.23, .23], [.23, -.23], [.23, 0], [.23, .23]],
  };
  const front = [1, 2, 3, 4, 5, 6].find(v => v !== value && v !== 7 - value)!;
  const right = [1, 2, 3, 4, 5, 6].find(v => ![value, 7 - value, front, 7 - front].includes(v))!;
  const faces = [{ value, axis: 'top' }, { value: 7 - value, axis: 'bottom' }, { value: front, axis: 'front' }, { value: right, axis: 'right' }, { value: 7 - front, axis: 'back' }, { value: 7 - right, axis: 'left' }];
  const pipGeometries: THREE.BufferGeometry[] = [];
  faces.forEach(face => (pips[face.value] || pips[1]).forEach(([a, b]) => {
    const pip = mesh(new THREE.CircleGeometry(size * .072, 16), '#fff3d5', .1, .4);
    if (face.axis === 'top') { pip.rotation.x = -Math.PI / 2; pip.position.set(a * size, size + .003, b * size); }
    if (face.axis === 'bottom') { pip.rotation.x = Math.PI / 2; pip.position.set(a * size, -.003, b * size); }
    if (face.axis === 'front') pip.position.set(a * size, size / 2 + b * size, size / 2 + .003);
    if (face.axis === 'back') { pip.rotation.y = Math.PI; pip.position.set(a * size, size / 2 + b * size, -size / 2 - .003); }
    if (face.axis === 'right') { pip.rotation.y = Math.PI / 2; pip.position.set(size / 2 + .003, size / 2 + b * size, a * size); }
    if (face.axis === 'left') { pip.rotation.y = -Math.PI / 2; pip.position.set(-size / 2 - .003, size / 2 + b * size, a * size); }
    pip.updateMatrix(); pipGeometries.push(pip.geometry.clone().applyMatrix4(pip.matrix));
    pip.geometry.dispose(); (pip.material as THREE.Material).dispose();
  }));
  const mergedPips = mergeGeometries(pipGeometries);
  pipGeometries.forEach(geometry => geometry.dispose());
  if (mergedPips) { const pipsMesh = mesh(mergedPips, '#fff3d5', 0, .75); pipsMesh.castShadow = false; group.add(pipsMesh); }
  return group;
}
export function piece(kind: Kind, value = 1): THREE.Group {
  if (kind in PALETTE) return dice(kind as Color, value);
  const group = new THREE.Group();
  const base = mesh(new THREE.CylinderGeometry(.28, .31, .075, 32), kind === 'mining' ? GOLD : '#292323', .65); base.position.y = .04; group.add(base);
  if (kind === 'mining') {
    const coin = mesh(new THREE.CylinderGeometry(.28, .28, .075, 6), GOLD, .8, .24); coin.position.y = .12; group.add(coin);
    const diamond = mesh(new THREE.OctahedronGeometry(.23), '#83d4c1', .5, .08); diamond.position.y = .35; diamond.scale.y = 1.2; group.add(diamond);
    const rim = ring(.26, .025); rim.position.y = .16; group.add(rim);
  } else if (kind === 'thief') {
    const cloak = mesh(new THREE.ConeGeometry(.25, .54, 10), '#33303c', .15); cloak.position.y = .34; group.add(cloak);
    const hood = mesh(new THREE.SphereGeometry(.18, 16, 12), '#23202c'); hood.position.set(0, .64, 0); group.add(hood);
    const face = mesh(new THREE.SphereGeometry(.115, 12, 10), '#bca080'); face.scale.set(1, .85, .5); face.position.set(0, .63, .14); group.add(face);
    const mask = box(.23, .07, .05, '#090b0e', .02); mask.position.set(0, .66, .18); group.add(mask);
    for (const x of [-.06, .06]) { const eye = mesh(new THREE.SphereGeometry(.014, 6, 6), '#f3d597'); eye.position.set(x, .664, .21); group.add(eye); }
    const bag = mesh(new THREE.SphereGeometry(.105, 10, 8), '#75513b'); bag.position.set(.2, .24, .09); group.add(bag);
    const belt = ring(.18, .024); belt.position.y = .28; group.add(belt);
  } else {
    const bottle = new THREE.Mesh(new THREE.SphereGeometry(.23, 20, 16), new THREE.MeshPhysicalMaterial({ color: '#a69bc4', metalness: 0, roughness: .08, transparent: true, opacity: .7, transmission: .25, thickness: .3, clearcoat: 1 }));
    bottle.scale.set(1, 1.12, 1); bottle.position.y = .31; bottle.castShadow = true; group.add(bottle);
    const liquid = mesh(new THREE.SphereGeometry(.183, 16, 12), '#783dac', .2, .18); liquid.scale.y = .72; liquid.position.y = .255; group.add(liquid);
    const neck = mesh(new THREE.CylinderGeometry(.075, .1, .18, 16), '#9882b4', .3, .2); neck.position.y = .56; group.add(neck);
    const cork = mesh(new THREE.CylinderGeometry(.083, .083, .1, 16), '#bd9662'); cork.position.y = .685; group.add(cork);
    const seal = label('☠', '#e9d8c8', .21, .14); seal.position.set(0, .33, .235); group.add(seal);
  }
  return group;
}
export function cup(color: Color) {
  const group = new THREE.Group();
  const points = [[.47, 0], [.49, .045], [.46, .14], [.35, .81], [.31, .85], [0, .85], [0, .79], [.28, .79], [.41, .12], [.42, .035], [.47, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  const body = mesh(new THREE.LatheGeometry(points, 48), '#a18b6d', .1, .63);
  (body.material as THREE.MeshStandardMaterial).map = texture('leather'); group.add(body);
  for (const [radius, y] of [[.48, .055], [.35, .79]]) { const band = ring(radius, .028); band.position.y = y; group.add(band); }
  const crest = mesh(new THREE.CircleGeometry(.105, 24), PALETTE[color], .3, .3); crest.name = 'player-crest'; crest.position.set(0, .44, .411); crest.rotation.x = -.17; group.add(crest);
  const trim = mesh(new THREE.TorusGeometry(.11, .012, 6, 24), GOLD, .8); trim.position.copy(crest.position); trim.rotation.copy(crest.rotation); group.add(trim);
  const star = label('✦', '#ead39c', .16, .14); star.position.set(0, .445, .425); star.rotation.x = -.17; group.add(star);
  return group;
}
export function chest() {
  const group = new THREE.Group();
  const body = box(1.8, .65, 1.12, '#b29264', .06); (body.material as THREE.MeshStandardMaterial).map = texture('wood'); body.position.y = .34; group.add(body);
  const inside = box(1.5, .025, .91, '#140c08'); inside.position.y = .675; group.add(inside);
  for (const x of [-.65, .65]) { const band = box(.105, .69, 1.15, GOLD, .02, .75); band.position.set(x, .36, 0); group.add(band); }
  const hinge = new THREE.Group(); hinge.position.set(0, .7, -.54); group.add(hinge);
  const lid = box(1.86, .38, 1.16, '#b38f60', .16); (lid.material as THREE.MeshStandardMaterial).map = texture('wood'); lid.position.set(0, .16, .54); hinge.add(lid);
  for (const x of [-.65, .65]) { const band = box(.11, .41, 1.18, GOLD, .06, .75); band.position.set(x, .17, .54); hinge.add(band); }
  const lock = box(.23, .29, .08, GOLD, .035, .8); lock.position.set(0, .57, .605); group.add(lock);
  const hole = mesh(new THREE.CircleGeometry(.032, 12), '#302515'); hole.position.set(0, .59, .65); group.add(hole);
  for (const x of [-.9, .9]) { const handle = mesh(new THREE.TorusGeometry(.12, .025, 8, 20), GOLD, .7); handle.rotation.y = Math.PI / 2; handle.position.set(x, .42, 0); group.add(handle); }
  return { group, hinge };
}
export function disposeObject(root: THREE.Object3D) {
  root.traverse(object => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose(); const materials = Array.isArray(object.material) ? object.material : [object.material];
      materials.forEach(material => {
        if (object.userData.disposeMap && 'map' in material) (material.map as THREE.Texture | null)?.dispose();
        material.dispose();
      });
    }
  });
  root.removeFromParent();
}
export function clear(root: THREE.Group) { [...root.children].forEach(disposeObject); }
export function playKey(play: Play | null) { return play ? `${play.id}:${play.value}` : '-'; }
