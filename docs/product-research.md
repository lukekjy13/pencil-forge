# PENCIL FORGE 실물 샤프 설계 참고 조사

확인일: **2026-11-07, 한국 시간**. 제조사·브랜드 공식 페이지를 우선 사용했다. 출시 당시 공표가, 현재 페이지 표시가, 소매 판매가, 경매 실현가와 골동품 판매자의 호가는 구분했다. 아래 가격은 국내 최종 구매가나 제조 원가가 아니다. 외화는 **원화로 환산하지 않았다**. 환율·세금·배송·수입 비용을 확인하지 않은 원화 금액을 만들지 않기 위해서다.

## 제품별 확인 내용

| 구분 | 실제 제품 | 확인 가격·통화 및 가격 기준 | 확인한 설계 특징과 앱에 적용할 관찰 | 출처 |
| --- | --- | --- | --- | --- |
| 한국 초저가 | 다이소 다마고치 샤프, 품번 764634410 / 411 / 412 | **KRW 1,000** · 공식 홍보 2025-11-03 공표가, 현재 재고·판매가는 별도 확인 필요 | 색상과 장식으로 제품 성격을 바꾸는 접근. 공개 페이지에 상세 내부 치수는 없어 임의로 추정하지 않음 | [다이소 공식](https://www.daiso.co.kr/brand/product/promotion/95544?page=14) |
| 한국 대중형 | 모나미 CLICKY 0.5 | **KRW 2,000** · 2021-08-17 제조사 출시 공표가 | 사이드 노크, 둥근 곡선 마감, 캔디 색상. 외형 참고는 가능하나 기존 상단 노크 메커니즘과 동일 작동이라고 표시하면 안 됨 | [모나미 출시 자료](https://www.monami.com/board/board.php?bo_table=bodo&idx=95), [제품](https://www.monami.com/product/product_view.php?ccode=003005&idx=183) |
| 기본 제도용 | Pentel Sharp P205A 0.5 | **USD 6.26**, 정상 표시 **USD 7.37** · 미국 제조사 웹숍 조회 표시가, 세금·배송 별도 | 4 mm 가이드 슬리브. 슬리브 길이 조절, 가는 촉과 몸통의 구별을 참고 | [Pentel 미국 공식](https://www.pentel.com/products/sharp-mechanical-drafting-pencil?variant=9085189029935) |
| 전문 제도용 | Pentel GRAPH 1000 for Pro | **JPY 1,320 세금 포함** · 현재 제조사 표시 소매가, 세전 1,200엔 | 단차가 있는 촉, 금속·고무 복합 그립, 심 경도 표시창, 낮은 무게중심. 종전 1,000엔을 현행 가격으로 쓰면 안 됨 | [Pentel 일본 공식](https://www.pentel.co.jp/products/sharppencils/graph1000/) |
| 금속 제도용 | rOtring 600 | 공식 제품 페이지에 가격 미표시. 참고 소매가 **USD 35** · Yoseka 조회 표시가; 해당 소매점의 공식 대리점 지위는 이번 조사에서 확인하지 않음 | 육각 몸통, 널링 그립, 고정 가이드, 심 경도 링, 캡 아래 지우개. 외형 기능은 제조사 자료로 확인 | [rOtring 공식](https://www.rotring.com/pens-pencils/mechanical-pencils/rotring-600-mechanical-pencil/SAP_1904444.html), [소매 가격](https://yosekastationery.com/products/full-metal-black-mechanical-pencil-600-0-5mm) |
| 목재 필기형 | PILOT S20 0.5, HPS-2SK-B5 | **JPY 2,530 세금 포함** · 현재 제조사 웹카탈로그 희망 소매가 | 수지 함침 자작나무, 부드러운 곡선, 낮은 무게중심. 공식 치수 최대경 10.6 mm, 길이 145.6 mm, 질량 18 g. 배럴 중앙의 완만한 볼륨·테이퍼 그립 참고 | [PILOT 공식 웹카탈로그](https://webcatalog.pilot.co.jp/products/DispDetail.do?itemID=t000100001947&volumeName=00004) |
| 기능 프리미엄 | uni KURUTOGA DIVE 0.5 | **JPY 5,500 세금 포함** · 2023-02-15 제조사 발표 당시 참고가격; 현행 판매가는 별도 확인 필요 | 캡 방식, 자동 심 공급량 5단계 조절, 심 회전. 캡과 몸통 실루엣은 참고하되 작동 검증 없는 범용 노크 애니메이션으로 이 기구를 재현했다고 하면 안 됨 | [미쓰비시연필 명의 공식 배포 보도자료 PDF](https://digitalpr.jp/pdf.php?r=67927) |
| 디자인 프리미엄 | LAMY 2000 Mechanical Pencil | **USD 69** · 미국 브랜드 공식 웹숍 조회 표시가, 세금·배송 제외 | 매끈한 재질 접합, 곡선 몸통, 외부 스프링식 스테인리스 클립. 클립의 자연스러운 휨과 단순한 외형 구성 참고 | [LAMY 미국 공식](https://www.lamy.com/en-us/p/lamy-2000-mechanical-pencil) |
| 고급 목재·금속 | Graf von Faber-Castell Pernambuco Wood and Silver Twist Mechanical Pencil | **USD 400** · Sotheby's Buy Now 판매 표시가, 세금·관세 제외; 제조사 정가·경매 낙찰가가 아님 | 목재 몸통과 은색 피팅의 대비. 회전식 제품이므로 기존 노크 메커니즘과 구분. 표면 변색·얼룩이 있고 내부 미검사·향후 작동 비보증인 개별 판매품임 | [Sotheby's 가격 목록](https://www.sothebys.com/en/buy/pens), [실제 상품·상태](https://www.sothebys.com/en/buy/pdp/luxury/collectibles/pen/other/_graf-von-faber-castell-pernambuco-wood-and-silver-twist-mechani-70e1) |
| 귀금속 현행 제품 | Graf von Faber-Castell Classic sterling silver #138533 | **USD 786** · 미국 브랜드 공식 웹숍 조회 표시가, **품절 표시** | 스털링 실버, 0.7 mm B심, 예비 심 저장소와 엔드 캡 아래 교환 지우개. 닫힌 상단 캡·지우개 홀더·세로 장식 홈을 독립 설계 요소로 참고 | [브랜드 공식 웹숍](https://shop.graf-von-faber-castell.us/products/propelling-pencil-classic-sterlingsilver-138533) |
| 역사적 귀금속 | Cartier gold mechanical pencil, 약 1951년 | **USD 1,875 실현가** · Christie's 2017-06-21 종료 경매. 현재 신품 소매가가 아님 | 14K 옐로 골드, 길이 12.9 cm, 총질량 26 g의 수집품. 귀금속 소재와 각인·상단 장식을 검토할 근거이며 전 부품이 순금이라는 뜻은 아님 | [Christie's 경매 기록](https://onlineonly.christies.com/s/jewels-online/cartier-gold-mechanical-pencil-131/41481?sc_lang=fr) |
| 보석 장식 골동품 | Antique Gold Mechanical Pencil and Seal with Ruby, Diamond, Enameled Deer Head | **USD 7,500 호가** · DSF Antique Jewelry 판매자 직접 상품 페이지. 제조사 정가·독립 감정가·실제 성사 가격이 아님 | 금·루비·다이아몬드·에나멜 및 인장 장식의 기계식 연필로 판매자가 명시. 장식 마감과 보석 엔드 장식은 참고할 수 있으나 현대 0.5 mm 노크식과 호환된다고 볼 근거는 없음 | [판매자 원문](https://dsfantiquejewelry.com/products/antique-gold-mechanical-pencil-and-seal-with-ruby-diamond-enameled-deer-head) |

## 1,000만원 상단에 관한 정확한 결론

**국내에서 현재 1,000만원에 판매되는 현대식 샤프를 제조사 자료로 확인했다고 주장할 수는 없다.** 대신 직접 확인 가능한 고가 사례는 위 USD 7,500 골동품 호가와 별도의 [USD 9,500 금·다이아몬드 망원식 기계 연필 호가](https://dsfantiquejewelry.com/products/antique-diamond-gold-mechanical-telescopic-pencil)다. 이들은 현대 양산 샤프의 가격대와 구분해야 한다.

외화 호가가 실제 원화 1,000만원에 가까운지 판단하려면 구매일 환율과 부대비용을 추가 확인해야 한다. 수학적으로 USD 7,500 × 1,333.33원/USD ≈ 1,000만원이나, **이는 경계값 계산일 뿐 관측 환율이나 현재 원화 판매가가 아니다**. 따라서 앱에서 고가 장식 콘셉트는 제공할 수 있어도 해당 콘셉트의 실제 시장가격을 1,000만원으로 인증하면 안 된다.

자주 인용되는 Graf von Faber-Castell 다이아몬드 **Perfect Pencil은 목재 연필 계열이며 기계식 샤프 사례로 넣으면 안 된다**. 제조사 스스로 삼나무 몸통·깎기·캡 내장 연필깎이를 설명한다. 한정판의 유명 가격을 샤프 가격으로 전용하지 않는다. [제조사 Perfect Pencil 설명](https://www.graf-von-faber-castell.us/perfect-pencil), [기록 기관의 2001년 한정판 설명](https://www.guinnessworldrecords.com.br/world-records/111825-most-expensive-pencil).

## 설계기에 반영할 세부 요소

아래는 실물 자료를 바탕으로 한 **제품 설계 제안**이다. 특정 제품을 정밀 복제했거나 내부 작동을 인증했다는 뜻은 아니다.

| 설계 요소 | 참고 근거 | 실제 구현 시 지켜야 할 연결 |
| --- | --- | --- |
| 닫힌 상단 버튼·둥근 돔 캡 | rOtring·Graf의 캡 아래 지우개 구성 | 상단이 열린 파이프로 남지 않도록 캡 끝을 솔리드로 닫고, 내부 지우개 공간·버튼 이동 공간을 유지. 돔 높이와 벽 두께를 별도 수치화 |
| 종형·중앙 볼륨 몸통 | S20의 공식 곡선 몸통 설명 | 축 방향 반경 프로파일로 실제 형상·내부 구멍·질량·내보내기를 함께 변경. 중앙을 부풀려도 끝단 결합경은 유지 |
| 엔드 비드·보석 장식 | 고가 골동품의 귀금속·보석·인장 구성 | 장식은 별도 ID·소재·체적·질량으로 저장. 다이아몬드 시각 표현과 실제 세팅 구조·가격은 구분 |
| 휘어진 클립과 스푼형 끝 | LAMY의 스프링 클립, 일반 클립 기능에서 발전한 설계 제안 | 고정점이 몸통에 실제 접촉하고 끝단은 매끈하게 닫혀야 함. 휨 시각화가 탄성·피로 해석은 아님 |
| 테이퍼 그립·촉의 단차 | S20, GRAPH 1000 | 그립 위·아래 외경과 길이를 독립 제어하되 내부 메커니즘 간극·연결 위치를 재검사 |
| 슬리브 길이 | P205의 공식 4 mm 팁 | 4 mm를 하나의 프리셋으로 제공하고 실제 부품 길이·위치·내보내기를 연동 |
| 심 경도 표시 | GRAPH 1000, rOtring 600 공식 설명 | HB/B/2B 등의 링·표시창을 실제 프로젝트 필드로 저장. 심 지름과 심 경도를 혼동하지 않도록 분리 |

일반 제품의 공통 부품을 개선한 독자적인 설계를 우선한다. 상표·로고·고유한 장식을 무단 복제하지 않으며, 귀금속·보석 가격은 공급사 견적이 없으면 사용자가 편집하는 가정값으로 유지한다.
