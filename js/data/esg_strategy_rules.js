// js/data/esg_strategy_rules.js 250613

const ESG_STRATEGY_RULES = [
    // 규칙 1: 환경 경영 전략
    // 규칙 1: 환경 경영 전략 (계산 규칙 추가)
    {
    id: 'env_strategy',
    category: 'E',
    condition: 'OR',
    question_ids: ['Q1_1', 'Q2_1', 'Q3_1', 'Q4_1'],
    thresholds: [
        { 
            max_score: 80, // 80점 미만일 때 이 과제가 나타남
            task: '환경경영 개선 및 탄소비용 관리 필요', 
            description: '전사적 환경 목표를 설정하고, 탄소 배출량 관리를 통해 미래 비용 리스크에 대비해야 합니다.',
            
            // ▼▼▼ 이 계산 규칙 객체가 핵심입니다 ▼▼▼
            calculation: {
                type: 'carbon_cost',      // 계산 유형: 탄소 비용
                dataKey: 'greenhouseGas', // industry_average_data.js에서 사용할 데이터 키
                params: {
                    carbonPrice: 20000,   // 톤당 탄소 가격 (2만원)
                    reductionRate: 0.1    // 10% 감축률 가정
                }
            }
        }
    ]
    },

    // 규칙 2: 폐기물 저감
    {
    id: 'waste_circularity',
    category: 'E',
    condition: 'OR',
    question_ids: ['Q4_1'],
    thresholds: [
      { 
        max_score: 80,
        task: '폐기물 감축 및 자원순환 대책 필요',
        description: '폐기물 처리비 및 부담금 증대로 인한 비용 리스크 대응, 재활용률 개선 필요.',
        calculation: {
          type: 'waste_cost',
          dataKey: 'wasteGeneration',
          params: {
            wastePrice: 100000,   // 톤당 폐기물 부담금(가정)
            reductionRate: 0.1
          }
        }
      }
    ]
  },

    // 규칙 3: 장애인 고용
    {
        id: 'disabled_employment',
        category: 'S',
        condition: 'OR',
        question_ids: ['Q6_1', 'Q6_2'],
        thresholds: [
        { 
        max_score: 100,
        task: '장애인 고용정책 강화 필요',
        description: '의무고용 미달 시 과태료 발생, 초과 시 인센티브 기회. 정부 기준 충족 노력 필요.',
        calculation: {
          type: 'disability_penalty',
          dataKey: 'disabilityEmploymentRatio',
          params: {
            targetRatio: 3.1,         // 2024 법정 장애인 의무고용률(%)
            penaltyPerPerson: 1500000,// 1인당 부담금
            incentivePerPerson: 1200000
          }
        }
      }
    ]
    },

// 규칙 4-1: 비정규직 고용 여부 (Q5)
{
    id: 'labor_policy_q5',
    category: 'S',
    task_group: 'labor_policy', // ★★★ 과제 그룹 ID 추가 ★★★
    question_ids: ['Q5'],
    thresholds: [
      { 
        max_score: 80,
        task: '근로환경 및 인사정책 개선 필요',
        description: '비정규직 비율 및 근속년수 부족은 생산성·노무리스크 증가로 이어질 수 있습니다.',
        calculation: {
          type: 'labor_risk',
          dataKey: 'nonRegularRatio',
          params: {
            riskUnitCost: 5000000 // 예시, 노무리스크 1건 비용
          }
        }
      }
    ]
},

// 규칙 4-2: 비정규직 비율 (Q5_1)
{
    id: 'labor_policy_q5_1',
    category: 'S',
    task_group: 'labor_policy', // ★★★ 과제 그룹 ID 추가 ★★★
    question_ids: ['Q5_1'],
    thresholds: [
      { 
        max_score: 80,
        task: '근로환경 및 인사정책 개선 필요',
        description: '비정규직 비율 및 근속년수 부족은 생산성·노무리스크 증가로 이어질 수 있습니다.',
        calculation: {
          type: 'labor_risk',
          dataKey: 'nonRegularRatio',
          params: {
            riskUnitCost: 5000000 // 예시, 노무리스크 1건 비용
          }
        }
      }
    ]
    },

// 규칙 4-3: 여성 직원 비율 (Q7_1)
{
    id: 'labor_policy_q7_1',
    category: 'S',
    task_group: 'labor_policy', // ★★★ 과제 그룹 ID 추가 ★★★
    question_ids: ['Q7_1'],
    thresholds: [
      { 
        max_score: 80,
        task: '근로환경 및 인사정책 개선 필요',
        description: '비정규직 비율 및 근속년수 부족은 생산성·노무리스크 증가로 이어질 수 있습니다.',
        calculation: {
          type: 'labor_risk',
          dataKey: 'nonRegularRatio',
          params: {
            riskUnitCost: 5000000 // 예시, 노무리스크 1건 비용
          }
        }
      }
    ]
    },

    // 규칙 5: 지역사회 협력
    {
        id: 'community_cooperation',
        category: 'S',
        condition: 'OR',
        question_ids: ['Q9_1'],
        thresholds: [
      { 
        max_score: 80,
        task: '지역사회 협력 강화 필요',
        description: '사회공헌활동 부족 시 평판·사업확장에 제약, 협력 프로그램 강화 필요.',
        calculation: {
          type: 'community_cost',
          dataKey: 'yearsOfService', // 예시(실제 기부액 추천)
          params: {
            riskRate: 0.01 // 매출의 1% 간접비용 가정
          }
        }
      }
    ]
    },

    // 규칙 6: 지배구조 점검
    {
        id: 'governance_check',
        category: 'G',
        condition: 'OR',
        question_ids: ['Q11_1','Q12_1'],
        thresholds: [
      { 
        max_score: 80,
        task: '지배구조 투명성 제고 필요',
        description: '이사회 운영 미흡시 제재·투자유치 제한 등 리스크 발생, 투명성 확보 필수.',
        calculation: {
          type: 'governance_risk',
          dataKey: 'outsideDirectorRatio',
          params: {
            penaltyAmount: 30000000 // 공정위 평균 제재금 예시
          }
        }
      }
    ]
    },

    // 규칙 7: 재원 마련 전략
    {
        id: 'financial_strategy',
        category: 'Mixed',
        condition: 'OR',
        question_ids: ['Q13_1','Q15_1'],
        thresholds: [
      { 
        max_score: 80,
        task: '지속가능경영 위한 재원확보 필요',
        description: '기부·투자활동 미흡시 세제혜택 및 조달기회 상실.',
        calculation: {
          type: 'funding_loss',
          dataKey: 'executiveCompensationRatio', // (실제 기부액 추천)
          params: {
            benefitRate: 0.12 // 예시: 기부금 12% 세액공제
          }
        }
      }
    ]
    },

    // 규칙 8: 종합 ESG 전략 (전체 평균 점수 기준)
    {
        id: 'overall_strategy',
        category: 'Mixed',
        type: 'overall_score', // 특별한 규칙 유형
        threshold: 60,
        thresholds: [
      { 
        max_score: 80,
        task: '종합ESG전략 수립 필요',
        description: 'ESG 종합전략 부재 시 인증·평가 탈락 및 시장 불이익 발생 가능.',
        calculation: {
          type: 'integrated_risk',
          dataKey: 'greenhouseGas', // 예시(종합점수 가능)
          params: {
            riskRate: 0.08 // 연매출의 8% 등 잠재비용
          }
        }
      }
    ]
  }
];