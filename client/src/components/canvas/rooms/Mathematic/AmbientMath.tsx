import * as THREE from "three";


export function addAmbientMath(params: {
  scene: THREE.Scene;
  roomSize: number;
  roomHeight: number;
  geometries: THREE.BufferGeometry[];
  materials: THREE.Material[];
  textures: THREE.Texture[];
}) {
  const { scene, roomSize: S, roomHeight: HR, geometries, materials } = params;

  const group = new THREE.Group();
  scene.add(group);

  const floaters: {
    mesh: THREE.Object3D;
    spin: THREE.Vector3;
    bobAmp: number;
    bobSpeed: number;
    baseY: number;
    phase: number;
  }[] = [];

  // Glow material үүсгэгч (wireframe + нэмэлт additive glow)
  const makeGlow = (color: number, opacity = 0.55) => {
    const m = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(m);
    return m;
  };

  // Нэг хөвөгч дүрс нэмэх
  const addFloater = (
    geo: THREE.BufferGeometry,
    color: number,
    pos: [number, number, number],
    scale: number,
    opacity = 0.5,
  ) => {
    geometries.push(geo);
    const mesh = new THREE.Mesh(geo, makeGlow(color, opacity));
    mesh.scale.setScalar(scale);
    mesh.position.set(pos[0], pos[1], pos[2]);
    group.add(mesh);
    floaters.push({
      mesh,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.3,
        (Math.random() - 0.5) * 0.2,
      ),
      bobAmp: 0.12 + Math.random() * 0.12,
      bobSpeed: 0.4 + Math.random() * 0.5,
      baseY: pos[1],
      phase: Math.random() * Math.PI * 2,
    });
    return mesh;
  };

  const topY = HR / 2 - 1.15;

  // Зүүн дээд буланд: dodecahedron (таван талт), хана дагуу
  addFloater(
    new THREE.DodecahedronGeometry(1, 0),
    0x9fd6ff,
    [-S / 2 + 1.5, topY, -3.8],
    0.62,
    0.45,
  );
  // Дотор нь дүүргэсэн бараавтар core (гүн өгөх)
  {
    const coreGeo = new THREE.DodecahedronGeometry(0.96, 0);
    geometries.push(coreGeo);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x6a4a7a,
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    });
    materials.push(coreMat);
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(-S / 2 + 1.5, topY, -3.8);
    core.scale.setScalar(0.62);
    group.add(core);
    floaters.push({
      mesh: core,
      spin: new THREE.Vector3(0, 0, 0),
      bobAmp: 0,
      bobSpeed: 0,
      baseY: topY,
      phase: 0,
    });
  }

  // Баруун дээд буланд: torus (цагираг), хана дагуу
  addFloater(
    new THREE.TorusGeometry(0.8, 0.32, 16, 40),
    0xbfeaff,
    [S / 2 - 2.6, topY + 0.1, -3.8],
    0.55,
    0.5,
  );

  // Баруун хамгийн буланд: torus knot (зангилаа)
  addFloater(
    new THREE.TorusKnotGeometry(0.7, 0.24, 90, 14),
    0xa8f0d0,
    [S / 2 - 1.0, topY - 0.1, -3.5],
    0.5,
    0.5,
  );

  // Голын дээд: алтан спираль (Фибоначчи) — таазны ойр, төвд
  {
    const spiralCurve = Object.create(
      THREE.Curve.prototype,
    ) as THREE.Curve<THREE.Vector3>;
    spiralCurve.getPoint = (t: number) => {
      const turns = 3.2;
      const ang = t * Math.PI * 2 * turns;
      const r = 0.12 * Math.exp(0.22 * ang);
      return new THREE.Vector3(
        Math.cos(ang) * r,
        Math.sin(ang) * r,
        0,
      ).multiplyScalar(0.18);
    };
    const spiralGeo = new THREE.TubeGeometry(spiralCurve, 120, 0.025, 8, false);
    geometries.push(spiralGeo);
    const spiralMat = new THREE.MeshBasicMaterial({
      color: 0xffd98a,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(spiralMat);
    const spiral = new THREE.Mesh(spiralGeo, spiralMat);
    spiral.position.set(0, topY + 0.7, -4.2);
    group.add(spiral);
    floaters.push({
      mesh: spiral,
      spin: new THREE.Vector3(0, 0, 0.15),
      bobAmp: 0.08,
      bobSpeed: 0.5,
      baseY: topY + 0.7,
      phase: 1,
    });
  }

  // (Орчны Σ ∞ ∂ ∏ тэмдэгтүүдийг хассан — самбарын текст дээр давхцаж
  // байсан. Зөвхөн хөвөгч geometry болон одод үлдээв.)

  // ── ОДОД (sparkle) шалан дээр ──────────────────────────────────
  const starGeo = new THREE.BufferGeometry();
  const starCount = 40;
  const starPos = new Float32Array(starCount * 3);
  for (let i = 0; i < starCount; i++) {
    starPos[i * 3] = (Math.random() - 0.5) * S * 0.95;
    starPos[i * 3 + 1] = -HR / 2 + 0.02;
    starPos[i * 3 + 2] = (Math.random() - 0.5) * S * 0.95;
  }
  starGeo.setAttribute("position", new THREE.BufferAttribute(starPos, 3));
  geometries.push(starGeo);
  const starMat = new THREE.PointsMaterial({
    color: 0xfff3c0,
    size: 0.06,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  materials.push(starMat);
  const stars = new THREE.Points(starGeo, starMat);
  group.add(stars);

  const update = (t: number) => {
    for (const f of floaters) {
      f.mesh.rotation.x += f.spin.x * 0.016;
      f.mesh.rotation.y += f.spin.y * 0.016;
      f.mesh.rotation.z += f.spin.z * 0.016;
      if (f.bobAmp > 0) {
        f.mesh.position.y =
          f.baseY + Math.sin(t * f.bobSpeed + f.phase) * f.bobAmp;
      }
    }
    starMat.opacity = 0.35 + Math.sin(t * 1.5) * 0.15;
  };

  const dispose = () => {
    scene.remove(group);
  };

  return { update, dispose };
}
