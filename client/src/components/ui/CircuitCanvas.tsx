import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

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

interface ResizeFrame {
  id: number | null;
}

const shelfItems = [
  { label: 'Wire', type: 'WIRE' },
  { label: 'Battery', type: 'BATTERY' },
  { label: 'AC Voltage', type: 'AC_VOLTAGE' },
  { label: 'Light Bulb', type: 'LIGHTBULB' },
  { label: 'Resistor', type: 'RESISTOR' },
  { label: 'Capacitor', type: 'CAPACITOR' },
  { label: 'Inductor', type: 'INDUCTOR' },
  { label: 'Switch', type: 'SWITCH' }
] satisfies Array<{
  label: string;
  type: CircuitComponentType;
}>;

const componentSizes: Record<CircuitComponentType, { width: number; height: number }> = {
  WIRE: { width: 150, height: 34 },
  BATTERY: { width: 180, height: 62 },
  AC_VOLTAGE: { width: 118, height: 118 },
  LIGHTBULB: { width: 118, height: 142 },
  RESISTOR: { width: 150, height: 58 },
  CAPACITOR: { width: 120, height: 82 },
  INDUCTOR: { width: 150, height: 70 },
  SWITCH: { width: 140, height: 74 },
  VOLTMETER: { width: 132, height: 86 },
  AMMETER: { width: 132, height: 86 }
};

const shelfBounds = {
  x: 16,
  y: 16,
  width: 110,
  itemStartY: 92,
  itemGap: 66
};

const deleteButtonSize = 22;

function getControlPanelX(width: number) {
  return Math.max(width - 236, 520);
}

function createCircuitComponent(
  type: CircuitComponentType,
  id: string,
  x: number,
  y: number
): CircuitComponent {
  const size = componentSizes[type];

  return {
    id,
    type,
    x,
    y,
    width: size.width,
    height: size.height
  };
}

function getComponentLabel(type: CircuitComponentType) {
  if (type === 'VOLTMETER') {
    return 'Voltmeter';
  }

  if (type === 'AMMETER') {
    return 'Ammeter';
  }

  return shelfItems.find((item) => item.type === type)?.label ?? type;
}

function createInitialComponents(width: number, height: number): CircuitComponent[] {
  const centerX = width / 2;
  const centerY = height / 2;

  return [
    createCircuitComponent('BATTERY', 'battery-1', centerX - 210, centerY - 40),
    createCircuitComponent('LIGHTBULB', 'lightbulb-1', centerX + 90, centerY - 88)
  ];
}

function getInitialCanvasSize(): CanvasSize {
  if (typeof window === 'undefined') {
    return {
      width: 1024,
      height: 768
    };
  }

  return {
    width: window.innerWidth,
    height: window.innerHeight
  };
}

function getCanvasPoint(
  event: MouseEvent<HTMLCanvasElement>,
  canvas: HTMLCanvasElement
) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top
  };
}

function isPointInsideComponent(
  pointX: number,
  pointY: number,
  component: CircuitComponent
) {
  return (
    pointX >= component.x &&
    pointX <= component.x + component.width &&
    pointY >= component.y &&
    pointY <= component.y + component.height
  );
}

function isPointInsideRect(
  pointX: number,
  pointY: number,
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  }
) {
  return (
    pointX >= rect.x &&
    pointX <= rect.x + rect.width &&
    pointY >= rect.y &&
    pointY <= rect.y + rect.height
  );
}

function getTerminalPoints(component: CircuitComponent): Record<TerminalKey, Point> {
  const centerY = component.y + component.height / 2;
  const centerX = component.x + component.width / 2;

  if (component.type === 'LIGHTBULB') {
    return {
      a: {
        x: component.x + component.width * 0.2,
        y: component.y + component.height * 0.72
      },
      b: {
        x: component.x + component.width * 0.8,
        y: component.y + component.height * 0.72
      }
    };
  }

  if (component.type === 'AC_VOLTAGE') {
    return {
      a: {
        x: centerX - 40,
        y: centerY + 38
      },
      b: {
        x: centerX + 40,
        y: centerY + 38
      }
    };
  }

  return {
    a: {
      x: component.x,
      y: centerY
    },
    b: {
      x: component.x + component.width,
      y: centerY
    }
  };
}

function isSameEndpoint(first: WireEndpoint, second: WireEndpoint) {
  return first.componentId === second.componentId && first.terminal === second.terminal;
}

function getTerminalAtPoint(
  pointX: number,
  pointY: number,
  components: CircuitComponent[]
): WireEndpoint | null {
  for (const component of [...components].reverse()) {
    const terminals = getTerminalPoints(component);
    const hitTerminal = (Object.keys(terminals) as TerminalKey[]).find((terminal) => {
      const point = terminals[terminal];
      const distanceX = pointX - point.x;
      const distanceY = pointY - point.y;

      return distanceX * distanceX + distanceY * distanceY <= 18 * 18;
    });

    if (hitTerminal) {
      return {
        componentId: component.id,
        terminal: hitTerminal
      };
    }
  }

  return null;
}

function getTerminalPoint(
  components: CircuitComponent[],
  endpoint: WireEndpoint
): Point | null {
  const component = components.find((currentComponent) => currentComponent.id === endpoint.componentId);

  if (!component) {
    return null;
  }

  return getTerminalPoints(component)[endpoint.terminal];
}

function isDuplicateWire(wires: CircuitWire[], from: WireEndpoint, to: WireEndpoint) {
  return wires.some((wire) => (
    (isSameEndpoint(wire.from, from) && isSameEndpoint(wire.to, to)) ||
    (isSameEndpoint(wire.from, to) && isSameEndpoint(wire.to, from))
  ));
}

