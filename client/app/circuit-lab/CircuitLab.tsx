"use client";

import Link from "next/link";
import { MouseEvent, PointerEvent, RefObject, useMemo, useRef, useState } from "react";
import {
  calculateCurrent,
  calculateTotalResistance,
  getBulbBrightness,
  isCircuitClosed,
  splitTerminalKey,
  terminalKey,
  type CircuitPart,
  type CircuitPartType,
  type CircuitTerminalId,
  type CircuitWire,
} from "../../lib/circuitMath";

type DragState = {
  id: string;
  offsetX: number;
  offsetY: number;
} | null;

type PresetKey = "closed" | "open" | "high" | "low";
type AiMode = "why" | "explain" | "hint" | "exercise";

const BOARD_WIDTH = 1180;
const BOARD_HEIGHT = 680;

const palette: { type: CircuitPartType; label: string; description: string }[] = [
  { type: "battery", label: "Battery", description: "Хүчдэл өгнө" },
  { type: "wire", label: "Wire", description: "Холбох зам" },
  { type: "resistor", label: "Resistor", description: "Гүйдэл багасгана" },
  { type: "bulb", label: "Bulb", description: "Гүйдэлтэй үед асна" },
  { type: "switch", label: "Switch", description: "Нээж/хаана" },
];

const presetLabels: { key: PresetKey; label: string }[] = [
  { key: "closed", label: "Basic closed circuit" },
  { key: "open", label: "Open switch circuit" },
  { key: "high", label: "High resistance circuit" },
  { key: "low", label: "Low resistance circuit" },
];

function makePart(
  id: string,
  type: CircuitPartType,
  x: number,
  y: number,
  rotation: CircuitPart["rotation"] = 0,
  closed = true,
): CircuitPart {
  return { id, type, x, y, rotation, closed };
}

function buildPreset(key: PresetKey): {
  parts: CircuitPart[];
  wires: CircuitWire[];
  voltage: number;
  resistance: number;
} {
  const switchClosed = key !== "open";
  const parts = [
    makePart("battery-1", "battery", 210, 430, 90),
    makePart("switch-1", "switch", 475, 430, 0, switchClosed),
    makePart("resistor-1", "resistor", 620, 245, 90),
    makePart("bulb-1", "bulb", 815, 245),
    makePart("wire-1", "wire", 985, 430),
  ];
  const wires = [
    { id: "wire-a", from: terminalKey("battery-1", "a"), to: terminalKey("switch-1", "a") },
    { id: "wire-b", from: terminalKey("switch-1", "b"), to: terminalKey("resistor-1", "a") },
    { id: "wire-c", from: terminalKey("resistor-1", "b"), to: terminalKey("bulb-1", "a") },
    { id: "wire-d", from: terminalKey("bulb-1", "b"), to: terminalKey("wire-1", "b") },
    { id: "wire-e", from: terminalKey("wire-1", "a"), to: terminalKey("battery-1", "b") },
  ];

  if (key === "high") {
    return { parts, wires, voltage: 9, resistance: 9 };
  }
  if (key === "low") {
    return { parts, wires, voltage: 9, resistance: 2 };
  }
  return { parts, wires, voltage: 9, resistance: 4 };
}

