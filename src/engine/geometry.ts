import * as THREE from 'three';
import type { Part, Project } from '../types';
import {resolvedParts} from './assembly';

export function profileRadiusAt(part:Part,t:number){
 const low=(part.endDiameter??part.diameter)/2,high=part.diameter/2;
 let r=low+(high-low)*t;
 if(part.id==='finial'){
  const k=t<.25?.1+t/.25*.65:t<.65?.75+(t-.25)/.4*.25:1-(t-.65)/.35*.2;
  return high*k;
 }
 if(part.profile==='cylinder')r=high;
 if(part.profile==='curved')r=low+(high-low)*Math.sin(t*Math.PI/2);
 if(part.profile==='stepped'){const f=t<.25?0:t<.3?(t-.25)/.05*.45:t<.62?.45:t<.67?.45+(t-.62)/.05*.55:1;r=low+(high-low)*f;}
 const center=part.bulgePosition??.5,phase=t<center?t/center:(1-t)/(1-center);
 r+=(part.bulge??0)*Math.sin(Math.max(0,phase)*Math.PI/2)**2;
 const round=Math.min(part.edgeRadius??0,part.length/3,high*.45);
 const topDistance=(1-t)*part.length;
 if(round>0&&topDistance<round)r-=round-Math.sqrt(Math.max(0,round*round-(round-topDistance)**2));
 return Math.max(.03,r);
}
export function capRoofThickness(part:Part){return part.id==='button'?Math.min(part.length*.9,Math.max(.3,part.capThickness??.8,(part.seatDepth??0)+.3)):0;}

export function axialRadius(part: Part, t: number) {
  const h = Math.max(.02, part.length);
  const r = profileRadiusAt(part,t);
  const fade = Math.min(1,t*h/.8,(1-t)*h/.8);
  return r - (part.pattern==='rings' ? Math.min(part.patternDepth,Math.max(0,r-part.bore/2-.1))*(.5+.5*Math.cos(t*h/Math.max(.6,part.patternPitch)*Math.PI*2))*fade : 0);
}
// Keep ruled polygon lofts coarse enough for reliable OpenCascade bore booleans.
// Display, volume integration and CAD use identical axial stations.
export function axialSlices(part: Part) { if(part.id==='finial')return 20;if(part.bulge)return 16;if(part.edgeRadius||part.profile&& !['conical','cylinder'].includes(part.profile))return 100; return part.pattern==='rings' || part.pattern==='knurl' || part.pattern==='grooves' ? Math.min(700,Math.max(24,Math.ceil(part.length/Math.max(.6,part.patternPitch)*8))) : 1; }

export function sectionInradiusFactor(part:Part){
 const sides={triangle:3,square:4,hexagon:6,octagon:8}[part.shape as 'triangle'|'square'|'hexagon'|'octagon'];
 return sides?Math.cos(Math.PI/sides):part.shape==='ellipse'?.78:1;
}
/** Minimum remaining wall along the actual bore, including taper and rounded ends. */
export function boreWallThickness(part:Part){
 if(part.id==='clip')return part.bore;
 const top=1-capRoofThickness(part)/part.length;
 let radius=Infinity;
 for(let i=0;i<=100;i++)radius=Math.min(radius,axialRadius(part,top*i/100));
 return radius*sectionInradiusFactor(part)-part.bore/2;
}

/** All dimensions and geometry are in millimetres. Profiles are centred on Y. */
function profileRadius(part: Part, theta: number, radius: number) {
  const sides = {triangle: 3, square: 4, hexagon: 6, octagon: 8}[part.shape as 'triangle'|'square'|'hexagon'|'octagon'];
  if (!sides) return radius;
  const period = Math.PI * 2 / sides;
  const a = ((theta + period / 2) % period + period) % period - period / 2;
  return radius * Math.cos(Math.PI / sides) / Math.cos(a);
}

function unscaledSurfaceRadius(part:Part, theta:number, t:number) {
  const h=Math.max(.02,part.length);
  const r=profileRadiusAt(part,t);
  let radial=profileRadius(part,theta,r);
  const edgeFade=Math.min(1,t*h/.8,(1-t)*h/.8);
  const depth=Math.min(part.patternDepth,Math.max(0,radial-part.bore/2-.1));
  if(part.pattern==='rings') radial-=depth*(.5+.5*Math.cos(t*h/Math.max(.6,part.patternPitch)*Math.PI*2))*edgeFade;
  if(part.pattern==='grooves') radial-=depth*Math.pow(.5+.5*Math.cos(theta*16),5)*edgeFade;
  if(part.pattern==='knurl') {
    const wave=Math.cos(theta*32+t*h/Math.max(.8,part.patternPitch)*Math.PI*2)*Math.cos(theta*32-t*h/Math.max(.8,part.patternPitch)*Math.PI*2);
    radial-=depth*(.5+.5*wave)*edgeFade;
  }
  return radial;
}

