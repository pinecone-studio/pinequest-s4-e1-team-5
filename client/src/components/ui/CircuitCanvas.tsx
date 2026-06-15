import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

type CircuitComponentType = 'BATTERY' | 'LIGHTBULB';

interface CircuitComponent {
  id: string;
  type: CircuitComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CircuitState {
  components: CircuitComponent[];
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

const batterySize = {
  width: 96,
  height: 72
};

const lightbulbSize = {
  width: 84,
  height: 84
};

function createInitialComponents(width: number, height: number): CircuitComponent[] {
  const centerX = width / 2;
  const centerY = height / 2;
  const gap = 56;

  return [
    {
      id: 'battery-1',
      type: 'BATTERY',
      x: centerX - gap - batterySize.width,
      y: centerY - batterySize.height / 2,
      width: batterySize.width,
      height: batterySize.height
    },
    {
      id: 'lightbulb-1',
      type: 'LIGHTBULB',
      x: centerX + gap,
      y: centerY - lightbulbSize.height / 2,
      width: lightbulbSize.width,
      height: lightbulbSize.height
    }
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

function isPointInsideComponent(
  pointX: number,
  pointY: number,
  component: CircuitComponent
) {
  if (component.type === 'LIGHTBULB') {
    const radius = component.width / 2;
    const centerX = component.x + radius;
    const centerY = component.y + component.height / 2;
    const distanceX = pointX - centerX;
    const distanceY = pointY - centerY;

    return distanceX * distanceX + distanceY * distanceY <= radius * radius;
  }

  return (
    pointX >= component.x &&
    pointX <= component.x + component.width &&
    pointY >= component.y &&
    pointY <= component.y + component.height
  );
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

function drawComponent(context: CanvasRenderingContext2D, component: CircuitComponent) {
  context.save();
  context.lineWidth = 3;
  context.strokeStyle = '#222222';
  context.fillStyle = '#222222';
  context.font = '600 13px sans-serif';
  context.textAlign = 'center';
  context.textBaseline = 'middle';

  if (component.type === 'BATTERY') {
    context.fillStyle = '#d94336';
    context.fillRect(component.x, component.y, component.width, component.height);
    context.strokeRect(component.x, component.y, component.width, component.height);
    context.fillStyle = '#ffffff';
    context.fillText(
      'BATTERY',
      component.x + component.width / 2,
      component.y + component.height / 2
    );
  } else {
    const radius = component.width / 2;
    const centerX = component.x + radius;
    const centerY = component.y + component.height / 2;

    context.beginPath();
    context.fillStyle = '#f5c542';
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fill();
    context.stroke();
    context.fillStyle = '#222222';
    context.fillText('LIGHTBULB', centerX, centerY);
  }

  context.restore();
}

export default function CircuitCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<DragState | null>(null);

  const [canvasSize, setCanvasSize] = useState<CanvasSize>(() => getInitialCanvasSize());
  const [circuitState, setCircuitState] = useState<CircuitState>(() => {
    const initialSize = getInitialCanvasSize();

    return {
      components: createInitialComponents(initialSize.width, initialSize.height)
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
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [updateCanvasSize]);

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
    context.fillStyle = '#f8f8f2';
    context.fillRect(0, 0, canvasSize.width, canvasSize.height);

    circuitState.components.forEach((component) => {
      drawComponent(context, component);
    });
  }, [canvasSize, circuitState.components]);

  const handleMouseDown = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const point = getCanvasPoint(event, canvas);
    const selectedComponent = [...circuitState.components]
      .reverse()
      .find((component) => isPointInsideComponent(point.x, point.y, component));

    if (!selectedComponent) {
      return;
    }

    dragRef.current = {
      id: selectedComponent.id,
      offsetX: point.x - selectedComponent.x,
      offsetY: point.y - selectedComponent.y
    };
  };

  const handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const dragState = dragRef.current;

    if (!canvas || !dragState) {
      return;
    }

    const point = getCanvasPoint(event, canvas);

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
      })
    }));
  };

  const handleMouseUp = () => {
    dragRef.current = null;
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
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          cursor: dragRef.current ? 'grabbing' : 'grab'
        }}
      />
    </div>
  );
}