export function CircuitLab() {
  const initial = buildPreset("closed");
  const [parts, setParts] = useState<CircuitPart[]>(initial.parts);
  const [wires, setWires] = useState<CircuitWire[]>(initial.wires);
  const [voltage, setVoltage] = useState(initial.voltage);
  const [baseResistance, setBaseResistance] = useState(initial.resistance);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [selectedPartId, setSelectedPartId] = useState<string | null>(null);
  const [selectedTerminal, setSelectedTerminal] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>(null);
  const [aiText, setAiText] = useState(
    "Энд AI-ready mock туслах ажиллана. Одоогоор бүх тайлбар local state дээр үндэслэнэ.",
  );
  const svgRef = useRef<SVGSVGElement | null>(null);

  const totalResistance = useMemo(
    () => calculateTotalResistance(parts, baseResistance),
    [parts, baseResistance],
  );
  const closed = useMemo(() => isCircuitClosed(parts, wires), [parts, wires]);
  const current = closed ? calculateCurrent(voltage, totalResistance) : 0;
  const brightness = getBulbBrightness(current);
  const batteryCount = parts.filter((part) => part.type === "battery").length;
  const bulbCount = parts.filter((part) => part.type === "bulb").length;

  function addPart(type: CircuitPartType) {
    const id = `${type}-${Date.now()}`;
    const x = 250 + ((parts.length * 54) % 260);
    const y = 235 + ((parts.length * 38) % 170);
    setParts((currentParts) => [...currentParts, makePart(id, type, x, y, 0, type !== "switch")]);
    setSelectedPartId(id);
    setSelectedTerminal(null);
  }

  function applyPreset(key: PresetKey) {
    const preset = buildPreset(key);
    setParts(preset.parts);
    setWires(preset.wires);
    setVoltage(preset.voltage);
    setBaseResistance(preset.resistance);
    setSelectedPartId(null);
    setSelectedTerminal(null);
    setAiText(`${presetLabels.find((presetLabel) => presetLabel.key === key)?.label} preset сонгогдлоо.`);
  }

  function resetBoard() {
    setParts([]);
    setWires([]);
    setVoltage(9);
    setBaseResistance(4);
    setSelectedPartId(null);
    setSelectedTerminal(null);
    setAiText("Самбар цэвэрлэгдлээ. Эхлээд battery, resistor, bulb, switch нэмээд terminal-уудыг холбоорой.");
  }

  function rotateSelected() {
    if (!selectedPartId) {
      return;
    }
    setParts((currentParts) =>
      currentParts.map((part) =>
        part.id === selectedPartId
          ? { ...part, rotation: (((part.rotation + 90) % 360) as CircuitPart["rotation"]) }
          : part,
      ),
    );
  }

  function deleteSelected() {
    if (!selectedPartId) {
      return;
    }
    setParts((currentParts) => currentParts.filter((part) => part.id !== selectedPartId));
    setWires((currentWires) =>
      currentWires.filter((wire) => !wire.from.startsWith(`${selectedPartId}:`) && !wire.to.startsWith(`${selectedPartId}:`)),
    );
    setSelectedPartId(null);
    setSelectedTerminal(null);
  }

  function toggleSwitch(partId: string) {
    setParts((currentParts) =>
      currentParts.map((part) => (part.id === partId ? { ...part, closed: !part.closed } : part)),
    );
  }

  function handleTerminalClick(partId: string, terminalId: CircuitTerminalId) {
    const nextTerminal = terminalKey(partId, terminalId);
    setSelectedPartId(partId);
    if (!selectedTerminal) {
      setSelectedTerminal(nextTerminal);
      return;
    }
    if (selectedTerminal === nextTerminal) {
      setSelectedTerminal(null);
      return;
    }
    const alreadyExists = wires.some(
      (wire) =>
        (wire.from === selectedTerminal && wire.to === nextTerminal) ||
        (wire.from === nextTerminal && wire.to === selectedTerminal),
    );
    if (!alreadyExists) {
      setWires((currentWires) => [
        ...currentWires,
        { id: `connection-${Date.now()}`, from: selectedTerminal, to: nextTerminal },
      ]);
    }
    setSelectedTerminal(null);
  }

  function startDrag(part: CircuitPart, event: PointerEvent<SVGGElement>) {
    if (!svgRef.current) {
      return;
    }
    const point = getBoardPoint(event);
    setSelectedPartId(part.id);
    setDragState({ id: part.id, offsetX: point.x - part.x, offsetY: point.y - part.y });
  }

  function getBoardPoint(event: PointerEvent<SVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }
    return {
      x: ((event.clientX - rect.left) / rect.width) * BOARD_WIDTH,
      y: ((event.clientY - rect.top) / rect.height) * BOARD_HEIGHT,
    };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    if (!dragState) {
      return;
    }
    const point = getBoardPoint(event);
    setParts((currentParts) =>
      currentParts.map((part) =>
        part.id === dragState.id
          ? {
              ...part,
              x: Math.max(72, Math.min(BOARD_WIDTH - 72, point.x - dragState.offsetX)),
              y: Math.max(62, Math.min(BOARD_HEIGHT - 62, point.y - dragState.offsetY)),
            }
          : part,
      ),
    );
  }

  function runMockAi(mode: AiMode) {
    if (mode === "exercise") {
      setAiText("Дасгал: 9V battery болон 3Ω resistor ашиглан 3A гүйдэлтэй хэлхээ угсар. Switch хаалттай байх ёстой.");
      return;
    }
    if (mode === "hint") {
      setAiText(
        closed
          ? `Hint: одоо хэлхээ хаалттай байна. Resistance slider-ийг өсгөхөд I = U / R тул гүйдэл багасна.`
          : "Hint: battery-ийн + terminal-аас эхлээд бүх эд ангиар дамжин battery-ийн - terminal руу буцах тасралтгүй зам байгаа эсэхийг шалга.",
      );
      return;
    }
    if (!closed) {
      setAiText("Хэлхээ нээлттэй байна. Battery-ийн хоёр туйл хооронд битүү зам үүсээгүй тул гүйдэл урсахгүй.");
      return;
    }
    setAiText(
      `Хэлхээ хаалттай байна. Battery-ийн нэмэх туйлаас гүйдэл гарч, эд ангиудаар дамжаад хасах туйл руу буцаж байна. Ом-ын хуулиар I = U / R = ${voltage}V / ${totalResistance.toFixed(1)}Ω = ${current.toFixed(2)}A.`,
    );
  }

  return (
    <main className="min-h-screen bg-[#94bff5] text-slate-950">
      <section className="grid min-h-screen grid-rows-[1fr_auto]">
        <div className="grid min-h-[720px] gap-4 p-4 lg:grid-cols-[150px_1fr_330px]">
          <aside className="space-y-3">
            <Link
              href="/"
              className="flex h-12 items-center justify-center rounded-xl border-2 border-slate-900 bg-white text-sm font-black text-slate-900 shadow-[0_3px_0_rgba(15,23,42,0.22)]"
            >
              Буцах
            </Link>
            <CircuitPalette onAdd={addPart} />
          </aside>

          <CircuitBoard
            parts={parts}
            wires={wires}
            closed={closed}
            brightness={brightness}
            showCurrent={showCurrent}
            showLabels={showLabels}
            selectedPartId={selectedPartId}
            selectedTerminal={selectedTerminal}
            svgRef={svgRef}
            onPointerMove={handlePointerMove}
            onPointerUp={() => setDragState(null)}
            onPartDragStart={startDrag}
            onTerminalClick={handleTerminalClick}
            onSwitchToggle={toggleSwitch}
          />

          <aside className="space-y-3">
            <CircuitControls
              voltage={voltage}
              resistance={baseResistance}
              showCurrent={showCurrent}
              showLabels={showLabels}
              hasSelection={Boolean(selectedPartId)}
              onVoltageChange={setVoltage}
              onResistanceChange={setBaseResistance}
              onShowCurrentChange={setShowCurrent}
              onShowLabelsChange={setShowLabels}
              onRotate={rotateSelected}
              onDelete={deleteSelected}
              onReset={resetBoard}
              onPreset={applyPreset}
            />
            <CircuitValuesPanel
              voltage={voltage}
              resistance={totalResistance}
              current={current}
              closed={closed}
              batteryCount={batteryCount}
              bulbCount={bulbCount}
            />
            <CircuitAIPanel aiText={aiText} onRun={runMockAi} />
          </aside>
        </div>

        <div className="border-t-2 border-slate-950 bg-slate-950 px-5 py-3 text-white">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-black">Circuit Construction Lab: DC</p>
              <p className="text-sm text-slate-300">
                {closed ? "Tap circuit element to edit. Current is flowing." : "Tap terminals to connect a complete path."}
              </p>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-black ${closed ? "bg-emerald-400 text-slate-950" : "bg-amber-300 text-slate-950"}`}>
              {closed ? "Closed circuit" : "Open circuit"}
            </div>
          </div>
        </div>

        <div className="bg-[#f7f9fc] p-4">
          <CircuitExplanationPanel />
        </div>
      </section>
    </main>
  );
}

function CircuitPalette({ onAdd }: { onAdd: (type: CircuitPartType) => void }) {
  return (
    <section className="overflow-hidden rounded-xl border-2 border-slate-950 bg-[#eeeeee] shadow-[0_3px_0_rgba(15,23,42,0.25)]">
      <div className="flex h-11 items-center justify-center border-b border-slate-400 bg-[#dddddd]">
        <span className="h-4 w-4 rotate-45 border-l-4 border-t-4 border-slate-950" />
      </div>
      <div className="grid">
        {palette.map((item) => (
          <button
            key={item.type}
            type="button"
            onClick={() => onAdd(item.type)}
            className="flex min-h-[112px] flex-col items-center justify-center gap-2 border-b border-slate-300 bg-[#f5f5f5] px-2 py-3 text-center hover:bg-white"
          >
            <PaletteIcon type={item.type} />
            <span>
              <span className="block text-lg font-semibold text-slate-950">{item.label}</span>
              <span className="text-xs text-slate-600">{item.description}</span>
            </span>
          </button>
        ))}
      </div>
      <div className="flex h-11 items-center justify-center bg-[#dddddd]">
        <span className="h-4 w-4 rotate-[225deg] border-l-4 border-t-4 border-slate-950" />
      </div>
    </section>
  );
}

function CircuitControls({
  voltage,
  resistance,
  showCurrent,
  showLabels,
  hasSelection,
  onVoltageChange,
  onResistanceChange,
  onShowCurrentChange,
  onShowLabelsChange,
  onRotate,
  onDelete,
  onReset,
  onPreset,
}: {
  voltage: number;
  resistance: number;
  showCurrent: boolean;
  showLabels: boolean;
  hasSelection: boolean;
  onVoltageChange: (value: number) => void;
  onResistanceChange: (value: number) => void;
  onShowCurrentChange: (value: boolean) => void;
  onShowLabelsChange: (value: boolean) => void;
  onRotate: () => void;
  onDelete: () => void;
  onReset: () => void;
  onPreset: (key: PresetKey) => void;
}) {
  return (
    <section className="rounded-xl border-2 border-slate-950 bg-[#f2f2f2] p-4 shadow-[0_3px_0_rgba(15,23,42,0.25)]">
      <h2 className="text-xl font-semibold">Удирдлага</h2>
      <div className="mt-4 space-y-4">
        <RangeControl label="Voltage U" suffix="V" min={1} max={12} step={1} value={voltage} onChange={onVoltageChange} />
        <RangeControl label="Resistance R" suffix="Ω" min={1} max={12} step={0.5} value={resistance} onChange={onResistanceChange} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Toggle label="Current" checked={showCurrent} onChange={onShowCurrentChange} />
        <Toggle label="Labels" checked={showLabels} onChange={onShowLabelsChange} />
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onRotate}
          className="h-11 rounded-xl border-2 border-slate-300 bg-white text-sm font-bold text-slate-700 disabled:opacity-40"
        >
          Rotate
        </button>
        <button
          type="button"
          disabled={!hasSelection}
          onClick={onDelete}
          className="h-11 rounded-xl border-2 border-rose-300 bg-rose-50 text-sm font-bold text-rose-700 disabled:opacity-40"
        >
          Delete
        </button>
      </div>
      <div className="mt-4 grid gap-2">
        {presetLabels.map((preset) => (
          <button
            key={preset.key}
            type="button"
            onClick={() => onPreset(preset.key)}
            className="rounded-xl border-2 border-slate-300 bg-white px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:border-sky-500 hover:bg-sky-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 h-11 w-full rounded-xl bg-slate-950 text-sm font-bold text-white hover:bg-slate-800"
      >
        Reset board
      </button>
    </section>
  );
}

function CircuitBoard({
  parts,
  wires,
  closed,
  brightness,
  showCurrent,
  showLabels,
  selectedPartId,
  selectedTerminal,
  svgRef,
  onPointerMove,
  onPointerUp,
  onPartDragStart,
  onTerminalClick,
  onSwitchToggle,
}: {
  parts: CircuitPart[];
  wires: CircuitWire[];
  closed: boolean;
  brightness: number;
  showCurrent: boolean;
  showLabels: boolean;
  selectedPartId: string | null;
  selectedTerminal: string | null;
  svgRef: RefObject<SVGSVGElement | null>;
  onPointerMove: (event: PointerEvent<SVGSVGElement>) => void;
  onPointerUp: () => void;
  onPartDragStart: (part: CircuitPart, event: PointerEvent<SVGGElement>) => void;
  onTerminalClick: (partId: string, terminalId: CircuitTerminalId) => void;
  onSwitchToggle: (partId: string) => void;
}) {
  const partMap = new Map(parts.map((part) => [part.id, part]));

  return (
    <section className="min-h-[720px]">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 px-2">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-900">Circuit board</p>
          <p className="mt-1 text-sm font-semibold text-slate-800">Terminal дээр дараад дараагийн terminal дээр дарвал wire үүснэ.</p>
        </div>
        <div className="rounded-lg border-2 border-slate-900 bg-white px-4 py-2 text-xs font-black text-slate-900">
          {selectedTerminal ? "Terminal сонгогдсон" : "Terminal сонгоно уу"}
        </div>
      </div>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
        className="h-[74vh] min-h-[640px] w-full touch-none select-none rounded-xl border-2 border-slate-900 bg-[#94bff5]"
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <style>
          {`
            @keyframes circuitDash {
              from { stroke-dashoffset: 0; }
              to { stroke-dashoffset: -28; }
            }
            @keyframes currentPulse {
              0%, 100% { opacity: .45; transform: scale(1); }
              50% { opacity: 1; transform: scale(1.18); }
            }
          `}
        </style>
        <defs>
          <filter id="bulbGlow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <BoardGrid />
        <WireLayer wires={wires} partMap={partMap} closed={closed} showCurrent={showCurrent} />
        {parts.map((part) => (
          <CircuitPartNode
            key={part.id}
            part={part}
            selected={selectedPartId === part.id}
            selectedTerminal={selectedTerminal}
            brightness={part.type === "bulb" ? brightness : 0}
            showLabels={showLabels}
            onDragStart={onPartDragStart}
            onTerminalClick={onTerminalClick}
            onSwitchToggle={onSwitchToggle}
          />
        ))}
      </svg>
    </section>
  );
}

function WireLayer({
  wires,
  partMap,
  closed,
  showCurrent,
}: {
  wires: CircuitWire[];
  partMap: Map<string, CircuitPart>;
  closed: boolean;
  showCurrent: boolean;
}) {
  return (
    <g>
      {wires.map((wire) => {
        const from = getTerminalPosition(partMap.get(splitTerminalKey(wire.from).partId), splitTerminalKey(wire.from).terminalId);
        const to = getTerminalPosition(partMap.get(splitTerminalKey(wire.to).partId), splitTerminalKey(wire.to).terminalId);
        if (!from || !to) {
          return null;
        }
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        const path = `M ${from.x} ${from.y} Q ${midX} ${midY - 22} ${to.x} ${to.y}`;
        const pathId = `wire-path-${wire.id}`;
        return (
          <g key={wire.id}>
            <path id={pathId} d={path} fill="none" stroke="#2b1b13" strokeWidth={11} strokeLinecap="round" />
            <path d={path} fill="none" stroke="#b45309" strokeWidth={7} strokeLinecap="round" />
            <path d={path} fill="none" stroke="#fed7aa" strokeWidth={3} strokeLinecap="round" opacity={0.7} />
            {closed && showCurrent && (
              <>
                <path
                  d={path}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth={3}
                  strokeLinecap="round"
                  strokeDasharray="1 18"
                  style={{ animation: "circuitDash 900ms linear infinite" }}
                />
                {[0, 0.33, 0.66].map((delay) => (
                  <g key={`${wire.id}-${delay}`}>
                    <circle r="10" fill="#38bdf8" stroke="#075985" strokeWidth="2">
                      <animateMotion dur="2.1s" begin={`${delay}s`} repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </circle>
                    <text textAnchor="middle" y="5" fill="#ffffff" fontSize="14" fontWeight="900">
                      −
                      <animateMotion dur="2.1s" begin={`${delay}s`} repeatCount="indefinite">
                        <mpath href={`#${pathId}`} />
                      </animateMotion>
                    </text>
                  </g>
                ))}
              </>
            )}
          </g>
        );
      })}
    </g>
  );
}

