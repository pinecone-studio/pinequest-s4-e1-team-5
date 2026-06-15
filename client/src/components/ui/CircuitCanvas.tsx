import { useEffect, useRef, useState, type MouseEvent } from 'react';

type CircuitComponentType =
  | 'WIRE'
  | 'BATTERY'
  | 'AC_VOLTAGE'
  | 'LIGHTBULB'
  | 'RESISTOR'
  | 'CAPACITOR'
  | 'INDUCTOR'
  | 'SWITCH'
  | 'VOLTMETER'
  | 'AMMETER';

interface CircuitComponent {
  id: string;
  type: CircuitComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
}

type TerminalKey = 'a' | 'b';

interface WireEndpoint {
  componentId: string;
  terminal: TerminalKey;
}

interface CircuitWire {
  id: string;
  from: WireEndpoint;
  to: WireEndpoint;
}

interface CircuitState {
  components: CircuitComponent[];
  wires: CircuitWire[];
  switchStates: Record<string, boolean>;
}

interface CanvasSize {
  width: number;
  height: number;
}

interface DragState {
  id: string;
  offsetX: number;
  offsetY: number;
}

interface SourceDragState {
  type: CircuitComponentType;
}

interface WireDragState {
  from: WireEndpoint;
  point: Point;
}

interface Point {
  x: number;
  y: number;
}

const GRID = 24;
const TOOLBAR_H = 54;
const MAX_HISTORY = 60;

// ─── Paper/sketch palette ─────────────────────────────────────────────────────
const INK = '#2a2218';
const INK_SOFT = '#5a4a3a';
const PAPER = '#f9f6ef';
const PAPER_DARK = '#f0ebe0';
const PAPER_MID = '#e8e2d4';
const SEPIA = '#6b3a1f';
const COPPER_DARK = '#6f2a1c';
const COPPER_MID = '#d28a70';
const FONT_SKETCH = "'Cabin Sketch', 'Caveat', cursive, system-ui, sans-serif";

const shelfItems = [
  { label: 'Wire', type: 'WIRE' },
  { label: 'Battery', type: 'BATTERY' },
  { label: 'AC Voltage', type: 'AC_VOLTAGE' },
  { label: 'Light Bulb', type: 'LIGHTBULB' },
  { label: 'Resistor', type: 'RESISTOR' },
  { label: 'Capacitor', type: 'CAPACITOR' },
  { label: 'Inductor', type: 'INDUCTOR' },
  { label: 'Switch', type: 'SWITCH' }
] satisfies Array<{ label: string; type: CircuitComponentType }>;

const componentSizes: Record<CircuitComponentType, { width: number; height: number }> = {
  WIRE: { width: 144, height: 24 },
  BATTERY: { width: 180, height: 62 },
  AC_VOLTAGE: { width: 118, height: 118 },
  LIGHTBULB: { width: 118, height: 142 },
  RESISTOR: { width: 144, height: 58 },
  CAPACITOR: { width: 120, height: 72 },
  INDUCTOR: { width: 144, height: 70 },
  SWITCH: { width: 144, height: 64 },
  VOLTMETER: { width: 132, height: 86 },
  AMMETER: { width: 132, height: 86 }
};

const SHELF_X = 16;
const SHELF_Y = TOOLBAR_H + 16;
const SHELF_W = 110;
const SHELF_ITEM_START_Y = SHELF_Y + 76;
const SHELF_ITEM_GAP = 66;
const DEL_BTN = 22;

function snapGrid(v: number) {
  return Math.round(v / GRID) * GRID;
}

function getControlPanelX(width: number) {
  return Math.max(width - 236, 520);
}

function createCircuitComponent(type: CircuitComponentType, id: string, x: number, y: number): CircuitComponent {
  const size = componentSizes[type];
  return { id, type, x, y, width: size.width, height: size.height };
}

function getComponentLabel(type: CircuitComponentType) {
  if (type === 'VOLTMETER') return 'Voltmeter';
  if (type === 'AMMETER') return 'Ammeter';
  return shelfItems.find((i) => i.type === type)?.label ?? type;
}

function createInitialComponents(width: number, height: number): CircuitComponent[] {
  const cx = width / 2;
  const cy = height / 2;
  return [
    createCircuitComponent('BATTERY', 'battery-1', snapGrid(cx - 210), snapGrid(cy - 40)),
    createCircuitComponent('LIGHTBULB', 'lightbulb-1', snapGrid(cx + 90), snapGrid(cy - 88))
  ];
}

