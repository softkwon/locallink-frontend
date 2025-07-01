const industryEsgIssues = [
    // (이전 답변에서 제공한 Python 스크립트 실행 결과를 여기에 붙여넣어주세요)
    {
        "industryCode": "A01",
        "industryName": "농업",
        "sasbIndustry": "Agricultural Products",
        "esgCategory": "E",
        "esgIssue": "토양관리, 수자원 사용, 기후변화 대응",
        "riskOpportunity": "가뭄으로 인한 작황 감소 / 스마트 농업 기술 도입 기회",
        "kEsgIndicator": "E1-1, E2-1, S1-1"
    },
    {
        "industryCode": "A02",
        "industryName": "임업",
        "sasbIndustry": "Forestry Management",
        "esgCategory": "OTHER",
        "esgIssue": "산림보호, 생물다양성, 탄소흡수",
        "riskOpportunity": "벌목 규제 리스크 / 탄소배출권 확보 기회",
        "kEsgIndicator": "E1-2, S2-2, G3-1"
    },
    {
        "industryCode": "A03",
        "industryName": "어업",
        "sasbIndustry": "Fishing & Aquaculture",
        "esgCategory": "E",
        "esgIssue": "남획, 해양생태계 보호, 수질오염",
        "riskOpportunity": "수산자원 고갈 / 친환경 양식 기술 투자 기회",
        "kEsgIndicator": "E1-1, S1-2, G2-1"
    },
    {
        "industryCode": "B05",
        "industryName": "석탄,원유 및 천연가스 광업",
        "sasbIndustry": "Coal Operations",
        "esgCategory": "E",
        "esgIssue": "광산안전, 탄소배출, 폐기물관리",
        "riskOpportunity": "탄광 사고 / 탈석탄 전환기 전략 수립",
        "kEsgIndicator": "E1-1, S1-3, G2-1"
    },
    {
        "industryCode": "B06",
        "industryName": "금속광업",
        "sasbIndustry": "Metals & Mining",
        "esgCategory": "E",
        "esgIssue": "토양오염, 물 사용, 지역사회 영향",
        "riskOpportunity": "지역 반발 / 친환경 채굴 기술 도입",
        "kEsgIndicator": "E2-1, S2-2, G1-1"
    },
    {
        "industryCode": "B07",
        "industryName": "비금속광물 광업: 연료용 제외",
        "sasbIndustry": "Oil & Gas - Exploration & Production",
        "esgCategory": "OTHER",
        "esgIssue": "탄소배출, 유출사고, 생태계 영향",
        "riskOpportunity": "해양 유출 사고 / 재생에너지로 사업 전환 기회",
        "kEsgIndicator": "E1-2, S1-2, G3-1"
    },
    {
        "industryCode": "B08",
        "industryName": "광업 지원 서비스업",
        "sasbIndustry": "Metals & Mining",
        "esgCategory": "E",
        "esgIssue": "토양오염, 물 사용, 지역사회 영향",
        "riskOpportunity": "지역 반발 / 친환경 채굴 기술 도입",
        "kEsgIndicator": "E2-1, S2-2, G1-1"
    },
    {
        "industryCode": "C10",
        "industryName": "식료품 제조업",
        "sasbIndustry": "Processed Foods",
        "esgCategory": "E",
        "esgIssue": "식품안전, 포장폐기물, 공급망 인권",
        "riskOpportunity": "식품 리콜 / 친환경 포장 시장 확대",
        "kEsgIndicator": "E1-2, S2-2, G1-1"
    },
    {
        "industryCode": "C11",
        "industryName": "음료 제조업",
        "sasbIndustry": "Non-Alcoholic Beverages",
        "esgCategory": "OTHER",
        "esgIssue": "물 사용량, 플라스틱 사용, 건강 이슈",
        "riskOpportunity": "당류 규제 리스크 / 무설탕 제품 수요 증가",
        "kEsgIndicator": "E2-1, S1-2, G2-1"
    },
    {
        "industryCode": "C12",
        "industryName": "주류 제조업",
        "sasbIndustry": "Alcoholic Beverages",
        "esgCategory": "S",
        "esgIssue": "건강영향, 사회적 책임, 원재료 추적성",
        "riskOpportunity": "음주운전 사고 연계 리스크 / 책임 브랜드 구축",
        "kEsgIndicator": "S1-2, S2-1, G2-2"
    },
    {
        "industryCode": "C13",
        "industryName": "섬유제품 제조업",
        "sasbIndustry": "Apparel, Accessories & Footwear",
        "esgCategory": "E",
        "esgIssue": "공급망 노동, 화학물질 사용, 폐기물",
        "riskOpportunity": "아동노동 리스크 / 친환경 소재 수요 증가",
        "kEsgIndicator": "S2-2, E2-2, G1-1"
    },
    {
        "industryCode": "C14",
        "industryName": "의복 제조업",
        "sasbIndustry": "Textiles",
        "esgCategory": "E",
        "esgIssue": "수질오염, 염색공정 에너지, 공급망 책임",
        "riskOpportunity": "염색폐수 규제 / 저수세 염색기술 확산",
        "kEsgIndicator": "E1-1, E2-1, G3-1"
    },
    {
        "industryCode": "C15",
        "industryName": "피혁 제조업",
        "sasbIndustry": "Leather Goods",
        "esgCategory": "S",
        "esgIssue": "동물복지, 화학물질, 인권",
        "riskOpportunity": "피혁공정 인권 논란 / 대체가죽 시장 확대",
        "kEsgIndicator": "S1-3, E2-1, G1-2"
    },
    {
        "industryCode": "C16",
        "industryName": "목재 제품 제조업",
        "sasbIndustry": "Wood Products",
        "esgCategory": "S",
        "esgIssue": "벌목 영향, 탄소 저장, 공급망 인증",
        "riskOpportunity": "불법 벌목 리스크 / FSC 인증 수요 증가",
        "kEsgIndicator": "E1-1, S2-2, G2-1"
    },
    {
        "industryCode": "C17",
        "industryName": "펄프, 종이 제조업",
        "sasbIndustry": "Paper & Forest Products",
        "esgCategory": "E",
        "esgIssue": "산림관리, 에너지 사용, 수질오염",
        "riskOpportunity": "종이소비 감소 / 재생용지 시장 확대",
        "kEsgIndicator": "E1-2, E2-2, S1-1"
    },
    {
        "industryCode": "C18",
        "industryName": "인쇄 및 기록매체 복제업",
        "sasbIndustry": "Printing",
        "esgCategory": "E",
        "esgIssue": "화학물질 사용, 에너지 사용, 폐기물",
        "riskOpportunity": "VOC 배출 규제 / 디지털 인쇄 수요 증가",
        "kEsgIndicator": "E1-1, E2-1, G3-1"
    },
    {
        "industryCode": "C19",
        "industryName": "코크스, 연탄 및 석유정제품 제조업",
        "sasbIndustry": "Petrochemicals",
        "esgCategory": "E",
        "esgIssue": "온실가스, 수질오염, 폭발위험",
        "riskOpportunity": "화학사고 리스크 / CCUS 기술 시장 진입",
        "kEsgIndicator": "E1-1, G3-2, S1-3"
    },
    {
        "industryCode": "C20",
        "industryName": "화학물질 제조업",
        "sasbIndustry": "Chemicals",
        "esgCategory": "S",
        "esgIssue": "유해물질, GHG, 공급망 안전",
        "riskOpportunity": "화학물질규제 / 친환경 화학제품 수요",
        "kEsgIndicator": "E1-1, S1-3, G1-1"
    },
    {
        "industryCode": "C21",
        "industryName": "의약품 제조업",
        "sasbIndustry": "Biotechnology & Pharmaceuticals",
        "esgCategory": "G",
        "esgIssue": "임상시험 윤리, 제품접근성, R&D 지속성",
        "riskOpportunity": "신약 리스크 / 바이오헬스 글로벌 확장",
        "kEsgIndicator": "S2-1, G1-2, G3-1"
    },
    {
        "industryCode": "C22",
        "industryName": "고무 및 플라스틱 제품 제조업",
        "sasbIndustry": "Plastic & Packaging",
        "esgCategory": "E",
        "esgIssue": "폐기물관리, 유해화학물질, 재활용률",
        "riskOpportunity": "플라스틱 규제 / 바이오플라스틱 시장 확대",
        "kEsgIndicator": "E2-1, G3-1, S1-2"
    },
    {
        "industryCode": "C23",
        "industryName": "비금속 광물제품 제조업",
        "sasbIndustry": "Construction Materials",
        "esgCategory": "E",
        "esgIssue": "온실가스 배출, 자원소모, 지역사회 영향",
        "riskOpportunity": "시멘트 탄소규제 / 친환경 건축자재 수요",
        "kEsgIndicator": "E1-1, G2-2, S1-3"
    },
    {
        "industryCode": "C24",
        "industryName": "1차 금속 제조업",
        "sasbIndustry": "Industrial Machinery & Goods",
        "esgCategory": "E",
        "esgIssue": "에너지효율, 제품안전, 공급망 기준",
        "riskOpportunity": "산업사고 리스크 / 스마트기계 수요 증가",
        "kEsgIndicator": "E1-2, G2-1, S2-2"
    },
    {
        "industryCode": "C25",
        "industryName": "금속가공제품 제조업",
        "sasbIndustry": "Industrial Machinery & Goods",
        "esgCategory": "E",
        "esgIssue": "에너지효율, 제품안전, 공급망 기준",
        "riskOpportunity": "산업사고 리스크 / 스마트기계 수요 증가",
        "kEsgIndicator": "E1-2, G2-1, S2-2"
    },
    {
        "industryCode": "C26",
        "industryName": "전자부품 제조업",
        "sasbIndustry": "Electronic Equipment",
        "esgCategory": "E",
        "esgIssue": "에너지소비, 희귀금속, 전자폐기물",
        "riskOpportunity": "폐전자 제품 증가 / 순환전자소재 확장",
        "kEsgIndicator": "E1-2, E2-2, G3-1"
    },
    {
        "industryCode": "C27",
        "industryName": "컴퓨터 및 주변장치 제조업",
        "sasbIndustry": "Technology Hardware",
        "esgCategory": "S",
        "esgIssue": "탄소발자국, 제품수명주기, 공급망 윤리",
        "riskOpportunity": "배터리 문제 / 친환경 설계 경쟁력 확보",
        "kEsgIndicator": "E1-2, G1-1, S2-1"
    },
    {
        "industryCode": "C28",
        "industryName": "전기장비 제조업",
        "sasbIndustry": "Electrical Equipment",
        "esgCategory": "E",
        "esgIssue": "에너지효율, 안전성, 공급망 투명성",
        "riskOpportunity": "기기 고장 리스크 / 고효율 제품 마케팅",
        "kEsgIndicator": "E1-1, S2-2, G2-1"
    },
    {
        "industryCode": "C29",
        "industryName": "자동차 및 트레일러 제조업",
        "sasbIndustry": "Automobiles",
        "esgCategory": "S",
        "esgIssue": "배출가스, 제품안전, 전기차 전환",
        "riskOpportunity": "배출 규제 강화 / EV 시장 선도",
        "kEsgIndicator": "E1-1, S1-3, G3-2"
    },
    {
        "industryCode": "C30",
        "industryName": "기타 운송장비 제조업",
        "sasbIndustry": "Aerospace & Defense",
        "esgCategory": "S",
        "esgIssue": "무기 윤리, 공급망 안정성, 안전규제",
        "riskOpportunity": "수출 규제 리스크 / 무기 추적 기술 수요",
        "kEsgIndicator": "G2-2, S1-2, E2-1"
    },
    {
        "industryCode": "C31",
        "industryName": "가구 제조업",
        "sasbIndustry": "Furniture & Fixtures",
        "esgCategory": "S",
        "esgIssue": "산림자원, 화학물질, 제품안전",
        "riskOpportunity": "불법 벌목 비판 / 인증 가구 수요 증가",
        "kEsgIndicator": "E1-1, S1-1, G3-1"
    },
    {
        "industryCode": "C32",
        "industryName": "완구 및 스포츠용품 제조업",
        "sasbIndustry": "Toys & Sporting Goods",
        "esgCategory": "S",
        "esgIssue": "소재 안정성, 아동안전, 공급망 점검",
        "riskOpportunity": "제품 리콜 / 안전 인증 장난감 수요 증가",
        "kEsgIndicator": "S1-2, G2-2, E2-2"
    },
    {
        "industryCode": "C33",
        "industryName": "기타 제품 제조업",
        "sasbIndustry": "Miscellaneous Manufacturing",
        "esgCategory": "E",
        "esgIssue": "에너지관리, 생산폐기물, 근로자 안전",
        "riskOpportunity": "산업재해 / 에너지절감 기술 투자 유치",
        "kEsgIndicator": "E1-1, S2-1, G3-1"
    },
    {
        "industryCode": "C34",
        "industryName": "의료용 기기 제조업",
        "sasbIndustry": "Medical Equipment",
        "esgCategory": "S",
        "esgIssue": "제품품질, 환자안전, 데이터보안",
        "riskOpportunity": "기기 고장 / 스마트의료기기 시장 확대",
        "kEsgIndicator": "S2-1, G1-1, E1-2"
    },
    {
        "industryCode": "D35",
        "industryName": "전기, 가스, 증기 및 공기조절 공급업",
        "sasbIndustry": "Electric Utilities",
        "esgCategory": "E",
        "esgIssue": "탄소배출, 에너지믹스, 송배전 안정성",
        "riskOpportunity": "탄소세 증가 / 재생에너지 투자 수익 확대",
        "kEsgIndicator": "E1-1, G1-1, G3-2"
    },
    {
        "industryCode": "E36",
        "industryName": "수도업",
        "sasbIndustry": "Water Utilities",
        "esgCategory": "OTHER",
        "esgIssue": "수자원 보호, 공급 안정성, 수질 기준",
        "riskOpportunity": "가뭄 리스크 / 스마트 물관리 기술 확대",
        "kEsgIndicator": "E2-1, S1-1, G2-1"
    },
    {
        "industryCode": "E37",
        "industryName": "하수, 폐수 및 분뇨 처리업",
        "sasbIndustry": "Waste Management",
        "esgCategory": "E",
        "esgIssue": "폐기물 처리, 순환경제, 환경오염",
        "riskOpportunity": "폐기물 과징금 / 재활용 시장 성장",
        "kEsgIndicator": "E2-2, G1-2, S2-2"
    },
    {
        "industryCode": "E38",
        "industryName": "폐기물 처리업",
        "sasbIndustry": "Waste Management",
        "esgCategory": "E",
        "esgIssue": "유해폐기물 관리, 온실가스 감축, 토양오염",
        "riskOpportunity": "유해폐기물 규제 / 에너지화 기술 도입 기회",
        "kEsgIndicator": "E1-1, E2-2, G3-1"
    },
    {
        "industryCode": "E39",
        "industryName": "환경 정화 및 복원업",
        "sasbIndustry": "Waste Management",
        "esgCategory": "E",
        "esgIssue": "폐기물 처리, 순환경제, 환경오염",
        "riskOpportunity": "폐기물 과징금 / 재활용 시장 성장",
        "kEsgIndicator": "E2-2, G1-2, S2-2"
    },
    {
        "industryCode": "F41",
        "industryName": "건물 건설업",
        "sasbIndustry": "Engineering & Construction Services",
        "esgCategory": "E",
        "esgIssue": "공사 안전, 자재환경성, 부패방지",
        "riskOpportunity": "현장 사고 / 그린빌딩 시장 확대",
        "kEsgIndicator": "S2-1, G2-1, G3-2"
    },
    {
        "industryCode": "F42",
        "industryName": "토목 건설업",
        "sasbIndustry": "Engineering & Construction Services",
        "esgCategory": "E",
        "esgIssue": "탄소배출, 환경영향평가, 지역사회 소통",
        "riskOpportunity": "대형공사 민원 / 친환경 인프라 수주 기회",
        "kEsgIndicator": "E1-2, S1-3, G1-1"
    },
    {
        "industryCode": "F43",
        "industryName": "전문직별 공사업",
        "sasbIndustry": "Building Products & Furnishings",
        "esgCategory": "E",
        "esgIssue": "건축폐기물, 자재 공급망, 에너지 효율",
        "riskOpportunity": "건축폐기물 규제 / 저에너지 설계 수요 증가",
        "kEsgIndicator": "E2-1, S1-2, G2-2"
    },
    {
        "industryCode": "G45",
        "industryName": "자동차 판매업",
        "sasbIndustry": "Automobile Dealers",
        "esgCategory": "S",
        "esgIssue": "제품정보 공개, 차량재활용, 고객보호",
        "riskOpportunity": "불완전 판매 리스크 / EV 중심 유통 확대",
        "kEsgIndicator": "S1-2, G3-2, E2-1"
    },
    {
        "industryCode": "G46",
        "industryName": "도매업",
        "sasbIndustry": "Distributors",
        "esgCategory": "S",
        "esgIssue": "공급망 관리, 윤리적 조달, 물류탄소배출",
        "riskOpportunity": "납품 리스크 / 친환경 유통망 차별화",
        "kEsgIndicator": "E1-1, S2-1, G2-1"
    },
    {
        "industryCode": "G47",
        "industryName": "소매업",
        "sasbIndustry": "Retailers & Distributors",
        "esgCategory": "E",
        "esgIssue": "소비자 안전, 폐기물, 저소득 접근성",
        "riskOpportunity": "유통환경 규제 / 사회가치 기반 마케팅 확대",
        "kEsgIndicator": "S1-2, E2-2, G1-1"
    },
    {
        "industryCode": "H49",
        "industryName": "육상 운송업",
        "sasbIndustry": "Transportation & Logistics",
        "esgCategory": "S",
        "esgIssue": "탄소배출, 교통안전, 운송효율성",
        "riskOpportunity": "노후차량 규제 / 전기운송수단 전환",
        "kEsgIndicator": "E1-1, S1-2, G2-1"
    },
    {
        "industryCode": "H50",
        "industryName": "수상 운송업",
        "sasbIndustry": "Marine Transportation",
        "esgCategory": "E",
        "esgIssue": "선박오염, 기상리스크, 해양안전",
        "riskOpportunity": "해양연료규제 / 친환경 선박 투자 유치",
        "kEsgIndicator": "E1-2, G2-2, S1-3"
    },
    {
        "industryCode": "H51",
        "industryName": "항공 운송업",
        "sasbIndustry": "Airlines",
        "esgCategory": "S",
        "esgIssue": "항공기 배출, 안전관리, 항로 최적화",
        "riskOpportunity": "국제 배출 규제 / SAF 기술혁신 경쟁력",
        "kEsgIndicator": "E1-1, S1-1, G3-2"
    },
    {
        "industryCode": "H52",
        "industryName": "창고 및 운송지원 서비스업",
        "sasbIndustry": "Logistics & Delivery Services",
        "esgCategory": "E",
        "esgIssue": "온실가스, 물류효율화, 노동조건",
        "riskOpportunity": "이산화탄소 규제 / 스마트 물류 솔루션 확대",
        "kEsgIndicator": "E1-2, S2-1, G2-1"
    },
    {
        "industryCode": "I55",
        "industryName": "숙박업",
        "sasbIndustry": "Restaurants",
        "esgCategory": "E",
        "esgIssue": "식품안전, 폐기물 관리, 근로자 처우",
        "riskOpportunity": "식중독 사고 / 친환경 식자재 마케팅 기회",
        "kEsgIndicator": "E2-2, S1-2, G1-1"
    },
    {
        "industryCode": "I56",
        "industryName": "음식점업",
        "sasbIndustry": "Hotels & Lodging",
        "esgCategory": "E",
        "esgIssue": "에너지소비, 물사용, 고객건강",
        "riskOpportunity": "비효율 운영 리스크 / 그린숙박 인증 확대",
        "kEsgIndicator": "E1-2, S2-1, G3-2"
    },
    {
        "industryCode": "J58",
        "industryName": "출판업",
        "sasbIndustry": "Internet Media & Services",
        "esgCategory": "OTHER",
        "esgIssue": "콘텐츠 책임성, 데이터프라이버시, 지적재산권보호",
        "riskOpportunity": "디지털전환으로 친환경콘텐츠/ 사회적가치 창출",
        "kEsgIndicator": "E6-1, S7-1, S8-2"
    },
    {
        "industryCode": "J59",
        "industryName": "영상,오디오,기록물 제작 및 배급업",
        "sasbIndustry": "Internet Media & Services",
        "esgCategory": "OTHER",
        "esgIssue": "콘텐츠 책임성, 데이터프라이버시, 지적재산권보호",
        "riskOpportunity": "디지털전환으로 친환경콘텐츠/ 사회적가치 창출",
        "kEsgIndicator": "E6-1, S7-1, S8-2"
    },
    {
        "industryCode": "J60",
        "industryName": "방송 및 영상·오디오물 제공 서비스업",
        "sasbIndustry": "Internet Media & Services",
        "esgCategory": "OTHER",
        "esgIssue": "콘텐츠 책임성, 데이터프라이버시, 지적재산권보호",
        "riskOpportunity": "디지털전환으로 친환경콘텐츠/ 사회적가치 창출",
        "kEsgIndicator": "E6-1, S7-1, S8-2"
    },
    {
        "industryCode": "J61",
        "industryName": "우편 및 통신업",
        "sasbIndustry": "Telecommunications",
        "esgCategory": "OTHER",
        "esgIssue": "망중립성, 개인정보 보호, 전력소비",
        "riskOpportunity": "정보유출 / 클린 통신 브랜드 구축",
        "kEsgIndicator": "S1-1, E1-2, G2-2"
    },
    {
        "industryCode": "J62",
        "industryName": "소프트웨어 개발 및 공급업",
        "sasbIndustry": "Software & IT Services",
        "esgCategory": "E",
        "esgIssue": "데이터보안, 알고리즘 편향, 에너지사용",
        "riskOpportunity": "개인정보 유출 / 지속가능 IT서비스 시장 선점",
        "kEsgIndicator": "S1-1, G2-1, E1-2"
    },
    {
        "industryCode": "J63",
        "industryName": "정보서비스업",
        "sasbIndustry": "Software & IT Services",
        "esgCategory": "E",
        "esgIssue": "데이터보안, 알고리즘 편향, 에너지사용",
        "riskOpportunity": "개인정보 유출 / 지속가능 IT서비스 시장 선점",
        "kEsgIndicator": "S1-1, G2-1, E1-2"
    },
    {
        "industryCode": "K64",
        "industryName": "은행업",
        "sasbIndustry": "Commercial Banks",
        "esgCategory": "E",
        "esgIssue": "책임대출, 기후리스크 반영, 고객정보보호",
        "riskOpportunity": "부실대출 리스크 / ESG 금융 상품 확대 기회",
        "kEsgIndicator": "S1-3, G1-1, E2-1"
    },
    {
        "industryCode": "K65",
        "industryName": "보험업",
        "sasbIndustry": "Insurance",
        "esgCategory": "OTHER",
        "esgIssue": "재난리스크, 보험상품투명성, 사이버보안",
        "riskOpportunity": "기후 재난 비용 / ESG 기반 보험 설계 확대",
        "kEsgIndicator": "S2-1, G2-1, G3-1"
    },
    {
        "industryCode": "K66",
        "industryName": "금융 및 보험관련 서비스업",
        "sasbIndustry": "Asset Management & Custody Activities",
        "esgCategory": "G",
        "esgIssue": "지속가능 투자 및 ESG 펀드, 금융 포용성, 윤리경영 및 내부통제",
        "riskOpportunity": "그린워싱 및 ESG 오인 투자/금융 취약계층 대상 디지털 접근성 강화",
        "kEsgIndicator": "E3-1. S7-1, S소비자"
    },
    {
        "industryCode": "L68",
        "industryName": "부동산업",
        "sasbIndustry": "Real Estate",
        "esgCategory": "E",
        "esgIssue": "건물에너지효율, 기후리스크, 임대 투명성",
        "riskOpportunity": "노후건물 규제 / 그린부동산 프리미엄 확대",
        "kEsgIndicator": "E1-1, S1-3, G2-1"
    },
    {
        "industryCode": "M69",
        "industryName": "법무 및 회계 서비스업",
        "sasbIndustry": "Professional Services",
        "esgCategory": "S",
        "esgIssue": "윤리경영, 고객정보보호, ESG 자문역할",
        "riskOpportunity": "부정 자문 리스크 / ESG 전문컨설팅 시장 성장",
        "kEsgIndicator": "G1-1, S1-2, G3-1"
    },
    {
        "industryCode": "M70",
        "industryName": "경영컨설팅업",
        "sasbIndustry": "Management Consulting",
        "esgCategory": "S",
        "esgIssue": "고객 ESG 역량 지원, 투명성, 성과측정",
        "riskOpportunity": "성과 왜곡 / 지속가능 경영 프레임워크 수요 증가",
        "kEsgIndicator": "G2-1, S2-2, G3-2"
    },
    {
        "industryCode": "M71",
        "industryName": "전문서비스업",
        "sasbIndustry": "Professional & Commercial Services",
        "esgCategory": "G",
        "esgIssue": "다양성과 포용성, 전문직 윤리 및 독립성",
        "riskOpportunity": "이해충돌 / 지속가능경영 전문 서비스 제공",
        "kEsgIndicator": "S3-1, S3-3, G1-1"
    },
    {
        "industryCode": "M72",
        "industryName": "건축 기술, 엔지니어링 및 기타 과학기술 서비스업",
        "sasbIndustry": "Professional & Commercial Services",
        "esgCategory": "G",
        "esgIssue": "다양성과 포용성, 전문직 윤리 및 독립성",
        "riskOpportunity": "이해충돌 / 지속가능경영 전문 서비스 제공",
        "kEsgIndicator": "S3-1, S3-3, G1-1"
    },
    {
        "industryCode": "M73",
        "industryName": "기타 전문, 과학 및 기술 서비스업",
        "sasbIndustry": "Professional & Commercial Services",
        "esgCategory": "G",
        "esgIssue": "다양성과 포용성, 전문직 윤리 및 독립성",
        "riskOpportunity": "이해충돌 / 지속가능경영 전문 서비스 제공",
        "kEsgIndicator": "S3-1, S3-3, G1-1"
    },
    {
        "industryCode": "N74",
        "industryName": "사업시설 관리 및 조경 서비스업",
        "sasbIndustry": "Professional & Commercial Services",
        "esgCategory": "G",
        "esgIssue": "다양성과 포용성, 전문직 윤리 및 독립성",
        "riskOpportunity": "이해충돌 / 지속가능경영 전문 서비스 제공",
        "kEsgIndicator": "S3-1, S3-3, G1-1"
    },
    {
        "industryCode": "N75",
        "industryName": "사업 지원 서비스업",
        "sasbIndustry": "Professional & Commercial Services",
        "esgCategory": "G",
        "esgIssue": "다양성과 포용성, 전문직 윤리 및 독립성",
        "riskOpportunity": "이해충돌 / 지속가능경영 전문 서비스 제공",
        "kEsgIndicator": "S3-1, S3-3, G1-1"
    },
    {
        "industryCode": "N76",
        "industryName": "임대업 : 부동산 제외",
        "sasbIndustry": "Developers & Investment Trusts",
        "esgCategory": "E",
        "esgIssue": "온실가스배출, 접근성(배리어프리), 이해상충방지",
        "riskOpportunity": "기후위험 / 그린빌딩/에너지절감형리모델링",
        "kEsgIndicator": "E3-1, E4-1, S7-1,"
    },
    {
        "industryCode": "N78",
        "industryName": "고용 서비스업",
        "sasbIndustry": "Employment Services",
        "esgCategory": "E",
        "esgIssue": "공정채용, 노동환경, 차별금지",
        "riskOpportunity": "불공정 채용 이슈 / ESG 채용관리 솔루션 확대",
        "kEsgIndicator": "S1-2, S2-1, G1-1"
    },
    {
        "industryCode": "O84",
        "industryName": "공공행정 및 국방",
        "sasbIndustry": "Government Services",
        "esgCategory": "OTHER",
        "esgIssue": "정책투명성, 공공조달 ESG기준, 디지털접근성",
        "riskOpportunity": "정보불신 / ESG기반 행정 혁신",
        "kEsgIndicator": "G1-1, G3-2, S1-3"
    },
    {
        "industryCode": "P85",
        "industryName": "교육 서비스업",
        "sasbIndustry": "Education Services",
        "esgCategory": "OTHER",
        "esgIssue": "접근성, 교육격차, 디지털포용",
        "riskOpportunity": "정보 격차 / ESG 교육 서비스 수요 증가",
        "kEsgIndicator": "S1-1, G3-2, S2-2"
    },
    {
        "industryCode": "Q86",
        "industryName": "보건업",
        "sasbIndustry": "Healthcare Delivery",
        "esgCategory": "S",
        "esgIssue": "환자안전, 정보보호, 의료 접근성",
        "riskOpportunity": "의료사고 / 스마트의료 솔루션 확대",
        "kEsgIndicator": "S2-1, G1-1, G2-2"
    },
    {
        "industryCode": "Q87",
        "industryName": "사회복지 서비스업",
        "sasbIndustry": "Human Capital Services",
        "esgCategory": "S",
        "esgIssue": "취약계층접근성, 종사자 및 이용자 인권",
        "riskOpportunity": "인권침해 돌봄사고 /지역기반 서비스 확대로 신뢰도 향상",
        "kEsgIndicator": "S3-1, S3-3, S4-1"
    },
    {
        "industryCode": "R90",
        "industryName": "예술 창작 및 공연업",
        "sasbIndustry": "Media & Entertainment",
        "esgCategory": "OTHER",
        "esgIssue": "표현의 자유, 다양성, 저작권",
        "riskOpportunity": "표절 리스크 / 문화다양성 콘텐츠 기회",
        "kEsgIndicator": "S1-3, G1-1, G3-1"
    },
    {
        "industryCode": "R91",
        "industryName": "스포츠 및 오락관련 서비스업",
        "sasbIndustry": "Leisure Facilities",
        "esgCategory": "E",
        "esgIssue": "폐기물처리, 고객안전, 콘텐츠 다양성",
        "riskOpportunity": "콘텐츠 논란/ 안전사고 / 지속가능한 이벤트 도입",
        "kEsgIndicator": "S7-1, S소비자"
    },
    {
        "industryCode": "S94",
        "industryName": "협회 및 단체",
        "sasbIndustry": "Household & Personal Products",
        "esgCategory": "S",
        "esgIssue": "제품안전, 고객보호, 근로자복지",
        "riskOpportunity": "소비자 항의 / 친환경 제품 신뢰도 상승",
        "kEsgIndicator": "S1-2, E2-2, G2-2"
    },
    {
        "industryCode": "S95",
        "industryName": "개인 및 소비용품 수리업",
        "sasbIndustry": "Retail Services",
        "esgCategory": "S",
        "esgIssue": "지역사회 기반 일자리창출, 소비자 신뢰성",
        "riskOpportunity": "품질불완전성 / 순환경제모델의 핵심사업군",
        "kEsgIndicator": "E6-1, E6-2, S7-1"
    },
    {
        "industryCode": "S96",
        "industryName": "기타 개인 서비스업",
        "sasbIndustry": "Retail Services",
        "esgCategory": "S",
        "esgIssue": "지역사회 기반 일자리창출, 소비자 신뢰성",
        "riskOpportunity": "품질불완전성 / 순환경제모델의 핵심사업군",
        "kEsgIndicator": "E6-1, E6-2, S7-1"
    },
    {
        "industryCode": "T97",
        "industryName": "가구 내 고용활동",
        "sasbIndustry": "Households",
        "esgCategory": "S",
        "esgIssue": "근로조건, 성별격차, 복지안전망",
        "riskOpportunity": "돌봄노동 착취 이슈 / 공공지원 연계 확대",
        "kEsgIndicator": "S1-3, S2-1, G1-2"
    },
    {
        "industryCode": "T98",
        "industryName": "달리 구분되지 않은 자가 소비를 위한 가구 재화 및 서비스 생산활동",  
        "sasbIndustry": "-",
        "esgCategory": "OTHER",
        "esgIssue": "해당없음",
        "riskOpportunity": "해당없음",
        "kEsgIndicator": "해당없음"
    },
    {
        "industryCode": "U99",
        "industryName": "국제 및 외국기관",
        "sasbIndustry": "NGO/NPO",
        "esgCategory": "S",
        "esgIssue": "국제거버넌스, 정책일관성, 인권보호",
        "riskOpportunity": "글로벌 규제 미준수 / 국제기구 협력 기회",
        "kEsgIndicator": "G1-1, G2-1, S1-1"
    }
];