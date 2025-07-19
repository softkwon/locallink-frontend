
import { API_BASE_URL } from './config.js';

// --- 페이지가 로드되면 실행 ---
document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return;
    }

    try {
        // 1. 새로운 대시보드 API를 호출합니다.
        const response = await fetch(`${API_BASE_URL}/users/me/dashboard`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success) throw new Error(result.message);

        const dashboardData = result.dashboard;

        // 2. 받아온 데이터로 화면의 각 부분을 그립니다.
        renderScoreAndGauge(dashboardData);
        renderProgramTimelines(dashboardData.activePrograms);

    } catch (error) {
        const container = document.getElementById('dashboard-container');
        if(container) container.innerHTML = `<p>데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        console.error("대시보드 로딩 오류:", error);
    }
});

/**
 * 점수와 위험도 계기판을 화면에 그리는 함수
 * @param {object} data - 대시보드 데이터 (realtimeScore, initialScore, improvementScore)
 */
function renderScoreAndGauge(data) {
    const gaugeElement = document.getElementById('realtime-score-gauge');
    const scoreTextElement = document.getElementById('realtime-score-text');
    const initialScoreElement = document.getElementById('initial-score');
    const improvementScoreElement = document.getElementById('improvement-score');

    if (!gaugeElement || !scoreTextElement || !initialScoreElement || !improvementScoreElement) return;

    const score = data.realtimeScore || 0;
    
    // 텍스트로 점수 표시
    scoreTextElement.textContent = `${score.toFixed(1)}점`;
    initialScoreElement.textContent = (data.initialScore || 0).toFixed(1);
    improvementScoreElement.textContent = `+${data.improvementScore || 0}`;

    // 위험도 계기판 UI 업데이트 (ApexCharts 라이브러리 예시)
    // ※ 이 코드를 사용하려면 HTML에 ApexCharts 라이브러리를 추가해야 합니다.
    // <script src="https://cdn.jsdelivr.net/npm/apexcharts"></script>
    const options = {
        series: [score],
        chart: { type: 'radialBar', height: 250 },
        plotOptions: {
            radialBar: {
                hollow: { size: '60%' },
                dataLabels: {
                    show: false // 점수는 별도 텍스트로 표시하므로 차트 내부는 숨김
                }
            }
        },
        stroke: { lineCap: 'round' },
        labels: ['실시간 점수'],
        colors: [score >= 80 ? '#28a745' : score >= 60 ? '#17a2b8' : score >= 40 ? '#ffc107' : '#dc3545']
    };

    gaugeElement.innerHTML = ''; // 이전 차트 초기화
    const chart = new ApexCharts(gaugeElement, options);
    chart.render();
}

/**
 * 진행 중인 프로그램 타임라인 목록을 화면에 그리는 함수
 * @param {Array} programs - 진행 중인 프로그램 목록 (내부에 timeline 배열 포함)
 */
function renderProgramTimelines(programs) {
    const container = document.getElementById('dashboard-container');
    if (!container) return;

    container.innerHTML = '<h3>진행 중인 프로그램</h3>';

    if (programs.length === 0) {
        container.innerHTML += "<p>아직 참여중인 프로그램이 없습니다.</p>";
        return;
    }

    programs.forEach(program => {
        // 1. 각 마일스톤(단계)의 HTML을 생성합니다.
        const timelineHtml = program.timeline.map(milestone => `
            <div class="step ${milestone.isCompleted ? 'completed' : 'pending'}">
                <div class="step-icon">${milestone.isCompleted ? '✔' : ''}</div>
                <div class="step-label">${milestone.milestoneName}</div>
            </div>
        `).join('<div class="step-line"></div>'); // 단계 사이에 연결선 추가

        // 2. 프로그램 카드 전체 HTML을 만듭니다.
        const card = document.createElement('div');
        card.className = 'program-status-card';
        card.innerHTML = `
            <div class="card-header">
                <h4>${program.program_title}</h4>
            </div>
            <div class="card-body">
                ${program.admin_message ? `<div class="admin-message"><strong>담당자 메시지:</strong> ${program.admin_message}</div>` : ''}
                <h5>진행 현황</h5>
                <div class="status-stepper">${timelineHtml}</div>
            </div>
        `;
        container.appendChild(card);
    });
}