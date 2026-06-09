/**
 * WebGPU Type Definitions
 * 
 * Provides TypeScript definitions for WebGPU APIs that may not be available
 * in all TypeScript environments or browser versions.
 */

// WebGPU Buffer Usage Flags
export const GPUBufferUsage = {
  MAP_READ: 0x0001,
  MAP_WRITE: 0x0002,
  COPY_SRC: 0x0004,
  COPY_DST: 0x0008,
  INDEX: 0x0010,
  VERTEX: 0x0020,
  UNIFORM: 0x0040,
  STORAGE: 0x0080,
  INDIRECT: 0x0100,
  QUERY_RESOLVE: 0x0200,
} as const;

export type GPUBufferUsageFlags = number;

// WebGPU Shader Stage Flags
export const GPUShaderStage = {
  VERTEX: 0x1,
  FRAGMENT: 0x2,
  COMPUTE: 0x4,
} as const;

export type GPUShaderStageFlags = number;

// WebGPU Map Mode Flags
export const GPUMapMode = {
  READ: 0x0001,
  WRITE: 0x0002,
} as const;

export type GPUMapModeFlags = number;

// WebGPU Buffer Descriptor
export interface GPUBufferDescriptor {
  size: number;
  usage: GPUBufferUsageFlags;
  mappedAtCreation?: boolean;
}

// WebGPU Bind Group Layout Entry
export interface GPUBindGroupLayoutEntry {
  binding: number;
  visibility: GPUShaderStageFlags;
  buffer?: {
    type?: 'uniform' | 'storage' | 'read-only-storage';
    hasDynamicOffset?: boolean;
    minBindingSize?: number;
  };
  sampler?: {
    type?: 'filtering' | 'non-filtering' | 'comparison';
  };
  texture?: {
    sampleType?: 'float' | 'unfilterable-float' | 'depth' | 'sint' | 'uint';
    viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
    multisampled?: boolean;
  };
  storageTexture?: {
    access?: 'write-only';
    format: GPUTextureFormat;
    viewDimension?: '1d' | '2d' | '2d-array' | 'cube' | 'cube-array' | '3d';
  };
}

// WebGPU Bind Group Layout Descriptor
export interface GPUBindGroupLayoutDescriptor {
  entries: GPUBindGroupLayoutEntry[];
}

// WebGPU Bind Group Entry
export interface GPUBindGroupEntry {
  binding: number;
  resource: GPUBindableResource;
}

// WebGPU Bind Group Descriptor
export interface GPUBindGroupDescriptor {
  layout: GPUBindGroupLayout;
  entries: GPUBindGroupEntry[];
}

// WebGPU Pipeline Layout Descriptor
export interface GPUPipelineLayoutDescriptor {
  bindGroupLayouts: GPUBindGroupLayout[];
}

// WebGPU Compute Pipeline Descriptor
export interface GPUComputePipelineDescriptor {
  layout?: GPUPipelineLayout | GPUPipelineLayoutDescriptor;
  compute: GPUProgrammableStage;
}

// WebGPU Programmable Stage
export interface GPUProgrammableStage {
  module: GPUShaderModule;
  entryPoint: string;
  constants?: Record<string, number>;
}

// WebGPU Shader Module Descriptor
export interface GPUShaderModuleDescriptor {
  code: string;
  source?: string;
}

// WebGPU Command Encoder Descriptor
export interface GPUCommandEncoderDescriptor {
  label?: string;
}

// WebGPU Compute Pass Descriptor
export interface GPUComputePassDescriptor {
  label?: string;
}

// WebGPU Compute Pass Encoder
export interface GPUComputePassEncoder {
  setPipeline(pipeline: GPUComputePipeline): void;
  setBindGroup(index: number, bindGroup: GPUBindGroup, dynamicOffsets?: number[]): void;
  dispatchWorkgroups(x: number, y?: number, z?: number): void;
  end(): void;
}

