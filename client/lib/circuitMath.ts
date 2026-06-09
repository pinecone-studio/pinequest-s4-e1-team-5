export type CircuitPartType = "battery" | "wire" | "resistor" | "bulb" | "switch";

export type CircuitTerminalId = "a" | "b";

export type CircuitPart = {
  id: string;
  type: CircuitPartType;
  x: number;
  y: number;
  rotation: 0 | 90 | 180 | 270;
  closed?: boolean;
};

export type CircuitWire = {
  id: string;
  from: string;
  to: string;
};

export function calculateCurrent(voltage: number, resistance: number) {
  if (resistance <= 0) {
    return 0;
  }
  return voltage / resistance;
}

export function calculateTotalResistance(parts: CircuitPart[], baseResistance: number) {
  const resistorCount = parts.filter((part) => part.type === "resistor").length;
  const bulbCount = parts.filter((part) => part.type === "bulb").length;
  return Math.max(0.5, baseResistance + bulbCount * 1.5 + Math.max(0, resistorCount - 1) * 1.5);
}

export function getBulbBrightness(current: number) {
  return Math.min(1, Math.max(0, current / 2.5));
}

export function terminalKey(partId: string, terminalId: CircuitTerminalId) {
  return `${partId}:${terminalId}`;
}

export function splitTerminalKey(key: string) {
  const [partId, terminalId] = key.split(":") as [string, CircuitTerminalId];
  return { partId, terminalId };
}

export function isCircuitClosed(parts: CircuitPart[], wires: CircuitWire[]) {
  const battery = parts.find((part) => part.type === "battery");
  if (!battery) {
    return false;
  }

  const graph = new Map<string, Set<string>>();
  const addEdge = (from: string, to: string) => {
    if (!graph.has(from)) {
      graph.set(from, new Set());
    }
    if (!graph.has(to)) {
      graph.set(to, new Set());
    }
    graph.get(from)?.add(to);
    graph.get(to)?.add(from);
  };

  for (const wire of wires) {
    addEdge(wire.from, wire.to);
  }

  for (const part of parts) {
    if (part.type === "battery") {
      continue;
    }
    if (part.type === "switch" && !part.closed) {
      continue;
    }
    addEdge(terminalKey(part.id, "a"), terminalKey(part.id, "b"));
  }

  const start = terminalKey(battery.id, "a");
  const target = terminalKey(battery.id, "b");
  const seen = new Set<string>();
  const stack = [start];

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current || seen.has(current)) {
      continue;
    }
    if (current === target) {
      return true;
    }
    seen.add(current);
    for (const next of graph.get(current) ?? []) {
      stack.push(next);
    }
  }

  return false;
}
