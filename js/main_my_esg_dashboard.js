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
        renderCustomizedTimelines(dashboardData.customizedPrograms);
        renderAllApplicationsList(dashboardData.allApplications);

    } catch (error) {
        const container = document.getElementById('dashboard-container');
        if(container) container.innerHTML = `<h3>진행 중인 프로그램</h3><p>데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        console.error("대시보드 로딩 오류:", error);
    }
});

// ★★★ [신규] 점수에 따른 등급, 설명, 색상을 반환하는 함수 ★★★
function getRiskLevelInfo(score) {
    if (score >= 80) return { level: '우수', description: 'ESG 경영 수준이 매우 높아, 지속가능한 성장의 기회가 많습니다.', color: '#28a745' };
    if (score >= 60) return { level: '양호', description: 'ESG 경영 관리가 양호한 수준이나, 일부 개선이 필요합니다.', color: '#17a2b8' };
    if (score >= 40) return { level: '보통', description: 'ESG 관련 리스크 관리를 위한 개선 노력이 필요합니다.', color: '#ffc107' };
    return { level: '미흡', description: 'ESG 관련 규제 및 시장 요구에 대응하기 위한 적극적인 개선이 시급합니다.', color: '#dc3545' };
}

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

    // 1. 위험도 설명 및 점수 표시
    riskTitleElement.textContent = `${riskInfo.level} 등급`;
    riskTitleElement.style.color = riskInfo.color;
    riskDescElement.textContent = riskInfo.description;
    scoreTextElement.textContent = `${score.toFixed(1)}점`;
    initialScoreElement.textContent = (data.initialScore || 0).toFixed(1);
    improvementScoreElement.textContent = `+${data.improvementScore || 0}`;

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

        // ★★★ 2. 마우스 오버 시 예상 점수 계산 및 표시 기능 ★★★
        let potentialImprovement = 0;
        if (data.customizedPrograms) {
            data.customizedPrograms.forEach(program => {
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

        gaugeContainer.addEventListener('mouseover', () => {
            if (potentialImprovement > 0) {
                chart.updateSeries([expectedScore]); // 차트 바를 예상 점수까지 채움
                tooltipElement.innerHTML = `모든 프로그램 완료 시<br><strong>${expectedScore.toFixed(1)}점</strong> 예상`;
                tooltipElement.style.opacity = 1;
            }
        });

        gaugeContainer.addEventListener('mouseout', () => {
            chart.updateSeries([score]); // 마우스 떼면 원래 점수로 복귀
            tooltipElement.style.opacity = 0;
        });

    } else {
        console.warn('ApexCharts 라이브러리가 로드되지 않았습니다.');
    }
}

function renderCustomizedTimelines(programs) {
    const container = document.getElementById('dashboard-container');
    if (!container) return;
    container.innerHTML = '<h3>맞춤형 프로그램 진행 현황</h3>';

    if (!programs || programs.length === 0) {
        container.innerHTML += "<p>현재 진행 중인 맞춤형 프로그램이 없습니다.</p>";
        return;
    }

    programs.forEach(program => {
        const timelineHtml = program.timeline ? program.timeline.map(milestone => `
            <div class="step ${milestone.isCompleted ? 'completed' : 'pending'}">
                <div class="step-icon">${milestone.isCompleted ? '✔' : ''}</div>
                <div class="step-label">${milestone.milestoneName}</div>
                <div class="step-content">
                    <p>${milestone.content || ''}</p>
                    ${milestone.attachmentUrl ? `<a href="${milestone.attachmentUrl}" class="button-secondary button-sm" target="_blank" download>자료 다운로드</a>` : ''}
                </div>
            </div>
        `).join('<div class="step-line"></div>') : '<p>세부 진행 단계를 설정 중입니다.</p>';

        const card = document.createElement('div');
        card.className = 'program-status-card';
        card.innerHTML = `
            <div class="card-header"><h4>${program.program_title}</h4></div>
            <div class="card-body">
                ${program.admin_message ? `<div class="admin-message"><strong>담당자 메시지:</strong> ${program.admin_message}</div>` : ''}
                <h5>진행 단계</h5>
                <div class="status-stepper">${timelineHtml}</div>
            </div>
        `;
        container.appendChild(card);
    });
}

function renderAllApplicationsList(applications) {
    const container = document.getElementById('all-applications-list');
    if (!container) return;
    container.innerHTML = '<h3>전체 신청 내역</h3>';

    if (!applications || applications.length === 0) {
        container.innerHTML += "<p>아직 신청한 프로그램이 없습니다.</p>";
        return;
    }
    const table = document.createElement('table');
    table.className = 'styled-table';
    table.innerHTML = `
        <thead><tr><th>신청일</th><th>프로그램명</th><th>상태</th></tr></thead>
        <tbody>
            ${applications.map(app => `
                <tr>
                    <td>${new Date(app.created_at).toLocaleDateString()}</td>
                    <td>${app.program_title}</td>
                    <td><span class="status-badge status-${app.status}">${app.status}</span></td>
                </tr>
            `).join('')}
        </tbody>
    `;
    container.appendChild(table);
}
