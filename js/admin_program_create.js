
import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 기본 변수 선언 ---
    const token = localStorage.getItem('locallink-token');
    const form = document.getElementById('createProgramForm');
    
    // 페이지 요소 찾기
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');
    const effectsContainer = document.getElementById('effects-container');
    const addEffectBtn = document.getElementById('add-effect-btn');
    const organizationsContainer = document.getElementById('organizations-container');
    const addOrganizationBtn = document.getElementById('add-organization-btn');
    const opportunityEffectsContainer = document.getElementById('opportunity-effects-container');
    const addOpportunityEffectBtn = document.getElementById('add-opportunity-effect-btn');
    
    // 상태 관리 변수
    let newSectionFiles = {}; 

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!form) {
            console.error('오류: 폼 요소를 찾을 수 없습니다. HTML id를 확인해주세요.');
            return;
        }
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) {
            form.innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }
        
        attachEventListeners();

        // 생성 모드이므로 기본 빈 행들을 추가
        addSectionRow(); 
        addEffectRow(); 
        addOrganizationRow(); 
        addOpportunityEffectRow();
    }

    // --- 3. 동적 UI 생성 함수들 ---
    function addSectionRow() {
        const sectionId = 'section-' + Date.now() + Math.random().toString(36).substr(2, 9);
        newSectionFiles[sectionId] = [];

        const newSection = document.createElement('div');
        newSection.className = 'content-section'; 
        newSection.id = sectionId;
        
        newSection.innerHTML = `
            <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                <button type="button" class="button-danger button-sm remove-section-btn">X</button>
            </div>
            <div class="form-group"><label>소제목</label><input type="text" class="form-control section-subheading"></div>
            <div class="form-group"><label>상세 내용</label><textarea class="form-control section-description" rows="8"></textarea></div>
            <div class="form-group">
                <label>이미지 파일 (최대 3개)</label>
                <div class="image-preview-container" style="margin-bottom:10px;"></div>
                <input type="file" class="form-control section-images" multiple accept="image/*">
            </div>
            <div class="form-group-inline">
                <div class="form-group">
                    <label>이미지 배치</label>
                    <select class="form-control section-layout">
                        <option value="img-top">이미지(상) / 텍스트(하)</option>
                        <option value="text-left">텍스트(좌) / 이미지(우)</option>
                        <option value="img-left">이미지(좌) / 텍스트(우)</option>
                        <option value="img-bottom">텍스트(상) / 이미지(하)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>내용 글자 크기 (px)</label>
                    <input type="number" class="form-control section-desc-size" value="16">
                </div>
            </div>
        `;
        sectionsContainer.appendChild(newSection);
    }

    function addEffectRow() {
        const newEffect = document.createElement('div');
        newEffect.className = 'effect-item form-group-inline';
        newEffect.innerHTML = `<select class="form-control effect-type"><option value="unit_effect">단위 기대효과</option><option value="per_ton_effect">톤당 기대효과</option></select><input type="number" class="form-control effect-value" placeholder="효과 값(원)"><input type="text" class="form-control effect-description" placeholder="설명"><button type="button" class="button-danger button-sm remove-effect-btn">X</button>`;
        effectsContainer.appendChild(newEffect);
    }
    
    function addOrganizationRow() {
        const newOrg = document.createElement('div');
        newOrg.className = 'organization-item form-group-inline';
        newOrg.innerHTML = `<div class="form-group" style="flex: 2;"><label>단체명</label><input type="text" class="form-control organization-name" placeholder="예: 한국환경산업기술원"></div><div class="form-group" style="flex: 3;"><label>단체 홈페이지</label><input type="text" class="form-control homepage-url" placeholder="URL 주소"></div><button type="button" class="button-danger button-sm remove-organization-btn">X</button>`;
        organizationsContainer.appendChild(newOrg);
    }

    function addOpportunityEffectRow() {
        const newRow = document.createElement('div');
        newRow.className = 'form-fieldset';
        newRow.style.cssText = 'padding-top: 10px; margin-top: 10px; border-top: 1px dashed #ccc;';
        newRow.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <strong>개선 시 기대효과</strong>
                <button type="button" class="button-danger button-sm remove-opportunity-btn">X</button>
            </div>
            <div class="form-group">
                <label>입력 방식</label>
                <select class="form-control opportunity-type-select">
                    <option value="text" selected>직접 입력</option>
                    <option value="calculation">계산식 사용</option>
                </select>
            </div>
            <div class="opportunity-calc-fields" style="display: none;">
                <div class="form-group"><label>계산에 사용할 산업 평균값</label><select class="form-control opportunity-avg-data-key"><option value="">-- 선택 --</option></select></div>
                <div class="form-group"><label>보정값</label><input type="number" class="form-control opportunity-correction-factor" value="1.0" step="0.1"></div>
                <div class="form-group"><label>계산식 미리보기</label><p class="formula-preview" style="font-family: monospace; background: #eee; padding: 10px; border-radius: 4px;"></p></div>
                <div class="form-group"><label>결과 표시 텍스트 (세부 설명)</label><textarea class="form-control opportunity-description" rows="2" placeholder="예: 연간 약 {value} 원 절감. {value}는 자동 계산됩니다."></textarea></div>
            </div>
            <div class="opportunity-text-fields" style="display: block;">
                <div class="form-group"><label>개선 시 기대효과 (요약 텍스트)</label><input type="text" class="form-control opportunity-text-value" placeholder="예: 기업 이미지 약 30% 상승"></div>
            </div>`;
        opportunityEffectsContainer.appendChild(newRow);
        
        // 이벤트 리스너 연결
        const selectElement = newRow.querySelector('.opportunity-avg-data-key');
        populateAverageDataDropdown(selectElement);
        newRow.querySelector('.opportunity-type-select').addEventListener('change', (e) => {
            const calcFields = newRow.querySelector('.opportunity-calc-fields');
            const textFields = newRow.querySelector('.opportunity-text-fields');
            calcFields.style.display = e.target.value === 'calculation' ? 'block' : 'none';
            textFields.style.display = e.target.value === 'text' ? 'block' : 'none';
        });
    }

    async function populateAverageDataDropdown(selectElement) {
        if (!selectElement) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/industry-average-columns`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success && result.columns) {
                result.columns.forEach(columnName => {
                    const option = document.createElement('option');
                    option.value = columnName;
                    option.textContent = columnName;
                    selectElement.appendChild(option);
                });
            }
        } catch (error) { console.error('산업 평균 컬럼 목록 로딩 실패:', error); }
    }
    
    function renderImagePreviews(sectionId) {
        const sectionDiv = document.getElementById(sectionId);
        if (!sectionDiv) return;
        const previewContainer = sectionDiv.querySelector('.image-preview-container');
        const newFiles = newSectionFiles[sectionId] || [];
        
        previewContainer.innerHTML = '';
        
        newFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview-wrapper';
                wrapper.innerHTML = `<img src="${event.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"><button type="button" class="remove-preview-btn" data-index="${index}">X</button>`;
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    }
    
    function safeGetValue(id) {
        const element = document.getElementById(id);
        return element ? element.value : '';
    }

    // --- 4. 폼 제출 핸들러 ---
    async function handleProgramSubmit(event) {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = '저장 중...';

        try {
            const formData = new FormData();
            
            formData.append('title', safeGetValue('title'));
            formData.append('program_code', safeGetValue('program_code'));
            formData.append('esg_category', safeGetValue('esg_category'));
            formData.append('program_overview', safeGetValue('program_overview'));
            formData.append('risk_text', safeGetValue('risk_text'));
            formData.append('risk_description', safeGetValue('risk_description'));
            
            const economicEffects = Array.from(document.querySelectorAll('#effects-container .effect-item')).map(item => ({ type: item.querySelector('.effect-type').value, value: parseFloat(item.querySelector('.effect-value').value) || 0, description: item.querySelector('.effect-description').value })).filter(item => item.value || item.description);
            formData.append('economic_effects', JSON.stringify(economicEffects));

            const partnerOrganizations = Array.from(document.querySelectorAll('#organizations-container .organization-item')).map(item => ({ organization_name: item.querySelector('.organization-name').value, homepage_url: item.querySelector('.homepage-url').value })).filter(item => item.organization_name || item.homepage_url);
            formData.append('related_links', JSON.stringify(partnerOrganizations));
            
            const opportunityEffects = [];
            document.querySelectorAll('#opportunity-effects-container .form-fieldset').forEach(row => {
                const type = row.querySelector('.opportunity-type-select').value;
                if (type === 'text') {
                    const value = row.querySelector('.opportunity-text-value').value;
                    if (value) opportunityEffects.push({ type: 'text', value: value });
                } else {
                    const avgDataKey = row.querySelector('.opportunity-avg-data-key').value;
                    if (avgDataKey) { opportunityEffects.push({ type: 'calculation', description: row.querySelector('.opportunity-description').value, rule: { type: 'calculation', params: { avgDataKey, correctionFactor: parseFloat(row.querySelector('.opportunity-correction-factor').value) || 1.0 } } }); }
                }
            });
            formData.append('opportunity_effects', JSON.stringify(opportunityEffects));

            const serviceRegions = Array.from(document.querySelectorAll('input[name="service_region"]:checked')).map(checkbox => checkbox.value);
            formData.append('service_regions', serviceRegions.join(','));

            const finalContent = [];
            let imageCounter = 0; 
            document.querySelectorAll('.content-section').forEach(section => {
                const sectionId = section.id;
                const newFiles = newSectionFiles[sectionId] || [];
                const newImagePlaceholders = [];

                newFiles.forEach(file => {
                    const placeholder = `new_image_${imageCounter++}`;
                    formData.append(placeholder, file, file.name);
                    newImagePlaceholders.push(placeholder);
                });
                
                finalContent.push({
                    subheading: section.querySelector('.section-subheading').value,
                    description: section.querySelector('.section-description').value,
                    layout: section.querySelector('.section-layout').value,
                    description_size: parseInt(section.querySelector('.section-desc-size').value, 10),
                    images: newImagePlaceholders
                });
            });
            formData.append('content', JSON.stringify(finalContent));
            
            const url = `${API_BASE_URL}/admin/programs`;
            const method = 'POST';
            
            const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const result = await response.json();

            if (!response.ok) throw new Error(result.message || '저장 중 오류 발생');
            
            alert(result.message);
            if (result.success) window.location.href = 'admin_programs.html';

        } catch (err) {
            console.error('프로그램 정보 저장 중 오류:', err);
            alert('프로그램 정보 저장 중 오류가 발생했습니다: ' + err.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = '저장하기';
        }
    }
    
    // --- 5. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if(addSectionBtn) addSectionBtn.addEventListener('click', () => addSectionRow());
        if(addEffectBtn) addEffectBtn.addEventListener('click', () => addEffectRow());
        if(addOrganizationBtn) addOrganizationBtn.addEventListener('click', () => addOrganizationRow());
        if(addOpportunityEffectBtn) addOpportunityEffectBtn.addEventListener('click', () => addOpportunityEffectRow());

        if (sectionsContainer) {
            sectionsContainer.addEventListener('click', e => {
                const target = e.target;
                const sectionDiv = target.closest('.content-section');
                if (!sectionDiv) return;
                
                if (target.matches('.remove-section-btn')) {
                    if (confirm('이 섹션을 삭제하시겠습니까?')) sectionDiv.remove();
                }
                
                if (target.matches('.remove-preview-btn')) {
                    const indexToRemove = parseInt(target.dataset.index, 10);
                    newSectionFiles[sectionDiv.id].splice(indexToRemove, 1);
                    renderImagePreviews(sectionDiv.id);
                }
            });

            sectionsContainer.addEventListener('change', e => {
                if (e.target.classList.contains('section-images')) {
                    const sectionId = e.target.closest('.content-section').id;
                    if (!newSectionFiles[sectionId]) newSectionFiles[sectionId] = [];
                    
                    const currentNewFiles = newSectionFiles[sectionId] || [];
                    if (currentNewFiles.length + e.target.files.length > 3) {
                        alert('이미지는 섹션 당 최대 3개까지 업로드할 수 있습니다.'); e.target.value = ""; return;
                    }
                    for (const file of e.target.files) {
                        if (file.size > 5 * 1024 * 1024) {
                            alert(`'${file.name}' 용량이 5MB를 초과합니다.`);
                        } else {
                            newSectionFiles[sectionId].push(file);
                        }
                    }
                    e.target.value = "";
                    renderImagePreviews(sectionId);
                }
            });
        }
        
        if(opportunityEffectsContainer) opportunityEffectsContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-opportunity-btn')) e.target.closest('.form-fieldset').remove(); });
        if(effectsContainer) effectsContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-effect-btn')) e.target.closest('.effect-item').remove(); });
        if(organizationsContainer) organizationsContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-organization-btn')) e.target.closest('.organization-item').remove(); });

        form.addEventListener('submit', handleProgramSubmit);
    }

    // --- 6. 페이지 시작 ---
    initializePage();
});