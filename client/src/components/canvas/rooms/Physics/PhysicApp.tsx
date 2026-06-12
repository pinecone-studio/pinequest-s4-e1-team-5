import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { addFrontBoard } from "./FrontBoard";
import { addLeftBoard } from "./LeftBoard";
import { addRightBoard } from "./RightBoard";
import { addAmbientPhysics } from "./AmbientPhysics";

type Formula = {
  id: string;
  title: string;
  latex: string;
  detail: string;
};

const MOCK_FORMULAS: Formula[] = [
  {
    id: "1",
    title: "Ньютоны 2-р хууль",
    latex: "F = ma",
    detail: "F — хүч (Newton)\nm — масс (kg)\na — хурдатгал (m/s²)",
  },
  {
    id: "2",
    title: "Кинематикийн тэгшитгэл",
    latex: "v = v₀ + at",
    detail: "v — эцсийн хурд (m/s)\nv₀ — эхний хурд (m/s)\na — хурдатгал (m/s²)\nt — хугацаа (s)",
  },
];

const MOCK_TOPICS: { label: string; formula: string }[] = [
  { label: "Newton II", formula: "F = ma" },
  { label: "Кинетик Э.", formula: "Eₖ = ½mv²" },
  { label: "Ом-ын хууль", formula: "U = IR" },
];

