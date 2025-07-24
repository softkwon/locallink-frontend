// js/survey_step5_program_proposal.js (2025-07-24 최종 기능 통합본)

import { API_BASE_URL, STATIC_BASE_URL } from './config.js'; 

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const token = localStorage.getItem('locallink-token');
    const diagId = new URLSearchParams(window.location.search).get('diagId');
    const mainContainer = document.querySelector('main.container');
    const recommendedContainer = document.getElementById('recommended-programs-container');
    const regionalContainer = document.getElementById('regional-programs-container');
    const allProgramsContainer = document.getElementById('all-programs-container');

    let allProgramsCache = [];
    let initialScores = null;

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!mainContainer || !diagId || !token) {
            mainContainer.innerHTML = '<h2>잘못된 접근입니다.</h2><p>Step4 페이지를 통해 접근해주세요.</p>';
            return;
        }
        setupHeaderLinks();
        await loadAndRenderAll();
        attachEventListeners();
    }

    // --- 3. 데이터 로딩 및 전체 화면 렌더링 ---
    async function loadAndRenderAll() {
        try {
            const [programsRes, dashboardRes, userRes] = await Promise.all([
                fetch(`${API_BASE_URL}/programs`),
                fetch(`${API_BASE_URL}/users/me/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const programsResult = await programsRes.json();
            if (!programsResult.success) throw new Error('프로그램 목록 로딩 실패');
            allProgramsCache = programsResult.programs;

            const dashboardResult = await dashboardRes.json();
            if (dashboardResult.success) {
                initialScores = dashboardResult.dashboard.realtimeScores;
            } else {
                initialScores = { e: 50, s: 50, g: 50, total: 50 };
            }

            const statusRes = await fetch(`${API_BASE_URL}/users/me/diagnosis-status?diagId=${diagId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            let diagnosisStatus = { recommended_program_ids: [] };
            if (statusRes.ok) {
                const statusResult = await statusRes.json();
                if (statusResult.success) diagnosisStatus = statusResult;
            }

            let userRegion = null;
            if (userRes.ok) {
                const userResult = await userRes.json();
                if(userResult.success) userRegion = userResult.user.business_location;
            }

            const recommendedIds = new Set(diagnosisStatus.recommended_program_ids || []);
            const recommendedPrograms = allProgramsCache.filter(p => recommendedIds.has(p.id));
            const regionalPrograms = allProgramsCache.filter(p => !recommendedIds.has(p.id) && p.service_regions && userRegion && (p.service_regions.includes(userRegion) || p.service_regions.includes('전국')));
            const regionalIds = new Set(regionalPrograms.map(p => p.id));
            const otherPrograms = allProgramsCache.filter(p => !recommendedIds.has(p.id) && !regionalIds.has(p.id));
            
            renderProgramSection(recommendedContainer, recommendedPrograms, "진단 결과에 따른 맞춤 추천 프로그램이 없습니다.");
            renderProgramSection(regionalContainer, regionalPrograms, "우리 회사 지역에 맞는 프로그램이 없습니다.");
            renderProgramSection(allProgramsContainer, otherPrograms.slice(0, 3), "다른 프로그램이 없습니다.");
            
            updateSimulator();
            
        } catch (error) {
            if(recommendedContainer) recommendedContainer.innerHTML = `<p>데이터 로딩 오류: ${error.message}</p>`;
            console.error("Step5 로딩 오류:", error);
        }
    }

    // --- 4. 렌더링 함수들 ---

    function renderProgramSection(container, programs, emptyMessage) {
        if (!container) return;
        container.innerHTML = '';
        if (!programs || programs.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#666;">${emptyMessage}</p>`;
            return;
        }
        const myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
        const planIds = new Set(myPlan.map(p => p.id));
        programs.forEach(program => {
            let image = '/images/default_program.png';
            const firstImage = program.content && program.content[0]?.images?.length > 0 ? program.content[0].images[0] : null;
            if (firstImage) image = firstImage.startsWith('http') ? firstImage : `${STATIC_BASE_URL}/${firstImage}`;
            const programBox = document.createElement('div');
            programBox.className = 'program-box';
            const isInPlan = planIds.has(program.id);
            programBox.innerHTML = `
                <div class="program-link-wrapper" data-program-id="${program.id}" style="cursor: pointer; text-decoration:none; color:inherit; display:flex; flex-direction:column; flex-grow:1;">
                    <img src="${image}" alt="${program.title}">
                    <h5>${program.title}</h5>
                    <p>${program.program_overview || '상세 내용을 확인하세요.'}</p>
                </div>
                <div class="program-actions">
                    <button type="button" class="${isInPlan ? 'button-primary' : 'button-secondary'} button-sm add-to-plan-btn" data-program-id="${program.id}" data-program-title="${program.title}">${isInPlan ? '플랜에서 제거' : '내 플랜에 담기'}</button>
                    <button type="button" class="button-primary button-sm apply-btn" data-program-id="${program.id}" data-program-title="${program.title}">신청하기</button>
                </div>
            `;
            container.appendChild(programBox);
        });
    }

    function renderScoreSimulator(currentScores, planPrograms) {
        const gaugeEl = document.getElementById('score-simulator-gauge');
        const tableEl = document.getElementById('score-simulator-table');
        if (!gaugeEl || !tableEl) return;
        
        // [수정] 나눗셈 기준값 추가
        const QUESTION_COUNTS = { e: 4, s: 6, g: 6 };
        const programsByCategory = { e: [], s: [], g: [] };
        const rawImprovement = { e: 0, s: 0, g: 0 };

        planPrograms.forEach(p => {
            rawImprovement.e += parseFloat(p.potential_e) || 0;
            rawImprovement.s += parseFloat(p.potential_s) || 0;
            rawImprovement.g += parseFloat(p.potential_g) || 0;
            
            const categoryKey = (p.esg_category || '').trim().toLowerCase();
            if (programsByCategory[categoryKey]) {
                programsByCategory[categoryKey].push({id: p.id, title: p.title});
            }
        });

        // [수정] 화면에 표시될 개선점수는 총합을 문항 수로 나눈 평균값
        const improvement = {
            e: QUESTION_COUNTS.e > 0 ? rawImprovement.e / QUESTION_COUNTS.e : 0,
            s: QUESTION_COUNTS.s > 0 ? rawImprovement.s / QUESTION_COUNTS.s : 0,
            g: QUESTION_COUNTS.g > 0 ? rawImprovement.g / QUESTION_COUNTS.g : 0
        };

        const expected = {
            e: currentScores.e + improvement.e,
            s: currentScores.s + improvement.s,
            g: currentScores.g + improvement.g
        };
        expected.total = (expected.e + expected.s + expected.g) / 3;

        const renderProgramList = (category) => {
            if (programsByCategory[category].length === 0) return '-';
            return `<div class="plan-program-list">
                ${programsByCategory[category].map(p => `
                    <div class="plan-program-item">
                        <span>${p.title}</span>
                        <button type="button" class="remove-from-plan-btn-sm remove-from-plan-btn" data-program-id="${p.id}" title="플랜에서 제거">&times;</button>
                    </div>
                `).join('')}
            </div>`;
        };

        let tableHtml = `<table class="score-table">
            <thead><tr><th>구분</th><th>플랜에 담은 프로그램</th><th>현재 점수</th><th>개선 점수</th><th>예상 점수</th></tr></thead>
            <tbody>
                <tr><td>환경(E)</td><td>${renderProgramList('e')}</td><td>${currentScores.e.toFixed(1)}점</td><td class="imp-score">+${improvement.e.toFixed(1)}점</td><td><strong>${expected.e.toFixed(1)}점</strong> <span class="expected-grade">(${getRiskLevelInfo(expected.e).level})</span></td></tr>
                <tr><td>사회(S)</td><td>${renderProgramList('s')}</td><td>${currentScores.s.toFixed(1)}점</td><td class="imp-score">+${improvement.s.toFixed(1)}점</td><td><strong>${expected.s.toFixed(1)}점</strong> <span class="expected-grade">(${getRiskLevelInfo(expected.s).level})</span></td></tr>
                <tr><td>지배구조(G)</td><td>${renderProgramList('g')}</td><td>${currentScores.g.toFixed(1)}점</td><td class="imp-score">+${improvement.g.toFixed(1)}점</td><td><strong>${expected.g.toFixed(1)}점</strong> <span class="expected-grade">(${getRiskLevelInfo(expected.g).level})</span></td></tr>
            </tbody>
        </table>`;
        tableEl.innerHTML = tableHtml;

        const options = {
            series: [expected.e, expected.s, expected.g],
            chart: { type: 'donut', height: 280 },
            labels: ['환경(E)', '사회(S)', '지배구조(G)'],
            colors: ['#28a745', '#007bff', '#6f42c1'],
            plotOptions: { pie: { donut: { labels: { show: true, total: { show: true, label: '예상 총점', formatter: () => `${expected.total.toFixed(1)}점` } } } } },
            legend: { show: false }
        };
        gaugeEl.innerHTML = '';
        const chart = new ApexCharts(gaugeEl, options);
        chart.render();
    }

    function updateSimulator() {
        if (!initialScores) return;
        const myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
        const planProgramIds = new Set(myPlan.map(p => p.id));
        const planPrograms = allProgramsCache.filter(p => planProgramIds.has(p.id));
        
        renderScoreSimulator(initialScores, planPrograms);
        
        document.querySelectorAll('.add-to-plan-btn').forEach(btn => {
            const programId = parseInt(btn.dataset.programId, 10);
            if (planProgramIds.has(programId)) {
                btn.textContent = '플랜에서 제거';
                btn.classList.replace('button-secondary', 'button-primary');
            } else {
                btn.textContent = '내 플랜에 담기';
                btn.classList.replace('button-primary', 'button-secondary');
            }
        });
    }

    // --- 5. 헬퍼 함수 및 이벤트 리스너 ---
    function getRiskLevelInfo(score) {
        if (score >= 80) return { level: '우수' }; if (score >= 60) return { level: '양호' };
        if (score >= 40) return { level: '보통' }; return { level: '미흡' };
    }
    
    function setupHeaderLinks() {
        const navStrategyLink = document.getElementById('navStrategyLink');
        if (navStrategyLink && diagId) {
            navStrategyLink.href = `survey_step4_esg_strategy.html?diagId=${diagId}`;
        }
    }

    function attachEventListeners() {
        document.addEventListener('click', async e => {
            const target = e.target;
            
            const cardWrapper = target.closest('.program-link-wrapper');
            if (cardWrapper) {
                const programId = cardWrapper.dataset.programId;
                const url = `esg_program_detail.html?id=${programId}&diagId=${diagId}`;
                window.open(url, 'programDetailWindow', 'width=1024,height=768,scrollbars=yes,resizable=yes');
                return; 
            }
            
            const button = target.closest('button');
            if (!button) return;

            if (button.classList.contains('add-to-plan-btn') || button.classList.contains('remove-from-plan-btn')) {
                const programId = parseInt(button.dataset.programId, 10);
                const program = allProgramsCache.find(p => p.id === programId);
                if (!program) return;

                let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
                if (myPlan.some(p => p.id === programId)) {
                    myPlan = myPlan.filter(p => p.id !== programId);
                    alert(`'${program.title}' 프로그램을 내 플랜에서 제거했습니다.`);
                } else {
                    myPlan.push({ id: programId, title: program.title });
                    alert(`'${program.title}' 프로그램이 내 플랜에 추가되었습니다.`);
                }
                localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
                updateSimulator();
            }
            else if (button.id === 'openSimulatorBtn') {
                try {
                    const response = await fetch(`${API_BASE_URL}/diagnoses/${diagId}/results`, { headers: { 'Authorization': `Bearer ${token}` } });
                    const result = await response.json();
                    if (result.success) {
                        sessionStorage.setItem('latestDiagnosisData', JSON.stringify(result.results.diagnosis));
                        window.open('function_simulator.html', 'BudgetSimulator', 'width=900,height=800,scrollbars=yes,resizable=yes');
                    } else {
                        alert('시뮬레이터 실행에 필요한 정보를 불러오는 데 실패했습니다.');
                    }
                } catch (error) {
                    alert('오류가 발생했습니다.');
                }
            }
            else if (button.classList.contains('apply-btn')) {
                const programId = parseInt(button.dataset.programId, 10);
                const program = allProgramsCache.find(p => p.id === programId);
                if (!program) return;

                if (!confirm(`'${program.title}' 프로그램을 신청하시겠습니까?`)) return;
                try {
                    const response = await fetch(`${API_BASE_URL}/applications/me`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ programId: programId })
                    });
                    const result = await response.json();
                    if (response.ok) {
                        alert(`'${program.title}' 프로그램 신청이 완료되었습니다.\n'나의 ESG 활동' 페이지에서 상세 현황을 확인하세요.`);
                    } else {
                        alert(result.message);
                    }
                } catch (error) { 
                    alert('신청 처리 중 오류가 발생했습니다.'); 
                }
            }
        });
    }
    
    // --- 6. 페이지 실행 ---
    initializePage();
});