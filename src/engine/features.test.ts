import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createProject,estimate,validateProjectImport,exportCSV} from './design';
import {resolvedParts,setPartEnabled} from './assembly';
import {applyNoseDesign,applyClipDesign,applyActuation,NOSE_DESIGNS} from './variants';
import {createAssembly,createPartGeometry,geometryVolume} from './geometry';
import {parseNumericDraft} from './input';
import {setOC} from 'replicad';
import init from 'replicad-opencascadejs';
import {buildStep} from './cad-kernel';

test('number drafts allow replacement, decimals, negative angles and decimal comma without clamping intermediates',()=>{
 for(const [s,v] of [['145.5',145.5],['.15',.15],['-30',-30],['0,08',.08],['12.',12]] as const)assert.equal(parseNumericDraft(s,-360,360).value,v);
 for(const s of ['', '-', '.', 'NaN','1e999','abc'])assert.ok(parseNumericDraft(s,-360,360).error);
 assert.ok(parseNumericDraft('9',100,200).error);assert.equal(parseNumericDraft('149',100,200).value,149);
});
test('removing grip preserves whole extent, fills barrel and changes cost/files without losing restore parameters',()=>{
 const p=createProject(),off=setPartEnabled(p,'grip',false),parts=resolvedParts(off),body=parts.find(p=>p.id==='barrel')!;
 assert.equal(parts.length,11);assert.equal(body.length,118);assert.equal(body.y-body.length/2,20);assert.equal(Math.max(...parts.map(p=>p.y+p.length/2)),144);
 assert.notEqual(estimate(p).mass,estimate(off).mass);assert.equal(estimate(off).parts.some(p=>p.id==='grip'),false);
 assert.equal(createAssembly(off).children.length,11);assert.equal(exportCSV(off).includes('"grip"'),false);
 assert.deepEqual(resolvedParts(setPartEnabled(off,'grip',true)),p.parts);
 assert.equal(validateProjectImport(JSON.parse(JSON.stringify(off))).parts.find(p=>p.id==='grip')!.enabled,false);
});
test('nose and clip designs change actual geometry while maintaining valid persisted parameters',()=>{
 const p=createProject();const volumes=NOSE_DESIGNS.map(d=>geometryVolume(applyNoseDesign(p,d.id).parts.find(p=>p.id==='nose')!));
 assert.ok(new Set(volumes.map(v=>v.toFixed(2))).size>=4);
 const arch=applyClipDesign(p,'arched').parts.find(p=>p.id==='clip')!,wave=applyClipDesign(p,'wave').parts.find(p=>p.id==='clip')!;
 assert.notDeepEqual(Array.from(createPartGeometry(arch).getAttribute('position').array),Array.from(createPartGeometry(wave).getAttribute('position').array));
 const twist=validateProjectImport(applyActuation(p,'twist'));assert.equal(twist.actuation,'twist');assert.equal(twist.parts.find(p=>p.id==='button')!.length,9);assert.equal(twist.length,147);
 assert.equal(applyActuation(twist,'knock').length,144);
});
test('new optional parts, shaped noses, wave clip and twist crown export genuine STEP and re-import',async()=>{
 setOC(await init({print:()=>{},printErr:()=>{}}));
 let p=setPartEnabled(applyActuation(applyClipDesign(applyNoseDesign(createProject(),'stepped'),'wave'),'twist'),'grip',false);
 const result=await buildStep(p);assert.equal(result.partCount,11);assert.ok(Math.abs(result.importedVolume/result.volume-1)<.0001);
 p=applyNoseDesign(p,'curved');const curved=await buildStep(p,'nose');assert.ok(curved.volume>0);assert.ok(Math.abs(curved.importedVolume/curved.volume-1)<.0001);
});
