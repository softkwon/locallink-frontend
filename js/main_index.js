/**
 * 파일명: js/main_index.js
 * 기능: 메인 페이지의 동적 콘텐츠, 협력사, 최신 소식을 불러와 표시합니다.
 * 수정 일시: 2025-07-03 14:15
 */
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    function initializePage() {
        loadMainContent();
        initializePartnerGrid();
        loadLatestNews();
        attachEventListeners(); // 이 파일에서는 현재 필요 없어 보임
    }

    /**
     * 메인 페이지의 동적 콘텐츠 섹션을 불러와서 그리는 함수
     */
    async function loadMainContent() {
        const container = document.getElementById('main-content-container');
        if (!container) return;
        try {
            const response = await fetch(`${API_BASE_URL}/content/main_page_sections`);
            const result = await response.json(); // ★★★ 오타 수정: jon -> json ★★★

            if (result.success && Array.isArray(result.content) && result.content.length > 0) {
                container.innerHTML = '';
                result.content.forEach(section => {
                    const imagesHtml = (section.images || []).map(imgData => {
                        // ★★★ 이미지 URL 처리 로직 수정 ★★★
                        const imageUrl = (imgData.file && imgData.file.startsWith('http')) 
                            ? imgData.file // 전체 S3 URL이면 그대로 사용
                            : `${STATIC_BASE_URL}${imgData.file}`; // 그렇지 않으면 기존 방식 사용
                        return `<img src="${imageUrl}" alt="${section.title || ''}" style="width: auto; max-height:300px; object-fit:contain;">`;
                    }).join('');

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
            const response = await fetch(`${API_BASE_URL}/content/partners`);
            const result = await response.json();
            if (result.success && result.partners.length > 0) {
                gridContainer.innerHTML = '';
                result.partners.forEach(p => {
                    // ★★★ 이미지 URL 처리 로직 수정 ★★★
                    const logoUrl = (p.logo_url && p.logo_url.startsWith('http'))
                        ? p.logo_url // 전체 S3 URL이면 그대로 사용
                        : `${STATIC_BASE_URL}/uploads/partners/${p.logo_url}`; // 아니면 기존 방식
                    
                    const partnerDiv = document.createElement('div');
                    partnerDiv.className = 'partner-item';
                    partnerDiv.innerHTML = p.link_url
                        ? `<a href="${p.link_url}" target="_blank" title="${p.name}"><img src="${logoUrl}" alt="${p.name}"></a>`
                        : `<img src="${logoUrl}" alt="${p.name}">`;
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
     * '최신 소식'을 5개까지 불러와서 표시하는 함수
     */
    async function loadLatestNews() {
        const container = document.getElementById('latest-news-container');
        if (!container) return;

        try {
            const response = await fetch(`${API_BASE_URL}/news?limit=5`);
            const result = await response.json();

            if (result.success && result.posts.length > 0) {
                container.innerHTML = '';
                
                // ★★★ 1. 게시물 HTML 요소들을 배열에 먼저 담습니다. ★★★
                const postElements = result.posts.map(post => {
                    let representativeImage = `${STATIC_BASE_URL}/images/default_news.png`;
                    let snippet = '내용을 불러올 수 없습니다.';
                    try {
                        const contentData = (typeof post.content === 'string') ? JSON.parse(post.content) : (post.content || []);
                        if (contentData[0]?.images?.length > 0) {
                            const firstImage = contentData[0].images[0];
                            representativeImage = (firstImage && firstImage.startsWith('http'))
                                ? firstImage 
                                : `${STATIC_BASE_URL}${firstImage}`;
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

                // ★★★ 2. 원본 목록과 복제된 목록을 추가하여 무한 회전 효과를 만듭니다. ★★★
                postElements.forEach(el => container.appendChild(el));
                container.appendChild(moreLinkBox);
                // 원본 목록을 한 번 더 복제해서 뒤에 붙입니다.
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
        // 이 부분은 기존 코드에 있던 '문의하기'나 'ESG 진단하기' 등의
        // 버튼 클릭 이벤트를 처리하는 로직을 그대로 가져오시면 됩니다.
        // 예를 들어, 문의하기 모달 기능은 아래와 같습니다.
        const contactModal = document.getElementById('contactModal');
        const navContactTrigger = document.getElementById('navContactTrigger');
        const closeContactModalBtn = document.getElementById('closeContactModal');
        
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
    }

    // --- 페이지 시작 ---
    initializePage();
});