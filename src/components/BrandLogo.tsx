import type {Brand} from '../engine/business';
function escapeXML(s:string){return s.replace(/[<>&"']/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&apos;'}[c]!));}
export function logoSVG(brand:Brand){
 const name=escapeXML(brand.name.trim()||'YOUR BRAND'),initial=escapeXML(Array.from(brand.name.trim()||'PF').slice(0,2).join('').toUpperCase());
 const color=/^#[0-9a-fA-F]{6}$/.test(brand.color)?brand.color:'#292925';
 const rawName=brand.name.trim()||'YOUR BRAND';
 const size=Math.min(66,480/Math.max(5,Array.from(rawName).length)*1.45);
 const width=Array.from(rawName).reduce((s,c)=>s+(/[^\x00-\x7f]/.test(c)?1:.65)*size,0);
 const fit=width>480?'textLength=\"480\" lengthAdjust=\"spacingAndGlyphs\"':'';
 const taglineFit=brand.tagline.length>35?'textLength=\"420\" lengthAdjust=\"spacingAndGlyphs\"':'';
 const mark=brand.logo==='monogram'?`<rect x="250" y="48" width="100" height="100" rx="2" fill="none" stroke="${color}" stroke-width="1.4"/><text x="300" y="114" font-family="Georgia,serif" font-size="43" text-anchor="middle" fill="${color}">${initial}</text>`:brand.logo==='symbol'?`<g transform="translate(300 99)" fill="none" stroke="${color}" stroke-width="2"><path d="M0 -46 25 -12 0 46 -25 -12Z"/><path d="M0 -46V46M-25 -12H25"/><circle cy="-12" r="4" fill="${color}"/></g>`:'';
 const y=brand.logo==='wordmark'?140:213;
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 290" role="img" aria-label="${name} 로고"><title>${name} 로고</title>${mark}<text x="300" y="${y}" fill="${color}" font-family="${brand.logo==='wordmark'?'Arial,sans-serif':'Georgia,serif'}" font-weight="${brand.logo==='wordmark'?'500':'400'}" font-size="${size}" ${fit} letter-spacing="${brand.logo==='wordmark'?'-1.8':'2'}" text-anchor="middle">${name}</text><text x="300" y="${y+44}" fill="${color}" opacity=".62" font-family="Arial,sans-serif" font-size="10" ${taglineFit} letter-spacing="2.8" text-anchor="middle">${escapeXML(brand.tagline)}</text></svg>`;
}
export default function BrandLogo({brand}:{brand:Brand}){return <div className="b-logo" dangerouslySetInnerHTML={{__html:logoSVG(brand)}}/>;}
