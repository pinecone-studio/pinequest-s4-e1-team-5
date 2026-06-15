import * as THREE from 'three';
import type { RefObject } from 'react';

export const usePaintMaterial = (_config?: {
  dirX?: number;
  dirY?: number;
  dirZ?: number;
  startDist?: number;
  endDist?: number;
  noiseAxes?: string;
}) => {
  const uniformsData = {
    uPaintProgress: { value: 1.0 },
    uRoomOrigin: { value: new THREE.Vector3() },
  };
  return {
    onBeforeCompile: undefined as undefined,
    animatePaint: (_delay?: number, _duration?: number) => {},
    resetPaint: () => {},
    uniformsData,
    updateRoomOrigin: (_ref: RefObject<any>) => {},
  };
};
