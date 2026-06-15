import { forwardRef, useEffect, useImperativeHandle, useMemo } from 'react';
import * as THREE from 'three';

class PaperMaterialImpl extends THREE.MeshBasicMaterial {
  _bend = 0;
  _mapBack: THREE.Texture | null = null;
  _shader: any = null;

  get bend() {
    return this._bend;
  }
  set bend(v: number) {
    this._bend = v;
    if (this._shader) this._shader.uniforms.uBend.value = v;
  }

  get mapBack() {
    return this._mapBack;
  }
  set mapBack(v: THREE.Texture | null) {
    this._mapBack = v;
    if (this._shader) this._shader.uniforms.uMapBack.value = v;
  }

  customProgramCacheKey() {
    return 'PaperMaterial_v1';
  }

  onBeforeCompile(shader: any) {
    this._shader = shader;
    shader.uniforms.uBend = { value: this._bend };
    shader.uniforms.uMapBack = { value: this._mapBack };

    shader.vertexShader = `uniform float uBend;\n${shader.vertexShader}`.replace(
      '#include <begin_vertex>',
      `#include <begin_vertex>
       float bNorm = transformed.x / 0.75;
       transformed.z += uBend * (1.0 - bNorm * bNorm) * 0.25;`,
    );

    shader.fragmentShader = `uniform sampler2D uMapBack;\n${shader.fragmentShader}`.replace(
      '#include <map_fragment>',
      `#ifdef USE_MAP
         vec4 sampledDiffuseColor = gl_FrontFacing
           ? texture2D(map, vMapUv)
           : texture2D(uMapBack, vMapUv);
         diffuseColor *= sampledDiffuseColor;
       #endif`,
    );
  }
}

type Props = {
  color?: THREE.ColorRepresentation;
  map?: THREE.Texture | null;
  mapBack?: THREE.Texture | null;
  side?: THREE.Side;
  roughness?: number;
  paintProgress?: { value: number };
  roomOrigin?: { value: THREE.Vector3 };
};

const PaperMaterial = forwardRef<PaperMaterialImpl, Props>(
  ({ map, mapBack, side, color, paintProgress: _p, roomOrigin: _r, roughness: _rg, ...rest }, ref) => {
    const mat = useMemo(() => new PaperMaterialImpl(), []);

    useImperativeHandle(ref, () => mat, [mat]);

    useEffect(() => {
      mat.map = map ?? null;
      mat.needsUpdate = true;
    }, [map, mat]);

    useEffect(() => {
      mat.mapBack = mapBack ?? null;
    }, [mapBack, mat]);

    useEffect(() => {
      if (side !== undefined) mat.side = side;
    }, [side, mat]);

    useEffect(() => {
      if (color !== undefined) mat.color.set(color);
    }, [color, mat]);

    return <primitive object={mat} {...rest} />;
  },
);

PaperMaterial.displayName = 'PaperMaterial';
export default PaperMaterial;
