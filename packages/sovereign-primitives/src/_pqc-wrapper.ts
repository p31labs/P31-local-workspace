// Re-export @noble/post-quantum submodules for TypeScript compatibility
// The package's exports field maps to .js files but TypeScript needs .d.ts visibility

// @ts-ignore
export { mlKem } from '@noble/post-quantum/ml-kem';
// @ts-ignore
export { mlDsa } from '@noble/post-quantum/ml-dsa';
// @ts-ignore
export { slhDsa } from '@noble/post-quantum/slh-dsa';
// @ts-ignore
export { hybrid } from '@noble/post-quantum/hybrid';
// @ts-ignore
export { utils } from '@noble/post-quantum/utils';
// @ts-ignore
export { _crystals } from '@noble/post-quantum/_crystals';
// @ts-ignore
export { falcon } from '@noble/post-quantum/falcon';
