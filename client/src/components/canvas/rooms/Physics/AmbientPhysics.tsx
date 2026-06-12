import * as THREE from "three";

export function addAmbientPhysics(params: {
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

  // Зүүн дээд: атомын загвар — icosahedron цөм
  addFloater(
    new THREE.IcosahedronGeometry(1, 0),
    0x88ccff,
    [-S / 2 + 1.5, topY, -3.8],
    0.58,
    0.45,
  );
  // Цөмийн дотор core
  {
    const coreGeo = new THREE.IcosahedronGeometry(0.92, 0);
    geometries.push(coreGeo);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0x3a5a8a,
      transparent: true,
      opacity: 0.2,
      depthWrite: false,
    });
    materials.push(coreMat);
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.set(-S / 2 + 1.5, topY, -3.8);
    core.scale.setScalar(0.58);
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

  // Баруун дээд: torus (орбиталь цагираг)
  addFloater(
    new THREE.TorusGeometry(0.85, 0.28, 16, 40),
    0x99ddff,
    [S / 2 - 2.6, topY + 0.1, -3.8],
    0.58,
    0.5,
  );

  // Баруун хамгийн буланд: octahedron (болор)
  addFloater(
    new THREE.OctahedronGeometry(0.9, 0),
    0xaaf0e0,
    [S / 2 - 1.0, topY - 0.1, -3.5],
    0.55,
    0.5,
  );

  // Голын дээд: цахилгаан давалгаа (sine wave tube)
  {
    const waveCurve = Object.create(
      THREE.Curve.prototype,
    ) as THREE.Curve<THREE.Vector3>;
    waveCurve.getPoint = (t: number) => {
      const x = (t - 0.5) * 2.2;
      const y = Math.sin(t * Math.PI * 4) * 0.22;
      return new THREE.Vector3(x, y, 0);
    };
    const waveGeo = new THREE.TubeGeometry(waveCurve, 120, 0.022, 8, false);
    geometries.push(waveGeo);
    const waveMat = new THREE.MeshBasicMaterial({
      color: 0x66ccff,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    materials.push(waveMat);
    const wave = new THREE.Mesh(waveGeo, waveMat);
    wave.position.set(0, topY + 0.65, -4.2);
    group.add(wave);
    floaters.push({
      mesh: wave,
      spin: new THREE.Vector3(0, 0.18, 0),
      bobAmp: 0.09,
      bobSpeed: 0.55,
      baseY: topY + 0.65,
      phase: 0.8,
    });
  }

  // Шалан дээрх цэгүүд (одод)
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
    color: 0xc0e8ff,
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
