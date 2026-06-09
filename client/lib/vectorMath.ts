export type Vector2 = {
  x: number;
  y: number;
};

export type PolarVector = {
  magnitude: number;
  angle: number;
};

export function magnitude(vector: Vector2) {
  return Math.hypot(vector.x, vector.y);
}

export function angleDeg(vector: Vector2) {
  const angle = (Math.atan2(vector.y, vector.x) * 180) / Math.PI;
  return normalizeAngle(angle);
}

export function addVectors(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x + b.x,
    y: a.y + b.y,
  };
}

export function subtractVectors(a: Vector2, b: Vector2): Vector2 {
  return {
    x: a.x - b.x,
    y: a.y - b.y,
  };
}

export function scaleVector(vector: Vector2, scalar: number): Vector2 {
  return {
    x: vector.x * scalar,
    y: vector.y * scalar,
  };
}

export function dotProduct(a: Vector2, b: Vector2) {
  return a.x * b.x + a.y * b.y;
}

export function toPolar(vector: Vector2): PolarVector {
  return {
    magnitude: magnitude(vector),
    angle: angleDeg(vector),
  };
}

export function fromPolar(polar: PolarVector): Vector2 {
  const radians = (polar.angle * Math.PI) / 180;
  return {
    x: polar.magnitude * Math.cos(radians),
    y: polar.magnitude * Math.sin(radians),
  };
}

export function mathToScreen(
  vector: Vector2,
  origin: Vector2,
  scale: number,
): Vector2 {
  return {
    x: origin.x + vector.x * scale,
    y: origin.y - vector.y * scale,
  };
}

export function screenToMath(
  point: Vector2,
  origin: Vector2,
  scale: number,
): Vector2 {
  return {
    x: (point.x - origin.x) / scale,
    y: (origin.y - point.y) / scale,
  };
}

export function roundVector(vector: Vector2, digits = 1): Vector2 {
  return {
    x: roundNumber(vector.x, digits),
    y: roundNumber(vector.y, digits),
  };
}

export function roundNumber(value: number, digits = 1) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

export function normalizeAngle(angle: number) {
  return ((angle % 360) + 360) % 360;
}