function getInitialCanvasSize(): CanvasSize {
  if (typeof window === 'undefined') return { width: 1024, height: 768 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function getCanvasPoint(event: MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) {
  const rect = canvas.getBoundingClientRect();
  return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function insideComponent(px: number, py: number, c: CircuitComponent) {
  return px >= c.x && px <= c.x + c.width && py >= c.y && py <= c.y + c.height;
}

function insideRect(px: number, py: number, r: { x: number; y: number; width: number; height: number }) {
  return px >= r.x && px <= r.x + r.width && py >= r.y && py <= r.y + r.height;
}

function getTerminalPoints(c: CircuitComponent): Record<TerminalKey, Point> {
  const cy = c.y + c.height / 2;
  const cx = c.x + c.width / 2;

  if (c.type === 'LIGHTBULB') {
    return {
      a: { x: c.x + c.width * 0.2, y: c.y + c.height * 0.72 },
      b: { x: c.x + c.width * 0.8, y: c.y + c.height * 0.72 }
    };
  }
  if (c.type === 'AC_VOLTAGE') {
    return {
      a: { x: cx - 40, y: cy + 38 },
      b: { x: cx + 40, y: cy + 38 }
    };
  }
  return {
    a: { x: c.x, y: cy },
    b: { x: c.x + c.width, y: cy }
  };
}

function sameEndpoint(a: WireEndpoint, b: WireEndpoint) {
  return a.componentId === b.componentId && a.terminal === b.terminal;
}

function terminalAtPoint(px: number, py: number, components: CircuitComponent[]): WireEndpoint | null {
  for (const c of [...components].reverse()) {
    const terms = getTerminalPoints(c);
    const hit = (Object.keys(terms) as TerminalKey[]).find((t) => {
      const p = terms[t];
      return (px - p.x) ** 2 + (py - p.y) ** 2 <= 18 * 18;
    });
    if (hit) return { componentId: c.id, terminal: hit };
  }
  return null;
}

function getTerminalPoint(components: CircuitComponent[], ep: WireEndpoint): Point | null {
  const c = components.find((x) => x.id === ep.componentId);
  if (!c) return null;
  return getTerminalPoints(c)[ep.terminal];
}

function duplicateWire(wires: CircuitWire[], from: WireEndpoint, to: WireEndpoint) {
  return wires.some(
    (w) =>
      (sameEndpoint(w.from, from) && sameEndpoint(w.to, to)) ||
      (sameEndpoint(w.from, to) && sameEndpoint(w.to, from))
  );
}

function shelfItemAtPoint(px: number, py: number, canvasH: number): CircuitComponentType | null {
  const maxH = Math.min(canvasH - TOOLBAR_H - 80, 610);
  if (px < SHELF_X || px > SHELF_X + SHELF_W || py < SHELF_Y || py > SHELF_Y + maxH) return null;
  const item = shelfItems.find((_, i) => {
    const iy = SHELF_ITEM_START_Y + i * SHELF_ITEM_GAP;
    return py >= iy - 30 && py <= iy + 36;
  });
  return item?.type ?? null;
}

function meterAtPoint(px: number, py: number, canvasW: number): CircuitComponentType | null {
  const panelX = getControlPanelX(canvasW);
  if (insideRect(px, py, { x: panelX + 22, y: TOOLBAR_H + 228, width: 78, height: 102 })) return 'VOLTMETER';
  if (insideRect(px, py, { x: panelX + 118, y: TOOLBAR_H + 228, width: 78, height: 102 })) return 'AMMETER';
  return null;
}

function isSourceArea(px: number, py: number, size: CanvasSize) {
  const panelX = getControlPanelX(size.width);
  return (
    shelfItemAtPoint(px, py, size.height) !== null ||
    (px >= panelX && px <= panelX + 210 && py >= TOOLBAR_H && py <= TOOLBAR_H + 530)
  );
}

function deleteBounds(c: CircuitComponent) {
  return { x: c.x + c.width - DEL_BTN / 2, y: c.y - DEL_BTN / 2, width: DEL_BTN, height: DEL_BTN };
}

function makeId(type: CircuitComponentType) {
  return `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

// ─── Circuit analysis ─────────────────────────────────────────────────────────

function calculateCircuitValues(
  components: CircuitComponent[],
  wires: CircuitWire[],
  switchStates: Record<string, boolean>
) {
  const adj = new Map<string, Set<string>>();
  function addEdge(a: string, b: string) {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a)!.add(b);
    adj.get(b)!.add(a);
  }

  wires.forEach((w) => addEdge(`${w.from.componentId}:${w.from.terminal}`, `${w.to.componentId}:${w.to.terminal}`));

  components.forEach((c) => {
    if (c.type === 'SWITCH' && !switchStates[c.id]) return;
    if (c.type === 'CAPACITOR' || c.type === 'VOLTMETER') return;
    addEdge(`${c.id}:a`, `${c.id}:b`);
  });

  const source = components.find((c) => c.type === 'BATTERY' || c.type === 'AC_VOLTAGE');
  const voltage =
    components.filter((c) => c.type === 'BATTERY').length * 9 +
    components.filter((c) => c.type === 'AC_VOLTAGE').length * 6;

  if (!source || voltage === 0) {
    return { closedCircuit: false, current: 0, meterReadings: {} as Record<string, number>, voltage: 0 };
  }

  const startKey = `${source.id}:a`;
  const endKey = `${source.id}:b`;
  const visited = new Set<string>([startKey]);
  const queue = [startKey];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    if (cur === endKey) break;
    adj.get(cur)?.forEach((n) => { if (!visited.has(n)) { visited.add(n); queue.push(n); } });
  }

  const reachable = visited.has(endKey);
  const loadTypes = new Set(['LIGHTBULB', 'RESISTOR', 'INDUCTOR', 'AMMETER']);
  const hasLoad = components.some(
    (c) => loadTypes.has(c.type) && visited.has(`${c.id}:a`) && visited.has(`${c.id}:b`)
  );

  const closedCircuit = reachable && hasLoad;
  const resistance =
    components.filter((c) => c.type === 'LIGHTBULB').length * 8 +
    components.filter((c) => c.type === 'RESISTOR').length * 10 +
    components.filter((c) => c.type === 'INDUCTOR').length * 1.5 +
    components.filter((c) => c.type === 'SWITCH' && switchStates[c.id]).length * 0.5 +
    wires.length * 0.1 + 1;
  const current = closedCircuit ? voltage / resistance : 0;

  const meterReadings = components.reduce<Record<string, number>>((acc, c) => {
    if (c.type !== 'VOLTMETER' && c.type !== 'AMMETER') return acc;
    const wc = wires.filter((w) => w.from.componentId === c.id || w.to.componentId === c.id).length;
    if (c.type === 'AMMETER') return { ...acc, [c.id]: wc >= 2 && closedCircuit ? current : 0 };
    return { ...acc, [c.id]: wc >= 2 && voltage > 0 ? voltage : 0 };
  }, {});

  return { closedCircuit, current, meterReadings, voltage };
}

// ─── Draw helpers ─────────────────────────────────────────────────────────────

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function panel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, fill = PAPER, stroke = INK) {
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.1)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 6);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function checkbox(ctx: CanvasRenderingContext2D, x: number, y: number, checked: boolean, accent = SEPIA) {
  ctx.save();
  roundRect(ctx, x, y, 16, 16, 3);
  ctx.fillStyle = checked ? accent : 'rgba(0,0,0,0.06)';
  ctx.fill();
  ctx.strokeStyle = checked ? accent : `${INK}66`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (checked) {
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x + 3, y + 8);
    ctx.lineTo(x + 7, y + 12);
    ctx.lineTo(x + 13, y + 4);
    ctx.stroke();
  }
  ctx.restore();
}

function label(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color = INK, size = 14, align: CanvasTextAlign = 'left') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.font = `${size}px ${FONT_SKETCH}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y);
  ctx.restore();
}

// ─── Toolbar ──────────────────────────────────────────────────────────────────

function getToolbarButtons(width: number) {
  const cx = width / 2;
  return {
    undo: { x: cx - 120, y: 10, w: 80, h: 34, text: '↩ Undo' },
    redo: { x: cx - 30, y: 10, w: 80, h: 34, text: '↪ Redo' },
    clear: { x: cx + 60, y: 10, w: 80, h: 34, text: '🗑 Clear' }
  };
}

function drawToolbar(
  ctx: CanvasRenderingContext2D,
  size: CanvasSize,
  canUndo: boolean,
  canRedo: boolean,
  closedCircuit: boolean,
  current: number,
  voltage: number
) {
  ctx.save();
  const grad = ctx.createLinearGradient(0, 0, 0, TOOLBAR_H);
  grad.addColorStop(0, PAPER_MID);
  grad.addColorStop(1, PAPER_DARK);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size.width, TOOLBAR_H);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, TOOLBAR_H);
  ctx.lineTo(size.width, TOOLBAR_H);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.font = `bold 18px ${FONT_SKETCH}`;
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = SEPIA;
  ctx.fillText('⚡ Хэлхээний лаборатори', 16, TOOLBAR_H / 2);
  ctx.restore();

  const btns = getToolbarButtons(size.width);
  Object.entries(btns).forEach(([key, btn]) => {
    const active = key === 'undo' ? canUndo : key === 'redo' ? canRedo : true;
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.3;
    ctx.fillStyle = key === 'clear' ? '#f5e8e4' : PAPER;
    ctx.strokeStyle = key === 'clear' ? '#8B3a3a' : INK;
    ctx.lineWidth = 1.5;
    roundRect(ctx, btn.x, btn.y, btn.w, btn.h, 6);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = key === 'clear' ? '#8B3a3a' : INK;
    ctx.font = `13px ${FONT_SKETCH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(btn.text, btn.x + btn.w / 2, btn.y + btn.h / 2);
    ctx.restore();
  });

  const statusX = size.width - 260;
  const statusY = 10;
  const statusW = 240;
  const statusH = 34;

  ctx.save();
  if (closedCircuit) {
    ctx.fillStyle = 'rgba(50,120,50,0.15)';
    ctx.strokeStyle = '#4a8030';
  } else {
    ctx.fillStyle = 'rgba(140,100,20,0.12)';
    ctx.strokeStyle = '#8a6020';
  }
  ctx.lineWidth = 1.5;
  roundRect(ctx, statusX, statusY, statusW, statusH, 17);
  ctx.fill();
  ctx.stroke();

  if (closedCircuit) {
    ctx.fillStyle = '#1a4a1a';
    ctx.font = `bold 13px ${FONT_SKETCH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `● Хэлхээ ON  ${voltage.toFixed(0)}В  ${current.toFixed(2)}А  ${(voltage * current).toFixed(2)}Вт`,
      statusX + statusW / 2,
      statusY + statusH / 2
    );
  } else {
    ctx.fillStyle = '#4a3000';
    ctx.font = `bold 13px ${FONT_SKETCH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('○ Хэлхээ нээлттэй — холбоод унтраалга хааж', statusX + statusW / 2, statusY + statusH / 2);
  }
  ctx.restore();
}

// ─── Shelf ────────────────────────────────────────────────────────────────────

function drawShelfIcon(ctx: CanvasRenderingContext2D, lbl: string, x: number, y: number) {
  ctx.save();
  ctx.strokeStyle = INK;
  ctx.fillStyle = INK;
  ctx.lineWidth = 2;

  if (lbl === 'Wire') {
    const g = ctx.createLinearGradient(x - 24, y, x + 24, y);
    g.addColorStop(0, COPPER_DARK); g.addColorStop(0.5, COPPER_MID); g.addColorStop(1, COPPER_DARK);
    ctx.strokeStyle = g;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(x - 24, y); ctx.lineTo(x + 24, y); ctx.stroke();
  } else if (lbl === 'Battery') {
    ctx.fillStyle = '#333'; ctx.fillRect(x - 25, y - 10, 32, 20);
    ctx.fillStyle = '#c48820'; ctx.fillRect(x + 7, y - 10, 18, 20);
    ctx.fillStyle = INK; ctx.fillRect(x + 25, y - 7, 5, 14);
  } else if (lbl === 'AC Voltage') {
    ctx.strokeStyle = INK;
    ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x - 13, y); ctx.bezierCurveTo(x - 6, y - 14, x + 6, y + 14, x + 13, y); ctx.stroke();
  } else if (lbl === 'Light Bulb') {
    ctx.strokeStyle = '#c06020';
    ctx.beginPath(); ctx.arc(x, y - 5, 15, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = INK;
    ctx.strokeRect(x - 7, y + 10, 14, 8);
  } else if (lbl === 'Resistor') {
    const g = ctx.createLinearGradient(x - 27, y - 10, x + 27, y + 10);
    g.addColorStop(0, '#7a4a20'); g.addColorStop(0.5, '#d4a060'); g.addColorStop(1, '#7a4a20');
    ctx.fillStyle = g;
    roundRect(ctx, x - 26, y - 9, 52, 18, 9); ctx.fill();
    ctx.fillStyle = '#222'; ctx.fillRect(x - 11, y - 9, 4, 18); ctx.fillRect(x + 2, y - 9, 4, 18);
    ctx.fillStyle = '#c9a030'; ctx.fillRect(x + 15, y - 9, 4, 18);
  } else if (lbl === 'Capacitor') {
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(x - 28, y); ctx.lineTo(x - 8, y);
    ctx.moveTo(x + 8, y); ctx.lineTo(x + 28, y);
    ctx.moveTo(x - 8, y - 17); ctx.lineTo(x - 8, y + 17);
    ctx.moveTo(x + 8, y - 17); ctx.lineTo(x + 8, y + 17);
    ctx.stroke();
  } else if (lbl === 'Inductor') {
    ctx.strokeStyle = INK;
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(x - 20 + i * 10, y, 7, Math.PI, 0); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(x - 35, y); ctx.lineTo(x - 27, y); ctx.moveTo(x + 27, y); ctx.lineTo(x + 35, y); ctx.stroke();
  } else {
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(x - 28, y + 6); ctx.lineTo(x - 8, y + 6);
    ctx.moveTo(x + 10, y + 6); ctx.lineTo(x + 28, y + 6);
    ctx.moveTo(x - 6, y + 5); ctx.lineTo(x + 12, y - 13);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(x - 8, y + 6, 5, 0, Math.PI * 2); ctx.stroke();
  }

  ctx.restore();
}

function drawToolShelf(ctx: CanvasRenderingContext2D, size: CanvasSize) {
  const h = Math.min(size.height - TOOLBAR_H - 90, 610);
  panel(ctx, SHELF_X, SHELF_Y, SHELF_W, h);

  ctx.save();
  ctx.fillStyle = SEPIA;
  ctx.font = `bold 12px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('ХЭРЭГСЭЛ', SHELF_X + SHELF_W / 2, SHELF_Y + 22);
  ctx.strokeStyle = 'rgba(0,0,0,0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(SHELF_X + 10, SHELF_Y + 38);
  ctx.lineTo(SHELF_X + SHELF_W - 10, SHELF_Y + 38);
  ctx.stroke();

  shelfItems.forEach(({ label: lbl }, index) => {
    const y = SHELF_ITEM_START_Y + index * SHELF_ITEM_GAP;
    drawShelfIcon(ctx, lbl, SHELF_X + SHELF_W / 2, y);
    ctx.fillStyle = INK_SOFT;
    ctx.font = `12px ${FONT_SKETCH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(lbl, SHELF_X + SHELF_W / 2, y + 20);
  });

  ctx.restore();
}

// ─── Right control panels ─────────────────────────────────────────────────────

function drawMeterIcon(ctx: CanvasRenderingContext2D, x: number, y: number, lbl: string) {
  ctx.save();
  ctx.fillStyle = '#d48a20';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x - 26, y - 36, 52, 44, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff4de';
  ctx.fillRect(x - 16, y - 24, 32, 14);
  ctx.fillStyle = INK;
  ctx.font = `10px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(lbl === 'V' ? 'Voltage' : 'Current', x, y - 28);
  ctx.fillText(lbl, x, y - 15);
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x - 30, y + 4); ctx.lineTo(x - 52, y + 18);
  ctx.moveTo(x + 30, y + 4); ctx.lineTo(x + 52, y + 18);
  ctx.stroke();
  ctx.restore();
}

function drawControlPanels(ctx: CanvasRenderingContext2D, width: number) {
  const px = getControlPanelX(width);
  const ty = TOOLBAR_H;

  panel(ctx, px, ty + 16, 210, 186);
  label(ctx, 'ДЭЛГЭЦ', px + 16, ty + 30, SEPIA, 12);
  checkbox(ctx, px + 16, ty + 46, true); label(ctx, 'Гүйдэл харах', px + 40, ty + 54, INK);

  ctx.save();
  ctx.beginPath(); ctx.arc(px + 55, ty + 86, 9, 0, Math.PI * 2);
  ctx.fillStyle = '#4da6e0'; ctx.fill(); ctx.strokeStyle = '#2a6a9a'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  label(ctx, 'Электрон', px + 78, ty + 86, INK);

  ctx.save();
  ctx.beginPath(); ctx.arc(px + 55, ty + 114, 9, 0, Math.PI * 2);
  ctx.strokeStyle = `${INK}55`; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
  label(ctx, 'Конвенциональ', px + 78, ty + 114, INK_SOFT);

  checkbox(ctx, px + 16, ty + 136, true); label(ctx, 'Шошго', px + 40, ty + 144, INK);
  checkbox(ctx, px + 16, ty + 162, false); label(ctx, 'Утга', px + 40, ty + 170, INK);
  checkbox(ctx, px + 16, ty + 186, false); label(ctx, 'Секундомер', px + 40, ty + 194, INK);

  panel(ctx, px, ty + 218, 210, 140);
  label(ctx, 'ХЭМЖИГЧ', px + 16, ty + 232, SEPIA, 12);
  drawMeterIcon(ctx, px + 58, ty + 278, 'V');
  drawMeterIcon(ctx, px + 154, ty + 278, 'A');
  label(ctx, 'Вольтметр', px + 58, ty + 342, INK_SOFT, 13, 'center');
  label(ctx, 'Амперметр', px + 154, ty + 342, INK_SOFT, 13, 'center');

  panel(ctx, px, ty + 374, 210, 146);
  ctx.save();
  ctx.fillStyle = '#8B3a3a';
  ctx.fillRect(px + 18, ty + 386, 18, 18);
  ctx.fillStyle = PAPER;
  ctx.font = `bold 14px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('−', px + 27, ty + 395);
  ctx.restore();
  label(ctx, 'Нарийвчилсан', px + 50, ty + 395, SEPIA, 15);
  label(ctx, 'Утасны эсэргүүцэл', px + 105, ty + 430, INK_SOFT, 13, 'center');
  label(ctx, 'Эхний эсэргүүцэл', px + 105, ty + 488, INK_SOFT, 13, 'center');

  [448, 506].forEach((y, i) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(px + 34, ty + y); ctx.lineTo(px + 176, ty + y); ctx.stroke();
    ctx.fillStyle = PAPER;
    ctx.strokeStyle = INK_SOFT;
    roundRect(ctx, px + 93 + i * 6, ty + y - 12, 14, 24, 4); ctx.fill(); ctx.stroke();
    ctx.restore();
    label(ctx, 'бага', px + 22, ty + y, INK_SOFT, 11);
    label(ctx, i === 0 ? 'их' : '10Ω', px + 188, ty + y, INK_SOFT, 11, 'right');
  });
}

// ─── Wires ────────────────────────────────────────────────────────────────────

function elbowPath(ctx: CanvasRenderingContext2D, s: Point, e: Point) {
  const midX = (s.x + e.x) / 2;
  ctx.beginPath();
  ctx.moveTo(s.x, s.y);
  ctx.lineTo(midX, s.y);
  ctx.lineTo(midX, e.y);
  ctx.lineTo(e.x, e.y);
}

function drawCircuitWire(ctx: CanvasRenderingContext2D, components: CircuitComponent[], wire: CircuitWire) {
  const s = getTerminalPoint(components, wire.from);
  const e = getTerminalPoint(components, wire.to);
  if (!s || !e) return;

  ctx.save();
  ctx.strokeStyle = COPPER_DARK;
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  elbowPath(ctx, s, e);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(210, 145, 100, 0.55)';
  ctx.lineWidth = 2.5;
  elbowPath(ctx, s, e);
  ctx.stroke();
  ctx.restore();
}

function drawWirePreview(ctx: CanvasRenderingContext2D, components: CircuitComponent[], drag: WireDragState) {
  const s = getTerminalPoint(components, drag.from);
  if (!s) return;
  ctx.save();
  ctx.strokeStyle = 'rgba(42,34,24,0.4)';
  ctx.lineWidth = 5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.setLineDash([10, 8]);
  elbowPath(ctx, s, drag.point);
  ctx.stroke();
  ctx.restore();
}

// ─── Component terminals ──────────────────────────────────────────────────────

function drawTerminals(ctx: CanvasRenderingContext2D, c: CircuitComponent) {
  const terms = getTerminalPoints(c);
  ctx.save();
  (Object.keys(terms) as TerminalKey[]).forEach((t) => {
    const p = terms[t];
    ctx.fillStyle = INK;
    ctx.strokeStyle = PAPER;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PAPER;
    ctx.font = `bold 13px ${FONT_SKETCH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('−', p.x, p.y);
  });
  ctx.restore();
}

// ─── Selection frame ──────────────────────────────────────────────────────────

function drawSelectionFrame(ctx: CanvasRenderingContext2D, c: CircuitComponent) {
  const db = deleteBounds(c);
  ctx.save();
  ctx.strokeStyle = SEPIA;
  ctx.lineWidth = 2;
  ctx.setLineDash([7, 6]);
  roundRect(ctx, c.x - 8, c.y - 8, c.width + 16, c.height + 16, 14);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#f5e8e4';
  ctx.strokeStyle = '#8B3a3a';
  ctx.lineWidth = 1.5;
  roundRect(ctx, db.x, db.y, db.width, db.height, 5);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8B3a3a';
  ctx.font = `bold 14px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('×', db.x + db.width / 2, db.y + db.height / 2);
  ctx.restore();
}

// ─── Hover frame ──────────────────────────────────────────────────────────────

function drawHoverFrame(ctx: CanvasRenderingContext2D, c: CircuitComponent) {
  ctx.save();
  ctx.strokeStyle = 'rgba(42,34,24,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 5]);
  roundRect(ctx, c.x - 6, c.y - 6, c.width + 12, c.height + 12, 12);
  ctx.stroke();
  ctx.restore();
}

// ─── Animated electrons ───────────────────────────────────────────────────────

function drawAnimatedElectrons(
  ctx: CanvasRenderingContext2D,
  components: CircuitComponent[],
  wires: CircuitWire[],
  cv: ReturnType<typeof calculateCircuitValues>,
  animTime: number
) {
  if (!cv.closedCircuit || cv.current <= 0) return;
  const speed = Math.min(60 + cv.current * 28, 200);

  ctx.save();
  wires.forEach((wire) => {
    const s = getTerminalPoint(components, wire.from);
    const e = getTerminalPoint(components, wire.to);
    if (!s || !e) return;

    const segments: [Point, Point][] = [
      [s, { x: (s.x + e.x) / 2, y: s.y }],
      [{ x: (s.x + e.x) / 2, y: s.y }, { x: (s.x + e.x) / 2, y: e.y }],
      [{ x: (s.x + e.x) / 2, y: e.y }, e]
    ];

    segments.forEach((seg, si) => {
      const [a, b] = seg;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 4) return;

      const num = Math.max(1, Math.floor(len / 38));
      const sp = 1 / num;
      for (let i = 0; i < num; i++) {
        const t = ((animTime * speed) / len + i * sp + si * 0.33) % 1;
        const dotX = a.x + dx * t;
        const dotY = a.y + dy * t;

        ctx.fillStyle = '#3a9de0';
        ctx.strokeStyle = 'rgba(220,240,255,0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = `bold 10px ${FONT_SKETCH}`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('−', dotX, dotY);
      }
    });
  });
  ctx.restore();
}

// ─── Component drawers ────────────────────────────────────────────────────────

function drawBattery(ctx: CanvasRenderingContext2D, c: CircuitComponent, cv: ReturnType<typeof calculateCircuitValues>) {
  const { x, y, width: w, height: h } = c;
  const tw = 16;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.2)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = '#1a1a1a'; roundRect(ctx, x, y + 9, w * 0.55, h - 18, 8); ctx.fill();
  ctx.fillStyle = '#c48820'; ctx.fillRect(x + w * 0.55, y + 9, w * 0.33, h - 18);
  ctx.fillStyle = '#e8b840'; roundRect(ctx, x + w - tw, y + 17, tw, h - 34, 4); ctx.fill();

  ctx.shadowColor = 'transparent';
  ctx.strokeStyle = '#333';
  ctx.lineWidth = 2.5;
  roundRect(ctx, x, y + 9, w - tw / 2, h - 18, 8); ctx.stroke();

  ctx.fillStyle = PAPER;
  ctx.font = `bold 22px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('−', x + 26, y + h / 2);
  ctx.fillText('+', x + w - 38, y + h / 2);

  ctx.strokeStyle = '#8B3a3a';
  ctx.setLineDash([7, 8]);
  ctx.lineWidth = 2;
  roundRect(ctx, x - 14, y + 2, w + 28, h - 4, 20); ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `13px ${FONT_SKETCH}`;
  ctx.fillText('Батарей', x + w / 2, y + h + 22);

  if (cv.voltage > 0) {
    ctx.fillStyle = SEPIA;
    ctx.font = `bold 12px ${FONT_SKETCH}`;
    ctx.fillText(`${cv.voltage.toFixed(0)} В`, x + w / 2, y + h + 38);
  }
  ctx.restore();
}

function drawLightbulb(
  ctx: CanvasRenderingContext2D,
  c: CircuitComponent,
  isLit: boolean,
  current: number
) {
  const { x, y, width: w, height: h } = c;
  const cx = x + w / 2;
  const cy = y + 44;

  ctx.save();
  if (isLit) {
    const brightness = Math.min(current / 2, 1);
    const gr = 48 + brightness * 38;
    const glow = ctx.createRadialGradient(cx, cy, 6, cx, cy, gr);
    glow.addColorStop(0, `rgba(255, 238, 110, ${0.9 + brightness * 0.08})`);
    glow.addColorStop(0.4, `rgba(255, 210, 50, ${0.28 + brightness * 0.15})`);
    glow.addColorStop(1, 'rgba(255,200,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(cx, cy, gr, 0, Math.PI * 2); ctx.fill();
  }

  if (isLit) {
    const ig = ctx.createRadialGradient(cx - 8, cy - 10, 2, cx, cy, 36);
    ig.addColorStop(0, 'rgba(255,255,230,1)');
    ig.addColorStop(0.55, 'rgba(255,235,140,0.95)');
    ig.addColorStop(1, 'rgba(255,210,80,0.9)');
    ctx.fillStyle = ig;
  } else {
    ctx.fillStyle = 'rgba(200,195,185,0.9)';
  }
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx, cy, 36, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.shadowColor = isLit ? '#ffcc44' : 'transparent';
  ctx.shadowBlur = isLit ? 12 : 0;
  ctx.strokeStyle = isLit ? '#ff8820' : '#777';
  ctx.lineWidth = isLit ? 3 : 2;
  ctx.beginPath();
  ctx.moveTo(cx - 14, cy + 8);
  ctx.quadraticCurveTo(cx - 5, cy - 12, cx + 2, cy + 4);
  ctx.quadraticCurveTo(cx + 10, cy + 18, cx + 14, cy + 6);
  ctx.stroke();
  ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

  ctx.strokeStyle = isLit ? '#aa5500' : '#666';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 10, cy + 22); ctx.lineTo(cx - 10, cy + 34);
  ctx.moveTo(cx + 10, cy + 22); ctx.lineTo(cx + 10, cy + 34);
  ctx.stroke();

  ctx.fillStyle = '#666'; ctx.fillRect(cx - 18, cy + 34, 36, 12);
  ctx.fillStyle = '#555'; ctx.fillRect(cx - 16, cy + 46, 32, 10);
  ctx.strokeStyle = '#444'; ctx.lineWidth = 2;
  ctx.strokeRect(cx - 18, cy + 34, 36, 22);

  ctx.fillStyle = INK_SOFT;
  ctx.font = `13px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Чийдэн', cx, y + h - 10);

  if (isLit) {
    const power = current * current * 8;
    ctx.fillStyle = SEPIA;
    ctx.font = `bold 12px ${FONT_SKETCH}`;
    ctx.fillText(`${current.toFixed(2)}А  ${power.toFixed(1)}Вт`, cx, y + h + 14);
  }
  ctx.restore();
}

function drawSwitch(ctx: CanvasRenderingContext2D, c: CircuitComponent, isClosed: boolean) {
  const cx = c.x + c.width / 2;
  const cy = c.y + c.height / 2;

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 6;
  ctx.shadowOffsetY = 2;

  ctx.strokeStyle = '#888';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(c.x + 4, cy); ctx.lineTo(cx - 22, cy);
  ctx.moveTo(cx + 22, cy); ctx.lineTo(c.x + c.width - 4, cy);
  ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#444';
  ctx.strokeStyle = isClosed ? '#44bb44' : '#888';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(cx - 22, cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  if (isClosed) {
    ctx.shadowColor = 'rgba(60,180,60,0.5)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = '#33cc33';
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(cx - 14, cy); ctx.lineTo(cx + 22, cy); ctx.stroke();
    ctx.shadowBlur = 0; ctx.shadowColor = 'transparent';

    ctx.fillStyle = '#22bb22';
    ctx.strokeStyle = '#33ee33';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + 22, cy, 7, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 4.5;
    ctx.beginPath(); ctx.moveTo(cx - 14, cy - 1); ctx.lineTo(cx + 18, cy - 27); ctx.stroke();

    ctx.fillStyle = '#666';
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx + 18, cy - 27, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  ctx.fillStyle = INK_SOFT;
  ctx.font = `13px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(isClosed ? 'Унтраалга [ON]' : 'Унтраалга [OFF]', cx, c.y + c.height + 16);

  if (!isClosed) {
    ctx.fillStyle = SEPIA;
    ctx.font = `bold 11px ${FONT_SKETCH}`;
    ctx.fillText('Дарж хаах', cx, c.y + c.height + 32);
  }
  ctx.restore();
}

function drawGenericComponent(ctx: CanvasRenderingContext2D, c: CircuitComponent) {
  const cx = c.x + c.width / 2;
  const cy = c.y + c.height / 2;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.12)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER_DARK;
  ctx.lineWidth = 2.5;

  if (c.type === 'WIRE') {
    ctx.shadowBlur = 0;
    const g = ctx.createLinearGradient(c.x, cy, c.x + c.width, cy);
    g.addColorStop(0, COPPER_DARK); g.addColorStop(0.5, COPPER_MID); g.addColorStop(1, COPPER_DARK);
    ctx.strokeStyle = g;
    ctx.lineWidth = 8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(c.x + 8, cy); ctx.lineTo(c.x + c.width - 8, cy); ctx.stroke();
  } else if (c.type === 'AC_VOLTAGE') {
    roundRect(ctx, cx - 38, cy - 48, 76, 76, 38); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.beginPath();
    ctx.moveTo(cx - 22, cy - 10);
    ctx.bezierCurveTo(cx - 10, cy - 36, cx + 10, cy + 16, cx + 22, cy - 10);
    ctx.strokeStyle = '#c06020';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = `bold 16px ${FONT_SKETCH}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', cx, cy - 32);
    ctx.fillText('−', cx, cy + 16);
  } else if (c.type === 'RESISTOR') {
    const g = ctx.createLinearGradient(c.x, c.y, c.x + c.width, c.y + c.height);
    g.addColorStop(0, '#7a4a20'); g.addColorStop(0.5, '#c49050'); g.addColorStop(1, '#7a4a20');
    ctx.fillStyle = g;
    roundRect(ctx, c.x + 18, c.y + 14, c.width - 36, 28, 14); ctx.fill(); ctx.stroke();
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = '#111'; ctx.fillRect(cx - 26, c.y + 14, 5, 28); ctx.fillRect(cx - 5, c.y + 14, 5, 28);
    ctx.fillStyle = '#c9a030'; ctx.fillRect(cx + 24, c.y + 14, 5, 28);
  } else if (c.type === 'CAPACITOR') {
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(c.x + 8, cy); ctx.lineTo(cx - 14, cy);
    ctx.moveTo(cx + 14, cy); ctx.lineTo(c.x + c.width - 8, cy);
    ctx.moveTo(cx - 14, c.y + 10); ctx.lineTo(cx - 14, c.y + c.height - 10);
    ctx.moveTo(cx + 14, c.y + 10); ctx.lineTo(cx + 14, c.y + c.height - 10);
    ctx.stroke();
  } else if (c.type === 'INDUCTOR') {
    ctx.shadowColor = 'transparent';
    ctx.strokeStyle = INK;
    ctx.beginPath();
    ctx.moveTo(c.x + 8, cy); ctx.lineTo(c.x + 26, cy); ctx.stroke();
    for (let i = 0; i < 6; i++) {
      ctx.beginPath(); ctx.arc(c.x + 38 + i * 14, cy, 10, Math.PI, 0); ctx.stroke();
    }
    ctx.beginPath();
    ctx.moveTo(c.x + c.width - 26, cy); ctx.lineTo(c.x + c.width - 8, cy); ctx.stroke();
  }

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = INK_SOFT;
  ctx.font = `13px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getComponentLabel(c.type), cx, c.y + c.height + 16);
  ctx.restore();
}

function drawMeasuringTool(
  ctx: CanvasRenderingContext2D,
  c: CircuitComponent,
  cv: ReturnType<typeof calculateCircuitValues>
) {
  const cx = c.x + c.width / 2;
  const cy = c.y + c.height / 2;
  const isA = c.type === 'AMMETER';
  const val = cv.meterReadings[c.id] ?? 0;
  const valStr = isA ? `${val.toFixed(2)} А` : `${val.toFixed(1)} В`;

  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.15)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = '#d48a20';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2.5;
  roundRect(ctx, c.x + 16, c.y + 8, c.width - 32, 52, 10); ctx.fill(); ctx.stroke();

  ctx.shadowColor = 'transparent';
  ctx.fillStyle = '#fff4de';
  ctx.fillRect(c.x + 34, c.y + 26, c.width - 68, 18);
  ctx.fillStyle = INK;
  ctx.font = `bold 12px ${FONT_SKETCH}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(isA ? 'Гүйдэл' : 'Хүчдэл', cx, c.y + 22);
  ctx.font = `bold 13px ${FONT_SKETCH}`;
  ctx.fillText(valStr, cx, c.y + 35);

  ctx.strokeStyle = '#555'; ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(c.x + 14, cy); ctx.lineTo(c.x, cy + 14);
  ctx.moveTo(c.x + c.width - 14, cy); ctx.lineTo(c.x + c.width, cy + 14);
  ctx.stroke();

  ctx.fillStyle = INK_SOFT;
  ctx.font = `13px ${FONT_SKETCH}`;
  ctx.fillText(isA ? 'Амперметр' : 'Вольтметр', cx, c.y + c.height + 14);
  ctx.restore();
}

function drawComponent(
  ctx: CanvasRenderingContext2D,
  c: CircuitComponent,
  cv: ReturnType<typeof calculateCircuitValues>,
  switchStates: Record<string, boolean>
) {
  if (c.type === 'BATTERY') drawBattery(ctx, c, cv);
  else if (c.type === 'LIGHTBULB') drawLightbulb(ctx, c, cv.closedCircuit, cv.current);
  else if (c.type === 'SWITCH') drawSwitch(ctx, c, switchStates[c.id] ?? false);
  else if (c.type === 'VOLTMETER' || c.type === 'AMMETER') drawMeasuringTool(ctx, c, cv);
  else drawGenericComponent(ctx, c);
}

function drawSourcePreview(
  ctx: CanvasRenderingContext2D,
  type: CircuitComponentType,
  point: Point,
  cv: ReturnType<typeof calculateCircuitValues>,
  switchStates: Record<string, boolean>
) {
  const size = componentSizes[type];
  const prev = createCircuitComponent(type, 'preview', point.x - size.width / 2, point.y - size.height / 2);
  ctx.save();
  ctx.globalAlpha = 0.6;
  drawComponent(ctx, prev, cv, switchStates);
  ctx.restore();
}

// ─── Bottom hint bar ──────────────────────────────────────────────────────────

function drawBottomBar(ctx: CanvasRenderingContext2D, size: CanvasSize) {
  ctx.save();
  ctx.fillStyle = 'rgba(232,226,212,0.95)';
  ctx.fillRect(0, size.height - 44, size.width, 44);
  ctx.strokeStyle = 'rgba(0,0,0,0.08)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, size.height - 44); ctx.lineTo(size.width, size.height - 44); ctx.stroke();

  ctx.fillStyle = INK_SOFT;
  ctx.font = `14px ${FONT_SKETCH}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'Хэрэгслийг чирж нэмэх  •  Терминалын цэгийг чирж холбох  •  Унтраалга дарах  •  Del товч устгах  •  Ctrl+Z/Y буцаах',
    size.width / 2,
    size.height - 22
  );
  ctx.restore();
}

