import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPartGeometry, createAssembly, geometryVolume, clipMountRadius } from './geometry';
import {createProject} from './design';
import {resolvedParts} from './assembly';
import type { Part, Project } from '../types';
const base:Part={id:'barrel',name:'몸통',englishName:'Barrel',group:'body',material:'al6061',color:'#93a88f',finish:'anodized',process:'cnc',length:90,diameter:9,bore:5.6,y:97,shape:'circle',pattern:'smooth',patternDepth:.16,patternPitch:1.6,angle:0,clipGap:1,clipCurve:1.8,visible:true};
function boundaryEdges(part:Part) {
  const geometry=createPartGeometry(part), position=geometry.getAttribute('position'), index=geometry.index;
  const keys=Array.from({length:position.count},(_,i)=>[position.getX(i),position.getY(i),position.getZ(i)].map(v=>Math.round(v*1e4)).join(','));
  const edges=new Map<string,number>();
  for(let i=0;i<(index?.count??position.count);i+=3){const face=[0,1,2].map(j=>keys[index?index.getX(i+j):i+j]);for(let j=0;j<3;j++){const key=[face[j],face[(j+1)%3]].sort().join('/');edges.set(key,(edges.get(key)??0)+1);}}
  geometry.dispose();return [...edges.values()].filter(n=>n!==2).length;
}
test('annular barrel has real through-bore, closed manifold and correct mm volume',()=>{
  const g=createPartGeometry(base);assert.equal(g.boundingBox!.max.y-g.boundingBox!.min.y,90);
  const exact=Math.PI*(9**2-5.6**2)/4*90;assert.ok(Math.abs(geometryVolume(base)-exact)/exact<.001);
  assert.equal(boundaryEdges(base),0);g.dispose();
});
test('polygon and tapered tube volumes follow parametric profiles',()=>{
  const p={...base,shape:'hexagon' as const};const exact=(6*9**2*Math.sin(Math.PI/3)/8-Math.PI*5.6**2/4)*90;
  assert.ok(Math.abs(geometryVolume(p)-exact)/exact<.002);assert.equal(boundaryEdges(p),0);
  const nose={...base,id:'nose' as const,length:16,diameter:8,endDiameter:1.8,bore:.9};const cone=Math.PI*16/12*(8**2+8*1.8+1.8**2)-Math.PI*.9**2/4*16;
  assert.ok(Math.abs(geometryVolume(nose)-cone)/cone<.001);assert.equal(boundaryEdges(nose),0);
});
test('physical patterns remove actual volume and preserve closed surfaces',()=>{
  for(const pattern of ['rings','knurl','grooves'] as const){const p={...base,length:12,pattern};assert.ok(geometryVolume(p)<geometryVolume({...p,pattern:'smooth'}));assert.equal(boundaryEdges(p),0);}
});
test('spring and connected clip meshes have capped ends',()=>{
  const spring={...base,id:'spring' as const,length:14,diameter:4.6,bore:3.8,patternPitch:1.6};
  assert.equal(boundaryEdges(spring),0);assert.ok(geometryVolume(spring)>0);
  const clip={...base,id:'clip' as const,length:36,diameter:3.2,bore:.65};assert.equal(boundaryEdges(clip),0);assert.ok(geometryVolume(clip)>0);
});
test('assembly export retains absolute mm placement and independent named parts',()=>{
  const project={schemaVersion:1,id:'test',name:'Test',length:144,parts:[base,{...base,id:'grip',englishName:'Grip',y:36,visible:false}]} as Project;
  const full=createAssembly(project);assert.equal(full.children.length,2);assert.equal(full.children[0].position.y,97);assert.equal(full.children[0].userData.partId,'barrel');
  assert.equal(createAssembly(project,{visibleOnly:true}).children.length,1);
});

test('clip hook embeds into actual hexagonal and rotated elliptical barrel surfaces',()=>{
  const clip={...base,id:'clip' as const,length:36,diameter:3.2,bore:.65,y:121,clipGap:1,clipCurve:1.8};
  for(const body of [{...base,shape:'hexagon' as const},{...base,shape:'ellipse' as const,angle:30}]) {
    const rotatedClip={...clip,angle:body.shape==='ellipse'?45:0};
    const project={parts:[body,rotatedClip]} as Project;
    const radius=clipMountRadius(project,rotatedClip);
    if(body.shape==='hexagon')assert.ok(Math.abs(radius-4.5*Math.cos(Math.PI/6))<1e-8);
    else {
      const theta=-(rotatedClip.angle+body.angle)*Math.PI/180;
      const expected=4.5*.78/Math.hypot(.78*Math.cos(theta),Math.sin(theta));
      assert.ok(Math.abs(radius-expected)<1e-8);
    }
    const geometry=createPartGeometry(rotatedClip,radius),p=geometry.getAttribute('position'),angle=rotatedClip.angle*Math.PI/180;
    let hookOuter=-Infinity;
    for(let i=0;i<p.count;i++)if(Math.abs(p.getY(i)-rotatedClip.length/2)<1e-4)hookOuter=Math.max(hookOuter,p.getX(i)*Math.cos(angle)-p.getZ(i)*Math.sin(angle));
    assert.ok(Math.abs(hookOuter-(radius-.2))<1e-5,'hook upper end penetrates barrel surface by 0.2 mm');geometry.dispose();
  }
});

test('closed button roof and recessed gemstone seat remain watertight meshes',()=>{
 const project=createProject();assert.equal(boundaryEdges(project.parts.find(p=>p.id==='button')!),0);
 project.accent={material:'diamond',diameter:2.6,height:1};
 for(const part of resolvedParts(project).filter(p=>['button','finial'].includes(p.id)))assert.equal(boundaryEdges(part),0);
});