// WebGPU Command Encoder
export interface GPUCommandEncoder {
  beginComputePass(descriptor?: GPUComputePassDescriptor): GPUComputePassEncoder;
  copyBufferToBuffer(
    source: GPUBuffer,
    sourceOffset: number,
    destination: GPUBuffer,
    destinationOffset: number,
    size: number
  ): void;
  finish(descriptor?: GPUCommandBufferDescriptor): GPUCommandBuffer;
}

// WebGPU Command Buffer Descriptor
export interface GPUCommandBufferDescriptor {
  label?: string;
}

// WebGPU Command Buffer
export interface GPUCommandBuffer {
  // Empty interface - methods are called on the device queue
}

// WebGPU Queue
export interface GPUQueue {
  submit(commandBuffers: GPUCommandBuffer[]): void;
  writeBuffer(
    buffer: GPUBuffer,
    bufferOffset: number,
    data: BufferSource,
    dataOffset?: number,
    size?: number
  ): void;
}

// WebGPU Buffer
export interface GPUBuffer {
  size: number;
  usage: GPUBufferUsageFlags;
  mapState: 'unmapped' | 'pending' | 'mapped';
  mapAsync(mode: GPUMapModeFlags, offset?: number, size?: number): Promise<void>;
  getMappedRange(offset?: number, size?: number): ArrayBuffer;
  unmap(): void;
  destroy(): void;
}

// WebGPU Bind Group Layout
export interface GPUBindGroupLayout {
  // Empty interface - used for type checking
}

// WebGPU Bind Group
export interface GPUBindGroup {
  // Empty interface - used for type checking
}

// WebGPU Pipeline Layout
export interface GPUPipelineLayout {
  // Empty interface - used for type checking
}

// WebGPU Compute Pipeline
export interface GPUComputePipeline {
  // Empty interface - used for type checking
}

// WebGPU Shader Module
export interface GPUShaderModule {
  // Empty interface - used for type checking
}

// WebGPU Texture Format
export type GPUTextureFormat = 
  | 'rgba8unorm'
  | 'rgba8snorm'
  | 'rgba8uint'
  | 'rgba8sint'
  | 'rgba16uint'
  | 'rgba16sint'
  | 'rgba16float'
  | 'rgba32uint'
  | 'rgba32sint'
  | 'rgba32float'
  | 'rg32float'
  | 'rg32uint'
  | 'rg32sint'
  | 'rg16float'
  | 'rg16uint'
  | 'rg16sint'
  | 'r32float'
  | 'r32uint'
  | 'r32sint'
  | 'r16float'
  | 'r16uint'
  | 'r16sint'
  | 'bgra8unorm'
  | 'bgra8unorm-srgb'
  | 'rgb9e5ufloat'
  | 'rgb10a2uint'
  | 'rgb10a2unorm'
  | 'rg11b10ufloat'
  | 'rg8unorm'
  | 'rg8snorm'
  | 'rg8uint'
  | 'rg8sint'
  | 'r8unorm'
  | 'r8snorm'
  | 'r8uint'
  | 'r8sint'
  | 'b8g8r8a8unorm'
  | 'b8g8r8a8unorm-srgb'
  | 'b8g8r8x8unorm'
  | 'b8g8r8x8unorm-srgb'
  | 'depth32float'
  | 'depth24plus'
  | 'depth24plus-stencil8'
  | 'depth32float-stencil8'
  | 'bc1-rgba-unorm'
  | 'bc1-rgba-unorm-srgb'
  | 'bc2-rgba-unorm'
  | 'bc2-rgba-unorm-srgb'
  | 'bc3-rgba-unorm'
  | 'bc3-rgba-unorm-srgb'
  | 'bc4-r-unorm'
  | 'bc4-r-snorm'
  | 'bc5-rg-unorm'
  | 'bc5-rg-snorm'
  | 'bc6h-rgb-ufloat'
  | 'bc6h-rgb-float'
  | 'bc7-rgba-unorm'
  | 'bc7-rgba-unorm-srgb'
  | 'etc2-rgb8unorm'
  | 'etc2-rgb8unorm-srgb'
  | 'etc2-rgb8a1unorm'
  | 'etc2-rgb8a1unorm-srgb'
  | 'etc2-rgba8unorm'
  | 'etc2-rgba8unorm-srgb'
  | 'eac-r11unorm'
  | 'eac-r11snorm'
  | 'eac-rg11unorm'
  | 'eac-rg11snorm'
  | 'astc-4x4-unorm'
  | 'astc-4x4-unorm-srgb'
  | 'astc-5x4-unorm'
  | 'astc-5x4-unorm-srgb'
  | 'astc-5x5-unorm'
  | 'astc-5x5-unorm-srgb'
  | 'astc-6x5-unorm'
  | 'astc-6x5-unorm-srgb'
  | 'astc-6x6-unorm'
  | 'astc-6x6-unorm-srgb'
  | 'astc-8x5-unorm'
  | 'astc-8x5-unorm-srgb'
  | 'astc-8x6-unorm'
  | 'astc-8x6-unorm-srgb'
  | 'astc-8x8-unorm'
  | 'astc-8x8-unorm-srgb'
  | 'astc-10x5-unorm'
  | 'astc-10x5-unorm-srgb'
  | 'astc-10x6-unorm'
  | 'astc-10x6-unorm-srgb'
  | 'astc-10x8-unorm'
  | 'astc-10x8-unorm-srgb'
  | 'astc-10x10-unorm'
  | 'astc-10x10-unorm-srgb'
  | 'astc-12x10-unorm'
  | 'astc-12x10-unorm-srgb'
  | 'astc-12x12-unorm'
  | 'astc-12x12-unorm-srgb';

