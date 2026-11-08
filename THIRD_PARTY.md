# PENCIL FORGE — third-party software

The exact installed versions are fixed in `package-lock.json`. The UI and display mesh are generated locally; no stock product model or external HDR image is bundled.

| Component | Purpose | Upstream licence / source |
| --- | --- | --- |
| React / React DOM | Browser interface | MIT — https://github.com/facebook/react |
| Three.js | Mesh geometry, rendering, GLB/STL/OBJ exporters | MIT — https://github.com/mrdoob/three.js/blob/dev/LICENSE |
| React Three Fiber / Drei | React scene controls and studio lights | MIT — https://github.com/pmndrs/react-three-fiber and https://github.com/pmndrs/drei |
| Zustand | Project state and undo history | MIT — https://github.com/pmndrs/zustand |
| Zod | Import and parameter schema validation | MIT — https://github.com/colinhacks/zod |
| Lucide | UI icons | ISC — https://github.com/lucide-icons/lucide/blob/main/LICENSE |
| Replicad | Parametric B-rep construction and STEP exchange | MIT — https://github.com/sgenoud/replicad/blob/main/LICENSE |
| Replicad OpenCascade.js build | CAD WebAssembly runtime | OpenCascade Technology LGPL 2.1 with the additional OCCT exception; wrapper and other bundled components retain their upstream terms. See the installed package and https://github.com/sgenoud/replicad/tree/main/packages/replicad-opencascadejs and https://github.com/Open-Cascade-SAS/OCCT |
| Vite / TypeScript / tsx | Build and validation tooling | MIT / Apache-2.0 / MIT, respectively; see installed packages |

Replicad's OpenCascade WebAssembly is kept as a separate browser asset and is loaded by a dedicated worker on STEP export. It is unmodified. The CAD kernel is not represented as MIT-only software. Source, build instructions and applicable licences remain available from the linked upstream repositories. Preserve these notices and upstream licence files when redistributing the project.

## File-format behaviour

- STL and OBJ use millimetre numeric coordinates; STL itself has no unit field.
- GLB follows glTF 2.0 metre units through a root scale of 0.001.
- STEP is generated with the OpenCascade B-rep kernel with explicit millimetre units. Each generated STEP file is re-imported by the same kernel and its total solid volume compared before download.
- Circular and polygonal smooth profiles, circular bores, circular tapered profiles, circular ring patterns, the parametric clip outline and helical spring are generated as B-rep geometry. Ring profiles use the same sampled axial profile as the mesh.
- Diamond knurling, longitudinal grooves, rings on non-circular sections and non-circular tapered sections currently have no matching STEP implementation. The exporter returns an explanatory error rather than removing these features. Mesh exports retain their actual surface geometry.
- These are concept design files. They do not add verified threads, a working clutch mechanism, certified tolerances, or supplier manufacturing approval.

## Wood appearance maps

The guided editor bundles ambientCG Wood051 color, roughness and OpenGL normal maps at 1K under CC0 1.0. Official asset: https://ambientcg.com/a/Wood051 . Licence: https://docs.ambientcg.com/license/ . These are representative procedural PBR appearance maps, not a scan or certification of walnut species. Details and delivery encodings are recorded in public/textures/wood/SOURCE.md.
