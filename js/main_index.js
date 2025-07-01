// js/main_index.js (2025-07-01 18:45:00)

document.addEventListener('DOMContentLoaded', function() {
    
    function initializePage() {
        loadMainContent();
        initializePartnerGrid();
        loadLatestNews();
        attachEventListeners();
    }

    /**
     * 메인 페이지의 동적 콘텐츠 섹션을 불러와서 그리는 함수
     */
    async function loadMainContent() {
        const container = document.getElementById('main-content-container');
        if (!container) return;
        try {
            const response = await fetch('${API_BASE_URL}/content/main_page_sections');
            const result = await response.json();

            if (result.success && Array.isArray(result.content) && result.content.length > 0) {
                container.innerHTML = '';
                result.content.forEach(section => {
                    // ★★★ content의 images는 [{file: '경로'}] 형태이므로, imgData.file로 접근합니다. ★★★
                    const imagesHtml = (section.images || []).map(imgData => {
                        const imageUrl = `${STATIC_BASE_URL}${imgData.file}`;
                        return `<img src="${imageUrl}" alt="${section.title || ''}" style="width: auto; max-height:300px; object-fit:contain;">`;
                    }).join('');

                    // ★★★ 요청하신 UI/UX 개선을 위해 h2, p 태그에 class를 추가합니다. ★★★
                    const sectionHtml = `
                        <section class="section main-intro-section ${section.layout === 'text-right' ? 'layout-text-right' : ''}">
                            <div class="container">
                                <div class="content">
                                    <div class="text-content">
                                        <h2 class="main-title">${section.title || ''}</h2>
                                        <p class="main-description">${section.description ? section.description.replace(/\n/g, '<br>') : ''}</p>
                                    </div>
                                    <div class="image-content">${imagesHtml}</div>
                                </div>
                            </div>
                        </section>
                    `;
                    container.innerHTML += sectionHtml;
                });
            }
        } catch (error) {
            console.error('메인 콘텐츠 로딩 실패:', error);
            if(container) container.innerHTML = '<p>콘텐츠를 불러오는 데 실패했습니다.</p>';
        }
    }

    /**
     * 협력사 로고 그리드를 초기화하는 함수
     */
    async function initializePartnerGrid() {
        const gridContainer = document.getElementById('partner-grid');
        if(!gridContainer) return;
        try {
            const response = await fetch('${API_BASE_URL}/content/partners');
            const result = await response.json();
            if (result.success && result.partners.length > 0) {
                gridContainer.innerHTML = '';
                result.partners.forEach(p => {
                    const partnerDiv = document.createElement('div');
                    partnerDiv.className = 'partner-item';
                    partnerDiv.innerHTML = `
                        <a href="${p.link_url || '#'}" target="_blank" title="${p.name}">
                            <img src="${STATIC_BASE_URL}/uploads/partners/${p.logo_url}" alt="${p.name}">
                        </a>
                    `;
                    gridContainer.appendChild(partnerDiv);
                });
            } else {
                 if(gridContainer) gridContainer.innerHTML = '<p style="text-align:center;">협력사 정보가 없습니다.</p>';
            }
        } catch(e) {
            console.error('협력사 로고 로딩 실패', e);
            if(gridContainer) gridContainer.innerHTML = "<p>협력사 정보를 불러오는 데 실패했습니다.</p>";
        }
    }

    /**
     * '최신 소식'을 5개까지 불러와서 자동 회전 캐러셀로 표시하는 함수
     */
    async function loadLatestNews() {
        const container = document.getElementById('latest-news-container');
        if (!container) return;

        try {
            const response = await fetch('${API_BASE_URL}/news?limit=5');
            const result = await response.json();

            if (result.success && result.posts.length > 0) {
                container.innerHTML = '';
                
                const postElements = result.posts.map(post => {
                    let representativeImage = '${STATIC_BASE_URL}/images/default_news.png';
                    let snippet = '내용을 불러올 수 없습니다.';
                    try {
                        const contentData = (typeof post.content === 'string') ? JSON.parse(post.content) : (post.content || []);
                        if (contentData[0]?.images?.length > 0) {
                            representativeImage = `${STATIC_BASE_URL}${contentData[0].images[0]}`;
                        }
                        const firstSectionText = contentData[0]?.description || '';
                        snippet = firstSectionText.replace(/<[^>]*>?/gm, '').substring(0, 80) + '...';
                    } catch(e) {}

                    const postLink = document.createElement('a');
                    postLink.className = 'post-box';
                    postLink.href = `news_post_detail.html?id=${post.id}`;
                    if (post.is_pinned) postLink.classList.add('pinned-post');

                    postLink.innerHTML = `
                        <img src="${representativeImage}" alt="${post.title}" class="post-box-image">
                        <div class="post-box-content">
                            <h3>${post.title}</h3>
                            <p>${snippet}</p>
                            <span class="post-box-date">${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                        </div>
                    `;
                    return postLink;
                });

                const moreLinkBox = document.createElement('a');
                moreLinkBox.className = 'more-link-box';
                moreLinkBox.href = 'news_list.html?category=trends';
                moreLinkBox.innerHTML = `<span class="plus-icon">+</span><span>더보기</span>`;

                postElements.forEach(el => container.appendChild(el));
                container.appendChild(moreLinkBox);
                postElements.forEach(el => container.appendChild(el.cloneNode(true)));
                container.appendChild(moreLinkBox.cloneNode(true));

            } else {
                container.innerHTML = '<p>최신 소식이 없습니다.</p>';
            }
        } catch (error) {
            console.error("최신 소식 로딩 실패:", error);
            container.innerHTML = '<p>소식을 불러오는 중 오류가 발생했습니다.</p>';
        }
    }
    
    /**
     * 페이지의 주요 이벤트 리스너를 설정하는 함수
     */
    function attachEventListeners() {
        // 문의하기 모달 기능
        const contactModal = document.getElementById('contactModal');
        const navContactTrigger = document.getElementById('navContactTrigger');
        const closeContactModalBtn = document.getElementById('closeContactModal');
        const contactForm = document.getElementById('contactForm');
        
        if (navContactTrigger) {
            navContactTrigger.addEventListener('click', (event) => {
                event.preventDefault();
                if (contactModal) contactModal.style.display = 'flex';
            });
        }
        if (closeContactModalBtn) {
            closeContactModalBtn.onclick = () => { if (contactModal) contactModal.style.display = 'none'; };
        }
        window.addEventListener('click', (event) => {
            if (event.target == contactModal) contactModal.style.display = 'none';
        });

        // 'ESG 진단하기' 등 다른 헤더 링크 기능
        const token = localStorage.getItem('locallink-token');
        const surveyLinks = document.querySelectorAll('a[href="survey_step1.html"]');
        surveyLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                if (!token) {
                    alert('로그인이 필요한 서비스입니다.');
                    return window.location.href = 'main_login.html';
                }
                try {
                    const response = await fetch('${API_BASE_URL}/diagnoses/count', { headers: { 'Authorization': `Bearer ${token}` } });
                    const result = await response.json();
                    if (result.success && result.count < result.limit) {
                        sessionStorage.removeItem('currentDiagnosisId');
                        window.location.href = 'survey_step1.html';
                    } else {
                        alert(`진단 횟수(${result.limit}회)를 모두 사용하셨습니다.\n회원정보에서 이전 진단 기록을 삭제하고 다시 시도해주세요.`);
                    }
                } catch (error) { alert('오류가 발생했습니다.'); }
            });
        });
    }
    
    // --- 페이지 시작 ---
    initializePage();
});