function CircuitPartNode({
  part,
  selected,
  selectedTerminal,
  brightness,
  showLabels,
  onDragStart,
  onTerminalClick,
  onSwitchToggle,
}: {
  part: CircuitPart;
  selected: boolean;
  selectedTerminal: string | null;
  brightness: number;
  showLabels: boolean;
  onDragStart: (part: CircuitPart, event: PointerEvent<SVGGElement>) => void;
  onTerminalClick: (partId: string, terminalId: CircuitTerminalId) => void;
  onSwitchToggle: (partId: string) => void;
}) {
  const terminalA = getTerminalPosition(part, "a");
  const terminalB = getTerminalPosition(part, "b");

  return (
    <g
      transform={`translate(${part.x} ${part.y}) rotate(${part.rotation})`}
      onPointerDown={(event) => onDragStart(part, event)}
      className="cursor-grab"
    >
      <rect x="-76" y="-58" width="152" height="116" rx="18" fill="transparent" />
      <rect
        x="-72"
        y="-54"
        width="144"
        height="108"
        rx="20"
        fill="none"
        stroke={selected ? "#ef4444" : "transparent"}
        strokeWidth={3}
        strokeDasharray="9 8"
      />
      <PartDrawing part={part} brightness={brightness} onSwitchToggle={onSwitchToggle} />
      {showLabels && (
        <text x="0" y="76" textAnchor="middle" fill="#0f172a" fontSize="18" fontWeight="800" paintOrder="stroke" stroke="#bfdbfe" strokeWidth="4">
          {partLabel(part)}
        </text>
      )}
      {terminalA && (
        <TerminalDot
          x={-52}
          y={0}
          active={selectedTerminal === terminalKey(part.id, "a")}
          onClick={(event) => {
            event.stopPropagation();
            onTerminalClick(part.id, "a");
          }}
        />
      )}
      {terminalB && (
        <TerminalDot
          x={52}
          y={0}
          active={selectedTerminal === terminalKey(part.id, "b")}
          onClick={(event) => {
            event.stopPropagation();
            onTerminalClick(part.id, "b");
          }}
        />
      )}
    </g>
  );
}

