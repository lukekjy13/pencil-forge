import {create} from 'zustand';
import {createCompany,validateCompany} from './engine/business';
import type {Company} from './engine/business';
const KEY='pencil-forge.company.v1';
function read(){try{const raw=typeof localStorage!=='undefined'?localStorage.getItem(KEY):null;return raw?validateCompany(JSON.parse(raw)):createCompany();}catch{return createCompany();}}
interface BusinessStore {company:Company;past:Company[];error:string;commit:(next:Company,checkpoint?:boolean)=>boolean;undo:()=>void;clearError:()=>void;}
function save(c:Company){try{if(typeof localStorage!=='undefined')localStorage.setItem(KEY,JSON.stringify(c));return '';}catch{return '브라우저 저장 공간이 부족합니다. 경영 JSON 백업을 내려받으세요.';}}
export const useBusinessStore=create<BusinessStore>((set,get)=>({company:read(),past:[],error:'',clearError:()=>set({error:''}),
 commit:(raw,checkpoint=false)=>{try{const company=validateCompany(raw),s=get();const error=save(company);set({company,error,past:checkpoint?[...s.past.slice(-11),structuredClone(s.company)]:s.past});return true;}catch(e){set({error:e instanceof Error&&'issues' in e?'입력 범위와 경영 파일 형식을 확인하세요.':e instanceof Error?e.message:'값을 확인하세요.'});return false;}},
 undo:()=>{const s=get();if(!s.past.length)return;const company=structuredClone(s.past.at(-1)!);set({company,past:s.past.slice(0,-1),error:save(company)});},
}));
