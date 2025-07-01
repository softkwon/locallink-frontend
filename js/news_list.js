// js/news_list.js (2025-07-01 01:50:00)

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const params = new URLSearchParams(window.location.search);
    const category = params.get('category'); // 'locallink' 또는 'trends'
    const token = localStorage.getItem('locallink-token');

    const titleEl = document.getElementById('news-title');
    const postsContainer = document.getElementById('postsContainer');
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const writeBtnContainer = document.getElementById('writeBtnContainer');

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!category) {
            if(postsContainer) postsContainer.innerHTML = '<h2>잘못된 카테고리 접근입니다.</h2>';
            return;
        }

        // 카테고리에 따라 페이지 제목과 글쓰기 버튼 링크 설정
        if (category === 'locallink') {
            if(titleEl) titleEl.textContent = 'LocalLink 소식';
            if(writeBtnContainer) writeBtnContainer.href = `admin_news_create.html?category=${category}`;
        } else if (category === 'trends') {
            if(titleEl) titleEl.textContent = 'ESG Market';
            if(writeBtnContainer) writeBtnContainer.href = `admin_news_create.html?category=${category}`;
        }

        // 관리자일 경우에만 '글쓰기' 버튼 표시
        if (token) {
            try {
                const meRes = await fetch('${API_BASE_URL}/users/me', { headers: { 'Authorization': `Bearer ${token}` }});
                if(meRes.ok) {
                    const meResult = await meRes.json();
                    if(meResult.success && ['super_admin', 'content_manager'].includes(meResult.user.role)) {
                        if(writeBtnContainer) writeBtnContainer.style.display = 'inline-block';
                    }
                }
            } catch(e) { console.error("Admin check failed:", e); }
        }

        await loadPosts();
        attachEventListeners();
    }
    
    // --- 3. 핵심 기능 함수 ---

    /**
     * 서버에서 게시물 목록을 불러오는 함수
     * @param {string} searchTerm - 검색어
     */
    async function loadPosts(searchTerm = '') {
        if (!postsContainer) return;
        postsContainer.innerHTML = '<p>게시물을 불러오는 중입니다...</p>';
        try {
            // ★★★ 수정된 부분: URL에서 가져온 category 코드를 변환 없이 그대로 사용합니다. ★★★
            let apiUrl = `${API_BASE_URL}/news?category=${category}`;
            if (searchTerm) {
                apiUrl += `&searchTerm=${encodeURIComponent(searchTerm)}`;
            }
            const response = await fetch(apiUrl);
            const result = await response.json();

            if (result.success) {
                renderPosts(result.posts);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            postsContainer.innerHTML = `<p>게시물을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        }
    }

    /**
     * 받아온 데이터로 게시물 카드를 화면에 그리는 함수
     */
    function renderPosts(posts) {
        if (!postsContainer) return;
        postsContainer.innerHTML = '';
        if (posts.length === 0) {
            postsContainer.innerHTML = '<p>게시물이 없습니다.</p>';
            return;
        }

        posts.forEach(post => {
            const postBox = document.createElement('a');
            postBox.className = 'post-box';
            postBox.href = `news_post_detail.html?id=${post.id}`;
            
            // ★★★ is_pinned가 true이면, 'pinned-post' 클래스를 추가합니다. ★★★
            if (post.is_pinned) {
                postBox.classList.add('pinned-post');
            }
            
            let representativeImage = '${STATIC_BASE_URL}/images/default_news.png';
            let snippet = '내용을 불러올 수 없습니다.';
            
            try {
                const contentData = (typeof post.content === 'string') ? JSON.parse(post.content) : (post.content || []);
                
                if (contentData[0]?.images && contentData[0].images.length > 0) {
                    representativeImage = `${STATIC_BASE_URL}${contentData[0].images[0]}`;
                }
                
                const firstSectionText = contentData[0]?.description || '';
                snippet = firstSectionText.replace(/<[^>]*>?/gm, '').substring(0, 100) + '...';

            } catch(e) {
                console.error(`Post ID ${post.id}의 content 처리 실패:`, e);
            }

            postBox.innerHTML = `
                <img src="${representativeImage}" alt="${post.title}" class="post-box-image">
                <div class="post-box-content">
                    <h3>${post.title}</h3>
                    <p>${snippet}</p>
                    <span class="post-box-date">${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
            `;
            postsContainer.appendChild(postBox);
        });
    }

    /**
     * 모든 이벤트 리스너를 연결하는 함수
     */
    function attachEventListeners() {
        if (searchBtn) {
            searchBtn.addEventListener('click', () => loadPosts(searchInput.value));
        }
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') loadPosts(searchInput.value);
            });
        }
    }

    // --- 4. 페이지 실행 ---
    initializePage();
});
