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

function renderScoreAndGauge(data) {
    const gaugeElement = document.getElementById('realtime-score-gauge');
    const scoreTextElement = document.getElementById('realtime-score-text');
    const initialScoreElement = document.getElementById('initial-score');
    const improvementScoreElement = document.getElementById('improvement-score');

    if (!gaugeElement || !scoreTextElement || !initialScoreElement || !improvementScoreElement) return;

    const score = data.realtimeScore || 0;
    
    scoreTextElement.textContent = `${score.toFixed(1)}점`;
    initialScoreElement.textContent = (data.initialScore || 0).toFixed(1);
    improvementScoreElement.textContent = `+${data.improvementScore || 0}`;

    if (typeof ApexCharts !== 'undefined') {
        const options = {
            series: [score],
            chart: { type: 'radialBar', height: 250 },
            plotOptions: {
                radialBar: {
                    hollow: { size: '60%' },
                    dataLabels: { show: false }
                }
            },
            stroke: { lineCap: 'round' },
            labels: ['실시간 점수'],
            colors: [score >= 80 ? '#28a745' : score >= 60 ? '#17a2b8' : score >= 40 ? '#ffc107' : '#dc3545']
        };
        gaugeElement.innerHTML = '';
        const chart = new ApexCharts(gaugeElement, options);
        chart.render();
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
        // ★★★ 핵심 수정: is_completed 대신 isCompleted 사용, 파일 다운로드 링크 추가 ★★★
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
