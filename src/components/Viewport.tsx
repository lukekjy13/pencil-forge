import { Component, Suspense, useEffect, useMemo, useRef } from 'react';
import {resolvedParts} from '../engine/assembly';
import type { ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Grid, Lightformer, Line, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import type { Part, PartId, Project, ViewSettings } from '../types';
import { createPartGeometry, clipMountRadius } from '../engine/geometry';
import { createSurfaceMaterial, disposeSurfaceMaterial, withSurfaceUVs } from '../engine/surface';

interface Props { project:Project; selected:PartId; settings:ViewSettings; onSelect:(id:PartId)=>void; onReady?:(canvas:HTMLCanvasElement)=>void; knock:number; }

class WebGLErrorBoundary extends Component<{children:ReactNode},{failed:boolean}> {
  state={failed:false};
  static getDerivedStateFromError(){return {failed:true};}
  render(){return this.state.failed?<div className="viewport-fallback"><span>3D 뷰를 시작할 수 없습니다.</span><small>WebGL을 지원하는 브라우저에서 다시 열어 주세요. 설계 데이터는 그대로 저장됩니다.</small></div>:this.props.children;}
}

/** Render-only UVs preserve the exact dimensioned export geometry. U wraps around the
 * part; V advances once per 20 mm so grain and brush marks retain a physical scale. */
function createRenderGeometry(part:Part,bodyRadius:number) {
  const source=createPartGeometry(part,bodyRadius);
  const geometry=withSurfaceUVs(source,part);
  source.dispose();
  return geometry;
}

function PartMesh({part,selected,settings,onSelect,knock,bodyRadius,twist}: {part:Part;selected:PartId;settings:ViewSettings;onSelect:(id:PartId)=>void;knock:number;bodyRadius:number;twist:boolean}) {
  const geometry=useMemo(()=>createRenderGeometry(part,bodyRadius),[part.length,part.diameter,part.bore,part.endDiameter,part.shape,part.pattern,part.patternDepth,part.patternPitch,part.angle,part.clipGap,part.clipCurve,part.profile,part.clipStyle,part.bulge,part.bulgePosition,part.edgeRadius,part.capThickness,part.seatDiameter,part.seatDepth,part.clipBendPosition,part.clipToe,part.id,bodyRadius]);
  const material=useMemo(()=>createSurfaceMaterial(part),[part.material,part.color,part.finish,part.length,part.diameter,part.shape,part.pattern]);
  const mesh=useRef<THREE.Mesh>(null);
  const start=useRef(-100), lastKnock=useRef(knock);
  const shell=['barrel','grip','nose','button','clip'].includes(part.id);
  const transparent=settings.mode==='transparent' && shell;
  const clipPlanes=useMemo(()=>settings.mode==='section'&&shell?[new THREE.Plane(new THREE.Vector3(0,0,-1),0)]:[],[settings.mode,shell]);
  useEffect(()=>{
    material.wireframe=settings.mode==='wireframe';material.transparent=transparent;material.opacity=transparent?.16:1;
    material.depthWrite=!transparent;material.side=clipPlanes.length?THREE.DoubleSide:THREE.FrontSide;
    material.clippingPlanes=clipPlanes;material.emissive.set('#000000');material.emissiveIntensity=0;
    material.needsUpdate=true;
  },[material,settings.mode,transparent,clipPlanes]);
  useEffect(()=>()=>disposeSurfaceMaterial(material),[material]);
  useEffect(()=>()=>geometry.dispose(),[geometry]);
  useFrame(({clock})=>{
    if(lastKnock.current!==knock){lastKnock.current=knock;start.current=clock.elapsedTime;}
    const elapsed=clock.elapsedTime-start.current;
    const turn=elapsed<1.1?Math.sin(Math.min(1,elapsed/1.1)*Math.PI)*Math.PI*.7:0;
    if(mesh.current&&['button','finial'].includes(part.id))mesh.current.rotation.y=twist?turn:0;
    const press=twist?0:elapsed<.9?Math.sin(Math.min(1,elapsed/.9)*Math.PI):0;
    let motion=0;
    if(['button','finial','holder','eraser','reservoir'].includes(part.id))motion=-1.7*press;
    if(['clutch','spring'].includes(part.id))motion=-.65*press;
    if(part.id==='lead')motion=-.6*Math.max(0,Math.min(1,(elapsed-.3)/.4))*(elapsed<1?1:0);
    const explode=settings.mode==='exploded'?settings.explode:0;
    const multipliers:Record<string,number>={sleeve:-1.6,nose:-1,grip:-.25,barrel:.35,button:1.6,clip:0,reservoir:.6,clutch:-.5,spring:-.4,eraser:1.3,holder:1.1,lead:-1.8};
    if(mesh.current){mesh.current.position.y=part.y+motion+explode*(multipliers[part.id]??0);if(part.id==='clip')mesh.current.position.x=explode*.6;}
  });
  if(part.enabled===false || !part.visible || (settings.mode==='internal' && shell))return null;
  return <mesh ref={mesh} geometry={geometry} material={material} position={[0,part.y,0]} name={part.englishName} userData={{partId:part.id}} castShadow receiveShadow onClick={(e)=>{e.stopPropagation();onSelect(part.id==='finial'?'button':part.id);}} onPointerOver={(e)=>{e.stopPropagation();document.body.style.cursor='pointer';}} onPointerOut={()=>{document.body.style.cursor='auto';}}>

  </mesh>;
}

/** Native Three.js label: no second ReactDOM root or DOM portal lifecycle. */
function DimensionLabel({text,position}: {text:string;position:[number,number,number]}) {
  const {texture,aspect}=useMemo(()=>{
    const canvas=document.createElement('canvas');
    const measure=canvas.getContext('2d')!;
    const font='500 58px ui-monospace, SFMono-Regular, Menlo, monospace';
    measure.font=font;
    canvas.width=Math.ceil(measure.measureText(text).width)+60;
    canvas.height=110;
    const context=canvas.getContext('2d')!;
    context.fillStyle='rgba(247,247,244,.96)';
    context.strokeStyle='rgba(129,133,127,.5)';context.lineWidth=2;
    context.beginPath();context.roundRect(1,1,canvas.width-2,canvas.height-2,15);context.fill();context.stroke();
    context.font=font;context.fillStyle='#4c534b';context.textAlign='center';context.textBaseline='middle';
    context.fillText(text,canvas.width/2,canvas.height/2+1);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    texture.minFilter=THREE.LinearFilter;texture.magFilter=THREE.LinearFilter;
    return {texture,aspect:canvas.width/canvas.height};
  },[text]);
  useEffect(()=>()=>texture.dispose(),[texture]);
  return <sprite position={position} scale={[aspect*6,6,1]} renderOrder={1000}><spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} toneMapped={false}/></sprite>;
}

