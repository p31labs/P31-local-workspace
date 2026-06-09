// Ambient type declarations for three/examples/jsm modules

declare module 'three/examples/jsm/postprocessing/EffectComposer.js' {
  import type { WebGLRenderer, WebGLRenderTarget } from 'three';
  export class Pass {
    enabled: boolean;
    needsSwap: boolean;
    clear: boolean;
    clearColor: import('three').Color;
    clearAlpha: number;
    renderToScreen: boolean;
    setSize(width: number, height: number): void;
    render(renderer: WebGLRenderer, writeBuffer: WebGLRenderTarget, readBuffer: WebGLRenderTarget, deltaTime: number, maskActive: boolean): void;
    dispose(): void;
  }
  export class EffectComposer {
    constructor(renderer: WebGLRenderer, renderTarget?: WebGLRenderTarget);
    addPass(pass: Pass): void;
    removePass(pass: Pass): void;
    render(deltaTime?: number): void;
    setSize(width: number, height: number): void;
    dispose(): void;
  }
}

declare module 'three/examples/jsm/postprocessing/RenderPass.js' {
  import type { Scene, Camera, Material, Color } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  export class RenderPass extends Pass {
    constructor(scene: Scene, camera: Camera, overrideMaterial?: Material | null, clearColor?: Color, clearAlpha?: number);
    scene: Scene;
    camera: Camera;
    clearColor: Color;
    clearAlpha: number;
  }
}

declare module 'three/examples/jsm/postprocessing/UnrealBloomPass.js' {
  import type { Vector2 } from 'three';
  import { Pass } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  export class UnrealBloomPass extends Pass {
    constructor(resolution: Vector2, strength: number, radius: number, threshold: number);
    resolution: Vector2;
    strength: number;
    radius: number;
    threshold: number;
  }
}

declare module 'three/examples/jsm/postprocessing/OutputPass.js' {
  import { Pass } from 'three/examples/jsm/postprocessing/EffectComposer.js';
  export class OutputPass extends Pass {
    constructor();
  }
}

declare module 'three/examples/jsm/renderers/CSS2DRenderer.js' {
  import type { Object3D, Scene, Camera } from 'three';
  export class CSS2DObject extends Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
  }
  export class CSS2DRenderer {
    constructor();
    domElement: HTMLElement;
    setSize(width: number, height: number): void;
    render(scene: Scene, camera: Camera): void;
  }
}
