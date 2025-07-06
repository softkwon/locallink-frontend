// js/esg_programs_list.js (2025-06-29 08:00:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';


document.addEventListener('DOMContentLoaded', async function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const container = document.getElementById('program-list-container');
    const loadingEl = document.getElementById('loadingMessage');
    const token = localStorage.getItem('locallink-token');
    
    // Step5에서 넘어왔을 경우, 진단 ID가 URL에 포함됩니다.
    const diagId = new URLSearchParams(window.location.search).get('diagId');
    const hasCompletedDiagnosis = !!diagId; // diagId가 있으면 true, 없으면 false

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE_URL}/programs`);
            const result = await response.json();

            if (result.success) {
                displayAllPrograms(result.programs);
                attachEventListeners();
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            if(loadingEl) loadingEl.innerHTML = `<p>프로그램을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        } finally {
            if(loadingEl) loadingEl.style.display = 'none';
        }
    }

    // --- 3. 렌더링 함수 ---
    /**
     * 파일명: js/esg_programs_list.js
     * 수정 위치: displayAllPrograms 함수 전체
     * 수정 일시: 2025-07-04 02:13
     */
    function displayAllPrograms(programs) {
        const container = document.getElementById('program-list-container');
        const diagId = new URLSearchParams(window.location.search).get('diagId');
        const hasDiagnosisContext = !!diagId;

        container.innerHTML = '';
        programs.forEach(program => {
            // ★★★ 수정된 부분 ★★★
            // 백엔드에서 이미 전체 URL을 보내주므로, 받은 값을 그대로 사용합니다.
            const representativeImage = program.content && program.content[0]?.images?.length > 0 
                ? program.content[0].images[0] 
                : '/images/default_program.png'; // 기본 이미지는 상대 경로로 처리
            
            const regionsText = (program.service_regions && program.service_regions.length > 0)
                ? program.service_regions.join(', ')
                : '전국';

            const cardWrapper = document.createElement('div');
            cardWrapper.className = 'program-card';
            
            const detailUrl = `esg_program_detail.html?id=${program.id}${diagId ? '&diagId='+diagId : ''}`;

            let actionsHtml = '';
            if (hasDiagnosisContext) {
                actionsHtml = `
                    <button type="button" class="button-secondary button-sm add-to-plan-btn" data-program-id="${program.id}" data-program-title="${program.title}">내 플랜에 담기</button>
                    <button type="button" class="button-primary button-sm apply-btn" data-program-id="${program.id}" data-program-title="${program.title}">신청하기</button>
                `;
            } else {
                actionsHtml = `
                    <button type="button" class="button-primary button-sm apply-btn" data-program-id="${program.id}" data-program-title="${program.title}">신청하기</button>
                `;
            }

            cardWrapper.innerHTML = `
                <a href="${detailUrl}" target="_blank" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; flex-grow:1;">
                    <img src="${representativeImage}" alt="${program.title}" class="card-image">
                    <div class="card-content">
                        <span class="category-badge category-${program.esg_category.toLowerCase()}">${program.esg_category}</span>
                        <h4>${program.title}</h4>
                        <p class="overview">${program.program_overview || '프로그램 개요가 없습니다.'}</p>
                        <div class="service-regions"><strong>서비스 지역:</strong> ${regionsText}</div>
                    </div>
                </a>
                <div class="program-actions">
                    ${actionsHtml}
                </div>
            `;
            container.appendChild(cardWrapper);
        });
    }

    // --- 4. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if (!container) return;
        
        container.addEventListener('click', async e => {
            const button = e.target;
            const programId = button.dataset.programId;
            if (!programId) return;

            const programTitle = button.dataset.programTitle;

            // '내 플랜에 담기' 버튼 클릭 시
            if (button.classList.contains('add-to-plan-btn')) {
                let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
                if (myPlan.some(p => p.id == programId)) {
                    alert('이미 플랜에 추가된 프로그램입니다.');
                    return;
                }
                myPlan.push({ id: parseInt(programId), title: programTitle, min_cost: 30000000 });
                localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
                alert(`'${programTitle}' 프로그램이 내 플랜에 추가되었습니다.\n[ESG프로그램 제안] 페이지의 시뮬레이터에서 확인하세요.`);
            }

            // '신청하기' 버튼 클릭 시
            if (button.classList.contains('apply-btn')) {
                if (!token) {
                    alert('로그인이 필요한 기능입니다.');
                    window.location.href = 'main_login.html';
                    return;
                }
                
                // 진단 경로로 들어온 사용자인지 확인
                if (!hasCompletedDiagnosis) {
                    alert("먼저 간이진단을 진행하세요.");
                    return;
                }
                
                if (confirm(`'${programTitle}' 프로그램을 신청하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/applications/me`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ programId: parseInt(programId) })
                        });
                        const result = await response.json();
                        alert(result.message);
                    } catch (error) {
                        alert('신청 처리 중 오류가 발생했습니다.');
                    }
                }
            }
        });
    }

    // --- 5. 페이지 실행 ---
    initializePage();
});