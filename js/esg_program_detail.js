// js/esg_program_detail.js (최종 수정본)

import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    const urlParams = new URLSearchParams(window.location.search);
    const programId = urlParams.get('id');
    const token = localStorage.getItem('locallink-token');
    const container = document.getElementById('program-detail-container');

    if (!programId) {
        container.innerHTML = '<h2>잘못된 접근입니다.</h2><p>프로그램 ID가 없습니다.</p>';
        return;
    }

    try {
        const programRes = await fetch(`${API_BASE_URL}/programs/${programId}`);
        const programResult = await programRes.json();

        if (!programResult.success) {
            throw new Error(programResult.message || '프로그램 정보를 가져오지 못했습니다.');
        }
        
        renderProgramDetails(programResult.program, token);

    } catch (error) {
        container.innerHTML = `<h2>게시물을 불러오는 중 오류가 발생했습니다.</h2><p>${error.message}</p>`;
    }
});


function renderProgramDetails(program, token) {
    const container = document.getElementById('program-detail-container');
    document.title = `${program.title} - ESGLink`;
    
    // --- 1. 변수 및 HTML 조각 생성 ---
    const contentSections = Array.isArray(program.content) ? program.content : [];
    const firstImage = contentSections.flatMap(s => s.images || []).find(Boolean) || 'https://esglink.co.kr/images/logo_og.png';
    
    // 메타 태그 업데이트
    document.querySelector('meta[property="og:title"]').setAttribute('content', program.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', program.program_overview || 'ESGlink 프로그램을 확인하세요.');
    document.querySelector('meta[property="og:image"]').setAttribute('content', firstImage);
    
    // [수정] '서비스 비용 안내' 버튼을 동적으로 추가
    let actionsHtml = `<button class="button-primary action-btn" data-action="apply">신청하기</button>`;
    if (program.service_costs && program.service_costs.length > 0) {
        actionsHtml += `<button id="open-cost-modal-btn" class="button-secondary action-btn">서비스 비용 안내</button>`;
    }

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

    const orgsHtml = (program.related_links || []).map(org => `<li><a href="${org.homepage_url}" target="_blank">${org.organization_name}</a></li>`).join('') || '<li>-</li>';
    const oppsHtml = (program.opportunity_effects || []).map(opp => `<li>${opp.value}</li>`).join('') || '<li>-</li>';

    // --- 2. 최종 페이지 HTML 렌더링 ---
    container.innerHTML = `
        <div class="program-detail-wrapper">
            <header class="program-header category-${(program.esg_category || 'e').toLowerCase()}">
                <h1>${program.title}</h1>
                <p>${program.program_overview || ''}</p>
            </header>
            <div class="program-body">
                <section class="detail-section"><h4>서비스 지역</h4><p>${program.service_regions?.join(', ') || '전국'}</p></section>
                <section class="detail-section"><h4>프로그램 상세 내용</h4>${contentHtml || '<p>상세 내용이 없습니다.</p>'}</section>
                <section class="detail-section"><h4>연계 단체</h4><ul>${orgsHtml}</ul></section>
                <section class="detail-section"><h4>방치 시 리스크</h4><p>${program.risk_text || '-'}</p></section>
                <section class="detail-section"><h4>개선 시 기대효과</h4><ul>${oppsHtml}</ul></section>
                
                <section class="program-actions-section">
                    <a href="esg_programs_list.html" class="button-secondary">목록으로</a>
                    <div class="actions-group">${actionsHtml}</div>
                </section>
            </div>
        </div>
    `;

    // --- 3. 이벤트 리스너 연결 ---
    attachActionEventListeners(program, token);
    
    // [수정] 서비스 비용 데이터가 있을 때만 모달 이벤트 연결
    if (program.service_costs && program.service_costs.length > 0) {
        attachServiceCostModalEvents(program);
    }
}

// 신청/플랜담기 버튼 이벤트 리스너
function attachActionEventListeners(program, token) {
    const container = document.getElementById('program-detail-container');
    container.addEventListener('click', async (e) => {
        const targetButton = e.target.closest('.action-btn');
        if (!targetButton) return;
        
        const action = targetButton.dataset.action;

        if (action === 'apply') {
            if (!token) {
                alert("로그인이 필요한 기능입니다.");
                return window.location.href = 'main_login.html';
            }
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
    });
}

// 서비스 비용 모달 이벤트를 연결하는 함수
function attachServiceCostModalEvents(program) {
    const openBtn = document.getElementById('open-cost-modal-btn');
    const modal = document.getElementById('service-cost-modal');
    if (!openBtn || !modal) return;

    const modalContent = document.getElementById('service-cost-modal-content');
    const closeBtn = modal.querySelector('.close-btn');

    openBtn.addEventListener('click', () => {
        const existingCost = program.existing_cost_details;
        const existingCostHtml = (existingCost && existingCost.amount) ? `
            <div class="existing-cost-card">
                <div class="cost-label">${existingCost.description || '기존 지출 비용'}</div>
                <div class="cost-value">${existingCost.amount.toLocaleString()} 원</div>
            </div>
        ` : '<div></div>'; // 내용이 없으면 빈 div

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
                                    <td>${item.service.replace(/\n/g, '<br>')}</td>
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