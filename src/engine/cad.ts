import type { PartId, Project } from '../types';

export type ExportScope = 'all' | 'exterior' | PartId;
export interface CadResult { blob: Blob; volume: number; importedVolume: number; partCount: number }

/** CAD is loaded only on demand, off the UI thread. Each job owns and disposes its kernel. */
export function exportStep(project: Project, scope: ExportScope = 'all'): Promise<Blob> {
  return createStep(project, scope).then(result => result.blob);
}

export function createStep(project: Project, scope: ExportScope = 'all'): Promise<CadResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./cad.worker.ts', import.meta.url), { type: 'module' });
    const timer = window.setTimeout(() => {
      worker.terminate();
      reject(new Error('CAD 생성 시간이 90초를 초과했습니다. 부품 하나를 선택하여 다시 시도하세요.'));
    }, 90_000);
    const finish = () => { clearTimeout(timer); worker.terminate(); };
    worker.onmessage = (event: MessageEvent<CadResult & { error?: string }>) => {
      finish();
      if (event.data.error) reject(new Error(event.data.error));
      else resolve(event.data);
    };
    worker.onerror = (event) => {
      finish();
      reject(new Error(`CAD 커널을 불러오지 못했습니다. ${event.message || '네트워크 연결을 확인하세요.'}`));
    };
    worker.postMessage({ project, scope });
  });
}
