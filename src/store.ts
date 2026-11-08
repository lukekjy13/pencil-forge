import { create } from 'zustand';
import {isMaterialAllowed} from './engine/materials';
import type { Part, PartId, Project } from './types';
import { createProject, updateLead, updateProjectDimension, validateProjectImport, resizeExteriorPart, EXTERIOR_AXIAL_PARTS, axialExtent } from './engine/design';
const KEY='pencil-forge.project.v1';const HISTORY_KEY='pencil-forge.versions.v1';
export interface SavedVersion {id:string;date:string;label:string;project:Project}
const clone=(p:Project):Project=>structuredClone(p);
const safeStorage=(key:string,value:unknown)=>{try{if(typeof localStorage!=='undefined')localStorage.setItem(key,JSON.stringify(value));}catch{/* Storage-full or private mode: current design remains in memory. */}};
function readSaved():Project {try{if(typeof localStorage!=='undefined'){const s=localStorage.getItem(KEY);if(s)return validateProjectImport(JSON.parse(s));}}catch{/* Corrupt or old saves must not prevent opening the editor. */}return createProject();}
function readVersions():SavedVersion[]{try{if(typeof localStorage!=='undefined'){const s=localStorage.getItem(HISTORY_KEY);if(s){const parsed=JSON.parse(s);if(Array.isArray(parsed))return parsed.slice(-30).map((v:SavedVersion)=>({...v,project:validateProjectImport(v.project)}));}}}catch{}return [];}
function errorText(error:unknown):string {
  if(error && typeof error==='object' && 'issues' in error){const issues=(error as {issues:{path:unknown[];message:string}[]}).issues;const issue=issues[0];return issue?`${issue.path.join('.')}: ${issue.message}`:'입력값을 확인하세요.';}
  return error instanceof Error?error.message:'입력값을 확인하세요.';
}
interface DesignStore {project:Project;selected:PartId;mode:'easy'|'advanced'|'engineering';past:Project[];future:Project[];canUndo:boolean;canRedo:boolean;inputError:string|null;clearInputError:()=>void;history:SavedVersion[];updatePart:(id:PartId,patch:Partial<Part>)=>void;updateProject:(patch:Partial<Project>)=>void;setLength:(length:number)=>void;setLead:(diameter:number)=>void;selectPart:(id:PartId)=>void;setMode:(mode:DesignStore['mode'])=>void;undo:()=>void;redo:()=>void;loadProject:(project:Project)=>void;newProject:(template?:string)=>void;saveSnapshot:()=>void;restoreSnapshot:(id:string)=>void;deleteSnapshot:(id:string)=>void;commit:(project:Project)=>void;}
export const useDesignStore=create<DesignStore>((set,get)=>({project:readSaved(),selected:'barrel',mode:'advanced',past:[],future:[],canUndo:false,canRedo:false,inputError:null,clearInputError:()=>set({inputError:null}),history:readVersions(),
  commit:(project)=>{try{const next=validateProjectImport({...project,updatedAt:new Date().toISOString()});const current=get();if(JSON.stringify({...next,updatedAt:''})===JSON.stringify({...current.project,updatedAt:''})){set({inputError:null});return;}safeStorage(KEY,next);set({project:next,past:[...current.past.slice(-99),clone(current.project)],future:[],canUndo:true,canRedo:false,inputError:null});}catch(error){set({inputError:errorText(error)});}},
  updatePart:(id,patch)=>{try{if(patch.material&&!isMaterialAllowed(id,patch.material))throw new Error('이 부품에 사용할 수 없는 소재입니다.');const p=get().project;const current=p.parts.find(v=>v.id===id);if(!current)throw new Error('부품을 찾을 수 없습니다.');let next=p;
    if(EXTERIOR_AXIAL_PARTS.includes(id)&&patch.length!==undefined&&patch.length!==current.length)next=resizeExteriorPart(p,id,patch.length);
    // The derived centre from a linked length edit takes precedence over a stale inspector y value.
    const edit={...patch};if(EXTERIOR_AXIAL_PARTS.includes(id)&&patch.length!==undefined)delete edit.y;
    next={...next,parts:next.parts.map(v=>v.id===id?{...v,...edit,id:v.id}:v)};
    if(EXTERIOR_AXIAL_PARTS.includes(id)&&edit.y!==undefined)next={...next,length:axialExtent(next).length};
    get().commit(next);
  }catch(error){set({inputError:errorText(error)});}},
  updateProject:(patch)=>{try{const p=get().project;let next={...p,...patch};if(patch.length!==undefined&&patch.length!==p.length)next={...updateProjectDimension(p,patch.length),...patch};if(patch.clearance!==undefined||patch.leadDiameter!==undefined)next=updateLead(next,next.leadDiameter);get().commit(next);}catch(error){set({inputError:errorText(error)});}},
  setLength:(length)=>{try{get().commit(updateProjectDimension(get().project,length));}catch(error){set({inputError:errorText(error)});}},
  setLead:(diameter)=>{try{get().commit(updateLead(get().project,diameter));}catch(error){set({inputError:errorText(error)});}},
  selectPart:(selected)=>set({selected}),setMode:(mode)=>set({mode}),
  undo:()=>{const {past,project,future}=get();if(!past.length)return;const previous=past[past.length-1];safeStorage(KEY,previous);set({project:clone(previous),past:past.slice(0,-1),future:[clone(project),...future],canUndo:past.length>1,canRedo:true,inputError:null});},
  redo:()=>{const {past,project,future}=get();if(!future.length)return;const next=future[0];safeStorage(KEY,next);set({project:clone(next),past:[...past,clone(project)],future:future.slice(1),canUndo:true,canRedo:future.length>1,inputError:null});},
  loadProject:(p)=>get().commit(p),
  newProject:(template)=>{get().commit(createProject(template));set({selected:'barrel'});},
  saveSnapshot:()=>{const project=clone(get().project);const date=new Date().toISOString();const id=typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`version-${Date.now()}-${Math.random().toString(36).slice(2)}`;const history=[...get().history,{id,date,label:`${project.name} · v${get().history.length+1}`,project}].slice(-30);safeStorage(KEY,project);safeStorage(HISTORY_KEY,history);set({history});},
  restoreSnapshot:(id)=>{const version=get().history.find(v=>v.id===id);if(version)get().loadProject(version.project);},
  deleteSnapshot:(id)=>{const history=get().history.filter(v=>v.id!==id);safeStorage(HISTORY_KEY,history);set({history});},
}));
