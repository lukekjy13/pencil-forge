import type {Material,Part,PartId,Finish} from '../types';
export const MATERIALS: Material[] = [
  { id:'al6061', name:'알루미늄 6061-T6', category:'metal', density:2.70, pricePerKg:8200, modulus:69, color:'#b8bbb9', metalness:.82, note:'대표값 · 밀도 2.70 g/cm³ · 탄성계수 69 GPa. 단가는 편집 가능한 가정값.' },
  { id:'al7075', name:'알루미늄 7075-T6', category:'metal', density:2.81, pricePerKg:14500, modulus:72, color:'#a9afb2', metalness:.86, note:'대표값 · 고강도 절삭용 합금. 아노다이징 색상은 실제 시편 확인 필요.' },
  { id:'brass', name:'황동 C360', category:'metal', density:8.50, pricePerKg:14500, modulus:97, color:'#c7aa6b', metalness:.9, note:'대표값 · 절삭성이 좋은 황동. 납 함량·규제는 실제 구매 등급 확인 필요.' },
  { id:'copper', name:'구리 C110', category:'metal', density:8.96, pricePerKg:18000, modulus:117, color:'#b97454', metalness:.92, note:'대표값 · 산화 및 표면 변색을 고려할 것.' },
  { id:'steel', name:'스테인리스 304', category:'metal', density:7.93, pricePerKg:7200, modulus:193, color:'#bdc4c7', metalness:.94, note:'대표값 · 내식성이 좋은 범용 스테인리스. 스프링에는 별도 등급 검토 필요.' },
  { id:'titanium', name:'티타늄 Grade 5', category:'metal', density:4.43, pricePerKg:145000, modulus:114, color:'#858d98', metalness:.86, note:'대표값 · Ti-6Al-4V. 난삭성과 공구 수명에 따라 가공비 차이가 큼.' },
  { id:'abs', name:'ABS', category:'plastic', density:1.04, pricePerKg:3400, modulus:2.1, color:'#ece8df', metalness:0, note:'대표값 · 사출 등급에 따라 수축률·강도가 달라짐. 참고 수축률 0.4–0.7%.' },
  { id:'pc', name:'폴리카보네이트 PC', category:'plastic', density:1.20, pricePerKg:6200, modulus:2.3, color:'#d7e2df', metalness:0, note:'대표값 · 내충격성. 성형 전 건조와 응력 균열 검토 필요.' },
  { id:'pom', name:'POM 아세탈', category:'plastic', density:1.41, pricePerKg:4800, modulus:2.8, color:'#e4e2d9', metalness:0, note:'대표값 · 저마찰 정밀 부품. 참고 수축률 1.8–2.2%, 실제 등급 확인 필요.' },
  { id:'pp', name:'폴리프로필렌 PP', category:'plastic', density:.90, pricePerKg:2300, modulus:1.5, color:'#b8c6bc', metalness:0, note:'대표값 · 경량 범용 사출 소재. 강성 및 크리프 검토 필요.' },
  { id:'petg', name:'PETG', category:'plastic', density:1.27, pricePerKg:21000, modulus:2.1, color:'#b8d4d0', metalness:0, note:'대표값 · 3D 프린팅 필라멘트 단가 가정. 적층 방향별 강도 차이 있음.' },
  { id:'pa6', name:'나일론 PA6', category:'plastic', density:1.13, pricePerKg:5500, modulus:2.7, color:'#d9d6ca', metalness:0, note:'대표값 · 흡습에 따라 치수·강성 변화. 건조 상태 기준 참고값.' },
  { id:'peek', name:'PEEK', category:'plastic', density:1.30, pricePerKg:165000, modulus:3.6, color:'#b4a58a', metalness:0, note:'대표값 · 고성능 열가소성 소재. 고온 가공 설비 필요.' },
  { id:'walnut', name:'월넛', category:'wood', density:.65, pricePerKg:38000, modulus:11, color:'#76513b', metalness:0, note:'대표값 · 수종, 함수율, 결 방향에 따라 밀도·강성 변화. 목재 밀도 편차 큼.' },
  { id:'maple', name:'메이플', category:'wood', density:.71, pricePerKg:26000, modulus:12.6, color:'#c9ab77', metalness:0, note:'대표값 · 천연 소재. 결 방향과 습도 변화 고려 필요.' },
  { id:'bamboo', name:'대나무', category:'wood', density:.70, pricePerKg:19000, modulus:15, color:'#c4af7b', metalness:0, note:'대표값 · 적층 및 천연 소재에 따라 특성이 다름.' },
  { id:'silicone', name:'실리콘 고무', category:'other', density:1.12, pricePerKg:18000, modulus:.005, color:'#7d8b80', metalness:0, note:'대표값 · 경도 50 Shore A 가정. 압축·인장 특성은 공급사 데이터 필요.' },
  { id:'tpu', name:'TPU', category:'other', density:1.21, pricePerKg:28000, modulus:.025, color:'#373e3b', metalness:0, note:'대표값 · 경도와 배합에 따라 물성 차이가 큼.' },
  { id:'graphite', name:'흑연 복합 심', category:'other', density:1.8, pricePerKg:12000, modulus:10, color:'#303734', metalness:.15, note:'대표값 · 흑연·점토·바인더 배합에 따른 추정 밀도. 심 경도 인증값 아님.' },
  { id:'eraser', name:'PVC-free 지우개', category:'other', density:1.3, pricePerKg:8000, modulus:.01, color:'#d8d5bf', metalness:0, note:'대표값 · 합성 고무 기반 밀도 가정. 실제 배합 확인 필요.' },
  {id:'silver925',name:'스털링 실버 925',category:'metal',density:10.36,pricePerKg:1800000,modulus:83,color:'#d3d6d8',metalness:.98,note:'대표 물성 · 은 92.5% 합금. 가격은 편집 가능한 가정값이며 시세·견적이 아닙니다.'},
  {id:'gold18',name:'18K 골드 합금',category:'metal',density:15.6,pricePerKg:110000000,modulus:80,color:'#d2ad62',metalness:.98,note:'대표 물성 · 합금 조성별 차이. 가격은 가정값이며 시세·견적이 아닙니다.'},
  {id:'gold24',name:'24K 순금',category:'metal',density:19.32,pricePerKg:150000000,modulus:79,color:'#d5ae39',metalness:.99,note:'대표 물성 · 연한 순금은 얇은 클립·스프링 구조에 부적합합니다. 가격은 시세가 아닌 가정값.'},
  {id:'platinum',name:'플래티넘 Pt950',category:'metal',density:21.0,pricePerKg:65000000,modulus:168,color:'#bfc2c6',metalness:.98,note:'대표 물성 · 합금·가공성 검토 필요. 가격은 편집용 가정값이며 시세가 아닙니다.'},
  {id:'bronze',name:'인청동',category:'metal',density:8.8,pricePerKg:19000,modulus:110,color:'#b48b55',metalness:.92,note:'대표 물성 · 스프링 및 클립은 실제 템퍼 등급 검토 필요.'},
  {id:'magnesium',name:'마그네슘 AZ31',category:'metal',density:1.77,pricePerKg:22000,modulus:45,color:'#babdb9',metalness:.88,note:'대표 물성 · 부식 방지와 절삭 안전 공정 검토 필요.'},
  {id:'pmma',name:'아크릴 PMMA',category:'plastic',density:1.18,pricePerKg:7000,modulus:3.2,color:'#d4d8d7',metalness:0,note:'대표 물성 · 취성과 응력 균열 고려. 투명 등급은 실제 시편 확인.'},
  {id:'pa66',name:'나일론 PA66',category:'plastic',density:1.14,pricePerKg:6500,modulus:3.1,color:'#e0dacb',metalness:0,note:'대표 물성 · 흡습에 따른 치수 변화 검토.'},
  {id:'pbt',name:'PBT',category:'plastic',density:1.31,pricePerKg:6200,modulus:2.5,color:'#d9dcd4',metalness:0,note:'대표 물성 · 성형 수축과 등급별 물성 확인.'},
  {id:'pei',name:'PEI',category:'plastic',density:1.27,pricePerKg:95000,modulus:3.2,color:'#a3834e',metalness:0,note:'대표 물성 · 고온 성형이 필요한 고성능 수지.'},
  {id:'recycled-abs',name:'재활용 ABS',category:'plastic',density:1.05,pricePerKg:3000,modulus:2.0,color:'#646b64',metalness:0,note:'대표 물성 · 재생 원료의 배치별 편차 및 품질 검증 필요.'},
  {id:'oak',name:'오크',category:'wood',density:.75,pricePerKg:30000,modulus:12,color:'#b99964',metalness:0,note:'대표값 · 넓은 기공과 결 방향 고려. 수종 실측값이 아닙니다.'},
  {id:'cherry',name:'체리',category:'wood',density:.56,pricePerKg:40000,modulus:10.3,color:'#b2744d',metalness:0,note:'대표값 · 따뜻한 적갈색, 시간에 따른 산화·변색 고려.'},
  {id:'ebony',name:'흑단',category:'wood',density:1.05,pricePerKg:160000,modulus:16,color:'#302a24',metalness:0,note:'대표값 · 짙은 갈색~검정. 합법적 공급망과 실제 종 확인 필요.'},
  {id:'rosewood',name:'로즈우드',category:'wood',density:.85,pricePerKg:120000,modulus:15,color:'#704530',metalness:0,note:'대표값 · 종·함수율·공급망에 따라 큰 차이.'},
  {id:'carbon-fiber',name:'탄소섬유 복합재',category:'other',density:1.55,pricePerKg:130000,modulus:70,color:'#303330',metalness:.05,note:'적층·수지계 가정 대표값. 방향별 물성이 달라 실제 라미네이트 검증 필요.'},
  {id:'zirconia',name:'지르코니아 세라믹',category:'other',density:6.0,pricePerKg:180000,modulus:210,color:'#ece9df',metalness:0,note:'대표값 · 취성·소결수축·연마 공정 검토 필요.'},
  {id:'tpe',name:'TPE 엘라스토머',category:'other',density:1.0,pricePerKg:19000,modulus:.01,color:'#666e66',metalness:0,note:'대표값 · 경도·배합·공급 등급에 따라 변화.'},
  {id:'diamond',name:'다이아몬드 · 장식용',category:'gem',density:3.51,pricePerKg:25000000000,modulus:1050,color:'#f4f6fa',metalness:0,note:'장식용만 지원. 500만원/ct 환산의 편집용 가정이며 감정·거래가·견적이 아닙니다.'},
  {id:'lab-diamond',name:'랩그로운 다이아몬드 · 장식용',category:'gem',density:3.51,pricePerKg:2500000000,modulus:1050,color:'#e8f2fa',metalness:0,note:'장식용만 지원. 50만원/ct 환산 가정. 실제 컷·등급별 견적 필요.'},
  {id:'sapphire',name:'사파이어 · 장식용',category:'gem',density:3.98,pricePerKg:5000000000,modulus:400,color:'#3354a8',metalness:0,note:'장식용만 지원. 가격은 등급 미지정 가정값.'},
  {id:'ruby',name:'루비 · 장식용',category:'gem',density:3.98,pricePerKg:5000000000,modulus:400,color:'#ae243c',metalness:0,note:'장식용만 지원. 합성·천연·처리 여부별 견적 필요.'},
  {id:'cubic-zirconia',name:'큐빅 지르코니아 · 장식용',category:'gem',density:5.7,pricePerKg:180000,modulus:210,color:'#f4f3f0',metalness:0,note:'장식용만 지원. 다이아몬드와 다른 소재·가격입니다.'},

];

