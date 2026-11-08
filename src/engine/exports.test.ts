import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STLLoader } from 'three/addons/loaders/STLLoader.js';
import { modelBlob } from './exports';
import type { Part, Project } from '../types';

const barrel: Part = { id: 'barrel', name: '몸통', englishName: 'Barrel', group: 'body', material: 'aluminum', color: '#769081', finish: 'matte', process: 'cnc', length: 100, diameter: 9, bore: 5, y: 60, shape: 'hexagon', pattern: 'smooth', patternDepth: .2, patternPitch: 1, angle: 0, clipGap: 1, clipCurve: 2, visible: false };
const sleeve: Part = { ...barrel, id: 'sleeve', name: '슬리브', englishName: 'Sleeve', group: 'tip', length: 4, diameter: 1, bore: .6, y: 2, shape: 'circle', visible: true };
const project: Project = { schemaVersion: 1, id: 'export-check', name: 'Export check', brand: 'FORGE', model: 'PF-01', designer: 'Test', description: '', leadDiameter: .5, clearance: .1, length: 110, quantity: 100, targetPrice: 5000, margin: .4, parts: [barrel, sleeve], updatedAt: new Date(0).toISOString() };

test('binary STL round-trips with millimetre extents and includes hidden design parts', async () => {
  const blob = await modelBlob(project, 'stl');
  const buffer = await blob.arrayBuffer();
  const header = new DataView(buffer);
  const triangles = header.getUint32(80, true);
  assert.equal(buffer.byteLength, 84 + triangles * 50);
  assert.ok(triangles > 100);
  const geometry = new STLLoader().parse(buffer);
  geometry.computeBoundingBox();
  assert.ok(Math.abs(geometry.boundingBox!.min.y) < 1e-6);
  assert.ok(Math.abs(geometry.boundingBox!.max.y - 110) < 1e-6);
  assert.ok(geometry.getAttribute('position').array.every(Number.isFinite));
  geometry.dispose();
});

test('part-scoped STL contains only the requested part', async () => {
  const blob = await modelBlob(project, 'stl', 'sleeve');
  const geometry = new STLLoader().parse(await blob.arrayBuffer());
  geometry.computeBoundingBox();
  assert.equal(geometry.boundingBox!.max.y - geometry.boundingBox!.min.y, 4);
  assert.equal(geometry.boundingBox!.max.x - geometry.boundingBox!.min.x, 1);
  geometry.dispose();
});

test('OBJ declares millimetres and keeps distinct named parts', async () => {
  const text = await (await modelBlob(project, 'obj')).text();
  assert.match(text, /units: millimetres/);
  assert.match(text, /o Barrel/);
  assert.match(text, /o Sleeve/);
  assert.ok(text.split('\nf ').length > 100);
});

test('GLB is a genuine glTF 2 binary and converts mm geometry to metre units', async () => {
  const previous = globalThis.FileReader;
  class BlobReader {
    result: ArrayBuffer | null = null;
    onloadend?: () => void;
    readAsArrayBuffer(blob: Blob) { void blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.(); }); }
  }
  globalThis.FileReader = BlobReader as unknown as typeof FileReader;
  try {
    const buffer = await (await modelBlob(project, 'glb')).arrayBuffer();
    const view = new DataView(buffer);
    assert.equal(view.getUint32(0, true), 0x46546c67);
    assert.equal(view.getUint32(4, true), 2);
    assert.equal(view.getUint32(8, true), buffer.byteLength);
    assert.equal(view.getUint32(16, true), 0x4e4f534a);
    const gltf = JSON.parse(new TextDecoder().decode(buffer.slice(20, 20 + view.getUint32(12, true))));
    assert.equal(gltf.asset.version, '2.0');
    assert.ok(gltf.nodes.some((node: { scale?: number[]; matrix?: number[] }) => node.scale?.every(value => value === .001) || node.matrix?.[0] === .001 && node.matrix?.[5] === .001 && node.matrix?.[10] === .001));
    assert.equal(gltf.meshes.length, 2);
  } finally { globalThis.FileReader = previous; }
});
