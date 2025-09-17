import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return;
    }

    const container = document.getElementById('dashboard-container');

    try {
        const [dashboardRes, regulationsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/users/me/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/admin/regulations`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        const dashboardResult = await dashboardRes.json();
        if (!dashboardResult.success) {
            container.innerHTML = `<h2>진행 중인 프로그램</h2><p>${dashboardResult.message || '데이터를 불러오는 데 실패했습니다.'}</p>`;
        } else {
            const dashboardData = dashboardResult.dashboard;
            renderScoreSection(dashboardData);
            renderProgramCards(dashboardData.programs);

            const modal = document.getElementById('milestone-modal');
            const modalContent = document.getElementById('modal-details-content');
            const closeModalBtn = modal.querySelector('.modal-close-btn');
            if (modal) {
                closeModalBtn.addEventListener('click', () => modal.style.display = 'none');
                window.addEventListener('click', (e) => {
                    if (e.target == modal) modal.style.display = 'none';
                });
                container.addEventListener('click', function(e) {
                    if (e.target.classList.contains('open-milestone-modal')) {
                        const progIdx = e.target.dataset.programIndex;
                        const mileIdx = e.target.dataset.milestoneIndex;
                        const milestone = dashboardData.programs[progIdx].timeline[mileIdx];
                        modalContent.innerHTML = `
                            <h2>${milestone.milestone_name}</h2>
                            ${milestone.image_url ? `<img src="${milestone.image_url}" alt="${milestone.milestone_name}" class="modal-image">` : ''}
                            <p>${(milestone.content || '상세 내용이 없습니다.').replace(/\n/g, '<br>')}</p>
                            ${milestone.attachment_url ? `<a href="${milestone.attachment_url}" target="_blank" download class="button button-primary">첨부 문서 다운로드</a>` : ''}
                        `;
                        modal.style.display = 'block';
                    }
                });
            }
        }

        const regulationsResult = await regulationsRes.json();
        if (regulationsResult.success) {
            renderRegulationTimeline(regulationsResult.regulations);
        } else {
            document.getElementById('regulation-timeline-container').innerHTML = `<p>${regulationsResult.message || '규제 정보를 불러오는 데 실패했습니다.'}</p>`;
        }

    } catch (error) {
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
    if (!gaugeElement || !tableContainer) return;

    // 백엔드가 미리 계산해준 점수들을 직접 사용합니다.
    const currentScores = data.realtimeScores || { e: 0, s: 0, g: 0, total: 0 };
    const improvementScores = data.improvementScores || { e: 0, s: 0, g: 0 };
    const expectedScores = data.expectedScores || { e: 0, s: 0, g: 0 };
    
    // 테이블에 표시할 프로그램 목록을 준비합니다.
    const activeProgramsForTable = [];
    if (data.programs) {
        const activePrograms = data.programs.filter(p => ['접수', '진행'].includes(p.status));
        activePrograms.forEach(p => {
            const category = (p.esg_category || '').toLowerCase();
            if (!activeProgramsForTable.find(item => item.category === category && item.title === p.program_title)) {
                activeProgramsForTable.push({ category, title: p.program_title });
            }
        });
    }

    const categories = { e: '환경(E)', s: '사회(S)', g: '지배구조(G)' };
    let tableHtml = `
        <table class="score-table">
            <thead>
                <tr>
                    <th>구분</th><th>현재 점수</th><th>신청 프로그램 (진행 중)</th><th>개선 점수</th><th>예상 점수</th>
                </tr>
            </thead>
            <tbody>
    `;
    for (const cat in categories) {
        const programsForCategory = activeProgramsForTable.filter(p => p.category === cat).map(p => `<li>${p.title}</li>`).join('');

        tableHtml += `
            <tr>
                <td class="category-header">${categories[cat]}</td>
                <td><strong>${(currentScores[cat] || 0).toFixed(1)}점</strong></td>
                <td><ul class="program-list">${programsForCategory.length > 0 ? programsForCategory : '<li>-</li>'}</ul></td>
                <td><span class="imp-score">+${(improvementScores[cat] || 0).toFixed(1)}점</span></td>
                <td><strong>${(expectedScores[cat] || 0).toFixed(1)}점</strong><span class="expected-grade">(${getRiskLevelInfo(expectedScores[cat] || 0).level} 등급)</span></td>
            </tr>
        `;
    }
    tableHtml += `</tbody></table>`;
    tableContainer.innerHTML = tableHtml;

    // ApexCharts 도넛 차트 그리기 (기존과 동일)
    if (typeof ApexCharts !== 'undefined') {
        const options = {
            series: [currentScores.e, currentScores.s, currentScores.g],
            chart: { type: 'donut', height: 280 },
            labels: ['환경(E)', '사회(S)', '지배구조(G)'],
            colors: ['#28a745', '#007bff', '#6f42c1'],
            plotOptions: {
                pie: {
                    donut: {
                        labels: {
                            show: true,
                            value: { formatter: (val) => `${parseFloat(val).toFixed(1)}점` },
                            total: { show: true, label: '현재 총점', formatter: () => `${currentScores.total.toFixed(1)}점` }
                        }
                    }
                }
            },
            legend: { show: false },
            tooltip: { y: { formatter: (val) => `${val.toFixed(1)}점` } },
        };
        gaugeElement.innerHTML = '';
        const chart = new ApexCharts(gaugeElement, options);
        chart.render();
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

    programs.forEach((program, programIndex) => {
        const steps = ['신청', '접수', '진행', '완료'];
        const currentStepIndex = steps.indexOf(program.status);
        const stepperHtml = steps.map((label, i) => `<div class="step ${i <= currentStepIndex ? 'completed' : ''}"><div class="step-icon">${i + 1}</div><div class="step-label">${label}</div></div>`).join('<div class="step-line"></div>');
        
        let milestonesHtml = '';
        if ((program.status === '진행' || program.status === '완료') && program.timeline && program.timeline.length > 0) {
            milestonesHtml = `
                <h5 class="milestone-section-title">세부 진행 내용</h5>
                <div class="milestones-wrapper">
                    ${program.timeline.map((milestone, index) => `
                        <div class="milestone-box ${milestone.is_completed ? 'completed' : ''}">
                            <div class="milestone-preview-image" style="background-image: url('${milestone.image_url || '/images/default_program.png'}')"></div>
                            <div class="milestone-preview-content">
                                <span class="milestone-title">${milestone.milestone_name}</span>
                                <p class="milestone-summary">${(milestone.content || '').substring(0, 40)}...</p>
                                <div class="milestone-actions">
                                    ${milestone.attachment_url ? `<a href="${milestone.attachment_url}" target="_blank" download class="button-sm">자료 다운로드</a>` : ''}
                                    <button class="button-sm button-primary open-milestone-modal" data-program-index="${programIndex}" data-milestone-index="${index}">자세히 보기</button>
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>`;
        }

        const reportButtonHtml = ['진행', '완료'].includes(program.status)
            ? `<button class="button-secondary button-sm report-btn" data-program-index="${programIndex}">임팩트 리포트</button>`
            : '';
        
        let impactHtml = '';
        const expected = program.expected_impact;
        const achieved = program.achieved_impact;

        if (expected && expected.scale_value) {
            const expectedScale = expected.scale_value || 0;
            const achievedScale = achieved?.achieved_scale_value || 0;
            const achievementRate = expectedScale > 0 ? (achievedScale / expectedScale) * 100 : 0;
            
            impactHtml = `
                <div class="impact-summary-container">
                    <h5>임팩트 현황</h5>
                    <div class="impact-item">
                        <span class="label">${expected.stakeholder_type || '주요 대상'} 달성률</span>
                        <span class="value">${achievementRate.toFixed(1)}%</span>
                    </div>
                    <div class="impact-progress">
                        <div class="progress-bar" style="width: ${achievementRate.toFixed(1)}%;"></div>
                    </div>
                    <small>${achievedScale.toLocaleString()} / ${expectedScale.toLocaleString()} ${expected.scale_unit || '명'} 달성</small>
                </div>
            `;
        }
        
        const card = document.createElement('div');
        card.className = 'program-status-card';
        card.innerHTML = `
            <div class="card-header">
                <h4>${program.program_title}</h4>
                <div class="button-group">
                    ${reportButtonHtml}
                </div>
            </div>
            <div class="card-body">
                ${program.admin_message ? `<div class="admin-message"><strong>담당자 메시지:</strong> ${program.admin_message}</div>` : ''}
                <h5>전체 진행 상태</h5>
                <div class="status-stepper">${stepperHtml}</div>
                ${impactHtml}
                ${milestonesHtml}
            </div>
        `;
        container.appendChild(card);
    });

    container.addEventListener('click', e => {
        if (e.target.classList.contains('report-btn')) {
            const programIndex = e.target.dataset.programIndex;
            generateAndPrintReport(programs[programIndex]);
        }
    });
}

