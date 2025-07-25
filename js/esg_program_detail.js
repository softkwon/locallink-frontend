//[2025-07-11] [js/esg_program_detail.js] [공유 기능 추가 및 전체 코드]

import { API_BASE_URL } from './config.js';

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
        if (!programResult.success) {
            throw new Error(programResult.message || '프로그램 정보를 가져오지 못했습니다.');
        }
        
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


function renderProgramDetails(program, hasCompletedDiagnosis, source, companyName) {
    const container = document.getElementById('program-detail-container');
    document.title = `${program.title} - ESGLink`;

    let executionMessage = '';
    if (program.execution_type === 'contract') {
        executionMessage = '* 이 프로그램은 용역계약을 통해 진행할 수 있습니다.';
    } else { // 'donation' 또는 값이 없는 경우 기본값
        executionMessage = '* 이 프로그램은 기부를 통해 진행할 수 있습니다.';
    }
    
    // 1. 공유 썸네일용 첫 번째 이미지 URL 찾기
    const contentSections = Array.isArray(program.content) ? program.content : [];
    const firstImage = contentSections.flatMap(s => s.images || []).find(Boolean) || 'https://esglink.co.kr/images/logo_og.png';
    
    // 2. 공유 썸네일을 위한 meta 태그 동적 업데이트
    document.querySelector('meta[property="og:title"]').setAttribute('content', program.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', program.program_overview || 'ESGlink에서 제공하는 ESG 프로그램을 확인하세요.');
    document.querySelector('meta[property="og:image"]').setAttribute('content', firstImage);
    
    // 3. 버튼 HTML 생성
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

    const shareButtonHtml = `
        <div class="share-container">
            <button class="share-button" id="shareBtn" title="공유하기">🔗</button>
            <div class="share-dropdown" id="shareDropdown">
                <a href="#" id="copyLinkBtn">링크 복사</a>
                <a href="#" id="kakaoShareBtn">카카오톡 공유</a>
            </div>
        </div>
    `;

    // 4. 기타 콘텐츠 HTML 생성
    const serviceRegionsHtml = program.service_regions?.join(', ') || '전국';
    const relatedLinks = Array.isArray(program.related_links) ? program.related_links : [];
    const opportunityEffects = Array.isArray(program.opportunity_effects) ? program.opportunity_effects : [];

    const contentHtml = contentSections.map(section => {
        const layoutClass = section.layout || 'img-top';
        const imagesHtml = (section.images || []).map(imgUrl => `<img src="${imgUrl}" alt="프로그램 상세 이미지">`).join('');
        const textHtml = `
            <div class="text-content">
                <h3>${section.subheading || ''}</h3>
                <div style="font-size: ${section.description_size || 16}px;">${(section.description || '').replace(/\n/g, '<br>')}</div>
            </div>`;
        const imageContainerHtml = imagesHtml ? `<div class="image-content">${imagesHtml}</div>` : '';
        return `<div class="content-section-body layout-${layoutClass}">${textHtml}${imageContainerHtml}</div>`;
    }).join('');

    const orgsHtml = relatedLinks.map(org => `<li><a href="${org.homepage_url}" target="_blank">${org.organization_name}</a></li>`).join('') || '<li>-</li>';
    const oppsHtml = opportunityEffects.map(opp => `<li>${opp.value}</li>`).join('') || '<li>-</li>';

    // 5. 최종 페이지 HTML 렌더링
    container.innerHTML = `
        <div class="program-detail-wrapper">
            <header class="program-header category-${program.esg_category.toLowerCase()}">
                <h1>${program.title}</h1>
                <p>${program.program_overview || ''}</p>
                <div class="share-container">
                    <button class="share-button" id="shareBtn" title="공유하기">🔗</button>
                    <div class="share-dropdown" id="shareDropdown">
                        <a href="#" id="copyLinkBtn">링크 복사</a>
                        <a href="#" id="kakaoShareBtn">카카오톡 공유</a>
                    </div>
                </div>
            </header>
            ${noticeHtml}
            <div class="program-body">
                <section class="detail-section"><h4>서비스 지역</h4><p>${serviceRegionsHtml}</p></section>
                <section class="detail-section"><h4>프로그램 상세 내용</h4>${contentHtml || '<p>상세 내용이 없습니다.</p>'}</section>
                <section class="detail-section"><h4>연계 단체</h4><ul>${orgsHtml}</ul></section>
                <section class="detail-section"><h4>방치 시 리스크</h4><p>${program.risk_text || '-'}</p></section>
                <section class="detail-section"><h4>개선 시 기대효과</h4><ul>${oppsHtml}</ul></section>
                <section class="program-actions-section">
                    <a href="index.html" class="button-secondary">[ESGLink 바로가기]</a>
                    <div class="actions-group">
                        ${actionsHtml}
                    </div>
                </section>
            </div>
            <footer class="program-footer">
            <p>${executionMessage}</p>
            <p>*프로그램을 통해 [${companyName}]의 자세한 성과 측정이 가능합니다.</p></footer>
        </div>
    `;

    container.innerHTML = `
        <div class="program-detail-wrapper">
            </div>
    `;

    if (program.service_costs && program.service_costs.length > 0) {
        renderServiceCostSection(program);
        attachServiceCostModalEvents(program);
    }

    // 6. 이벤트 리스너 연결
    attachActionEventListeners(program);
    attachShareEventListeners(program, firstImage);
}

// 신청/플랜담기 버튼 이벤트 리스너
function attachActionEventListeners(program) {
    const container = document.getElementById('program-detail-container');
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
            if (myPlan.some(p => p.id === program.id)) {
                alert('이미 플랜에 추가된 프로그램입니다.');
                return;
            }
            myPlan.push({ id: program.id, title: program.title });
            localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
            alert(`'${program.title}' 프로그램이 내 플랜에 추가되었습니다.`);
        }
    });
}

