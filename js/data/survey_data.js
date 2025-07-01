// js/data/survey_data.js (value 속성 추가 최종본)

const surveyData = [
    { 
        id: "Q1", 
        category: "E", 
        question: "(환경-환경경영-전략수립)귀사는 환경경영 관련 정책 또는 실행계획을 수립하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q1_1", 
        nextIfNo: "Q2"   
    },
    { 
        id: "Q1_1", 
        category: "E", 
        question: "환경경영 관련 계획을 갖고 있다면, 환경경영 실천 수준은 어느 정도입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 선언적 목표 설정", value: "1", score: 25 }, 
            { text: "2번: 내부 계획 존재", value: "2", score: 50 }, 
            { text: "3번: 예산책정 및 사용(환경단체기부, 인증 등)", value: "3", score: 75 }, 
            { text: "4번: 정기평가 및 이행", value: "4", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q2" 
    },
    { 
        id: "Q2", 
        category: "E", 
        question: "(환경-기후변화-온실가스배출량)귀사는 최근 1년 내 온실가스 배출량을 산정한 적이 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q2_1", 
        nextIfNo: "Q3"   
    },
    { 
        id: "Q2_1", 
        category: "E", 
        question: "온실가스 배출량을 산정한 적이 있다면, 연간 배출량은 얼마나 됩니까? (숫자, tCO₂eq)", 
        type: "INPUT", 
        inputType: "number", 
        maxScore: 100, 
        next: "Q3"
    },
    { 
        id: "Q3", 
        category: "E", 
        question: "(환경-기후변화-에너지사용량)귀사는 에너지 사용량을 모니터링하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q3_1",
        nextIfNo: "Q4"  
    },
    { 
        id: "Q3_1", 
        category: "E", 
        question: "에너지 사용량을 모니터링하고 있다면, 연간 총 에너지 사용량은 얼마입니까? (MWh 또는 ℓ)", 
        type: "INPUT", 
        inputType: "number", 
        maxScore: 100, 
        next: "Q4" 
    },
    { 
        id: "Q4", 
        category: "E", 
        question: "(환경-자원순환-폐기물발생량) 귀사는 폐기물 발생량을 모니터링하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q4_1", 
        nextIfNo: "Q5" 
    },
    { 
        id: "Q4_1", 
        category: "E", 
        question: "폐기물 발생량을 모니터링하고 있다면, 연간 총 폐기물 발생량은 얼마입니까?", 
        type: "INPUT", 
        inputType: "number",
        maxScore: 100,
        next: "Q5" 
    },
    { 
        id: "Q5", 
        category: "S", 
        question: "(사회-노동-비정규직)귀사는 비정규직 직원을 고용하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 100 } ], 
        maxScore: 100, 
        nextIfYes: "Q5_1", 
        nextIfNo: "Q6"   
    },
    { 
        id: "Q5_1", 
        category: "S", 
        question: "비정규직 직원을 고용하고 있다면, 전체 직원 중 비정규직 비율은 몇 %입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 20% 미만", value: "1", score: 100 }, 
            { text: "2번: 20~40%", value: "2", score: 75 }, 
            { text: "3번: 40~60%", value: "3", score: 50 }, 
            { text: "4번: 60~80%", value: "4", score: 25 }, 
            { text: "5번: 80% 초과", value: "5", score: 0 } 
        ], 
        maxScore: 100, 
        next: "Q6" 
    },
    { 
        id: "Q6", 
        category: "S", 
        question: "(사회-노동-장애인)귀사는 장애인을 고용하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q6_1", 
        nextIfNo: "Q7"  
    },
    {   
        id: "Q6_1", 
        category: "S", 
        question: "귀사는 장애인 의무고용률 대비 몇%의 장애인을 채용했습니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 60%미만", value: "1", score: 0 }, 
            { text: "2번: 60%이상 80%미만", value: "2", score: 25 }, 
            { text: "3번: 80%이상 100%미만", value: "3", score: 50 }, 
            { text: "4번: 100%이상 120%미만", value: "4", score: 75 }, 
            { text: "5번: 120% 이상", value: "5", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q6_2"
    },
    { 
        id: "Q6_2", 
        category: "S", 
        question: "귀사가 장애인고용부담금(과태료)를 납부하는 경우, 연간 과태료는 얼마입니까? (₩, 숫자, 단위 억원, 500만원=0.05)", 
        type: "INPUT", 
        inputType: "number", 
        maxScore: 0, 
        next: "Q7" 
    },
    { 
        id: "Q7", 
        category: "S", 
        question: "(사회-노동-여성)귀사의 전체 직원 중 여성 직원을 고용하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q7_1", 
        nextIfNo: "Q8"   
    },
    { 
        id: "Q7_1", 
        category: "S", 
        question: "여성직원을 고용하고 있다면, 전체 직원 대비 비율은 몇 %입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 10%미만", value: "1", score: 20 }, 
            { text: "2번: 11~15%", value: "2", score: 40 }, 
            { text: "3번: 15~20%", value: "3", score: 60 }, 
            { text: "4번: 21~25%", value: "4", score: 80 }, 
            { text: "5번: 25% 이상", value: "5", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q8" 
    },
    { 
        id: "Q8", 
        category: "S", 
        question: "(사회-노동-근속년수)귀사는 전체 직원의 평균 근속년수를 파악하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q8_1", 
        nextIfNo: "Q9"  
    },
    { 
        id: "Q8_1", 
        category: "S", 
        question: "전체 직원의 평균 근속년수를 파악하고 있다면, 평균 근속년수는 몇 년입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 2년 미만", value: "1", score: 20 }, 
            { text: "2번: 3~5년", value: "2", score: 40 }, 
            { text: "3번: 5~7년", value: "3", score: 60 }, 
            { text: "4번: 7~10년", value: "4", score: 80 }, 
            { text: "5번: 10년 이상", value: "5", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q9" 
    },
    { 
        id: "Q9", 
        category: "S", 
        question: "(사회-지역사회-상생협력)귀사는 최근 1년 내 지역사회에 기부를 한 적이 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q9_1", 
        nextIfNo: "Q10"  
    },
    { 
        id: "Q9_1", 
        category: "S", 
        question: "귀사는 조직의 사회공헌 관련 계획 또는 실행계획을 수립하고 있습니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 선언적 목표 설정", value: "1", score: 25 }, 
            { text: "2번: 계획 및 예산 명시", value: "2", score: 50 }, 
            { text: "3번: 대표프로그램 제시 및 성과관리지표(KPI) 설정", value: "3", score: 75 }, 
            { text: "4번: 중장기 실행계획 마련", value: "4", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q9_2" 
    },
    { 
        id: "Q9_2", 
        category: "S", 
        question: "최근 1년 이내 기부를 한 적이 있다면, 연간 총 기부금액은 얼마입니까? <br>(₩ 단위: 억원, 5000만원=0.5억원)", 
        type: "INPUT", 
        inputType: "number", 
        maxScore: 0, 
        next: "Q10" 
    },
    { 
        id: "Q10", 
        category: "S", 
        question: "(사회-품질경영-소비자,공급망)귀사는 품질경영 관련 논의를 진행한 적이 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q10_1",
        nextIfNo: "Q11"   
    },
    { 
        id: "Q10_1", 
        category: "S", 
        question: "품질경영 논의를 하고 있다면, 귀사의 품질경영 수준은 어느 정도라고 보십니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 선언적 목표 설정", value: "1", score: 25 }, 
            { text: "2번: 내부 계획수립 및 관리", value: "2", score: 50 }, 
            { text: "3번: 예산책정 및 사용(소비자 피드백 활동, 인증 등)", value: "3", score: 75 }, 
            { text: "4번: 정기평가 및 이행", value: "4", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q11" 
    },
    { 
        id: "Q11", 
        category: "G", 
        question: "(지배구조-이사회-사외이사)귀사 이사회에 사외이사를 선임하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q11_1",
        nextIfNo: "Q12"   
    },
    { 
        id: "Q11_1", 
        category: "G", 
        question: "사외이사를 선임하고 있다면, 사외이사 수는 전체 이사 수 대비 몇%입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 3인 미만", value: "1", score: 20 }, 
            { text: "2번: 3인 이상이면서 총원의 60%미만", value: "2", score: 40 }, 
            { text: "3번: 3인 이상이면서 총원의 60~70%", value: "3", score: 60 }, 
            { text: "4번: 3인 이상이면서 총원의 70~80%", value: "4", score: 80 }, 
            { text: "5번: 3인 이상이면서 총원의 80% 이상", value: "5", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q12" 
    },
    { 
        id: "Q12", 
        category: "G", 
        question: "(지배구조-이사회-운영)귀사는 이사회가 정기적으로 운영되고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: -50 } ], 
        maxScore: 0, 
        nextIfYes: "Q12_1", 
        nextIfNo: "Q13"   
    },
    { 
        id: "Q12_1", 
        category: "G", 
        question: "정기적으로 이사회가 운영된다면, 연간 이사회 개최 횟수는 몇 회입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 연간(1회)", value: "1", score: 0 }, 
            { text: "2번: 반기+비정기(2~3회)", value: "2", score: 25 }, 
            { text: "3번: 분기+비정기(4~6회)", value: "3", score: 50 }, 
            { text: "4번: 격월+비정기(6~8회)", value: "4", score: 75 }, 
            { text: "5번: 월(12회 이상)", value: "5", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q13"
    },
    { 
        id: "Q13", 
        category: "G", 
        question: "(지배구조-경영진-성과평가)귀사는 임원 보수를 매출액과 비교하여 관리하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q13_1",
        nextIfNo: "Q14"   
    },
    { 
        id: "Q13_1", 
        category: "G", 
        question: "임원 보수를 매출과 비교해 관리하고 있다면, 임원보수는 매출액 대비 몇 %입니까?", 
        type: "SELECT_ONE", 
        options: [  
            { text: "1번: 0.1%미만", value: "1", score: 100 }, 
            { text: "2번: 0.1~0.5%", value: "2", score: 80 }, 
            { text: "3번: 0.5%~1.5%", value: "3", score: 60 }, 
            { text: "4번: 1.6%~2%", value: "4", score: 40 }, 
            { text: "5번: 2%이상", value: "5", score: 20 } 
        ], 
        maxScore: 100, 
        next: "Q14"
    },
    { 
        id: "Q14", 
        category: "G", 
        question: "(지배구조-주주권리-집중투표제)귀사는 주주권리 보호를 위한 집중투표 제도에 대해 논의한 적이 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q14_1", 
        nextIfNo: "Q15"   
    },
    { 
        id: "Q14_1", 
        category: "G", 
        question: "집중투표 제도를 논의하고 있다면, 제도 운영 수준은 어느 정도입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 선언적 목표 설정", value: "1", score: 25 }, 
            { text: "2번: 내부 계획수립", value: "2", score: 50 }, 
            { text: "3번: 일부 적용", value: "3", score: 75 }, 
            { text: "4번: 모든 의결에 적용", value: "4", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q15" 
    },
    { 
        id: "Q15", 
        category: "G", 
        question: "(지배구조-주주권리-배당정책)귀사는 주주환원(배당 등)을 고려한 재무정책을 논의하고 있습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 0 } ], 
        maxScore: 0, 
        nextIfYes: "Q15_1", 
        nextIfNo: "Q16"   
    },
    { 
        id: "Q15_1", 
        category: "G", 
        question: "주주환원 정책을 논의하고 있다면, 주주환원 계획 수준은 어느 정도입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 선언적 목표 설정", value: "1", score: 25 }, 
            { text: "2번: 내부 계획 수립", value: "2", score: 50 }, 
            { text: "3번: 정책 수립 후 일부 반영", value: "3", score: 75 }, 
            { text: "4번: 주기적 배당 또는 자사주 매입 있음", value: "4", score: 100 } 
        ], 
        maxScore: 100, 
        next: "Q16" 
    },
    { 
        id: "Q16", 
        category: "G", 
        question: "(지배구조-윤리경영-규제위반)최근 5년 내 환경, 공정거래, 고용 관련 법규 위반 또는 임직원 처벌 사례가 있었습니까?", 
        type: "YN", 
        options: [ { text: "예", value: "Yes", score: 0 }, { text: "아니오", value: "No", score: 100 } ], 
        maxScore: 100, 
        nextIfYes: "Q16_1", 
        nextIfNo: "END_SURVEY" 
    },
    { 
        id: "Q16_1", 
        category: "G", 
        question: "법규위반 사례가 있다면,사안의 건수 또는 내용은 무엇입니까?", 
        type: "SELECT_ONE", 
        options: [ 
            { text: "1번: 처벌수위가 형벌·벌금·과료 등인 사법상 처분인 경우", value: "1", score: -50 }, 
            { text: "2번: 처벌수위가 과태료·과징금·이행강제금 등인 행정상 금전적 처분인 경우", value: "2", score: -30 }, 
            { text: "3번: 처벌수위가 시정명령·시정권고·경고 등인 행정상 비금전적 처분인 경우", value: "3", score: -10 } 
        ], 
        maxScore: -50,
        next: "END_SURVEY" 
    }
];