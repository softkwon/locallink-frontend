import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/me/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.message);

        const dashboardData = result.dashboard;
        renderScoreSection(dashboardData);
        renderProgramCards(dashboardData.programs);
        
        const container = document.getElementById('dashboard-container');
        if (container) {
            container.addEventListener('click', function(e) {
                const milestoneHeader = e.target.closest('.milestone-header');
                if (milestoneHeader) {
                    const details = milestoneHeader.nextElementSibling;
                    details.classList.toggle('visible');
                }
            });
        }

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

// ★★★ [핵심 수정] 점수 섹션 전체를 그리는 함수 (전면 개편) ★★★
function renderScoreSection(data) {
    const gaugeElement = document.getElementById('realtime-score-gauge');
    const tableContainer = document.getElementById('score-details-table');
    const initialScoreDisplay = document.getElementById('initial-score-display');
    const improvementScoreDisplay = document.getElementById('improvement-score-display');

    if (!gaugeElement || !tableContainer || !initialScoreDisplay || !improvementScoreDisplay) {
        console.error("대시보드 UI의 필수 요소(element)를 찾을 수 없습니다. HTML 구조를 확인해주세요.");
        return;
    }

    const scores = data.realtimeScores;
    const riskInfo = getRiskLevelInfo(scores.total);

    // 1. 최초/개선 점수 표시
    initialScoreDisplay.textContent = `${data.initialScores.total.toFixed(1)}점`;
    improvementScoreDisplay.textContent = `+${data.improvementScores.total.toFixed(1)}점`;

    // 2. "진행 중"인 프로그램만 필터링 (★★★ '접수'와 '진행' 상태 모두 포함 ★★★)
    const programsByCategory = { e: [], s: [], g: [] };
    if (data.programs) {
        const activePrograms = data.programs.filter(p => ['접수', '진행'].includes(p.status));

        activePrograms.forEach(p => {
            const category = (p.esg_category || '').toLowerCase();
            if (programsByCategory[category]) {
                if (!programsByCategory[category].includes(p.program_title)) {
                    programsByCategory[category].push(p.program_title);
                }
            }
        });
    }

    // 3. 점수 분석 테이블 HTML 생성
    const categories = { e: '환경(E)', s: '사회(S)', g: '지배구조(G)' };
    let tableHtml = `
        <table class="score-table">
            <thead>
                <tr>
                    <th>구분</th>
                    <th>내 점수</th>
                    <th>신청 프로그램 (진행 중)</th>
                    <th>개선 점수</th>
                    <th>예상 점수</th>
                </tr>
            </thead>
            <tbody>
    `;
    for (const cat in categories) {
        // ★★★ 백엔드에서 계산해준 예상 점수(expectedScores)를 사용 ★★★
        const expectedScore = data.expectedScores[cat]; 
        const expectedGrade = getRiskLevelInfo(expectedScore).level;
        tableHtml += `
            <tr>
                <td class="category-header">${categories[cat]}</td>
                <td><strong>${scores[cat].toFixed(1)}점</strong></td>
                <td>
                    <ul class="program-list">
                        ${programsByCategory[cat].length > 0 ? programsByCategory[cat].map(title => `<li>${title}</li>`).join('') : '<li>-</li>'}
                    </ul>
                </td>
                <td><span class="imp-score">+${data.improvementScores[cat].toFixed(1)}점</span></td>
                <td>
                    <strong>${expectedScore.toFixed(1)}점</strong>
                    <span class="expected-grade">(${expectedGrade} 등급)</span>
                </td>
            </tr>
        `;
    }
    tableHtml += `</tbody></table>`;
    tableContainer.innerHTML = tableHtml;

    // 4. ApexCharts 도넛 차트 그리기
    if (typeof ApexCharts !== 'undefined') {
        const options = {
            series: [scores.e, scores.s, scores.g],
            chart: { type: 'donut', height: 280 },
            labels: ['환경(E)', '사회(S)', '지배구조(G)'],
            colors: ['#28a745', '#007bff', '#6f42c1'],
            plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: '총점', formatter: () => `${scores.total.toFixed(1)}점` } } } } },
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

        let milestonesHtml = '';
        if ((program.status === '진행' || program.status === '완료') && program.timeline && program.timeline.length > 0) {
            milestonesHtml = `
                <h5 class="milestone-section-title">세부 진행 내용</h5>
                <div class="milestones-wrapper">
                    ${program.timeline.map(milestone => `
                        <div class="milestone-box ${milestone.is_completed ? 'completed' : ''}">
                            <div class="milestone-header">
                                <span class="milestone-title">${milestone.milestone_name}</span>
                                <span class="milestone-status">${milestone.is_completed ? '✔ 완료' : '진행중'}</span>
                            </div>
                            <div class="milestone-details">
                                <p>${milestone.content || '세부 내용이 없습니다.'}</p>
                                ${milestone.attachment_url ? `<a href="${milestone.attachment_url}" target="_blank" download>자료 다운로드</a>` : ''}
                            </div>
                        </div>
                    `).join('')}
                </div>`;
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
                ${milestonesHtml}
            </div>
        `;
        container.appendChild(card);
    });
}