export default function PhysicApp() {
  const mountRef = useRef<HTMLDivElement | null>(null);

  const [problemText, setProblemText] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [formulas, setFormulas] = useState<Formula[]>([]);

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

  const [aiInput, setAiInput] = useState("");
  const [aiMessages, setAiMessages] = useState<
    { role: "user" | "ai"; text: string }[]
  >([]);

  // Кинематик тооцоолуур (зүүн самбар)
  const [kinV0, setKinV0] = useState("0");
  const [kinA, setKinA] = useState("9.8");
  const [kinT, setKinT] = useState("2");
  const [kinResult, setKinResult] = useState<string>("");

  const focusBoardRef = useRef<((formula: Formula) => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const setActiveBoardRef = useRef(setActiveBoard);
  setActiveBoardRef.current = setActiveBoard;
  const setBoardRectRef = useRef(setBoardRect);
  setBoardRectRef.current = setBoardRect;
  const activeBoardRef = useRef<"front" | "left" | "right" | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!problemText && !selectedImage) {
      alert("Та бодлогоо бичих эсвэл зургийг нь оруулна уу!");
      return;
    }
    setLoading(true);
    setFormulas([]);
    try {
      let imageBase64: string | null = null;
      if (selectedImage) imageBase64 = await fileToBase64(selectedImage);
      void imageBase64;

      await new Promise((r) => setTimeout(r, 500));
      setFormulas(MOCK_FORMULAS);
    } catch (err) {
      console.error(err);
      alert("Томъёо татахад алдаа гарлаа. Дахин оролдоно уу.");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectFormula = (formula: Formula) => {
    focusBoardRef.current?.(formula);
  };

  const solveKinematics = () => {
    const v0 = parseFloat(kinV0);
    const a = parseFloat(kinA);
    const t = parseFloat(kinT);
    if (isNaN(v0) || isNaN(a) || isNaN(t)) {
      setKinResult("v₀, a, t утгыг зөв оруулна уу.");
      return;
    }
    const v = v0 + a * t;
    const d = v0 * t + 0.5 * a * t * t;
    setKinResult(`v = ${v.toFixed(3)} m/s\nd = ${d.toFixed(3)} m`);
  };

  const sendAi = () => {
    if (!aiInput.trim()) return;
    const userMsg = aiInput.trim();
    setAiMessages((m) => [...m, { role: "user", text: userMsg }]);
    setAiInput("");
    setTimeout(() => {
      setAiMessages((m) => [
        ...m,
        { role: "ai", text: "(AI хариу энд гарна — backend холбоно)" },
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
    renderer.setClearColor(0x1e2530);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(65, W / H, 0.1, 100);
    const S = 10;
    const HR = 4.0;

    const defaultCamPos = new THREE.Vector3(0, 0.2, S / 2 - 0.5);
    const defaultTarget = new THREE.Vector3(0, 0.2, -S / 2);

    const targetCamPos = defaultCamPos.clone();
    const targetLookAt = defaultTarget.clone();
    const currentLookAt = defaultTarget.clone();
    camera.position.copy(defaultCamPos);

    let cameraMoving = false;
    let pendingBoard: "front" | "left" | "right" | null = null;

    // Гэрэлтүүлэг — цэнхэр өнгийн физикийн мэдрэмж
    const ambientLight = new THREE.AmbientLight(0xdce8f5, 0.7);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xd0e8ff, 0.6);
    dirLight.position.set(S / 2 - 1, HR / 2 - 0.5, 0);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.bias = -0.0001;
    scene.add(dirLight);
    const topLight = new THREE.DirectionalLight(0xe0f0ff, 0.4);
    topLight.position.set(0, HR / 2, 0);
    scene.add(topLight);
    const spot = new THREE.SpotLight(0xc8e0ff, 0.7, 0, Math.PI / 4, 0.6, 1);
    spot.position.set(0, HR / 2 - 0.2, S / 4);
    spot.target.position.set(0, -HR / 2, -1);
    scene.add(spot);
    scene.add(spot.target);

    // Хана, шал өнгө — хүйтэвтэр саарал
    const wallColor = 0xcdd5de;
    const wallColorSide = 0xbfc8d2;
    const ceilColor = 0xa8b5c2;

    const floorCanvas = document.createElement("canvas");
    floorCanvas.width = 256;
    floorCanvas.height = 256;
    const fc = floorCanvas.getContext("2d");
    if (fc) {
      fc.fillStyle = "#b0bcc8";
      fc.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const opacity = Math.random() * 0.05;
        fc.fillStyle =
          Math.random() > 0.5
            ? `rgba(255,255,255,${opacity})`
            : `rgba(40,60,80,${opacity})`;
        fc.fillRect(x, y, 1.5, 1.5);
      }
    }
    const floorTex = new THREE.CanvasTexture(floorCanvas);
    floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
    floorTex.repeat.set(6, 6);
    textures.push(floorTex);

    const makeBrickTexture = (base: string) => {
      const bcv = document.createElement("canvas");
      bcv.width = 512;
      bcv.height = 512;
      const c = bcv.getContext("2d");
      if (c) {
        c.fillStyle = base;
        c.fillRect(0, 0, 512, 512);
        const bw = 86;
        const bh = 40;
        c.strokeStyle = "rgba(80,100,120,0.45)";
        c.lineWidth = 2.5;
        let row = 0;
        for (let y = 0; y < 512; y += bh) {
          const offset = row % 2 === 0 ? 0 : bw / 2;
          for (let x = -bw; x < 512; x += bw) {
            c.beginPath();
            const jx = (Math.random() - 0.5) * 3;
            const jy = (Math.random() - 0.5) * 3;
            c.rect(x + offset + jx, y + jy, bw, bh);
            c.stroke();
          }
          row++;
        }
      }
      const t = new THREE.CanvasTexture(bcv);
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(2.5, 1.4);
      textures.push(t);
      return t;
    };

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.6,
      metalness: 0.0,
    });
    const wallMatFront = new THREE.MeshStandardMaterial({
      color: wallColor,
      map: makeBrickTexture("#cdd5de"),
      roughness: 0.95,
    });
    const wallMatSide = new THREE.MeshStandardMaterial({
      color: wallColorSide,
      map: makeBrickTexture("#bfc8d2"),
      roughness: 0.95,
    });
    const ceilMat = new THREE.MeshStandardMaterial({
      color: ceilColor,
      roughness: 0.95,
    });
    materials.push(floorMat, wallMatFront, wallMatSide, ceilMat);

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

    const front = new THREE.Mesh(wallGeo, wallMatFront);
    front.position.set(0, 0, -S / 2);
    front.receiveShadow = true;
    scene.add(front);

    const left = new THREE.Mesh(wallGeo, wallMatSide);
    left.rotation.y = Math.PI / 2;
    left.position.set(-S / 2, 0, 0);
    left.receiveShadow = true;
    scene.add(left);

    const right = new THREE.Mesh(wallGeo, wallMatSide);
    right.rotation.y = -Math.PI / 2;
    right.position.set(S / 2, 0, 0);
    right.receiveShadow = true;
    scene.add(right);

    // Самбар factory (Physics өнгөний схем)
    const makeModernBoard = (
      width: number,
      height: number,
    ): {
      material: THREE.MeshStandardMaterial;
      redraw: (lines: string[]) => void;
      drawTopics: () => void;
      drawLabel: (label: string) => void;
      drawClear: () => void;
    } => {
      const bc = document.createElement("canvas");
      bc.width = 1024;
      bc.height = Math.round((1024 * height) / width);
      const ctx = bc.getContext("2d");

      const mat = new THREE.MeshStandardMaterial({
        color: 0x0a1420,
        roughness: 0.7,
        metalness: 0.1,
      });
      materials.push(mat);

      if (!ctx) {
        return {
          material: mat,
          redraw: () => {},
          drawTopics: () => {},
          drawLabel: () => {},
          drawClear: () => {},
        };
      }

      const drawBase = () => {
        ctx.fillStyle = "#0a1420";
        ctx.fillRect(0, 0, bc.width, bc.height);
        const grad = ctx.createRadialGradient(
          bc.width / 2,
          bc.height / 2,
          10,
          bc.width / 2,
          bc.height / 2,
          bc.width * 0.6,
        );
        grad.addColorStop(0, "rgba(30,70,110,0.28)");
        grad.addColorStop(1, "rgba(0,0,0,0.38)");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, bc.width, bc.height);
        ctx.fillStyle = "rgba(255,255,255,0.04)";
        const step = 38;
        for (let x = step; x < bc.width; x += step) {
          for (let y = step; y < bc.height; y += step) {
            ctx.beginPath();
            ctx.arc(x, y, 1.1, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      };

      const glowText = (
        text: string,
        x: number,
        y: number,
        font: string,
        color: string,
        glow: string,
        align: CanvasTextAlign = "left",
      ) => {
        ctx.font = font;
        ctx.textAlign = align;
        ctx.shadowColor = glow;
        ctx.shadowBlur = 18;
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        ctx.shadowBlur = 0;
        ctx.textAlign = "left";
      };

      const tex = new THREE.CanvasTexture(bc);
      tex.colorSpace = THREE.SRGBColorSpace;
      textures.push(tex);
      mat.map = tex;
      mat.emissive = new THREE.Color(0xffffff);
      mat.emissiveMap = tex;
      mat.emissiveIntensity = 0.85;
      mat.needsUpdate = true;

      // Голын самбар: Физикийн гол томъёонууд
      const drawTopics = () => {
        drawBase();
        const cyan = "rgba(140,210,255,0.95)";
        const cyanGlow = "rgba(100,190,255,0.9)";
        const steel = "rgba(200,230,255,0.95)";
        const steelGlow = "rgba(180,220,255,0.9)";

        glowText(
          "Гол томъёонууд",
          bc.width * 0.07,
          bc.height * 0.13,
          "italic 30px Georgia, serif",
          "rgba(255,255,255,0.85)",
          "rgba(200,230,255,0.3)",
        );

        // Зүүн дээд: давталтат хөдөлгөөн
        glowText(
          "x = A·sin(ωt + φ)",
          bc.width * 0.07,
          bc.height * 0.3,
          "34px 'Cambria Math', Georgia, serif",
          cyan,
          cyanGlow,
        );

        // Жижиг sine wave диаграм (зүүн доод)
        ctx.save();
        ctx.strokeStyle = steel;
        ctx.shadowColor = steelGlow;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;
        const px = bc.width * 0.12;
        const py = bc.height * 0.78;
        ctx.beginPath();
        for (let i = -80; i <= 80; i++) {
          const xx = px + i * 1.2;
          const yy = py - Math.sin((i / 80) * Math.PI * 2.5) * 44;
          if (i === -80) ctx.moveTo(xx, yy);
          else ctx.lineTo(xx, yy);
        }
        ctx.stroke();
        // тэнхлэг
        ctx.strokeStyle = "rgba(255,255,255,0.4)";
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.moveTo(px - 100, py);
        ctx.lineTo(px + 100, py);
        ctx.moveTo(px, py + 20);
        ctx.lineTo(px, py - 80);
        ctx.stroke();
        ctx.restore();

        // Гол: томъёонуудын жагсаалт
        let y = bc.height * 0.4;
        const rowGap = bc.height * 0.26;
        MOCK_TOPICS.forEach((t) => {
          glowText(
            t.label,
            bc.width * 0.42,
            y,
            "bold 32px Georgia, serif",
            "rgba(255,255,255,0.92)",
            "rgba(255,255,255,0.25)",
          );
          glowText(
            t.formula,
            bc.width * 0.42,
            y + 48,
            "30px 'Cambria Math', Georgia, serif",
            steel,
            steelGlow,
          );
          y += rowGap;
        });

        // Баруун дээд: атомын тойрог диаграм
        ctx.save();
        const cx = bc.width * 0.82;
        const cy = bc.height * 0.32;
        const rr = 52;
        ctx.strokeStyle = cyan;
        ctx.shadowColor = cyanGlow;
        ctx.shadowBlur = 12;
        ctx.lineWidth = 2.5;
        // цөм
        ctx.beginPath();
        ctx.arc(cx, cy, 10, 0, Math.PI * 2);
        ctx.stroke();
        // орбиталь
        ctx.beginPath();
        ctx.ellipse(cx, cy, rr, rr * 0.4, Math.PI * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(cx, cy, rr, rr * 0.4, -Math.PI * 0.3, 0, Math.PI * 2);
        ctx.stroke();
        // электрон
        ctx.shadowBlur = 0;
        ctx.fillStyle = cyan;
        ctx.beginPath();
        ctx.arc(cx + rr - 8, cy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = "20px Georgia, serif";
        ctx.fillStyle = "rgba(255,255,255,0.75)";
        ctx.fillText("e⁻", cx + rr - 4, cy - 10);
        ctx.restore();

        tex.needsUpdate = true;
      };

      const drawLabel = (label: string) => {
        drawBase();
        glowText(
          label,
          bc.width / 2,
          bc.height / 2 - 10,
          "bold 56px Georgia, serif",
          "rgba(255,255,255,0.9)",
          "rgba(140,200,255,0.6)",
          "center",
        );
        glowText(
          "дарж нээнэ үү →",
          bc.width / 2,
          bc.height / 2 + 50,
          "22px sans-serif",
          "rgba(160,220,255,0.6)",
          "rgba(140,210,255,0.4)",
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
        ctx.textAlign = "left";
        const marginX = bc.width * 0.08;
        let y = bc.height * 0.22;
        lines.forEach((line, i) => {
          if (i === 0) {
            glowText(
              line,
              marginX,
              y,
              "bold 54px Georgia, serif",
              "rgba(255,255,255,0.95)",
              "rgba(140,200,255,0.5)",
            );
            y += 100;
          } else if (line.startsWith("$$")) {
            const clean = line.replace(/\$\$/g, "");
            glowText(
              clean,
              marginX,
              y,
              "46px 'Cambria Math', Georgia, serif",
              "rgba(160,220,255,0.95)",
              "rgba(140,210,255,0.8)",
            );
            y += 70;
          } else {
            ctx.shadowColor = "rgba(140,210,255,0.4)";
            ctx.shadowBlur = 8;
            ctx.font = "30px sans-serif";
            ctx.fillStyle = "rgba(210,235,255,0.85)";
            ctx.textAlign = "left";
            wrapText(ctx, line, marginX, y, bc.width - marginX * 2, 44);
            ctx.shadowBlur = 0;
            y += 56;
          }
        });
        tex.needsUpdate = true;
      };

      return { material: mat, redraw, drawTopics, drawLabel, drawClear };
    };

    const boardH = HR * 0.52;
    const boardY = -0.1;
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x5a7090,
      metalness: 0.15,
      roughness: 0.7,
    });
    materials.push(frameMat);

    const interactiveBoards: THREE.Mesh[] = [];
    const bw_side = S * 0.65;
    const frontBoardW = S * 0.82;
    const sideBoardW = bw_side;

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
    leftBoard?.drawLabel?.("Тооцоолуур");
    rightBoard?.drawLabel?.("AI туслах");

    const grid = new THREE.GridHelper(S, 20, 0x7090a8, 0x607888);
    grid.position.y = -HR / 2 + 0.001;
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.35;
    scene.add(grid);

    const ambient = addAmbientPhysics({
      scene,
      roomSize: S,
      roomHeight: HR,
      geometries,
      materials,
      textures,
    });

    // Хөдөлгөөнт дүр
    let characterMesh: THREE.Mesh | null = null;
    const charTextures: THREE.Texture[] = [];
    let currentFrame = 0;
    const frameInterval = 0.2;
    let accumulatedTime = 0;
    const clock = new THREE.Clock();

    const loadCharacterAnimation = () => {
      const loader = new THREE.TextureLoader();
      const fileNames = [
        "/character1.png",
        "/character2.png",
        "/character3.png",
      ];
      let loadedCount = 0;
      fileNames.forEach((url, index) => {
        loader.load(url, (texture) => {
          texture.colorSpace = THREE.SRGBColorSpace;
          textures.push(texture);
          charTextures[index] = texture;
          loadedCount++;
          if (loadedCount === fileNames.length) {
            const charMat = new THREE.MeshBasicMaterial({
              map: charTextures[0],
              transparent: true,
              side: THREE.DoubleSide,
            });
            materials.push(charMat);
            const aspectRatio = texture.image.width / texture.image.height;
            const charHeight = 2.3;
            const charWidth = charHeight * aspectRatio;
            const charGeo = new THREE.PlaneGeometry(charWidth, charHeight);
            geometries.push(charGeo);
            characterMesh = new THREE.Mesh(charGeo, charMat);
            characterMesh.position.set(
              -1,
              -HR / 2 + charHeight / 2,
              -S / 2 + 6,
            );
            scene.add(characterMesh);
          }
        });
      });
    };
    loadCharacterAnimation();

    const fitDistance = (boardW: number): number => {
      const vFov = (camera.fov * Math.PI) / 180;
      const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
      const fill = 0.82;
      const distW = boardW / 2 / Math.tan(hFov / 2) / fill;
      const distH = boardH / 2 / Math.tan(vFov / 2) / fill;
      return Math.max(distW, distH);
    };

    const focusFrontBoard = (formula: Formula) => {
      if (!frontBoard) return;
      const d = fitDistance(frontBoardW);
      targetCamPos.set(0, boardY, frontBoard.position.z + d);
      targetLookAt.set(0, boardY, frontBoard.position.z);
      cameraMoving = true;
      pendingBoard = "front";
      activeBoardRef.current = "front";
      setActiveBoardRef.current("front");
      frontBoard.redraw?.([
        formula.title,
        `$$${formula.latex}$$`,
        ...formula.detail.split("\n"),
      ]);
    };
    focusBoardRef.current = focusFrontBoard;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (event: PointerEvent) => {
      if ((event.target as HTMLElement)?.closest?.(".ui-container")) return;

      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(interactiveBoards);

      if (intersects.length > 0 && intersects[0]) {
        const clickedBoard = intersects[0].object as THREE.Mesh;
        cameraMoving = true;

        if (clickedBoard.name === "front_board") {
          const d = fitDistance(frontBoardW);
          targetCamPos.set(0, boardY, clickedBoard.position.z + d);
          targetLookAt.set(0, boardY, clickedBoard.position.z);
          pendingBoard = "front";
          frontBoard?.drawTopics?.();
        } else if (clickedBoard.name === "left_board") {
          const d = fitDistance(sideBoardW);
          targetCamPos.set(clickedBoard.position.x + d, boardY, 0);
          targetLookAt.set(clickedBoard.position.x, boardY, 0);
          pendingBoard = "left";
          leftBoard?.drawClear?.();
        } else if (clickedBoard.name === "right_board") {
          const d = fitDistance(sideBoardW);
          targetCamPos.set(clickedBoard.position.x - d, boardY, 0);
          targetLookAt.set(clickedBoard.position.x, boardY, 0);
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

    let animationFrameId: number;
    const tempV = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const deltaTime = clock.getDelta();
      accumulatedTime += deltaTime;
      const elapsed = clock.elapsedTime;
      ambient.update(elapsed);

      if (accumulatedTime >= frameInterval) {
        accumulatedTime %= frameInterval;
        if (characterMesh && charTextures.length === 3) {
          currentFrame = (currentFrame + 1) % charTextures.length;
          const currentTex = charTextures[currentFrame];
          if (currentTex) {
            const m = characterMesh.material as THREE.MeshBasicMaterial;
            m.map = currentTex;
            m.needsUpdate = true;
          }
        }
      }

      camera.position.lerp(targetCamPos, 0.08);
      currentLookAt.lerp(targetLookAt, 0.08);
      camera.lookAt(currentLookAt);

      if (cameraMoving && camera.position.distanceTo(targetCamPos) < 0.05) {
        cameraMoving = false;
      }

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
        } else {
          setUiPos((prev) => ({ ...prev, visible: false }));
        }
      } else {
        setUiPos((prev) => (prev.visible ? { ...prev, visible: false } : prev));
      }

      const active = activeBoardRef.current;
      const activeBoardMesh =
        active === "front"
          ? frontBoard
          : active === "left"
            ? leftBoard
            : active === "right"
              ? rightBoard
              : null;
      const activeBoardW =
        active === "front" ? frontBoardW : active ? sideBoardW : 0;

      if (activeBoardMesh && !cameraMoving) {
        const hw = activeBoardW / 2;
        const hh = boardH / 2;
        const pad = 0.92;
        let minX = Infinity,
          minY = Infinity,
          maxX = -Infinity,
          maxY = -Infinity;
        let behind = false;
        const corners: [number, number][] = [
          [-hw * pad, -hh * pad],
          [hw * pad, -hh * pad],
          [hw * pad, hh * pad],
          [-hw * pad, hh * pad],
        ];
        for (const [lx, ly] of corners) {
          tempV.set(lx, ly, 0);
          activeBoardMesh.localToWorld(tempV);
          tempV.project(camera);
          if (tempV.z > 1) behind = true;
          const sx = (tempV.x * 0.5 + 0.5) * W;
          const sy = (tempV.y * -0.5 + 0.5) * H;
          minX = Math.min(minX, sx);
          maxX = Math.max(maxX, sx);
          minY = Math.min(minY, sy);
          maxY = Math.max(maxY, sy);
        }
        if (!behind) {
          setBoardRectRef.current({
            left: minX,
            top: minY,
            width: maxX - minX,
            height: maxY - minY,
          });
        }
      } else if (!active) {
        setBoardRectRef.current(null);
      }
    };
    animate();

    const onResize = () => {
      W = mount.clientWidth;
      H = mount.clientHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    const ro = new ResizeObserver(() => onResize());
    ro.observe(mount);

    resetCameraRef.current = () => {
      targetCamPos.copy(defaultCamPos);
      targetLookAt.copy(defaultTarget);
      cameraMoving = true;
      pendingBoard = null;
      activeBoardRef.current = null;
      frontBoard?.drawTopics?.();
      leftBoard?.drawLabel?.("Тооцоолуур");
      rightBoard?.drawLabel?.("AI туслах");
    };

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
      window.removeEventListener("pointerdown", onPointerDown);
      focusBoardRef.current = null;
      resetCameraRef.current = null;
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

  const boardOverlayStyle: React.CSSProperties = boardRect
    ? {
        position: "absolute",
        left: `${boardRect.left}px`,
        top: `${boardRect.top}px`,
        width: `${boardRect.width}px`,
        height: `${boardRect.height}px`,
        zIndex: 10,
        boxSizing: "border-box",
        padding: "clamp(20px, 4.5%, 56px)",
        overflowY: "auto",
        color: "rgba(255,255,255,0.92)",
        background:
          "linear-gradient(165deg, rgba(20,44,72,0.55), rgba(10,22,40,0.78))",
        borderRadius: "10px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
      }
    : {
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
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
      {/* Хүүхдийн input + томъёоны жагсаалт */}
      {uiPos.visible && activeBoard === null && (
        <div
          className="ui-container"
          style={{
            position: "absolute",
            left: `${uiPos.left}px`,
            top: `${uiPos.top}px`,
            transform: "translate(0%, -50%)",
            zIndex: 10,
            width: "380px",
            background: "rgba(240, 246, 255, 0.88)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            padding: "10px 14px",
            borderRadius: "12px",
            boxShadow: "0 6px 20px rgba(0,40,80,0.10)",
            border: "1px solid rgba(180, 210, 255, 0.5)",
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
              background: "rgba(240, 246, 255, 0.88)",
              borderLeft: "1px solid rgba(180, 210, 255, 0.5)",
              borderBottom: "1px solid rgba(180, 210, 255, 0.5)",
              zIndex: -1,
            }}
          />
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", gap: "8px", alignItems: "center" }}
          >
            <input
              type="text"
              placeholder="Бодлогоо бичих эсвэл зураг..."
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "6px",
                border: "1px solid #ccd8e8",
                fontSize: "13px",
                outline: "none",
                background: "#fff",
              }}
            />
            <label
              style={{
                padding: "8px 10px",
                background: selectedImage ? "#34c759" : "#eef3fa",
                color: selectedImage ? "#fff" : "#3a5a80",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
                border: "1px solid #bdd0e8",
                display: "flex",
                alignItems: "center",
              }}
            >
              {selectedImage ? "✓" : "📸"}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0])
                    setSelectedImage(e.target.files[0]);
                }}
                style={{ display: "none" }}
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: "8px 14px",
                background: loading ? "#8aaad5" : "#2a5fa8",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: loading ? "default" : "pointer",
                fontWeight: "600",
                fontSize: "13px",
                whiteSpace: "nowrap",
              }}
            >
              {loading ? "Бодож байна…" : "Илгээх"}
            </button>
          </form>

          {formulas.length > 0 && (
            <div style={{ marginTop: "10px", display: "grid", gap: "6px" }}>
              {formulas.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 10px",
                    background: "#fff",
                    borderRadius: "8px",
                    border: "1px solid #dce8f5",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1a2f4a",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {f.title}
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: "#6b7280",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {f.latex}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSelectFormula(f)}
                    style={{
                      padding: "6px 10px",
                      background: "#1a2f4a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: 600,
                      whiteSpace: "nowrap",
                    }}
                  >
                    Дэлгэрэнгүй →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Зүүн самбар: Кинематик тооцоолуур */}
      {activeBoard === "left" && (
        <div className="ui-container" style={boardOverlayStyle}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(160,215,255,0.7)",
              marginBottom: "6px",
            }}
          >
            Тооцоолуур
          </div>
          <h3
            style={{
              margin: "0 0 4px",
              color: "rgba(255,255,255,0.95)",
              fontSize: "clamp(18px, 3.5vh, 26px)",
              fontFamily: "Georgia, serif",
            }}
          >
            Кинематикийн тооцоолуур
          </h3>
          <p
            style={{
              margin: "0 0 16px",
              color: "rgba(160,215,255,0.85)",
              fontSize: "15px",
              fontFamily: "Cambria Math, Georgia, serif",
            }}
          >
            v = v₀ + at &nbsp;|&nbsp; d = v₀t + ½at²
          </p>
          <div style={{ display: "flex", gap: "10px", marginBottom: "16px" }}>
            {[
              { v: kinV0, set: setKinV0, l: "v₀ (m/s)" },
              { v: kinA, set: setKinA, l: "a (m/s²)" },
              { v: kinT, set: setKinT, l: "t (s)" },
            ].map(({ v, set, l }) => (
              <div key={l} style={{ flex: 1 }}>
                <label
                  style={{
                    fontSize: "11px",
                    color: "rgba(255,255,255,0.6)",
                  }}
                >
                  {l}
                </label>
                <input
                  type="number"
                  value={v}
                  onChange={(e) => set(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    border: "1px solid rgba(160,215,255,0.25)",
                    background: "rgba(255,255,255,0.08)",
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
            onClick={solveKinematics}
            style={{
              width: "100%",
              padding: "12px",
              background: "rgba(160,215,255,0.95)",
              color: "#0a1a30",
              border: "none",
              borderRadius: "10px",
              cursor: "pointer",
              fontWeight: 700,
              fontSize: "15px",
            }}
          >
            Тооцоолох
          </button>
          {kinResult && (
            <div
              style={{
                marginTop: "16px",
                padding: "14px",
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(160,215,255,0.2)",
                borderRadius: "10px",
                fontSize: "17px",
                color: "rgba(160,215,255,0.95)",
                fontWeight: 600,
                fontFamily: "Cambria Math, Georgia, serif",
                whiteSpace: "pre-line",
              }}
            >
              {kinResult}
            </div>
          )}
        </div>
      )}

      {/* Баруун самбар: AI туслах */}
      {activeBoard === "right" && (
        <div className="ui-container" style={boardOverlayStyle}>
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "rgba(160,215,255,0.7)",
              marginBottom: "6px",
            }}
          >
            AI
          </div>
          <h3
            style={{
              margin: "0 0 14px",
              color: "rgba(255,255,255,0.95)",
              fontSize: "clamp(18px, 3.5vh, 26px)",
              fontFamily: "Georgia, serif",
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
                  color: "rgba(255,255,255,0.4)",
                  fontSize: "14px",
                  margin: 0,
                }}
              >
                Физикийн асуултаа бичээрэй…
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
                      ? "rgba(160,215,255,0.95)"
                      : "rgba(255,255,255,0.1)",
                  color:
                    m.role === "user" ? "#0a1a30" : "rgba(255,255,255,0.9)",
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
                border: "1px solid rgba(160,215,255,0.2)",
                background: "rgba(255,255,255,0.08)",
                color: "#fff",
                fontSize: "14px",
                outline: "none",
              }}
            />
            <button
              onClick={sendAi}
              style={{
                padding: "10px 16px",
                background: "rgba(160,215,255,0.95)",
                color: "#0a1a30",
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

      {/* Буцах товч */}
      {activeBoard !== null && (
        <button
          className="ui-container"
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
            background: "rgba(240,246,255,0.92)",
            border: "1px solid #bdd0e8",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: 600,
            fontSize: "13px",
            color: "#1a2f4a",
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

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number,
) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    if (ctx.measureText(testLine).width > maxWidth && n > 0) {
      ctx.fillText(line, x, curY);
      line = words[n] + " ";
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}
