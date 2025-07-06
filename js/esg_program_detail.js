// js/esg_program_detail.js (2025-07-01 12:45:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';


document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const programId = urlParams.get('id');
    const diagId = urlParams.get('diagId');
    const source = urlParams.get('from');
    const token = localStorage.getItem('locallink-token');
    const container = document.getElementById('program-detail-container');

    if (!programId) {
        container.innerHTML = '<h2>잘못된 접근입니다.</h2><p>프로그램 ID가 없습니다.</p>';
        return;
    }

    const hasCompletedDiagnosis = !!diagId; 

    try {
        const [programRes, userRes] = await Promise.all([
            fetch(`${API_BASE_URL}/programs/${programId}`),
            token ? fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` }}) : Promise.resolve(null)
        ]);

        const programResult = await programRes.json();
        if (!programResult.success) throw new Error(programResult.message);
        
        let companyName = "귀사";
        if (userRes && userRes.ok) {
            const userResult = await userRes.json();
            if(userResult.success) companyName = userResult.user.company_name;
        }
        
        renderProgramDetails(programResult.program, hasCompletedDiagnosis, source, companyName);

    } catch (error) {
        container.innerHTML = `<h2>게시물을 불러오는 중 오류가 발생했습니다.</h2><p>${error.message}</p>`;
    }
});

/**
 * 파일명: js/esg_program_detail.js
 * 수정 위치: renderProgramDetails 함수 전체
 * 수정 일시: 2025-07-06 09:33
 */
function renderProgramDetails(program, hasCompletedDiagnosis, source, companyName) {
    const container = document.getElementById('program-detail-container');
    document.title = `${program.title} - LocalLink`;

    // 1. 조건에 따라 버튼과 안내 메시지 HTML 생성
    let actionsHtml = '';
    let noticeHtml = '';
    if (source === 'strategy') {
        noticeHtml = `<div class="recommendation-notice">✔ AI 전략 수립 페이지에서 추천된 프로그램입니다.</div>`;
        actionsHtml = `<button class="button-primary action-btn" data-action="prompt_go_to_step5">신청하기</button>`;
    } else {
        if (hasCompletedDiagnosis) {
            actionsHtml = `<button class="button-secondary action-btn" data-action="add_plan">내 플랜에 담기</button> <button class="button-primary action-btn" data-action="apply">신청하기</button>`;
        } else {
            actionsHtml = `<button class="button-primary action-btn" data-action="apply_prompt">신청하기</button>`;
        }
    }

    // 2. 프로그램 상세 내용 섹션들의 HTML 생성
    const serviceRegionsHtml = (program.service_regions && program.service_regions.length > 0) ? program.service_regions.join(', ') : '전국';
    
    const contentSections = (typeof program.content === 'string') ? JSON.parse(program.content) : (program.content || []);
    
    const contentHtml = contentSections.map(section => {
        const imagesHtml = (section.images || [])
            .map(imgUrl => {
                // S3 전체 주소이므로, 다른 주소를 덧붙이지 않습니다.
                return `<img src="${imgUrl}" alt="프로그램 상세 이미지">`;
            }).join('');
        
        const textHtml = `
            <div class="text-content">
                <h3>${section.subheading || ''}</h3>
                <div>${(section.description || '').replace(/\n/g, '<br>')}</div>
            </div>
        `;
        const imageContainerHtml = imagesHtml ? `<div class="image-content">${imagesHtml}</div>` : '';

        return `
            <div class="content-section-body">
                ${textHtml}
                ${imageContainerHtml}
            </div>
        `;
    }).join('');

    // 3. 연계 단체, 기대효과 및 최종 페이지 HTML 조합
    const orgsHtml = (program.related_links || []).map(org => `<li><a href="${org.homepage_url}" target="_blank">${org.organization_name}</a></li>`).join('') || '<li>-</li>';
    const oppsHtml = (program.opportunity_effects || []).map(opp => `<li>${opp.value}</li>`).join('') || '<li>-</li>';

    container.innerHTML = `
        <div class="program-detail-wrapper">
            <header class="program-header category-${program.esg_category.toLowerCase()}">
                <h1>${program.title}</h1>
                <p>${program.program_overview || ''}</p>
            </header>
            ${noticeHtml}
            <div class="program-body">
                <section class="detail-section">
                    <h4>서비스 지역</h4>
                    <p>${serviceRegionsHtml}</p>
                </section>
                <section class="detail-section">
                    <h4>프로그램 상세 내용</h4>
                    ${contentHtml || '<p>상세 내용이 없습니다.</p>'}
                </section>
                <section class="detail-section">
                    <h4>연계 단체</h4>
                    <ul>${orgsHtml}</ul>
                </section>
                <section class="detail-section">
                    <h4>방치 시 리스크</h4>
                    <p>${program.risk_text || '-'}</p>
                </section>
                <section class="detail-section">
                    <h4>개선 시 기대효과</h4>
                    <ul>${oppsHtml}</ul>
                </section>
                <section class="program-actions-section">
                    ${actionsHtml}
                </section>
            </div>
            <footer class="program-footer">
                <p>*프로그램을 통해 [${companyName}]의 자세한 성과 측정이 가능합니다.</p>
            </footer>
        </div>
    `;

    // 4. 버튼 클릭 이벤트 처리
    container.addEventListener('click', async (e) => {
        const targetButton = e.target.closest('.action-btn');
        if (!targetButton) return;
        
        e.preventDefault();
        const action = targetButton.dataset.action;
        const token = localStorage.getItem('locallink-token');

        if (action === 'prompt_go_to_step5') {
            alert("다음단계인 'ESG 프로그램 제안'(Step5)에서 신청해 주세요.");
            return;
        }
        if (action === 'apply_prompt') {
            alert("먼저 간이 진단을 진행하세요.");
            return;
        }
        if (!token) {
            alert("로그인이 필요한 기능입니다.");
            return window.location.href = 'main_login.html';
        }
        if (action === 'apply') {
            if(confirm(`'${program.title}' 프로그램을 신청하시겠습니까?`)){
                try {
                    const response = await fetch(`${API_BASE_URL}/applications/me`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ programId: program.id })
                    });
                    const result = await response.json();
                    alert(result.message);
                } catch (error) { alert('신청 처리 중 오류가 발생했습니다.'); }
            }
        } 
        else if (action === 'add_plan') {
            let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
            if (myPlan.some(p => p.id === program.id)) { alert('이미 플랜에 추가된 프로그램입니다.'); return; }
            myPlan.push({ id: program.id, title: program.title });
            localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
            alert(`'${program.title}' 프로그램이 내 플랜에 추가되었습니다.`);
        }
    });
}