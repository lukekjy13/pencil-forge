import type {Part,Project} from '../types';
import {resizeExteriorPart} from './design';
import {configureActuation} from './assembly';
export const NOSE_DESIGNS:{id:string;name:string;length:number;diameter:number;end:number;profile:NonNullable<Part['profile']>}[]=[
 {id:'long',name:'긴 테이퍼',length:20,diameter:8,end:1.8,profile:'conical'},
 {id:'short',name:'짧은 테이퍼',length:10,diameter:8,end:2,profile:'conical'},
 {id:'stepped',name:'단차형',length:16,diameter:8,end:1.8,profile:'stepped'},
 {id:'curved',name:'곡면형',length:18,diameter:8,end:1.8,profile:'curved'},
 {id:'cylinder',name:'원통형',length:12,diameter:5,end:5,profile:'cylinder'},
];
export function applyNoseDesign(project:Project,id:string):Project{
 const design=NOSE_DESIGNS.find(d=>d.id===id);if(!design)return project;
 const resized=resizeExteriorPart(project,'nose',design.length);
 return {...resized,parts:resized.parts.map(p=>p.id==='nose'?{...p,profile:design.profile,diameter:design.diameter,endDiameter:Math.max(design.end,p.bore+.5),shape:'circle'}:p)};
}
export function applyClipDesign(project:Project,id:NonNullable<Part['clipStyle']>):Project{
 return {...project,parts:project.parts.map(p=>p.id==='clip'?{...p,clipStyle:id,diameter:id==='wide'?5.5:id==='straight'?2.8:3.2,clipCurve:id==='straight'?0:id==='wave'?1.4:1.8}:p)};
}
export function applyActuation(project:Project,actuation:'knock'|'twist'):Project{
 const resized=resizeExteriorPart(project,'button',actuation==='twist'?9:6);
 const configured=configureActuation(resized,actuation);
 return {...configured,parts:configured.parts.map(p=>p.id==='button'?{...p,diameter:actuation==='twist'?8:7,profile:undefined,finish:'polished'}:p)};
}
