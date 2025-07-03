import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async function() {
    
    const token = localStorage.getItem('locallink-token');
    const form = document.getElementById('metaForm');
    const titleInput = document.getElementById('metaTitle');
    const descriptionInput = document.getElementById('metaDescription');
    const imagePreview = document.getElementById('imagePreview');
    const noImageText = document.getElementById('noImageText');
    const imageInput = document.getElementById('metaImage');
    const existingImageUrlInput = document.getElementById('existingImageUrl');

    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        loadMetaData();
    }

    async function loadMetaData() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/site-meta`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                const meta = result.meta;
                titleInput.value = meta.title || '';
                descriptionInput.value = meta.description || '';
                existingImageUrlInput.value = meta.image_url || '';

                if (meta.image_url) {
                    imagePreview.src = meta.image_url;
                    imagePreview.style.display = 'block';
                    noImageText.style.display = 'none';
                } else {
                    imagePreview.style.display = 'none';
                    noImageText.style.display = 'block';
                }
            }
        } catch (error) {
            alert('정보를 불러오는 데 실패했습니다.');
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';

        const formData = new FormData();
        formData.append('title', titleInput.value);
        formData.append('description', descriptionInput.value);
        formData.append('existing_image_url', existingImageUrlInput.value);
        
        if (imageInput.files[0]) {
            formData.append('metaImage', imageInput.files[0]);
        }

        try {
            const response = await fetch(`${API_BASE_URL}/admin/site-meta`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                // ★★★ 1. 저장이 성공하면, 최신 정보를 다시 불러옵니다. ★★★
                const metaResponse = await fetch(`${API_BASE_URL}/admin/site-meta`, { headers: { 'Authorization': `Bearer ${token}` }});
                const metaResult = await metaResponse.json();
                
                if (metaResult.success) {
                    const meta = metaResult.meta;
                    
                    // ★★★ 2. 불러온 최신 정보로 HTML 코드 조각을 만듭니다. ★★★
                    const metaTagsHtml = `
    <meta property="og:title" content="${meta.title}">
    <meta property="og:description" content="${meta.description}">
    <meta property="og:image" content="${meta.image_url}">

    <meta name="twitter:title" content="${meta.title}">
    <meta name="twitter:description" content="${meta.description}">
    <meta name="twitter:image" content="${meta.image_url}">
                    `;

                    // ★★★ 3. 완성된 코드와 안내 메시지를 alert 창으로 보여줍니다. ★★★
                    alert(
    `✅ 성공적으로 저장되었습니다!

    아래 코드를 복사하여 index.html 파일의 <head> 태그 안에 붙여넣고 배포하세요.
    (기존 meta 태그가 있다면 이 코드로 덮어쓰세요)
    --------------------------------------------------
    ${metaTagsHtml}
    --------------------------------------------------
    `
                    );
                    loadMetaData(); // 페이지의 미리보기 정보도 업데이트
                }
            } else {
                alert(result.message);
            }
        } catch (error) {
            alert('저장 중 오류가 발생했습니다.');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '저장하기';
        }
    });

    initializePage();
});