// 공유 기능 이벤트 리스너
function attachShareEventListeners(program, thumbnailUrl) {
    const shareBtn = document.getElementById('shareBtn');
    const shareDropdown = document.getElementById('shareDropdown');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const kakaoShareBtn = document.getElementById('kakaoShareBtn');

    if (!shareBtn || !shareDropdown || !copyLinkBtn || !kakaoShareBtn) return;

    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareDropdown.style.display = shareDropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!shareBtn.contains(e.target) && !shareDropdown.contains(e.target)) {
            shareDropdown.style.display = 'none';
        }
    });

    copyLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('프로그램 링크가 복사되었습니다.');
        }, () => {
            alert('링크 복사에 실패했습니다.');
        });
        shareDropdown.style.display = 'none';
    });

    kakaoShareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: program.title,
                description: program.program_overview,
                imageUrl: thumbnailUrl,
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href,
                },
            },
            buttons: [
                {
                    title: '프로그램 보기',
                    link: {
                        mobileWebUrl: window.location.href,
                        webUrl: window.location.href,
                    },
                },
            ],
        });
        shareDropdown.style.display = 'none';
    });
}

function renderServiceCostSection(program) {
    const container = document.getElementById('service-cost-section-container');
    if (!container) return;

    container.innerHTML = `
        <div class="service-cost-box" id="open-cost-modal-btn">
            <h4>서비스 비용 안내</h4>
            <p>프로그램 진행 시 예상되는 비용을 확인해보세요.</p>
        </div>
    `;
}

function attachServiceCostModalEvents(program) {
    const openBtn = document.getElementById('open-cost-modal-btn');
    const modal = document.getElementById('service-cost-modal');
    if (!openBtn || !modal) return;

    const modalContent = document.getElementById('service-cost-modal-content');
    const closeBtn = modal.querySelector('.close-btn');

    openBtn.addEventListener('click', () => {
        // 모달 내용 생성
        const existingCostHtml = program.existing_cost ? `
            <div class="existing-cost-card">
                <div class="cost-label">기존 연간 지출 비용</div>
                <div class="cost-value">${program.existing_cost.toLocaleString()} 원</div>
            </div>
        ` : '<div></div>';

        modalContent.innerHTML = `
            <div class="cost-table-grid">
                <h3>서비스 비용 상세</h3>
                ${existingCostHtml}
                <div>
                    <table class="styled-table">
                        <thead>
                            <tr>
                                <th>제공 서비스</th>
                                <th style="width: 30%;">금액</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${program.service_costs.map(item => `
                                <tr>
                                    <td>${item.service}</td>
                                    <td style="text-align: right;">${item.amount.toLocaleString()} 원</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => modal.style.display = 'none');
    window.addEventListener('click', (e) => {
        if (e.target == modal) modal.style.display = 'none';
    });
}