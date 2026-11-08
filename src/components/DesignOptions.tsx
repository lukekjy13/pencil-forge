import {useDesignStore} from '../store';
import {setPartEnabled} from '../engine/assembly';
import {applyNoseDesign,applyClipDesign,applyActuation,NOSE_DESIGNS} from '../engine/variants';
import type {PartId,Part} from '../types';
export default function DesignOptions({partId}:{partId:PartId}){
 const {project,updateProject}=useDesignStore();const part=project.parts.find(p=>p.id===partId)!;
 return <div className="design-options">
 {(partId==='grip'||partId==='clip')&&<label className="design-enable"><span>{partId==='grip'?'분리형 그립':'포켓 클립'}</span><select aria-label={partId==='grip'?'그립 구성':'클립 구성'} value={part.enabled===false?'off':'on'} onChange={e=>updateProject(setPartEnabled(project,partId,e.target.value==='on'))}><option value="on">사용</option><option value="off">없음</option></select></label>}
 {partId==='grip'&&part.enabled===false&&<p className="design-help">별도 그립 없이 몸통이 촉까지 이어집니다.</p>}
 {partId==='nose'&&<label className="design-select">촉 디자인<select aria-label="촉 디자인" value={NOSE_DESIGNS.find(d=>d.profile===(part.profile||'conical')&&Math.abs(d.length-part.length)<.01)?.id||'custom'} onChange={e=>updateProject(applyNoseDesign(project,e.target.value))}><option value="custom">사용자 설정</option>{NOSE_DESIGNS.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></label>}
 {partId==='clip'&&part.enabled!==false&&<label className="design-select">클립 디자인<select aria-label="클립 디자인" value={part.clipStyle||'arched'} onChange={e=>updateProject(applyClipDesign(project,e.target.value as NonNullable<Part['clipStyle']>))}><option value="arched">곡선형</option><option value="straight">직선형</option><option value="wave">웨이브</option><option value="wide">와이드</option></select></label>}
 {partId==='button'&&<><label className="design-select">상단 디자인<select aria-label="상단 디자인" value={project.actuation||'knock'} onChange={e=>updateProject(applyActuation(project,e.target.value as 'knock'|'twist'))}><option value="knock">누르는 노크 버튼</option><option value="twist">돌리는 회전 크라운</option></select></label>{project.actuation==='twist'&&<p className="design-help">팔각 크라운이 회전하는 개념 설계입니다. 내부 전달기구는 검증 전입니다.</p>}</>}
 </div>
}
