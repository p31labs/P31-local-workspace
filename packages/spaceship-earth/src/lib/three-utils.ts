import * as THREE from 'three';

/**
 * disposeMaterial
 * Disposes a material and all texture slots attached to it.
 */
export function disposeMaterial(material: THREE.Material) {
  material.dispose();

  for (const key of Object.keys(material)) {
    const value = (material as unknown as Record<string, unknown>)[key];
    if (value instanceof THREE.Texture) {
      value.dispose();
    }
  }
}

/**
 * disposeHierarchy
 * Traverses a scene or group and disposes all geometries, materials, and
 * textures — including InstancedMesh instanceMatrix / instanceColor buffers.
 */
export function disposeHierarchy(node: THREE.Object3D) {
  // InstancedMesh: dispose shared geo + mat, then free GPU buffer attributes
  if (node instanceof THREE.InstancedMesh) {
    node.geometry.dispose();
    if (Array.isArray(node.material)) {
      node.material.forEach(m => disposeMaterial(m));
    } else {
      disposeMaterial(node.material);
    }
    // instanceMatrix and instanceColor are BufferAttributes backed by GPU buffers.
    // Three.js does not auto-dispose them — must call explicitly.
    node.instanceMatrix.array = new Float32Array(0); // release typed-array ref
    if (node.instanceColor) {
      node.instanceColor.array = new Float32Array(0);
    }
  } else if (
    node instanceof THREE.Mesh ||
    node instanceof THREE.Line ||
    node instanceof THREE.Points ||
    node instanceof THREE.Sprite
  ) {
    if (node.geometry) node.geometry.dispose();
    if (node.material) {
      if (Array.isArray(node.material)) {
        node.material.forEach(m => disposeMaterial(m));
      } else {
        disposeMaterial(node.material);
      }
    }
  }

  // Recurse children before removing (DFS post-order)
  while (node.children.length > 0) {
    const child = node.children[0];
    disposeHierarchy(child);
    node.remove(child);
  }
}

/**
 * ThreeDisposalRegistry
 *
 * Lightweight RAII wrapper for Three.js resources created inside a single
 * React useEffect. Register geometries, materials, textures, and render
 * targets at creation time; call `.dispose()` in the cleanup return to
 * guarantee every GPU resource is freed when the component unmounts.
 *
 * Usage:
 * ```ts
 * useEffect(() => {
 *   const reg = new ThreeDisposalRegistry();
 *   const geo = reg.geo(new THREE.BoxGeometry());
 *   const mat = reg.mat(new THREE.MeshBasicMaterial());
 *   return () => reg.dispose();
 * }, []);
 * ```
 */
export class ThreeDisposalRegistry {
  private _geos:     THREE.BufferGeometry[]    = [];
  private _mats:     THREE.Material[]          = [];
  private _textures: THREE.Texture[]           = [];
  private _targets:  THREE.WebGLRenderTarget[] = [];
  private _objects:  THREE.Object3D[]          = [];

  /** Register a geometry and return it (fluent). */
  geo<T extends THREE.BufferGeometry>(g: T): T {
    this._geos.push(g);
    return g;
  }

  /** Register a material (or array of materials) and return it (fluent). */
  mat<T extends THREE.Material>(m: T): T;
  mat<T extends THREE.Material>(m: T[]): T[];
  mat<T extends THREE.Material>(m: T | T[]): T | T[] {
    if (Array.isArray(m)) { m.forEach(x => this._mats.push(x)); return m; }
    this._mats.push(m); return m;
  }

  /** Register a texture and return it (fluent). */
  tex<T extends THREE.Texture>(t: T): T {
    this._textures.push(t);
    return t;
  }

  /** Register a render target and return it (fluent). */
  rt<T extends THREE.WebGLRenderTarget>(t: T): T {
    this._targets.push(t);
    return t;
  }

  /**
   * Register an Object3D for full hierarchy disposal (disposeHierarchy).
   * Use this for Groups, Scenes, or InstancedMeshes managed outside the scene graph.
   */
  obj<T extends THREE.Object3D>(o: T): T {
    this._objects.push(o);
    return o;
  }

  /** Dispose all registered resources. Safe to call multiple times. */
  dispose(): void {
    this._geos.forEach(g => g.dispose());
    this._mats.forEach(m => disposeMaterial(m));
    this._textures.forEach(t => t.dispose());
    this._targets.forEach(t => t.dispose());
    this._objects.forEach(o => disposeHierarchy(o));
    this._geos     = [];
    this._mats     = [];
    this._textures = [];
    this._targets  = [];
    this._objects  = [];
  }
}