// WebGPU Adapter
export interface GPUAdapter {
  requestDevice(descriptor?: GPUDeviceDescriptor): Promise<GPUDevice>;
  name: string;
  features: Set<GPUFeatureName>;
  limits: GPULimits;
  isFallbackAdapter: boolean;
}

// WebGPU Device Descriptor
export interface GPUDeviceDescriptor {
  label?: string;
  requiredFeatures?: GPUFeatureName[];
  requiredLimits?: Partial<GPULimits>;
  defaultQueue?: GPUQueueDescriptor;
}

// WebGPU Device
export interface GPUDevice {
  queue: GPUQueue;
  adapterInfo: GPUAdapterInfo;
  features: Set<GPUFeatureName>;
  limits: GPULimits;
  lost: Promise<GPUDeviceLostInfo>;
  onuncapturederror: ((event: GPUUncapturedErrorEvent) => void) | null;
  createBuffer(descriptor: GPUBufferDescriptor): GPUBuffer;
  createBindGroupLayout(descriptor: GPUBindGroupLayoutDescriptor): GPUBindGroupLayout;
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  createPipelineLayout(descriptor: GPUPipelineLayoutDescriptor): GPUPipelineLayout;
  createComputePipeline(descriptor: GPUComputePipelineDescriptor): GPUComputePipeline;
  createComputePipelineAsync(descriptor: GPUComputePipelineDescriptor): Promise<GPUComputePipeline>;
  createShaderModule(descriptor: GPUShaderModuleDescriptor): GPUShaderModule;
  createCommandEncoder(descriptor?: GPUCommandEncoderDescriptor): GPUCommandEncoder;
  createQuerySet(descriptor: GPUQuerySetDescriptor): GPUQuerySet;
  createRenderBundleEncoder(descriptor: GPURenderBundleEncoderDescriptor): GPURenderBundleEncoder;
  createSampler(descriptor: GPUSamplerDescriptor): GPUSampler;
  createTexture(descriptor: GPUTextureDescriptor): GPUTexture;
  createBindGroup(descriptor: GPUBindGroupDescriptor): GPUBindGroup;
  destroy(): void;
}

