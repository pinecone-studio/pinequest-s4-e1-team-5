"use client";

import Link from "next/link";
import { PointerEvent, useRef, useState } from "react";
import {
  addVectors,
  angleDeg,
  dotProduct,
  fromPolar,
  mathToScreen,
  roundNumber,
  roundVector,
  screenToMath,
  scaleVector,
  subtractVectors,
  toPolar,
  type Vector2,
} from "../../lib/vectorMath";

type OperationMode = "add" | "subtract" | "equilibrium";
type InputMode = "component" | "polar";
type DragTarget = "A" | "B" | null;
type AiMode = "explain" | "hint" | "exercise";

const WIDTH = 760;
const HEIGHT = 560;
const SCALE = 32;
const ORIGIN = { x: WIDTH / 2, y: HEIGHT / 2 };
const VECTOR_COLORS = {
  a: "#0891b2",
  b: "#c026d3",
  c: "#059669",
};

const presets: {
  label: string;
  a: Vector2;
  b: Vector2;
  mode: OperationMode;
  nA?: number;
  nB?: number;
}[] = [
  { label: "Энгийн нэмэх", a: { x: 5, y: 3 }, b: { x: 2, y: 4 }, mode: "add" },
  { label: "Эсрэг чиглэл", a: { x: 6, y: 1 }, b: { x: -3, y: 2 }, mode: "add" },
  { label: "Хасах жишээ", a: { x: 4, y: 5 }, b: { x: 2, y: 1 }, mode: "subtract" },
  { label: "Тэнцвэр", a: { x: 4, y: 2 }, b: { x: -1, y: 4 }, mode: "equilibrium" },
  { label: "Скаляр -1", a: { x: 3, y: 2 }, b: { x: 2, y: -2 }, mode: "add", nA: -1, nB: 1.5 },
];

