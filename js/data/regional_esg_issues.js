// js/data/regional_esg_issues.js (2025-06-12 최종 수정본)

const REGIONAL_ESG_ISSUES = {
    "서울특별시": {
        map_id: "seoul",
        E: [
            { issue: "대기질 관리", reason: "수도권 인구 밀집" },
            { issue: "에너지 다소비", reason: "노후 건물 비효율" },
            { issue: "폐기물 처리", reason: "1인 가구 증가" }
        ],
        S: [
            { issue: "교통 혼잡 심화", reason: "출퇴근 인구 집중" },
            { issue: "주거 불안정", reason: "높은 부동산 가격" },
            { issue: "사회적 불평등", reason: "소득 격차 심화" }
        ],
        G: [
            { issue: "투명한 도시 행정", reason: "대규모 예산 집행" },
            { issue: "시민 참여 거버넌스", reason: "다양한 이해관계" },
            { issue: "부패 방지 시스템", reason: "공공사업 투명성 요구" }
        ]
    },
    "부산광역시": {
        map_id: "busan",
        E: [
            { issue: "항만 대기오염", reason: "대형 선박 밀집" },
            { issue: "해양 플라스틱", reason: "국내 최대 항구도시" },
            { issue: "기후변화 대응", reason: "해수면 상승 위험" }
        ],
        S: [
            { issue: "초고령 사회 진입", reason: "전국 최고 고령화율" },
            { issue: "청년 인구 유출", reason: "양질의 일자리 부족" },
            { issue: "관광-주민 상생", reason: "오버투어리즘 문제" }
        ],
        G: [
            { issue: "항만 재개발 투명성", reason: "대규모 공공 프로젝트" },
            { issue: "국제 행사 유치", reason: "엑스포 등 거버넌스" },
            { issue: "도시 안전 및 재난관리", reason: "태풍 등 자연재해" }
        ]
    },
    "대구광역시": {
        map_id: "daegu",
        E: [
            { issue: "폭염 및 대기질", reason: "분지 지형 특성" },
            { issue: "낙동강 수질 관리", reason: "주요 식수원 오염" },
            { issue: "노후 산단 환경오염", reason: "염색 등 전통 산업" }
        ],
        S: [
            { issue: "전통 주력산업 쇠퇴", reason: "섬유 등 구조조정" },
            { issue: "청년 일자리 부족", reason: "지역 인재 유출 심화" },
            { issue: "대중교통 시스템 개선", reason: "도시 확장 및 인구" }
        ],
        G: [
            { issue: "개발 사업 투명성", reason: "신공항 등 대형 사업" },
            { issue: "시민 참여 활성화", reason: "보수적 정치 지형" },
            { issue: "효율적 예산 집행", reason: "시 재정 건전성 확보" }
        ]
    },
    "인천광역시": {
        map_id: "incheon",
        E: [
            { issue: "공항/항만 대기오염", reason: "국제 허브 기능" },
            { issue: "수도권 매립지 관리", reason: "환경 및 주민 갈등" },
            { issue: "해양 생태계 보호", reason: "갯벌 및 도서 지역" }
        ],
        S: [
            { issue: "공항 소음 피해", reason: "주민 건강권 문제" },
            { issue: "다문화 포용 정책", reason: "외국인 주민 비율 높음" },
            { issue: "원도심-신도심 격차", reason: "송도, 청라 등 개발" }
        ],
        G: [
            { issue: "경제자유구역 거버넌스", reason: "외국 자본 투자 유치" },
            { issue: "항만 물류 운영 효율", reason: "수도권 관문 역할" },
            { issue: "시민 안전망 구축", reason: "각종 사건사고 대응" }
        ]
    },
    "광주광역시": {
        map_id: "gwangju",
        E: [
            { issue: "도심 하천 수질", reason: "광주천 등 생태 복원" },
            { issue: "자동차 배출가스", reason: "완성차 공장 위치" },
            { issue: "에너지 자립 도시", reason: "AI 연계 에너지 전환" }
        ],
        S: [
            { issue: "미래차 산업 일자리", reason: "기존 산업 전환" },
            { issue: "5.18 정신 계승", reason: "인권 및 민주주의" },
            { issue: "문화예술 생태계", reason: "아시아문화중심도시" }
        ],
        G: [
            { issue: "AI 산업단지 투명성", reason: "미래 전략 사업 육성" },
            { issue: "시민단체의 역할", reason: "활발한 시민사회" },
            { issue: "청렴도 제고", reason: "부패 방지 노력 필요" }
        ]
    },
    "대전광역시": {
        map_id: "daejeon",
        E: [
            { issue: "연구단지 안전 관리", reason: "대덕연구개발특구" },
            { issue: "갑천 등 하천 생태계", reason: "도시 개발과 보존" },
            { issue: "자원순환 시스템", reason: "과학도시 위상" }
        ],
        S: [
            { issue: "과학기술 인력 유출", reason: "수도권으로 인재 이동" },
            { issue: "교통 인프라 확충", reason: "도시철도 2호선 등" },
            { issue: "지역 대학과의 상생", reason: "산학연 협력 중요" }
        ],
        G: [
            { issue: "R&D 예산 투명성", reason: "정부 출연 연구기관" },
            { issue: "스타트업 지원 정책", reason: "혁신 생태계 거버넌스" },
            { issue: "시정 정보 공개", reason: "시민의 알 권리 보장" }
        ]
    },
    "울산광역시": {
        map_id: "ulsan",
        E: [
            { issue: "주력 산업 탄소배출", reason: "석유화학, 조선, 자동차" },
            { issue: "산업단지 안전사고", reason: "화학물질 누출 위험" },
            { issue: "태화강 생태 복원", reason: "산업화 후 환경 개선" }
        ],
        S: [
            { issue: "산업재해 예방", reason: "중공업 중심 산업" },
            { issue: "주력산업 고용 안정", reason: "조선업 등 경기 변동" },
            { issue: "외국인 노동자 지원", reason: "조선소 인력 수급" }
        ],
        G: [
            { issue: "대기업-협력사 관계", reason: "공정거래 문화 정착" },
            { issue: "노사 관계 안정", reason: "강성 노조 활동 역사" },
            { issue: "안전 경영 체계", reason: "기업 최고경영진 책임" }
        ]
    },
    "세종특별자치시": {
        map_id: "sejong",
        E: [
            { issue: "친환경 도시 설계", reason: "계획도시 특성" },
            { issue: "중앙공원 등 녹지 보존", reason: "도시의 허파 역할" },
            { issue: "스마트시티 에너지", reason: "미래형 도시 모델" }
        ],
        S: [
            { issue: "정주여건 개선", reason: "문화/상업시설 부족" },
            { issue: "지역 내 교육 인프라", reason: "젊은 인구 비중 높음" },
            { issue: "대중교통 시스템 구축", reason: "자족기능 강화 필요" }
        ],
        G: [
            { issue: "행정수도 이전 논의", reason: "국가적 거버넌스 이슈" },
            { issue: "주민 자치 모델", reason: "높은 시민의식" },
            { issue: "도시계획 투명성", reason: "부동산 투기 방지" }
        ]
    },
    "경기도": {
        map_id: "gyeonggi",
        E: [
            { issue: "반도체 공장 용수", reason: "첨단 산업단지 위치" },
            { issue: "수도권 미세먼지", reason: "서울 인접 및 교통량" },
            { issue: "신도시 녹지 확보", reason: "급격한 인구 유입" }
        ],
        S: [
            { issue: "광역 교통망 확충", reason: "서울 통근 인구" },
            { issue: "지역간 발전 불균형", reason: "경기 남부/북부 격차" },
            { issue: "플랫폼 노동자 권익", reason: "IT 기업 다수 위치" }
        ],
        G: [
            { issue: "개발사업 인허가 비리", reason: "대규모 택지 개발" },
            { issue: "광역버스 등 준공영제", reason: "서울시와 협력" },
            { issue: "데이터센터 갈등 조정", reason: "전력 수급 및 민원" }
        ]
    },
    "강원특별자치도": {
        map_id: "gangwon",
        E: [
            { issue: "산불 예방 및 대응", reason: "높은 산림 비중" },
            { issue: "폐광 지역 환경 복원", reason: "과거 석탄 산업 유산" },
            { issue: "설악산 등 국립공원 보존", reason: "관광과 환경보호" }
        ],
        S: [
            { issue: "접경지역 군사 규제", reason: "남북 분단 현실" },
            { issue: "동계올림픽 유산 활용", reason: "지역 경제 활성화" },
            { issue: "의료 인프라 부족", reason: "넓은 면적, 낮은 인구" }
        ],
        G: [
            { issue: "특별자치도 권한 이양", reason: "중앙정부와 협력" },
            { issue: "관광개발 투명성", reason: "리조트 등 난개발 방지" },
            { issue: "재생에너지 발전 갈등", reason: "풍력 등 주민 수용성" }
        ]
    },
    "충청북도": {
        map_id: "chungbuk",
        E: [
            { issue: "대청호 수질 관리", reason: "중부권 핵심 상수원" },
            { issue: "2차전지 공장 안전", reason: "오창 등 산업단지" },
            { issue: "시멘트 공장 분진", reason: "제천, 단양 지역" }
        ],
        S: [
            { issue: "중부권 교통 허브", reason: "오송역 등 KTX 분기" },
            { issue: "바이오 인력 양성", reason: "특화 산업 생태계" },
            { issue: "농촌 지역 소멸 위기", reason: "고령화 및 인구 감소" }
        ],
        G: [
            { issue: "바이오 산업 투자 유치", reason: "전략 산업 육성 정책" },
            { issue: "청주공항 활성화", reason: "행정수도 관문 공항" },
            { issue: "충북-대전 상생 협력", reason: "광역 경제권 구축" }
        ]
    },
    "충청남도": {
        map_id: "chungnam",
        E: [
            { issue: "석탄화력발전소 단계적 폐쇄", reason: "국내 최대 화력발전" },
            { issue: "서해안 유류오염", reason: "대산 석유화학단지" },
            { issue: "가축분뇨 악취", reason: "대규모 축산업 지역" }
        ],
        S: [
            { issue: "삼성/현대차 의존 경제", reason: "대기업 중심 산업구조" },
            { issue: "농촌 인력난", reason: "외국인 계절근로자" },
            { issue: "내포신도시 정주여건", reason: "도청 이전 신도시" }
        ],
        G: [
            { issue: "에너지 전환 거버넌스", reason: "탈석탄 정의로운 전환" },
            { issue: "대기업-지역 상생", reason: "공급망 내 중소기업" },
            { issue: "환황해 경제권 구축", reason: "미래 성장동력 확보" }
        ]
    },
    "전북특별자치도": {
        map_id: "jeonbuk",
        E: [
            { issue: "새만금 환경 생태", reason: "대규모 간척 사업" },
            { issue: "농업용수 수질", reason: "호남평야 쌀 생산지" },
            { issue: "재생에너지 확대", reason: "해상풍력 등 잠재력" }
        ],
        S: [
            { issue: "인구 소멸 위기", reason: "전국 최저 출산율" },
            { issue: "농업 경쟁력 약화", reason: "시장 개방 및 고령화" },
            { issue: "역사 문화 자원 보존", reason: "전주 한옥마을 등" }
        ],
        G: [
            { issue: "특별자치도 권한 확보", reason: "새만금 사업 주도권" },
            { issue: "금융중심지 지정", reason: "국민연금공단 이전" },
            { issue: "지역 정치 안정성", reason: "정치적 소외감 해소" }
        ]
    },
    "전라남도": {
        map_id: "jeonnam",
        E: [
            { issue: "여수산단 대기오염", reason: "국가 기간 산업단지" },
            { issue: "해양쓰레기 처리", reason: "다도해, 긴 해안선" },
            { issue: "친환경 농수산업", reason: "유기농, 무항생제 등" }
        ],
        S: [
            { issue: "섬 지역 의료/교육 접근성", reason: "전국 최다 도서 지역" },
            { issue: "농어촌 고령화 심각", reason: "일손 부족 문제" },
            { issue: "에너지밸리 조성", reason: "한전 본사 나주 이전" }
        ],
        G: [
            { issue: "지역 균형발전", reason: "목포-여수-순천 3각" },
            { issue: "해상풍력 사업 투명성", reason: "이익공유 모델" },
            { issue: "지방소멸대응기금", reason: "효율적 예산 활용" }
        ]
    },
    "경상북도": {
        map_id: "gyeongbuk",
        E: [
            { issue: "원자력발전소 안전", reason: "월성, 한울 등 위치" },
            { issue: "포항 철강산업 공해", reason: "포스코 등 대규모 제철소" },
            { issue: "동해안 해양 생태계", reason: "고래 등 해양 포유류" }
        ],
        S: [
            { issue: "포항 지진 피해 복구", reason: "지역사회 안정" },
            { issue: "2차전지 산업 인력", reason: "포항 특화단지 육성" },
            { issue: "전통문화유산 보존", reason: "경주, 안동 등" }
        ],
        G: [
            { issue: "신공항 이전 거버넌스", reason: "군위 편입, 행정 통합" },
            { issue: "사용후핵연료 관리", reason: "지역사회 합의" },
            { issue: "지방대학 경쟁력", reason: "지역 인재 양성" }
        ]
    },
    "경상남도": {
        map_id: "gyeongnam",
        E: [
            { issue: "조선소 VOC 배출", reason: "선박 도장 공정" },
            { issue: "남해안 적조 피해", reason: "양식 어업 환경" },
            { issue: "지리산 국립공원 보존", reason: "생물다양성 핵심" }
        ],
        S: [
            { issue: "조선업 불황/호황 반복", reason: "주력산업 고용 불안" },
            { issue: "항공우주산업 육성", reason: "사천 KAI 중심" },
            { issue: "다문화 가정 지원", reason: "농어촌 국제결혼" }
        ],
        G: [
            { issue: "방위산업 클러스터", reason: "창원 등 방산 업체" },
            { issue: "진해신항 건설", reason: "부산항과 연계" },
            { issue: "행정통합 논의", reason: "부울경 메가시티" }
        ]
    },
    "제주특별자치도": {
        map_id: "jeju",
        E: [
            { issue: "생활 폐기물 처리", reason: "관광객 급증" },
            { issue: "지하수 자원 보존", reason: "유일한 상수원" },
            { issue: "해양생태계 보호", reason: "연산호 군락지 등" }
        ],
        S: [
            { issue: "부동산 가격 급등", reason: "외부 인구 유입" },
            { issue: "관광업 노동자 처우", reason: "계절적 고용 불안정" },
            { issue: "지역 고유문화 보존", reason: "급격한 사회 변화" }
        ],
        G: [
            { issue: "난개발 방지", reason: "투명한 인허가 과정" },
            { issue: "에너지 전환 정책", reason: "CFI 2030 목표" },
            { issue: "제2공항 건설 갈등", reason: "주민 의견 수렴" }
        ]
    }
};