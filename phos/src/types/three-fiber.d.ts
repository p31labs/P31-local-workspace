declare module '@react-three/fiber' {
  import type { ReactNode, Ref } from 'react';
  export const Canvas: (props: Record<string, unknown> & { children?: ReactNode }) => JSX.Element;
  export function useFrame(callback: (state: Record<string, unknown>, delta: number) => void): void;
  export type ThreeElements = Record<string, unknown>;
}

declare module '@react-three/drei' {
  import type { ReactNode } from 'react';
  export const OrbitControls: (props: Record<string, unknown>) => JSX.Element;
  export const Text: (props: Record<string, unknown> & { children?: ReactNode }) => JSX.Element;
}

declare module 'three' {
  export class Vector3 {
    constructor(x?: number, y?: number, z?: number);
    toArray(): number[];
  }
  export class Group {
    rotation: { x: number; y: number; z: number };
    add(...objects: unknown[]): void;
  }
  export class Object3D {
    position: Vector3;
    rotation: { x: number; y: number; z: number };
    scale: Vector3;
  }
  export class Scene {
    add(...objects: unknown[]): void;
  }
  export class Color {
    constructor(color?: string | number);
  }
  export class Float32BufferAttribute extends Float32Array {
    constructor(array: number[] | ArrayBuffer, itemSize: number);
  }
  export class BufferGeometry {
    setAttribute(name: string, attribute: unknown): void;
  }
  export class Mesh extends Object3D {}
  export class MeshStandardMaterial {
    constructor(params?: Record<string, unknown>);
  }
  export class LineBasicMaterial {
    constructor(params?: Record<string, unknown>);
  }
  export class PointsMaterial {
    constructor(params?: Record<string, unknown>);
  }
  export class BufferAttribute {
    constructor(array: Float32Array, itemSize: number);
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: Record<string, unknown>;
      mesh: Record<string, unknown>;
      line: Record<string, unknown>;
      points: Record<string, unknown>;
      primitive: Record<string, unknown>;
      bufferGeometry: Record<string, unknown>;
      bufferAttribute: Record<string, unknown>;
      lineBasicMaterial: Record<string, unknown>;
      meshStandardMaterial: Record<string, unknown>;
      meshBasicMaterial: Record<string, unknown>;
      meshPhongMaterial: Record<string, unknown>;
      pointsMaterial: Record<string, unknown>;
      sphereGeometry: Record<string, unknown>;
      boxGeometry: Record<string, unknown>;
      cylinderGeometry: Record<string, unknown>;
      planeGeometry: Record<string, unknown>;
      coneGeometry: Record<string, unknown>;
      torusGeometry: Record<string, unknown>;
      ambientLight: Record<string, unknown>;
      pointLight: Record<string, unknown>;
      directionalLight: Record<string, unknown>;
      spotLight: Record<string, unknown>;
      hemisphereLight: Record<string, unknown>;
      fog: Record<string, unknown>;
    }
  }
}