export function VectorAdditionLab() {
  const [a, setA] = useState<Vector2>({ x: 5, y: 3 });
  const [b, setB] = useState<Vector2>({ x: 2, y: 4 });
  const [nA, setNA] = useState(1);
  const [nB, setNB] = useState(1);
  const [operation, setOperation] = useState<OperationMode>("add");
  const [inputMode, setInputMode] = useState<InputMode>("component");
  const [showValues, setShowValues] = useState(true);
  const [showComponents, setShowComponents] = useState(true);
  const [showAngles, setShowAngles] = useState(true);
  const [showGrid, setShowGrid] = useState(true);
  const [showParallelogram, setShowParallelogram] = useState(true);
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [aiText, setAiText] = useState("AI-ready panel: одоогийн векторууд дээр тайлбар, hint, дасгал mock байдлаар гарна.");
  const svgRef = useRef<SVGSVGElement | null>(null);

  const scaledA = scaleVector(a, nA);
  const scaledB = scaleVector(b, nB);
  const effectiveB =
    operation === "subtract" ? scaleVector(scaledB, -1) : scaledB;
  const c =
    operation === "add"
      ? addVectors(scaledA, scaledB)
      : operation === "subtract"
        ? subtractVectors(scaledA, scaledB)
        : scaleVector(addVectors(scaledA, scaledB), -1);
  const roundedA = roundVector(scaledA);
  const roundedB = roundVector(scaledB);
  const roundedC = roundVector(c);
  const dot = dotProduct(scaledA, scaledB);

  function updateVector(target: "A" | "B", next: Vector2) {
    const clamped = {
      x: Math.max(-10, Math.min(10, roundNumber(next.x, 1))),
      y: Math.max(-7, Math.min(7, roundNumber(next.y, 1))),
    };
    if (target === "A") {
      setA(nA === 0 ? clamped : scaleVector(clamped, 1 / nA));
    } else {
      setB(nB === 0 ? clamped : scaleVector(clamped, 1 / nB));
    }
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragTarget || !svgRef.current) {
      return;
    }
    const rect = svgRef.current.getBoundingClientRect();
    const screen = {
      x: ((event.clientX - rect.left) / rect.width) * WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * HEIGHT,
    };
    updateVector(dragTarget, screenToMath(screen, ORIGIN, SCALE));
  }

  function handlePointerUp() {
    setDragTarget(null);
  }

  function reset() {
    setA({ x: 5, y: 3 });
    setB({ x: 2, y: 4 });
    setNA(1);
    setNB(1);
    setOperation("add");
    setAiText("Reset хийлээ. A болон B векторын төгсгөлийг чирж өөрчилж болно.");
  }

  function applyPreset(presetIndex: number) {
    const preset = presets[presetIndex];
    setA(preset.a);
    setB(preset.b);
    setNA(preset.nA ?? 1);
    setNB(preset.nB ?? 1);
    setOperation(preset.mode);
    setAiText(`${preset.label} preset сонгогдлоо. Одоо C вектор хэрхэн өөрчлөгдсөнийг ажиглаарай.`);
  }

  function runMockAi(mode: AiMode) {
    const signText = operation === "add" ? "нэмсэн" : "хассан";
    const operator =
      operation === "add" ? "+" : operation === "subtract" ? "-" : "+";
    const largestComponent =
      Math.abs(roundedA.x) + Math.abs(roundedB.x) >=
      Math.abs(roundedA.y) + Math.abs(roundedB.y)
        ? "x"
        : "y";
    if (mode === "explain") {
      setAiText(
        operation === "equilibrium"
          ? `nA·A = (${roundedA.x}, ${roundedA.y}), nB·B = (${roundedB.x}, ${roundedB.y}). Тэнцвэрийн горимд C = -((nA·A) + (nB·B)) тул C = (${roundedC.x}, ${roundedC.y}) болж гурван сум нийлээд эхлэл цэгт буцна.`
          : `nA·A = (${roundedA.x}, ${roundedA.y}), nB·B = (${roundedB.x}, ${roundedB.y}) тул C = (nA·A) ${operator} (nB·B) = (${roundedC.x}, ${roundedC.y}). x бүрэлдэхүүнүүдийг хооронд нь, y бүрэлдэхүүнүүдийг хооронд нь ${signText}. Dot product = ${roundNumber(dot, 2)}.`,
      );
    } else if (mode === "hint") {
      setAiText(
        `Hint: одоо ${largestComponent} бүрэлдэхүүн нийт нөлөөнд илүү том байна. Эхлээд ${largestComponent}-ийн утгуудыг харж, дараа нь нөгөө тэнхлэгтэй харьцуул.`,
      );
    } else {
      const magA = roundNumber(toPolar(scaledA).magnitude, 1);
      const magB = roundNumber(toPolar(scaledB).magnitude, 1);
      setAiText(
        `Дасгал: |nA·A| = ${magA}, |nB·B| = ${magB}. Хэрэв өнцгүүдийг өөрчлөхгүйгээр nA-г ${roundNumber(nA + 0.5, 1)} болговол C-ийн хэмжээ өсөх үү, багасах уу? Яагаад?`,
      );
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f8fb] px-5 py-6 text-slate-950">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-5">
        <header className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
          <Link
            href="/"
            className="mb-5 inline-flex h-10 items-center rounded-full border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:border-slate-300"
          >
            Буцах
          </Link>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Векторын интерактив лаборатори
          </p>
          <h1 className="mt-3 max-w-4xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Вектор нэмэх ба хасах интерактив симуляц
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">
            A болон B векторын сумны үзүүрийг чирж өөрчил. C вектор автоматаар
            бодогдож, бүрэлдэхүүн, өнцөг, урт нь шууд шинэчлэгдэнэ.
          </p>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <QuickStep number="1" title="Сумыг чир" body="A эсвэл B-ийн үзүүрийг grid дээр хөдөлгө." />
            <QuickStep number="2" title="Утга оруул" body="Component ба polar утгууд үргэлж синк байна." />
            <QuickStep number="3" title="Үр дүнг унш" body="C, өнцөг, бүрэлдэхүүн, dot product-г хар." />
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
          <section className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                  Координатын самбар
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Сумны үзүүрийг чирэхэд баруун талын component, polar утгууд шууд дагаж өөрчлөгдөнө.
                </p>
              </div>
              <div className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-600">
                1 нүд = 1 нэгж
              </div>
            </div>
            <VectorCanvas
              a={a}
              b={b}
              scaledA={scaledA}
              scaledB={scaledB}
              c={c}
              effectiveB={effectiveB}
              operation={operation}
              showGrid={showGrid}
              showComponents={showComponents}
              showAngles={showAngles}
              showParallelogram={showParallelogram}
              dragTarget={dragTarget}
              svgRef={svgRef}
              onPointerDown={setDragTarget}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            />
          </section>

          <aside className="space-y-5">
            <VectorControls
              a={a}
              b={b}
              nA={nA}
              nB={nB}
              operation={operation}
              inputMode={inputMode}
              showValues={showValues}
              showComponents={showComponents}
              showAngles={showAngles}
              showGrid={showGrid}
              showParallelogram={showParallelogram}
              onAChange={setA}
              onBChange={setB}
              onNAChange={setNA}
              onNBChange={setNB}
              onOperationChange={setOperation}
              onInputModeChange={setInputMode}
              onShowValuesChange={setShowValues}
              onShowComponentsChange={setShowComponents}
              onShowAnglesChange={setShowAngles}
              onShowGridChange={setShowGrid}
              onShowParallelogramChange={setShowParallelogram}
              onReset={reset}
              onPreset={applyPreset}
            />
            {showValues && (
              <VectorValuesPanel
                a={scaledA}
                b={scaledB}
                c={c}
                nA={nA}
                nB={nB}
                dot={dot}
                operation={operation}
              />
            )}
          </aside>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_420px]">
          <VectorExplanationPanel operation={operation} />
          <VectorAIPanel aiText={aiText} onRun={runMockAi} />
        </div>
      </section>
    </main>
  );
}

