import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { addFrontBoard } from "./GeometryFrontBoard";
import { addLeftBoard } from "./GeometryLeftBoard";
import { addRightBoard } from "./GeometryRightBoard";
import { addAmbientGeometry } from "./AmbientGeometry";

type Theorem = {
  id: string;
  title: string;
  formula: string;
  detail: string;
};

const MOCK_THEOREMS: Theorem[] = [
  {
    id: "1",
    title: "Пифагорын теорем",
    formula: "a² + b² = c²",
    detail: "Тэгш өнцөгт гурвалжинд:\nc — гипотенуз\na, b — катет талууд",
  },
  {
    id: "2",
    title: "Тойргийн талбай",
    formula: "S = π · r²",
    detail: "r — тойргийн радиус\nπ ≈ 3.14159\nДиаметр d = 2r",
  },
];

const MOCK_TOPICS: { label: string; formula: string }[] = [
  { label: "Пифагор", formula: "a² + b² = c²" },
  { label: "Тойрог", formula: "S = πr²" },
  { label: "Гурвалж", formula: "S = ½·b·h" },
];

export default function GeometryApp() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [problemText, setProblemText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [theorems, setTheorems] = useState<Theorem[]>([]);
  const [uiPos, setUiPos] = useState({ left: 0, top: 0, visible: false });
  const [activeBoard, setActiveBoard] = useState<
    "front" | "left" | "right" | null
  >(null);
  const [boardRect, setBoardRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);

  // Зүүн самбар — гурвалжин шийдэгч (3 тал → өнцгүүд)
  const [triA, setTriA] = useState("3");
  const [triB, setTriB] = useState("4");
  const [triC, setTriC] = useState("5");
  const [triResult, setTriResult] = useState("");

  // Баруун самбар — AI chat
  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);

  const focusBoardRef = useRef<((t: Theorem) => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const setActiveBoardRef = useRef(setActiveBoard);
  setActiveBoardRef.current = setActiveBoard;
  const setBoardRectRef = useRef(setBoardRect);
  setBoardRectRef.current = setBoardRect;
  const activeBoardRef = useRef<"front" | "left" | "right" | null>(null);

  // Бодлого шийдэх
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText && !selectedImage) {
      alert("Бодлогоо оруулна уу!");
      return;
    }
    setLoading(true);
    setTheorems([]);
    try {
      await new Promise((r) => setTimeout(r, 500));
      setTheorems(MOCK_THEOREMS);
    } catch {
      alert("Алдаа гарлаа.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheorem = (t: Theorem) => focusBoardRef.current?.(t);

  // Гурвалжин шийдэгч (Косинусын теорем)
  const solveTriangle = () => {
    const a = parseFloat(triA),
      b = parseFloat(triB),
      c = parseFloat(triC);
    if ([a, b, c].some((v) => isNaN(v) || v <= 0)) {
      setTriResult("a, b, c — эерэг тоо оруулна уу.");
      return;
    }
    if (a + b <= c || a + c <= b || b + c <= a) {
      setTriResult("Эдгээр талуудаар гурвалжин байгуулагдахгүй.");
      return;
    }
    const cosA = (b * b + c * c - a * a) / (2 * b * c);
    const cosB = (a * a + c * c - b * b) / (2 * a * c);
    const A = (Math.acos(cosA) * 180) / Math.PI;
    const B = (Math.acos(cosB) * 180) / Math.PI;
    const C = 180 - A - B;
    const area = 0.5 * a * b * Math.sin((C * Math.PI) / 180);
    setTriResult(
      `∠A = ${A.toFixed(1)}°\n∠B = ${B.toFixed(1)}°\n∠C = ${C.toFixed(1)}°\nS = ${area.toFixed(2)}`,
    );
  };

  // AI chat
  const sendAi = () => {
    if (!aiInput.trim()) return;
    const msg = aiInput.trim();
    setAiMessages((m) => [...m, { role: "user", text: msg }]);
    setAiInput("");
    setTimeout(() => {
      setAiMessages((m) => [
        ...m,
        { role: "ai", text: "(AI хариу — backend холбоно)" },
      ]);
    }, 400);
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let W = mount.clientWidth;
    let H = mount.clientHeight;

    const geometries: THREE.BufferGeometry[] = [];
    const materials: THREE.Material[] = [];
    const textures: THREE.Texture[] = [];

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(W, H);
    renderer.setClearColor(0x1a1428);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const S = 10;
    const HR = 4.0;
    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 100);

    const defaultCamPos = new THREE.Vector3(0, 0.2, S / 2 - 0.5);
    const defaultTarget = new THREE.Vector3(0, 0.2, -S / 2);
    const targetCamPos = defaultCamPos.clone();
    const targetLookAt = defaultTarget.clone();
    const currentLookAt = defaultTarget.clone();
    camera.position.copy(defaultCamPos);

    let cameraMoving = false;
    let pendingBoard: "front" | "left" | "right" | null = null;

    // ── ГЭРЭЛТҮҮЛЭГ ──────────────────────────────────────────────────
    scene.add(new THREE.AmbientLight(0xdce0f0, 0.65));
    const dir = new THREE.DirectionalLight(0xd0d4ff, 0.55);
    dir.position.set(S / 2 - 1, HR / 2 - 0.5, 0);
    dir.castShadow = true;
    scene.add(dir);
    const top = new THREE.DirectionalLight(0xe0e4ff, 0.35);
    top.position.set(0, HR / 2, 0);
    scene.add(top);
    const spot = new THREE.SpotLight(0xc0c8ff, 0.65, 0, Math.PI / 4, 0.55, 1);
    spot.position.set(0, HR / 2 - 0.2, S / 4);
    spot.target.position.set(0, -HR / 2, -1);
    scene.add(spot, spot.target);

    // ── ШАЛ ТЕКСТУР ───────────────────────────────────────────────────
    const fc = document.createElement("canvas");
    fc.width = fc.height = 256;
    const fctx = fc.getContext("2d")!;
    fctx.fillStyle = "#2a2038";
    fctx.fillRect(0, 0, 256, 256);
    // нарийн grid
    fctx.strokeStyle = "rgba(160,120,255,0.15)";
    fctx.lineWidth = 0.8;
    for (let i = 0; i <= 256; i += 32) {
      fctx.beginPath();
      fctx.moveTo(i, 0);
      fctx.lineTo(i, 256);
      fctx.stroke();
      fctx.beginPath();
      fctx.moveTo(0, i);
      fctx.lineTo(256, i);
      fctx.stroke();
    }
    const floorTex = new THREE.CanvasTexture(fc);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(6, 6);
    textures.push(floorTex);

    // ── ХАНА ТЕКСТУР ────────────────────────────────────────────────
    const makeWallTex = (base: string) => {
      const wc = document.createElement("canvas");
      wc.width = wc.height = 512;
      const wctx = wc.getContext("2d")!;
      wctx.fillStyle = base;
      wctx.fillRect(0, 0, 512, 512);
      // хөнгөн geometric pattern
      wctx.strokeStyle = "rgba(160,140,220,0.18)";
      wctx.lineWidth = 1;
      const bw = 88,
        bh = 42;
      for (let row = 0, y = 0; y < 512; y += bh, row++) {
        const off = row % 2 === 0 ? 0 : bw / 2;
        for (let x = -bw; x < 512; x += bw) {
          const jx = (Math.random() - 0.5) * 2.5;
          const jy = (Math.random() - 0.5) * 2.5;
          wctx.strokeRect(x + off + jx, y + jy, bw, bh);
        }
      }
      const t = new THREE.CanvasTexture(wc);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2.5, 1.4);
      textures.push(t);
      return t;
    };

    const wallColor = 0xcac8d8;
    const wallColorSide = 0xbcbacc;
    const ceilColor = 0xaaa8bc;

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.75,
    });
    const wallFrontMat = new THREE.MeshStandardMaterial({
      color: wallColor,
      map: makeWallTex("#cac8d8"),
      roughness: 0.95,
    });
    const wallSideMat = new THREE.MeshStandardMaterial({
      color: wallColorSide,
      map: makeWallTex("#bcbacc"),
      roughness: 0.95,
    });
    const ceilMat = new THREE.MeshStandardMaterial({
      color: ceilColor,
      roughness: 0.95,
    });
    materials.push(floorMat, wallFrontMat, wallSideMat, ceilMat);

    const planeGeo = new THREE.PlaneGeometry(S, S);
    const wallGeo = new THREE.PlaneGeometry(S, HR);
    geometries.push(planeGeo, wallGeo);

    const floor = new THREE.Mesh(planeGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -HR / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    const ceil = new THREE.Mesh(planeGeo, ceilMat);
    ceil.rotation.x = Math.PI / 2;
    ceil.position.y = HR / 2;
    scene.add(ceil);

    const frontWall = new THREE.Mesh(wallGeo, wallFrontMat);
    frontWall.position.set(0, 0, -S / 2);
    frontWall.receiveShadow = true;
    scene.add(frontWall);

    const leftWall = new THREE.Mesh(wallGeo, wallSideMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-S / 2, 0, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeo, wallSideMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(S / 2, 0, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // ── САМБАР FACTORY ───────────────────────────────────────────────
    const makeModernBoard = (boardWidth: number, boardHeight: number) => {
      const bc = document.createElement("canvas");
      bc.width = 1024;
      bc.height = Math.round((1024 * boardHeight) / boardWidth);
      const ctx = bc.getContext("2d")!;

      const mat = new THREE.MeshStandardMaterial({
        color: 0x0d0a1a,
        roughness: 0.7,
        metalness: 0.08,
      });
      materials.push(mat);

      const drawBase = () => {
        ctx.fillStyle = "#0d0a1a";
        ctx.fillRect(0, 0, bc.width, bc.height);
        const grad = ctx.createRadialGradient(
          bc.width / 2,
          bc.height / 2,
          10,
          bc.width / 2,
          bc.height / 2,
          bc.width * 0.6,
        );
        grad.addColorStop(0, "rgba(80,40,120,0.22)");
        grad.addColorStop(1, "rgba(0,0,0,0.4)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, bc.width, bc.height);
        // dot grid
        ctx.fillStyle = "rgba(255,255,255,0.035)";
        const step = 40;
        for (let x = step; x < bc.width; x += step)
          for (let y = step; y < bc.height; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
      };

      const glow = (
        text: string,
        x: number,
        y: number,
        font: string,
        color: string,
        glowC: string,
        align: CanvasTextAlign = "left",
      ) => {
        ctx.font = font;
        ctx.textAlign = align;
        ctx.shadowColor = glowC;
        ctx.shadowBlur = 18;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
      };

      const tex = new THREE.CanvasTexture(bc);
      tex.colorSpace = THREE.SRGBColorSpace;
      textures.push(tex);
      mat.map = mat.emissiveMap = tex;
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveIntensity = 0.82;
      mat.needsUpdate = true;

      // ── GOL SAМБАР: геометрийн онолууд ────────────────────────────
      const drawTopics = () => {
        drawBase();
        const gold = "rgba(255,185,60,0.95)";
        const goldG = "rgba(255,190,60,0.9)";
        const cyan = "rgba(100,220,255,0.92)";
        const cyanG = "rgba(80,200,255,0.85)";

        glow(
          "Геометрийн томъёо",
          bc.width * 0.07,
          bc.height * 0.12,
          "italic 30px Georgia, serif",
          "rgba(255,255,255,0.82)",
          "rgba(200,180,255,0.3)",
        );

        // Зүүн: Пифагорын гурвалжин диаграм
        ctx.save();
        const tx = bc.width * 0.1,
          ty = bc.height * 0.65;
        const tw = 160,
          th = 108;
        ctx.strokeStyle = gold;
        ctx.shadowColor = goldG;
        ctx.shadowBlur = 10;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx + tw, ty);
        ctx.lineTo(tx, ty - th);
        ctx.closePath();
        ctx.stroke();
        // тэгш өнцгийн тэмдэг
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(tx + 2, ty - 18, 16, 16);
        ctx.font = "22px 'Cambria Math',Georgia,serif";
        ctx.fillStyle = cyan;
        ctx.shadowColor = cyanG;
        ctx.shadowBlur = 8;
        ctx.fillText("a", tx - 20, ty - th / 2);
        ctx.fillText("b", tx + tw / 2, ty + 24);
        ctx.fillText("c", tx + tw / 2 + 12, ty - th / 2 - 8);
        ctx.restore();

        // a²+b²=c² томъёо
        glow(
          "a² + b² = c²",
          bc.width * 0.07,
          bc.height * 0.29,
          "34px 'Cambria Math',Georgia,serif",
          gold,
          goldG,
        );

        // Тойрог диаграм (баруун)
        ctx.save();
        const cx2 = bc.width * 0.82,
          cy2 = bc.height * 0.3,
          rr = 64;
        ctx.strokeStyle = cyan;
        ctx.shadowColor = cyanG;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(cx2, cy2, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx2, cy2);
        ctx.lineTo(cx2 + rr, cy2);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.fillStyle = cyan;
        ctx.beginPath();
        ctx.arc(cx2, cy2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "22px Georgia,serif";
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillText("r", cx2 + rr / 2 - 5, cy2 - 10);
        ctx.restore();

        // S = πr² томъёо
        glow(
          "S = π · r²",
          bc.width * 0.6,
          bc.height * 0.29,
          "34px 'Cambria Math',Georgia,serif",
          cyan,
          cyanG,
        );

        // Голын жагсаалт
        let gy = bc.height * 0.52;
        const rowGap = bc.height * 0.22;
        MOCK_TOPICS.forEach((t) => {
          glow(
            t.label,
            bc.width * 0.42,
            gy,
            "bold 30px Georgia,serif",
            "rgba(255,255,255,0.9)",
            "rgba(255,255,255,0.2)",
          );
          glow(
            t.formula,
            bc.width * 0.42,
            gy + 44,
            "28px 'Cambria Math',Georgia,serif",
            gold,
            goldG,
          );
          gy += rowGap;
        });

        tex.needsUpdate = true;
      };

      const drawLabel = (label: string) => {
        drawBase();
        glow(
          label,
          bc.width / 2,
          bc.height / 2 - 10,
          "bold 52px Georgia,serif",
          "rgba(255,255,255,0.88)",
          "rgba(180,140,255,0.55)",
          "center",
        );
        glow(
          "дарж нээнэ үү →",
          bc.width / 2,
          bc.height / 2 + 50,
          "22px sans-serif",
          "rgba(255,190,60,0.65)",
          "rgba(255,190,60,0.4)",
          "center",
        );
        tex.needsUpdate = true;
      };

      const drawClear = () => {
        drawBase();
        tex.needsUpdate = true;
      };

      const redraw = (lines: string[]) => {
        drawBase();
        const gold = "rgba(255,190,60,0.95)",
          goldG = "rgba(255,190,60,0.85)";
        ctx.textAlign = "left";
        const mx = bc.width * 0.08;
        let ry = bc.height * 0.2;
        lines.forEach((line, i) => {
          if (i === 0) {
            glow(
              line,
              mx,
              ry,
              "bold 52px Georgia,serif",
              "rgba(255,255,255,0.95)",
              "rgba(180,140,255,0.5)",
            );
            ry += 96;
          } else if (line.startsWith("$$")) {
            glow(
              line.replace(/\$\$/g, ""),
              mx,
              ry,
              "44px 'Cambria Math',Georgia,serif",
              gold,
              goldG,
            );
            ry += 70;
          } else {
            ctx.shadowColor = "rgba(160,120,255,0.4)";
            ctx.shadowBlur = 8;
            ctx.font = "30px sans-serif";
            ctx.fillStyle = "rgba(220,215,255,0.85)";
            wrapText(ctx, line, mx, ry, bc.width - mx * 2, 44);
            ctx.shadowBlur = 0;
            ry += 56;
          }
        });
        tex.needsUpdate = true;
      };

      return { material: mat, redraw, drawTopics, drawLabel, drawClear };
    };

    // ── ХҮРЭЭ МАТЕРИАЛ ──────────────────────────────────────────────
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x6a5090,
      metalness: 0.12,
      roughness: 0.7,
    });
    materials.push(frameMat);

    const boardH = HR * 0.52;
    const boardY = -0.1;
    const bw_side = S * 0.65;
    const frontBoardW = S * 0.82;
    const sideBoardW = bw_side;

    const interactiveBoards: THREE.Mesh[] = [];

    addFrontBoard({
      scene,
      interactiveBoards,
      roomSize: S,
      boardHeight: boardH,
      boardY,
      frameMat,
      makeModernBoard,
    });
    addLeftBoard({
      scene,
      interactiveBoards,
      roomSize: S,
      boardWidth: bw_side,
      boardHeight: boardH,
      boardY,
      frameMat,
      makeModernBoard,
    });
    addRightBoard({
      scene,
      interactiveBoards,
      roomSize: S,
      boardWidth: bw_side,
      boardHeight: boardH,
      boardY,
      frameMat,
      makeModernBoard,
    });

    interactiveBoards.forEach((b) => {
      if (b.geometry) geometries.push(b.geometry);
    });

    type BoardExtras = THREE.Mesh & {
      redraw?: (lines: string[]) => void;
      drawTopics?: () => void;
      drawLabel?: (label: string) => void;
      drawClear?: () => void;
    };

    const frontBoard = interactiveBoards.find(
      (b) => b.name === "front_board",
    ) as BoardExtras | undefined;
    const leftBoard = interactiveBoards.find((b) => b.name === "left_board") as
      | BoardExtras
      | undefined;
    const rightBoard = interactiveBoards.find(
      (b) => b.name === "right_board",
    ) as BoardExtras | undefined;

    frontBoard?.drawTopics?.();
    leftBoard?.drawLabel?.("Гурвалжин шийдэгч");
    rightBoard?.drawLabel?.("AI туслах");

    // Шалан grid хэлбэр
    const grid = new THREE.GridHelper(S, 20, 0xa070e0, 0x806090);
    grid.position.y = -HR / 2 + 0.001;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.3;
    scene.add(grid);

    // ── ОРЧНЫ ГЕОМЕТР (хөвөгч polyhedra) ────────────────────────────
    const ambient = addAmbientGeometry({
      scene,
      roomSize: S,
      roomHeight: HR,
      geometries,
      materials,
      textures,
    });

    // ── ХӨДӨЛГӨӨНТ ДҮР ──────────────────────────────────────────────
    let characterMesh: THREE.Mesh | null = null;
    const charTextures: THREE.Texture[] = [];
    let currentFrame = 0,
      accumulatedTime = 0;
    const frameInterval = 0.2;
    const clock = new THREE.Clock();

    {
      const loader = new THREE.TextureLoader();
      const files = ["/character1.png", "/character2.png", "/character3.png"];
      let loaded = 0;
      files.forEach((url, idx) => {
        loader.load(url, (tex) => {
          tex.colorSpace = THREE.SRGBColorSpace;
          textures.push(tex);
          charTextures[idx] = tex;
          if (++loaded === files.length) {
            const charMat = new THREE.MeshBasicMaterial({
              map: charTextures[0],
              transparent: true,
              side: THREE.DoubleSide,
            });
            materials.push(charMat);
            const ar = tex.image.width / tex.image.height;
            const ch = 2.3,
              cw = ch * ar;
            const charGeo = new THREE.PlaneGeometry(cw, ch);
            geometries.push(charGeo);
            characterMesh = new THREE.Mesh(charGeo, charMat);
            characterMesh.position.set(-1, -HR / 2 + ch / 2, -S / 2 + 6);
            scene.add(characterMesh);
          }
        });
      });
    }

    // ── САМБАР ОЙР ИРЭХ ──────────────────────────────────────────────
    const fitDistance = (bw: number) => {
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const fill = 0.82;
      return Math.max(
        bw / 2 / Math.tan(hFov / 2) / fill,
        boardH / 2 / Math.tan(vFov / 2) / fill,
      );
    };

    const focusFrontBoard = (theorem: Theorem) => {
      if (!frontBoard) return;
      const d = fitDistance(frontBoardW);
      targetCamPos.set(0, boardY, frontBoard.position.z + d);
      targetLookAt.set(0, boardY, frontBoard.position.z);
      cameraMoving = true;
      pendingBoard = "front";
      activeBoardRef.current = "front";
      setActiveBoardRef.current("front");
      frontBoard.redraw?.([
        theorem.title,
        `$$${theorem.formula}$$`,
        ...theorem.detail.split("\n"),
      ]);
    };
    focusBoardRef.current = focusFrontBoard;

    // ── RAYCASTER ────────────────────────────────────────────────────
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.(".ui-geo")) return;
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(interactiveBoards);
      if (hits.length > 0 && hits[0]) {
        const b = hits[0].object as THREE.Mesh;
        cameraMoving = true;
        if (b.name === "front_board") {
          const d = fitDistance(frontBoardW);
          targetCamPos.set(0, boardY, b.position.z + d);
          targetLookAt.set(0, boardY, b.position.z);
          pendingBoard = "front";
          frontBoard?.drawTopics?.();
        } else if (b.name === "left_board") {
          const d = fitDistance(sideBoardW);
          targetCamPos.set(b.position.x + d, boardY, 0);
          targetLookAt.set(b.position.x, boardY, 0);
          pendingBoard = "left";
          leftBoard?.drawClear?.();
        } else if (b.name === "right_board") {
          const d = fitDistance(sideBoardW);
          targetCamPos.set(b.position.x - d, boardY, 0);
          targetLookAt.set(b.position.x, boardY, 0);
          pendingBoard = "right";
          rightBoard?.drawClear?.();
        }
      } else {
        targetCamPos.copy(defaultCamPos);
        targetLookAt.copy(defaultTarget);
        cameraMoving = true;
        pendingBoard = null;
      }
      setActiveBoardRef.current(pendingBoard);
      activeBoardRef.current = pendingBoard;
    };
    window.addEventListener("pointerdown", onPointerDown);

    // ── ANIMATE ──────────────────────────────────────────────────────
    let animId: number;
    const tempV = new THREE.Vector3();

    const animate = () => {
      animId = requestAnimationFrame(animate);
      const dt = clock.getDelta();
      accumulatedTime += dt;
      const elapsed = clock.elapsedTime;
      ambient.update(elapsed);

      if (accumulatedTime >= frameInterval) {
        accumulatedTime %= frameInterval;
        if (characterMesh && charTextures.length === 3) {
          currentFrame = (currentFrame + 1) % 3;
          const m = characterMesh.material as THREE.MeshBasicMaterial;
          m.map = charTextures[currentFrame]!;
          m.needsUpdate = true;
        }
      }

      camera.position.lerp(targetCamPos, 0.08);
      currentLookAt.lerp(targetLookAt, 0.08);
      camera.lookAt(currentLookAt);
      if (cameraMoving && camera.position.distanceTo(targetCamPos) < 0.05)
        cameraMoving = false;

      renderer.render(scene, camera);

      const atDefault =
        targetCamPos.distanceTo(defaultCamPos) < 0.01 && !cameraMoving;
      if (characterMesh && atDefault) {
        tempV.copy(characterMesh.position);
        tempV.x += 0.45;
        tempV.y += 0.3;
        tempV.project(camera);
        if (tempV.z <= 1) {
          const x = (tempV.x * 0.5 + 0.5) * W;
          const y = (tempV.y * -0.5 + 0.5) * H;
          setUiPos({ left: x, top: y, visible: true });
        } else setUiPos((p) => ({ ...p, visible: false }));
      } else setUiPos((p) => (p.visible ? { ...p, visible: false } : p));

      // Самбарын дэлгэц дэх хүрээ
      const active = activeBoardRef.current;
      const activeMesh =
        active === "front"
          ? frontBoard
          : active === "left"
            ? leftBoard
            : active === "right"
              ? rightBoard
              : null;
      const activeBW =
        active === "front" ? frontBoardW : active ? sideBoardW : 0;
      if (activeMesh && !cameraMoving) {
        const hw = activeBW / 2,
          hh = boardH / 2,
          pad = 0.92;
        let [mnX, mnY, mxX, mxY] = [Infinity, Infinity, -Infinity, -Infinity];
        let behind = false;
        for (const [lx, ly] of [
          [-hw * pad, -hh * pad],
          [hw * pad, -hh * pad],
          [hw * pad, hh * pad],
          [-hw * pad, hh * pad],
        ] as [number, number][]) {
          tempV.set(lx, ly, 0);
          activeMesh.localToWorld(tempV);
          tempV.project(camera);
          if (tempV.z > 1) behind = true;
          const sx = (tempV.x * 0.5 + 0.5) * W;
          const sy = (tempV.y * -0.5 + 0.5) * H;
          mnX = Math.min(mnX, sx);
          mxX = Math.max(mxX, sx);
          mnY = Math.min(mnY, sy);
          mxY = Math.max(mxY, sy);
        }
        if (!behind)
          setBoardRectRef.current({
            left: mnX,
            top: mnY,
            width: mxX - mnX,
            height: mxY - mnY,
          });
      } else if (!active) setBoardRectRef.current(null);
    };
    animate();

    const onResize = () => {
      W = mount.clientWidth;
      H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(mount);

    resetCameraRef.current = () => {
      targetCamPos.copy(defaultCamPos);
      targetLookAt.copy(defaultTarget);
      cameraMoving = true;
      pendingBoard = null;
      activeBoardRef.current = null;
      frontBoard?.drawTopics?.();
      leftBoard?.drawLabel?.("Гурвалжин шийдэгч");
      rightBoard?.drawLabel?.("AI туслах");
    };

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      window.removeEventListener("pointerdown", onPointerDown);
      focusBoardRef.current = resetCameraRef.current = null;
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      grid.dispose();
      ambient.dispose();
      renderer.dispose();
      if (mount.contains(renderer.domElement))
        mount.removeChild(renderer.domElement);
    };
  }, []);

  // ── OVERLAY STYLE ─────────────────────────────────────────────────
  const overlayStyle: React.CSSProperties = boardRect
    ? {
        position: "absolute",
        left: `${boardRect.left}px`,
        top: `${boardRect.top}px`,
        width: `${boardRect.width}px`,
        height: `${boardRect.height}px`,
        zIndex: 10,
        boxSizing: "border-box",
        padding: "clamp(18px,4%,52px)",
        overflowY: "auto",
        color: "rgba(255,255,255,0.92)",
        background:
          "linear-gradient(155deg,rgba(40,20,80,0.55),rgba(20,10,50,0.78))",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
      }
    : {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        zIndex: 10,
        width: "420px",
        maxWidth: "85vw",
        color: "rgba(255,255,255,0.92)",
        padding: "24px",
        display: "flex",
        flexDirection: "column",
      };

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── ХҮҮХДИЙН INPUT (default үед) ─────────────────────────── */}
      {uiPos.visible && activeBoard === null && (
        <div
          className="ui-geo"
          style={{
            position: "absolute",
            left: `${uiPos.left}px`,
            top: `${uiPos.top}px`,
            transform: "translate(0%,-50%)",
            zIndex: 10,
            width: "360px",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "10px 14px",
            borderRadius: "12px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
            border: "1px solid rgba(255,255,255,0.5)",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "-8px",
              top: "32px",
              transform: "translateY(-50%) rotate(45deg)",
              width: "16px",
              height: "16px",
              background: "rgba(255,255,255,0.88)",
              borderLeft: "1px solid rgba(255,255,255,0.5)",
              borderBottom: "1px solid rgba(255,255,255,0.5)",
              zIndex: -1,
            }}
          />
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <input
              type="text"
              placeholder="Геометрийн бодлого..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #dcdcdc",
                fontSize: "13px",
                outline: "none",
              }}
            />
            <label
              style={{
                padding: "8px 10px",
                background: selectedImage ? "#34c759" : "#f1f3f5",
                color: selectedImage ? "#fff" : "#495057",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                border: "1px solid #ced4da",
                display: "flex",
                alignItems: "center",
              }}
            >
              {selectedImage ? "✓" : "📸"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
                }}
                style={{ display: "none" }}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 14px",
                background: loading ? "#9a8af5" : "#6a4cf7",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "default" : "pointer",
                fontWeight: 600,
                fontSize: "13px",
              }}
            >
              {loading ? "Бодож…" : "Илгээх"}
            </button>
          </form>
          {theorems.length > 0 && (
            <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
              {theorems.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    background: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #eef0f2",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#2a1040",
                      }}
                    >
                      {t.title}
                    </div>
                    <div style={{ fontSize: "12px", color: "#7060a0" }}>
                      {t.formula}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectTheorem(t)}
                    style={{
                      padding: "6px 10px",
                      background: "#2a1040",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                    }}
                  >
                    Дэлгэр →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── ЗҮҮН САМБАР: ГУРВАЛЖИН ШИЙДЭГЧ ─────────────────────────── */}
      {activeBoard === "left" && (
        <div className="ui-geo" style={overlayStyle}>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(255,210,80,0.7)",
              marginBottom: "6px",
            }}
          >
            Interactive
          </div>
          <h3
            style={{
              margin: "0 0 4px",
              color: "rgba(255,255,255,0.95)",
              fontSize: "clamp(16px,3.5vh,24px)",
              fontFamily: "Georgia,serif",
            }}
          >
            Гурвалжин шийдэгч
          </h3>
          <p
            style={{
              margin: "0 0 14px",
              color: "rgba(255,210,80,0.85)",
              fontSize: "14px",
              fontFamily: "Cambria Math,Georgia,serif",
            }}
          >
            3 тал өгөхөд → өнцгүүд, талбай
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            {[
              { v: triA, set: setTriA, l: "a" },
              { v: triB, set: setTriB, l: "b" },
              { v: triC, set: setTriC, l: "c" },
            ].map(({ v, set, l }) => (
              <div key={l} style={{ flex: 1 }}>
                <label
                  style={{ fontSize: "11px", color: "rgba(255,255,255,0.55)" }}
                >
                  {l} =
                </label>
                <input
                  type="number"
                  value={v}
                  onChange={(e) => set(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.2)",
                    background: "rgba(255,255,255,0.07)",
                    color: "#fff",
                    fontSize: "15px",
                    boxSizing: "border-box",
                    outline: "none",
                  }}
                />
              </div>
            ))}
          </div>
          <button
            onClick={solveTriangle}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(255,210,80,0.95)",
              color: "#1a1428",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            Бодох
          </button>
          {triResult && (
            <div
              style={{
                marginTop: "14px",
                padding: "14px",
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.13)",
                borderRadius: "10px",
                fontSize: "16px",
                color: "rgba(255,210,80,0.95)",
                fontWeight: 600,
                fontFamily: "Cambria Math,Georgia,serif",
                whiteSpace: "pre-line",
              }}
            >
              {triResult}
            </div>
          )}
        </div>
      )}

      {/* ── БАРУУН САМБАР: AI ТУСЛАХ ─────────────────────────────────── */}
      {activeBoard === "right" && (
        <div className="ui-geo" style={overlayStyle}>
          <div
            style={{
              fontSize: "11px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(255,210,80,0.7)",
              marginBottom: "6px",
            }}
          >
            AI
          </div>
          <h3
            style={{
              margin: "0 0 14px",
              color: "rgba(255,255,255,0.95)",
              fontSize: "clamp(16px,3.5vh,24px)",
              fontFamily: "Georgia,serif",
            }}
          >
            AI туслах
          </h3>
          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: "auto",
              marginBottom: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "8px",
            }}
          >
            {aiMessages.length === 0 && (
              <p
                style={{
                  color: "rgba(255,255,255,0.38)",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                Асуултаа бичээрэй…
              </p>
            )}
            {aiMessages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                  maxWidth: "85%",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  fontSize: "14px",
                  background:
                    m.role === "user"
                      ? "rgba(255,210,80,0.95)"
                      : "rgba(255,255,255,0.09)",
                  color:
                    m.role === "user" ? "#1a1428" : "rgba(255,255,255,0.9)",
                }}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendAi()}
              placeholder="AI-аас асуу..."
              style={{
                flex: 1,
                padding: "10px 14px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.07)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              onClick={sendAi}
              style={{
                padding: "10px 16px",
                background: "rgba(255,210,80,0.95)",
                color: "#1a1428",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: 700,
                fontSize: "14px",
              }}
            >
              Илгээх
            </button>
          </div>
        </div>
      )}

      {/* ── БУЦАХ ТОВЧ ──────────────────────────────────────────────── */}
      {activeBoard !== null && (
        <button
          className="ui-geo"
          onClick={() => {
            setActiveBoard(null);
            resetCameraRef.current?.();
          }}
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 20,
            padding: "10px 16px",
            background: "rgba(255,255,255,0.9)",
            border: "1px solid #dcdcdc",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            color: "#2a1040",
          }}
        >
          ← Буцах
        </button>
      )}

      <div
        ref={mountRef}
        style={{ width: "100%", height: "100%", cursor: "pointer" }}
      />
    </div>
  );
}

// ── ТУСЛАХ ──────────────────────────────────────────────────────────
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineH: number,
) {
  const words = text.split(" ");
  let line = "",
    curY = y;
  for (let n = 0; n < words.length; n++) {
    const test = line + words[n] + " ";
    if (ctx.measureText(test).width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + " ";
      curY += lineH;
    } else line = test;
  }
  ctx.fillText(line, x, curY);
}