function Dimensions({project}: {project:Project}) {
  const y=project.length;const x=-15;
  return <group>
    <Line points={[[x,0,0],[x,y,0]]} color="#718071" lineWidth={.7}/>
    <Line points={[[x-2,0,0],[x+4,0,0]]} color="#718071" lineWidth={.7}/>
    <Line points={[[x-2,y,0],[x+4,y,0]]} color="#718071" lineWidth={.7}/>
    <Line points={[[0,0,0],[x-3,0,0]]} color="#4d574b" lineWidth={.6} dashed dashSize={1} gapSize={1}/>
    <Line points={[[0,y,0],[x-3,y,0]]} color="#4d574b" lineWidth={.6} dashed dashSize={1} gapSize={1}/>
    <DimensionLabel position={[x-2,y/2,0]} text={`${y.toFixed(1)} mm`}/>
    <Line points={[[5,y*.65,0],[18,y*.65,0],[24,y*.65+6,0],[40,y*.65+6,0]]} color="#718071" lineWidth={.7}/>
    <DimensionLabel position={[50,y*.65+6,0]} text={`Ø ${project.parts.find(p=>p.id==='barrel')?.diameter.toFixed(1)} mm`}/>
  </group>;
}

function CameraController({settings,project}:{settings:ViewSettings;project:Project}) {
 const {camera,invalidate,size}=useThree();
 const physical=resolvedParts(project).filter(p=>p.visible&&(settings.mode!=='internal'||!['barrel','grip','nose','button','clip'].includes(p.id)));
 const signature=physical.map(p=>[p.id,p.y,p.length,p.diameter,p.endDiameter,p.bulge,p.clipGap,p.clipCurve,p.angle].join(':')).join('|');
 useEffect(()=>{
  const mode=settings.camera,rotation=mode==='perspective'?-Math.PI*.155:0;
  const direction=mode==='front'?new THREE.Vector3(0,0,1):mode==='side'?new THREE.Vector3(1,0,0):mode==='top'?new THREE.Vector3(.001,1,0):new THREE.Vector3(.30,.077,1).normalize();
  const right=new THREE.Vector3().crossVectors(new THREE.Vector3(0,1,0),direction).normalize();
  const up=new THREE.Vector3().crossVectors(direction,right).normalize();
  const tan=Math.tan(THREE.MathUtils.degToRad(24)/2),aspect=size.width/Math.max(1,size.height);
  const spread:Record<string,number>={sleeve:-1.6,nose:-1,grip:-.25,barrel:.35,button:1.6,clip:0,reservoir:.6,clutch:-.5,spring:-.4,eraser:1.3,holder:1.1,lead:-1.8};
  let distance=20;
  for(const p of physical){
   const r=p.id==='clip'?clipMountRadius(project,p)+p.clipGap+p.clipCurve+1:Math.max(p.diameter,p.endDiameter??p.diameter)/2+(p.bulge??0);
   const offset=settings.mode==='exploded'?settings.explode*(spread[p.id]||0):0;
   for(const x of [-r,r])for(const y of [p.y-p.length/2+offset-project.length/2,p.y+p.length/2+offset-project.length/2])for(const z of [-r,r]){
    const point=new THREE.Vector3(x,y,z).applyAxisAngle(new THREE.Vector3(0,0,1),rotation);
    distance=Math.max(distance,Math.abs(point.dot(up))/tan+point.dot(direction),Math.abs(point.dot(right))/(tan*aspect)+point.dot(direction));
   }
  }
  if(settings.dimensions)for(const point of [new THREE.Vector3(-20,0,0),new THREE.Vector3(58,project.length*.15+6,0)].map(p=>p.applyAxisAngle(new THREE.Vector3(0,0,1),rotation)))distance=Math.max(distance,Math.abs(point.dot(up))/tan+point.dot(direction),Math.abs(point.dot(right))/(tan*aspect)+point.dot(direction));
  camera.position.copy(direction.multiplyScalar(distance*1.035));camera.up.set(0,1,0);camera.lookAt(0,0,0);camera.updateProjectionMatrix();invalidate();
 },[camera,settings.camera,settings.mode,settings.explode,settings.dimensions,settings.resetKey,project.length,signature,size.width,size.height,invalidate]);
 return null;
}

