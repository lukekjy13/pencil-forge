import * as THREE from 'three';
import type { Part } from '../types';

type SurfaceFamily = 'brushed' | 'bead' | 'smooth' | 'wood' | 'rubber' | 'polymer' | 'graphite';
interface SurfacePixels { width: number; height: number; color?: Uint8Array; roughness: Uint8Array; normal: Uint8Array }

// Textures describe one 20 mm tile. Their grain direction is +V, along the pencil.
// Standard texture slots deliberately keep the appearance portable to glTF/GLB.
const TILE_MM = 20;
const bakedSurfaces = new Map<string, SurfacePixels>();
const surfaceLoads = new WeakMap<THREE.MeshPhysicalMaterial, Promise<void>>();
const pendingSurfaceTextures = new WeakMap<THREE.MeshPhysicalMaterial, Set<THREE.Texture>>();
const disposedSurfaces = new WeakSet<THREE.MeshPhysicalMaterial>();
const TAU = Math.PI * 2;
const clamp = (value: number, low = 0, high = 1) => Math.max(low, Math.min(high, value));
function noise(x: number, y: number, seed = 1) {
  let value = Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263) ^ Math.imul(seed, 1274126177);
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}
function smoothNoise(x: number, y: number, seed = 1) {
  const a = Math.floor(x), b = Math.floor(y);
  const tx = x - a, ty = y - b;
  const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
  const row0 = THREE.MathUtils.lerp(noise(a, b, seed), noise(a + 1, b, seed), sx);
  const row1 = THREE.MathUtils.lerp(noise(a, b + 1, seed), noise(a + 1, b + 1, seed), sx);
  return THREE.MathUtils.lerp(row0, row1, sy);
}

function bakeSurface(family: SurfaceFamily, variant: string): SurfacePixels {
  const key = `${family}:${variant}`;
  const cached = bakedSurfaces.get(key);
  if (cached) return cached;
  const width = 256, height = 512;
  const heights = new Float32Array(width * height);
  const roughness = new Uint8Array(width * height * 4);
  const color = family === 'wood' ? new Uint8Array(width * height * 4) : undefined;
  const normal = new Uint8Array(width * height * 4);
  const seed = [...variant].reduce((sum, char) => sum + char.charCodeAt(0), 37);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const index = y * width + x, offset = index * 4;
      const u = x / width, v = y / height;
      const speckle = noise(x, y, seed);
      let surfaceHeight = 0, rough = .94;
      if (family === 'wood') {
        // Growth bands bend gradually; narrow dark vessels follow the same grain.
        const bend = .022 * Math.sin(TAU * v + 1.3 * Math.sin(TAU * u))
          + .009 * Math.sin(2 * TAU * v + TAU * u);
        const grain = .5 + .5 * Math.sin(TAU * (u * 13 + bend * 13) + .7 * Math.sin(TAU * (u * 3 + v)));
        const fine = .5 + .5 * Math.sin(TAU * (u * 79 + bend * 73) + .45 * Math.sin(v * TAU * 3));
        const vessel = Math.pow(clamp((grain - .71) / .29), 5);
        const poreSeed = noise(Math.floor((u + bend) * 190), Math.floor(v * 48), seed + 9);
        const pore = poreSeed > .944 && v * 48 % 1 > .12 ? (poreSeed - .944) * 6 : 0;
        const broad = .95 + .05 * Math.sin(TAU * (u * 3 + v));
        const maple = variant === 'maple' || variant === 'bamboo';
        const value = clamp((maple ? .96 : .93) * broad - vessel * (maple ? .035 : .055) - fine * .025 - pore * .16 + (speckle - .5) * .012, .43, 1);
        if (color) {
          color[offset] = Math.round(value * 255);
          color[offset + 1] = Math.round(value * (maple ? .985 : .97) * 255);
          color[offset + 2] = Math.round(value * (maple ? .94 : .89) * 255);
          color[offset + 3] = 255;
        }
        surfaceHeight = .01 * grain + .01 * fine - .025 * vessel - .05 * pore;
        rough = clamp(.88 + .09 * fine - .14 * vessel, .67, .99);
      } else if (family === 'brushed') {
        // Long fine abrasion lines; their height is microscopic, never knurling.
        const line = noise(x, 0, seed);
        const waviness = smoothNoise(x * .07, v * 3, seed + 3);
        surfaceHeight = (line - .5) * .025 + (speckle - .5) * .003;
        rough = .72 + line * .18 + waviness * .1;
      } else if (family === 'bead') {
        surfaceHeight = (speckle - .5) * .025;
        rough = .86 + speckle * .14;
      } else if (family === 'rubber') {
        surfaceHeight = (speckle - .5) * .055 + (smoothNoise(x * .25, y * .25, seed) - .5) * .018;
        rough = .86 + speckle * .14;
      } else if (family === 'graphite') {
        surfaceHeight = (speckle - .5) * .065;
        rough = .77 + .23 * speckle;
      } else if (family === 'polymer') {
        surfaceHeight = (speckle - .5) * .011;
        rough = .94 + .06 * speckle;
      } else {
        surfaceHeight = (speckle - .5) * .002;
        rough = .97 + .03 * speckle;
      }
      heights[index] = surfaceHeight;
      roughness[offset] = roughness[offset + 1] = roughness[offset + 2] = Math.round(clamp(rough) * 255);
      roughness[offset + 3] = 255;
    }
  }
  // Tangent-space normal maps from a periodic height field, with a shallow scale.
  const relief = family === 'wood' ? 3.5 : family === 'rubber' ? 1.8 : 1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const dx = heights[y * width + (x + 1) % width] - heights[y * width + (x + width - 1) % width];
      const dy = heights[((y + 1) % height) * width + x] - heights[((y + height - 1) % height) * width + x];
      const nx = -dx * relief, ny = -dy * relief, inverse = 1 / Math.hypot(nx, ny, 1);
      normal[offset] = Math.round((nx * inverse * .5 + .5) * 255);
      normal[offset + 1] = Math.round((ny * inverse * .5 + .5) * 255);
      normal[offset + 2] = Math.round((inverse * .5 + .5) * 255);
      normal[offset + 3] = 255;
    }
  }
  const surface = { width, height, color, roughness, normal };
  bakedSurfaces.set(key, surface);
  return surface;
}

