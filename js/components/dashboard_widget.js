function initializeDashboardWidget(containerSelector, programCountLimit = 0) {
    const container = document.querySelector(containerSelector);
    if (!container || typeof ESG_PROGRAM_LIST === 'undefined') return;
    if (localStorage.getItem('isLoggedIn') !== 'true') return;

    // localStorage에서 최신 활동 데이터 가져오기 (없으면 기본 mock 데이터 사용)
    const myProgramsData = JSON.parse(localStorage.getItem('myActivePrograms')) || MY_ACTIVE_PROGRAMS;

    const programsToDisplay = programCountLimit > 0 ? myProgramsData.slice(0, programCountLimit) : myProgramsData;

    if (programsToDisplay.length === 0) {
        container.innerHTML = "<p>아직 참여중인 프로그램이 없습니다. <a href='survey_step5_program_proposal.html'>ESG 프로그램 제안</a> 페이지에서 우리 회사에 맞는 프로그램을 찾아보세요.</p>";
        container.closest('.section, .info-section')?.style.display = 'block';
        return;
    }

    container.innerHTML = '';

    programsToDisplay.forEach(activeProgram => {
        const baseProgram = ESG_PROGRAM_LIST.find(p => p.id === activeProgram.programId);
        if (!baseProgram) return;

        // 스텝퍼(Stepper) UI 생성 로직
        let stepperHtml = '';
        if (activeProgram.status && activeProgram.status.steps) {
            const steps = activeProgram.status.steps;
            const currentStep = activeProgram.status.currentStep;
            steps.forEach((label, index) => {
                const stepNumber = index + 1;
                let stepClass = '';
                if (stepNumber < currentStep) stepClass = 'active';
                if (stepNumber === currentStep) stepClass = 'active current';
                
                stepperHtml += `
                    <div class="step ${stepClass}">
                        <div class="step-icon">${stepNumber}</div>
                        <div class="step-label">${label}</div>
                    </div>
                `;
                if (index < steps.length - 1) {
                    stepperHtml += `<div class="step-line ${stepClass}"></div>`;
                }
            });
        }

        const impactHtml = (activeProgram.impactSoFar || []).map(item => `...`).join(''); // 기존과 동일
        const card = document.createElement('div');
        card.className = 'program-status-card';
        card.innerHTML = `
            <div class="card-header"><h4>${baseProgram.title}</h4></div>
            <div class="card-body">
                <h5>진행 현황</h5>
                <div class="status-stepper">${stepperHtml}</div>
                <hr style="border:0; border-top: 1px solid #eee; margin: 20px 0;">
                <h5>최근 활동 소식 (${activeProgram.latestUpdate.date})</h5>
                <div class="latest-update">
                    <img src="${activeProgram.latestUpdate.image}" alt="활동 사진">
                    <p>${activeProgram.latestUpdate.text}</p>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
    
    container.closest('.section, .info-section')?.style.display = 'block';
}