function Scene({project,selected,settings,onSelect,knock}:Props) {
  const rotation=settings.camera==='perspective'?-Math.PI*.155:0;
  return <>
    <CameraController settings={settings} project={project}/>
    <color attach="background" args={[settings.background]}/>
    <ambientLight intensity={.32} color="#ffffff"/>
    <directionalLight position={[-120,160,160]} intensity={2.0} color="#ffffff"/>
    <directionalLight position={[100,20,-100]} intensity={.55} color="#eef0f3"/>
    <Suspense fallback={null}>
      <Environment resolution={256} frames={1} environmentIntensity={.85}>
        <color attach="background" args={['#96989a']}/>
        {/* Long stripboxes create continuous soft highlights on turned metal. */}
        <Lightformer form="rect" intensity={4.0} color="#ffffff" scale={[3,24,1]} position={[-10,3,7]} rotation={[0,Math.PI/2.7,0]}/>
        <Lightformer form="rect" intensity={2.5} color="#ffffff" scale={[5,20,1]} position={[10,4,4]} rotation={[0,-Math.PI/2.5,0]}/>
        <Lightformer form="rect" intensity={2.0} color="#ffffff" scale={[12,8,1]} position={[0,12,2]} rotation={[Math.PI/2,0,0]}/>
        <Lightformer form="rect" intensity={.8} color="#d5d7d8" scale={[20,20,1]} position={[0,0,-12]}/>
        <Lightformer form="rect" intensity={.6} color="#f4f3ee" scale={[18,18,1]} position={[0,-10,0]} rotation={[-Math.PI/2,0,0]}/>
      </Environment>
    </Suspense>
    <group rotation={[0,0,rotation]}>
      <group position={[0,-project.length/2,0]}>
        {resolvedParts(project).map(part=><PartMesh key={part.id} part={part} selected={selected} settings={settings} onSelect={onSelect} knock={knock} twist={project.actuation==='twist'} bodyRadius={clipMountRadius(project,part)}/>)}
        {settings.dimensions&&<Dimensions project={project}/>}
      </group>
    </group>
    {settings.grid&&<Grid position={[0,-project.length*.65,0]} args={[400,400]} cellSize={10} sectionSize={50} cellColor="#333a34" sectionColor="#454f42" cellThickness={.5} sectionThickness={.6} fadeDistance={450} fadeStrength={1.5} infiniteGrid/>}
    <OrbitControls makeDefault enableDamping dampingFactor={.08} minDistance={50} maxDistance={1100} autoRotate={settings.autoRotate} autoRotateSpeed={1.15} target={[0,0,0]} enablePan/>
  </>;
}

export default function Viewport(props:Props) {
  return <WebGLErrorBoundary><Canvas camera={{position:[101,26,338],fov:24,near:.01,far:2500}} dpr={[1,2]} gl={{antialias:true,alpha:false,preserveDrawingBuffer:true,powerPreference:'high-performance'}} onCreated={({gl})=>{gl.localClippingEnabled=true;gl.toneMapping=THREE.ACESFilmicToneMapping;gl.toneMappingExposure=.92;props.onReady?.(gl.domElement);}} style={{width:'100%',height:'100%',background:'transparent'}}><Scene {...props}/></Canvas></WebGLErrorBoundary>;
}
