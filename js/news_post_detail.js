// js/news_post_detail.js (2025-07-01 11:30:00)
document.addEventListener('DOMContentLoaded', async function() {
    const postId = new URLSearchParams(window.location.search).get('id');
    const container = document.getElementById('post-detail-container');
    if (!postId) {
        container.innerHTML = '<h2>게시물 ID가 올바르지 않습니다.</h2>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/news/${postId}`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        const post = result.post;
        document.title = `${post.title} - LocalLink`;

        let sectionsHtml = '';
        const contentSections = (typeof post.content === 'string') ? JSON.parse(post.content) : (post.content || []);
        
        contentSections.forEach(section => {
            // ★ 3. 이미지 HTML 생성 시, 관리자 페이지에서 설정한 image_width 값을 적용합니다. ★
            const imagesHtml = (section.images || []).map(imgUrl => 
                `<img src="${STATIC_BASE_URL}${imgUrl}" alt="게시물 이미지" style="width: ${section.image_width || 400}px;">`
            ).join('');

            // 레이아웃과 정렬 클래스 적용 부분을 제거하고, 고정된 구조로 변경합니다.
            sectionsHtml += `
                <div class="content-section">
                    ${imagesHtml ? `<div class="image-content">${imagesHtml}</div>` : ''}
                    <div class="text-content">
                        <h3 style="font-size: ${section.subheading_size || 24}px;">${section.subheading || ''}</h3>
                        <div style="font-size: ${section.description_size || 16}px;">
                            ${section.description || ''}
                        </div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="post-wrapper">
                <div class="post-header">
                    <h1>${post.title}</h1>
                    <div class="post-meta">
                        <span class="category">${post.category}</span> | <span>${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                    </div>
                </div>
                <div class="post-body">
                    ${sectionsHtml}
                </div>
                <div class="back-to-list-container">
                    <a href="javascript:history.back()" class="button-secondary">목록으로</a>
                </div>
            </div>
        `;

    } catch (error) {
        container.innerHTML = `<h2>게시물을 불러오는 중 오류가 발생했습니다.</h2><p>${error.message}</p>`;
    }
});