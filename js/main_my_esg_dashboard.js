import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return;
    }

    try {
        // 대시보드 정보와 규제 정보를 동시에 요청합니다.
        const [dashboardRes, regulationsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/users/me/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
            // ✅ [핵심 수정] API 주소에 '/admin'을 추가합니다.
            fetch(`${API_BASE_URL}/admin/regulations`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        // 1. 대시보드 데이터 처리
        const dashboardResult = await dashboardRes.json();
        if (!dashboardResult.success) {
            document.getElementById('dashboard-container').innerHTML = `<h2>진행 중인 프로그램</h2><p>${dashboardResult.message || '데이터를 불러오는 데 실패했습니다.'}</p>`;
        } else {
            const dashboardData = dashboardResult.dashboard;
            renderScoreSection(dashboardData);
            renderProgramCards(dashboardData.programs);

            // 모달 제어 로직
            const modal = document.getElementById('milestone-modal');
            const modalContent = document.getElementById('modal-details-content');
            const closeModalBtn = document.querySelector('.modal-close-btn');
            if (modal) {
                closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
                window.addEventListener('click', (e) => {
                    if (e.target == modal) modal.style.display = 'none';
                });
                const container = document.getElementById('dashboard-container');
                container.addEventListener('click', function(e) {
                    if (e.target.classList.contains('open-milestone-modal')) {
                        const progIdx = e.target.dataset.programIndex;
                        const mileIdx = e.target.dataset.milestoneIndex;
                        const milestone = dashboardData.programs[progIdx].timeline[mileIdx];
                        modalContent.innerHTML = `
                            <h2>${milestone.milestone_name}</h2>
                            ${milestone.image_url ? `<img src="${milestone.image_url}" alt="${milestone.milestone_name}" class="modal-image">` : ''}
                            <p>${milestone.content || '상세 내용이 없습니다.'}</p>
                            ${milestone.attachment_url ? `<a href="${milestone.attachment_url}" target="_blank" download class="button button-primary">첨부 문서 다운로드</a>` : ''}
                        `;
                        modal.style.display = 'block';
                    }
                });
            }
        }

        // 2. 규제 타임라인 데이터 처리
        const regulationsResult = await regulationsRes.json();
        if (regulationsResult.success) {
            renderRegulationTimeline(regulationsResult.regulations);
        } else {
            document.getElementById('regulation-timeline-container').innerHTML = `<p>${regulationsResult.message || '규제 정보를 불러오는 데 실패했습니다.'}</p>`;
        }

    } catch (error) {
        // 네트워크 오류 등 Promise.all 자체의 실패 처리
        const container = document.getElementById('dashboard-container');
        if(container) container.innerHTML = `<h3>오류 발생</h3><p>데이터를 불러오는 중 문제가 발생했습니다. 페이지를 새로고침 해주세요.</p>`;
        console.error("데이터 로딩 중 심각한 오류:", error);
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
    
    if (!gaugeElement || !tableContainer) {
        console.error("대시보드 UI의 필수 요소(element)를 찾을 수 없습니다. HTML 구조를 확인해주세요.");
        return;
    }

    const QUESTION_COUNTS = { e: 4, s: 6, g: 6 };
    const currentScores = data.realtimeScores;
    const rawTotalScores = data.rawTotalScores || {
        e: currentScores.e * QUESTION_COUNTS.e,
        s: currentScores.s * QUESTION_COUNTS.s,
        g: currentScores.g * QUESTION_COUNTS.g
    };

    const potentialByCategory = { e: 0, s: 0, g: 0 };
    const activeProgramsForTable = [];
    if (data.programs) {
        const activePrograms = data.programs.filter(p => ['접수', '진행'].includes(p.status));
        activePrograms.forEach(p => {
            const category = (p.esg_category || '').toLowerCase();
            if (potentialByCategory.hasOwnProperty(category)) {
                potentialByCategory[category] += p.potentialImprovement[category] || 0;
                if (!activeProgramsForTable.find(item => item.category === category && item.title === p.program_title)) {
                    activeProgramsForTable.push({ category, title: p.program_title });
                }
            }
        });
    }

    const expectedScoreByCategory = {};
    const improvementScoreByCategory = {};

    for (const cat in QUESTION_COUNTS) {
        const futureRawTotal = (rawTotalScores[cat] || 0) + (potentialByCategory[cat] || 0);
        expectedScoreByCategory[cat] = futureRawTotal / QUESTION_COUNTS[cat];
        improvementScoreByCategory[cat] = expectedScoreByCategory[cat] - currentScores[cat];
    }
    
    // 점수 분석 테이블 HTML 생성 
    const categories = { e: '환경(E)', s: '사회(S)', g: '지배구조(G)' };
    let tableHtml = `
        <table class="score-table">
            <thead>
                <tr>
                    <th>구분</th><th>내 점수</th><th>신청 프로그램 (진행 중)</th><th>개선 점수</th><th>예상 점수</th>
                </tr>
            </thead>
            <tbody>
    `;
    for (const cat in categories) {
        const expectedScore = expectedScoreByCategory[cat];
        const expectedGrade = getRiskLevelInfo(expectedScore).level;
        const improvementScore = improvementScoreByCategory[cat];
        const programsForCategory = activeProgramsForTable.filter(p => p.category === cat).map(p => `<li>${p.title}</li>`).join('');

        tableHtml += `
            <tr>
                <td class="category-header">${categories[cat]}</td>
                <td><strong>${currentScores[cat].toFixed(1)}점</strong></td>
                <td><ul class="program-list">${programsForCategory.length > 0 ? programsForCategory : '<li>-</li>'}</ul></td>
                <td><span class="imp-score">+${improvementScore.toFixed(1)}점</span></td>
                <td><strong>${expectedScore.toFixed(1)}점</strong><span class="expected-grade">(${expectedGrade} 등급)</span></td>
            </tr>
        `;
    }
    tableHtml += `</tbody></table>`;
    tableContainer.innerHTML = tableHtml;

    // ApexCharts 도넛 차트 그리기
    if (typeof ApexCharts !== 'undefined') {
        const options = {
            series: [currentScores.e, currentScores.s, currentScores.g],
            chart: { type: 'donut', height: 280 },
            labels: ['환경(E)', '사회(S)', '지배구조(G)'],
            colors: ['#28a745', '#007bff', '#6f42c1'],
            // 🚨 [1번 요청] plotOptions를 수정하여 차트의 '%'를 '점'으로 변경
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            // value formatter를 추가해 각 항목의 값을 점수로 표시
                            value: {
                                show: true,
                                formatter: function (val) {
                                    return `${parseFloat(val).toFixed(1)}점`;
                                }
                            },
                            // 중앙의 총점은 기존과 동일하게 표시
                            total: {
                                show: true,
                                label: '총점',
                                formatter: () => `${currentScores.total.toFixed(1)}점`
                            }
                        }
                    }
                }
            },
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
    container.innerHTML = '<h2>진행 중인 프로그램</h2>';

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
            // [수정] 마일스톤을 박스 형태로 렌더링
            milestonesHtml = `
                <h5 class="milestone-section-title">세부 진행 내용</h5>
                <div class="milestones-wrapper">
                    ${program.timeline.map((milestone, index) => `
                        <div class="milestone-box ${milestone.is_completed ? 'completed' : ''}">
                            <div class="milestone-preview-image" style="background-image: url('${milestone.image_url || 'placeholder.jpg'}')"></div>
                            <div class="milestone-preview-content">
                                <span class="milestone-title">${milestone.milestone_name}</span>
                                <p class="milestone-summary">${(milestone.content || '').substring(0, 40)}...</p>
                                <div class="milestone-actions">
                                    ${milestone.attachment_url ? `<a href="${milestone.attachment_url}" target="_blank" download class="button-sm">자료 다운로드</a>` : ''}
                                    <button class="button-sm button-primary open-milestone-modal" data-program-index="${programs.indexOf(program)}" data-milestone-index="${index}">자세히 보기</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }
        
        // ... (improvementHtml 로직은 기존과 동일) ...
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