function getShelfItemAtPoint(
  pointX: number,
  pointY: number,
  canvasHeight: number
): CircuitComponentType | null {
  const shelfHeight = Math.min(canvasHeight - 96, 610);

  if (
    pointX < shelfBounds.x ||
    pointX > shelfBounds.x + shelfBounds.width ||
    pointY < shelfBounds.y ||
    pointY > shelfBounds.y + shelfHeight
  ) {
    return null;
  }

  const shelfItem = shelfItems.find((item, index) => {
    const itemCenterY = shelfBounds.itemStartY + index * shelfBounds.itemGap;

    return pointY >= itemCenterY - 30 && pointY <= itemCenterY + 50;
  });

  return shelfItem?.type ?? null;
}

function getMeterToolAtPoint(pointX: number, pointY: number, canvasWidth: number) {
  const panelX = getControlPanelX(canvasWidth);
  const voltmeterBounds = {
    x: panelX + 22,
    y: 244,
    width: 78,
    height: 102
  };
  const ammeterBounds = {
    x: panelX + 118,
    y: 244,
    width: 78,
    height: 102
  };

  if (isPointInsideRect(pointX, pointY, voltmeterBounds)) {
    return 'VOLTMETER';
  }

  if (isPointInsideRect(pointX, pointY, ammeterBounds)) {
    return 'AMMETER';
  }

  return null;
}

function isSourceArea(pointX: number, pointY: number, size: CanvasSize) {
  const panelX = getControlPanelX(size.width);

  return (
    getShelfItemAtPoint(pointX, pointY, size.height) !== null ||
    (pointX >= panelX && pointX <= panelX + 210 && pointY >= 16 && pointY <= 530)
  );
}

function getDeleteButtonBounds(component: CircuitComponent) {
  return {
    x: component.x + component.width - deleteButtonSize / 2,
    y: component.y - deleteButtonSize / 2,
    width: deleteButtonSize,
    height: deleteButtonSize
  };
}

