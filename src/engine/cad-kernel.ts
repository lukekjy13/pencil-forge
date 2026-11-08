import { Sketch, draw, drawEllipse, exportSTEP, getOC, importSTEP, isShape3D, makeCylinder, measureShapeVolumeProperties, sketchCircle, sketchHelix } from 'replicad';
import type { AnyShape, Shape3D, Point2D } from 'replicad';
import type { Part, PartId, Project } from '../types';
import {resolvedParts} from './assembly';
import { axialRadius, axialSlices, clipMountRadius,clipCenterline,capRoofThickness,boreWallThickness,sectionInradiusFactor,profileRadiusAt } from './geometry';

export type CadScope = 'all' | 'exterior' | PartId;
function solid(shape: AnyShape): Shape3D {
  if (!isShape3D(shape)) throw new Error('CAD 커널이 유효한 입체를 반환하지 않았습니다.');
  return shape;
}

function polygon(points: Point2D[]) {
  let pen = draw(points[0]);
  for (const point of points.slice(1)) pen = pen.lineTo(point);
  return pen.close();
}

/** Native B-rep generated from the same millimetre parameters as the display mesh. */
export function createCadPart(part: Part, bodyRadius = 4.5): Shape3D {
  const h = part.length;
  if (![h, part.diameter, part.bore, part.y].every(Number.isFinite) || h <= 0 || part.diameter <= 0) throw new Error(`${part.name}: 유효하지 않은 치수입니다.`);
  if (part.id === 'clip') {
    const thickness = Math.max(.15, part.bore), width = Math.max(.5, part.diameter);
    const centers:Point2D[]=clipCenterline(part,bodyRadius);
    const outline: Point2D[] = [...centers.map(([x, y]): Point2D => [x + thickness / 2, y]), ...[...centers].reverse().map(([x, y]): Point2D => [x - thickness / 2, y])];
    return solid(polygon(outline).sketchOnPlane('XY').extrude(width).translate(0, 0, -width / 2).rotate(part.angle, [0, 0, 0], [0, 1, 0]).translate(0, part.y, 0));
  }
  if (part.id === 'spring') {
    if (part.bore < 0 || part.bore >= part.diameter) throw new Error(`${part.name}: 스프링 내경은 외경보다 작아야 합니다.`);
    const wire = Math.max(.08, (part.diameter - part.bore) / 2);
    const radius = Math.max(wire, (part.diameter - wire) / 2);
    const turns = Math.max(1, h / Math.max(.6, part.patternPitch));
    if (h / turns <= wire) throw new Error(`${part.name}: 코일 피치가 선재 지름보다 커야 합니다.`);
    return solid(sketchHelix(h / turns, h, radius, [0, 0, -h / 2], [0, 0, 1], true)
      .sweepSketch(plane => sketchCircle(wire / 2, { plane }))
      .rotate(-90, [0, 0, 0], [1, 0, 0]).translate(0, part.y, 0));
  }
  if (part.pattern === 'knurl' || part.pattern === 'grooves') throw new Error(`${part.name}: ${part.pattern === 'knurl' ? '다이아몬드 널링' : '세로 홈'}의 정밀 STEP 형상은 아직 지원하지 않습니다. 패턴을 매끄러움으로 바꾸거나 STL/GLB를 사용하세요.`);
  if (part.pattern === 'rings' && part.shape !== 'circle') throw new Error(`${part.name}: 링 패턴 STEP은 원형 단면에서 지원합니다. 매끄러운 패턴 또는 원형 단면을 선택하세요.`);
  if (part.bore < 0 || part.bore>0&&boreWallThickness(part)<=.000001) throw new Error(`${part.name}: 내부 통로가 외형보다 커서 솔리드를 생성할 수 없습니다.`);
  if(part.seatDiameter&&(part.seatDiameter+.2>=profileRadiusAt(part,1)*2*sectionInradiusFactor(part)|| (part.seatDepth??0)>=capRoofThickness(part)))throw new Error(`${part.name}: 보석 시트가 버튼 벽을 관통합니다. 보석을 줄이거나 외경·길이를 늘리세요.`);
  const base = part.y - h / 2;const roof=capRoofThickness(part);
  if (part.shape === 'circle') {
    const steps = axialSlices(part);
    const outline: Point2D[] = [];
    for (let i = 0; i <= steps; i++) outline.push([axialRadius(part, i / steps), base + i / steps * h]);
    if(roof)outline.push([0,base+h],[0,base+h-roof],[part.bore/2,base+h-roof],[part.bore/2,base]);
    else outline.push([part.bore / 2, base + h], [part.bore / 2, base]);
    let result=solid(polygon(outline).sketchOnPlane('XY').revolve('Y', { origin: [0, 0, 0] }));
    if(part.seatDiameter&&part.seatDepth)result=result.cut(makeCylinder(part.seatDiameter/2,part.seatDepth+.1,[0,base+h-part.seatDepth,0],[0,1,0]));
    return result;
  }

  const n={triangle:3,square:4,hexagon:6,octagon:8}[part.shape as 'triangle'|'square'|'hexagon'|'octagon'];
  const steps=axialSlices(part);
  const sketches=Array.from({length:steps+1},(_,i)=>{
    const r=axialRadius(part,i/steps);
    const drawing=part.shape==='ellipse'?drawEllipse(r,r*.78):polygon(Array.from({length:n},(_,j):Point2D=>{const a=Math.PI/n+j/n*2*Math.PI;return [Math.cos(a)*r,-Math.sin(a)*r]}));
    const sketch=drawing.sketchOnPlane('XY',base+i/steps*h);
    if(!(sketch instanceof Sketch))throw new Error('단일 닫힌 단면을 생성하지 못했습니다.');
    return sketch;
  });
  let shape=solid(sketches[0].loftWith(sketches.slice(1),{ruled:true}));
  if(part.bore>0)shape=shape.cut(makeCylinder(part.bore/2,roof?h-roof+1:h+2,[0,0,base-1],[0,0,1]));
  if(part.seatDiameter&&part.seatDepth)shape=shape.cut(makeCylinder(part.seatDiameter/2,part.seatDepth+.1,[0,0,base+h-part.seatDepth],[0,0,1]));
  return shape.rotate(-90,[0,0,0],[1,0,0]).rotate(-part.angle,[0,0,0],[0,1,0]);
}

