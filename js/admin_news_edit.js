// js/admin_news_edit.js (2025-06-30 23:55:00)
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const form = document.getElementById('newsForm');
    const token = localStorage.getItem('locallink-token');
    const postId = new URLSearchParams(window.location.search).get('id');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');
    const loadingMessage = document.getElementById('loadingMessage');
    
    let sectionFiles = {}; // 각 섹션별 '새로 추가할' 파일들만 임시 관리

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!postId) {
            alert('유효하지 않은 게시물 ID입니다. 목록으로 돌아갑니다.');
            window.location.href = 'admin_news_list.html';
            return;
        }
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) {
            if(form) form.style.display = 'none';
            document.querySelector('.create-form-container').innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }
        
        await loadPostData();
        attachEventListeners();
    }
    
    // --- 3. 기능 함수들 ---

    /**
     * 기존 게시물 데이터를 서버에서 불러와 폼에 채우는 함수
     */
    async function loadPostData() {
        try {
            if(loadingMessage) loadingMessage.style.display = 'block';
            const response = await fetch(`${API_BASE_URL}/admin/news/${postId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            
            const post = result.post;
            document.getElementById('newsTitle').value = post.title;
            document.getElementById('newsCategory').value = post.category;
            
            const content = (typeof post.content === 'string') ? JSON.parse(post.content) : (post.content || []);
            
            sectionsContainer.innerHTML = '';
            if (content && Array.isArray(content) && content.length > 0) {
                content.forEach(section => addSectionRow(section));
            } else {
                addSectionRow(); // 콘텐츠가 없으면 빈 섹션 하나 추가
            }

            if(loadingMessage) loadingMessage.style.display = 'none';
            if(form) form.classList.remove('hidden');

        } catch (error) {
            alert(`게시물 로딩 실패: ${error.message}`);
            if(loadingMessage) loadingMessage.textContent = '게시물 로딩에 실패했습니다.';
        }
    }

    /** * 콘텐츠 섹션을 그리고, 기존 데이터를 채워넣는 함수
     * @param {object} section - 기존 섹션 데이터 (없으면 빈 객체)
     */
    function addSectionRow(section = {}) {
        const sectionId = 'section-' + Date.now() + Math.random().toString(36).substr(2, 9);
        sectionFiles[sectionId] = [];

        const newSection = document.createElement('div');
        newSection.className = 'content-section';
        newSection.id = sectionId;
        newSection.innerHTML = `
            <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                <button type="button" class="button-danger button-sm remove-section-btn">X</button>
            </div>
            <div class="content-section-grid">
                <div class="form-group">
                    <label>소제목</label>
                    <input type="text" class="form-control section-subheading" value="${section.subheading || ''}">
                </div>
                <div class="form-group">
                    <label>소제목 글자 크기(px)</label>
                    <input type="number" class="form-control section-subheading-size" value="${section.subheading_size || 28}">
                </div>
            </div>
            <div class="form-group">
                <label>상세 내용</label>
                <textarea class="form-control section-description" rows="5">${section.description || ''}</textarea>
            </div>
            <div class="form-group">
                <label>내용 글자 크기(px)</label>
                <input type="number" class="form-control section-description-size" value="${section.description_size || 16}">
            </div>
            <hr>
            <div class="content-section-grid">
                <div class="form-group">
                    <label>이미지 추가 (최대 3개)</label>
                    <input type="file" class="form-control section-images" multiple accept="image/*">
                </div>
                <div class="form-group">
                    <label>이미지 너비(px)</label>
                    <input type="number" class="form-control section-image-width" value="${section.image_width || 400}">
                </div>
            </div>
            <div class="image-preview-container"></div>
            <input type="hidden" class="kept-image-urls" value="${(section.images || []).join(',') || ''}">
            <hr>
            <div class="form-group">
                <label>레이아웃</label>
                <select class="form-control section-layout">
                    <option value="text-left">텍스트(좌)/이미지(우)</option>
                    <option value="text-right">이미지(좌)/텍스트(우)</option>
                    <option value="img-top-text-center">이미지(상)/텍스트(중앙)</option>
                    <option value="img-bottom-text-center">텍스트(상)/이미지(하)</option>
                </select>
            </div>
        `;
        sectionsContainer.appendChild(newSection);
        
        // 기존 레이아웃 값으로 select 메뉴 설정
        const layoutSelect = newSection.querySelector('.section-layout');
        if (section.layout) {
            layoutSelect.value = section.layout;
        }

        renderPreviews(sectionId);
    }
    
    /** 이미지 미리보기 렌더링 함수 (기존+신규) */
    function renderPreviews(sectionId) {
        const sectionDiv = document.getElementById(sectionId);
        if(!sectionDiv) return;
        const previewContainer = sectionDiv.querySelector('.image-preview-container');
        const hiddenInput = sectionDiv.querySelector('.kept-image-urls');
        const existingUrls = hiddenInput.value ? hiddenInput.value.split(',').filter(Boolean) : [];
        const newFiles = sectionFiles[sectionId] || [];

        previewContainer.innerHTML = '';
        
        existingUrls.forEach((url, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-wrapper';
            wrapper.innerHTML = `<img src="${STATIC_BASE_URL}${url}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"><button type="button" class="remove-preview-btn" data-type="existing" data-index="${index}">×</button>`;
            previewContainer.appendChild(wrapper);
        });
        
        newFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview-wrapper';
                wrapper.innerHTML = `<img src="${event.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"><button type="button" class="remove-preview-btn" data-type="new" data-index="${index}">×</button>`;
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    }

    /** 폼 전체 내용을 최종 저장하는 함수 */
    async function handleFormSubmit(e) {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '수정 중...';

        try {
            const formData = new FormData();
            formData.append('title', document.getElementById('newsTitle').value);
            formData.append('category', document.getElementById('newsCategory').value);

            const contentData = [];
            document.querySelectorAll('.content-section').forEach(section => {
                const newFiles = sectionFiles[section.id] || [];
                newFiles.forEach(file => formData.append('newImages', file));

                const keptImages = section.querySelector('.kept-image-urls').value.split(',').filter(Boolean);
                
                contentData.push({
                    subheading: section.querySelector('.section-subheading').value,
                    subheading_size: parseInt(section.querySelector('.section-subheading-size').value, 10),
                    description: section.querySelector('.section-description').value,
                    description_size: parseInt(section.querySelector('.section-description-size').value, 10),
                    images: [...keptImages, ...Array(newFiles.length).fill('placeholder')],
                    image_width: parseInt(section.querySelector('.section-image-width').value, 10),
                    layout: section.querySelector('.section-layout').value,
                });
            });
            formData.append('content', JSON.stringify(contentData));
            
            const response = await fetch(`${API_BASE_URL}/admin/news/${postId}`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            alert(result.message);
            if (result.success) window.location.href = 'admin_news_list.html';

        } catch (err) {
            alert('게시글 수정 중 오류가 발생했습니다: ' + err.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '수정 완료';
        }
    }

    // --- 4. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if (addSectionBtn) addSectionBtn.addEventListener('click', () => addSectionRow());
        if (form) form.addEventListener('submit', handleFormSubmit);

        if (sectionsContainer) {
            sectionsContainer.addEventListener('click', (e) => {
                const target = e.target;
                const sectionDiv = target.closest('.content-section');
                if (!sectionDiv) return;
                
                if (target.matches('.remove-section-btn')) {
                    if (confirm('이 섹션을 삭제하시겠습니까?')) sectionDiv.remove();
                }
                
                if (target.matches('.remove-preview-btn')) {
                    const type = target.dataset.type;
                    const indexToRemove = parseInt(target.dataset.index, 10);
                    
                    if(type === 'new') {
                        sectionFiles[sectionDiv.id].splice(indexToRemove, 1);
                    } else { 
                        const hiddenInput = sectionDiv.querySelector('.kept-image-urls');
                        let imageUrls = hiddenInput.value.split(',');
                        imageUrls.splice(indexToRemove, 1);
                        hiddenInput.value = imageUrls.join(',');
                    }
                    renderPreviews(sectionDiv.id);
                }
            });

            sectionsContainer.addEventListener('change', (e) => {
                if (e.target.matches('.section-images')) {
                    const sectionId = e.target.closest('.content-section').id;
                    const newFiles = Array.from(e.target.files);
                    if (!sectionFiles[sectionId]) sectionFiles[sectionId] = [];
                    
                    const hiddenInput = document.querySelector(`#${sectionId} .kept-image-urls`);
                    const existingUrls = hiddenInput.value ? hiddenInput.value.split(',').filter(Boolean) : [];
                    
                    if (existingUrls.length + sectionFiles[sectionId].length + newFiles.length > 3) {
                        alert('이미지는 섹션 당 최대 3개까지 업로드할 수 있습니다.'); e.target.value = ""; return;
                    }
                    newFiles.forEach(file => {
                        if (file.size > 5 * 1024 * 1024) { alert(`'${file.name}' 파일 용량이 5MB를 초과합니다.`); }
                        else { sectionFiles[sectionId].push(file); }
                    });
                    e.target.value = "";
                    renderPreviews(sectionId);
                }
            });
        }
    }
    
    // --- 5. 페이지 실행 ---
    initializePage();
});