/** Actual barrel surface along the clip's mount direction, including section rotation and taper. */
export function clipMountRadius(project:Project, clip:Part) {
  const body=project.parts.find(p=>p.id==='barrel');
  if(!body)return 4.5;
  const t=THREE.MathUtils.clamp((clip.y+clip.length/2-body.y+body.length/2)/body.length,0,1);
  // Clip uses Three.js rotateY(+angle); axial profiles use rotateY(-angle).
  const theta=-(clip.angle+body.angle)*Math.PI/180;
  const ellipse=body.shape==='ellipse'?.78:1;
  const parameterAngle=Math.atan2(Math.sin(theta)/ellipse,Math.cos(theta));
  const scale=Math.hypot(Math.cos(parameterAngle),ellipse*Math.sin(parameterAngle));
  return unscaledSurfaceRadius(body,parameterAngle,t)*scale;
}

export function createPartGeometry(part: Part, bodyRadius = 4.5): THREE.BufferGeometry {
  if (part.id === 'clip') return createClipGeometry(part, bodyRadius);
  if (part.id === 'spring') {
    const wire = Math.max(.08, (part.diameter-part.bore)/2);
    const radius = Math.max(wire, (part.diameter - wire) / 2);
    const turns = Math.max(1, part.length / Math.max(.6,part.patternPitch));
    class Helix extends THREE.Curve<THREE.Vector3> {
      constructor(){super();}
      getPoint(t: number, target = new THREE.Vector3()) { return target.set(radius * Math.cos(t * Math.PI * 2 * turns), (t-.5)*part.length, radius * Math.sin(t*Math.PI*2*turns)); }
    }
    const curve = new Helix();
    const segments = Math.max(120, Math.ceil(turns*28));
    const tube = new THREE.TubeGeometry(curve, segments, wire/2, 16, false);
    const positions = Array.from(tube.attributes.position.array);
    const caps = Array.from(tube.index!.array);
    const first = curve.getPoint(0), last = curve.getPoint(1);
    const c0 = positions.length/3; positions.push(first.x, first.y, first.z);
    const c1 = positions.length/3; positions.push(last.x, last.y, last.z);
    for(let i=0;i<16;i++) {
      caps.push(c0,i,i+1);
      caps.push(c1,segments*17+i+1,segments*17+i);
    }
    tube.setAttribute('position', new THREE.Float32BufferAttribute(positions,3));
    tube.setIndex(caps); tube.computeVertexNormals(); tube.computeBoundingBox();
    return tube;
  }
  const N = 96;
  const h = Math.max(.02, part.length);
  const hasBore = part.bore > 0;
  const bore = Math.max(0, part.bore / 2);
  const roof=capRoofThickness(part);
  const slices=axialSlices(part);
  const vertices: number[] = [], indices: number[] = [];
  const ellipse = part.shape === 'ellipse' ? .78 : 1;
  const phase = part.angle * Math.PI / 180;
  for(let j=0;j<=slices;j++) {
    const t = j/slices;
    for(let i=0;i<N;i++) {
      const a=i/N*Math.PI*2;
      const radial=unscaledSurfaceRadius(part,a,t);
      const x = Math.cos(a)*radial, z = Math.sin(a)*radial*ellipse;
      vertices.push(x*Math.cos(phase)-z*Math.sin(phase), (t-.5)*h, x*Math.sin(phase)+z*Math.cos(phase));
    }
  }
  for(let j=0;j<slices;j++) for(let i=0;i<N;i++) {
    const a=j*N+i,b=(j+1)*N+i,c=(j+1)*N+(i+1)%N,d=j*N+(i+1)%N;
    indices.push(a,b,c,a,c,d);
  }
  if(hasBore) {
    const start=vertices.length/3;
    for(let j=0;j<2;j++) for(let i=0;i<N;i++) { const a=i/N*Math.PI*2; vertices.push(bore*Math.cos(a), j===0?-h/2:h/2-roof, bore*Math.sin(a)); }
    for(let i=0;i<N;i++) {
      const next=(i+1)%N, a=start+i,b=start+N+i,c=start+N+next,d=start+next;
      indices.push(a,c,b,a,d,c);
      indices.push(i,next,start+next,i,start+next,start+i);
      const u=slices*N+i,v=slices*N+next;
      if(!roof)indices.push(u,start+N+next,v,u,start+N+i,start+N+next);
    }
    if(roof){
      const ceiling=vertices.length/3;vertices.push(0,h/2-roof,0);
      for(let i=0;i<N;i++)indices.push(ceiling,start+N+i,start+N+(i+1)%N);
      if((part.seatDiameter??0)>0){
        const seat=vertices.length/3,rs=part.seatDiameter!/2,depth=part.seatDepth??.5;
        for(let j=0;j<2;j++)for(let i=0;i<N;i++){const a=i/N*Math.PI*2;vertices.push(rs*Math.cos(a),h/2-depth+j*depth,rs*Math.sin(a));}
        const bottom=vertices.length/3;vertices.push(0,h/2-depth,0);
        for(let i=0;i<N;i++){const n=(i+1)%N,a=seat+i,b=seat+N+i,c=seat+N+n,d=seat+n,u=slices*N+i,v=slices*N+n;indices.push(a,c,b,a,d,c,u,seat+N+n,v,u,seat+N+i,seat+N+n,bottom,seat+n,seat+i);}
      }else{
        const top=vertices.length/3;vertices.push(0,h/2,0);
        for(let i=0;i<N;i++)indices.push(top,slices*N+(i+1)%N,slices*N+i);
      }
    }
  } else {
    const bottom=vertices.length/3; vertices.push(0,-h/2,0);const top=vertices.length/3;vertices.push(0,h/2,0);
    for(let i=0;i<N;i++) {const n=(i+1)%N;indices.push(bottom,i,n,top,slices*N+n,slices*N+i);}
  }
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
  return g;
}

