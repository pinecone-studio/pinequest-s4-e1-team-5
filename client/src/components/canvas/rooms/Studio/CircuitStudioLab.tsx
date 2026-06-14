import { useMemo, useRef, useState, type CSSProperties, type PointerEvent } from 'react';

type ComponentKind =
  | 'battery'
  | 'ac'
  | 'bulb'
  | 'resistor'
  | 'capacitor'
  | 'inductor'
  | 'switch';

type LabComponent = {
  id: string;
  kind: ComponentKind;
  x: number;
  y: number;
  closed?: boolean;
};

type Wire = {
  id: string;
  from: TerminalRef;
  to: TerminalRef;
};

type TerminalRef = {
  componentId: string;
  side: 'left' | 'right';
};

const PALETTE: Array<{
  kind: ComponentKind;
  label: string;
  symbol: string;
}> = [
  { kind: 'battery', label: 'Battery', symbol: '+-' },
  { kind: 'ac', label: 'AC Voltage', symbol: '~' },
  { kind: 'bulb', label: 'Light Bulb', symbol: '◎' },
  { kind: 'resistor', label: 'Resistor', symbol: '▭' },
  { kind: 'capacitor', label: 'Capacitor', symbol: '||' },
  { kind: 'inductor', label: 'Inductor', symbol: 'coil' },
  { kind: 'switch', label: 'Switch', symbol: '/' }
];

const INITIAL_COMPONENTS: LabComponent[] = [
  { id: 'battery-1', kind: 'battery', x: 265, y: 330 },
  { id: 'switch-1', kind: 'switch', x: 430, y: 330, closed: true },
  { id: 'bulb-1', kind: 'bulb', x: 595, y: 330 },
  { id: 'resistor-1', kind: 'resistor', x: 430, y: 470 }
];

const INITIAL_WIRES: Wire[] = [
  {
    id: 'wire-1',
    from: { componentId: 'battery-1', side: 'right' },
    to: { componentId: 'switch-1', side: 'left' }
  },
  {
    id: 'wire-2',
    from: { componentId: 'switch-1', side: 'right' },
    to: { componentId: 'bulb-1', side: 'left' }
  },
  {
    id: 'wire-3',
    from: { componentId: 'bulb-1', side: 'right' },
    to: { componentId: 'battery-1', side: 'left' }
  }
];

const workspaceStyle: CSSProperties = {
  position: 'relative',
  flex: 1,
  overflow: 'hidden',
  minWidth: 0,
  background:
    'linear-gradient(rgba(255,255,255,0.42) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.42) 1px, transparent 1px), #9ec4f4',
  backgroundSize: '34px 34px',
  border: '2px solid rgba(22, 22, 22, 0.78)',
  boxShadow: '5px 6px 0 rgba(16, 16, 16, 0.14)'
};

const panelStyle: CSSProperties = {
  background: 'rgba(250, 250, 246, 0.92)',
  border: '2px solid rgba(22, 22, 22, 0.78)',
  boxShadow: '4px 5px 0 rgba(16, 16, 16, 0.12)',
  color: '#161616'
};

function terminalKey(terminal: TerminalRef) {
  return `${terminal.componentId}:${terminal.side}`;
}

function componentTitle(kind: ComponentKind) {
  return PALETTE.find((item) => item.kind === kind)?.label ?? kind;
}

function getTerminalPosition(component: LabComponent, side: 'left' | 'right') {
  return {
    x: component.x + (side === 'left' ? 0 : 104),
    y: component.y + 38
  };
}