// WebGPU Limits
export interface GPULimits {
  maxTextureDimension1D: number;
  maxTextureDimension2D: number;
  maxTextureDimension3D: number;
  maxTextureArrayLayers: number;
  maxBindGroups: number;
  maxBindGroupUniformBuffers: number;
  maxBindGroupStorageBuffers: number;
  maxBindGroupSamplers: number;
  maxBindGroupSampledTextures: number;
  maxBindGroupStorageTextures: number;
  maxBindGroupStorageTextureWithFormat: Record<GPUTextureFormat, number>;
  maxUniformBuffersPerShaderStage: number;
  maxUniformBufferBindingSize: number;
  maxStorageBuffersPerShaderStage: number;
  maxStorageBufferBindingSize: number;
  maxVertexBuffers: number;
  maxBufferSize: number;
  maxVertexAttributes: number;
  maxVertexBufferArrayStride: number;
  maxInterStageShaderComponents: number;
  maxInterStageShaderVariables: number;
  maxColorAttachments: number;
  maxColorAttachmentBytesPerSample: number;
  maxComputeWorkgroupStorageSize: number;
  maxComputeInvocationsPerWorkgroup: number;
  maxComputeWorkgroupSizeX: number;
  maxComputeWorkgroupSizeY: number;
  maxComputeWorkgroupSizeZ: number;
  maxComputeWorkgroupsPerDimension: number;
}

// WebGPU Feature Name
export type GPUFeatureName = 
  | 'depth-clip-control'
  | 'depth32float-stencil8'
  | 'timestamp-query'
  | 'pipeline-statistics-query'
  | 'texture-compression-bc'
  | 'texture-compression-etc2'
  | 'texture-compression-astc'
  | 'rg11b10ufloat-renderable'
  | 'bgra8unorm-storage'
  | 'float32-filterable'
  | 'indirect-first-instance'
  | 'shader-f16'
  | 'dawn-vertex-first-instance'
  | 'dawn-internal-usages'
  | 'dawn-multisampled-render-to-single-sampled'
  | 'dawn-native'
  | 'dawn-clip-control'
  | 'dawn-blend-equation';

// WebGPU Queue Descriptor
export interface GPUQueueDescriptor {
  label?: string;
}

// WebGPU Bindable Resource
export type GPUBindableResource = 
  | GPUBuffer
  | GPUSampler
  | GPUTextureView
  | GPUExternalTexture;

// WebGPU Sampler
export interface GPUSampler {
  // Empty interface - used for type checking
}

// WebGPU Texture View
export interface GPUTextureView {
  // Empty interface - used for type checking
}

// WebGPU External Texture
export interface GPUExternalTexture {
  // Empty interface - used for type checking
}

// WebGPU Adapter Info
export interface GPUAdapterInfo {
  vendor: string;
  architecture: string;
  device: string;
  description: string;
  vendorID: number;
  deviceID: number;
  adapterType: GPUAdapterType;
  backendType: GPUBackendType;
}

export type GPUAdapterType = 
  | 'discrete'
  | 'integrated'
  | 'cpu'
  | 'unknown';

export type GPUBackendType = 
  | 'd3d11'
  | 'd3d12'
  | 'metal'
  | 'null'
  | 'opengl'
  | 'opengles'
  | 'vulkan'
  | 'browser'
  | 'dx12'
  | 'gl'
  | 'gles'
  | 'primary'
  | 'secondary'
  | 'unknown';

// WebGPU Navigator Interface
export interface Navigator {
  gpu?: {
    requestAdapter(options?: GPURequestAdapterOptions): Promise<GPUAdapter | null>;
  };
}

export interface GPURequestAdapterOptions {
  powerPreference?: GPUPowerPreference;
  compatibleSurface?: GPUSurface;
}

export type GPUPowerPreference = 'low-power' | 'high-performance';

export interface GPUSurface {
  // Empty interface - used for type checking
}

// Extend Window interface to include WebGPU
declare global {
  interface Window {
    GPUBufferUsage?: typeof GPUBufferUsage;
    GPUShaderStage?: typeof GPUShaderStage;
    GPUMapMode?: typeof GPUMapMode;
  }

  interface Navigator {
    gpu?: {
      requestAdapter(options?: GPURequestAdapterOptions): Promise<any>;
    };
  }
}