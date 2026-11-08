# PENCIL FORGE

웹에서 샤프를 3D로 설계하고, 브랜드·라인업을 만들어 가상 시장에서 판매하는 스튜디오입니다.

[사이트 열기](https://pencil-forge-studio-kjy.lukekjy13.chatgpt.site)

## 주요 기능

- 단계별·정밀 3D 편집, 43종 소재, 부품별 형상·마감·색상 조절
- 실제 형상 기반 질량·무게중심·제조원가 계산
- GLB·STL·OBJ·STEP·JSON·CSV·PNG 내보내기
- 브랜드 로고 SVG, 라인업·제품 관리, 생산·재고·판매·손익 시뮬레이션
- 운영 기간 제한 없음, 난수 시드 재현, 자동 저장·JSON 백업

처음에는 설계 스튜디오가 열립니다. 우측 상단 `⋯ → 기업 운영`에서 경영 화면으로 이동합니다.

## 실행

Node.js 22.12 이상이 필요합니다.

```sh
npm ci
npm run dev
```

검증: `npm test` · 빌드: `npm run build`

React · TypeScript · Vite · Three.js/R3F · Zustand · Zod · Replicad/OpenCascade를 사용합니다.

## 문서

- [판매 시뮬레이션 수식·가정](docs/business-model.md)
- [실물 제품 조사](docs/product-research.md)
- [외부 라이선스](THIRD_PARTY.md)

제조 승인용 CAD가 아닌 개념 설계기입니다. 소재 단가와 수요는 편집 가능한 가정이며 실제 견적·판매 예측이 아닙니다. STEP은 널링·세로 홈 등 일부 패턴을 지원하지 않습니다. 데이터는 사용자의 브라우저에 저장됩니다.