function makeTexture(data: Uint8Array, pixels: SurfacePixels, part: Part, color = false) {
  let texture: THREE.Texture;
  if (typeof document !== 'undefined') {
    // GLTFExporter's metallic/roughness packing draws texture images on canvas;
    // DataTexture.image is a plain data object and cannot be passed to drawImage.
    const canvas = document.createElement('canvas');
    canvas.width = pixels.width; canvas.height = pixels.height;
    const context = canvas.getContext('2d');
    if (!context) throw new Error('PBR 텍스처를 처리할 Canvas를 만들지 못했습니다.');
    context.putImageData(new ImageData(new Uint8ClampedArray(data), pixels.width, pixels.height), 0, 0);
    texture = new THREE.CanvasTexture(canvas);
  } else {
    texture = new THREE.DataTexture(data, pixels.width, pixels.height, THREE.RGBAFormat, THREE.UnsignedByteType);
  }
  texture.flipY = false;
  texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(Math.max(1, Math.round(Math.PI * part.diameter / TILE_MM)), 1);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

const WOOD_MAP_ROOT = '/textures/wood/';
// A 200 mm appearance tile keeps the 1K PBR reference detailed at pencil scale.
// Source provenance and its original 800 mm tile are recorded beside the assets.
const WOOD_APPEARANCE_TILE_MM = 200;
function woodTint(part: Part) {
  const nominal = new THREE.Color('#ffffff');
  return new THREE.Color(part.color);
}

function loadWoodSurface(material: THREE.MeshPhysicalMaterial, part: Part) {
  const pending = new Set<THREE.Texture>();
  pendingSurfaceTextures.set(material, pending);
  const loader = new THREE.TextureLoader();
  const load = (name: string, color = false) => new Promise<THREE.Texture>((resolve, reject) => {
    const texture = loader.load(WOOD_MAP_ROOT + name, resolve, undefined, () => reject(new Error('목재 PBR 텍스처를 불러오지 못했습니다. 연결을 확인한 뒤 다시 시도하세요.')));
    pending.add(texture);
    texture.name = `ambientCG Wood051 · ${name}`;
    texture.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.center.set(.5, .5);
    // The reference grain is horizontal: image U must follow axial UV V.
    texture.rotation = Math.PI / 2;
    texture.repeat.set(TILE_MM / WOOD_APPEARANCE_TILE_MM, Math.PI * part.diameter / WOOD_APPEARANCE_TILE_MM);
    texture.anisotropy = 8;
  });
  const job = Promise.all([load('wood-color.jpg', true), load('wood-roughness.jpg'), load('wood-normal.jpg')])
    .then(([map, roughnessMap, normalMap]) => {
      if (disposedSurfaces.has(material)) { for (const texture of pending) texture.dispose(); return; }
      const old = new Set([material.map, material.roughnessMap, material.normalMap]);
      const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=1024;const ctx=canvas.getContext('2d')!;if(!(map.image instanceof HTMLImageElement))throw new Error('목재 이미지 로딩 형식이 올바르지 않습니다.');ctx.drawImage(map.image,0,0,1024,1024);const image=ctx.getImageData(0,0,1024,1024);
      for(let i=0;i<image.data.length;i+=4){const g=(image.data[i]*.2126+image.data[i+1]*.7152+image.data[i+2]*.0722)/255;const v=Math.round(Math.min(1,Math.max(.45,.68+(g-.25)*.8))*255);image.data[i]=image.data[i+1]=image.data[i+2]=v;}
      ctx.putImageData(image,0,0);const neutral=map.clone();neutral.image=canvas;neutral.needsUpdate=true;map.dispose();
      material.map = neutral; material.roughnessMap = roughnessMap; material.normalMap = normalMap;
      material.color.copy(woodTint(part));
      material.normalScale.set(.16, .16);
      material.roughness = ['polished','clear'].includes(part.finish)? .42:part.finish==='oil'?.55:.78;
      material.userData.woodReference = 'ambientCG Wood051 / CC0';
      material.userData.woodTextureStatus = 'ready';
      material.needsUpdate = true;
      for (const texture of old) texture?.dispose();
    })
    .catch(error => {
      for (const texture of pending) texture.dispose();
      material.userData.woodTextureStatus = 'fallback';
      throw error;
    })
    .finally(() => { pendingSurfaceTextures.delete(material); });
  surfaceLoads.set(material, job);
  // Viewport keeps its lightweight fallback on a network failure; exporters can
  // await the original job and report that failure instead of saving half a map.
  void job.catch(() => {});
}

/** Wait for all asynchronously loaded PBR images before encoding an export. */
export async function awaitSurfaceTextures(material: THREE.MeshPhysicalMaterial): Promise<void> {
  await surfaceLoads.get(material);
}

/**
 * Physically based product material. UV convention: U wraps the section once,
 * V is local axial millimetres / 20. Caps use planar millimetres / 20.
 * These maps are optical detail; CAD dimensions, geometry and mass are unchanged.
 */
export function createSurfaceMaterial(part: Part): THREE.MeshPhysicalMaterial {
  const kind = part.material.toLowerCase();
  const wood = /walnut|maple|bamboo|wood|oak|ebony|cherry/.test(kind);
  const rubber = /silicone|rubber|tpu|tpe|eraser/.test(kind);
  const aluminum = /^al\d|alum|aluminium/.test(kind);
  const brass = /brass/.test(kind), copper = /copper/.test(kind), steel = /steel|sus|stainless/.test(kind);
  const titanium = /titan/.test(kind);
  const metal = aluminum || brass || copper || steel || titanium || /silver|gold|zinc|magnesium|platinum/.test(kind);
  const anodized = aluminum && part.finish === 'anodized';
  const gem=/diamond|sapphire|ruby|cubic-zirconia/.test(kind),paint=part.finish==='painted',pvd=part.finish==='pvd';
  const graphite = /graphite/.test(kind);
  const family: SurfaceFamily = wood ? 'wood' : rubber ? 'rubber' : graphite ? 'graphite' : !metal ? 'polymer' : part.finish === 'brushed' ? 'brushed' : part.finish === 'polished' ? 'smooth' : 'bead';
  const variant = wood ? kind : family;
  const pixels = bakeSurface(family, variant);
  const userColor = new THREE.Color(part.color);
  let color = userColor.clone();
  // Exposed conductors retain their characteristic hue. Aluminium finishes and
  // polymers use the chosen colour directly; woods use it as their natural tint.
  if (!anodized && brass) color = new THREE.Color('#c8a662').lerp(userColor, .22);
  else if (!anodized && copper) color = new THREE.Color('#c77b59').lerp(userColor, .22);
  else if (steel) color = new THREE.Color('#c5cbd0').lerp(userColor, .42);
  else if (titanium) color = new THREE.Color('#9397a0').lerp(userColor, .45);
  if(paint||pvd)color.copy(userColor);
  let roughness = part.finish === 'polished' ? .15 : part.finish === 'brushed' ? .32 : part.finish === 'bead' ? .56 : .46;
  if (anodized) roughness = .43;
  if (wood) roughness = part.finish === 'polished' ? .32 : .54;
  if (rubber) roughness = /eraser/.test(kind) ? .92 : .81;
  if (graphite) roughness = .68;
  if (!metal && !wood && !rubber && !graphite) roughness = part.finish === 'polished' ? .19 : part.finish === 'brushed' ? .35 : .47;
  if(gem)roughness=.035;
  const material = new THREE.MeshPhysicalMaterial({
    color,
    flatShading: !['circle', 'ellipse'].includes(part.shape) && part.id !== 'spring' && part.id !== 'clip',
    metalness: gem||paint?0:anodized?.38:metal?.98:0,
    roughness,
    transmission:gem?.94:0,thickness:gem?part.length*.8:0,attenuationDistance:gem?30:Infinity,attenuationColor:gem?color:new THREE.Color('#ffffff'),
    ior:gem?(/diamond/.test(kind)?2.42:1.77): rubber ? 1.43 : kind === 'pc' ? 1.58 : 1.49,
    specularIntensity: rubber ? .36 : graphite ? .38 : 1,
    clearcoat:paint?.4:anodized ? .28 : wood ? (['polished','clear'].includes(part.finish) ? .42 : part.finish==='oil'?.2:.05) : !metal && !rubber && part.finish === 'polished' ? .18 : 0,
    clearcoatRoughness: anodized ? .4 : wood ? .38 : .2,
    anisotropy: metal && part.finish === 'brushed' ? .62 : 0,
    anisotropyRotation: Math.PI / 2,
    sheen: rubber ? .035 : 0,
    sheenColor: color.clone().lerp(new THREE.Color('#ffffff'), .35),
    sheenRoughness: .9,
    map: gem?null:pixels.color ? makeTexture(pixels.color, pixels, part, true) : null,
    roughnessMap: gem?null:makeTexture(pixels.roughness, pixels, part),
    normalMap: gem?null:makeTexture(pixels.normal, pixels, part),
    normalScale: new THREE.Vector2(wood ? .3 : rubber ? .35 : metal && part.finish === 'brushed' ? .035 : .07, wood ? .3 : rubber ? .35 : metal && part.finish === 'brushed' ? .035 : .07),
  });
  material.name = `${part.material} · ${part.finish}`;
  material.userData = { surfaceFamily: family, opticalDetailOnly: true, textureTileMm: TILE_MM, grainDirection: 'axial' };
  if (wood && typeof document !== 'undefined') {
    material.userData.woodTextureStatus = 'loading';
    loadWoodSurface(material, part);
  }
  return material;
}

/** All GPU textures belong to the material; cached CPU pixels can be reused. */
export function disposeSurfaceMaterial(material: THREE.MeshPhysicalMaterial): void {
  disposedSurfaces.add(material);
  for (const texture of pendingSurfaceTextures.get(material) ?? []) texture.dispose();
  pendingSurfaceTextures.delete(material);
  const textures = new Set([material.map, material.roughnessMap, material.normalMap, material.metalnessMap, material.clearcoatMap, material.clearcoatNormalMap, material.clearcoatRoughnessMap, material.anisotropyMap]);
  for (const texture of textures) texture?.dispose();
  material.dispose();
}

/** A render/export copy with seam-safe UVs. Source positions, topology and GPU
 * ownership remain with the caller; this function never mutates or disposes it. */
export function withSurfaceUVs(source: THREE.BufferGeometry, part: Part): THREE.BufferGeometry {
  const geometry = source.index ? source.toNonIndexed() : source.clone();
  const position = geometry.getAttribute('position');
  const uv = new Float32Array(position.count * 2);
  for (let face = 0; face < position.count; face += 3) {
    const cap = Math.abs(position.getY(face) - position.getY(face + 1)) < 1e-6
      && Math.abs(position.getY(face) - position.getY(face + 2)) < 1e-6;
    const us: number[] = [];
    for (let j = 0; j < 3; j++) {
      const index = face + j;
      const x = position.getX(index), y = position.getY(index), z = position.getZ(index);
      if (cap) { uv[index * 2] = x / TILE_MM; uv[index * 2 + 1] = z / TILE_MM; }
      else if (part.id === 'clip') { uv[index * 2] = z / Math.max(.5, part.diameter) + .5; uv[index * 2 + 1] = y / TILE_MM; }
      else { us.push(Math.atan2(z, x) / TAU + .5); uv[index * 2 + 1] = y / TILE_MM; }
    }
    if (us.length) {
      const seam = Math.max(...us) - Math.min(...us) > .5;
      for (let j = 0; j < 3; j++) uv[(face + j) * 2] = us[j] + (seam && us[j] < .5 ? 1 : 0);
    }
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return geometry;
}
