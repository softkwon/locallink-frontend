// js/admin_news_create.js (2025-06-30 23:55:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const form = document.getElementById('newsForm');
    const token = localStorage.getItem('locallink-token');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');
    
    let sectionFiles = {}; // { sectionId: [File, File], ... }

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!form) {
            console.error('오류: 폼 요소를 찾을 수 없습니다.');
            return;
        }
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) {
            form.style.display = 'none';
            document.querySelector('.create-form-container').innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }
        addSectionRow(); // 페이지 로드 시 기본 섹션 1개 추가
        attachEventListeners();
    }
    
    // --- 3. 기능 함수들 ---

    /** '콘텐츠 섹션' 한 개를 새로 그리는 함수 (모든 UI 옵션 포함) */
    function addSectionRow() {
        if (!sectionsContainer) return;
        const sectionId = 'section-' + Date.now();
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
                    <input type="text" class="form-control section-subheading">
                </div>
                <div class="form-group">
                    <label>소제목 글자 크기 (px)</label>
                    <input type="number" class="form-control section-subheading-size" value="28">
                </div>
            </div>
            <div class="form-group">
                <label>상세 내용</label>
                <textarea class="form-control section-description" rows="5"></textarea>
            </div>
            <div class="form-group">
                <label>내용 글자 크기 (px)</label>
                <input type="number" class="form-control section-description-size" value="16">
            </div>
            <hr>
            <div class="content-section-grid">
                <div class="form-group">
                    <label>이미지 추가 (최대 3개)</label>
                    <input type="file" class="form-control section-images" multiple accept="image/*">
                </div>
                <div class="form-group">
                    <label>이미지 너비 (px)</label>
                    <input type="number" class="form-control section-image-width" value="400">
                </div>
            </div>
            <div class="image-preview-container"></div>
            <hr>
            <div class="form-group">
                <label>레이아웃</label>
                <select class="form-control section-layout">
                    <option value="text-left">텍스트(좌) / 이미지(우)</option>
                    <option value="text-right">이미지(좌) / 텍스트(우)</option>
                    <option value="img-top-text-center">이미지(상) / 텍스트(중앙)</option>
                    <option value="img-bottom-text-center">텍스트(상) / 이미지(하)</option>
                </select>
            </div>
        `;
        sectionsContainer.appendChild(newSection);
    }
    
    /** 선택된 파일들의 미리보기를 그려주는 함수 */
    function renderPreviews(sectionId) {
        const sectionDiv = document.getElementById(sectionId);
        if(!sectionDiv) return;
        const previewContainer = sectionDiv.querySelector('.image-preview-container');
        previewContainer.innerHTML = '';
        const files = sectionFiles[sectionId] || [];
        files.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview-wrapper';
                wrapper.innerHTML = `<img src="${event.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"><button type="button" class="remove-preview-btn" data-section-id="${sectionId}" data-file-index="${index}" title="이미지 제거">×</button>`;
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    }

    /** 폼 최종 제출을 처리하는 함수 */
    async function handleFormSubmit(e) {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';

        try {
            const formData = new FormData();
            
            // 1. 기본 텍스트 데이터 추가
            formData.append('title', document.getElementById('newsTitle').value);
            formData.append('category', document.getElementById('newsCategory').value);
            // status는 백엔드에서 'draft'로 자동 설정됩니다.

            // 2. content 데이터와 이미지 파일 추가
            const contentData = [];
            let imageCounter = 0;
            document.querySelectorAll('.content-section').forEach(section => {
                const files = sectionFiles[section.id] || [];
                let imagePlaceholders = [];

                files.forEach(file => {
                    const placeholder = `image_${imageCounter++}`;
                    formData.append(placeholder, file, file.name); // 실제 파일 추가
                    imagePlaceholders.push(placeholder); // 파일의 이름(key)을 저장
                });

                contentData.push({
                    subheading: section.querySelector('.section-subheading').value,
                    subheading_size: parseInt(section.querySelector('.section-subheading-size').value, 10),
                    description: section.querySelector('.section-description').value,
                    description_size: parseInt(section.querySelector('.section-description-size').value, 10),
                    images: imagePlaceholders, // 이미지 파일의 이름(key) 배열
                    image_width: parseInt(section.querySelector('.section-image-width').value, 10),
                    layout: section.querySelector('.section-layout').value,
                });
            });
            formData.append('content', JSON.stringify(contentData));
            
            // 3. 서버에 한 번에 전송
            const response = await fetch(`${API_BASE_URL}/admin/news`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            alert(result.message);
            if (result.success) window.location.href = 'admin_news_list.html';

        } catch (err) {
            alert('게시글 저장 중 오류가 발생했습니다: ' + err.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '글 저장하기';
        }
    }

    // --- 4. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if (addSectionBtn) addSectionBtn.addEventListener('click', addSectionRow);
        if (form) form.addEventListener('submit', handleFormSubmit);

        if (sectionsContainer) {
            sectionsContainer.addEventListener('click', (e) => {
                if (e.target.matches('.remove-section-btn')) {
                    if (confirm('이 섹션을 삭제하시겠습니까?')) {
                        const section = e.target.closest('.content-section');
                        delete sectionFiles[section.id];
                        section.remove();
                    }
                }
                if (e.target.matches('.remove-preview-btn')) {
                    const sectionId = e.target.closest('.content-section').id;
                    const fileIndex = parseInt(e.target.dataset.fileIndex, 10);
                    sectionFiles[sectionId].splice(fileIndex, 1);
                    renderPreviews(sectionId);
                }
            });
            sectionsContainer.addEventListener('change', (e) => {
                if (e.target.matches('.section-images')) {
                    const sectionId = e.target.closest('.content-section').id;
                    const newFiles = Array.from(e.target.files);
                    sectionFiles[sectionId] = sectionFiles[sectionId] || [];
                    if (sectionFiles[sectionId].length + newFiles.length > 3) {
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
