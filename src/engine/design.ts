import { z } from 'zod';
import {resolvedParts} from './assembly';
import {MATERIALS,isMaterialAllowed,materialPatch,normalizeAppearance} from './materials';
import { geometryMassProperties,boreWallThickness,sectionInradiusFactor,profileRadiusAt } from './geometry';
import type { Project, Part, PartId, Material, Estimate, Validation, CostAssumptions } from '../types';
export type { CostAssumptions } from '../types';

/** Representative values, not certified supplier-grade properties. Density: g/cm³; price: KRW/kg. */
export {MATERIALS} from './materials';

export const TEMPLATES = [
  {id:'premium',name:'프리미엄 메탈',description:'알루미늄 육각 바디 · 정밀 그립'},
  {id:'drafting',name:'프로 제도용',description:'0.3 mm 심 · 긴 가이드 슬리브'},
  {id:'student',name:'데일리 스튜던트',description:'가벼운 ABS 바디 · 실리콘 그립'},
  {id:'lightweight',name:'울트라라이트',description:'슬림 알루미늄 · 가벼운 구성'},
  {id:'wood',name:'월넛 에디션',description:'천연 목재 바디 · 황동 디테일'},
  {id:'sculpted-wood',name:'곡선 우드',description:'볼록한 원목 몸통 · 일체형 그립'},
  {id:'sterling',name:'스털링 실버',description:'실버 925 · 둥근 캡 · 곡선 클립'},
  {id:'jewelry',name:'주얼리 콘셉트',description:'18K 골드 · 별도 다이아몬드 장식'},
  {id:'custom',name:'빈 설계에서 시작',description:'기본 노크 어셈블리 · 자유로운 치수'},
];
const uid = () => typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `pf-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const common = {finish:'brushed',process:'cnc',shape:'circle',pattern:'smooth',patternDepth:.15,patternPitch:1.6,angle:0,clipGap:1.5,clipCurve:1.5,visible:true} as const;
function part(id:PartId,name:string,englishName:string,group:Part['group'],length:number,diameter:number,bore:number,y:number,material='steel',color='#bfc5c4',extra:Partial<Part>={}):Part { return {...common,id,name,englishName,group,length,diameter,bore,y,material,color,...extra}; }
export function createProject(template='premium'):Project {
  const project:Project = {schemaVersion:1,geometryRevision:2,id:uid(),name:'FORM 01',brand:'FORGE OBJECTS',model:'PF-001',designer:'Designer',description:'매일의 생각을 정교하게 담는 도구.',leadDiameter:.5,clearance:.08,length:144,quantity:1000,targetPrice:18000,margin:.45,updatedAt:new Date().toISOString(),parts:[
    part('sleeve','리드 슬리브','Lead sleeve','tip',4,1.2,.58,2,'steel','#d3dad7'),
    part('nose','노즈 콘','Nose cone','tip',16,8,.9,12,'steel','#b9c2bf',{endDiameter:1.8}),
    part('grip','그립','Precision grip','body',32,9,5.6,36,'al6061','#bdc5bf',{pattern:'rings',patternDepth:.16,patternPitch:1.6}),
    part('barrel','몸통','Upper barrel','body',86,9,5.6,95,'al6061','#93a88f',{shape:'hexagon',finish:'anodized'}),
    part('button','노크 버튼','Push button','top',6,7,5.8,141,'al6061','#c3cbc5',{edgeRadius:.35,capThickness:.8}),
    part('clip','포켓 클립','Pocket clip','accessory',36,3.2,.65,121,'steel','#c3cac6',{clipGap:1,clipCurve:1.8}),
    part('reservoir','심 저장 튜브','Lead reservoir','internal',87,4.4,3.7,94.5,'pom','#c7cfca',{process:'injection'}),
    part('clutch','클러치','Clutch','internal',8,3.3,.58,27,'brass','#cbb27b'),
    part('spring','리턴 스프링','Return spring','internal',14,4.6,3.8,39,'steel','#aeb8b1',{process:'purchased',patternPitch:1.6}),
    part('holder','지우개 홀더','Eraser holder','top',8,5.2,4.5,134,'al6061','#b8c2bb'),
    part('eraser','내장 지우개','Eraser','top',6,4.3,0,138,'eraser','#d8d5bf',{process:'purchased'}),
    part('lead','샤프심','Graphite lead','internal',46,.5,0,23,'graphite','#303734',{process:'purchased'}),
  ]};
  project.parts=project.parts.map(normalizeAppearance);
  if(template==='drafting') {project.name='DRAFT 03';project.parts.find(p=>p.id==='barrel')!.color='#35413b';return {...updateLead(project,.3),parts:updateLead(project,.3).parts.map(normalizeAppearance)};}
  if(template==='student') {project.name='DAILY 01';Object.assign(project.parts.find(p=>p.id==='barrel')!,{material:'abs',color:'#c6cdbf',process:'injection',shape:'circle'});Object.assign(project.parts.find(p=>p.id==='grip')!,{material:'silicone',color:'#9cab92',process:'injection'});}
  if(template==='lightweight') {project.name='AIR 01';project.parts.filter(p=>['barrel','grip','nose'].includes(p.id)).forEach(p=>{p.material='al6061';p.diameter=8;});project.parts.find(p=>p.id==='grip')!.pattern='smooth';}
  if(template==='wood') {project.name='WALNUT 01';Object.assign(project.parts.find(p=>p.id==='barrel')!,{material:'walnut',color:'#76513b',shape:'circle',finish:'matte'});Object.assign(project.parts.find(p=>p.id==='grip')!,{material:'brass',color:'#c7aa6b'});}
  if(template==='custom') {project.name='UNTITLED';project.brand='YOUR BRAND';project.parts.filter(p=>p.group==='body').forEach(p=>{p.shape='circle';p.pattern='smooth';p.color='#a2aaa5';});}
  if(template==='sculpted-wood'){project.name='CURVE WOOD';project.parts=project.parts.map(p=>p.id==='barrel'?{...p,material:'walnut',finish:'oil',shape:'circle',color:'#76513b',diameter:9.5,endDiameter:8,bulge:.9,bulgePosition:.56}:p.id==='grip'?{...p,enabled:false}:p.id==='clip'?{...p,clipCurve:1.2,clipBendPosition:.65}:p);}
  if(template==='sterling'||template==='jewelry'){
   const metal=template==='sterling'?'silver925':'gold18';project.name=template==='sterling'?'SILVER 925':'ATELIER GOLD';project.parts=project.parts.map(p=>['barrel','button','clip'].includes(p.id)?{...p,material:metal,finish:'polished',color:MATERIALS.find(m=>m.id===metal)!.color,shape:p.id==='clip'?p.shape:'circle',bulge:p.id==='barrel'?.4:0,edgeRadius:p.id==='button'?.5:0}:p.id==='grip'?{...p,enabled:false}:p);
   if(template==='jewelry'){project.accent={material:'diamond',diameter:2.6,height:1};project.quantity=1;project.targetPrice=10000000;project.description='귀금속·보석 외관 콘셉트. 제조 원가는 사용자가 편집하는 가정값입니다.';}
  }
  return {...project,parts:project.parts.map(normalizeAppearance)};
}
export const EXTERIOR_AXIAL_PARTS: readonly PartId[] = ['sleeve','nose','grip','barrel','button'];
export function axialExtent(project:Project) {
  const parts=project.parts.filter(p=>EXTERIOR_AXIAL_PARTS.includes(p.id));
  const min=Math.min(...parts.map(p=>p.y-p.length/2));const max=Math.max(...parts.map(p=>p.y+p.length/2));
  return {min,max,length:max-min};
}
/** Rebuild the linked external chain and move dependent internals with their assembly anchors. */
export function resizeExteriorPart(project:Project,id:PartId,length:number):Project {
  if(!EXTERIOR_AXIAL_PARTS.includes(id))throw new Error('연동 길이 편집을 지원하지 않는 부품입니다.');
  if(!Number.isFinite(length)||length<.1||length>200)throw new Error('부품 길이는 0.1–200 mm 범위로 입력하세요.');
  const old=new Map(project.parts.map(p=>[p.id,p]));const resized=new Map<PartId,Part>();let end=0;
  for(const partId of EXTERIOR_AXIAL_PARTS){const part=old.get(partId)!;const nextLength=partId===id?length:part.length;resized.set(partId,{...part,length:nextLength,y:end+nextLength/2});end+=nextLength;}
  if(end<100||end>200)throw new Error('전체 길이가 100–200 mm 범위를 벗어납니다. 다른 부품의 길이를 함께 조정하세요.');
  const oldGripStart=old.get('grip')!.y-old.get('grip')!.length/2;
  const gripStart=resized.get('grip')!.y-resized.get('grip')!.length/2;
  const oldBarrelStart=old.get('barrel')!.y-old.get('barrel')!.length/2;
  const barrelStart=resized.get('barrel')!.y-resized.get('barrel')!.length/2;
  const oldBarrelEnd=old.get('barrel')!.y+old.get('barrel')!.length/2;
  const barrelEnd=resized.get('barrel')!.y+resized.get('barrel')!.length/2;
  const deltaBodyLength=resized.get('barrel')!.length-old.get('barrel')!.length;
  return {...project,length:end,updatedAt:new Date().toISOString(),parts:project.parts.map(part=>{
    const exterior=resized.get(part.id);if(exterior)return exterior;
    if(['holder','eraser','clip'].includes(part.id))return {...part,y:part.y+barrelEnd-oldBarrelEnd};
    if(['clutch','spring'].includes(part.id))return {...part,y:part.y+gripStart-oldGripStart};
    if(part.id==='reservoir')return {...part,length:part.length+deltaBodyLength,y:part.y+barrelStart-oldBarrelStart+deltaBodyLength/2};
    return part;
  })};
}
export function updateProjectDimension(project:Project,length:number):Project {
  if(!Number.isFinite(length)||length<100||length>200)throw new Error('전체 길이는 100–200 mm 범위로 입력하세요.');
  const otherLength=project.parts.filter(p=>EXTERIOR_AXIAL_PARTS.includes(p.id)&&p.id!=='barrel').reduce((sum,p)=>sum+p.length,0);
  return resizeExteriorPart(project,'barrel',length-otherLength);
}
export function updateLead(project:Project,diameter:number):Project {
  if(![.2,.3,.4,.5,.7,.9,1.3,2].includes(diameter)) throw new Error('지원되는 심 규격을 선택하세요.');
  return {...project,leadDiameter:diameter,updatedAt:new Date().toISOString(),parts:project.parts.map(p=>p.id==='lead'?{...p,diameter}:['sleeve','clutch'].includes(p.id)?{...p,bore:diameter+project.clearance,diameter:Math.max(p.diameter,diameter+project.clearance+.6)}:p.id==='nose'?{...p,bore:Math.max(p.bore,diameter+project.clearance+.2),endDiameter:Math.max(p.endDiameter??1.8,diameter+project.clearance+.8)}:p)};
}
/** Cross sections are inscribed in the diameter. Ellipse aspect is 0.78, matching the mesh/CAD contract. */
export function sectionArea(d:number,shape:Part['shape']):number {
  if(shape==='ellipse') return Math.PI*d*d*.78/4;
  const n=shape==='hexagon'?6:shape==='octagon'?8:shape==='triangle'?3:shape==='square'?4:0;
  return n ? n*d*d*Math.sin(2*Math.PI/n)/8 : Math.PI*d*d/4;
}
const volumeCache=new Map<string,{volume:number;centerY:number}>();
/** Signed-tetrahedron integral of the actual closed export mesh, in mm³. */
function partProperties(p:Part):{volume:number;centerY:number} {
  const key=JSON.stringify([p.id,p.length,p.diameter,p.bore,p.endDiameter,p.shape,p.pattern,p.patternDepth,p.patternPitch,p.angle,p.clipGap,p.clipCurve,p.profile,p.clipStyle,p.bulge,p.bulgePosition,p.edgeRadius,p.capThickness,p.seatDiameter,p.seatDepth,p.clipBendPosition,p.clipToe]);
  const cached=volumeCache.get(key);if(cached!==undefined)return cached;
  const value=geometryMassProperties(p);
  if(volumeCache.size>256)volumeCache.delete(volumeCache.keys().next().value!);
  volumeCache.set(key,value);return value;
}
export function partVolume(p:Part):number {return partProperties(p).volume;}

export const DEFAULT_COST_ASSUMPTIONS:CostAssumptions={cncRatePerHour:42000,setupPerPart:18000,assemblyPerUnit:650,packagingPerUnit:350,rejectionRate:.03,overheadRate:.12,materialPrices:{},gemSettingPerUnit:15000};
export function estimate(project:Project,overrides:Partial<CostAssumptions>={}):Estimate {
  const a={...DEFAULT_COST_ASSUMPTIONS,...project.costAssumptions,...overrides,materialPrices:{...DEFAULT_COST_ASSUMPTIONS.materialPrices,...project.costAssumptions?.materialPrices,...overrides.materialPrices}}; const qty=Math.max(1,project.quantity);
  const parts=resolvedParts(project).map(p=>{
    const m=MATERIALS.find(m=>m.id===p.material)??MATERIALS[0]; const volume=partVolume(p);const mass=volume*m.density/1000;
    const stock=Math.PI*Math.pow(Math.max(p.diameter,p.endDiameter??0)/2+(p.bulge??0),2)*p.length;
    const buyFactor=p.process==='cnc'?Math.max(1,stock/Math.max(1,volume))*1.12:p.process==='printing'?1.15:1.06;
    const materialCost=mass/1000*(a.materialPrices[m.id]??m.pricePerKg)*buyFactor;
    const processCost=p.process==='cnc'?(12+p.length*.22+Math.max(0,stock-volume)/24+(p.pattern==='rings'?p.length/p.patternPitch*.45:0))*a.cncRatePerHour/3600*(m.id==='titanium'?2.2:m.category==='wood'?1.2:1):p.id==='finial'?(a.gemSettingPerUnit??15000):p.process==='injection'?70+volume*.018:p.process==='printing'?180+volume*.18:120;
    const finishCost=p.finish==='anodized'?160:p.finish==='polished'?110:p.finish==='bead'?100:p.finish==='brushed'?70:25;
    const setupCost=(p.process==='injection'?2500000:p.process==='cnc'?a.setupPerPart:p.process==='printing'?1500:0)/qty;
    return {id:p.id,volume,mass,materialCost,processCost,finishCost,setupCost,cost:materialCost+processCost+finishCost+setupCost,center:p.y+partProperties(p).centerY};
  });
  const sum=(key:'mass'|'materialCost'|'processCost'|'finishCost'|'setupCost')=>parts.reduce((s,p)=>s+p[key],0);
  const mass=sum('mass');const materialCost=sum('materialCost'),processCost=sum('processCost'),finishCost=sum('finishCost'),setupCost=sum('setupCost');
  const assemblyCost=a.assemblyPerUnit+a.packagingPerUnit;const subtotal=materialCost+processCost+finishCost+setupCost+assemblyCost;const overhead=subtotal*(1/(1-a.rejectionRate)-1)+subtotal*a.overheadRate;const unitCost=subtotal+overhead;
  return {parts,mass,centerOfMass:mass?parts.reduce((s,p)=>s+p.mass*p.center,0)/mass:0,materialCost,processCost,finishCost,setupCost,assemblyCost,overhead,unitCost,totalCost:unitCost*qty,sellingPrice:unitCost/(1-Math.min(.95,Math.max(0,project.margin)))};
}
export function validate(project:Project):Validation[] {
  const result:Validation[]=[];const physicalParts=resolvedParts(project);const get=(id:PartId)=>physicalParts.find(p=>p.id===id)!;
  for(const p of physicalParts){
    const m=MATERIALS.find(m=>m.id===p.material);
    if(!isMaterialAllowed(p.id,p.material))result.push({id:'material-'+p.id,severity:'error',partId:p.id,title:'부품에 맞지 않는 소재',description:'이 부품에 사용할 수 있는 소재를 선택하세요.'});
    const wall=boreWallThickness(p);
    if(p.id!=='clip'&&p.bore>0&&wall<=0) result.push({id:`bore-${p.id}`,severity:'error',partId:p.id,title:'내부 구멍이 외형을 벗어납니다',description:`${p.name}: 최소 외형 반경 ${(wall+p.bore/2).toFixed(2)} mm보다 구멍 반경이 큽니다. 외경을 늘리거나 내경을 줄이세요.`});
    else if(p.id!=='clip'&&p.bore>0&&wall<(m?.category==='plastic'?.8:.35)) result.push({id:`wall-${p.id}`,severity:'warning',partId:p.id,title:'얇은 벽 두께',description:`${p.name}: 최소 벽 두께 ${wall.toFixed(2)} mm. 공정과 공급사 기준을 확인하거나 외경을 늘리세요.`});
    if(p.finish==='anodized'&&!p.material.startsWith('al')) result.push({id:`finish-${p.id}`,severity:'warning',partId:p.id,title:'표면처리 호환성 확인',description:'현재 아노다이징 조건은 알루미늄용입니다. 소재에 맞는 표면처리로 변경하세요.'});
    if(p.process==='injection'&&m?.category==='metal') result.push({id:`process-${p.id}`,severity:'error',partId:p.id,title:'소재와 공정 불일치',description:'현재 사출 모델은 열가소성 수지용입니다. 금속은 CNC 또는 적합한 공정으로 변경하세요.'});
    if(p.pattern==='rings'&&p.patternDepth>wall&&p.bore>0) result.push({id:`groove-${p.id}`,severity:'error',partId:p.id,title:'그립 홈이 내부를 관통합니다',description:'홈 깊이를 줄이거나 벽 두께를 늘리세요.'});
  }
  for(const id of ['sleeve','clutch'] as PartId[]){const p=get(id);if(p.bore<project.leadDiameter+project.clearance-.0001) result.push({id:`lead-${id}`,severity:'error',partId:id,title:'샤프심 통로 간극 부족',description:`내경 ${p.bore.toFixed(2)} mm, 필요한 최소값 ${(project.leadDiameter+project.clearance).toFixed(2)} mm. 심 규격 또는 간극을 조정하세요.`});}
  const barrel=get('barrel'),reservoir=get('reservoir'),eraser=get('eraser'),holder=get('holder');
  if(barrel.bore<reservoir.diameter+.1) result.push({id:'reservoir-fit',severity:'error',partId:'barrel',title:'심 저장 튜브와 몸통 간섭',description:`몸통 내경을 최소 ${(reservoir.diameter+.1).toFixed(2)} mm로 늘리세요. 조립 반경 간극 0.05 mm 가정.`});
  if(eraser.diameter>holder.bore) result.push({id:'eraser-fit',severity:'error',partId:'eraser',title:'지우개와 홀더 간섭',description:'지우개 외경을 홀더 내경보다 작게 설정하세요.'});
  if(get('button').diameter<holder.diameter) result.push({id:'cap-fit',severity:'error',partId:'button',title:'버튼과 홀더 조립 공간 부족',description:'버튼 외경 또는 홀더 치수를 조정하세요.'});
  if(project.leadDiameter>=1.3) result.push({id:'large-lead',severity:'warning',partId:'clutch',title:'전용 클러치 검토 필요',description:'통로 치수는 변경했지만 대구경 심의 공급·파지 기구는 실물 검증이 필요합니다.'});
  const chain=EXTERIOR_AXIAL_PARTS.filter(id=>physicalParts.some(p=>p.id===id));
  for(let i=0;i<chain.length-1;i++){
    const lower=get(chain[i]),upper=get(chain[i+1]);
    const gap=(upper.y-upper.length/2)-(lower.y+lower.length/2);
    if(Math.abs(gap)>.15)result.push({id:`joint-${lower.id}-${upper.id}`,severity:'warning',partId:upper.id,title:gap>0?'축 방향 연결면에 틈이 있습니다':'축 방향 부품이 겹칩니다',description:`${lower.name} ↔ ${upper.name}: ${Math.abs(gap).toFixed(2)} mm ${gap>0?'간격':'중첩'}. 길이를 편집하면 연결 위치가 다시 정렬됩니다.`});
  }
  const extent=axialExtent(project);
  if(Math.abs(extent.length-project.length)>.01)result.push({id:'length-envelope',severity:'error',title:'전체 길이와 외형 치수 불일치',description:`외형 길이 ${extent.length.toFixed(2)} mm, 프로젝트 설정 ${project.length.toFixed(2)} mm. 전체 길이를 다시 입력해 축 방향 부품을 정렬하세요.`});
  for(const part of project.parts.filter(p=>!EXTERIOR_AXIAL_PARTS.includes(p.id))){
    if(part.y-part.length/2<extent.min-.15||part.y+part.length/2>extent.max+.15)result.push({id:`envelope-${part.id}`,severity:'warning',partId:part.id,title:'부품이 주요 외형의 길이를 벗어납니다',description:'축 위치 또는 부품 길이를 조정하세요. 표시된 전체 길이는 슬리브부터 버튼까지의 외형 길이입니다.'});
  }
  if(project.accent&&(project.accent.height+.5>get('button').length||project.accent.diameter+.26>profileRadiusAt(get('button'),1)*2*sectionInradiusFactor(get('button'))))result.push({id:'gem-fit',severity:'error',partId:'button',title:'보석 장착 공간 부족',description:'버튼 길이·지름을 늘리거나 보석 크기를 줄이세요.'});
  if(project.accent)result.push({id:'gem-setting',severity:'info',partId:'button',title:'보석 세팅 검토',description:'보석과 베젤 시트의 개념 형상입니다. 보석 등급·고정 구조·세공 견적은 별도 검토가 필요합니다.'});
  if(project.actuation==='twist')result.push({id:'twist-review',severity:'info',partId:'button',title:'회전식 상단 개념 설계',description:'회전 크라운 외형과 운동 미리보기입니다. 내부 캠·전달기구 및 심 공급은 제조 검증 전입니다.'});
  result.push({id:'design-review',severity:'info',title:'개념 설계 · 제조 검토 필요',description:'현재 검사는 치수 규칙 기반입니다. 체결부, 공차 누적, 클러치 파지력, 스프링 강도는 실물 검증되지 않았습니다.'});
  return result;
}
const finite=(min:number,max:number)=>z.number().finite().min(min).max(max);
const PartSchema=z.object({id:z.enum(['barrel','grip','nose','sleeve','button','clip','reservoir','clutch','spring','eraser','holder','lead']),name:z.string().min(1).max(80),englishName:z.string().max(80),group:z.enum(['body','tip','internal','top','accessory']),material:z.string().refine(s=>MATERIALS.some(m=>m.id===s),'알 수 없는 소재'),color:z.string().regex(/^#[0-9a-fA-F]{6}$/),finish:z.enum(['matte','polished','brushed','anodized','bead','pvd','painted','oil','clear']),process:z.enum(['cnc','injection','printing','purchased']),length:finite(.1,200),diameter:finite(.1,30),bore:finite(0,29),endDiameter:finite(.1,30).optional(),y:finite(-20,220),shape:z.enum(['circle','hexagon','octagon','triangle','ellipse','square']),pattern:z.enum(['smooth','rings','knurl','grooves']),patternDepth:finite(0,3),patternPitch:finite(.1,20),angle:finite(-360,360),clipGap:finite(0,10),clipCurve:finite(0,10),visible:z.boolean(),enabled:z.boolean().optional(),profile:z.enum(['conical','stepped','curved','cylinder']).optional(),clipStyle:z.enum(['arched','straight','wave','wide']).optional(),bulge:finite(0,4).optional(),bulgePosition:finite(.1,.9).optional(),edgeRadius:finite(0,3).optional(),capThickness:finite(.2,8).optional(),clipBendPosition:finite(.15,.8).optional(),clipToe:finite(0,3).optional()});
const CostAssumptionsSchema=z.object({gemSettingPerUnit:finite(0,10000000),cncRatePerHour:finite(0,1000000000000),setupPerPart:finite(0,1000000000000),assemblyPerUnit:finite(0,1000000000000),packagingPerUnit:finite(0,1000000000000),rejectionRate:finite(0,.95),overheadRate:finite(0,1),materialPrices:z.record(z.string(),finite(0,1000000000000))}).partial();
const ProjectSchema=z.object({schemaVersion:z.literal(1),geometryRevision:z.literal(2).optional(),accent:z.object({material:z.string().refine(id=>MATERIALS.some(m=>m.id===id&&m.category==='gem')),diameter:finite(1,4),height:finite(.4,2)}).optional(),actuation:z.enum(['knock','twist']).optional(),id:z.string().min(1).max(120),name:z.string().min(1).max(100),brand:z.string().max(100),model:z.string().max(100),designer:z.string().max(100),description:z.string().max(3000),leadDiameter:z.number().refine(v=>[.2,.3,.4,.5,.7,.9,1.3,2].includes(v)),clearance:finite(.01,.5),length:finite(100,200),quantity:z.number().int().min(1).max(1000000),targetPrice:finite(0,100000000),margin:finite(0,.95),parts:z.array(PartSchema).length(12).refine(ps=>new Set(ps.map(p=>p.id)).size===12,'중복 또는 누락 부품'),costAssumptions:CostAssumptionsSchema.optional(),updatedAt:z.string()});
export function validateProjectImport(input:unknown):Project { let p=ProjectSchema.parse(input) as Project;
 p={...p,parts:p.parts.map(normalizeAppearance)};
 if(p.geometryRevision!==2){
  const button=p.parts.find(v=>v.id==='button')!;
  if(Math.abs(button.length-2)<.001){const originalLength=p.length;p=updateProjectDimension(resizeExteriorPart(p,'button',6),originalLength);}
  p={...p,geometryRevision:2};
 }
 return p; }
export function exportCSV(project:Project):string {const est=estimate(project);const quote=(s:string|number)=>`"${String(s).replaceAll('"','""')}"`;return '\uFEFF'+[['부품 ID','부품명','소재','길이 mm','외경 mm','내경 mm','체적 mm³','질량 g','추정 원가 KRW'],...resolvedParts(project).map(p=>{const m=est.parts.find(r=>r.id===p.id)!;return [p.id,p.name,MATERIALS.find(m=>m.id===p.material)?.name??p.material,p.length,p.diameter,p.bore,m.volume.toFixed(3),m.mass.toFixed(3),m.cost.toFixed(0)];})].map(r=>r.map(quote).join(',')).join('\r\n');}
