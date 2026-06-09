/**
 * three-utils.test.ts — Unit tests for disposeMaterial, disposeHierarchy,
 * and ThreeDisposalRegistry.
 *
 * Three.js classes are imported directly — no stubs needed because the
 * geometry/material constructors work in Node.js (they're plain JS objects).
 * Only WebGL-specific calls (compile, render) would require a canvas context.
 */

import { describe, it, expect, vi } from 'vitest';
import * as THREE from 'three';
import { disposeMaterial, disposeHierarchy, ThreeDisposalRegistry } from './three-utils';

// ── disposeMaterial ───────────────────────────────────────────────────────

describe('disposeMaterial', () => {
  it('calls material.dispose()', () => {
    const mat = new THREE.MeshBasicMaterial();
    const spy = vi.spyOn(mat, 'dispose');
    disposeMaterial(mat);
    expect(spy).toHaveBeenCalledOnce();
  });

  it('disposes textures attached as properties', () => {
    const mat = new THREE.MeshBasicMaterial();
    const tex = new THREE.Texture();
    const spy = vi.spyOn(tex, 'dispose');
    (mat as THREE.MeshBasicMaterial & { map: THREE.Texture }).map = tex;
    disposeMaterial(mat);
    expect(spy).toHaveBeenCalledOnce();
  });
});

// ── disposeHierarchy ──────────────────────────────────────────────────────

describe('disposeHierarchy', () => {
  it('disposes geometry and material on a Mesh', () => {
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geo, mat);

    const geoSpy = vi.spyOn(geo, 'dispose');
    const matSpy = vi.spyOn(mat, 'dispose');

    disposeHierarchy(mesh);

    expect(geoSpy).toHaveBeenCalledOnce();
    expect(matSpy).toHaveBeenCalledOnce();
  });

  it('disposes geometry and material on an InstancedMesh', () => {
    const geo = new THREE.SphereGeometry(0.1, 4, 4);
    const mat = new THREE.MeshBasicMaterial();
    const ivm = new THREE.InstancedMesh(geo, mat, 10);

    const geoSpy = vi.spyOn(geo, 'dispose');
    const matSpy = vi.spyOn(mat, 'dispose');

    disposeHierarchy(ivm);

    expect(geoSpy).toHaveBeenCalledOnce();
    expect(matSpy).toHaveBeenCalledOnce();
  });

  it('disposes array of materials on a multi-material Mesh', () => {
    const geo  = new THREE.BoxGeometry();
    const matA = new THREE.MeshBasicMaterial();
    const matB = new THREE.MeshBasicMaterial();
    const mesh = new THREE.Mesh(geo, [matA, matB]);

    const spyA = vi.spyOn(matA, 'dispose');
    const spyB = vi.spyOn(matB, 'dispose');

    disposeHierarchy(mesh);

    expect(spyA).toHaveBeenCalledOnce();
    expect(spyB).toHaveBeenCalledOnce();
  });

  it('recurses into children and removes them', () => {
    const parent = new THREE.Group();
    const child  = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    parent.add(child);

    const geoSpy = vi.spyOn(child.geometry, 'dispose');
    disposeHierarchy(parent);

    expect(geoSpy).toHaveBeenCalledOnce();
    expect(parent.children).toHaveLength(0);
  });

  it('disposes nested hierarchy (grandchild)', () => {
    const root  = new THREE.Group();
    const mid   = new THREE.Group();
    const leaf  = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
    root.add(mid);
    mid.add(leaf);

    const geoSpy = vi.spyOn(leaf.geometry, 'dispose');
    disposeHierarchy(root);

    expect(geoSpy).toHaveBeenCalledOnce();
    expect(root.children).toHaveLength(0);
  });
});

// ── ThreeDisposalRegistry ─────────────────────────────────────────────────

describe('ThreeDisposalRegistry', () => {
  it('geo() disposes on registry.dispose()', () => {
    const reg = new ThreeDisposalRegistry();
    const geo = reg.geo(new THREE.BoxGeometry());
    const spy = vi.spyOn(geo, 'dispose');
    reg.dispose();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('mat() disposes on registry.dispose()', () => {
    const reg = new ThreeDisposalRegistry();
    const mat = reg.mat(new THREE.MeshBasicMaterial());
    const spy = vi.spyOn(mat, 'dispose');
    reg.dispose();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('tex() disposes on registry.dispose()', () => {
    const reg = new ThreeDisposalRegistry();
    const tex = reg.tex(new THREE.Texture());
    const spy = vi.spyOn(tex, 'dispose');
    reg.dispose();
    expect(spy).toHaveBeenCalledOnce();
  });

  it('mat() accepts an array and disposes all elements', () => {
    const reg  = new ThreeDisposalRegistry();
    const matA = new THREE.MeshBasicMaterial();
    const matB = new THREE.MeshBasicMaterial();
    reg.mat([matA, matB]);
    const spyA = vi.spyOn(matA, 'dispose');
    const spyB = vi.spyOn(matB, 'dispose');
    reg.dispose();
    expect(spyA).toHaveBeenCalledOnce();
    expect(spyB).toHaveBeenCalledOnce();
  });

  it('dispose() is idempotent — second call does not throw', () => {
    const reg = new ThreeDisposalRegistry();
    reg.geo(new THREE.BoxGeometry());
    reg.dispose();
    expect(() => reg.dispose()).not.toThrow();
  });

  it('fluent API: geo/mat/tex return the same object passed in', () => {
    const reg = new ThreeDisposalRegistry();
    const geo = new THREE.BoxGeometry();
    const mat = new THREE.MeshBasicMaterial();
    expect(reg.geo(geo)).toBe(geo);
    expect(reg.mat(mat)).toBe(mat);
  });

  it('obj() calls disposeHierarchy on dispose()', () => {
    const reg  = new ThreeDisposalRegistry();
    const mesh = reg.obj(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial()));
    const spy  = vi.spyOn(mesh.geometry, 'dispose');
    reg.dispose();
    expect(spy).toHaveBeenCalledOnce();
  });
});
