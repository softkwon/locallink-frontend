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
        if(container) container.innerHTML = `<h3>진행 중인 프로그램</h3><p>데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        console.error("대시보드 로딩 오류:", error);
    }
});

/**
 * 점수에 따른 등급, 설명, 색상을 반환하는 함수
 * @param {number} score - ESG 점수
 * @returns {object} - 등급, 설명, 색상 정보
 */
function getRiskLevelInfo(score) {
    if (score >= 80) return { level: '우수', description: 'ESG 경영 수준이 매우 높아, 지속가능한 성장의 기회가 많습니다.', color: '#28a745' };
    if (score >= 60) return { level: '양호', description: 'ESG 경영 관리가 양호한 수준이나, 일부 개선이 필요합니다.', color: '#17a2b8' };
    if (score >= 40) return { level: '보통', description: 'ESG 관련 리스크 관리를 위한 개선 노력이 필요합니다.', color: '#ffc107' };
    return { level: '미흡', description: 'ESG 관련 규제 및 시장 요구에 대응하기 위한 적극적인 개선이 시급합니다.', color: '#dc3545' };
}

/**
 * 점수와 위험도 계기판을 화면에 그리는 함수
 * @param {object} data - 대시보드 전체 데이터
 */
function renderScoreAndGauge(data) {
    const gaugeContainer = document.getElementById('gauge-container');
    const gaugeElement = document.getElementById('realtime-score-gauge');
    const scoreTextElement = document.getElementById('realtime-score-text');
    const initialScoreElement = document.getElementById('initial-score');
    const improvementScoreElement = document.getElementById('improvement-score');
    const riskTitleElement = document.getElementById('risk-level-title');
    const riskDescElement = document.getElementById('risk-level-description');
    const tooltipElement = document.getElementById('gauge-tooltip');

    if (!gaugeContainer) return;

    const score = data.realtimeScore || 0;
    const riskInfo = getRiskLevelInfo(score);

    // 1. 위험도 설명 및 점수 텍스트 표시
    riskTitleElement.textContent = `${riskInfo.level} 등급`;
    riskTitleElement.style.color = riskInfo.color;
    riskDescElement.textContent = riskInfo.description;
    scoreTextElement.textContent = `${score.toFixed(1)}점`;
    initialScoreElement.textContent = (data.initialScore || 0).toFixed(1);
    improvementScoreElement.textContent = `+${data.improvementScore || 0}`;

    // 2. ApexCharts 라이브러리로 계기판 그리기
    if (typeof ApexCharts !== 'undefined') {
        const options = {
            series: [score],
            chart: { type: 'radialBar', height: 250 },
            plotOptions: { radialBar: { hollow: { size: '60%' }, dataLabels: { show: false } } },
            stroke: { lineCap: 'round' },
            labels: ['실시간 점수'],
            colors: [riskInfo.color]
        };
        
        gaugeElement.innerHTML = '';
        const chart = new ApexCharts(gaugeElement, options);
        chart.render();

        // 3. 마우스 오버 시 예상 점수 계산 및 표시 기능
        let potentialImprovement = 0;
        if (data.programs) {
            data.programs.forEach(program => {
                if (program.timeline) {
                    program.timeline.forEach(milestone => {
                        if (!milestone.isCompleted) {
                            potentialImprovement += milestone.scoreValue || 0;
                        }
                    });
                }
            });
        }
        const expectedScore = score + potentialImprovement;

        gaugeContainer.addEventListener('mouseenter', () => {
            if (potentialImprovement > 0) {
                chart.updateSeries([expectedScore]);
                tooltipElement.innerHTML = `모든 프로그램 완료 시<br><strong>${expectedScore.toFixed(1)}점</strong> 예상`;
                tooltipElement.style.opacity = 1;
            }
        });

        gaugeContainer.addEventListener('mouseleave', () => {
            chart.updateSeries([score]);
            tooltipElement.style.opacity = 0;
        });

    } else {
        console.warn('ApexCharts 라이브러리가 로드되지 않았습니다.');
    }
}

/**
 * 프로그램 카드 전체를 그리는 함수 (모든 기능 통합)
 * @param {Array} programs - 사용자가 신청한 프로그램 목록
 */
function renderProgramCards(programs) {
    const container = document.getElementById('dashboard-container');
    if (!container) return;
    container.innerHTML = '<h3>진행 중인 프로그램</h3>';

    if (!programs || programs.length === 0) {
        container.innerHTML += "<p>현재 진행 중인 프로그램이 없습니다.</p>";
        return;
    }

    programs.forEach(program => {
        // --- 1. 상태(Status) 스텝퍼 UI 생성 ---
        const steps = ['신청', '접수', '진행', '완료'];
        const currentStepIndex = steps.indexOf(program.status);
        const stepperHtml = steps.map((label, i) => {
            const stepClass = i <= currentStepIndex ? 'completed' : '';
            return `<div class="step ${stepClass}">
                        <div class="step-icon">${i + 1}</div>
                        <div class="step-label">${label}</div>
                    </div>`;
        }).join('<div class="step-line"></div>');

        // --- 2. 상세 마일스톤 테이블 UI 생성 (상태가 '진행' 또는 '완료'일 때만) ---
        let milestoneTableHtml = '';
        if ((program.status === '진행' || program.status === '완료') && program.timeline && program.timeline.length > 0) {
            milestoneTableHtml = `
                <h5 class="milestone-table-title">세부 진행 내용</h5>
                <table class="milestone-table">
                    <thead>
                        <tr>
                            <th>진행 단계</th>
                            <th>상세 내용 및 자료</th>
                            <th>상태</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${program.timeline.map(milestone => `
                            <tr>
                                <td>${milestone.milestoneName}</td>
                                <td>
                                    <p>${milestone.content || ''}</p>
                                    ${milestone.attachmentUrl ? `<img src="${milestone.attachmentUrl}" alt="첨부 이미지" class="milestone-image">` : ''}
                                </td>
                                <td>${milestone.isCompleted ? '<span class="status-badge status-completed">완료</span>' : '<span class="status-badge status-pending">진행중</span>'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`;
        }
        
        // --- 3. 최종 카드 HTML 조합 ---
        const card = document.createElement('div');
        card.className = 'program-status-card';
        card.innerHTML = `
            <div class="card-header"><h4>${program.program_title}</h4></div>
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
