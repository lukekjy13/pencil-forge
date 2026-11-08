import {test} from 'node:test';
import assert from 'node:assert/strict';
import init from 'replicad-opencascadejs';
import {setOC,measureShapeVolumeProperties} from 'replicad';
import {createProject,estimate,validateProjectImport,partVolume,validate} from './design';
import {isMaterialAllowed,materialsForPart,colorsForMaterial,normalizeAppearance} from './materials';
import {resolvedParts} from './assembly';
import {createPartGeometry,profileRadiusAt,capRoofThickness} from './geometry';
import {createCadPart,buildStep} from './cad-kernel';

test('each functional part has a curated material list and gems belong to a separate setting',()=>{
 assert.equal(isMaterialAllowed('barrel','eraser'),false);assert.equal(isMaterialAllowed('spring','walnut'),false);assert.equal(isMaterialAllowed('lead','gold24'),false);assert.equal(isMaterialAllowed('barrel','diamond'),false);assert.equal(isMaterialAllowed('finial','diamond'),true);assert.equal(isMaterialAllowed('clip','gold24'),false);
 assert.ok(materialsForPart('barrel').some(m=>m.id==='gold18'));assert.deepEqual(materialsForPart('eraser').map(m=>m.id),['eraser']);assert.deepEqual(materialsForPart('lead').map(m=>m.id),['graphite']);
});
test('wood species retain different allowed natural colours and unsupported coatings are corrected',()=>{
 const walnut=colorsForMaterial('walnut','oil'),maple=colorsForMaterial('maple','oil'),ebony=colorsForMaterial('ebony','oil');assert.notEqual(walnut[0].hex,maple[0].hex);assert.notEqual(walnut[0].hex,ebony[0].hex);
 const part=createProject().parts.find(p=>p.id==='barrel')!;const fixed=normalizeAppearance({...part,material:'walnut',finish:'anodized',color:'#00ff00'});assert.notEqual(fixed.finish,'anodized');assert.ok(walnut.some(c=>c.hex===fixed.color));
});
test('default cap is a closed-roof blind hole with adequate height and no top aperture',()=>{
 const p=createProject(),cap=p.parts.find(p=>p.id==='button')!;assert.equal(cap.length,6);assert.ok(capRoofThickness(cap)>=.8);
 const g=createPartGeometry(cap),pos=g.getAttribute('position');const topPoints=Array.from({length:pos.count},(_,i)=>i).filter(i=>Math.abs(pos.getY(i)-cap.length/2)<1e-5);assert.ok(topPoints.some(i=>Math.hypot(pos.getX(i),pos.getZ(i))<1e-5));
 const noRound={...cap,edgeRadius:0};const analytic=Math.PI*((cap.diameter/2)**2*cap.length-(cap.bore/2)**2*(cap.length-capRoofThickness(cap)));assert.ok(Math.abs(partVolume(noRound)/analytic-1)<.001);g.dispose();
});
test('bulge position, taper and edge radius change the actual mesh and resulting mass',()=>{
 const p=createProject(),body=p.parts.find(p=>p.id==='barrel')!;const bulged={...body,shape:'circle' as const,bulge:1.5,bulgePosition:.65,endDiameter:8};assert.ok(profileRadiusAt(bulged,.65)>profileRadiusAt(bulged,0));assert.ok(partVolume(bulged)>partVolume({...bulged,bulge:0}));
 assert.ok(partVolume({...bulged,edgeRadius:1})<partVolume(bulged));assert.notEqual(estimate({...p,parts:p.parts.map(x=>x.id==='barrel'?bulged:x)}).mass,estimate(p).mass);
});
test('legacy short default cap migrates without changing whole pencil length',()=>{
 const p=createProject();delete p.geometryRevision;p.parts=p.parts.map(x=>x.id==='button'?{...x,length:2,y:143}:x.id==='barrel'?{...x,length:90,y:97}:x);const migrated=validateProjectImport(p);assert.equal(migrated.length,144);assert.equal(migrated.parts.find(x=>x.id==='button')!.length,6);
});
test('rounded closed cap, bulged polygon body and diamond setting have valid B-rep and STEP roundtrip',async()=>{
 setOC(await init({print:()=>{},printErr:()=>{}}));const p=createProject();
 const cap=p.parts.find(x=>x.id==='button')!;const shape=createCadPart(cap);const props=measureShapeVolumeProperties(shape);assert.ok(Math.abs(props.volume/partVolume(cap)-1)<.002);props.delete();shape.delete();
 p.parts=p.parts.map(x=>x.id==='barrel'?{...x,bulge:1,bulgePosition:.6}:x);p.accent={material:'diamond',diameter:2.6,height:1};const physical=resolvedParts(p);assert.equal(physical.length,13);assert.equal(physical.find(x=>x.id==='finial')!.material,'diamond');
 const result=await buildStep(p);assert.equal(result.partCount,13);assert.ok(Math.abs(result.importedVolume/result.volume-1)<.0001);
 const gem=estimate(p).parts.find(x=>x.id==='finial')!;assert.ok(gem.mass>0&&gem.materialCost>0);
});

test('rounded thin through-wall ends are reported and rejected before CAD export',async()=>{
 const p=createProject();p.parts=p.parts.map(x=>x.id==='barrel'?{...x,edgeRadius:1.8}:x);
 assert.ok(validate(p).some(v=>v.id==='bore-barrel'&&v.severity==='error'));
 await assert.rejects(buildStep(p,'barrel'),/내부 통로가 외형보다/);
});
