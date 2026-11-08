import type {Part} from '../types';
import {colorsForMaterial,finishesForMaterial,normalizeAppearance} from '../engine/materials';
export default function AppearanceEditor({part,onChange}:{part:Part;onChange:(patch:Partial<Part>)=>void}){
 const colors=colorsForMaterial(part.material,part.finish),finishes=finishesForMaterial(part.material);
 return <div className="appearance-editor"><label className="appearance-finish">표면 마감<select aria-label="표면 마감" value={part.finish} onChange={e=>{const next=normalizeAppearance({...part,finish:e.target.value as Part['finish']});onChange({finish:next.finish,color:next.color})}}>{finishes.map(([id,label])=><option key={id} value={id}>{label}</option>)}</select></label><span className="appearance-label">소재에 맞는 색상</span><div className="appearance-colors">{colors.map(c=><button key={c.hex} aria-label={c.name} title={c.name} className={part.color.toLowerCase()===c.hex.toLowerCase()?'is-selected':''} style={{'--swatch':c.hex} as React.CSSProperties} onClick={()=>onChange({color:c.hex})}/>)}</div><p>{part.material==='diamond'||part.material==='lab-diamond'?'보석 고유 색상을 사용합니다.':'원재료 또는 선택한 표면 처리에서 가능한 색상입니다.'}</p></div>
}
