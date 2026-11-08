import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPartGeometry } from './geometry';
import { createProject } from './design';
import { withSurfaceUVs, createSurfaceMaterial, disposeSurfaceMaterial } from './surface';

test('surface UV mapping preserves source geometry, exact triangle positions and millimetre bounds', () => {
  const part = createProject().parts.find(item => item.id === 'barrel')!;
  const source = createPartGeometry(part);
  let disposed = false;
  source.addEventListener('dispose', () => { disposed = true; });
  const sourcePosition = source.getAttribute('position');
  const sourceIndex = source.index!;
  const mapped = withSurfaceUVs(source, part);
  const positions = mapped.getAttribute('position');
  assert.equal(source.getAttribute('uv'), undefined);
  assert.equal(disposed, false);
  assert.equal(positions.count, sourceIndex.count);
  for (let i = 0; i < positions.count; i++) {
    const index = sourceIndex.getX(i);
    assert.equal(positions.getX(i), sourcePosition.getX(index));
    assert.equal(positions.getY(i), sourcePosition.getY(index));
    assert.equal(positions.getZ(i), sourcePosition.getZ(index));
  }
  mapped.computeBoundingBox(); source.computeBoundingBox();
  assert.deepEqual(mapped.boundingBox, source.boundingBox);
  assert.ok(mapped.getAttribute('uv').array.every(Number.isFinite));
  mapped.dispose(); source.dispose();
});

test('cylindrical UVs keep 20 mm axial texture scale without stretching across the wrap seam', () => {
  const part = { ...createProject().parts.find(item => item.id === 'barrel')!, shape: 'circle' as const, pattern: 'smooth' as const };
  const source = createPartGeometry(part), mapped = withSurfaceUVs(source, part);
  const positions = mapped.getAttribute('position'), uv = mapped.getAttribute('uv');
  for (let i = 0; i < positions.count; i += 3) {
    const ymin = Math.min(positions.getY(i), positions.getY(i + 1), positions.getY(i + 2));
    const ymax = Math.max(positions.getY(i), positions.getY(i + 1), positions.getY(i + 2));
    if (ymax - ymin < 1e-6) continue;
    const u = [uv.getX(i), uv.getX(i + 1), uv.getX(i + 2)];
    assert.ok(Math.max(...u) - Math.min(...u) < .1, 'circumferential seam is locally continuous');
    for (let j = 0; j < 3; j++) assert.ok(Math.abs(uv.getY(i + j) * 20 - positions.getY(i + j)) < 1e-4);
  }
  mapped.dispose(); source.dispose();
});

test('wood, dielectric polymers, anodized oxide and brushed conductors retain different physical responses', () => {
  const base = createProject().parts.find(item => item.id === 'barrel')!;
  const wood = createSurfaceMaterial({ ...base, material: 'walnut', finish: 'matte' });
  const plastic = createSurfaceMaterial({ ...base, material: 'abs', finish: 'polished' });
  const raw = createSurfaceMaterial({ ...base, material: 'steel', finish: 'brushed' });
  const oxide = createSurfaceMaterial({ ...base, material: 'al6061', finish: 'anodized' });
  assert.equal(wood.metalness, 0); assert.ok(wood.map);
  assert.equal(plastic.metalness, 0); assert.equal(plastic.color.getHexString(), base.color.slice(1));
  assert.ok(raw.metalness > .95); assert.ok(raw.anisotropy > 0);
  assert.ok(oxide.metalness < raw.metalness); assert.ok(oxide.clearcoat > 0);
  assert.notEqual(wood.roughness, plastic.roughness);
  for (const material of [wood, plastic, raw, oxide]) disposeSurfaceMaterial(material);
});
