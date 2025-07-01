const MY_ACTIVE_PROGRAMS = [
    {
        programId: 'program-disability',
        applicationDate: '2025-06-10',
        status: {
            currentStep: 3, // 현재 진행 단계 (1부터 시작)
            steps: [
                '신청 완료',
                '담당자 배정',
                '프로그램 진행 중',
                '결과 보고서 발행'
            ],
            history: [
                { step: 1, date: '2025-06-10', notes: '프로그램 신청서가 정상적으로 접수되었습니다.' },
                { step: 2, date: '2025-06-11', notes: '김민준 매니저가 배정되었습니다. 곧 연락드릴 예정입니다.' },
                { step: 3, date: '2025-06-15', notes: '1차 활동(장애인 근로자 2명 파견)이 시작되었습니다.' }
            ]
        },
        progressPercentage: 60,
        latestUpdate: {
            date: '2025-06-15',
            text: '2분기 장애인 근로자 2명 파견 및 직무 교육을 성공적으로 완료했습니다.',
            image: 'images/update_photo1.jpg'
        },
        impactSoFar: [
            { icon: '👥', label: '신규 고용 창출', value: '2명' },
            { icon: '💰', label: '예상 부담금 절감', value: '1,480만원' }
        ]
    }
];