function makeComponentId(type: CircuitComponentType) {
  return `${type.toLowerCase()}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function calculateCircuitValues(components: CircuitComponent[], wires: CircuitWire[]) {
  const batteryCount = components.filter((component) => component.type === 'BATTERY').length;
  const acCount = components.filter((component) => component.type === 'AC_VOLTAGE').length;
  const bulbCount = components.filter((component) => component.type === 'LIGHTBULB').length;
  const resistorCount = components.filter((component) => component.type === 'RESISTOR').length;
  const inductorCount = components.filter((component) => component.type === 'INDUCTOR').length;
  const switchCount = components.filter((component) => component.type === 'SWITCH').length;
  const capacitorCount = components.filter((component) => component.type === 'CAPACITOR').length;
  const voltage = batteryCount * 9 + acCount * 6;
  const source = components.find((component) => (
    component.type === 'BATTERY' || component.type === 'AC_VOLTAGE'
  ));
  const loadCount = bulbCount + resistorCount + inductorCount;
  const connectedComponentIds = new Set<string>();

  wires.forEach((wire) => {
    connectedComponentIds.add(wire.from.componentId);
    connectedComponentIds.add(wire.to.componentId);
  });

  const sourceIsConnected = source ? connectedComponentIds.has(source.id) : false;
  const loadIsConnected = components.some((component) => (
    connectedComponentIds.has(component.id) &&
    (component.type === 'LIGHTBULB' ||
      component.type === 'RESISTOR' ||
      component.type === 'INDUCTOR' ||
      component.type === 'AMMETER')
  ));
  const closedCircuit = Boolean(
    voltage > 0 &&
    sourceIsConnected &&
    loadIsConnected &&
    loadCount > 0 &&
    capacitorCount === 0 &&
    wires.length >= 2
  );
  const resistance =
    bulbCount * 8 +
    resistorCount * 10 +
    wires.length * 0.2 +
    inductorCount * 1.5 +
    switchCount * 0.5 +
    1;
  const current = closedCircuit ? voltage / resistance : 0;
  const meterReadings = components.reduce<Record<string, number>>((readings, component) => {
    if (component.type !== 'VOLTMETER' && component.type !== 'AMMETER') {
      return readings;
    }

    const terminalWireCount = wires.filter((wire) => (
      wire.from.componentId === component.id || wire.to.componentId === component.id
    )).length;

    if (component.type === 'AMMETER') {
      return {
        ...readings,
        [component.id]: terminalWireCount >= 2 && closedCircuit ? current : 0
      };
    }

    return {
      ...readings,
      [component.id]: terminalWireCount >= 2 && voltage > 0 ? voltage : 0
    };
  }, {});

  return {
    closedCircuit,
    current,
    meterReadings,
    voltage
  };
}

function formatCurrent(value: number) {
  return `${value.toFixed(2)} A`;
}

function formatVoltage(value: number) {
  return `${value.toFixed(1)} V`;
}

function drawRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
}

function drawWorkspaceBackground(context: CanvasRenderingContext2D, size: CanvasSize) {
  context.fillStyle = '#9fbeef';
  context.fillRect(0, 0, size.width, size.height);

  context.save();
  context.globalAlpha = 0.18;
  context.fillStyle = '#ffffff';

  const gridStep = size.width > 1200 ? 42 : 32;

  for (let x = 0; x < size.width; x += gridStep) {
    for (let y = 0; y < size.height; y += gridStep) {
      context.beginPath();
      context.arc(x, y, 1.2, 0, Math.PI * 2);
      context.fill();
    }
  }

  context.restore();
}

function drawPanel(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number
) {
  context.save();
  context.fillStyle = '#f6f6f6';
  context.strokeStyle = '#111111';
  context.lineWidth = 2;
  drawRoundedRect(context, x, y, width, height, 8);
  context.fill();
  context.stroke();
  context.restore();
}

function drawCheckBox(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  checked: boolean
) {
  context.save();
  context.strokeStyle = '#111111';
  context.lineWidth = 2;
  drawRoundedRect(context, x, y, 18, 18, 3);
  context.stroke();

  if (checked) {
    context.beginPath();
    context.moveTo(x + 4, y + 9);
    context.lineTo(x + 8, y + 14);
    context.lineTo(x + 16, y + 4);
    context.stroke();
  }

  context.restore();
}

function drawToolIcon(context: CanvasRenderingContext2D, label: string, x: number, y: number) {
  context.save();
  context.strokeStyle = '#2a2a2a';
  context.fillStyle = '#2a2a2a';
  context.lineWidth = 2;

  if (label === 'Wire') {
    const gradient = context.createLinearGradient(x - 24, y, x + 24, y);
    gradient.addColorStop(0, '#6f2a1c');
    gradient.addColorStop(0.5, '#d28a70');
    gradient.addColorStop(1, '#6f2a1c');
    context.strokeStyle = gradient;
    context.lineWidth = 7;
    context.beginPath();
    context.moveTo(x - 24, y);
    context.lineTo(x + 24, y);
    context.stroke();
  } else if (label === 'Battery') {
    context.fillStyle = '#111111';
    context.fillRect(x - 25, y - 10, 32, 20);
    context.fillStyle = '#f0a23b';
    context.fillRect(x + 7, y - 10, 19, 20);
    context.fillStyle = '#ffffff';
    context.fillRect(x + 26, y - 6, 4, 12);
  } else if (label === 'AC Voltage') {
    context.beginPath();
    context.arc(x, y, 20, 0, Math.PI * 2);
    context.stroke();
    context.beginPath();
    context.moveTo(x - 13, y);
    context.bezierCurveTo(x - 7, y - 15, x + 7, y + 15, x + 13, y);
    context.stroke();
    context.fillText('+', x, y - 12);
    context.fillText('-', x, y + 16);
  } else if (label === 'Light Bulb') {
    context.strokeStyle = '#d0704f';
    context.beginPath();
    context.arc(x, y - 4, 16, 0, Math.PI * 2);
    context.stroke();
    context.strokeStyle = '#555555';
    context.strokeRect(x - 8, y + 12, 16, 10);
  } else if (label === 'Resistor') {
    const gradient = context.createLinearGradient(x - 27, y - 10, x + 27, y + 10);
    gradient.addColorStop(0, '#a76b38');
    gradient.addColorStop(0.5, '#e6c087');
    gradient.addColorStop(1, '#a76b38');
    context.fillStyle = gradient;
    drawRoundedRect(context, x - 27, y - 10, 54, 20, 10);
    context.fill();
    context.fillStyle = '#111111';
    context.fillRect(x - 12, y - 10, 4, 20);
    context.fillRect(x + 2, y - 10, 4, 20);
    context.fillStyle = '#d9c13f';
    context.fillRect(x + 15, y - 10, 4, 20);
  } else if (label === 'Capacitor') {
    context.beginPath();
    context.moveTo(x - 28, y);
    context.lineTo(x - 8, y);
    context.moveTo(x + 8, y);
    context.lineTo(x + 28, y);
    context.moveTo(x - 8, y - 18);
    context.lineTo(x - 8, y + 18);
    context.moveTo(x + 8, y - 18);
    context.lineTo(x + 8, y + 18);
    context.stroke();
  } else if (label === 'Inductor') {
    for (let i = 0; i < 5; i += 1) {
      context.beginPath();
      context.arc(x - 20 + i * 10, y, 7, Math.PI, 0);
      context.stroke();
    }
    context.beginPath();
    context.moveTo(x - 35, y);
    context.lineTo(x - 27, y);
    context.moveTo(x + 27, y);
    context.lineTo(x + 35, y);
    context.stroke();
  } else {
    context.beginPath();
    context.moveTo(x - 28, y + 8);
    context.lineTo(x - 8, y + 8);
    context.moveTo(x + 10, y + 8);
    context.lineTo(x + 28, y + 8);
    context.moveTo(x - 6, y + 7);
    context.lineTo(x + 12, y - 12);
    context.stroke();
    context.beginPath();
    context.arc(x - 8, y + 8, 5, 0, Math.PI * 2);
    context.stroke();
  }

  context.restore();
}

function drawToolShelf(context: CanvasRenderingContext2D, height: number) {
  const shelfWidth = 110;

  drawPanel(context, 16, 16, shelfWidth, Math.min(height - 96, 610));

  context.save();
  context.fillStyle = '#e8e8e8';
  context.fillRect(18, 42, shelfWidth - 4, 1);
  context.strokeStyle = '#888888';
  context.lineWidth = 4;
  context.beginPath();
  context.moveTo(62, 31);
  context.lineTo(71, 24);
  context.lineTo(80, 31);
  context.stroke();

  shelfItems.forEach(({ label }, index) => {
    const y = 92 + index * 66;
    drawToolIcon(context, label, 71, y);
    context.fillStyle = '#111111';
    context.font = '15px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'top';
    context.fillText(label, 71, y + 24);
  });

  context.fillStyle = '#e9f1ff';
  context.strokeStyle = '#5c78a8';
  context.lineWidth = 1.5;
  drawRoundedRect(context, 16, height - 72, 44, 38, 5);
  context.fill();
  context.stroke();
  drawToolIcon(context, 'Battery', 38, height - 53);

  drawRoundedRect(context, 78, height - 72, 44, 38, 5);
  context.fill();
  context.stroke();
  drawToolIcon(context, 'Capacitor', 100, height - 53);
  context.restore();
}

function drawControlPanels(context: CanvasRenderingContext2D, width: number) {
  const panelX = getControlPanelX(width);

  drawPanel(context, panelX, 16, 210, 190);
  context.save();
  context.fillStyle = '#111111';
  context.font = '18px sans-serif';
  context.textAlign = 'left';
  context.textBaseline = 'middle';
  drawCheckBox(context, panelX + 16, 34, true);
  context.fillText('Show Current', panelX + 46, 43);

  context.beginPath();
  context.arc(panelX + 55, 76, 9, 0, Math.PI * 2);
  context.fillStyle = '#78b9e8';
  context.fill();
  context.strokeStyle = '#111111';
  context.stroke();
  context.fillStyle = '#111111';
  context.font = '16px sans-serif';
  context.fillText('Electrons', panelX + 78, 76);

  context.beginPath();
  context.arc(panelX + 55, 108, 9, 0, Math.PI * 2);
  context.stroke();
  context.fillText('Conventional', panelX + 78, 108);
  drawCheckBox(context, panelX + 16, 128, true);
  context.fillText('Labels', panelX + 46, 137);
  drawCheckBox(context, panelX + 16, 158, false);
  context.fillText('Values', panelX + 46, 167);
  drawCheckBox(context, panelX + 16, 184, false);
  context.fillText('Stopwatch', panelX + 46, 193);
  context.restore();

  drawPanel(context, panelX, 222, 210, 144);
  context.save();
  context.fillStyle = '#111111';
  context.font = '14px sans-serif';
  context.textAlign = 'center';
  drawMeter(context, panelX + 58, 278, 'V');
  drawMeter(context, panelX + 154, 278, 'A');
  context.fillText('Voltmeter', panelX + 58, 342);
  context.fillText('Ammeter', panelX + 154, 342);
  context.restore();

  drawPanel(context, panelX, 380, 210, 150);
  context.save();
  context.fillStyle = '#f15a24';
  context.fillRect(panelX + 18, 392, 20, 20);
  context.fillStyle = '#ffffff';
  context.font = '700 20px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('−', panelX + 28, 402);
  context.fillStyle = '#111111';
  context.font = '18px sans-serif';
  context.textAlign = 'left';
  context.fillText('Advanced', panelX + 52, 402);
  context.font = '15px sans-serif';
  context.textAlign = 'center';
  context.fillText('Wire Resistivity', panelX + 105, 440);
  context.fillText('Source Resistance', panelX + 105, 498);

  [458, 516].forEach((y, index) => {
    context.strokeStyle = '#111111';
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(panelX + 34, y);
    context.lineTo(panelX + 176, y);
    context.stroke();
    context.fillStyle = '#ffffff';
    context.strokeStyle = '#333333';
    drawRoundedRect(context, panelX + 93 + index * 6, y - 13, 14, 26, 4);
    context.fill();
    context.stroke();
  });

  context.fillStyle = '#111111';
  context.font = '12px sans-serif';
  context.textAlign = 'left';
  context.fillText('tiny', panelX + 22, 458);
  context.fillText('tiny', panelX + 22, 516);
  context.textAlign = 'right';
  context.fillText('lots', panelX + 190, 458);
  context.fillText('10 Ω', panelX + 190, 516);
  context.restore();
}

function drawMeter(context: CanvasRenderingContext2D, x: number, y: number, label: string) {
  context.save();
  context.strokeStyle = '#333333';
  context.fillStyle = '#f19b32';
  context.lineWidth = 2;
  drawRoundedRect(context, x - 25, y - 34, 50, 42, 8);
  context.fill();
  context.stroke();
  context.fillStyle = '#f7f7f7';
  context.fillRect(x - 15, y - 22, 30, 12);
  context.fillStyle = '#111111';
  context.font = '10px sans-serif';
  context.textAlign = 'center';
  context.fillText(label === 'V' ? 'Voltage' : 'Current', x, y - 26);
  context.fillText(label, x, y - 13);
  context.beginPath();
  context.moveTo(x - 30, y + 4);
  context.lineTo(x - 52, y + 16);
  context.moveTo(x + 30, y + 4);
  context.lineTo(x + 52, y + 16);
  context.stroke();
  context.restore();
}

function drawMeasuringTool(
  context: CanvasRenderingContext2D,
  component: CircuitComponent,
  circuitValues: ReturnType<typeof calculateCircuitValues>
) {
  const centerX = component.x + component.width / 2;
  const centerY = component.y + component.height / 2;
  const isAmmeter = component.type === 'AMMETER';
  const measuredValue = circuitValues.meterReadings[component.id] ?? 0;
  const value = isAmmeter
    ? formatCurrent(measuredValue)
    : formatVoltage(measuredValue);

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.18)';
  context.shadowBlur = 10;
  context.shadowOffsetY = 4;
  context.fillStyle = '#f19b32';
  context.strokeStyle = '#2a2a2a';
  context.lineWidth = 3;
  drawRoundedRect(context, component.x + 18, component.y + 8, component.width - 36, 52, 10);
  context.fill();
  context.stroke();

  context.shadowColor = 'transparent';
  context.fillStyle = '#fff4de';
  context.fillRect(component.x + 38, component.y + 27, component.width - 76, 18);
  context.fillStyle = '#111111';
  context.font = '700 13px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(isAmmeter ? 'Current' : 'Voltage', centerX, component.y + 22);
  context.font = '700 14px sans-serif';
  context.fillText(value, centerX, component.y + 36);

  context.strokeStyle = '#333333';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(component.x + 16, centerY);
  context.lineTo(component.x, centerY + 13);
  context.moveTo(component.x + component.width - 16, centerY);
  context.lineTo(component.x + component.width, centerY + 13);
  context.stroke();

  context.fillStyle = '#111111';
  context.font = '14px sans-serif';
  context.fillText(isAmmeter ? 'Ammeter' : 'Voltmeter', centerX, component.y + component.height + 14);
  context.restore();
}

function drawCircuitWire(
  context: CanvasRenderingContext2D,
  components: CircuitComponent[],
  wire: CircuitWire
) {
  const start = getTerminalPoint(components, wire.from);
  const end = getTerminalPoint(components, wire.to);

  if (!start || !end) {
    return;
  }

  context.save();
  context.strokeStyle = '#7b3d2f';
  context.lineWidth = 7;
  context.lineCap = 'round';
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(end.x, end.y);
  context.stroke();

  context.strokeStyle = 'rgba(255, 226, 196, 0.55)';
  context.lineWidth = 2;
  context.stroke();
  context.restore();
}

function drawWirePreview(context: CanvasRenderingContext2D, components: CircuitComponent[], drag: WireDragState) {
  const start = getTerminalPoint(components, drag.from);

  if (!start) {
    return;
  }

  context.save();
  context.strokeStyle = 'rgba(123, 61, 47, 0.72)';
  context.lineWidth = 6;
  context.lineCap = 'round';
  context.setLineDash([10, 8]);
  context.beginPath();
  context.moveTo(start.x, start.y);
  context.lineTo(drag.point.x, drag.point.y);
  context.stroke();
  context.restore();
}

function drawComponentTerminals(context: CanvasRenderingContext2D, component: CircuitComponent) {
  const terminals = getTerminalPoints(component);

  context.save();

  (Object.keys(terminals) as TerminalKey[]).forEach((terminal) => {
    const point = terminals[terminal];
    context.fillStyle = '#6ab5df';
    context.strokeStyle = '#f4fbff';
    context.lineWidth = 2.5;
    context.beginPath();
    context.arc(point.x, point.y, 11, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = '#ffffff';
    context.font = '700 14px sans-serif';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText('-', point.x, point.y);
  });

  context.restore();
}

function drawSelectionFrame(context: CanvasRenderingContext2D, component: CircuitComponent) {
  const deleteBounds = getDeleteButtonBounds(component);

  context.save();
  context.strokeStyle = '#e94b45';
  context.lineWidth = 2;
  context.setLineDash([7, 7]);
  drawRoundedRect(
    context,
    component.x - 8,
    component.y - 8,
    component.width + 16,
    component.height + 16,
    14
  );
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = '#ffffff';
  context.strokeStyle = '#222222';
  context.lineWidth = 2;
  drawRoundedRect(
    context,
    deleteBounds.x,
    deleteBounds.y,
    deleteBounds.width,
    deleteBounds.height,
    5
  );
  context.fill();
  context.stroke();

  context.fillStyle = '#111111';
  context.font = '700 15px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(
    '×',
    deleteBounds.x + deleteBounds.width / 2,
    deleteBounds.y + deleteBounds.height / 2
  );
  context.restore();
}

function drawElectronDots(
  context: CanvasRenderingContext2D,
  components: CircuitComponent[],
  wires: CircuitWire[],
  circuitValues: ReturnType<typeof calculateCircuitValues>
) {
  if (!circuitValues.closedCircuit || circuitValues.current <= 0) {
    return;
  }

  context.save();
  context.fillStyle = 'rgba(70, 166, 220, 0.82)';
  context.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  context.lineWidth = 2;
  context.font = '700 14px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  wires.forEach((wire) => {
    const start = getTerminalPoint(components, wire.from);
    const end = getTerminalPoint(components, wire.to);

    if (!start || !end) {
      return;
    }

    const center = {
      x: start.x + (end.x - start.x) * 0.5,
      y: start.y + (end.y - start.y) * 0.5
    };

    context.beginPath();
    context.arc(center.x, center.y, 12, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = '#ffffff';
    context.fillText('-', center.x, center.y);
    context.fillStyle = 'rgba(70, 166, 220, 0.82)';
  });

  context.restore();
}

function drawBattery(context: CanvasRenderingContext2D, component: CircuitComponent) {
  const { x, y, width, height } = component;
  const terminalWidth = 16;

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.25)';
  context.shadowBlur = 12;
  context.shadowOffsetY = 5;

  context.fillStyle = '#111111';
  drawRoundedRect(context, x, y + 9, width * 0.55, height - 18, 8);
  context.fill();

  context.fillStyle = '#f2a13a';
  context.fillRect(x + width * 0.55, y + 9, width * 0.33, height - 18);

  context.fillStyle = '#f7d36b';
  drawRoundedRect(context, x + width - terminalWidth, y + 17, terminalWidth, height - 34, 4);
  context.fill();

  context.shadowColor = 'transparent';
  context.strokeStyle = '#222222';
  context.lineWidth = 3;
  drawRoundedRect(context, x, y + 9, width - terminalWidth / 2, height - 18, 8);
  context.stroke();

  context.fillStyle = '#ffffff';
  context.font = '700 24px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('-', x + 26, y + height / 2);
  context.fillText('+', x + width - 38, y + height / 2);

  context.strokeStyle = '#f05b4f';
  context.setLineDash([8, 9]);
  context.lineWidth = 2;
  drawRoundedRect(context, x - 16, y + 2, width + 32, height - 4, 22);
  context.stroke();
  context.setLineDash([]);

  context.fillStyle = '#111111';
  context.font = '14px sans-serif';
  context.fillText('Battery', x + width / 2, y + height + 24);
  context.restore();
}

function drawLightbulb(context: CanvasRenderingContext2D, component: CircuitComponent) {
  const { x, y, width, height } = component;
  const centerX = x + width / 2;
  const bulbCenterY = y + 44;

  context.save();
  const glow = context.createRadialGradient(centerX, bulbCenterY, 10, centerX, bulbCenterY, 74);
  glow.addColorStop(0, 'rgba(255, 239, 122, 0.9)');
  glow.addColorStop(0.6, 'rgba(255, 221, 83, 0.22)');
  glow.addColorStop(1, 'rgba(255, 221, 83, 0)');
  context.fillStyle = glow;
  context.beginPath();
  context.arc(centerX, bulbCenterY, 74, 0, Math.PI * 2);
  context.fill();

  context.fillStyle = 'rgba(255, 255, 240, 0.82)';
  context.strokeStyle = '#333333';
  context.lineWidth = 3;
  context.beginPath();
  context.arc(centerX, bulbCenterY, 36, 0, Math.PI * 2);
  context.fill();
  context.stroke();

  context.strokeStyle = '#d7744d';
  context.lineWidth = 3;
  context.beginPath();
  context.moveTo(centerX - 17, bulbCenterY + 4);
  context.quadraticCurveTo(centerX, bulbCenterY - 16, centerX + 17, bulbCenterY + 4);
  context.stroke();

  context.fillStyle = '#777777';
  context.fillRect(centerX - 18, bulbCenterY + 34, 36, 12);
  context.fillStyle = '#555555';
  context.fillRect(centerX - 16, bulbCenterY + 46, 32, 10);
  context.strokeStyle = '#222222';
  context.strokeRect(centerX - 18, bulbCenterY + 34, 36, 22);

  context.fillStyle = '#111111';
  context.font = '14px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText('Light Bulb', centerX, y + height - 10);
  context.restore();
}

function drawGenericCircuitComponent(
  context: CanvasRenderingContext2D,
  component: CircuitComponent
) {
  const centerX = component.x + component.width / 2;
  const centerY = component.y + component.height / 2;
  const label = getComponentLabel(component.type);

  context.save();
  context.shadowColor = 'rgba(0, 0, 0, 0.16)';
  context.shadowBlur = 10;
  context.shadowOffsetY = 4;
  context.strokeStyle = '#2a2a2a';
  context.fillStyle = '#fff8dc';
  context.lineWidth = 3;

  if (component.type === 'WIRE') {
    context.shadowBlur = 0;
    const gradient = context.createLinearGradient(
      component.x,
      centerY,
      component.x + component.width,
      centerY
    );
    gradient.addColorStop(0, '#6f2a1c');
    gradient.addColorStop(0.5, '#d28a70');
    gradient.addColorStop(1, '#6f2a1c');
    context.strokeStyle = gradient;
    context.lineWidth = 8;
    context.lineCap = 'round';
    context.beginPath();
    context.moveTo(component.x + 8, centerY);
    context.lineTo(component.x + component.width - 8, centerY);
    context.stroke();
  } else if (component.type === 'AC_VOLTAGE') {
    context.beginPath();
    context.arc(centerX, centerY - 10, 34, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.shadowColor = 'transparent';
    context.beginPath();
    context.moveTo(centerX - 22, centerY - 10);
    context.bezierCurveTo(centerX - 10, centerY - 38, centerX + 10, centerY + 18, centerX + 22, centerY - 10);
    context.strokeStyle = '#d0704f';
    context.stroke();
    context.fillStyle = '#111111';
    context.font = '700 17px sans-serif';
    context.fillText('+', centerX, centerY - 34);
    context.fillText('-', centerX, centerY + 18);
  } else if (component.type === 'RESISTOR') {
    const gradient = context.createLinearGradient(
      component.x,
      component.y,
      component.x + component.width,
      component.y + component.height
    );
    gradient.addColorStop(0, '#a76b38');
    gradient.addColorStop(0.5, '#e6c087');
    gradient.addColorStop(1, '#a76b38');
    context.fillStyle = gradient;
    drawRoundedRect(context, component.x + 18, component.y + 14, component.width - 36, 28, 14);
    context.fill();
    context.stroke();
    context.shadowColor = 'transparent';
    context.fillStyle = '#111111';
    context.fillRect(centerX - 25, component.y + 14, 5, 28);
    context.fillRect(centerX - 4, component.y + 14, 5, 28);
    context.fillStyle = '#d9c13f';
    context.fillRect(centerX + 24, component.y + 14, 5, 28);
  } else if (component.type === 'CAPACITOR') {
    context.shadowColor = 'transparent';
    context.beginPath();
    context.moveTo(component.x + 8, centerY);
    context.lineTo(centerX - 14, centerY);
    context.moveTo(centerX + 14, centerY);
    context.lineTo(component.x + component.width - 8, centerY);
    context.moveTo(centerX - 14, component.y + 12);
    context.lineTo(centerX - 14, component.y + component.height - 12);
    context.moveTo(centerX + 14, component.y + 12);
    context.lineTo(centerX + 14, component.y + component.height - 12);
    context.stroke();
  } else if (component.type === 'INDUCTOR') {
    context.shadowColor = 'transparent';
    context.beginPath();
    context.moveTo(component.x + 8, centerY);
    context.lineTo(component.x + 26, centerY);
    context.stroke();

    for (let index = 0; index < 6; index += 1) {
      context.beginPath();
      context.arc(component.x + 38 + index * 14, centerY, 10, Math.PI, 0);
      context.stroke();
    }

    context.beginPath();
    context.moveTo(component.x + component.width - 26, centerY);
    context.lineTo(component.x + component.width - 8, centerY);
    context.stroke();
  } else if (component.type === 'SWITCH') {
    context.shadowColor = 'transparent';
    context.beginPath();
    context.moveTo(component.x + 10, centerY + 14);
    context.lineTo(centerX - 18, centerY + 14);
    context.moveTo(centerX + 18, centerY + 14);
    context.lineTo(component.x + component.width - 10, centerY + 14);
    context.moveTo(centerX - 14, centerY + 12);
    context.lineTo(centerX + 24, centerY - 18);
    context.stroke();
    context.beginPath();
    context.arc(centerX - 18, centerY + 14, 6, 0, Math.PI * 2);
    context.stroke();
  }

  context.shadowColor = 'transparent';
  context.fillStyle = '#111111';
  context.font = '14px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(label, centerX, component.y + component.height + 16);
  context.restore();
}

function drawBottomControls(context: CanvasRenderingContext2D, size: CanvasSize) {
  context.save();
  context.fillStyle = '#111111';
  context.font = '18px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.fillText(
    'Drag tools to add. Drag terminal dots to wire. Use meters to measure.',
    size.width / 2,
    size.height - 34
  );

  const pauseX = size.width - 210;
  const playX = size.width - 150;
  const resetX = size.width - 70;

  context.fillStyle = '#d8efff';
  context.strokeStyle = '#6b8bad';
  context.lineWidth = 2;
  context.beginPath();
  context.arc(pauseX, size.height - 42, 28, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#111111';
  context.fillRect(pauseX - 9, size.height - 58, 6, 32);
  context.fillRect(pauseX + 5, size.height - 58, 6, 32);

  context.fillStyle = '#eeeeee';
  context.beginPath();
  context.arc(playX, size.height - 42, 22, 0, Math.PI * 2);
  context.fill();
  context.stroke();
  context.fillStyle = '#999999';
  context.beginPath();
  context.moveTo(playX - 5, size.height - 54);
  context.lineTo(playX + 12, size.height - 42);
  context.lineTo(playX - 5, size.height - 30);
  context.closePath();
  context.fill();

  context.fillStyle = '#f6a12d';
  context.beginPath();
  context.arc(resetX, size.height - 42, 30, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = '#c87a1c';
  context.stroke();
  context.strokeStyle = '#ffffff';
  context.lineWidth = 6;
  context.beginPath();
  context.arc(resetX, size.height - 42, 14, 0.3, Math.PI * 1.65);
  context.stroke();
  context.restore();
}

function drawComponent(
  context: CanvasRenderingContext2D,
  component: CircuitComponent,
  circuitValues: ReturnType<typeof calculateCircuitValues>
) {
  if (component.type === 'BATTERY') {
    drawBattery(context, component);
  } else if (component.type === 'LIGHTBULB') {
    drawLightbulb(context, component);
  } else if (component.type === 'VOLTMETER' || component.type === 'AMMETER') {
    drawMeasuringTool(context, component, circuitValues);
  } else {
    drawGenericCircuitComponent(context, component);
  }
}

function drawSourcePreview(
  context: CanvasRenderingContext2D,
  type: CircuitComponentType,
  point: Point,
  circuitValues: ReturnType<typeof calculateCircuitValues>
) {
  const size = componentSizes[type];
  const previewComponent = createCircuitComponent(
    type,
    'source-preview',
    point.x - size.width / 2,
    point.y - size.height / 2
  );

  context.save();
  context.globalAlpha = 0.62;
  drawComponent(context, previewComponent, circuitValues);
  context.restore();
}

export default function CircuitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const sourceDragRef = useRef<SourceDragState | null>(null);
  const wireDragRef = useRef<WireDragState | null>(null);
  const resizeFrameRef = useRef<ResizeFrame>({
    id: null
  });
  const [isDragging, setIsDragging] = useState(false);
  const [selectedComponentId, setSelectedComponentId] = useState<string | null>(null);
  const [sourcePreviewPoint, setSourcePreviewPoint] = useState<Point | null>(null);
  const [wirePreviewPoint, setWirePreviewPoint] = useState<Point | null>(null);

  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => getInitialCanvasSize());
  const [circuitState, setCircuitState] = useState<CircuitState>(() => {
    const initialSize = getInitialCanvasSize();

    return {
      components: createInitialComponents(initialSize.width, initialSize.height),
      wires: []
    };
  });

  const updateCanvasSize = useCallback(() => {
    const container = containerRef.current;
    const width = container?.clientWidth || window.innerWidth;
    const height = container?.clientHeight || window.innerHeight;

    setCanvasSize({ width, height });
  }, []);

  useEffect(() => {
    updateCanvasSize();

    const handleResize = () => {
      if (resizeFrameRef.current.id !== null) {
        return;
      }

      resizeFrameRef.current.id = window.requestAnimationFrame(() => {
        resizeFrameRef.current.id = null;
        updateCanvasSize();
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);

      if (resizeFrameRef.current.id !== null) {
        window.cancelAnimationFrame(resizeFrameRef.current.id);
      }
    };
  }, [updateCanvasSize]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedComponentId || (event.key !== 'Delete' && event.key !== 'Backspace')) {
        return;
      }

      event.preventDefault();
      setCircuitState((currentState) => ({
        components: currentState.components.filter((component) => component.id !== selectedComponentId),
        wires: currentState.wires.filter((wire) => (
          wire.from.componentId !== selectedComponentId && wire.to.componentId !== selectedComponentId
        ))
      }));
      setSelectedComponentId(null);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedComponentId]);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas || canvasSize.width === 0 || canvasSize.height === 0) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const pixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvasSize.width * pixelRatio;
    canvas.height = canvasSize.height * pixelRatio;
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.clearRect(0, 0, canvasSize.width, canvasSize.height);
    drawWorkspaceBackground(context, canvasSize);
    drawToolShelf(context, canvasSize.height);
    drawControlPanels(context, canvasSize.width);
    const circuitValues = calculateCircuitValues(circuitState.components, circuitState.wires);

    circuitState.wires.forEach((wire) => {
      drawCircuitWire(context, circuitState.components, wire);
    });

    circuitState.components.forEach((component) => {
      drawComponent(context, component, circuitValues);
      drawComponentTerminals(context, component);
    });
    drawElectronDots(context, circuitState.components, circuitState.wires, circuitValues);

    if (wireDragRef.current) {
      drawWirePreview(context, circuitState.components, wireDragRef.current);
    }

    const selectedComponent = circuitState.components.find(
      (component) => component.id === selectedComponentId
    );

    if (selectedComponent) {
      drawSelectionFrame(context, selectedComponent);
    }

    if (sourceDragRef.current && sourcePreviewPoint) {
      drawSourcePreview(
        context,
        sourceDragRef.current.type,
        sourcePreviewPoint,
        circuitValues
      );
    }

    drawBottomControls(context, canvasSize);
  }, [canvasSize, circuitState, selectedComponentId, sourcePreviewPoint, wirePreviewPoint]);

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const point = getCanvasPoint(event, canvas);
    const activeComponent = circuitState.components.find(
      (component) => component.id === selectedComponentId
    );

    if (
      activeComponent &&
      isPointInsideRect(point.x, point.y, getDeleteButtonBounds(activeComponent))
    ) {
      setCircuitState((currentState) => ({
        components: currentState.components.filter((component) => component.id !== activeComponent.id),
        wires: currentState.wires.filter((wire) => (
          wire.from.componentId !== activeComponent.id && wire.to.componentId !== activeComponent.id
        ))
      }));
      setSelectedComponentId(null);
      return;
    }

    const shelfType = getShelfItemAtPoint(point.x, point.y, canvasSize.height);
    const meterType = getMeterToolAtPoint(point.x, point.y, canvasSize.width);
    const sourceType = shelfType ?? meterType;

    if (sourceType) {
      sourceDragRef.current = {
        type: sourceType
      };
      setSourcePreviewPoint(point);
      setSelectedComponentId(null);
      setIsDragging(true);
      return;
    }

    const terminal = getTerminalAtPoint(point.x, point.y, circuitState.components);

    if (terminal) {
      wireDragRef.current = {
        from: terminal,
        point
      };
      setWirePreviewPoint(point);
      setSelectedComponentId(null);
      setIsDragging(true);
      return;
    }

    const hitComponent = [...circuitState.components]
      .reverse()
      .find((component) => isPointInsideComponent(point.x, point.y, component));

    if (!hitComponent) {
      setSelectedComponentId(null);
      return;
    }

    setSelectedComponentId(hitComponent.id);
    dragRef.current = {
      id: hitComponent.id,
      offsetX: point.x - hitComponent.x,
      offsetY: point.y - hitComponent.y
    };
    setIsDragging(true);
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const dragState = dragRef.current;
    const sourceDragState = sourceDragRef.current;
    const wireDragState = wireDragRef.current;

    if (!canvas) {
      return;
    }

    const point = getCanvasPoint(event, canvas);

    if (sourceDragState) {
      setSourcePreviewPoint(point);
      return;
    }

    if (wireDragState) {
      wireDragRef.current = {
        ...wireDragState,
        point
      };
      setWirePreviewPoint(point);
      return;
    }

    if (!dragState) {
      return;
    }

    setCircuitState((currentState) => ({
      components: currentState.components.map((component) => {
        if (component.id !== dragState.id) {
          return component;
        }

        return {
          ...component,
          x: point.x - dragState.offsetX,
          y: point.y - dragState.offsetY
        };
      }),
      wires: currentState.wires
    }));
  };

  const handleMouseUp = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const sourceDragState = sourceDragRef.current;
    const wireDragState = wireDragRef.current;

    if (canvas && wireDragState) {
      const point = getCanvasPoint(event, canvas);
      const targetTerminal = getTerminalAtPoint(point.x, point.y, circuitState.components);

      if (
        targetTerminal &&
        !isSameEndpoint(wireDragState.from, targetTerminal) &&
        !isDuplicateWire(circuitState.wires, wireDragState.from, targetTerminal)
      ) {
        const newWire = {
          id: makeComponentId('WIRE'),
          from: wireDragState.from,
          to: targetTerminal
        };

        setCircuitState((currentState) => ({
          components: currentState.components,
          wires: [...currentState.wires, newWire]
        }));
      }
    }

    if (canvas && sourceDragState) {
      const point = getCanvasPoint(event, canvas);

      if (!isSourceArea(point.x, point.y, canvasSize)) {
        const size = componentSizes[sourceDragState.type];
        const newComponent = createCircuitComponent(
          sourceDragState.type,
          makeComponentId(sourceDragState.type),
          point.x - size.width / 2,
          point.y - size.height / 2
        );

        setCircuitState((currentState) => ({
          components: [...currentState.components, newComponent],
          wires: currentState.wires
        }));
        setSelectedComponentId(newComponent.id);
      }
    }

    wireDragRef.current = null;
    setWirePreviewPoint(null);
    sourceDragRef.current = null;
    setSourcePreviewPoint(null);
    dragRef.current = null;
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    wireDragRef.current = null;
    setWirePreviewPoint(null);
    sourceDragRef.current = null;
    setSourcePreviewPoint(null);
    dragRef.current = null;
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden'
      }}
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
      />
    </div>
  );
}
