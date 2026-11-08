import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { OBJExporter } from 'three/addons/exporters/OBJExporter.js';
import { STLExporter } from 'three/addons/exporters/STLExporter.js';
import { Mesh, MeshPhysicalMaterial } from 'three';
import { createAssembly } from './geometry';
import { exportStep } from './cad';
import { awaitSurfaceTextures, createSurfaceMaterial, disposeSurfaceMaterial, withSurfaceUVs } from './surface';
import type { ExportScope } from './cad';
import type { Project } from '../types';

export function downloadBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export async function modelBlob(project: Project, format: 'stl' | 'glb' | 'obj' | 'step', scope: ExportScope = 'all'): Promise<Blob> {
  if (format === 'step') return exportStep(project, scope);
  const selected = scope === 'all' || scope === 'exterior' ? project : { ...project, parts: project.parts.filter(part => part.id === scope) };
  const assembly = createAssembly(selected, { visibleOnly: false, includeInternal: scope !== 'exterior' });
  if(!assembly.children.length)throw new Error('제거된 부품은 내보낼 수 없습니다.');
  assembly.name = project.name;
  assembly.userData = { schemaVersion: project.schemaVersion, model: project.model, designUnits: 'mm', mechanicalValidation: 'Concept model; manufacturing verification required' };
  try {
    assembly.updateMatrixWorld(true);
    if (format === 'stl') {
      // STL stores unitless numeric coordinates. PENCIL FORGE writes millimetres.
      const data = new STLExporter().parse(assembly, { binary: true });
      return new Blob([data.buffer as ArrayBuffer], { type: 'model/stl' });
    }
    if (format === 'obj') {
      return new Blob(['# PENCIL FORGE — units: millimetres\n', new OBJExporter().parse(assembly)], { type: 'text/plain' });
    }
    // Browser canvas support is needed to encode procedural PBR maps into GLB
    // images. Headless Node callers retain texture-free scalar materials.
    if (typeof document !== 'undefined') {
      const textureLoads: Promise<void>[] = [];
      assembly.traverse(object => {
        if (!(object instanceof Mesh)) return;
        const part = selected.parts.find(item => item.id === object.userData.partId);
        if (!part) return;
        const source = object.geometry;
        object.geometry = withSurfaceUVs(source, part);
        source.dispose();
        const previous = Array.isArray(object.material) ? object.material : [object.material];
        object.material = createSurfaceMaterial(part);
        textureLoads.push(awaitSurfaceTextures(object.material));
        for (const material of previous) material.dispose();
      });
      await Promise.all(textureLoads);
    }
    // glTF 2.0 specifies metres, so the root transform converts our mm geometry.
    assembly.traverse(object=>{if(object instanceof Mesh&&object.material instanceof MeshPhysicalMaterial){object.material.thickness*=.001;if(Number.isFinite(object.material.attenuationDistance))object.material.attenuationDistance*=.001;}});
    assembly.scale.setScalar(0.001);
    assembly.updateMatrixWorld(true);
    const binary = await new GLTFExporter().parseAsync(assembly, { binary: true, onlyVisible: false, includeCustomExtensions: true });
    if (!(binary instanceof ArrayBuffer)) throw new Error('GLB 이진 파일 생성에 실패했습니다.');
    return new Blob([binary], { type: 'model/gltf-binary' });
  } finally {
    assembly.traverse(object => {
      if (object instanceof Mesh) {
        object.geometry.dispose();
        for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
          if (material instanceof MeshPhysicalMaterial) disposeSurfaceMaterial(material);
          else material.dispose();
        }
      }
    });
  }
}

export async function exportModel(project: Project, format: 'stl' | 'glb' | 'obj' | 'step', scope: ExportScope = 'all'): Promise<void> {
  const blob = await modelBlob(project, format, scope);
  const name = (project.name || 'pencil-forge').replace(/[^\p{L}\p{N}_-]+/gu, '-');
  downloadBlob(blob, `${name}${scope === 'all' ? '' : `-${scope}`}.${format}`);
}