// ─── Background ───────────────────────────────────────────────────────────────

function drawBackground(ctx: CanvasRenderingContext2D, size: CanvasSize) {
  const grad = ctx.createLinearGradient(0, 0, 0, size.height);
  grad.addColorStop(0, '#f9f6f0');
  grad.addColorStop(1, '#f2ecd8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size.width, size.height);

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#a08040';
  for (let x = 0; x < size.width; x += GRID) {
    for (let y = TOOLBAR_H; y < size.height - 44; y += GRID) {
      ctx.beginPath();
      ctx.arc(x, y, 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ─── Wire junction dots ───────────────────────────────────────────────────────

function drawJunctions(ctx: CanvasRenderingContext2D, components: CircuitComponent[], wires: CircuitWire[]) {
  const count = new Map<string, number>();
  wires.forEach((w) => {
    const sk = JSON.stringify(getTerminalPoint(components, w.from));
    const ek = JSON.stringify(getTerminalPoint(components, w.to));
    count.set(sk, (count.get(sk) ?? 0) + 1);
    count.set(ek, (count.get(ek) ?? 0) + 1);
  });

  ctx.save();
  ctx.fillStyle = INK;
  count.forEach((n, key) => {
    if (n < 3) return;
    const p: Point = JSON.parse(key);
    ctx.beginPath();
    ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function CircuitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => getInitialCanvasSize());
  const [circuitState, setCircuitState] = useState<CircuitState>(() => {
    const s = getInitialCanvasSize();
    return { components: createInitialComponents(s.width, s.height), wires: [], switchStates: {} };
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const circuitRef = useRef(circuitState);
  circuitRef.current = circuitState;
  const sizeRef = useRef(canvasSize);
  sizeRef.current = canvasSize;
  const selectedRef = useRef(selectedId);
  selectedRef.current = selectedId;

  const dragRef = useRef<DragState | null>(null);
  const sourceDragRef = useRef<SourceDragState | null>(null);
  const wireDragRef = useRef<WireDragState | null>(null);
  const sourcePreviewRef = useRef<Point | null>(null);
  const mouseDownPt = useRef<Point | null>(null);
  const mouseDownCompId = useRef<string | null>(null);
  const hoverIdRef = useRef<string | null>(null);

  const animTimeRef = useRef(0);

  const historyRef = useRef<CircuitState[]>([]);
  const historyIdxRef = useRef(-1);

  const pushHistory = (state: CircuitState) => {
    const newHist = historyRef.current.slice(0, historyIdxRef.current + 1);
    newHist.push(JSON.parse(JSON.stringify(state)));
    if (newHist.length > MAX_HISTORY) newHist.shift();
    historyRef.current = newHist;
    historyIdxRef.current = newHist.length - 1;
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(false);
  };

  const undo = () => {
    if (historyIdxRef.current <= 0) return;
    historyIdxRef.current -= 1;
    const s = historyRef.current[historyIdxRef.current];
    setCircuitState(s);
    setCanUndo(historyIdxRef.current > 0);
    setCanRedo(true);
    setSelectedId(null);
  };

  const redo = () => {
    if (historyIdxRef.current >= historyRef.current.length - 1) return;
    historyIdxRef.current += 1;
    const s = historyRef.current[historyIdxRef.current];
    setCircuitState(s);
    setCanUndo(true);
    setCanRedo(historyIdxRef.current < historyRef.current.length - 1);
    setSelectedId(null);
  };

  const clearAll = () => {
    const s = getInitialCanvasSize();
    const next: CircuitState = { components: createInitialComponents(s.width, s.height), wires: [], switchStates: {} };
    pushHistory(next);
    setCircuitState(next);
    setSelectedId(null);
  };

  const resizeFrame = useRef<{ id: number | null }>({ id: null });
  const updateSize = () => {
    const el = containerRef.current;
    setCanvasSize({ width: el?.clientWidth ?? window.innerWidth, height: el?.clientHeight ?? window.innerHeight });
  };
  useEffect(() => {
    updateSize();
    const onResize = () => {
      if (resizeFrame.current.id !== null) return;
      resizeFrame.current.id = requestAnimationFrame(() => { resizeFrame.current.id = null; updateSize(); });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (resizeFrame.current.id !== null) cancelAnimationFrame(resizeFrame.current.id);
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.key === 'y' && (e.ctrlKey || e.metaKey)) || (e.key === 'z' && (e.ctrlKey || e.metaKey) && e.shiftKey)) { e.preventDefault(); redo(); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedRef.current) {
        e.preventDefault();
        const id = selectedRef.current;
        setCircuitState((s) => {
          const next: CircuitState = {
            components: s.components.filter((c) => c.id !== id),
            wires: s.wires.filter((w) => w.from.componentId !== id && w.to.componentId !== id),
            switchStates: Object.fromEntries(Object.entries(s.switchStates).filter(([k]) => k !== id))
          };
          pushHistory(next);
          return next;
        });
        setSelectedId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    pushHistory(circuitState);
  }, []);

  useEffect(() => {
    let last = 0;
    let frameId: number;
    const prevSize = { width: 0, height: 0 };

    const loop = (ts: number) => {
      const dt = last ? Math.min((ts - last) / 1000, 0.05) : 0;
      last = ts;

      const canvas = canvasRef.current;
      if (!canvas) { frameId = requestAnimationFrame(loop); return; }
      const ctx = canvas.getContext('2d');
      if (!ctx) { frameId = requestAnimationFrame(loop); return; }

      const size = sizeRef.current;
      if (size.width === 0 || size.height === 0) { frameId = requestAnimationFrame(loop); return; }

      const pr = window.devicePixelRatio || 1;
      if (size.width !== prevSize.width || size.height !== prevSize.height) {
        canvas.width = size.width * pr;
        canvas.height = size.height * pr;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        prevSize.width = size.width;
        prevSize.height = size.height;
      }
      ctx.setTransform(pr, 0, 0, pr, 0, 0);
      ctx.clearRect(0, 0, size.width, size.height);

      const state = circuitRef.current;
      const cv = calculateCircuitValues(state.components, state.wires, state.switchStates);
      if (cv.closedCircuit) animTimeRef.current += dt;

      drawBackground(ctx, size);
      drawToolbar(ctx, size, canUndo, canRedo, cv.closedCircuit, cv.current, cv.voltage);
      drawToolShelf(ctx, size);
      drawControlPanels(ctx, size.width);

      state.wires.forEach((w) => drawCircuitWire(ctx, state.components, w));
      drawJunctions(ctx, state.components, state.wires);

      state.components.forEach((c) => {
        if (c.id === hoverIdRef.current && c.id !== selectedRef.current) drawHoverFrame(ctx, c);
        drawComponent(ctx, c, cv, state.switchStates);
        drawTerminals(ctx, c);
      });

      drawAnimatedElectrons(ctx, state.components, state.wires, cv, animTimeRef.current);

      if (wireDragRef.current) drawWirePreview(ctx, state.components, wireDragRef.current);

      const sel = state.components.find((c) => c.id === selectedRef.current);
      if (sel) drawSelectionFrame(ctx, sel);

      if (sourceDragRef.current && sourcePreviewRef.current) {
        drawSourcePreview(ctx, sourceDragRef.current.type, sourcePreviewRef.current, cv, state.switchStates);
      }

      drawBottomBar(ctx, size);
      frameId = requestAnimationFrame(loop);
    };

    frameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frameId);
  }, [canUndo, canRedo]);

  const handleMouseDown = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);
    mouseDownPt.current = pt;

    const state = circuitRef.current;
    const size = sizeRef.current;

    const active = state.components.find((c) => c.id === selectedRef.current);
    if (active && insideRect(pt.x, pt.y, deleteBounds(active))) {
      const id = active.id;
      setCircuitState((s) => {
        const next: CircuitState = {
          components: s.components.filter((c) => c.id !== id),
          wires: s.wires.filter((w) => w.from.componentId !== id && w.to.componentId !== id),
          switchStates: Object.fromEntries(Object.entries(s.switchStates).filter(([k]) => k !== id))
        };
        pushHistory(next);
        return next;
      });
      setSelectedId(null);
      return;
    }

    const btns = getToolbarButtons(size.width);
    if (insideRect(pt.x, pt.y, { x: btns.undo.x, y: btns.undo.y, width: btns.undo.w, height: btns.undo.h })) { undo(); return; }
    if (insideRect(pt.x, pt.y, { x: btns.redo.x, y: btns.redo.y, width: btns.redo.w, height: btns.redo.h })) { redo(); return; }
    if (insideRect(pt.x, pt.y, { x: btns.clear.x, y: btns.clear.y, width: btns.clear.w, height: btns.clear.h })) { clearAll(); return; }

    const shelfType = shelfItemAtPoint(pt.x, pt.y, size.height);
    const meterType = meterAtPoint(pt.x, pt.y, size.width);
    const srcType = shelfType ?? meterType;
    if (srcType) {
      sourceDragRef.current = { type: srcType };
      sourcePreviewRef.current = pt;
      setSelectedId(null);
      setIsDragging(true);
      return;
    }

    const term = terminalAtPoint(pt.x, pt.y, state.components);
    if (term) {
      wireDragRef.current = { from: term, point: pt };
      setSelectedId(null);
      setIsDragging(true);
      return;
    }

    const hit = [...state.components].reverse().find((c) => insideComponent(pt.x, pt.y, c));
    if (!hit) { setSelectedId(null); return; }

    mouseDownCompId.current = hit.id;
    setSelectedId(hit.id);
    dragRef.current = { id: hit.id, offsetX: pt.x - hit.x, offsetY: pt.y - hit.y };
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const pt = getCanvasPoint(e, canvas);
    const state = circuitRef.current;

    const hitId = [...state.components].reverse().find((c) => insideComponent(pt.x, pt.y, c))?.id ?? null;
    hoverIdRef.current = hitId;

    if (sourceDragRef.current) { sourcePreviewRef.current = pt; return; }
    if (wireDragRef.current) { wireDragRef.current = { ...wireDragRef.current, point: pt }; return; }
    if (!dragRef.current) return;

    const d = dragRef.current;
    setCircuitState((s) => ({
      ...s,
      components: s.components.map((c) =>
        c.id === d.id ? { ...c, x: snapGrid(pt.x - d.offsetX), y: snapGrid(pt.y - d.offsetY) } : c
      )
    }));
  };

  const handleMouseUp = (e: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const state = circuitRef.current;

    if (canvas && wireDragRef.current) {
      const pt = getCanvasPoint(e, canvas);
      const target = terminalAtPoint(pt.x, pt.y, state.components);
      if (target && !sameEndpoint(wireDragRef.current.from, target) && !duplicateWire(state.wires, wireDragRef.current.from, target)) {
        const newWire: CircuitWire = { id: makeId('WIRE'), from: wireDragRef.current.from, to: target };
        setCircuitState((s) => {
          const next = { ...s, wires: [...s.wires, newWire] };
          pushHistory(next);
          return next;
        });
      }
    }

    if (canvas && sourceDragRef.current) {
      const pt = getCanvasPoint(e, canvas);
      if (!isSourceArea(pt.x, pt.y, sizeRef.current)) {
        const type = sourceDragRef.current.type;
        const sz = componentSizes[type];
        const nc = createCircuitComponent(type, makeId(type), snapGrid(pt.x - sz.width / 2), snapGrid(pt.y - sz.height / 2));
        setCircuitState((s) => {
          const next: CircuitState = {
            ...s,
            components: [...s.components, nc],
            switchStates: type === 'SWITCH' ? { ...s.switchStates, [nc.id]: false } : s.switchStates
          };
          pushHistory(next);
          return next;
        });
        setSelectedId(nc.id);
      }
    }

    if (canvas && mouseDownPt.current && !wireDragRef.current && !sourceDragRef.current) {
      const pt = getCanvasPoint(e, canvas);
      const dist = Math.hypot(pt.x - mouseDownPt.current.x, pt.y - mouseDownPt.current.y);
      if (dist < 6) {
        const sw = state.components.find((c) => c.type === 'SWITCH' && c.id === mouseDownCompId.current);
        if (sw) {
          setCircuitState((s) => {
            const next = { ...s, switchStates: { ...s.switchStates, [sw.id]: !s.switchStates[sw.id] } };
            pushHistory(next);
            return next;
          });
        }
      }
    }

    if (dragRef.current) {
      pushHistory(circuitRef.current);
    }

    wireDragRef.current = null;
    sourceDragRef.current = null;
    sourcePreviewRef.current = null;
    dragRef.current = null;
    mouseDownPt.current = null;
    mouseDownCompId.current = null;
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    wireDragRef.current = null;
    sourceDragRef.current = null;
    sourcePreviewRef.current = null;
    dragRef.current = null;
    hoverIdRef.current = null;
    setIsDragging(false);
  };

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', width: '100%', height: '100%', cursor: isDragging ? 'grabbing' : 'default' }}
      />
    </div>
  );
}