function verifySolid(shape: AnyShape): void {
  const checker = new (getOC().BRepCheck_Analyzer)(shape.wrapped, true, false, false);
  const valid = checker.IsValid();
  checker.delete();
  if (!valid) throw new Error('CAD 위상 검사에 실패했습니다. 자기 교차와 치수를 확인하세요.');
}

function volumeOf(shape: AnyShape): number {
  const properties = measureShapeVolumeProperties(solid(shape));
  const volume = properties.volume;
  properties.delete();
  return volume;
}

/** Re-import every exported file and compare its volume before offering it for download. */
export async function buildStep(project: Project, scope: CadScope = 'all') {
  const parts = resolvedParts(project).filter(part => scope === 'all' || (scope === 'exterior' ? part.group !== 'internal' && part.id !== 'lead' : part.id === scope));
  if (!parts.length) throw new Error('내보낼 부품이 없습니다.');
  const shapes: { shape: Shape3D; name: string; color: string }[] = [];
  let imported: AnyShape | undefined;
  try {
    for (const part of parts) shapes.push({ shape: createCadPart(part, clipMountRadius(project, part)), name: `${part.id} — ${part.englishName}`, color: part.color });
    for (const {shape,name} of shapes){try{verifySolid(shape)}catch(error){throw new Error(name+': '+(error instanceof Error?error.message:String(error)))}}
    const volume = shapes.reduce((sum, { shape }) => sum + volumeOf(shape), 0);
    if (!Number.isFinite(volume) || volume <= 0) throw new Error('CAD 솔리드 체적 검증에 실패했습니다.');
    const blob = exportSTEP(shapes, { unit: 'MM', modelUnit: 'MM' });
    imported = await importSTEP(blob);
    verifySolid(imported);
    const importedVolume = volumeOf(imported);
    if (!Number.isFinite(importedVolume) || Math.abs(importedVolume - volume) / volume > .0001) throw new Error('STEP 다시 읽기 검증에서 체적이 일치하지 않았습니다.');
    return { blob, volume, importedVolume, partCount: shapes.length };
  } finally {
    imported?.delete();
    for (const { shape } of shapes) shape.delete();
  }
}
