// js/survey_step5_program_proposal.js (2025-06-29 23:40:00)

import { API_BASE_URL, STATIC_BASE_URL } from './config.js';  

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const token = localStorage.getItem('locallink-token');
    const diagId = new URLSearchParams(window.location.search).get('diagId');

    const mainContainer = document.querySelector('main.container');
    const recommendedContainer = document.getElementById('recommended-programs-container');
    const allProgramsContainer = document.getElementById('all-programs-container');
    const applicationStatusContainer = document.getElementById('applicationStatusContainer');
    const applicationStatusSection = document.getElementById('applicationStatusSection');
    const customSolutionSection = document.getElementById('customSolutionSection');
    const customSolutionText = document.getElementById('customSolutionText');
    
    let allProgramsCache = []; // API 호출을 줄이기 위해 프로그램 정보를 저장

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!mainContainer) return;
        if (!diagId || !token) {
            mainContainer.innerHTML = '<h2>잘못된 접근입니다.</h2><p>Step4 AI기반 ESG 전략수립 페이지를 통해 접근해주세요.</p>';
            return;
        }
        setupHeaderLinks();
        await loadAndRenderAll();
        attachEventListeners();
    }

    // --- 3. 데이터 로딩 및 전체 화면 렌더링 ---
    async function loadAndRenderAll() {
        try {
            const [programsRes, statusRes, applicationsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/programs`),
                fetch(`${API_BASE_URL}/users/me/diagnosis-status?diagId=${diagId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/applications/me`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const programsResult = await programsRes.json();
            if (!programsResult.success) throw new Error('프로그램 목록 로딩 실패');
            allProgramsCache = programsResult.programs;

            let diagnosisStatus = { recommended_program_ids: [] };
            if (statusRes.ok) {
                const statusResult = await statusRes.json();
                if (statusResult.success) diagnosisStatus = statusResult;
            }

            let applications = [];
            if (applicationsRes.ok) {
                const appResult = await applicationsRes.json();
                if(appResult.success) applications = appResult.applications;
            }
            
            const recommendedIds = diagnosisStatus.recommended_program_ids || [];
            const recommendedPrograms = allProgramsCache.filter(p => recommendedIds.includes(p.id));
            const otherPrograms = allProgramsCache.filter(p => !recommendedIds.includes(p.id));

            renderProgramSection(recommendedContainer, recommendedPrograms, "진단 결과에 따른 맞춤 추천 프로그램이 없습니다.");
            renderProgramSection(allProgramsContainer, otherPrograms.slice(0, 3), "다른 프로그램이 없습니다.");
            displayApplicationStatus(applications);
            
            if (customSolutionSection && customSolutionText && recommendedIds.length > 0) {
                customSolutionText.innerHTML = `진단 결과, <strong>총 ${recommendedIds.length}개의 주요 개선 과제</strong>가 도출되었습니다. <br>귀사에 맞춰 제안된 모든 프로그램을 확인해보세요.`;
                customSolutionSection.style.display = 'block';
            }
        } catch (error) {
            if(recommendedContainer) recommendedContainer.innerHTML = `<p>데이터를 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        }
    }

    // --- 4. 렌더링 및 헬퍼 함수들 ---
    function renderProgramSection(container, programs, emptyMessage) {
        if (!container) return;
        container.innerHTML = '';
        if (!programs || programs.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#666;">${emptyMessage}</p>`;
            return;
        }
        programs.forEach(program => {
            const image = (program.content && program.content[0]?.images?.length > 0) ? `${STATIC_BASE_URL}/uploads/programs/${program.content[0].images[0]}` : 'images/default_program.png';
            const programBox = document.createElement('div');
            programBox.className = 'program-box';
            if (program.isRecommended) programBox.classList.add('highlighted-program');

            programBox.innerHTML = `
                <div class="program-link-wrapper" data-program-id="${program.id}" style="cursor: pointer; text-decoration:none; color:inherit; display:flex; flex-direction:column; flex-grow:1;">
                    <img src="${image}" alt="${program.title}">
                    <h5>${program.title}</h5>
                    <p>${program.program_overview || '상세 내용을 확인하세요.'}</p>
                </div>
                <div class="program-actions" style="margin-top:auto; padding-top:10px; border-top:1px solid #eee;">
                    <button type="button" class="button-secondary button-sm add-to-plan-btn" data-program-id="${program.id}" data-program-title="${program.title}">내 플랜에 담기</button>
                    <button type="button" class="button-primary button-sm apply-btn" data-program-id="${program.id}" data-program-title="${program.title}">신청하기</button>
                </div>
            `;
            container.appendChild(programBox);
        });
    }

    function displayApplicationStatus(applications) {
        if (!applicationStatusContainer || !applicationStatusSection) return;
        applicationStatusSection.style.display = 'block';
        applicationStatusContainer.innerHTML = ''; 
        if (!applications || applications.length === 0) {
            applicationStatusContainer.innerHTML = '<p style="text-align:center; color:#666;">아직 신청한 프로그램이 없습니다.</p>';
            return;
        }
        applications.forEach(app => {
            const programInfo = allProgramsCache.find(p => p.id === app.program_id);
            if (programInfo) {
                const tag = document.createElement('div');
                tag.className = 'application-status-tag';
                tag.innerHTML = `<span>${programInfo.title}</span><button type="button" class="cancel-application-btn" data-application-id="${app.id}" title="신청 취소">&times;</button>`;
                applicationStatusContainer.appendChild(tag);
            }
        });
    }

    function setupHeaderLinks() {
        const navStrategyLink = document.getElementById('navStrategyLink');
        if (navStrategyLink && diagId) {
            navStrategyLink.href = `survey_step4_esg_strategy.html?diagId=${diagId}`;
        }
        const viewAllProgramsLink = document.getElementById('viewAllProgramsLink');
        if (viewAllProgramsLink && diagId) {
            viewAllProgramsLink.href = `esg_programs_list.html?diagId=${diagId}`;
        }
    }

    // --- 5. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if (!mainContainer) return;
        // ★★★ 이벤트 감시 범위를 페이지 전체(document)로 확장합니다. ★★★
        document.addEventListener('click', async e => {
            const target = e.target;
            
            // --- '나의 ESG 활동' 또는 헤더의 '완료' 링크 클릭 처리 ---
            const dashboardLink = target.closest('a[href="main_my_esg_dashboard.html"]');
            if (dashboardLink) {
                e.preventDefault(); // 기본 링크 이동을 막습니다.
                alert("'AI기반 ESG 전략 수립', 'ESG 프로그램 제안'은 회원정보의 '나의 진단이력' 결과보기를 통해 다시 보실 수 있습니다.");
                window.location.href = dashboardLink.href; // 메시지 확인 후, 원래 링크 주소로 이동합니다.
                return; // 다른 로직과 중복 실행 방지
            }

            // --- '자세히 보기' (카드 클릭) 처리 ---
            const cardWrapper = target.closest('.program-link-wrapper');
            if (cardWrapper && cardWrapper.dataset.programId) {
                const programId = cardWrapper.dataset.programId;
                const diagId = new URLSearchParams(window.location.search).get('diagId');
                const url = `esg_program_detail.html?id=${programId}&diagId=${diagId}`;
                window.open(url, 'programDetailWindow', 'width=1024,height=768,scrollbars=yes,resizable=yes');
                return; 
            }
            
            // --- 버튼 클릭 공통 처리 ---
            const button = target.closest('button');
            if (!button) return;

            // --- '시뮬레이터 실행하기' 버튼 클릭 처리 ---
            const simulatorBtn = target.closest('#openSimulatorBtn');
            if (simulatorBtn) {
                try {
                    // ★ 1. 시뮬레이터에 필요한 최신 진단 정보를 가져옵니다.
                    const response = await fetch(`${API_BASE_URL}/diagnoses/${diagId}/results`, { headers: { 'Authorization': `Bearer ${token}` } });
                    const result = await response.json();
                    
                    if (result.success) {
                        // ★ 2. sessionStorage에 진단 데이터를 저장합니다.
                        sessionStorage.setItem('latestDiagnosisData', JSON.stringify(result.results.diagnosis));
                        
                        // ★ 3. 새 창을 엽니다.
                        window.open('function_simulator.html', 'BudgetSimulator', 'width=900,height=800,scrollbars=yes,resizable=yes');
                    } else {
                        alert('시뮬레이터 실행에 필요한 정보를 불러오는 데 실패했습니다.');
                    }
                } catch (error) {
                    alert('오류가 발생했습니다.');
                }
                return;
            }
            
            const programId = button.dataset.programId;
            const applicationId = button.dataset.applicationId;

            // 프로그램 관련 버튼들
            if (programId) {
                const programTitle = button.dataset.programTitle;
                if (button.classList.contains('add-to-plan-btn')) {
                    let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
                    if (myPlan.some(p => p.id == programId)) {
                        alert('이미 플랜에 추가된 프로그램입니다.');
                        return;
                    }
                    myPlan.push({ id: parseInt(programId), title: programTitle, min_cost: 30000000 });
                    localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
                    alert(`'${programTitle}' 프로그램이 내 플랜에 추가되었습니다.`);
                }
                if (button.classList.contains('apply-btn')) {
                    if (!confirm(`'${programTitle}' 프로그램을 신청하시겠습니까?`)) return;
                    try {
                        const response = await fetch(`${API_BASE_URL}/applications/me`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ programId: parseInt(programId) })
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (result.success) {
                           const appRes = await fetch(`${API_BASE_URL}/applications/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                           const appResult = await appRes.json();
                           if(appResult.success) displayApplicationStatus(appResult.applications);
                        }
                    } catch (error) { alert('신청 처리 중 오류가 발생했습니다.'); }
                }
            }

            // 신청 취소 버튼
            if (applicationId) {
                if (confirm("정말로 해당 프로그램 신청을 취소하시겠습니까?")) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/applications/me/${applicationId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if(result.success){
                           const appRes = await fetch(`${API_BASE_URL}/applications/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                           const appResult = await appRes.json();
                           if(appResult.success) displayApplicationStatus(appResult.applications);
                        }
                    } catch(err) { 
                        console.error("신청 취소 중 오류:", err);
                        alert('신청 취소 중 오류가 발생했습니다.'); 
                    }
                }
            }
        });
    }
    
    // --- 6. 페이지 실행 ---
    initializePage();
});