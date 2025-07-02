// js/main_my_esg_dashboard.js (2025-06-29 18:40:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';


document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('locallink-token');
    const container = document.getElementById('dashboard-container');

    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return;
    }
    if (!container) return;

    try {
        // 백엔드에서 나의 신청 현황 데이터를 가져옵니다.
        const response = await fetch('${API_BASE_URL}/applications/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.message);
        
        renderDashboard(result.applications);

    } catch (error) {
        container.innerHTML = `<p>데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
    }
});

/**
 * 신청 현황 데이터로 대시보드 카드를 그리는 함수
 * @param {Array} applications - 사용자가 신청한 프로그램 목록
 */
function renderDashboard(applications) {
    const container = document.getElementById('dashboard-container');
    container.innerHTML = '';

    if (applications.length === 0) {
        container.innerHTML = "<p>아직 참여중인 프로그램이 없습니다. <a href='survey_step5_program_proposal.html'>ESG 프로그램 제안</a> 페이지에서 우리 회사에 맞는 프로그램을 찾아보세요.</p>";
        return;
    }

    // 각 신청 건에 대한 상세 정보를 가져오기 위해 Promise.all 사용
    const fetchPromises = applications.map(app => 
        fetch(`${API_BASE_URL}/programs/${app.program_id}`)
            .then(res => res.json())
    );

    Promise.all(fetchPromises)
        .then(results => {
            results.forEach((programResult, index) => {
                if (!programResult.success) return;
                
                const program = programResult.program;
                const application = applications[index]; // 현재 프로그램에 해당하는 신청 정보

                // 진행 단계 Stepper UI 생성
                const steps = ['신청', '접수', '진행', '완료'];
                const currentStepIndex = steps.indexOf(application.status);
                
                let stepperHtml = '';
                steps.forEach((label, i) => {
                    const stepNumber = i + 1;
                    let stepClass = '';
                    if (stepNumber <= currentStepIndex + 1) stepClass = 'active';
                    if (stepNumber === currentStepIndex + 1) stepClass += ' current';
                    
                    stepperHtml += `
                        <div class="step ${stepClass}">
                            <div class="step-icon">${stepNumber}</div>
                            <div class="step-label">${label}</div>
                        </div>
                    `;
                    if (i < steps.length - 1) {
                        stepperHtml += `<div class="step-line ${stepNumber < currentStepIndex + 1 ? 'active' : ''}"></div>`;
                    }
                });

                const card = document.createElement('div');
                card.className = 'program-status-card';
                card.innerHTML = `
                    <div class="card-header"><h4>${program.title}</h4></div>
                    <div class="card-body">
                        <h5>진행 현황</h5>
                        <div class="status-stepper">${stepperHtml}</div>
                        
                        </div>
                `;
                container.appendChild(card);
            });
        });
}