import opencascade from 'replicad-opencascadejs';
import opencascadeWasm from 'replicad-opencascadejs/wasm?url';
import { setOC } from 'replicad';
import { buildStep } from './cad-kernel';
import type { CadScope } from './cad-kernel';
import type { Project } from '../types';

self.onmessage = async (event: MessageEvent<{ project: Project; scope: CadScope }>) => {
  try {
    const kernel = await opencascade({ locateFile: () => opencascadeWasm, print: () => {}, printErr: () => {} });
    setOC(kernel);
    const result = await buildStep(event.data.project, event.data.scope);
    self.postMessage(result);
  } catch (error) {
    self.postMessage({ error: error instanceof Error ? error.message : 'CAD 형상을 생성하지 못했습니다. 치수와 내부 구멍을 확인하세요.' });
  }
};
