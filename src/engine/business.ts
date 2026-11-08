import {z} from 'zod';
import {createProject,estimate,validate,validateProjectImport,DEFAULT_COST_ASSUMPTIONS} from './design';
import {MATERIALS} from './materials';
import {boreWallThickness,axialRadius,axialSlices} from './geometry';
import {resolvedParts} from './assembly';
import type {Project} from '../types';

export type Concept='daily'|'precision'|'natural'|'atelier';
export type SegmentId='student'|'professional'|'design'|'collector';
export interface Brand {name:string;tagline:string;story:string;concept:Concept;logo:'wordmark'|'monogram'|'symbol';color:string;}
export interface ProductLine {id:string;name:string;description:string;segment:SegmentId;}
export interface SKU {id:string;lineId:string;name:string;design:Project;price:number;batch:number;status:'draft'|'live'|'paused';stock:number;costBasis:number;toolingPaid:boolean;sold:number;}
export interface Segment {id:SegmentId;name:string;buyers:number;referencePrice:number;budgetSpread:number;elasticity:number;outsideWeight:number;}
export interface Market {segments:Segment[];adCpm:number;adEffectiveness:number;awarenessDecay:number;annualGrowth:number;volatility:number;feeRate:number;shipping:number;returnRate:number;returnHandling:number;wordOfMouth:number;}
export interface Sale {id:string;name:string;demand:number;orders:number;returns:number;netUnits:number;lost:number;revenue:number;cogs:number;fees:number;fulfilment:number;}
export interface Month {month:number;revenue:number;cogs:number;fees:number;fulfilment:number;advertising:number;fixed:number;setup:number;profit:number;cash:number;inventoryValue:number;awareness:number;reputation:number;units:number;lost:number;shock:number;sales:Sale[];}
export interface LedgerEntry {id:string;month:number;kind:'production'|'capital';description:string;amount:number;units:number;productId?:string;}
export interface Company {schemaVersion:1;modelVersion:1;brand:Brand;lines:ProductLine[];products:SKU[];capital:number;cash:number;fixedCost:number;adBudget:number;awareness:number;reputation:number;month:number;seed:number;rngState:number;pendingSetup:number;market:Market;months:Month[];ledger:LedgerEntry[];}
export const CONCEPTS:{id:Concept;name:string;description:string;segment:SegmentId;template:string;line:string}[]=[
 {id:'daily',name:'매일의 도구',description:'가볍고 부담 없이, 오래 쓰는 일상.',segment:'student',template:'student',line:'Daily'},
 {id:'precision',name:'정확한 생각',description:'설계와 공부에 집중하는 정밀한 도구.',segment:'professional',template:'premium',line:'Studio'},
 {id:'natural',name:'손에 남는 감각',description:'원목과 자연스러운 곡선의 필기구.',segment:'design',template:'sculpted-wood',line:'Objects'},
 {id:'atelier',name:'소장하는 한 자루',description:'귀금속과 섬세한 마감의 작은 작품.',segment:'collector',template:'sterling',line:'Atelier'},
];
export const SEGMENT_NAMES:Record<SegmentId,string>={student:'학생 · 일상',professional:'제도 · 전문',design:'디자인 · 필기',collector:'수집 · 선물'};
export const DEFAULT_MARKET:Market={segments:[
 {id:'student',name:SEGMENT_NAMES.student,buyers:45000,referencePrice:4000,budgetSpread:.8,elasticity:1.7,outsideWeight:3},
 {id:'professional',name:SEGMENT_NAMES.professional,buyers:12000,referencePrice:25000,budgetSpread:.9,elasticity:1.15,outsideWeight:2.5},
 {id:'design',name:SEGMENT_NAMES.design,buyers:4000,referencePrice:65000,budgetSpread:1,elasticity:.9,outsideWeight:2.5},
 {id:'collector',name:SEGMENT_NAMES.collector,buyers:180,referencePrice:900000,budgetSpread:1.5,elasticity:.65,outsideWeight:3},
],adCpm:10000,adEffectiveness:.3,awarenessDecay:.06,annualGrowth:.02,volatility:.12,feeRate:.1,shipping:2000,returnRate:.025,returnHandling:2500,wordOfMouth:2};
export const uid=()=>typeof crypto!=='undefined'&&'randomUUID' in crypto?crypto.randomUUID():`biz-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const clamp=(v:number,a=0,b=1)=>Math.min(b,Math.max(a,v));
const clone=<T,>(v:T):T=>structuredClone(v);
export function createCompany(seed=142857):Company {return {schemaVersion:1,modelVersion:1,brand:{name:'',tagline:'생각을 담는 도구.',story:'',concept:'precision',logo:'wordmark',color:'#292925'},lines:[],products:[],capital:50000000,cash:50000000,fixedCost:350000,adBudget:200000,awareness:.04,reputation:.4,month:0,seed:seed>>>0,rngState:(seed>>>0)||1,pendingSetup:0,market:clone(DEFAULT_MARKET),months:[],ledger:[]};}
export function createLine(concept:Concept):ProductLine {const c=CONCEPTS.find(c=>c.id===concept)!;return {id:uid(),name:c.line,description:c.description,segment:c.segment};}
export function createSKU(line:ProductLine,template='premium',source?:Project):SKU {
 const design=source?clone(source):createProject(template);design.id=uid();design.quantity=source?.quantity??500;design.name=`${line.name} 01`;
 const quote=estimate(design);const price=Math.ceil(quote.unitCost/1000/0.52)*1000;
 return {id:uid(),lineId:line.id,name:`${line.name} 01`,design,price,batch:design.quantity,status:'draft',stock:0,costBasis:0,toolingPaid:false,sold:0};
}
/** Separate one-time tooling from inventory costs: never charge prepaid production again on sale. */
export function productionQuote(sku:SKU,units=sku.batch){
 const e=estimate({...sku.design,quantity:units});const rates={...DEFAULT_COST_ASSUMPTIONS,...sku.design.costAssumptions};
 const burden=1/(1-rates.rejectionRate)+rates.overheadRate;
 const oneTimeSetup=sku.toolingPaid?0:e.parts.filter(p=>sku.design.parts.find(s=>s.id===p.id)?.process==='injection').reduce((s,p)=>s+p.setupCost*units*burden,0);
 const batchSetup=e.parts.filter(p=>sku.design.parts.find(s=>s.id===p.id)?.process!=='injection').reduce((s,p)=>s+p.setupCost*units*burden,0);
 const setup=oneTimeSetup+batchSetup;
 const unitCost=Math.max(0,e.unitCost-e.setupCost*burden);
 return {unitCost,setup,oneTimeSetup,batchSetup,inventoryCost:unitCost*units,total:unitCost*units+setup,mass:e.mass};
}
export function inventoryValue(c:Company){return c.products.reduce((s,p)=>s+p.stock*p.costBasis,0);}
export function cumulativeProfit(c:Company){return c.cash+inventoryValue(c)-c.capital;}
export function produce(c:Company,id:string,units?:number):Company {
 const sku=c.products.find(p=>p.id===id);if(!sku)throw new Error('제품을 찾을 수 없습니다.');
 const issue=validate(sku.design).find(v=>v.severity==='error');if(issue)throw new Error(`설계를 먼저 확인하세요: ${issue.title}`);
 const n=units??sku.batch;if(!Number.isInteger(n)||n<1||n>1000000)throw new Error('생산 수량은 1–1,000,000개의 정수로 입력하세요.');
 const q=productionQuote(sku,n);if(q.total>c.cash+.000001)throw new Error(`생산 자금이 부족합니다. 필요한 자금: ${Math.ceil(q.total).toLocaleString('ko-KR')}원`);
 if(sku.stock+n>1000000)throw new Error('제품당 보관 한도는 1,000,000개입니다.');
 const next=clone(c),p=next.products.find(p=>p.id===id)!;
 p.costBasis=(p.stock*p.costBasis+q.inventoryCost)/(p.stock+n);p.stock+=n;p.toolingPaid=true;p.status='live';
 next.cash-=q.total;next.pendingSetup+=q.setup;
 next.ledger.push({id:uid(),month:c.month,kind:'production',description:`${p.name} · ${n.toLocaleString()}개 생산`,amount:-q.total,units:n,productId:id});
 return next;
}
export function addCapital(c:Company,amount:number):Company {
 if(!Number.isFinite(amount)||amount<=0||amount>1e12)throw new Error('증자 금액을 확인하세요.');
 const next=clone(c);next.capital+=amount;next.cash+=amount;next.ledger.push({id:uid(),month:c.month,kind:'capital',description:'추가 자본 투입',amount,units:0});return next;
}
export interface DesignFeatures {mass:number;diameter:number;weightFit:number;sizeFit:number;precision:number;craft:number;fit:number;}
export function designFeatures(sku:SKU,segment:SegmentId):DesignFeatures {
 const e=estimate(sku.design),parts=resolvedParts(sku.design),get=(id:string)=>parts.find(p=>p.id===id);
 const body=get('barrel')!,material=MATERIALS.find(m=>m.id===body.material)!;
 const optimum={student:[11,9],professional:[18,9.5],design:[16,10],collector:[32,10]}[segment];
 const weightFit=Math.exp(-.5*((e.mass-optimum[0])/(segment==='collector'?28:12))**2);
 const slices=axialSlices(body),diameter=2*Math.max(...Array.from({length:slices+1},(_,i)=>axialRadius(body,i/slices))),sizeFit=Math.exp(-.5*((diameter-optimum[1])/3)**2);
 const grip=get('grip'),sleeve=get('sleeve')!;
 const wall=boreWallThickness(body),precision=clamp(.35+.22*Math.exp(-.5*((sleeve.length-4)/1.8)**2)+.18*(sku.design.leadDiameter<=.7?1:.4)+.12*(grip&&grip.pattern!=='smooth'?1:.4)+.13*clamp(wall/.6));
 const precious=['gold18','gold24','silver925','platinum'].includes(body.material),natural=material.category==='wood';
 const craft=clamp(.3+(precious?.4:natural?.3:material.category==='metal'?.18:.05)+(['polished','oil','clear'].includes(body.finish)?.15:.05)+(sku.design.accent?.material?.includes('diamond')?.15:0));
 const weights={student:[.4,.35,.2,.05],professional:[.2,.15,.6,.05],design:[.25,.25,.1,.4],collector:[.1,.1,.1,.7]}[segment];
 const fit=[weightFit,sizeFit,precision,craft].reduce((s,v,i)=>s+v*weights[i],0);
 return {mass:e.mass,diameter,weightFit,sizeFit,precision,craft,fit};
}
/** Standard normal CDF approximation (maximum absolute error about 7.5e-8). */
export function normalCDF(x:number){const a=Math.abs(x),t=1/(1+.2316419*a),d=.3989422804014327*Math.exp(-a*a/2);const p=1-d*t*(.319381530+t*(-.356563782+t*(1.781477937+t*(-1.821255978+t*1.330274429))));return x<0?1-p:p;}
export function nextAwareness(c:Company){
 const total=c.market.segments.reduce((s,p)=>s+p.buyers,0);
 const reach=c.adBudget/c.market.adCpm*1000*c.market.adEffectiveness/Math.max(1,total);
 return clamp(c.awareness*(1-c.market.awarenessDecay)+(1-c.awareness)*(1-Math.exp(-reach)));
}
export function demandForecast(c:Company){
 const live=c.products.filter(p=>p.status==='live'),awareness=nextAwareness(c);
 const season=1+.12*Math.sin((c.month+1-2)*Math.PI/6),growth=(1+c.market.annualGrowth)**(c.month/12);
 const bySegment=c.market.segments.map(segment=>{
  const weights=live.map(p=>{
   const fit=designFeatures(p,segment.id).fit,line=c.lines.find(l=>l.id===p.lineId)!;
   const affinity=line.segment===segment.id?1.2:.8;
   const concept=CONCEPTS.find(v=>v.id===c.brand.concept)!;
   const positioning=concept.segment===segment.id?1.12:1;
   const affordability=1-normalCDF(Math.log(p.price/segment.referencePrice)/segment.budgetSpread);
   const weight=Math.exp(3*(fit-.5)+.8*c.reputation)*Math.pow(segment.referencePrice/p.price,segment.elasticity)*affordability*affinity*positioning;
   return {id:p.id,fit,weight};
  });
  const total=segment.outsideWeight+weights.reduce((s,w)=>s+w.weight,0);
  const buyers=segment.buyers*season*growth;
  return {id:segment.id,name:segment.name,buyers,considered:buyers*awareness,outside:segment.outsideWeight/total,products:weights.map(w=>({...w,share:w.weight/total,expected:buyers*awareness*w.weight/total}))};
 });
 const products=live.map(p=>({id:p.id,expected:bySegment.reduce((s,g)=>s+(g.products.find(x=>x.id===p.id)?.expected??0),0)}));
 return {awareness,bySegment,products};
}
class Random {
 state:number;constructor(state:number){this.state=state||1;}
 next(){let x=this.state;x^=x<<13;x^=x>>>17;x^=x<<5;this.state=x>>>0;return (this.state+.5)/4294967296;}
 normal(){return Math.sqrt(-2*Math.log(this.next()))*Math.cos(2*Math.PI*this.next());}
 binomial(n:number,p:number):number{
  n=Math.max(0,Math.round(n));p=clamp(p);if(p===0||n===0)return 0;if(p===1)return n;if(p>.5)return n-this.binomial(n,1-p);
  if(n<=40){let k=0;for(let i=0;i<n;i++)if(this.next()<p)k++;return k;}
  // Inverse binomial CDF avoids a Poisson approximation for rare premium purchases.
  if(n*p<12){let k=0,q=Math.pow(1-p,n),sum=q,u=this.next();while(u>sum&&k<n){k++;q*=((n-k+1)/k)*(p/(1-p));sum+=q;}return k;}
  return Math.round(clamp(n*p+Math.sqrt(n*p*(1-p))*this.normal(),0,n));
 }
}
export function simulateMonth(company:Company):Company {
 if(company.cash<0)throw new Error('현금이 부족합니다. 자본을 추가하거나 이전 달로 돌아가세요.');
 if(!company.products.some(p=>p.toolingPaid))throw new Error('먼저 제품을 생산해 시장에 출시하세요.');
 const c=clone(company),rng=new Random(c.rngState),forecast=demandForecast(c);
 const shock=clamp(Math.exp(c.market.volatility*rng.normal()-.5*c.market.volatility**2),.1,5);
 const demand=new Map(c.products.map(p=>[p.id,0]));
 for(const segment of forecast.bySegment){
  let remaining=rng.binomial(Math.round(segment.buyers*shock),forecast.awareness),probability=1;
  for(const p of segment.products){const n=rng.binomial(remaining,p.share/probability);demand.set(p.id,demand.get(p.id)!+n);remaining-=n;probability=Math.max(1e-12,probability-p.share);}
 }
 const sales:Sale[]=c.products.filter(p=>p.status==='live').map(p=>{
  const wanted=demand.get(p.id)!,orders=Math.min(p.stock,wanted),returns=rng.binomial(orders,c.market.returnRate),netUnits=orders-returns;
  p.stock-=netUnits;p.sold+=netUnits;
  return {id:p.id,name:p.name,demand:wanted,orders,returns,netUnits,lost:wanted-orders,revenue:netUnits*p.price,cogs:netUnits*p.costBasis,fees:netUnits*p.price*c.market.feeRate,fulfilment:orders*c.market.shipping+returns*c.market.returnHandling};
 });
 const sum=(key:'revenue'|'cogs'|'fees'|'fulfilment'|'netUnits'|'lost')=>sales.reduce((s,v)=>s+v[key],0);
 const revenue=sum('revenue'),cogs=sum('cogs'),fees=sum('fees'),fulfilment=sum('fulfilment'),units=sum('netUnits'),lost=sum('lost');
 const profit=revenue-cogs-fees-fulfilment-c.adBudget-c.fixedCost-c.pendingSetup;
 c.cash+=revenue-fees-fulfilment-c.adBudget-c.fixedCost;
 const totalBuyers=c.market.segments.reduce((s,p)=>s+p.buyers,0);
 c.awareness=clamp(forecast.awareness+(1-forecast.awareness)*(1-Math.exp(-units*c.market.wordOfMouth/Math.max(1,totalBuyers))));
 const satisfaction=units?c.products.reduce((s,p)=>s+(sales.find(v=>v.id===p.id)?.netUnits??0)*designFeatures(p,c.lines.find(l=>l.id===p.lineId)!.segment).fit,0)/units:c.reputation;
 c.reputation=clamp(c.reputation+.15*(satisfaction-c.reputation)*units/(units+80)-.015*lost/Math.max(1,units+lost));
 c.month++;
 c.months.push({month:c.month,revenue,cogs,fees,fulfilment,advertising:c.adBudget,fixed:c.fixedCost,setup:c.pendingSetup,profit,cash:c.cash,inventoryValue:inventoryValue(c),awareness:c.awareness,reputation:c.reputation,units,lost,shock,sales});
 c.pendingSetup=0;c.rngState=rng.state;return c;
}
export function uncertainty(c:Company,runs=80){
 if(!c.products.some(p=>p.toolingPaid)||c.cash<0)return undefined;
 const samples=Array.from({length:runs},(_,i)=>{const next=simulateMonth({...c,rngState:((c.rngState+Math.imul(i+1,2654435761))>>>0)||1});return next.months.at(-1)!;});
 const quantile=(key:'units'|'profit',q:number)=>{const values=samples.map(s=>s[key]).sort((a,b)=>a-b);return values[Math.floor((values.length-1)*q)];};
 return {runs,units:[quantile('units',.1),quantile('units',.5),quantile('units',.9)],profit:[quantile('profit',.1),quantile('profit',.5),quantile('profit',.9)]};
}
export function unitContribution(sku:SKU,market:Market){const q=productionQuote(sku);return sku.price*(1-market.feeRate)-q.unitCost-(market.shipping+market.returnRate*market.returnHandling)/(1-market.returnRate);}
const finite=(a:number,b:number)=>z.number().finite().min(a).max(b);
const segmentId=z.enum(['student','professional','design','collector']);
const SegmentSchema=z.object({id:segmentId,name:z.string().max(80),buyers:finite(0,500000).int(),referencePrice:finite(500,1e8),budgetSpread:finite(.2,3),elasticity:finite(.1,4),outsideWeight:finite(.1,20)});
const MarketSchema=z.object({segments:z.array(SegmentSchema).length(4).refine(s=>new Set(s.map(x=>x.id)).size===4),adCpm:finite(100,1e6),adEffectiveness:finite(0,1),awarenessDecay:finite(0,.5),annualGrowth:finite(-.5,1),volatility:finite(0,.8),feeRate:finite(0,.6),shipping:finite(0,1e5),returnRate:finite(0,.5),returnHandling:finite(0,1e5),wordOfMouth:finite(0,20)});
const SaleSchema=z.object({id:z.string().max(120),name:z.string().max(100),demand:finite(0,1e10).int(),orders:finite(0,1e6).int(),returns:finite(0,1e6).int(),netUnits:finite(0,1e6).int(),lost:finite(0,1e10).int(),revenue:finite(0,1e16),cogs:finite(0,1e16),fees:finite(0,1e16),fulfilment:finite(0,1e16)});
const MonthSchema=z.object({month:z.number().int().nonnegative().min(1),revenue:finite(0,1e16),cogs:finite(0,1e16),fees:finite(0,1e16),fulfilment:finite(0,1e16),advertising:finite(0,1e10),fixed:finite(0,1e10),setup:finite(0,1e16),profit:finite(-1e16,1e16),cash:finite(-1e16,1e16),inventoryValue:finite(0,1e16),awareness:finite(0,1),reputation:finite(0,1),units:finite(0,1.2e7).int(),lost:finite(0,1e10).int(),shock:finite(0,100),sales:z.array(SaleSchema).max(12)});
const CompanySchema=z.object({schemaVersion:z.literal(1),modelVersion:z.literal(1).default(1),brand:z.object({name:z.string().max(60),tagline:z.string().max(160),story:z.string().max(2000),concept:z.enum(['daily','precision','natural','atelier']),logo:z.enum(['wordmark','monogram','symbol']),color:z.string().regex(/^#[0-9a-fA-F]{6}$/)}),lines:z.array(z.object({id:z.string().min(1).max(120),name:z.string().min(1).max(60),description:z.string().max(300),segment:segmentId})).max(8),products:z.array(z.object({id:z.string().min(1).max(120),lineId:z.string().max(120),name:z.string().min(1).max(100),design:z.unknown(),price:finite(500,1e8),batch:finite(1,1e6).int(),status:z.enum(['draft','live','paused']),stock:finite(0,1e6).int(),costBasis:finite(0,1e12),toolingPaid:z.boolean(),sold:finite(0,1e10).int()})).max(12),capital:finite(0,1e15),cash:finite(-1e16,1e16),fixedCost:finite(0,1e10),adBudget:finite(0,1e10),awareness:finite(0,1),reputation:finite(0,1),month:z.number().int().nonnegative(),seed:finite(0,4294967295).int(),rngState:finite(0,4294967295).int(),pendingSetup:finite(0,1e16),market:MarketSchema,months:z.array(MonthSchema),ledger:z.array(z.object({id:z.string().max(120),month:z.number().int().nonnegative(),kind:z.enum(['production','capital']),description:z.string().max(200),amount:finite(-1e16,1e16),units:finite(0,1e6).int(),productId:z.string().max(120).optional()}))});
export function validateCompany(raw:unknown):Company {
 const c=CompanySchema.parse(raw);
 if(new Set(c.lines.map(l=>l.id)).size!==c.lines.length||new Set(c.products.map(p=>p.id)).size!==c.products.length)throw new Error('중복된 라인업 또는 제품 ID입니다.');
 if(c.products.some(p=>!c.lines.some(l=>l.id===p.lineId)))throw new Error('라인업이 없는 제품입니다.');
 if(c.month!==c.months.length||c.months.some((m,i)=>m.month!==i+1))throw new Error('월별 장부 순서가 올바르지 않습니다.');
 const tolerance=(a:number,b:number)=>Math.abs(a-b)<=Math.max(.01,Math.abs(b)*1e-10);
 const expectedCash=c.capital+c.ledger.filter(e=>e.kind==='production').reduce((s,e)=>s+e.amount,0)+c.months.reduce((s,m)=>s+m.revenue-m.fees-m.fulfilment-m.advertising-m.fixed,0);
 if(!tolerance(c.cash,expectedCash))throw new Error('현금과 생산·판매 장부가 일치하지 않습니다.');
 const value=c.products.reduce((s,p)=>s+p.stock*p.costBasis,0),income=c.months.reduce((s,m)=>s+m.profit,0)-c.pendingSetup;
 if(!tolerance(c.cash+value-c.capital,income))throw new Error('재고 자산과 누적 손익이 일치하지 않습니다.');
 return {...c,products:c.products.map(p=>({...p,design:validateProjectImport(p.design)}))};
}
export function companyCSV(c:Company){
 const q=(s:string)=>'"'+(/^[=+\-@\t\r]/.test(s)?"'":'')+s.replace(/"/g,'""')+'"';
 return '\uFEFF'+['월,매출,매출원가,수수료,배송및반품비,광고비,고정비,금형및생산준비비,세전영업손익,기말현금,재고자산,순판매수량,품절손실',...c.months.map(m=>[m.month,m.revenue,m.cogs,m.fees,m.fulfilment,m.advertising,m.fixed,m.setup,m.profit,m.cash,m.inventoryValue,m.units,m.lost].join(',')),'','월,제품,주문수,반품수,순판매수,수요,품절손실,매출',...c.months.flatMap(m=>m.sales.map(s=>[m.month,q(s.name),s.orders,s.returns,s.netUnits,s.demand,s.lost,s.revenue].join(','))),'','월,거래,설명,현금변동,생산수량',...c.ledger.map(e=>[e.month,e.kind,q(e.description),e.amount,e.units].join(',')),'','제품_ID,제품,기말재고,재고단가,재고자산,누적순판매',...c.products.map(p=>[q(p.id),q(p.name),p.stock,p.costBasis,p.stock*p.costBasis,p.sold].join(',')),'','항목,금액','시작자본,'+(c.capital-c.ledger.filter(e=>e.kind==='capital').reduce((s,e)=>s+e.amount,0)),'총투입자본,'+c.capital,'기말현금,'+c.cash,'기말재고자산,'+inventoryValue(c),'누적손익,'+cumulativeProfit(c)].join('\r\n');
}