function PartDrawing({
  part,
  brightness,
  onSwitchToggle,
}: {
  part: CircuitPart;
  brightness: number;
  onSwitchToggle: (partId: string) => void;
}) {
  if (part.type === "battery") {
    return (
      <g>
        <line x1="-58" y1="0" x2="-34" y2="0" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
        <line x1="34" y1="0" x2="58" y2="0" stroke="#111827" strokeWidth="8" strokeLinecap="round" />
        <rect x="-34" y="-22" width="68" height="44" rx="8" fill="#f59e0b" stroke="#111827" strokeWidth="4" />
        <rect x="-28" y="-16" width="56" height="32" rx="5" fill="#fbbf24" />
        <rect x="-14" y="-28" width="28" height="8" rx="2" fill="#111827" />
        <text x="-20" y="7" fill="#111827" fontSize="20" fontWeight="900">+</text>
        <text x="14" y="7" fill="#111827" fontSize="20" fontWeight="900">−</text>
      </g>
    );
  }
  if (part.type === "resistor") {
    return (
      <g>
        <line x1="-58" y1="0" x2="-38" y2="0" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <line x1="38" y1="0" x2="58" y2="0" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <rect x="-38" y="-16" width="76" height="32" rx="12" fill="#d6a35d" stroke="#111827" strokeWidth="3" />
        <rect x="-25" y="-16" width="7" height="32" fill="#111827" opacity="0.75" />
        <rect x="-7" y="-16" width="7" height="32" fill="#7c2d12" opacity="0.9" />
        <rect x="12" y="-16" width="7" height="32" fill="#facc15" opacity="0.9" />
      </g>
    );
  }
  if (part.type === "bulb") {
    const glowOpacity = 0.18 + brightness * 0.7;
    return (
      <g>
        <circle cx="0" cy="-18" r="42" fill={brightness > 0 ? "#fde047" : "#dbeafe"} opacity={brightness > 0 ? glowOpacity : 0.42} filter={brightness > 0 ? "url(#bulbGlow)" : undefined} />
        <path d="M -35 -14 C -35 -48 35 -48 35 -14 C 35 8 20 22 11 31 L -11 31 C -20 22 -35 8 -35 -14 Z" fill={brightness > 0 ? "#fde68a" : "#bfdbfe"} stroke="#111827" strokeWidth="3" />
        <path d="M -12 8 Q 0 -14 12 8" fill="none" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
        <rect x="-20" y="28" width="40" height="24" rx="6" fill="#9ca3af" stroke="#111827" strokeWidth="3" />
        <rect x="-23" y="48" width="46" height="13" rx="4" fill="#64748b" stroke="#111827" strokeWidth="3" />
        <line x1="-58" y1="0" x2="-35" y2="0" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <line x1="35" y1="0" x2="58" y2="0" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
      </g>
    );
  }
  if (part.type === "switch") {
    return (
      <g
        onDoubleClick={(event) => {
          event.stopPropagation();
          onSwitchToggle(part.id);
        }}
      >
        <line x1="-58" y1="0" x2="-26" y2="0" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <line x1="26" y1="0" x2="58" y2="0" stroke="#111827" strokeWidth="7" strokeLinecap="round" />
        <circle cx="-24" cy="0" r="8" fill="#111827" />
        <circle cx="24" cy="0" r="8" fill="#111827" />
        <line
          x1="-24"
          y1="0"
          x2={part.closed ? 24 : 16}
          y2={part.closed ? 0 : -24}
          stroke={part.closed ? "#16a34a" : "#f97316"}
          strokeWidth="7"
          strokeLinecap="round"
        />
        <text x="0" y="-35" textAnchor="middle" fill={part.closed ? "#14532d" : "#7c2d12"} fontSize="14" fontWeight="900" paintOrder="stroke" stroke="#bfdbfe" strokeWidth="4">
          {part.closed ? "closed" : "open"}
        </text>
      </g>
    );
  }
  return (
    <g>
      <line x1="-58" y1="0" x2="58" y2="0" stroke="#7f1d1d" strokeWidth="12" strokeLinecap="round" />
      <line x1="-54" y1="-2" x2="54" y2="-2" stroke="#fca5a5" strokeWidth="5" strokeLinecap="round" opacity="0.75" />
    </g>
  );
}