function getWirePath(from: { x: number; y: number }, to: { x: number; y: number }) {
  const midX = (from.x + to.x) / 2;
  return `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
}

function isCircuitPowered(components: LabComponent[], wires: Wire[]) {
  const source = components.find((item) => item.kind === 'battery' || item.kind === 'ac');
  const bulb = components.find((item) => item.kind === 'bulb');

  if (!source || !bulb) {
    return false;
  }

  const hasOpenSwitch = components.some((item) => item.kind === 'switch' && !item.closed);

  if (hasOpenSwitch) {
    return false;
  }

  const graph = new Map<string, Set<string>>();

  function connect(a: string, b: string) {
    if (!graph.has(a)) graph.set(a, new Set());
    if (!graph.has(b)) graph.set(b, new Set());
    graph.get(a)?.add(b);
    graph.get(b)?.add(a);
  }

  components.forEach((item) => {
    connect(
      terminalKey({ componentId: item.id, side: 'left' }),
      terminalKey({ componentId: item.id, side: 'right' })
    );
  });

  wires.forEach((wire) => connect(terminalKey(wire.from), terminalKey(wire.to)));

  const start = terminalKey({ componentId: source.id, side: 'left' });
  const targets = new Set([
    terminalKey({ componentId: bulb.id, side: 'left' }),
    terminalKey({ componentId: bulb.id, side: 'right' })
  ]);
  const seen = new Set<string>();
  const queue = [start];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current)) continue;
    seen.add(current);
    graph.get(current)?.forEach((next) => {
      if (!seen.has(next)) queue.push(next);
    });
  }

  return [...targets].some((target) => seen.has(target));
}

function CircuitIcon({ kind, powered, closed }: { kind: ComponentKind; powered: boolean; closed?: boolean }) {
  if (kind === 'bulb') {
    return (
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          border: '3px solid #202020',
          background: powered ? '#ffd84e' : 'rgba(255,255,255,0.62)',
          boxShadow: powered ? '0 0 18px rgba(255, 204, 39, 0.82)' : 'none',
          display: 'grid',
          placeItems: 'center',
          fontSize: 23
        }}
      >
        ✦
      </div>
    );
  }

  if (kind === 'switch') {
    return (
      <div style={{ width: 64, height: 34, position: 'relative' }}>
        <span
          style={{
            position: 'absolute',
            left: 4,
            bottom: 5,
            width: 15,
            height: 15,
            borderRadius: '50%',
            border: '3px solid #202020'
          }}
        />
        <span
          style={{
            position: 'absolute',
            right: 4,
            bottom: 5,
            width: 15,
            height: 15,
            borderRadius: '50%',
            border: '3px solid #202020'
          }}
        />
        <span
          style={{
            position: 'absolute',
            left: 18,
            bottom: 15,
            width: 36,
            height: 4,
            background: '#202020',
            transformOrigin: 'left center',
            transform: closed ? 'rotate(0deg)' : 'rotate(-28deg)'
          }}
        />
      </div>
    );
  }

  if (kind === 'resistor') {
    return <div style={{ fontSize: 34, fontWeight: 700 }}>Ω</div>;
  }

  if (kind === 'capacitor') {
    return <div style={{ fontSize: 32, fontWeight: 700 }}>||</div>;
  }

  if (kind === 'inductor') {
    return <div style={{ fontSize: 20, fontWeight: 700 }}>coil</div>;
  }

  return <div style={{ fontSize: 32, fontWeight: 700 }}>{kind === 'ac' ? '~' : '+-'}</div>;
}

function ComponentCard({
  component,
  powered,
  selectedTerminal,
  onTerminalClick,
  onDrag,
  onRemove,
  onToggleSwitch,
  showLabels
}: {
  component: LabComponent;
  powered: boolean;
  selectedTerminal: TerminalRef | null;
  onTerminalClick: (terminal: TerminalRef) => void;
  onDrag: (componentId: string, x: number, y: number) => void;
  onRemove: (componentId: string) => void;
  onToggleSwitch: (componentId: string) => void;
  showLabels: boolean;
}) {
  const dragOffset = useRef({ x: 0, y: 0 });

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest('button')) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    dragOffset.current = {
      x: event.clientX - (rect?.left ?? 0) - component.x,
      y: event.clientY - (rect?.top ?? 0) - component.y
    };
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const rect = event.currentTarget.parentElement?.getBoundingClientRect();
    const nextX = event.clientX - (rect?.left ?? 0) - dragOffset.current.x;
    const nextY = event.clientY - (rect?.top ?? 0) - dragOffset.current.y;
    onDrag(component.id, Math.max(120, Math.min(nextX, 850)), Math.max(55, Math.min(nextY, 610)));
  }

  return (
    <div
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      style={{
        position: 'absolute',
        left: component.x,
        top: component.y,
        width: 104,
        minHeight: 76,
        display: 'grid',
        placeItems: 'center',
        cursor: 'grab',
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {(['left', 'right'] as const).map((side) => {
        const isSelected =
          selectedTerminal?.componentId === component.id && selectedTerminal.side === side;
        return (
          <button
            key={side}
            aria-label={`${componentTitle(component.kind)} ${side} terminal`}
            onClick={(event) => {
              event.stopPropagation();
              onTerminalClick({ componentId: component.id, side });
            }}
            style={{
              position: 'absolute',
              left: side === 'left' ? -10 : undefined,
              right: side === 'right' ? -10 : undefined,
              top: 27,
              width: 22,
              height: 22,
              borderRadius: '50%',
              border: '2px solid #202020',
              background: isSelected ? '#eb4d3d' : '#78c7df',
              boxShadow: isSelected ? '0 0 0 4px rgba(235, 77, 61, 0.18)' : 'none',
              cursor: 'crosshair'
            }}
            type="button"
          />
        );
      })}

      <div
        style={{
          minWidth: 86,
          minHeight: 64,
          border: '2px solid rgba(22,22,22,0.76)',
          background: 'rgba(250,250,246,0.75)',
          display: 'grid',
          placeItems: 'center',
          borderRadius: 8,
          boxShadow: '2px 3px 0 rgba(16,16,16,0.1)'
        }}
      >
        <CircuitIcon kind={component.kind} powered={powered} closed={component.closed} />
      </div>
      {showLabels ? (
        <small style={{ marginTop: 2, fontSize: 11 }}>{componentTitle(component.kind)}</small>
      ) : null}
      {component.kind === 'switch' ? (
        <button
          onClick={() => onToggleSwitch(component.id)}
          style={{
            marginTop: 2,
            border: '1px solid #202020',
            background: 'rgba(255,255,255,0.78)',
            font: 'inherit',
            cursor: 'pointer'
          }}
          type="button"
        >
          {component.closed ? 'open' : 'close'}
        </button>
      ) : null}
      <button
        aria-label={`Remove ${componentTitle(component.kind)}`}
        onClick={() => onRemove(component.id)}
        style={{
          position: 'absolute',
          right: -12,
          top: -10,
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: '1px solid #202020',
          background: 'rgba(255,255,255,0.86)',
          cursor: 'pointer'
        }}
        type="button"
      >
        ×
      </button>
    </div>
  );
}

export default function CircuitStudioLab() {
  const [components, setComponents] = useState(INITIAL_COMPONENTS);
  const [wires, setWires] = useState(INITIAL_WIRES);
  const [selectedTerminal, setSelectedTerminal] = useState<TerminalRef | null>(null);
  const [showCurrent, setShowCurrent] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [isRunning, setIsRunning] = useState(true);
  const [voltage, setVoltage] = useState(9);
  const powered = isRunning && isCircuitPowered(components, wires);
  const componentMap = useMemo(
    () => new Map(components.map((component) => [component.id, component])),
    [components]
  );
  const current = powered ? voltage / 18 : 0;

  function addComponent(kind: ComponentKind) {
    const nextIndex = components.filter((component) => component.kind === kind).length + 1;
    setComponents((currentComponents) => [
      ...currentComponents,
      {
        id: `${kind}-${Date.now()}`,
        kind,
        x: 260 + (nextIndex % 4) * 120,
        y: 160 + (nextIndex % 3) * 96,
        closed: kind === 'switch' ? true : undefined
      }
    ]);
  }

  function clearLab() {
    setComponents([]);
    setWires([]);
    setSelectedTerminal(null);
  }

  function resetLab() {
    setComponents(INITIAL_COMPONENTS);
    setWires(INITIAL_WIRES);
    setSelectedTerminal(null);
    setIsRunning(true);
  }

  function handleTerminalClick(terminal: TerminalRef) {
    if (!selectedTerminal) {
      setSelectedTerminal(terminal);
      return;
    }

    if (terminalKey(selectedTerminal) === terminalKey(terminal)) {
      setSelectedTerminal(null);
      return;
    }

    setWires((currentWires) => [
      ...currentWires,
      {
        id: `wire-${Date.now()}`,
        from: selectedTerminal,
        to: terminal
      }
    ]);
    setSelectedTerminal(null);
  }

  function removeComponent(componentId: string) {
    setComponents((currentComponents) =>
      currentComponents.filter((component) => component.id !== componentId)
    );
    setWires((currentWires) =>
      currentWires.filter(
        (wire) => wire.from.componentId !== componentId && wire.to.componentId !== componentId
      )
    );
  }

  return (
    <section
      aria-label="Circuit Studio virtual lab"
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        gap: 12,
        padding: '1rem',
        boxSizing: 'border-box',
        fontFamily: '"Cabin Sketch", "Comic Sans MS", cursive',
        background: 'rgba(245, 245, 241, 0.36)',
        pointerEvents: 'auto'
      }}
    >
      <aside
        style={{
          ...panelStyle,
          width: 116,
          display: 'grid',
          gridTemplateRows: 'auto 1fr auto',
          gap: 10,
          padding: '0.55rem'
        }}
      >
        <strong style={{ fontSize: 16, lineHeight: 1 }}>Parts</strong>
        <div style={{ display: 'grid', gap: 8, alignContent: 'start' }}>
          {PALETTE.map((item) => (
            <button
              key={item.kind}
              onClick={() => addComponent(item.kind)}
              style={{
                display: 'grid',
                justifyItems: 'center',
                gap: 3,
                border: '1.5px solid rgba(22,22,22,0.68)',
                background: 'rgba(255,255,255,0.72)',
                color: '#161616',
                font: 'inherit',
                fontSize: 12,
                padding: '0.34rem 0.2rem',
                cursor: 'pointer'
              }}
              type="button"
            >
              <span style={{ fontSize: 18, fontWeight: 700 }}>{item.symbol}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
        <div style={{ display: 'grid', gap: 7 }}>
          <button onClick={resetLab} style={{ font: 'inherit', cursor: 'pointer' }} type="button">
            Reset
          </button>
          <button onClick={clearLab} style={{ font: 'inherit', cursor: 'pointer' }} type="button">
            Clear
          </button>
        </div>
      </aside>

      <div style={workspaceStyle}>
        <svg
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        >
          {wires.map((wire) => {
            const fromComponent = componentMap.get(wire.from.componentId);
            const toComponent = componentMap.get(wire.to.componentId);
            if (!fromComponent || !toComponent) return null;
            const from = getTerminalPosition(fromComponent, wire.from.side);
            const to = getTerminalPosition(toComponent, wire.to.side);
            const path = getWirePath(from, to);

            return (
              <g key={wire.id}>
                <path
                  d={path}
                  fill="none"
                  stroke={powered ? '#eb3b2f' : '#202020'}
                  strokeWidth={5}
                  strokeLinecap="round"
                />
                {showCurrent && powered ? (
                  <circle r="5" fill="#4bc5f2">
                    <animateMotion dur="1.2s" repeatCount="indefinite" path={path} />
                  </circle>
                ) : null}
              </g>
            );
          })}
        </svg>

        {components.map((component) => (
          <ComponentCard
            key={component.id}
            component={component}
            onDrag={(componentId, x, y) => {
              setComponents((currentComponents) =>
                currentComponents.map((item) =>
                  item.id === componentId ? { ...item, x, y } : item
                )
              );
            }}
            onRemove={removeComponent}
            onTerminalClick={handleTerminalClick}
            onToggleSwitch={(componentId) => {
              setComponents((currentComponents) =>
                currentComponents.map((item) =>
                  item.id === componentId ? { ...item, closed: !item.closed } : item
                )
              );
            }}
            powered={powered}
            selectedTerminal={selectedTerminal}
            showLabels={showLabels}
          />
        ))}

        <div
          style={{
            ...panelStyle,
            position: 'absolute',
            left: '50%',
            bottom: 16,
            transform: 'translateX(-50%) rotate(-0.35deg)',
            padding: '0.45rem 0.8rem',
            fontSize: 18
          }}
        >
          {selectedTerminal ? 'Tap another terminal to draw wire.' : 'Drag parts. Tap terminals to wire.'}
        </div>
      </div>

      <aside
        style={{
          width: 248,
          display: 'grid',
          gap: 12,
          alignContent: 'start'
        }}
      >
        <div style={{ ...panelStyle, padding: '0.72rem', display: 'grid', gap: 8 }}>
          <label>
            <input
              checked={showCurrent}
              onChange={(event) => setShowCurrent(event.target.checked)}
              type="checkbox"
            />{' '}
            Show Current
          </label>
          <label>
            <input
              checked={showLabels}
              onChange={(event) => setShowLabels(event.target.checked)}
              type="checkbox"
            />{' '}
            Labels
          </label>
          <label>
            <input
              checked={showValues}
              onChange={(event) => setShowValues(event.target.checked)}
              type="checkbox"
            />{' '}
            Values
          </label>
          {showValues ? (
            <label style={{ display: 'grid', gap: 4 }}>
              Voltage: {voltage} V
              <input
                max="18"
                min="1"
                onChange={(event) => setVoltage(Number(event.target.value))}
                type="range"
                value={voltage}
              />
            </label>
          ) : null}
        </div>

        <div style={{ ...panelStyle, padding: '0.72rem', display: 'grid', gap: 8 }}>
          <strong>Meter</strong>
          <div
            style={{
              border: '2px solid #202020',
              borderRadius: 10,
              background: '#f69320',
              padding: '0.8rem',
              textAlign: 'center',
              fontFamily: 'Inter, system-ui, sans-serif'
            }}
          >
            <small>Current</small>
            <div style={{ fontSize: 28, fontWeight: 700 }}>{current.toFixed(2)} A</div>
          </div>
          <div style={{ fontSize: 13 }}>
            {showLabels
              ? powered
                ? 'Circuit is closed. The bulb lights up.'
                : 'Circuit is open. Connect a source and bulb with wires.'
              : null}
          </div>
        </div>

        <div style={{ ...panelStyle, padding: '0.72rem', display: 'grid', gap: 8 }}>
          <strong>Voltage chart</strong>
          <svg viewBox="0 0 220 120" style={{ width: '100%', height: 126, background: '#fff' }}>
            <path d="M 25 12 V 100 H 210" fill="none" stroke="#202020" strokeWidth="2" />
            {[0, 1, 2, 3].map((tick) => (
              <line
                key={tick}
                x1="25"
                x2="210"
                y1={28 + tick * 20}
                y2={28 + tick * 20}
                stroke="#d6d6d6"
              />
            ))}
            <path
              d={
                powered
                  ? 'M 28 58 C 48 22, 68 22, 88 58 S 128 94, 148 58 S 188 22, 208 58'
                  : 'M 28 58 H 208'
              }
              fill="none"
              stroke="#2d7fc8"
              strokeWidth="3"
            />
          </svg>
        </div>

        <button
          onClick={() => setIsRunning((current) => !current)}
          style={{
            ...panelStyle,
            padding: '0.74rem',
            font: 'inherit',
            fontSize: 18,
            cursor: 'pointer'
          }}
          type="button"
        >
          {isRunning ? 'Pause' : 'Run'}
        </button>
      </aside>
    </section>
  );
}
