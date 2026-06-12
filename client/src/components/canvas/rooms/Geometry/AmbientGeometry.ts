import * as THREE from "three";

export function addAmbientGeometry(params: {
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

  const makeWire = (color: number, opacity = 0.55) => {
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

  const addFloater = (
    geo: THREE.BufferGeometry,
    color: number,
    pos: [number, number, number],
    scale: number,
    opacity = 0.52,
  ) => {
    geometries.push(geo);
    const mesh = new THREE.Mesh(geo, makeWire(color, opacity));
    mesh.scale.setScalar(scale);
    mesh.position.set(...pos);
    group.add(mesh);
    floaters.push({
      mesh,
      spin: new THREE.Vector3(
        (Math.random() - 0.5) * 0.35,
        (Math.random() - 0.5) * 0.35,
        (Math.random() - 0.5) * 0.2,
      ),
      bobAmp: 0.1 + Math.random() * 0.13,
      bobSpeed: 0.35 + Math.random() * 0.45,
      baseY: pos[1],
      phase: Math.random() * Math.PI * 2,
    });
    return mesh;
  };

  const topY = HR / 2 - 1.1;
  const gold   = 0xffb840;
  const violet = 0xc080ff;
  const cyan   = 0x60e0ff;
  const rose   = 0xff80b0;

  // Зүүн дээд: Тетраэдр (4 талт пирамид) — алт
  addFloater(new THREE.TetrahedronGeometry(1.0, 0), gold,   [-S / 2 + 1.6, topY,        -3.6], 0.62, 0.6);

  // Зүүн доош: мини октаэдр — ягаан
  addFloater(new THREE.OctahedronGeometry(0.72, 0), violet, [-S / 2 + 1.2, topY - 0.9,  -3.0], 0.55, 0.5);

  // Голын дээд: икосаэдр — циан
  addFloater(new THREE.IcosahedronGeometry(1.0, 0), cyan,   [0,             topY + 0.25, -4.3], 0.65, 0.48);

  // Баруун дээд: додекаэдр — ягаан
  addFloater(new THREE.DodecahedronGeometry(0.85, 0), violet, [S / 2 - 1.8, topY,        -3.8], 0.6, 0.5);

  // Баруун доош: октаэдр — алт
  addFloater(new THREE.OctahedronGeometry(0.9, 0), gold,   [S / 2 - 1.1, topY - 0.8,   -3.2], 0.52, 0.52);

  // Голын баруун: тетраэдр — ягаан (жижиг)
  addFloater(new THREE.TetrahedronGeometry(0.75, 0), rose,  [S / 2 - 3.0, topY - 0.3,   -4.5], 0.55, 0.45);

  // Зүүн дунд: икосаэдр жижиг — алт
  addFloater(new THREE.IcosahedronGeometry(0.65, 0), gold,  [-S / 2 + 3.2, topY - 0.5,  -4.8], 0.58, 0.4);

  // Геометрийн тоосонцор (шалан дээрх цэгүүд)
  const sparkGeo = new THREE.BufferGeometry();
  const sparkCount = 50;
  const sparkPos = new Float32Array(sparkCount * 3);
  for (let i = 0; i < sparkCount; i++) {
    sparkPos[i * 3]     = (Math.random() - 0.5) * S * 0.9;
    sparkPos[i * 3 + 1] = -HR / 2 + 0.02;
    sparkPos[i * 3 + 2] = (Math.random() - 0.5) * S * 0.9;
  }
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sparkPos, 3));
  geometries.push(sparkGeo);
  const sparkMat = new THREE.PointsMaterial({
    color: gold,
    size: 0.055,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  materials.push(sparkMat);
  group.add(new THREE.Points(sparkGeo, sparkMat));

  // Нарийн шугаман хүрээ (grid hex pattern on ceiling area)
  {
    const hexLines = new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(2.8, 1));
    geometries.push(hexLines);
    const hexMat = new THREE.LineBasicMaterial({
      color: 0xb060ff,
      transparent: true,
      opacity: 0.1,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(hexMat);
    const hex = new THREE.LineSegments(hexLines, hexMat);
    hex.position.set(0, HR / 2 - 0.5, -S / 2 + 2);
    hex.rotation.x = Math.PI / 2;
    group.add(hex);
    floaters.push({
      mesh: hex,
      spin: new THREE.Vector3(0, 0.04, 0),
      bobAmp: 0,
      bobSpeed: 0,
      baseY: HR / 2 - 0.5,
      phase: 0,
    });
  }

  const update = (t: number) => {
    for (const f of floaters) {
      f.mesh.rotation.x += f.spin.x * 0.016;
      f.mesh.rotation.y += f.spin.y * 0.016;
      f.mesh.rotation.z += f.spin.z * 0.016;
      if (f.bobAmp > 0) {
        f.mesh.position.y = f.baseY + Math.sin(t * f.bobSpeed + f.phase) * f.bobAmp;
      }
    }
    sparkMat.opacity = 0.3 + Math.sin(t * 1.2) * 0.2;
  };

  const dispose = () => {
    scene.remove(group);
  };

  return { update, dispose };
}
