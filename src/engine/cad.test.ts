import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';
import { setOC, measureShapeVolumeProperties } from 'replicad';
import { buildStep, createCadPart } from './cad-kernel';
import { createProject } from './design';

before(async () => {
  setOC(await init({ print: () => {}, printErr: () => {} }));
});

test('native hollow cylinder has analytic B-rep volume and STEP round-trip remains identical', async () => {
  const project = createProject();
  const part = project.parts.find(p => p.id === 'barrel')!;
  Object.assign(part, { shape: 'circle', pattern: 'smooth', length: 100, diameter: 10, bore: 6, endDiameter: undefined });
  const shape = createCadPart(part);
  const properties = measureShapeVolumeProperties(shape);
  assert.ok(Math.abs(properties.volume - Math.PI * (25 - 9) * 100) < .00001);
  properties.delete(); shape.delete();
  const result = await buildStep(project, 'barrel');
  assert.ok(Math.abs(result.volume - result.importedVolume) < .00001);
  const text = await result.blob.text();
  assert.match(text, /^ISO-10303-21;/);
  assert.match(text, /MANIFOLD_SOLID_BREP/);
  assert.match(text, /SI_UNIT\(.MILLI.,.METRE.\)/);
});

test('default hexagonal barrel exports genuine B-rep with its bore', async () => {
  const project = createProject();
  const result = await buildStep(project, 'barrel');
  assert.ok(result.volume > 0);
  assert.ok(Math.abs(result.importedVolume / result.volume - 1) < .000001);
  assert.equal(result.partCount, 1);
});

test('circular ring profile and clip survive native STEP parser roundtrip', async () => {
  const project = createProject();
  const grip = project.parts.find(p => p.id === 'grip')!;
  Object.assign(grip, { shape: 'circle', pattern: 'rings', patternPitch: 2 });
  const ring = await buildStep(project, 'grip');
  assert.ok(ring.volume > 0 && Math.abs(ring.importedVolume / ring.volume - 1) < .000001);
  const clip = await buildStep(project, 'clip');
  assert.ok(clip.volume > 0 && Math.abs(clip.importedVolume / clip.volume - 1) < .000001);
});

test('helical spring is a real capped B-rep with stable STEP volume', async () => {
  const result = await buildStep(createProject(), 'spring');
  assert.ok(result.volume > 0);
  assert.ok(Math.abs(result.importedVolume / result.volume - 1) < .0001);
});

test('unsupported knurling is rejected instead of silently dropped', async () => {
  const project = createProject();
  project.parts.find(p => p.id === 'grip')!.pattern = 'knurl';
  await assert.rejects(buildStep(project, 'grip'), /정밀 STEP 형상은 아직 지원하지 않습니다/);
});

test('the complete default 12-part assembly exports and re-imports without changing volume', async () => {
  const result = await buildStep(createProject(), 'all');
  assert.equal(result.partCount, 12);
  assert.ok(result.blob.size > 100_000);
  assert.ok(Math.abs(result.importedVolume / result.volume - 1) < .0001);
});

test('a bore beyond a polygon inscribed radius cannot export fragmented barrel solids', async () => {
  const project = createProject();
  Object.assign(project.parts.find(p => p.id === 'barrel')!, { shape: 'hexagon', diameter: 10, bore: 9 });
  await assert.rejects(buildStep(project, 'barrel'), /내부 통로가 외형보다/);
});