function VectorCanvas({
  scaledA,
  scaledB,
  c,
  effectiveB,
  operation,
  showGrid,
  showComponents,
  showAngles,
  showParallelogram,
  dragTarget,
  svgRef,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  a: Vector2;
  b: Vector2;
  scaledA: Vector2;
  scaledB: Vector2;
  c: Vector2;
  effectiveB: Vector2;
  operation: OperationMode;
  showGrid: boolean;
  showComponents: boolean;
  showAngles: boolean;
  showParallelogram: boolean;
  dragTarget: DragTarget;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onPointerDown: (target: "A" | "B") => void;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
}) {
  const origin = ORIGIN;
  const aEnd = mathToScreen(scaledA, origin, SCALE);
  const bEnd = mathToScreen(scaledB, origin, SCALE);
  const chainSecond = addVectors(scaledA, effectiveB);
  const effectiveBEndFromA = mathToScreen(chainSecond, origin, SCALE);
  const cEnd = mathToScreen(c, origin, SCALE);
  const parallelogramPoints = [
    origin,
    aEnd,
    mathToScreen(addVectors(scaledA, scaledB), origin, SCALE),
    bEnd,
  ]
    .map((point) => `${point.x},${point.y}`)
    .join(" ");

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      className="h-[72vh] min-h-[520px] w-full touch-none select-none rounded-[1.5rem] border border-slate-200 bg-[#fbfcff]"
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <defs>
        <marker id="arrowA" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto">
          <path d="M0,0 L0,8 L11,4 z" fill={VECTOR_COLORS.a} />
        </marker>
        <marker id="arrowB" markerWidth="12" markerHeight="12" refX="10" refY="4" orient="auto">
          <path d="M0,0 L0,8 L11,4 z" fill={VECTOR_COLORS.b} />
        </marker>
        <marker id="arrowC" markerWidth="14" markerHeight="14" refX="12" refY="5" orient="auto">
          <path d="M0,0 L0,10 L13,5 z" fill={VECTOR_COLORS.c} />
        </marker>
      </defs>

      {showGrid && <Grid />}
      <line x1={0} y1={origin.y} x2={WIDTH} y2={origin.y} stroke="#64748b" strokeWidth={2} opacity={0.75} />
      <line x1={origin.x} y1={0} x2={origin.x} y2={HEIGHT} stroke="#64748b" strokeWidth={2} opacity={0.75} />
      <text x={WIDTH - 28} y={origin.y - 10} fill="#334155" fontSize={18} fontWeight={700}>x</text>
      <text x={origin.x + 10} y={24} fill="#334155" fontSize={18} fontWeight={700}>y</text>

      {operation === "add" && showParallelogram && (
        <polygon
          points={parallelogramPoints}
          fill={VECTOR_COLORS.c}
          opacity={0.12}
          stroke={VECTOR_COLORS.c}
          strokeWidth={2}
          strokeDasharray="10 8"
        />
      )}

      {showComponents && (
        <>
          <ComponentLines vector={scaledA} color={VECTOR_COLORS.a} />
          <ComponentLines vector={scaledB} color={VECTOR_COLORS.b} />
          <ComponentLines vector={c} color={VECTOR_COLORS.c} />
        </>
      )}

      {showAngles && (
        <>
          <AngleArc vector={scaledA} color={VECTOR_COLORS.a} radius={42} label="θA" />
          <AngleArc vector={scaledB} color={VECTOR_COLORS.b} radius={68} label="θB" />
          <AngleArc vector={c} color={VECTOR_COLORS.c} radius={94} label="θC" />
        </>
      )}

      <VectorArrow end={aEnd} color={VECTOR_COLORS.a} marker="url(#arrowA)" label="nA·A" />
      <VectorArrow end={bEnd} color={VECTOR_COLORS.b} marker="url(#arrowB)" label="nB·B" />
      <line
        x1={aEnd.x}
        y1={aEnd.y}
        x2={effectiveBEndFromA.x}
        y2={effectiveBEndFromA.y}
        stroke={VECTOR_COLORS.b}
        strokeWidth={3}
        strokeDasharray="10 10"
        opacity={0.55}
        markerEnd="url(#arrowB)"
      />
      <text x={aEnd.x + 10} y={aEnd.y - 10} fill={VECTOR_COLORS.b} fontSize={16} fontWeight={700}>
        {operation === "subtract"
          ? "-nB·B-г A-ийн төгсгөлд"
          : "nB·B-г nA·A-ийн төгсгөлд"}
      </text>
      {operation === "equilibrium" && (
        <line
          x1={effectiveBEndFromA.x}
          y1={effectiveBEndFromA.y}
          x2={origin.x}
          y2={origin.y}
          stroke={VECTOR_COLORS.c}
          strokeWidth={5}
          strokeDasharray="12 9"
          markerEnd="url(#arrowC)"
        />
      )}
      <VectorArrow end={cEnd} color={VECTOR_COLORS.c} marker="url(#arrowC)" label="C" thick />

      <DragHandle
        point={aEnd}
        color={VECTOR_COLORS.a}
        active={dragTarget === "A"}
        onPointerDown={() => onPointerDown("A")}
      />
      <DragHandle
        point={bEnd}
        color={VECTOR_COLORS.b}
        active={dragTarget === "B"}
        onPointerDown={() => onPointerDown("B")}
      />
    </svg>
  );
}

