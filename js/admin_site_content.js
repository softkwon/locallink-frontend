// js/admin_site_content.js (2025-07-01 19:15:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';


document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const token = localStorage.getItem('locallink-token');
    const form = document.getElementById('siteContentForm');
    const loadingMessage = document.getElementById('loadingMessage');
    
    const mainSectionsContainer = document.getElementById('main-page-sections-container');
    const addMainSectionBtn = document.getElementById('add-main-section-btn');
    let mainSectionFiles = {}; 

    const sitesContainer = document.getElementById('related-sites-container');
    const addSiteBtn = document.getElementById('add-site-btn');

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!form) return;
        const hasPermission = await checkAdminPermission(['super_admin']);
        if (!hasPermission) {
            form.style.display = 'none';
            document.querySelector('.form-section').innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }
        await loadContent();
        attachEventListeners();
    }
    
    /**
     * 서버에서 모든 사이트 콘텐츠를 불러와 폼에 채우는 함수
     */
    async function loadContent() {
        try {
            const response = await fetch('${API_BASE_URL}/admin/site-content', { headers: { 'Authorization': `Bearer ${token}` }});
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            const { content, relatedSites } = result;
            const footerInfo = content.content || {};
            const mainPageContent = content.content_value || [];

            // 푸터, 약관 등 정적 필드 채우기
            document.getElementById('copyright').value = footerInfo.copyright || '';
            document.getElementById('company_info').value = footerInfo.company_info || '';
            document.getElementById('brn').value = footerInfo.brn || '';
            document.getElementById('address').value = footerInfo.address || '';
            document.getElementById('contact').value = footerInfo.contact || '';
            document.getElementById('terms_of_service').value = content.terms_of_service || '';
            document.getElementById('privacy_policy').value = content.privacy_policy || '';
            document.getElementById('marketing_consent_text').value = content.marketing_consent_text || '';

            // 메인 페이지 콘텐츠 섹션 렌더링
            mainSectionsContainer.innerHTML = '';
            if (mainPageContent.length > 0) {
                mainPageContent.forEach(section => addMainPageSectionRow(section));
            } else {
                addMainPageSectionRow();
            }

            // 관련 사이트 목록 렌더링
            sitesContainer.innerHTML = '';
            if (relatedSites.length > 0) {
                relatedSites.forEach(site => addSiteRow(site));
            } else {
                addSiteRow();
            }
            
            loadingMessage.style.display = 'none';
            form.classList.remove('hidden');
        } catch (error) {
            alert('콘텐츠 로딩 실패: ' + error.message);
            loadingMessage.textContent = '콘텐츠를 불러오는 데 실패했습니다.';
        }
    }

    /**
     * '메인 페이지 콘텐츠' 섹션을 동적으로 생성하는 함수
     */
    function addMainPageSectionRow(section = {}) {
        const sectionId = 'main-section-' + Date.now();
        mainSectionFiles[sectionId] = [];
        const newSection = document.createElement('div');
        newSection.className = 'content-section';
        newSection.id = sectionId;
        newSection.innerHTML = `
            <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;"><button type="button" class="button-danger button-sm remove-section-btn">X</button></div>
            <div class="form-group"><label>제목</label><input type="text" class="form-control section-title" value="${section.title || ''}"></div>
            <div class="form-group"><label>설명</label><textarea class="form-control section-description" rows="4">${section.description || ''}</textarea></div>
            <div class="form-group"><label>이미지 (최대 3개)</label><input type="file" class="form-control section-images" multiple accept="image/*"><div class="image-preview-container"></div></div>
            <div class="form-group"><label>이미지 너비(px)</label><input type="number" class="form-control section-image-width" value="${section.image_width || 400}"></div>
            <input type="hidden" class="kept-image-urls" value="${(section.images || []).map(img => img.file).join(',') || ''}">
            <div class="form-group"><label>레이아웃</label><select class="form-control section-layout">
                <option value="text-left">텍스트(좌)/이미지(우)</option>
                <option value="text-right">이미지(좌)/텍스트(우)</option>
            </select></div>
        `;
        mainSectionsContainer.appendChild(newSection);
        if(section.layout) newSection.querySelector('.section-layout').value = section.layout;
        renderImagePreviews(sectionId, section.images || []);
    }
    
    /**
     * '관련 사이트' 행을 동적으로 생성하는 함수
     */
    function addSiteRow(site = {}) {
        const row = document.createElement('div');
        row.className = 'related-site-row';
        row.innerHTML = `<input type="text" class="form-control site-name" placeholder="사이트 이름" value="${site.name || ''}"><input type="text" class="form-control site-url" placeholder="https://..." value="${site.url || ''}"><button type="button" class="button-danger button-sm remove-site-btn">X</button>`;
        sitesContainer.appendChild(row);
    }
    
    /**
     * 이미지 미리보기를 렌더링하는 함수
     */
    function renderImagePreviews(sectionId, existingImages = []) {
        const sectionDiv = document.getElementById(sectionId);
        if(!sectionDiv) return;
        const previewContainer = sectionDiv.querySelector('.image-preview-container');
        previewContainer.innerHTML = '';
        
        existingImages.forEach((imgData, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-wrapper';
            wrapper.innerHTML = `<img src="${STATIC_BASE_URL}/uploads/pages/${imgData.file}" width="100"><button type="button" class="remove-preview-btn" data-type="existing" data-index="${index}">X</button>`;
            previewContainer.appendChild(wrapper);
        });

        const newFiles = mainSectionFiles[sectionId] || [];
        newFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview-wrapper';
                wrapper.innerHTML = `<img src="${e.target.result}" width="100"><button type="button" class="remove-preview-btn" data-type="new" data-index="${index}">X</button>`;
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    }

    /**
     * 폼 제출 시 모든 데이터를 취합하여 서버로 보내는 함수
     */
    async function handleFormSubmit(e) {
        e.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';

        try {
            const formData = new FormData();
            
            formData.append('footer_info', JSON.stringify({
                copyright: document.getElementById('copyright').value,
                company_info: document.getElementById('company_info').value,
                brn: document.getElementById('brn').value,
                address: document.getElementById('address').value,
                contact: document.getElementById('contact').value,
            }));
            formData.append('terms_of_service', document.getElementById('terms_of_service').value);
            formData.append('privacy_policy', document.getElementById('privacy_policy').value);
            formData.append('marketing_consent_text', document.getElementById('marketing_consent_text').value);
            formData.append('related_sites', JSON.stringify(Array.from(sitesContainer.querySelectorAll('.related-site-row')).map(row => ({ name: row.querySelector('.site-name').value, url: row.querySelector('.site-url').value })).filter(site => site.name && site.url)));

            const mainPageContent = [];
            let imageCounter = 0;
            document.querySelectorAll('#main-page-sections-container .content-section').forEach(section => {
                const newFiles = mainSectionFiles[section.id] || [];
                let imagePlaceholders = [];
                newFiles.forEach(file => {
                    const placeholder = `main_image_${imageCounter++}`;
                    formData.append(placeholder, file);
                    imagePlaceholders.push({ file: placeholder });
                });
                const keptImages = (section.querySelector('.kept-image-urls').value.split(',').filter(Boolean) || []).map(file => ({file}));
                mainPageContent.push({
                    title: section.querySelector('.section-title').value,
                    description: section.querySelector('.section-description').value,
                    images: [...keptImages, ...imagePlaceholders],
                    image_width: parseInt(section.querySelector('.section-image-width').value, 10),
                    layout: section.querySelector('.section-layout').value,
                });
            });
            formData.append('main_page_content', JSON.stringify(mainPageContent));
            
            const response = await fetch('${API_BASE_URL}/admin/site-content', {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            if(result.success) window.location.reload();

        } catch (error) {
            alert('저장 중 오류가 발생했습니다: ' + error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '모든 변경사항 저장';
        }
    }

    // --- 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if(form) form.addEventListener('submit', handleFormSubmit);
        if(addMainSectionBtn) addMainSectionBtn.addEventListener('click', () => addMainPageSectionRow());
        if(addSiteBtn) addSiteBtn.addEventListener('click', () => addSiteRow());
        
        if(sitesContainer) sitesContainer.addEventListener('click', e => {
            if (e.target.classList.contains('remove-site-btn')) e.target.closest('.related-site-row').remove();
        });

        if(mainSectionsContainer) {
            mainSectionsContainer.addEventListener('click', e => {
                const target = e.target;
                const sectionElement = target.closest('.content-section');
                if (!sectionElement) return;
                const sectionId = sectionElement.id;

                if (target.matches('.remove-section-btn')) {
                    delete mainSectionFiles[sectionId];
                    sectionElement.remove();
                }
                if (target.matches('.remove-preview-btn')) {
                    const type = target.dataset.type;
                    const indexToRemove = parseInt(target.dataset.index);
                    if (type === 'new') {
                        mainSectionFiles[sectionId].splice(indexToRemove, 1);
                    } else {
                        const keptUrlsInput = sectionElement.querySelector('.kept-image-urls');
                        let urls = keptUrlsInput.value.split(',').filter(Boolean);
                        urls.splice(indexToRemove, 1);
                        keptUrlsInput.value = urls.join(',');
                    }
                    renderImagePreviews(sectionId, (sectionElement.querySelector('.kept-image-urls').value.split(',').filter(Boolean) || []).map(file=>({file})));
                }
            });
            mainSectionsContainer.addEventListener('change', e => {
                if (e.target.matches('.section-images')) {
                    const sectionId = e.target.closest('.content-section').id;
                    mainSectionFiles[sectionId] = Array.from(e.target.files);
                    renderImagePreviews(sectionId, (e.target.closest('.content-section').querySelector('.kept-image-urls').value.split(',').filter(Boolean) || []).map(file=>({file})));
                }
            });
        }
    }
    
    initializePage();
});
