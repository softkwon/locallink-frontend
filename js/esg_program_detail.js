import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

function formatTextWithBreaks(text = '') {
    if (!text) return '';
    return text
        .replace(/\n/g, '<br>')         
        .replace(/  /g, ' &nbsp;');   
}

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

    let executionMessage = program.execution_type === 'contract'
        ? '* 이 프로그램은 용역계약을 통해 진행할 수 있습니다.'
        : '* 이 프로그램은 기부를 통해 진행할 수 있습니다.';
    
    const contentSections = Array.isArray(program.content) ? program.content : [];
    const firstImage = contentSections.flatMap(s => s.images || []).find(Boolean) || 'https://esglink.co.kr/images/logo_og.png';
    
    document.querySelector('meta[property="og:title"]').setAttribute('content', program.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', program.program_overview || 'ESGlink에서 제공하는 ESG 프로그램을 확인하세요.');
    document.querySelector('meta[property="og:image"]').setAttribute('content', firstImage);
    
    let noticeHtml = '';
    let actionButtons = [];
    const serviceCostButton = (program.service_costs && program.service_costs.length > 0) 
        ? `<button id="open-cost-modal-btn" class="button-secondary action-btn">서비스 비용 안내</button>` 
        : null;

    if (source === 'strategy') {
        noticeHtml = `<div class="recommendation-notice">✔ AI 전략 수립 페이지에서 추천된 프로그램입니다.</div>`;
        actionButtons.push(serviceCostButton);
        actionButtons.push(`<button class="button-primary action-btn" data-action="prompt_go_to_step5">신청하기</button>`);
    } else {
        if (hasCompletedDiagnosis) {
            actionButtons.push(`<button class="button-secondary action-btn" data-action="add_plan">내 플랜에 담기</button>`);
            actionButtons.push(serviceCostButton);
            actionButtons.push(`<button class="button-primary action-btn" data-action="apply">신청하기</button>`);
        } else {
            actionButtons.push(serviceCostButton);
            actionButtons.push(`<button class="button-primary action-btn" data-action="apply_prompt">신청하기</button>`);
        }
    }
    const actionsHtml = actionButtons.filter(Boolean).join(' ');

    // 상세 내용(content) 렌더링 시 formatTextWithBreaks 함수 사용
    const contentHtml = contentSections.map(section => {
        const layoutClass = section.layout || 'img-top';
        const imagesHtml = (section.images || []).map(imgUrl => `<img src="${imgUrl}" alt="프로그램 상세 이미지">`).join('');
        const textHtml = `
            <div class="text-content">
                <h3>${section.subheading || ''}</h3>
                <div style="font-size: ${section.description_size || 16}px;">${formatTextWithBreaks(section.description)}</div>
            </div>`;
        const imageContainerHtml = imagesHtml ? `<div class="image-content">${imagesHtml}</div>` : '';
        return `<div class="content-section-body layout-${layoutClass}">${textHtml}${imageContainerHtml}</div>`;
    }).join('');

    const orgsHtml = (program.related_links || []).map(org => `<li><a href="${org.homepage_url}" target="_blank">${org.organization_name}</a></li>`).join('') || '<li>-</li>';
    const oppsHtml = (program.opportunity_effects || []).map(opp => `<li>${opp.value}</li>`).join('') || '<li>-</li>';

    container.innerHTML = `
        <div class="program-detail-wrapper">
            <header class="program-header category-${(program.esg_category || 'e').toLowerCase()}">
                <h1>${program.title}</h1>
                <p>${formatTextWithBreaks(program.program_overview)}</p> <!-- 프로그램 개요에도 적용 -->
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
                <section class="detail-section"><h4>서비스 지역</h4><p>${program.service_regions?.join(', ') || '전국'}</p></section>
                <section class="detail-section"><h4>프로그램 상세 내용</h4>${contentHtml || '<p>상세 내용이 없습니다.</p>'}</section>
                <section class="detail-section"><h4>연계 단체</h4><ul>${orgsHtml}</ul></section>
                <section class="detail-section"><h4>방치 시 리스크</h4><p>${formatTextWithBreaks(program.risk_text)}</p></section> <!-- 리스크 텍스트에도 적용 -->
                <section class="detail-section"><h4>개선 시 기대효과</h4><ul>${oppsHtml}</ul></section>
                <section class="program-actions-section">
                    <a href="esg_programs_list.html" class="button-secondary">목록으로</a>
                    <div class="actions-group">${actionsHtml}</div>
                </section>
            </div>
            <footer class="program-footer">
                <p>${executionMessage}</p>
                <p>*프로그램을 통해 [${companyName}]의 자세한 성과 측정이 가능합니다.</p>
            </footer>
        </div>
    `;

    // 이벤트 리스너 연결
    attachActionEventListeners(program);
    attachShareEventListeners(program, firstImage);
    if (program.service_costs && program.service_costs.length > 0) {
        attachServiceCostModalEvents(program);
    }
}

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
        if (typeof Kakao === 'undefined' || !Kakao.isInitialized()) {
            alert('카카오 공유 기능을 사용할 수 없습니다. SDK가 로드되지 않았습니다.');
            return;
        }
        Kakao.Share.sendDefault({
            objectType: 'feed',
            content: {
                title: program.title,
                description: program.program_overview,
                imageUrl: thumbnailUrl,
                link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
            },
            buttons: [{ title: '프로그램 보기', link: { mobileWebUrl: window.location.href, webUrl: window.location.href } }],
        });
        shareDropdown.style.display = 'none';
    });
}

function attachServiceCostModalEvents(program) {
    const openBtn = document.getElementById('open-cost-modal-btn');
    const modal = document.getElementById('service-cost-modal');
    if (!openBtn || !modal) return;

    const modalContent = document.getElementById('service-cost-modal-content');
    const closeBtn = modal.querySelector('.close-btn');

    openBtn.addEventListener('click', () => {
        const existingCost = program.existing_cost_details || {};
        const serviceCosts = program.service_costs || [];

        modalContent.innerHTML = `
            <div class="cost-modal-body">
                <div class="cost-modal-grid">
                    <div class="cost-column cost-existing">
                        <h4>ESG 대응 비용</h4>
                        <table>
                            <thead>
                                <tr><th>내용</th><th style="text-align:right;">비용</th></tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>${existingCost.description || '기존 지출 비용'}</td>
                                    <td style="text-align:right;">${existingCost.amount ? existingCost.amount.toLocaleString() + ' 원' : '-'}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="cost-column cost-service">
                        <h4>서비스 이용시</h4>
                        <table>
                            <thead>
                                <tr><th>제공서비스</th><th style="text-align:right;">금액</th></tr>
                            </thead>
                            <tbody>
                                ${serviceCosts.length > 0 ? serviceCosts.map(item => `
                                    <tr>
                                        <td>${(item.service || '').replace(/\n/g, '<br>')}</td>
                                        <td style="text-align:right;">${(item.amount || 0).toLocaleString()} 원</td>
                                    </tr>
                                `).join('') : `<tr><td colspan="2">제공되는 서비스가 없습니다.</td></tr>`}
                            </tbody>
                        </table>
                    </div>
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
