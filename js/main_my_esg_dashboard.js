import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/me/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const dashboardData = result.dashboard;
        renderScoreAndGauge(dashboardData);
        renderProgramCards(dashboardData.programs);

    } catch (error) {
        const container = document.getElementById('dashboard-container');
        if(container) container.innerHTML = `<h3>진행 중인 프로그램</h3><p>${error.message}</p>`;
        console.error("대시보드 로딩 오류:", error);
    }
});

function getRiskLevelInfo(score) {
    if (score >= 80) return { level: '우수', description: 'ESG 경영 수준이 매우 높아, 지속가능한 성장의 기회가 많습니다.'};
    if (score >= 60) return { level: '양호', description: 'ESG 경영 관리가 양호한 수준이나, 일부 개선이 필요합니다.'};
    if (score >= 40) return { level: '보통', description: 'ESG 관련 리스크 관리를 위한 개선 노력이 필요합니다.'};
    return { level: '미흡', description: 'ESG 관련 규제 및 시장 요구에 대응하기 위한 적극적인 개선이 시급합니다.'};
}

function renderScoreAndGauge(data) {
    const gaugeElement = document.getElementById('realtime-score-gauge');
    const riskTitleElement = document.getElementById('risk-level-title');
    const riskDescElement = document.getElementById('risk-level-description');
    const esgScoresContainer = document.getElementById('esg-scores-container');

    if (!gaugeElement || !esgScoresContainer) return;

    const scores = data.realtimeScores;
    const riskInfo = getRiskLevelInfo(scores.total);

    riskTitleElement.textContent = `${riskInfo.level} 등급`;
    riskDescElement.textContent = riskInfo.description;

    esgScoresContainer.innerHTML = `
        <div class="score-item"><span class="color-dot e"></span>환경(E): <strong>${scores.e.toFixed(1)}</strong>점</div>
        <div class="score-item"><span class="color-dot s"></span>사회(S): <strong>${scores.s.toFixed(1)}</strong>점</div>
        <div class="score-item"><span class="color-dot g"></span>지배구조(G): <strong>${scores.g.toFixed(1)}</strong>점</div>
    `;

    if (typeof ApexCharts !== 'undefined') {
        const options = {
            series: [scores.e, scores.s, scores.g],
            chart: { type: 'donut', height: 280 },
            labels: ['환경(E)', '사회(S)', '지배구조(G)'],
            colors: ['#28a745', '#007bff', '#6f42c1'],
            plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: '총점', formatter: (w) => `${w.globals.seriesTotals.reduce((a, b) => a + b, 0).toFixed(1)}점` } } } } },
            legend: { show: false },
            tooltip: { y: { formatter: (val) => `${val.toFixed(1)}점` } },
            responsive: [{ breakpoint: 480, options: { chart: { width: 200 } } }]
        };
        
        gaugeElement.innerHTML = '';
        const chart = new ApexCharts(gaugeElement, options);
        chart.render();
    } else {
        console.warn('ApexCharts 라이브러리가 로드되지 않았습니다.');
    }
}

function renderProgramCards(programs) {
    const container = document.getElementById('dashboard-container');
    if (!container) return;
    container.innerHTML = '<h3>진행 중인 프로그램</h3>';

    if (!programs || programs.length === 0) {
        container.innerHTML += "<p>현재 진행 중인 프로그램이 없습니다.</p>";
        return;
    }

    programs.forEach(program => {
        const steps = ['신청', '접수', '진행', '완료'];
        const currentStepIndex = steps.indexOf(program.status);
        const stepperHtml = steps.map((label, i) => `<div class="step ${i <= currentStepIndex ? 'completed' : ''}"><div class="step-icon">${i + 1}</div><div class="step-label">${label}</div></div>`).join('<div class="step-line"></div>');

        let milestoneTableHtml = '';
        if ((program.status === '진행' || program.status === '완료') && program.timeline && program.timeline.length > 0) {
            milestoneTableHtml = `
                <h5 class="milestone-table-title">세부 진행 내용</h5>
                <table class="milestone-table">
                    <thead><tr><th>진행 단계</th><th>상세 내용 및 자료</th><th>상태</th></tr></thead>
                    <tbody>
                        ${program.timeline.map(milestone => `
                            <tr>
                                <td>${milestone.milestone_name}</td>
                                <td>
                                    <p>${milestone.content || ''}</p>
                                    ${milestone.attachment_url ? `<img src="${milestone.attachment_url}" alt="첨부 이미지" class="milestone-image">` : ''}
                                </td>
                                <td>${milestone.is_completed ? '<span class="status-badge status-completed">완료</span>' : '<span class="status-badge status-pending">진행중</span>'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        }
        
        const improvement = program.potentialImprovement;
        let improvementHtml = '';
        if (improvement && improvement.total > 0) {
            const e_imp = improvement.e > 0 ? `<span class="imp-e" title="환경 점수 ${improvement.e.toFixed(1)}점 개선">+${improvement.e.toFixed(1)}</span>` : '';
            const s_imp = improvement.s > 0 ? `<span class="imp-s" title="사회 점수 ${improvement.s.toFixed(1)}점 개선">+${improvement.s.toFixed(1)}</span>` : '';
            const g_imp = improvement.g > 0 ? `<span class="imp-g" title="지배구조 점수 ${improvement.g.toFixed(1)}점 개선">+${improvement.g.toFixed(1)}</span>` : '';
            improvementHtml = `<div class="improvement-preview"><strong>완료 시 개선 예상:</strong> ${e_imp} ${s_imp} ${g_imp}</div>`;
        }

        const card = document.createElement('div');
        card.className = 'program-status-card';
        card.innerHTML = `
            <div class="card-header"><h4>${program.program_title}</h4>${improvementHtml}</div>
            <div class="card-body">
                ${program.admin_message ? `<div class="admin-message"><strong>담당자 메시지:</strong> ${program.admin_message}</div>` : ''}
                <h5>전체 진행 상태</h5>
                <div class="status-stepper">${stepperHtml}</div>
                ${milestoneTableHtml}
            </div>
        `;
        container.appendChild(card);
    });
}
