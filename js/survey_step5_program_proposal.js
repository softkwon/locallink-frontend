import { API_BASE_URL, STATIC_BASE_URL } from './config.js'; 

document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('locallink-token');
    let diagId = new URLSearchParams(window.location.search).get('diagId');
    if (!diagId) {
        diagId = sessionStorage.getItem('currentDiagnosisId');
    }
    const mainContainer = document.querySelector('main.container');
    
    let allProgramsCache = [];
    let initialScores = null;
    let strategyData = null;

    // --- 헬퍼 함수 정의 ---

    function renderProgramBoxes(container, programs, emptyMessage) {
        if (!container) return;
        container.innerHTML = '';
        if (!programs || programs.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#666; padding: 20px 0;">${emptyMessage}</p>`;
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
                    <button type="button" class="${isInPlan ? 'button-danger' : 'button-secondary'} button-sm add-to-plan-btn" data-program-id="${program.id}" data-program-title="${program.title}">${isInPlan ? '플랜에서 제거' : '내 플랜에 담기'}</button>
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
        
        const QUESTION_COUNTS = { e: 4, s: 6, g: 6 };
        const programsByCategory = { e: [], s: [], g: [] };
        const rawImprovement = { e: 0, s: 0, g: 0 };

        planPrograms.forEach(p => {
            const programData = allProgramsCache.find(prog => prog.id === p.id) || {};
            rawImprovement.e += parseFloat(programData.potential_e) || 0;
            rawImprovement.s += parseFloat(programData.potential_s) || 0;
            rawImprovement.g += parseFloat(programData.potential_g) || 0;
            
            const categoryKey = (programData.esg_category || '').trim().toLowerCase();
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
            <thead><tr><th>구분</th><th>플랜 프로그램</th><th>현재</th><th>개선</th><th>예상</th></tr></thead>
            <tbody>
                <tr><td>환경(E)</td><td>${renderProgramList('e')}</td><td>${currentScores.e.toFixed(1)}</td><td class="imp-score">+${improvement.e.toFixed(1)}</td><td><strong>${expected.e.toFixed(1)}</strong> <span class="expected-grade">(${getRiskLevelInfo(expected.e).level})</span></td></tr>
                <tr><td>사회(S)</td><td>${renderProgramList('s')}</td><td>${currentScores.s.toFixed(1)}</td><td class="imp-score">+${improvement.s.toFixed(1)}</td><td><strong>${expected.s.toFixed(1)}</strong> <span class="expected-grade">(${getRiskLevelInfo(expected.s).level})</span></td></tr>
                <tr><td>지배구조(G)</td><td>${renderProgramList('g')}</td><td>${currentScores.g.toFixed(1)}</td><td class="imp-score">+${improvement.g.toFixed(1)}</td><td><strong>${expected.g.toFixed(1)}</strong> <span class="expected-grade">(${getRiskLevelInfo(expected.g).level})</span></td></tr>
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
        
        renderScoreSimulator(initialScores, myPlan);
        
        document.querySelectorAll('.add-to-plan-btn').forEach(btn => {
            const programId = parseInt(btn.dataset.programId, 10);
            if (myPlan.some(p => p.id === programId)) {
                btn.textContent = '플랜에서 제거';
                btn.classList.replace('button-secondary', 'button-danger');
            } else {
                btn.textContent = '내 플랜에 담기';
                btn.classList.replace('button-danger', 'button-secondary');
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

    // --- 메인 로직 함수 ---

    async function initializePage() {
        document.getElementById('categories-modal').style.display = 'none';

        if (!mainContainer || !diagId || !token) {
            mainContainer.innerHTML = '<h2>잘못된 접근입니다.</h2><p>Step4 페이지를 통해 접근해주세요.</p>';
            return;
        }
        setupHeaderLinks();
        await loadData();
        renderAllSections();
        renderCategoriesModal(strategyData.allSolutionCategories);
        attachEventListeners();

        const viewAllProgramsLink = document.getElementById('view-all-programs-link');
        if (viewAllProgramsLink && diagId) {
            viewAllProgramsLink.href = `esg_programs_list.html?from=step5&diagId=${diagId}`;
        }
    }

    function renderCategoriesModal(allSolutionCategories) {
        const accordionContainer = document.getElementById('categories-accordion');
        if (!accordionContainer || !allSolutionCategories) {
            console.error('Accordion container 또는 카테고리 데이터가 없습니다.');
            return;
        }

        const grouped = allSolutionCategories.reduce((acc, cat) => {
            const parent = cat.parent_category;
            if (!acc[parent]) acc[parent] = [];
            acc[parent].push(cat);
            return acc;
        }, {});

        let accordionHtml = '';
        const parentCategoryNames = { E: '환경', S: '사회', G: '지배구조' };

        for (const parent of ['E', 'S', 'G']) {
            if (grouped[parent]) {
                accordionHtml += `
                    <div class="accordion-item">
                        <div class="accordion-header">${parentCategoryNames[parent]}(${parent})</div>
                        <div class="accordion-panel">
                            ${grouped[parent].map(cat => `
                                <div class="category-detail-item">
                                    <strong>${cat.category_name}</strong>
                                    <p>${cat.description || '세부 설명이 등록되지 않았습니다.'}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }
        }
        accordionContainer.innerHTML = accordionHtml;

        // 아코디언 클릭 이벤트는 한 번만 추가
        if (!accordionContainer.dataset.listenerAttached) {
            accordionContainer.addEventListener('click', function(e) {
                const header = e.target.closest('.accordion-header');
                if (!header) return;
                
                header.classList.toggle('active');
                const panel = header.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                    panel.style.padding = '0 20px';
                } else {
                    panel.style.padding = '15px 20px';
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            });
            accordionContainer.dataset.listenerAttached = 'true';
        }
    }

    async function loadData() {
        try {
            const [strategyRes, allProgramsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/strategy/${diagId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/programs`)
            ]);

            if (!strategyRes.ok) throw new Error('전략 데이터를 불러오는 데 실패했습니다.');
            const strategyResult = await strategyRes.json();
            if (!strategyResult.success) throw new Error(strategyResult.message);
            strategyData = strategyResult.strategyData;

            if (!allProgramsRes.ok) throw new Error('전체 프로그램 목록을 불러오는 데 실패했습니다.');
            const allProgramsResult = await allProgramsRes.json();
            if (allProgramsResult.success) allProgramsCache = allProgramsResult.programs;

            initialScores = {
                e: parseFloat(strategyData.userDiagnosis.e_score) || 0,
                s: parseFloat(strategyData.userDiagnosis.s_score) || 0,
                g: parseFloat(strategyData.userDiagnosis.g_score) || 0,
                total: parseFloat(strategyData.userDiagnosis.total_score) || 0
            };
        } catch (error) {
            mainContainer.innerHTML = `<h2>데이터 로딩 오류</h2><p>${error.message}</p>`;
            console.error("Step5 로딩 오류:", error);
        }
    }

    function renderAllSections() {
        if (!strategyData) return;
        renderPriorityPrograms();
        renderAiRecommendedPrograms();
        updateSimulator(); 
    }

    function renderPriorityPrograms() {
        const container = document.getElementById('priority-programs-container');
        const priorityFromStrategy = strategyData.priorityRecommendedPrograms || [];
        const adminRecommended = allProgramsCache.filter(p => p.is_admin_recommended);
        
        const combined = [...priorityFromStrategy, ...adminRecommended];
        const uniquePrograms = Array.from(new Map(combined.map(p => [p.id, p])).values());
        
        renderProgramBoxes(container, uniquePrograms, "추천 단체 및 관리자 추천 프로그램이 없습니다.");
    }

    function renderAiRecommendedPrograms() {
        const container = document.getElementById('ai-recommended-programs-container');
        if (!container) return;
        container.innerHTML = '';

        const recommendedCategories = strategyData.aiAnalysis.recommendedCategories || [];
        const enginePrograms = strategyData.engineRecommendedPrograms || [];
        const allCategories = strategyData.allSolutionCategories || [];
        
        // 세부분야 이름으로 부모 카테고리(E,S,G)와 설명을 빠르게 찾기 위한 Map 생성
        const categoryInfoMap = new Map(allCategories.map(cat => [cat.category_name, {
            parent: cat.parent_category,
            description: cat.description
        }]));

        if (recommendedCategories.length === 0 || enginePrograms.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; padding: 20px 0;">AI가 추천하는 맞춤 개선 분야가 없습니다.</p>';
            return;
        }

        const grid = document.createElement('div');
        grid.className = 'program-proposal-grid'; // 카드들을 담을 그리드

        recommendedCategories.forEach(categoryName => {
            const programsForCategory = enginePrograms.filter(p => 
                p.solution_categories && p.solution_categories.includes(categoryName)
            );

            if (programsForCategory.length > 0) {
                const categoryInfo = categoryInfoMap.get(categoryName) || {};
                const parentCategory = categoryInfo.parent || 'E'; // 기본값 E
                const description = categoryInfo.description || `${categoryName} 관련 개선이 필요합니다.`;
                const programLinks = programsForCategory.map(p => 
                    `<li><a href="esg_program_detail.html?id=${p.id}&diagId=${diagId}" target="_blank">${p.title}</a></li>`
                ).join('');

                const card = document.createElement('div');
                // category-E, category-S, category-G 클래스를 동적으로 추가
                card.className = `solution-card category-${parentCategory}`; 
                card.innerHTML = `
                    <h4 class="solution-category-title">${categoryName}</h4>
                    <p class="solution-category-description">${description}</p>
                    <div class="solution-card-content">
                        <h5>추천 프로그램</h5>
                        <ul class="solution-program-list">${programLinks}</ul>
                    </div>
                `;
                grid.appendChild(card);
            }
        });
        container.appendChild(grid);
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

        const viewCategoriesBtn = document.getElementById('viewCategoriesBtn');
        const categoriesModal = document.getElementById('categories-modal');
        if (viewCategoriesBtn && categoriesModal) {
            const closeBtn = categoriesModal.querySelector('.close-btn');
            viewCategoriesBtn.addEventListener('click', () => {
                categoriesModal.style.display = 'block';
            });
            closeBtn.addEventListener('click', () => {
                categoriesModal.style.display = 'none';
            });
            window.addEventListener('click', (e) => {
                if (e.target == categoriesModal) {
                    categoriesModal.style.display = 'none';
                }
            });
        }
    }
    
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            console.log('페이지가 캐시에서 로드됨. 시뮬레이터를 업데이트합니다.');
            updateSimulator(); 
        }
    });
    
    initializePage();
});