function TerminalDot({
  x,
  y,
  active,
  onClick,
}: {
  x: number;
  y: number;
  active: boolean;
  onClick: (event: MouseEvent<SVGCircleElement>) => void;
}) {
  return (
    <circle
      cx={x}
      cy={y}
      r={active ? 9 : 7}
      fill={active ? "#0284c7" : "#ffffff"}
      stroke="#0284c7"
      strokeWidth="3"
      className="cursor-crosshair"
      onClick={onClick}
    />
  );
}

function BoardGrid() {
  const lines = [];
  for (let x = 20; x < BOARD_WIDTH; x += 32) {
    lines.push(<line key={`x-${x}`} x1={x} y1={0} x2={x} y2={BOARD_HEIGHT} stroke="#dbeafe" />);
  }
  for (let y = 20; y < BOARD_HEIGHT; y += 32) {
    lines.push(<line key={`y-${y}`} x1={0} y1={y} x2={BOARD_WIDTH} y2={y} stroke="#dbeafe" />);
  }
  return <g opacity="0.72">{lines}</g>;
}

function CircuitValuesPanel({
  voltage,
  resistance,
  current,
  closed,
  batteryCount,
  bulbCount,
}: {
  voltage: number;
  resistance: number;
  current: number;
  closed: boolean;
  batteryCount: number;
  bulbCount: number;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="text-xl font-semibold">Утгын самбар</h2>
      <div className="mt-4 grid gap-3">
        <Metric label="Voltage U" value={`${voltage.toFixed(0)} V`} />
        <Metric label="Resistance R" value={`${resistance.toFixed(1)} Ω`} />
        <Metric label="Current I" value={`${current.toFixed(2)} A`} />
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-3">
          <p className="text-sm font-bold text-sky-800">Ohm-ийн хууль</p>
          <p className="mt-1 font-mono text-lg font-black text-slate-950">U = I × R</p>
          <p className="font-mono text-sm font-semibold text-slate-700">I = U / R</p>
        </div>
        <div className={`rounded-2xl border p-3 ${closed ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <p className={`text-sm font-bold ${closed ? "text-emerald-700" : "text-amber-800"}`}>
            Circuit status: {closed ? "closed" : "open"}
          </p>
          <p className="mt-1 text-sm text-slate-700">
            Battery: {batteryCount}, Bulb: {bulbCount}
          </p>
        </div>
      </div>
    </section>
  );
}

function CircuitAIPanel({ aiText, onRun }: { aiText: string; onRun: (mode: AiMode) => void }) {
  return (
    <section className="rounded-[2rem] border border-sky-200 bg-sky-50/70 p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-sky-700">AI-ready panel</p>
      <h2 className="mt-2 text-2xl font-semibold">Local mock туслах</h2>
      <div className="mt-4 grid gap-2">
        <button onClick={() => onRun("why")} className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white">
          Яагаад асахгүй байна?
        </button>
        <button onClick={() => onRun("explain")} className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
          Одоогийн хэлхээг тайлбарла
        </button>
        <button onClick={() => onRun("hint")} className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
          Hint өг
        </button>
        <button onClick={() => onRun("exercise")} className="rounded-2xl border border-sky-200 bg-white px-4 py-3 text-sm font-bold text-slate-700">
          Дасгал үүсгэ
        </button>
      </div>
      <p className="mt-4 rounded-3xl border border-sky-200 bg-white p-4 text-sm leading-6 text-slate-700 shadow-sm">{aiText}</p>
    </section>
  );
}

function CircuitExplanationPanel() {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Сургалтын тайлбар</p>
      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <EduCard title="Battery" body="Battery нь хэлхээнд voltage буюу потенциалын ялгаа өгдөг." />
        <EduCard title="Битүү хэлхээ" body="Гүйдэл зөвхөн battery-ийн хоёр туйл хооронд тасралтгүй зам байхад урсана." />
        <EduCard title="Resistor" body="Resistor нь гүйдлийг багасгана. R ихсэхэд I багасна." />
        <EduCard title="Bulb" body="Bulb дундуур гүйдэл урсах үед гэрэлтэнэ. Нээлттэй хэлхээнд асахгүй." />
        <EduCard title="Ohm-ийн хууль" body="U = I × R, мөн I = U / R. Voltage өсвөл гүйдэл өсөж, resistance өсвөл гүйдэл багасна." />
      </div>
    </section>
  );
}

function RangeControl({
  label,
  suffix,
  min,
  max,
  step,
  value,
  onChange,
}: {
  label: string;
  suffix: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="block rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-bold text-slate-700">{label}</span>
        <span className="rounded-full bg-white px-2 py-1 font-mono text-sm font-semibold text-slate-950 shadow-sm">
          {value}
          {suffix}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-sky-500"
      />
    </label>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="accent-slate-950" />
      {label}
    </label>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-1 font-mono text-2xl font-black text-slate-950">{value}</p>
    </div>
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

function PaletteIcon({ type }: { type: CircuitPartType }) {
  return (
    <svg viewBox="0 0 64 44" className="h-11 w-16 shrink-0 rounded-2xl bg-white p-2 shadow-sm">
      <g transform="translate(32 22) scale(0.5)">
        <PartDrawing part={makePart("icon", type, 0, 0, 0, true)} brightness={type === "bulb" ? 0.7 : 0} onSwitchToggle={() => undefined} />
      </g>
    </svg>
  );
}

function getTerminalPosition(part: CircuitPart | undefined, terminal: CircuitTerminalId) {
  if (!part) {
    return null;
  }
  const localX = terminal === "a" ? -52 : 52;
  const localY = 0;
  const radians = (part.rotation * Math.PI) / 180;
  return {
    x: part.x + localX * Math.cos(radians) - localY * Math.sin(radians),
    y: part.y + localX * Math.sin(radians) + localY * Math.cos(radians),
  };
}

function partLabel(part: CircuitPart) {
  if (part.type === "switch") {
    return part.closed ? "Switch closed" : "Switch open";
  }
  return part.type.charAt(0).toUpperCase() + part.type.slice(1);
}