function Grid() {
  const lines = [];
  for (let x = ORIGIN.x % SCALE; x <= WIDTH; x += SCALE) {
    lines.push(<line key={`x-${x}`} x1={x} y1={0} x2={x} y2={HEIGHT} stroke="#e2e8f0" />);
  }
  for (let y = ORIGIN.y % SCALE; y <= HEIGHT; y += SCALE) {
    lines.push(<line key={`y-${y}`} x1={0} y1={y} x2={WIDTH} y2={y} stroke="#e2e8f0" />);
  }
  return <g opacity={0.95}>{lines}</g>;
}

function VectorArrow({
  end,
  color,
  marker,
  label,
  thick = false,
}: {
  end: Vector2;
  color: string;
  marker: string;
  label: string;
  thick?: boolean;
}) {
  return (
    <g>
      <line
        x1={ORIGIN.x}
        y1={ORIGIN.y}
        x2={end.x}
        y2={end.y}
        stroke={color}
        strokeWidth={thick ? 6 : 4}
        markerEnd={marker}
        filter="drop-shadow(0 0 8px currentColor)"
      />
      <text x={end.x + 12} y={end.y + 6} fill={color} fontSize={22} fontWeight={800}>
        {label}
      </text>
    </g>
  );
}

function DragHandle({
  point,
  color,
  active,
  onPointerDown,
}: {
  point: Vector2;
  color: string;
  active: boolean;
  onPointerDown: () => void;
}) {
  return (
    <circle
      cx={point.x}
      cy={point.y}
      r={active ? 15 : 11}
      fill={color}
      stroke="#fff"
      strokeWidth={3}
      className="cursor-grab"
      onPointerDown={(event) => {
        event.currentTarget.setPointerCapture(event.pointerId);
        onPointerDown();
      }}
    />
  );
}