export function clipCenterline(part:Part,bodyRadius=4.5):[number,number][]{
 const thickness=Math.max(.15,part.bore),centers:[number,number][]=[];
 for(let i=0;i<=36;i++){
  const t=i/36,hook=t>.86?(t-.86)/.14*(part.clipGap+thickness/2+.2):0,toe=t<.12?(1-t/.12)*(part.clipToe??.8):0;
  const peak=part.clipBendPosition??.5,bendT=t<peak?t/peak*.5:.5+(t-peak)/(1-peak)*.5;
  const bend=part.clipStyle==='straight'?0:part.clipStyle==='wave'?part.clipCurve*(Math.sin(bendT*Math.PI)+.42*Math.sin(bendT*Math.PI*3)):part.clipCurve*Math.sin(bendT*Math.PI);
  centers.push([bodyRadius+part.clipGap+bend-hook+toe,(t-.5)*part.length]);
 }
 return centers;
}
export function createClipGeometry(part: Part, bodyRadius=4.5) {
  const count=36, thickness=Math.max(.15, part.bore), width=Math.max(.5,part.diameter), h=part.length;
  const centers=clipCenterline(part,bodyRadius);
  const shape=new THREE.Shape();
  centers.forEach(([x,y],i)=>i?shape.lineTo(x+thickness/2,y):shape.moveTo(x+thickness/2,y));
  [...centers].reverse().forEach(([x,y])=>shape.lineTo(x-thickness/2,y));shape.closePath();
  const g=new THREE.ExtrudeGeometry(shape,{depth:width,bevelEnabled:false,steps:1});g.translate(0,0,-width/2);g.rotateY(part.angle*Math.PI/180);g.computeBoundingBox();g.computeVertexNormals();return g;
}

function partMaterial(part: Part) {
  const metals = ['aluminum','aluminium','brass','steel','titanium','copper','silver','gold','zinc','magnesium','platinum'];
  const metal = part.material.startsWith('al') || metals.some(m=>part.material.toLowerCase().includes(m));
  return new THREE.MeshStandardMaterial({color:part.color,metalness:metal?.83:0.08,roughness:part.finish==='polished'?.16:part.finish==='brushed'?.32:.48,flatShading:!['circle','ellipse'].includes(part.shape)});
}

export function createAssembly(project: Project, options: {visibleOnly?:boolean;includeInternal?:boolean}={}) {
  const group=new THREE.Group();group.name=project.name;
  resolvedParts(project).forEach(part=>{
    if(options.visibleOnly && !part.visible)return;
    if(options.includeInternal===false && (part.group==='internal'||part.id==='lead'))return;
    const mesh=new THREE.Mesh(createPartGeometry(part,clipMountRadius(project,part)),partMaterial(part));mesh.position.y=part.y;mesh.name=part.englishName;mesh.userData={partId:part.id,material:part.material,units:'mm',parameters:{...part}};group.add(mesh);
  });
  group.userData={units:'mm',schemaVersion:project.schemaVersion,sourceProjectId:project.id};return group;
}

/** Signed tetrahedron integration over the actual closed mesh. mm³. */
export function geometryMassProperties(part: Part, bodyRadius=4.5) {
  const g=createPartGeometry(part,bodyRadius);
  const p=g.getAttribute('position'), index=g.getIndex();
  let volume=0, momentY=0;
  const count=index?index.count:p.count;
  for(let i=0;i<count;i+=3) {
    const a=index?index.getX(i):i,b=index?index.getX(i+1):i+1,c=index?index.getX(i+2):i+2;
    const tetra=(p.getX(a)*(p.getY(b)*p.getZ(c)-p.getZ(b)*p.getY(c))-p.getY(a)*(p.getX(b)*p.getZ(c)-p.getZ(b)*p.getX(c))+p.getZ(a)*(p.getX(b)*p.getY(c)-p.getY(b)*p.getX(c)))/6;
    volume+=tetra;momentY+=tetra*(p.getY(a)+p.getY(b)+p.getY(c))/4;
  }
  g.dispose();return {volume:Math.abs(volume),centerY:Math.abs(volume)>1e-10?momentY/volume:0};
}

export function geometryVolume(part: Part, bodyRadius=4.5) { return geometryMassProperties(part,bodyRadius).volume; }
