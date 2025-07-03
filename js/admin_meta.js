/**
 * 파일명: js/admin_meta.js
 * 기능: 사이트 공유 정보(메타 태그) 관리 페이지의 모든 기능
 * 수정 일시: 2025-07-04 03:10
 */

// 1. 필요한 모듈들을 각 파일에서 가져옵니다.
import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';
import { showCopyableCodeModal } from './helpers/modal_helper.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 페이지에서 사용할 DOM 요소들을 미리 찾아 변수에 담아둡니다. ---
    const token = localStorage.getItem('locallink-token');
    const form = document.getElementById('metaForm');
    const titleInput = document.getElementById('metaTitle');
    const descriptionInput = document.getElementById('metaDescription');
    const imagePreview = document.getElementById('imagePreview');
    const noImageText = document.getElementById('noImageText');
    const imageInput = document.getElementById('metaImage');
    const existingImageUrlInput = document.getElementById('existingImageUrl');

    /**
     * 페이지가 처음 로드될 때 실행되는 초기화 함수
     */
    async function initializePage() {
        // 관리자 권한이 있는지 확인 없으면 실행 중단
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) {
            document.body.innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        };
        // 저장된 메타 데이터를 불러와 폼에 채웁니다.
        loadMetaData();
    }

    /**
     * 서버에서 현재 저장된 메타 데이터를 불러와 화면에 표시하는 함수
     */
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
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            alert(`정보를 불러오는 데 실패했습니다: ${error.message}`);
        }
    }

    /**
     * '저장하기' 버튼을 눌렀을 때 실행될 이벤트 리스너
     */
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';

        // 폼 데이터를 생성합니다.
        const formData = new FormData();
        formData.append('title', titleInput.value);
        formData.append('description', descriptionInput.value);
        formData.append('existing_image_url', existingImageUrlInput.value);
        
        // 새 이미지를 선택한 경우에만 폼 데이터에 추가합니다.
        if (imageInput.files[0]) {
            formData.append('metaImage', imageInput.files[0]);
        }

        try {
            // 1. 서버에 데이터를 전송하여 저장(수정)합니다.
            const response = await fetch(`${API_BASE_URL}/admin/site-meta`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                alert('성공적으로 저장되었습니다!'); // 저장 성공 피드백
                
                // 2. 저장이 성공하면, 최신 정보를 서버에서 다시 불러옵니다.
                const metaResponse = await fetch(`${API_BASE_URL}/admin/site-meta`, { headers: { 'Authorization': `Bearer ${token}` }});
                const metaResult = await metaResponse.json();
                
                if (metaResult.success) {
                    const meta = metaResult.meta;
                    
                    // 3. 불러온 최신 정보로 HTML 코드 조각을 만듭니다.
                    const metaTagsHtml = `<meta property="og:type" content="website">
<meta property="og:title" content="${meta.title}">
<meta property="og:description" content="${meta.description}">
<meta property="og:image" content="${meta.image_url}">
<meta property="og:url" content="[내 웹사이트 도메인 주소]">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${meta.title}">
<meta name="twitter:description" content="${meta.description}">
<meta name="twitter:image" content="${meta.image_url}">`;

                    // 4. 완성된 코드와 함께 커스텀 모달 창을 띄웁니다.
                    showCopyableCodeModal("생성된 메타 태그 코드", metaTagsHtml);
                    loadMetaData(); // 현재 페이지의 미리보기 정보도 최신으로 업데이트
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

    // --- 페이지 시작 ---
    initializePage();
});