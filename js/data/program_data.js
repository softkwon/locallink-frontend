const ESG_PROGRAM_LIST = [
    {
        id: 'program-env-strategy',
        title: '환경-지속가능경영 검토',
        image: 'images/program_sustainability.jpg',
        description: '귀사와 협력공급망 그리고 지역사회 공존을 위한 지속가능성 점검',
        link: 'program_sustainability_review.html',
        // 이 프로그램이 어떤 과제와 연결되는지 여기에 정의합니다.
        relatedTasks: [
            '환경경영 개선 및 탄소비용 관리 필요'
        ],
        cost: 30000000, // 예시: 3,000만원
        // 수정필요
    },
    {
        id: 'program-waste',
        title: '환경-자바 캠페인',
        image: 'images/program_recycling.jpg',
        description: '귀사의 폐기물 지속가능성을 향상 시키는 재활용프로그램', // 목록 페이지용 짧은 설명
        relatedTasks: ['폐기물 감축 및 자원순환 대책 필요'],

        // === 상세 페이지용 풍부한 정보 ===
        
        // [신규] 파트너 정보
        partnerInfo: 'LocalLink 인증 사회적기업 「그린로그」',

        // [신규] 핵심 기대효과 지표
        impactMetrics: [
            { icon: '💰', text: '폐기물 처리비용', value: '15% 절감' },
            { icon: '♻️', text: '자원 재활용률', value: '30% 향상' },
            { icon: '🌍', text: '탄소 배출량', value: '5톤/년 감축' }
        ],

        // [신규] 성공 사례
        caseStudy: {
            company: 'A사 (동종업계)',
            summary: '본 캠페인 참여 후, 사내 폐기물 발생량이 20% 감소했으며, 친환경 기업 이미지로 채용 지원율이 10% 증가했습니다.'
        },

        // 기존 상세 정보
        purpose: '본 프로그램은 기업에서 발생하는 폐기물의 재활용률을 높이고, 자원순환 문화를 정착시켜 지속가능한 경영을 실천하는 것을 목적으로 합니다.',
        timeline: [
            { phase: '1단계 (진단 및 계획)', details: ['현장 방문 및 폐기물 현황 분석', '맞춤형 재활용 프로세스 설계'] },
            { phase: '2단계 (실행 및 교육)', details: ['재활용 수거 시스템 구축', '전직원 대상 분리배출 및 자원순환 교육'] },
            { phase: '3단계 (성과 측정)', details: ['폐기물 감축 및 재활용 성과 데이터화', '연간 성과 보고서 제공'] }
        ],
        deliverables: [
            '폐기물 감축량 및 재활용률 성과 보고서',
            '자원순환 활동에 대한 언론 홍보자료',
            '친환경 기업 인증 컨설팅 연계'
        ],
        dashboardPreview: 'images/dashboard_sample_placeholder.png',
        cost: 30000000, // 예시: 3,000만원
        //수정필요
    },
    
    {
        id: 'program-disability',
        title: '사회 - 장애인 파견',
        image: 'images/program_disabled.jpg',
        description: '장애인고용행정벌 해소 및 장애인 파견고용으로 지역협력 네트워크 구축',
        relatedTasks: [ '장애인 고용정책 강화 필요' ],
        brochureFile: 'brochures/program_waste_details.pdf',
        
        // 1. 파트너 정보 (신뢰도)
        partnerInfo: 'LocalLink 인증 사회적기업 [미래이엔티]',

        // 2. 핵심 기대효과 (매력도 - 정량)
        impactMetrics: [
            { icon: '💰', text: '폐기물 처리비용', value: '15% 절감', type: 'reduction' },
            { icon: '♻️', text: '자원 재활용률', value: '30% 향상', type: 'improvement' },
            { icon: '🌍', text: '탄소 배출량', value: '5톤/년 감축', type: 'reduction' }
        ],

        // 3. 성공 사례 (신뢰도/매력도)
        caseStudy: {
            company: 'A사 (동종업계)',
            summary: '본 캠페인 참여 후, 사내 폐기물 발생량이 20% 감소했으며, 친환경 기업 이미지로 채용 지원율이 10% 증가했습니다.'
        },
        
        // 4. 리뷰 정보 (미래 확장용)
        review: {
            rating: 4.8,
            count: 12
        },

        // ▼▼▼ 여기에 상세 정보를 위한 필드를 추가합니다 ▼▼▼
        purpose: '본 프로그램은 장애인 의무고용 제도 이행을 통한 행정적 부담 해소와 더불어, 장애인 고용을 통한 사회적 가치 창출 및 지역사회와의 상생 협력 네트워크 구축을 목적으로 합니다. 기업의 ESG 경영 실천 수준을 한 단계 높이고, 포용적인 조직 문화를 조성하는 데 기여합니다.',
        
        expectedEffects: [
            '행정규제(장애인 의무고용 미이행에 따른 부담금 등) 대응 및 리스크 완화',
            '장애인 고용을 통한 지역사회 기여 및 기업 이미지 제고',
            '다양성을 존중하는 포용적인 조직 문화 구축',
            '협력 단체와의 파트너십을 통한 사회적 네트워크 확장',
            '장애인 생산품 구매 연계 등 추가적인 사회적 가치 창출 가능'
        ],

        partners: [
            { name: '공감과연대', link: 'http://ggcoop.co.kr/' },
            { name: '기타 협력사', link: '#' }
        ],
        
        timeline: [
            { 
                phase: '1단계 (준비 및 협의): 약 1~2개월',
                details: [
                    '기업 현황 분석 및 장애인 적합 직무 발굴',
                    '협력 단체 매칭 및 파견 조건 협의',
                    '내부 직원 대상 장애인 인식 개선 교육 (필요시)'
                ]
            },
            {
                phase: '2단계 (파견 및 운영): 계약 기간에 따라 (예시:1년, 장기)',
                details: [
                    '장애인 근로자 파견 및 업무 배치',
                    '정기적인 직무 만족도 및 적응 상태 모니터링',
                    '장애인 생산품 구매 연계 등 추가 협력 활동 진행'
                ]
            },
            {
                phase: '3단계 (성과 측정 및 보고): 회계정산보고 기준 (예시:반기,1년)',
                details: [
                    '장애인 고용 유지율 및 만족도 평가',
                    '기업의 사회적 기여도 및 경제적 효과 분석',
                    '지속가능경영 보고서 반영을 위한 데이터 정리 및 제공'
                ]
            }
        ],

        deliverables: [
            '장애인 고용을 통한 행정 부담금 절감, 장애인고용 장려금 (해당 시)',
            '장애인 생산품 연계 구매 실적 (해당 시)',
            '기업의 사회적 책임 이행 사례 확보 (보고서 및 홍보자료)',
            '지속가능경영 DATA 확보 (장애인 고용률, 지역사회 기여 등)',
            '지역사회 내 긍정적 기업 이미지 및 네트워크 구축'
        ],

        dashboardPreview: 'images/dashboard_sample_placeholder.png',
        cost: 30000000, // 예시: 3,000만원
    },

    {
        id: 'program-community',
        title: '사회- 기타',
        image: 'images/program_etc.jpg',
        description: '기타 사회공헌 활동 제안 (상세 내용 준비 중)',
        link: '#',
        relatedTasks: [
            '지역사회 협력 강화 필요'
        ],
        cost: 30000000, // 예시: 3,000만원
    }
];