function QuickStep({
  number,
  title,
  body,
}: {
  number: string;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
          {number}
        </span>
        <div>
          <p className="font-semibold text-slate-950">{title}</p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
        </div>
      </div>
    </div>
  );
}

function ComponentLines({ vector, color }: { vector: Vector2; color: string }) {
  const end = mathToScreen(vector, ORIGIN, SCALE);
  const xPoint = mathToScreen({ x: vector.x, y: 0 }, ORIGIN, SCALE);
  return (
    <g opacity={0.75}>
      <line x1={end.x} y1={end.y} x2={xPoint.x} y2={xPoint.y} stroke={color} strokeDasharray="8 8" />
      <line x1={ORIGIN.x} y1={ORIGIN.y} x2={xPoint.x} y2={xPoint.y} stroke={color} strokeDasharray="8 8" />
    </g>
  );
}

function AngleArc({
  vector,
  color,
  radius,
  label,
}: {
  vector: Vector2;
  color: string;
  radius: number;
  label: string;
}) {
  const angle = angleDeg(vector);
  const radians = (angle * Math.PI) / 180;
  const end = {
    x: ORIGIN.x + radius * Math.cos(radians),
    y: ORIGIN.y - radius * Math.sin(radians),
  };
  const largeArc = angle > 180 ? 1 : 0;
  return (
    <g>
      <path
        d={`M ${ORIGIN.x + radius} ${ORIGIN.y} A ${radius} ${radius} 0 ${largeArc} 0 ${end.x} ${end.y}`}
        fill="none"
        stroke={color}
        strokeWidth={2}
      />
      <text x={end.x + 4} y={end.y - 4} fill={color} fontSize={14} fontWeight={700}>
        {label} {roundNumber(angle, 0)}°
      </text>
    </g>
  );
}

