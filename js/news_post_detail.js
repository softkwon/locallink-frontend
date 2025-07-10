//[2025-07-10] [js/news_post_detail.js] [공유 기능 및 줄바꿈 처리 추가]//

import { API_BASE_URL } from './config.js';

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
        
        renderPostDetails(result.post);

    } catch (error) {
        container.innerHTML = `<h2>게시물을 불러오는 중 오류가 발생했습니다.</h2><p>${error.message}</p>`;
    }
});

function renderPostDetails(post) {
    document.title = `${post.title} - ESGlink`;
    const container = document.getElementById('post-detail-container');

    // ★★★ 1. 공유 썸네일용 첫 번째 이미지 URL 찾기 ★★★
    const contentSections = Array.isArray(post.content) ? post.content : [];
    const firstImage = contentSections.flatMap(s => s.images || []).find(Boolean) || 'https://esglink.co.kr/images/logo_og.png';
    
    // ★★★ 2. 공유 썸네일을 위한 meta 태그 동적 업데이트 ★★★
    document.querySelector('meta[property="og:title"]').setAttribute('content', post.title);
    document.querySelector('meta[property="og:description"]').setAttribute('content', post.title); // 필요시 요약 내용으로 변경
    document.querySelector('meta[property="og:image"]').setAttribute('content', firstImage);

    const sectionsHtml = contentSections.map(section => {
        const imagesHtml = (section.images || []).map(imgUrl => 
            `<img src="${imgUrl}" alt="게시물 이미지" style="width: ${section.image_width || 400}px;">`
        ).join('');

        // ★★★ 3. description의 줄바꿈(\n)을 <br> 태그로 변환 ★★★
        const descriptionHtml = (section.description || '').replace(/\n/g, '<br>');

        return `
            <div class="content-section">
                ${imagesHtml ? `<div class="image-content">${imagesHtml}</div>` : ''}
                <div class="text-content">
                    <h3 style="font-size: ${section.subheading_size || 24}px;">${section.subheading || ''}</h3>
                    <div style="font-size: ${section.description_size || 16}px;">
                        ${descriptionHtml}
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.innerHTML = `
        <div class="post-wrapper">
            <div class="post-header">
                <div class="share-container">
                    <button class="share-button" id="shareBtn">🔗</button>
                    <div class="share-dropdown" id="shareDropdown">
                        <a href="#" id="copyLinkBtn">링크 복사</a>
                        <a href="#" id="kakaoShareBtn">카카오톡 공유</a>
                    </div>
                </div>
                <h1>${post.title}</h1>
                <div class="post-meta">
                    <span class="category">${post.category}</span> | <span>${new Date(post.created_at).toLocaleDateString('ko-KR')}</span>
                </div>
            </div>
            <div class="post-body">${sectionsHtml}</div>
            <div class="back-to-list-container">
                <a href="javascript:history.back()" class="button-secondary">목록으로</a>
            </div>
        </div>
    `;

    // ★★★ 5. 공유 기능 이벤트 리스너 연결 ★★★
    attachShareEventListeners(post, firstImage);
}

function attachShareEventListeners(post, thumbnailUrl) {
    const shareBtn = document.getElementById('shareBtn');
    const shareDropdown = document.getElementById('shareDropdown');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const kakaoShareBtn = document.getElementById('kakaoShareBtn');

    shareBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        shareDropdown.style.display = shareDropdown.style.display === 'block' ? 'none' : 'block';
    });

    document.addEventListener('click', (e) => {
        if (!shareBtn.contains(e.target)) {
            shareDropdown.style.display = 'none';
        }
    });

    copyLinkBtn.addEventListener('click', (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert('게시물 링크가 복사되었습니다.');
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
                title: post.title,
                description: 'ESGlink에서 최신 소식을 확인하세요.', // 요약 내용
                imageUrl: thumbnailUrl,
                link: {
                    mobileWebUrl: window.location.href,
                    webUrl: window.location.href,
                },
            },
            buttons: [
                {
                    title: '자세히 보기',
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