import { API_BASE_URL, STATIC_BASE_URL } from './config.js'; 

document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('locallink-token');
    const diagId = new URLSearchParams(window.location.search).get('diagId');
    const mainContainer = document.querySelector('main.container');
    
    const prioritySection = document.getElementById('priority-programs-section');
    const priorityContainer = document.getElementById('priority-programs-container');
    const recommendedContainer = document.getElementById('recommended-programs-container');
    const regionalContainer = document.getElementById('regional-programs-container');
    const allProgramsContainer = document.getElementById('all-programs-container');

    let allProgramsCache = [];
    let initialScores = null;

    async function initializePage() {
        if (!mainContainer || !diagId || !token) {
            mainContainer.innerHTML = '<h2>잘못된 접근입니다.</h2><p>Step4 페이지를 통해 접근해주세요.</p>';
            return;
        }
        setupHeaderLinks();
        await loadAndRenderAll();
        attachEventListeners();
    }

    async function loadAndRenderAll() {
        try {
            const [strategyRes, allProgramsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/strategy/${diagId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/programs`)
            ]);

            if (!strategyRes.ok) throw new Error('전략 데이터를 불러오는 데 실패했습니다.');
            const strategyResult = await strategyRes.json();
            if (!strategyResult.success) throw new Error(strategyResult.message);
            const strategyData = strategyResult.strategyData;

            if (!allProgramsRes.ok) throw new Error('전체 프로그램 목록을 불러오는 데 실패했습니다.');
            const allProgramsResult = await allProgramsRes.json();
            if (allProgramsResult.success) allProgramsCache = allProgramsResult.programs;

            const priorityPrograms = strategyData.priorityRecommendedPrograms || [];
            const enginePrograms = strategyData.engineRecommendedPrograms || [];
            const userRegion = strategyData.userDiagnosis.business_location;
            
            initialScores = {
                e: parseFloat(strategyData.userDiagnosis.e_score) || 0,
                s: parseFloat(strategyData.userDiagnosis.s_score) || 0,
                g: parseFloat(strategyData.userDiagnosis.g_score) || 0,
                total: parseFloat(strategyData.userDiagnosis.total_score) || 0
            };

            if (priorityPrograms.length > 0) {
                prioritySection.classList.remove('hidden');
                renderProgramSection(priorityContainer, priorityPrograms, "");
            }

            renderProgramSection(recommendedContainer, enginePrograms, "진단 결과에 따른 맞춤 추천 프로그램이 없습니다.");

            const recommendedIds = new Set([...priorityPrograms, ...enginePrograms].map(p => p.id));
            const regionalPrograms = allProgramsCache.filter(p => 
                !recommendedIds.has(p.id) && p.service_regions && userRegion && 
                (p.service_regions.includes(userRegion) || p.service_regions.includes('전국'))
            );
            const regionalIds = new Set(regionalPrograms.map(p => p.id));
            const otherPrograms = allProgramsCache.filter(p => !recommendedIds.has(p.id) && !regionalIds.has(p.id));
            
            renderProgramSection(regionalContainer, regionalPrograms, "우리 회사 지역에 맞는 프로그램이 없습니다.");
            renderProgramSection(allProgramsContainer, otherPrograms.slice(0, 3), "다른 프로그램이 없습니다.");
            
            updateSimulator();
            
        } catch (error) {
            if(recommendedContainer) recommendedContainer.innerHTML = `<p>데이터 로딩 오류: ${error.message}</p>`;
            console.error("Step5 로딩 오류:", error);
        }
    }

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
        if (!gaugeEl || !tableEl || !currentScores) return;
        
        const QUESTION_COUNTS = { e: 4, s: 6, g: 6 }; // 이 값은 실제 질문 개수에 맞게 조정해야 할 수 있습니다.
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

            const dashboardLink = target.closest('a[href="main_my_esg_dashboard.html"]');
            if (dashboardLink) {
                e.preventDefault();
                alert("진단결과, AI기반 ESG 전략 수립은 상단 '프로필 > 나의 진단이력'에서 다시 확인할 수 있습니다");
                window.location.href = dashboardLink.href;
                return;
            }

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
    
    initializePage();
});
