import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createCompany,createLine,createSKU,produce,productionQuote,simulateMonth,demandForecast,inventoryValue,cumulativeProfit,addCapital,validateCompany,uncertainty,nextAwareness,unitContribution,companyCSV,designFeatures} from './business';
import {estimate} from './design';
import {logoSVG} from '../components/BrandLogo';
import type {Company} from './business';
const close=(a:number,b:number)=>assert.ok(Math.abs(a-b)<.01,`${a} != ${b}`);
function company(){const c=createCompany(142857);c.brand.name='ONDO';c.lines=[createLine('precision')];c.products=[createSKU(c.lines[0])];return c;}
function launched(){const c=company();return produce(c,c.products[0].id);}
test('first production reconciles original CAD estimate, cash, inventory and one-time setup expense',()=>{
 const c=company(),p=c.products[0],q=productionQuote(p);close(q.total,estimate({...p.design,quantity:p.batch}).totalCost);
 const n=produce(c,p.id);close(c.cash-n.cash,q.total);close(inventoryValue(n),q.inventoryCost);close(cumulativeProfit(n),-q.setup);assert.equal(c.products[0].stock,0);assert.equal(n.products[0].stock,500);
 const restock=produce(n,p.id,50);const repeat=productionQuote(n.products[0],50);assert.equal(repeat.oneTimeSetup,0);assert.ok(repeat.batchSetup>0);close(n.cash-restock.cash,q.unitCost*50+repeat.batchSetup);close(cumulativeProfit(restock),cumulativeProfit(n)-repeat.batchSetup);close(restock.pendingSetup,n.pendingSetup+repeat.batchSetup);
});
test('inventory is paid once: sale cash flow and income remain distinct and reconcile every month',()=>{
 let c=launched();
 for(let i=0;i<12;i++){const before=c.cash;const n=simulateMonth(c),m=n.months.at(-1)!;
  close(n.cash-before,m.revenue-m.fees-m.fulfilment-m.advertising-m.fixed);
  close(cumulativeProfit(n),n.months.reduce((s,m)=>s+m.profit,0)-n.pendingSetup);
  close(inventoryValue(c)-inventoryValue(n),m.cogs);c=n;
 }
 assert.equal(c.products[0].stock,0);assert.equal(c.products[0].sold,500);
});
test('same company and seed reproduce exact outcomes; forecasts never consume state',()=>{
 const c=launched(),raw=JSON.stringify(c);assert.deepEqual(simulateMonth(c),simulateMonth(c));assert.deepEqual(uncertainty(c),uncertainty(c));assert.equal(JSON.stringify(c),raw);
 const a=simulateMonth(c).months[0],b=simulateMonth({...c,rngState:23456}).months[0];assert.notDeepEqual(a,b);
 const u=uncertainty(c)!;assert.ok(u.units[0]<=u.units[1]&&u.units[1]<=u.units[2]);assert.ok(u.profit[0]<=u.profit[1]&&u.profit[1]<=u.profit[2]);
});
test('prices, external competition and sibling SKUs alter a coherent choice probability',()=>{
 const c=launched(),p=c.products[0],expected=(x:Company)=>demandForecast(x).products[0].expected;
 const cheap={...c,products:[{...p,price:p.price/2}]};assert.ok(expected(cheap)>expected(c));
 const competing={...c,market:{...c.market,segments:c.market.segments.map(s=>({...s,outsideWeight:s.outsideWeight*2}))}};assert.ok(expected(competing)<expected(c));
 const sibling={...c,products:[p,{...p,id:'sibling'}]};assert.ok(expected(sibling)<expected(c));
 for(const s of demandForecast(sibling).bySegment){close(s.outside+s.products.reduce((n,p)=>n+p.share,0),1);assert.ok(s.products.reduce((n,p)=>n+p.expected,0)<=s.considered);}
});
test('no awareness produces no purchases; marketing increases bounded awareness',()=>{
 const c={...launched(),awareness:0,adBudget:0};assert.equal(nextAwareness(c),0);const n=simulateMonth(c);assert.equal(n.months[0].units,0);assert.equal(n.months[0].revenue,0);assert.ok(nextAwareness({...c,adBudget:200000})>0);assert.ok(nextAwareness({...c,adBudget:1e10})<=1);
});
test('orders, returns, stock and revenues conserve integer units; stockouts do not create cash',()=>{
 const c=launched();c.market.returnRate=.5;
 const n=simulateMonth(c),m=n.months[0],s=m.sales[0];assert.ok(s.returns>0);assert.equal(s.netUnits,s.orders-s.returns);assert.equal(n.products[0].stock,c.products[0].stock-s.netUnits);assert.ok(s.orders<=c.products[0].stock);assert.ok(Number.isInteger(s.demand));close(s.revenue,s.netUnits*c.products[0].price);
 const empty={...c,products:c.products.map(p=>({...p,stock:0}))},e=simulateMonth(empty).months[0];assert.ok(e.lost>0);assert.equal(e.units,0);assert.equal(e.fees,0);assert.equal(e.fulfilment,0);assert.equal(e.cogs,0);
});
test('capital is not profit, tooling is charged once and each new batch charges its production setup',()=>{
 let c=launched();const before=cumulativeProfit(c),n=addCapital(c,1000000);close(cumulativeProfit(n),before);close(n.cash-c.cash,1e6);
 c=simulateMonth(n);const setup=c.months[0].setup;assert.ok(setup>0);assert.equal(c.pendingSetup,0);const repeat=productionQuote(c.products[0],200);c=produce(c,c.products[0].id,200);c=simulateMonth(c);close(c.months[1].setup,repeat.batchSetup);assert.equal(repeat.oneTimeSetup,0);close(cumulativeProfit(c),c.months.reduce((s,m)=>s+m.profit,0));
});
test('production enforces funds and valid geometry; low prices can have negative contribution',()=>{
 const c=company();c.cash=10;assert.throws(()=>produce(c,c.products[0].id),/자금/);assert.equal(c.cash,10);assert.throws(()=>produce(c,c.products[0].id,1.5),/정수/);
 const p=company();p.products[0].design.parts.find(x=>x.id==='barrel')!.bore=20;assert.throws(()=>produce(p,p.products[0].id),/설계/);
 assert.ok(unitContribution({...company().products[0],price:500},c.market)<0);
});
test('pausing every listing stops sales but still charges operations; insolvency stops another month',()=>{
 const c=launched();c.products[0].status='paused';const n=simulateMonth(c);assert.equal(n.months[0].units,0);close(n.cash,c.cash-c.adBudget-c.fixedCost);assert.throws(()=>simulateMonth({...n,cash:-1}),/현금/);assert.throws(()=>simulateMonth(company()),/출시/);
});
test('design revisions alter the actual production cost and mass',()=>{
 const c=company(),p=c.products[0],light=productionQuote(p);const metal={...p,design:{...p.design,parts:p.design.parts.map(x=>x.id==='barrel'?{...x,material:'gold18',color:'#cda64e'}:x)}};
 const heavy=productionQuote(metal);assert.ok(heavy.mass>light.mass);assert.ok(heavy.unitCost>light.unitCost);
 const tapered={...p,design:{...p.design,parts:p.design.parts.map(x=>x.id==='barrel'?{...x,endDiameter:20}:x)}};assert.ok(designFeatures(tapered,'design').diameter>=20);assert.ok(designFeatures(tapered,'design').sizeFit<designFeatures(p,'design').sizeFit);
});
test('validated company JSON restores financial state and rejects invalid references, ranges and nested CAD',()=>{
 const c=simulateMonth(launched());assert.deepEqual(validateCompany(JSON.parse(JSON.stringify(c))),c);
 assert.throws(()=>validateCompany({...c,cash:NaN}));assert.throws(()=>validateCompany({...c,lines:[]}));assert.throws(()=>validateCompany({...c,products:[c.products[0],c.products[0]]}));assert.throws(()=>validateCompany({...c,month:4}));assert.throws(()=>validateCompany({...c,market:{...c.market,feeRate:1}}));assert.throws(()=>validateCompany({...c,products:[{...c.products[0],design:{}}]}));
 assert.throws(()=>validateCompany({...c,cash:c.cash+100}),/현금/);assert.throws(()=>validateCompany({...c,products:c.products.map(p=>({...p,stock:p.stock+1}))}),/재고/);
 const csv=companyCSV(c);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/세전영업손익/);assert.match(csv,/ONDO|Studio 01/);
});
test('an existing pencil design becomes an independent SKU snapshot with its own cost and batch',()=>{
 const c=company(),source=structuredClone(c.products[0].design);source.quantity=1200;source.parts.find(p=>p.id==='barrel')!.length+=2;
 const p=createSKU(c.lines[0],'premium',source);assert.notEqual(p.design.id,source.id);assert.equal(p.batch,1200);close(productionQuote(p).total,estimate({...source,quantity:1200}).totalCost);
 p.design.parts[0].length=9;assert.notEqual(p.design.parts[0].length,source.parts[0].length);
});
test('two products, different prices, restocks and capital injections retain the accounting identity',()=>{
 let c=company();c.capital=1e8;c.cash=1e8;c.lines.push(createLine('natural'));c.products.push(createSKU(c.lines[1],'sculpted-wood'));for(const p of c.products)c=produce(c,p.id);
 for(let i=0;i<24;i++){if(i%4===0)for(const p of c.products)c=produce(c,p.id,100);if(i===9)c=addCapital(c,1e6);c=simulateMonth(c);validateCompany(c);close(cumulativeProfit(c),c.months.reduce((s,m)=>s+m.profit,0));assert.ok(c.products.every(p=>p.stock>=0));}
 assert.ok(c.products.every(p=>p.sold>0));
});
test('simulation continues past 120 months and restores long histories without a calendar cap',()=>{
 let c=company();c.capital=1e9;c.cash=1e9;c=produce(c,c.products[0].id);c.products[0].status='paused';for(let i=0;i<125;i++)c=simulateMonth(c);validateCompany(c);assert.equal(c.months.length,125);c=simulateMonth(validateCompany(JSON.parse(JSON.stringify(c))));assert.equal(c.month,126);assert.ok(uncertainty(c));
 c.months[0].sales=[{id:c.products[0].id,name:'=HYPERLINK("example")',demand:0,orders:0,returns:0,netUnits:0,lost:0,revenue:0,cogs:0,fees:0,fulfilment:0}];assert.match(companyCSV(c),/"'=HYPERLINK/);
});
test('logos are real SVG and user-authored text cannot introduce executable markup',()=>{
 const c=company();for(const logo of ['wordmark','monogram','symbol'] as const){const svg=logoSVG({...c.brand,logo,name:'A<script>&"',tagline:'<img onerror="x">'});assert.match(svg,/^<svg/);assert.ok(!svg.includes('<script>'));assert.ok(!svg.includes('<img '));assert.match(svg,/&lt;/);assert.match(svg,/<title>/);}
});
