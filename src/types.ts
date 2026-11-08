export type PartId = 'barrel'|'grip'|'nose'|'sleeve'|'button'|'clip'|'reservoir'|'clutch'|'spring'|'eraser'|'holder'|'lead'|'finial';
export type CrossSection = 'circle'|'hexagon'|'octagon'|'triangle'|'ellipse'|'square';
export type Pattern = 'smooth'|'rings'|'knurl'|'grooves';
export type Finish = 'matte'|'polished'|'brushed'|'anodized'|'bead'|'pvd'|'painted'|'oil'|'clear';
export type Process = 'cnc'|'injection'|'printing'|'purchased';
export interface Part { id:PartId; name:string; englishName:string; group:'body'|'tip'|'internal'|'top'|'accessory'; material:string; color:string; finish:Finish; process:Process; length:number; diameter:number; bore:number; endDiameter?:number; y:number; shape:CrossSection; pattern:Pattern; patternDepth:number; patternPitch:number; angle:number; clipGap:number; clipCurve:number; visible:boolean; enabled?:boolean; profile?:'conical'|'stepped'|'curved'|'cylinder'; clipStyle?:'arched'|'straight'|'wave'|'wide'; bulge?:number; bulgePosition?:number; edgeRadius?:number; capThickness?:number; seatDiameter?:number; seatDepth?:number; clipBendPosition?:number; clipToe?:number; }
export interface CostAssumptions {gemSettingPerUnit?:number;cncRatePerHour:number; setupPerPart:number; assemblyPerUnit:number; packagingPerUnit:number; rejectionRate:number; overheadRate:number; materialPrices:Record<string,number>}
export interface Project { schemaVersion:1; id:string; name:string; brand:string; model:string; designer:string; description:string; leadDiameter:number; clearance:number; length:number; quantity:number; targetPrice:number; margin:number; parts:Part[]; costAssumptions?:Partial<CostAssumptions>; actuation?:'knock'|'twist'; geometryRevision?:2; accent?:{material:string;diameter:number;height:number}; updatedAt:string; }
export interface Material { id:string; name:string; category:'metal'|'plastic'|'wood'|'other'|'gem'; density:number; pricePerKg:number; modulus:number; color:string; metalness:number; note:string; }
export interface PartMetric { id:PartId; volume:number; mass:number; materialCost:number; processCost:number; finishCost:number; setupCost:number; cost:number; center:number; }
export interface Estimate { parts:PartMetric[]; mass:number; centerOfMass:number; materialCost:number; processCost:number; finishCost:number; setupCost:number; assemblyCost:number; overhead:number; unitCost:number; totalCost:number; sellingPrice:number; }
export interface Validation { id:string; severity:'error'|'warning'|'info'; partId?:PartId; title:string; description:string; }
export type ViewMode = 'solid'|'wireframe'|'transparent'|'section'|'exploded'|'internal';
export type WorkspaceTab = 'design'|'materials'|'analysis'|'studio';
export interface ViewSettings { resetKey?:number; mode:ViewMode; dimensions:boolean; grid:boolean; autoRotate:boolean; camera:'perspective'|'front'|'side'|'top'; explode:number; background:string; }