function renderRegulationTimeline(regulations) {
    const container = document.getElementById('regulation-timeline-container');
    if (!container) return;

    container.innerHTML = '<div class="timeline-line"></div>';

    if (!regulations || regulations.length < 1) {
        container.innerHTML += '<p>현재 등록된 규제 정보가 없습니다.</p>';
        return;
    }

    // --- 1. 각 아이템의 이상적인 위치 계산 ---
    const dates = regulations.map(reg => new Date(reg.effective_date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const totalDuration = maxDate - minDate;

    let items = regulations.map((reg, index) => {
        const currentDate = new Date(reg.effective_date).getTime();
        let idealPosition = 0;
        if (totalDuration === 0) {
            idealPosition = (index + 1) / (regulations.length + 1) * 100;
        } else {
            idealPosition = ((currentDate - minDate) / totalDuration) * 100;
        }
        // [수정] 불필요한 placement 속성 제거
        return { ...reg, idealPosition, finalPosition: idealPosition };
    });

    // --- 2. 위치 보정 로직 (겹침 방지) ---
    const MIN_GAP_PERCENT = 12;
    items.sort((a, b) => a.idealPosition - b.idealPosition);

    for (let i = 1; i < items.length; i++) {
        const prevItem = items[i - 1];
        const currentItem = items[i];
        const gap = currentItem.finalPosition - prevItem.finalPosition;

        if (gap < MIN_GAP_PERCENT) {
            currentItem.finalPosition = prevItem.finalPosition + MIN_GAP_PERCENT;
        }
    }
    const lastPos = items[items.length - 1]?.finalPosition;
    if (lastPos > 100) {
        const scaleFactor = 100 / lastPos;
        items.forEach(item => item.finalPosition *= scaleFactor);
    }

    // --- 3. 최종 계산된 위치로 HTML 렌더링 ---
    const sizeMap = { 'large': '대기업', 'medium': '중견기업', 'small_medium': '중소기업', 'small_micro': '소기업/소상공인' };
    let timelineHtml = '';

    items.forEach(item => {
        const targetSizesKorean = (item.target_sizes || []).map(size => sizeMap[size] || size).join(', ');

        // [수정] 불필요한 placement 클래스 제거
        timelineHtml += `
            <div class="timeline-node" style="left: ${item.finalPosition}%;">
                <div class="timeline-dot"></div>
                <div class="timeline-label">
                    <span class="date">${new Date(item.effective_date).toLocaleDateString()}</span>
                    <span class="title">${item.regulation_name}</span>
                </div>
                <div class="timeline-details-box">
                    <h4>${item.regulation_name}</h4>
                    <p><strong>시행일:</strong> ${new Date(item.effective_date).toLocaleDateString()}</p>
                    <p><strong>적용 대상:</strong> ${targetSizesKorean}</p>
                    <hr>
                    <p><strong>설명:</strong> ${item.description || '-'}</p>
                    <p><strong>제재사항:</strong> ${item.sanctions || '-'}</p>
                    <p><strong>대응방안:</strong> ${item.countermeasures || '-'}</p>
                    ${item.link_url ? `<p><a href="${item.link_url}" target="_blank" class="details-link">자세히 보기</a></p>` : ''}
                </div>
            </div>
        `;
    });

    container.innerHTML += timelineHtml;
}