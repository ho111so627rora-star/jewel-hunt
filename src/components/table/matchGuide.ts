import * as THREE from 'three';
import { facingCup } from '../../game/cups';
import { clear } from './models';
export function createMatchGuide() {
  const group = new THREE.Group();
  let signature = '';
  const trails: { path: THREE.CatmullRomCurve3; sparks: THREE.Mesh[] }[] = [];
  function position(angle: number, radius: number, height = .075) { return new THREE.Vector3(Math.sin(angle) * radius, height, Math.cos(angle) * radius); }
  return {
    group,
    update(me: number, opponent: number, active: boolean) {
      group.visible = active;
      const key = `${me}:${opponent}`; if (key === signature) return;
      signature = key; clear(group); trails.length = 0;
      for (const side of [0, 1]) {
        const cup = (seat: number, index: number) => new THREE.Vector3(index === 0 ? -.65 : .65, .125, 3.22).applyAxisAngle(new THREE.Vector3(0, 1, 0), seat * Math.PI / 2);
        const from = cup(me, side), to = cup(opponent, facingCup(side));
        const start = Math.atan2(from.x, from.z);
        let delta = Math.atan2(to.x, to.z) - start;
        while (delta > Math.PI) delta -= Math.PI * 2;
        while (delta < -Math.PI) delta += Math.PI * 2;
        const points = [from];
        for (let i = 0; i <= 28; i++) points.push(position(start + delta * i / 28, side === 0 ? 1.82 : 2.14));
        points.push(to);
        const path = new THREE.CatmullRomCurve3(points), color = side === 0 ? '#ffe5a3' : '#86dce8';
        group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 100, .027, 8, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .95, depthWrite: false })));
        group.add(new THREE.Mesh(new THREE.TubeGeometry(path, 100, .09, 8, false), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: .15, depthWrite: false })));
        for (const point of [from, to]) {
          const halo = new THREE.Mesh(new THREE.TorusGeometry(.635, .022, 8, 48), new THREE.MeshBasicMaterial({ color }));
          halo.rotation.x = Math.PI / 2; halo.position.copy(point); group.add(halo);
        }
        const sparks = Array.from({ length: 2 }, () => { const spark = new THREE.Mesh(new THREE.SphereGeometry(.05, 8, 8), new THREE.MeshBasicMaterial({ color })); group.add(spark); return spark; });
        trails.push({ path, sparks });
      }
    },
    animate(now: number, reduced: boolean) {
      if (!group.visible) return;
      trails.forEach(({ path, sparks }) => sparks.forEach((spark, i) => spark.position.copy(path.getPointAt(reduced ? (i + 1) / 3 : ((now / 3400 + i / 2) % 1)))));
    },
    dispose() { clear(group); trails.length = 0; },
  };
}