function VectorControls({
  a,
  b,
  nA,
  nB,
  operation,
  inputMode,
  showValues,
  showComponents,
  showAngles,
  showGrid,
  showParallelogram,
  onAChange,
  onBChange,
  onNAChange,
  onNBChange,
  onOperationChange,
  onInputModeChange,
  onShowValuesChange,
  onShowComponentsChange,
  onShowAnglesChange,
  onShowGridChange,
  onShowParallelogramChange,
  onReset,
  onPreset,
}: {
  a: Vector2;
  b: Vector2;
  nA: number;
  nB: number;
  operation: OperationMode;
  inputMode: InputMode;
  showValues: boolean;
  showComponents: boolean;
  showAngles: boolean;
  showGrid: boolean;
  showParallelogram: boolean;
  onAChange: (vector: Vector2) => void;
  onBChange: (vector: Vector2) => void;
  onNAChange: (value: number) => void;
  onNBChange: (value: number) => void;
  onOperationChange: (mode: OperationMode) => void;
  onInputModeChange: (mode: InputMode) => void;
  onShowValuesChange: (show: boolean) => void;
  onShowComponentsChange: (show: boolean) => void;
  onShowAnglesChange: (show: boolean) => void;
  onShowGridChange: (show: boolean) => void;
  onShowParallelogramChange: (show: boolean) => void;
  onReset: () => void;
  onPreset: (index: number) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Удирдлага</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Горим, скаляр, координат болон харагдах давхаргуудыг эндээс удирдана.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <SegmentButton active={operation === "add"} onClick={() => onOperationChange("add")}>A + B</SegmentButton>
        <SegmentButton active={operation === "subtract"} onClick={() => onOperationChange("subtract")}>A - B</SegmentButton>
        <SegmentButton active={operation === "equilibrium"} onClick={() => onOperationChange("equilibrium")}>A+B+C=0</SegmentButton>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <SegmentButton active={inputMode === "component"} onClick={() => onInputModeChange("component")}>Component</SegmentButton>
        <SegmentButton active={inputMode === "polar"} onClick={() => onInputModeChange("polar")}>Polar</SegmentButton>
      </div>

      <div className="mt-5 space-y-3">
        <ScalarSlider label="nA" value={nA} onChange={onNAChange} color="cyan" />
        <ScalarSlider label="nB" value={nB} onChange={onNBChange} color="fuchsia" />
      </div>

      <div className="mt-5 space-y-4">
        <SyncedVectorInputs
          label="A"
          vector={a}
          activeMode={inputMode}
          onChange={onAChange}
        />
        <SyncedVectorInputs
          label="B"
          vector={b}
          activeMode={inputMode}
          onChange={onBChange}
        />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <Toggle label="Values" checked={showValues} onChange={onShowValuesChange} />
        <Toggle label="Components" checked={showComponents} onChange={onShowComponentsChange} />
        <Toggle label="Angles" checked={showAngles} onChange={onShowAnglesChange} />
        <Toggle label="Grid" checked={showGrid} onChange={onShowGridChange} />
        <Toggle label="Parallelogram" checked={showParallelogram} onChange={onShowParallelogramChange} />
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        {presets.map((preset, index) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onPreset(index)}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-cyan-400 hover:bg-cyan-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 h-11 w-full rounded-2xl bg-slate-950 text-sm font-bold text-white hover:bg-slate-800"
      >
        Дахин эхлүүлэх
      </button>
    </section>
  );
}

function SegmentButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-10 rounded-full text-sm font-bold transition ${
        active
          ? "bg-slate-950 text-white shadow-sm"
          : "border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function ScalarSlider({
  label,
  value,
  onChange,
  color,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  color: "cyan" | "fuchsia";
}) {
  const accent = color === "cyan" ? "text-cyan-700" : "text-fuchsia-700";
  const rangeAccent = color === "cyan" ? "accent-cyan-500" : "accent-fuchsia-500";
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className={`text-sm font-bold ${accent}`}>{label}</span>
        <span className="rounded-full bg-white px-2 py-1 font-mono text-sm font-semibold text-slate-950 shadow-sm">
          {value}
        </span>
      </div>
      <input
        type="range"
        min="-3"
        max="3"
        step="0.5"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`w-full ${rangeAccent}`}
      />
      <p className="mt-2 text-xs leading-5 text-slate-500">
        Сөрөг утга векторын чиглэлийг эсрэг болгоно.
      </p>
    </label>
  );
}

function SyncedVectorInputs({
  label,
  vector,
  activeMode,
  onChange,
}: {
  label: string;
  vector: Vector2;
  activeMode: InputMode;
  onChange: (vector: Vector2) => void;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800">Вектор {label}</p>
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          {activeMode}
        </span>
      </div>
      <ComponentInputs label={label} vector={vector} onChange={onChange} />
      <div className="mt-3">
        <PolarInputs label={label} vector={vector} onChange={onChange} />
      </div>
    </div>
  );
}

function ComponentInputs({
  label,
  vector,
  onChange,
}: {
  label: string;
  vector: Vector2;
  onChange: (vector: Vector2) => void;
}) {
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">Component утга</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput label={`${label}x`} value={vector.x} onChange={(x) => onChange({ ...vector, x })} />
        <NumberInput label={`${label}y`} value={vector.y} onChange={(y) => onChange({ ...vector, y })} />
      </div>
    </div>
  );
}

function PolarInputs({
  label,
  vector,
  onChange,
}: {
  label: string;
  vector: Vector2;
  onChange: (vector: Vector2) => void;
}) {
  const polar = toPolar(vector);
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-slate-700">Polar утга</p>
      <div className="grid grid-cols-2 gap-2">
        <NumberInput
          label={`|${label}|`}
          value={roundNumber(polar.magnitude, 1)}
          onChange={(nextMagnitude) => onChange(fromPolar({ ...polar, magnitude: nextMagnitude }))}
        />
        <NumberInput
          label={`θ${label}`}
          value={roundNumber(polar.angle, 0)}
          onChange={(nextAngle) => onChange(fromPolar({ ...polar, angle: nextAngle }))}
        />
      </div>
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <input
        value={value}
        type="number"
        step="0.1"
        onChange={(event) => onChange(Number(event.target.value))}
        className="mt-1 w-full bg-transparent font-mono text-sm font-semibold text-slate-950 outline-none"
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="accent-slate-950"
      />
      {label}
    </label>
  );
}

