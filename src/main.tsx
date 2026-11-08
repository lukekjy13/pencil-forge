import ReactDOM from 'react-dom/client';
import {lazy,Suspense,useState} from 'react';
import App from './App';
const BusinessStudio=lazy(()=>import('./BusinessStudio'));
function Workspace(){const [company,setCompany]=useState(false);return company?<Suspense fallback={<div className="g-loading">기업 운영 화면을 여는 중…</div>}><BusinessStudio onReturnToStudio={()=>setCompany(false)}/></Suspense>:<App onOpenCompany={()=>setCompany(true)}/>;}
import './styles.css';
// The 3D scene owns a separate renderer and DOM label portals. Keep one root
// lifecycle so development-only double unmounts cannot race portal cleanup.
ReactDOM.createRoot(document.getElementById('root')!).render(<Workspace/>);
