import type {Part,Project} from '../types';
import {MATERIALS} from './materials';
/** Optional parts are omitted from geometry, cost and files. A grip-free design
 * continues the barrel down to the nose, preserving the overall axial envelope. */
export function resolvedParts(project:Project):Part[]{
 const grip=project.parts.find(p=>p.id==='grip');
 const parts=project.parts.filter(p=>p.enabled!==false).map(original=>{const p={...original};return p.id==='barrel'&&grip?.enabled===false?{...p,length:p.length+grip.length,y:p.y-grip.length/2}:p});
 if(project.accent){
  const button=parts.find(p=>p.id==='button')!;const accent=project.accent;const material=MATERIALS.find(m=>m.id===accent.material)!;
  button.capThickness=Math.max(button.capThickness??.8,accent.height+.4);button.seatDiameter=accent.diameter+.06;button.seatDepth=accent.height+.06;
  parts.push({...button,id:'finial',name:'상단 보석 장식',englishName:'Gemstone finial',group:'accessory',material:accent.material,color:material.color,finish:'polished',process:'purchased',length:accent.height,diameter:accent.diameter,bore:0,y:button.y+button.length/2-accent.height/2,shape:'octagon',pattern:'smooth',edgeRadius:0,bulge:0,endDiameter:undefined,capThickness:undefined,seatDiameter:undefined,seatDepth:undefined,angle:0});
 }
 return parts;
}
export function setPartEnabled(project:Project,id:'grip'|'clip',enabled:boolean):Project{
 return {...project,parts:project.parts.map(part=>{
  if(part.id!==id)return part;
  const next={...part};if(enabled)delete next.enabled;else next.enabled=false;
  return next;
 })};
}
export function configureActuation(project:Project,actuation:'knock'|'twist'):Project{
 return {...project,actuation,parts:project.parts.map(p=>p.id==='button'?{...p,shape:actuation==='twist'?'octagon':'circle',pattern:'smooth'}:p)};
}