function VectorValuesPanel({
  a,
  b,
  c,
  nA,
  nB,
  dot,
  operation,
}: {
  a: Vector2;
  b: Vector2;
  c: Vector2;
  nA: number;
  nB: number;
  dot: number;
  operation: OperationMode;
}) {
  const equationLabel =
    operation === "add"
      ? "C = nA·A + nB·B"
      : operation === "subtract"
        ? "C = nA·A - nB·B"
        : "C = -(nA·A + nB·B)";
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Утгууд</h2>
      <p className="mt-1 text-sm leading-6 text-slate-600">
        Скаляр үржүүлсний дараах бодит векторууд болон үр дүн.
      </p>
      <div className="mt-4 space-y-3">
        <ValueRow name={`nA·A (${nA}·A)`} vector={a} color="text-cyan-700" />
        <ValueRow name={`nB·B (${nB}·B)`} vector={b} color="text-fuchsia-700" />
        <ValueRow name={equationLabel} vector={c} color="text-emerald-700" />
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3">
          <p className="font-bold text-amber-800">Dot product</p>
          <p className="mt-1 font-mono text-sm font-semibold text-slate-800">
            (nA·A) · (nB·B) = Ax*Bx + Ay*By = {roundNumber(dot, 2)}
          </p>
        </div>
      </div>
    </section>
  );
}

function ValueRow({
  name,
  vector,
  color,
}: {
  name: string;
  vector: Vector2;
  color: string;
}) {
  const polar = toPolar(vector);
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className={`font-bold ${color}`}>{name}</p>
      <p className="mt-1 font-mono text-sm font-semibold text-slate-950">
        ({roundNumber(vector.x, 1)}, {roundNumber(vector.y, 1)})
      </p>
      <p className="mt-1 text-xs text-slate-500">
        |{name}| = {roundNumber(polar.magnitude, 2)}, θ = {roundNumber(polar.angle, 1)}°
      </p>
    </div>
  );
}

function VectorExplanationPanel({ operation }: { operation: OperationMode }) {
  const operationText =
    operation === "add"
      ? "C = nA·A + nB·B"
      : operation === "subtract"
        ? "C = nA·A - nB·B"
        : "A + B + C = 0 буюу C = -(nA·A + nB·B)";
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
        Сургалтын тайлбар
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Вектор гэж юу вэ?</h2>
      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <EduCard title="Вектор" body="Вектор нь хэмжээ ба чиглэлтэй хэмжигдэхүүн. Жишээ нь шилжилт, хүч, хурд." />
        <EduCard title="Бүрэлдэхүүн" body="x бүрэлдэхүүн нь хэвтээ, y бүрэлдэхүүн нь босоо чиглэлийн хувь нэмэр юм." />
        <EduCard title="Нэмэх/хасах/тэнцвэр" body={`Энэ lab дээр ${operationText}. x-үүдийг тусад нь, y-үүдийг тусад нь бодно.`} />
        <EduCard title="Өнцөг" body="Өнцгийг эерэг x-тэнхлэгээс цагийн зүүний эсрэг чиглэлд хэмжинэ." />
      </div>
    </section>
  );
}

function EduCard({ title, body }: { title: string; body: string }) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </article>
  );
}

function VectorAIPanel({
  aiText,
  onRun,
}: {
  aiText: string;
  onRun: (mode: AiMode) => void;
}) {
  return (
    <section className="rounded-[2rem] border border-cyan-200 bg-cyan-50/60 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-700">
        AI-ready panel
      </p>
      <h2 className="mt-2 text-2xl font-semibold">Ирээдүйн AI туслах</h2>
      <div className="mt-4 grid gap-2">
        <button onClick={() => onRun("explain")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800">
          Одоо юу болж байгааг тайлбарла
        </button>
        <button onClick={() => onRun("hint")} className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-cyan-400">
          Hint өг
        </button>
        <button onClick={() => onRun("exercise")} className="rounded-2xl border border-cyan-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:border-cyan-400">
          Дасгал үүсгэ
        </button>
      </div>
      <p className="mt-4 rounded-3xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">
        {aiText}
      </p>
    </section>
  );
}