function generateAndPrintReport(programData) {
    const { program_title, expected_impact, achieved_impact, timeline } = programData;
    
    const printWindow = window.open('', '_blank');
    printWindow.document.write('<html><head><title>임팩트 리포트 - ' + program_title + '</title>');
    // ★★★ 2-1. 리포트용 스타일 개선 및 인쇄 버튼 스타일 추가 ★★★
    printWindow.document.write(`
        <style> 
            body { font-family: sans-serif; margin: 20px; } 
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; } 
            th, td { border: 1px solid #ddd; padding: 12px; text-align: left;} 
            th { background-color: #f2f2f2; } 
            h1, h2 { color: #0056b3; border-bottom: 1px solid #ccc; padding-bottom: 10px;} 
            .sdg-image { width:80px; margin-right: 10px; vertical-align: middle; }
            .print-button { display: block; margin: 20px 0; padding: 10px 20px; background-color: #007bff; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
            @media print { .print-button { display: none; } }
            
            /* --- 마일스톤 카드 스타일 (Grid 적용) --- */
            .milestones-wrapper { 
                margin-top: 1rem;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
            }
            .milestone-box { 
                border: 1px solid #e0e0e0; 
                border-radius: 8px; 
                overflow: hidden; 
                page-break-inside: avoid; 
                display: flex;
                flex-direction: column;
            }
            .milestone-box.completed { border-left: 5px solid #28a745; }
            .milestone-preview-image { width: 100%; height: 150px; background-size: cover; background-position: center; background-color: #f0f0f0; }
            .milestone-preview-content { padding: 1rem; flex-grow: 1; }
            .milestone-title { font-weight: bold; font-size: 1.1rem; }
            .milestone-summary { font-size: 0.9rem; color: #666; margin: 0.5rem 0; white-space: pre-wrap; }
        </style>
    `);
    printWindow.document.write('</head><body>');

    // ★★★ 2-2. 자동 인쇄 대신, 클릭 시 인쇄되는 버튼 추가 ★★★
    printWindow.document.write(`<button class="print-button" onclick="window.print()">이 리포트 인쇄하기</button>`);
    printWindow.document.write(`<h1>${program_title} - 임팩트 리포트</h1>`);
    
    // 임팩트 요약
    printWindow.document.write('<h2>임팩트 요약</h2>');
    printWindow.document.write('<table><thead><tr><th>항목</th><th>예상</th><th>달성</th></tr></thead><tbody>');
    printWindow.document.write(`<tr><td>주요 대상</td><td>${expected_impact?.stakeholder_type || '-'}</td><td>-</td></tr>`);
    printWindow.document.write(`<tr><td>규모 (단위: ${expected_impact?.scale_unit || '명'})</td><td>${expected_impact?.scale_value || 0}</td><td>${achieved_impact?.achieved_scale_value || 0}</td></tr>`);
    printWindow.document.write(`<tr><td>기간 (일)</td><td>${expected_impact?.duration_days || '-'}</td><td>-</td></tr>`);
    printWindow.document.write('</tbody></table>');

    // SDGs 기여도
    if (expected_impact?.sdgs_goals?.length > 0) {
        printWindow.document.write('<h2>연관 SDGs 목표</h2><div>');
        expected_impact.sdgs_goals.forEach(goal => {
            printWindow.document.write(`<img src="/images/sdgs/SDG${goal}.png" class="sdg-image" alt="SDG ${goal}">`);
        });
        printWindow.document.write('</div>');
    }

    // ★★★ 1. 마일스톤 진행 현황을 카드 박스 형태로 복원 ★★★
    printWindow.document.write('<h2>마일스톤 진행 현황</h2>');
    if (timeline && timeline.length > 0) {
        const milestonesHtml = `
            <div class="milestones-wrapper">
                ${timeline.map(milestone => `
                    <div class="milestone-box ${milestone.is_completed ? 'completed' : ''}">
                        ${milestone.image_url ? `<div class="milestone-preview-image" style="background-image: url('${milestone.image_url}')"></div>` : ''}
                        <div class="milestone-preview-content">
                            <span class="milestone-title">${milestone.milestone_name}</span>
                            <p class="milestone-summary">${(milestone.content || '').replace(/\n/g, '<br>')}</p>
                            ${milestone.attachment_url ? `<p><a href="${milestone.attachment_url}" target="_blank">첨부 자료 보기</a></p>` : ''}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        printWindow.document.write(milestonesHtml);
    } else {
        printWindow.document.write('<p>설정된 세부 진행 내용이 없습니다.</p>');
    }

    // 관리자 메모
    if (achieved_impact?.notes) {
        printWindow.document.write('<h2>임펙트 요약</h2>');
        printWindow.document.write(`<p style="white-space: pre-wrap;">${achieved_impact.notes}</p>`);
    }

    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.focus(); 
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