const elastomers=new Set(['silicone','tpu','tpe']);
const hardPlastics=new Set(['abs','pc','pom','pp','petg','pa6','peek','pmma','pa66','pbt','pei','recycled-abs']);
const springMetals=new Set(['steel','bronze','titanium']);
export function isMaterialAllowed(partId:PartId,materialId:string):boolean{
 const m=MATERIALS.find(m=>m.id===materialId);if(!m)return false;
 if(partId==='finial')return m.category==='gem';
 if(partId==='lead')return materialId==='graphite';
 if(partId==='eraser')return materialId==='eraser';
 if(partId==='spring')return springMetals.has(materialId);
 if(partId==='clutch')return ['brass','bronze','steel','pom'].includes(materialId);
 if(partId==='reservoir')return hardPlastics.has(materialId)||['steel','brass','al6061','al7075'].includes(materialId);
 if(partId==='sleeve')return ['steel','titanium','brass','bronze'].includes(materialId);
 if(partId==='clip')return (m.category==='metal'&&materialId!=='gold24'&&materialId!=='magnesium')||['pa6','pa66','pom','pc','abs'].includes(materialId);
 if(partId==='holder')return m.category==='metal'||hardPlastics.has(materialId);
 if(partId==='nose')return m.category==='metal'||['pom','pc','abs','peek','zirconia'].includes(materialId);
 if(partId==='button')return m.category==='metal'||hardPlastics.has(materialId)||m.category==='wood';
 if(partId==='grip')return m.category==='metal'||m.category==='wood'||hardPlastics.has(materialId)||elastomers.has(materialId)||['carbon-fiber','zirconia'].includes(materialId);
 return m.category==='metal'||m.category==='wood'||hardPlastics.has(materialId)||['carbon-fiber','zirconia'].includes(materialId);
}
export const materialsForPart=(id:PartId)=>MATERIALS.filter(m=>isMaterialAllowed(id,m.id));
export function defaultMaterial(id:PartId){return id==='lead'?'graphite':id==='eraser'?'eraser':id==='reservoir'?'pom':id==='clutch'?'brass':id==='finial'?'diamond':['sleeve','spring','clip'].includes(id)?'steel':'al6061'}
export function finishesForMaterial(id:string):[Finish,string][]{
 const m=MATERIALS.find(m=>m.id===id)!;
 if(m.category==='gem')return [['polished','폴리싱']];
 if(m.category==='wood')return [['matte','원목'],['oil','오일'],['clear','투명 코팅']];
 if(elastomers.has(id)||['graphite','eraser'].includes(id))return [['matte','무광']];
 if(m.category==='metal')return [['brushed','브러시드'],['polished','폴리싱'],['bead','비드 블라스트'],['matte','무광'],...(id.startsWith('al')?[['anodized','아노다이징']] as [Finish,string][]:[]),['pvd','PVD 코팅'],['painted','도장']];
 return [['matte','무광'],['polished','유광']];
}
function scaleHex(hex:string,factor:number){return '#'+[1,3,5].map(i=>Math.round(Math.min(255,parseInt(hex.slice(i,i+2),16)*factor)).toString(16).padStart(2,'0')).join('')}
export function colorsForMaterial(id:string,finish:Finish):{hex:string;name:string}[]{
 const m=MATERIALS.find(m=>m.id===id)!;
 if(m.category==='wood')return [{hex:m.color,name:'원목'},{hex:scaleHex(m.color,.82),name:'짙은 오일'},{hex:scaleHex(m.color,1.1),name:'밝은 마감'}];
 if(m.category==='gem')return [{hex:m.color,name:'고유 색상'}];
 if(m.category==='plastic'||elastomers.has(id)||['painted','anodized'].includes(finish))return [{hex:'#dedbd3',name:'아이보리'},{hex:'#363936',name:'차콜'},{hex:'#879782',name:'세이지'},{hex:'#70889b',name:'블루'},{hex:'#ae6a52',name:'테라코타'},{hex:'#f3f0e7',name:'화이트'}];
 if(finish==='pvd')return [{hex:'#353637',name:'블랙 PVD'},{hex:'#b4b5b7',name:'실버 PVD'},{hex:'#c9a564',name:'골드 PVD'},{hex:'#b48776',name:'로즈 PVD'}];
 return [{hex:m.color,name:'고유 색상'},{hex:scaleHex(m.color,.88),name:'짙은 표면'},{hex:scaleHex(m.color,1.08),name:'밝은 폴리싱'}];
}
function nearestColor(hex:string,options:{hex:string;name:string}[]){const rgb=(s:string)=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16));const source=rgb(hex);return options.reduce((best,c)=>rgb(c.hex).reduce((v,n,i)=>v+(n-source[i])**2,0)<rgb(best.hex).reduce((v,n,i)=>v+(n-source[i])**2,0)?c:best).hex}
export function normalizeAppearance(p:Part):Part{
 const material=isMaterialAllowed(p.id,p.material)?p.material:defaultMaterial(p.id);
 const finishes=finishesForMaterial(material);const finish=finishes.some(([id])=>id===p.finish)?p.finish:finishes[0][0];
 const options=colorsForMaterial(material,finish);const color=nearestColor(p.color,options);
 return {...p,material,finish,color};
}
export function materialPatch(part:Part,id:string):Partial<Part>{
 if(!isMaterialAllowed(part.id,id))return {};
 const m=MATERIALS.find(m=>m.id===id)!;const finish:Finish=m.category==='wood'?'oil':m.category==='metal'?'brushed':m.category==='gem'?'polished':'matte';
 return {material:id,finish,color:colorsForMaterial(id,finish)[0].hex,process:m.category==='metal'||m.category==='wood'?'cnc':id==='petg'?'printing':m.category==='plastic'?'injection':'purchased'};
}
