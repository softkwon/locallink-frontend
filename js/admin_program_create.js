// js/admin_program_create.js & js/admin_program_edit.js 공통 최종 코드 (2025-06-28 02:25:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 기본 변수 선언 ---
    const token = localStorage.getItem('locallink-token');
    const programId = new URLSearchParams(window.location.search).get('id');
    const isEditMode = !!programId;
    const form = document.getElementById(isEditMode ? 'editProgramForm' : 'createProgramForm');
    
    // 페이지 요소 찾기
    const loadingMessage = document.getElementById('loadingMessage');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');
    const effectsContainer = document.getElementById('effects-container');
    const addEffectBtn = document.getElementById('add-effect-btn');
    const organizationsContainer = document.getElementById('organizations-container');
    const addOrganizationBtn = document.getElementById('add-organization-btn');
    const opportunityEffectsContainer = document.getElementById('opportunity-effects-container');
    const addOpportunityEffectBtn = document.getElementById('add-opportunity-effect-btn');
    
    // 상태 관리 변수
    let existingImages = {}; 
    let newSectionFiles = {}; 

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!form) {
            console.error('오류: 폼 요소를 찾을 수 없습니다. HTML의 form 태그 id를 확인해주세요.');
            return;
        }
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        
        attachEventListeners(); // 모든 이벤트 리스너를 먼저 연결합니다.

        if (isEditMode) {
            await loadAndRenderProgramData(); // 수정 모드일 경우 데이터 로드
        } else {
            // 생성 모드일 경우 기본 빈 행들을 추가
            addSectionRow(); 
            addEffectRow(); 
            addOrganizationRow(); 
            addOpportunityEffectRow();
        }
    }

    // --- 3. 데이터 로딩 및 렌더링 (수정 페이지 전용) ---
    async function loadAndRenderProgramData() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/programs/${programId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const errorResult = await response.json().catch(() => null);
                throw new Error(errorResult ? errorResult.message : '프로그램 정보를 불러오는데 실패했습니다.');
            }
            const result = await response.json();
            if (result.success) {
                renderProgramForm(result.program);
                if(loadingMessage) loadingMessage.style.display = 'none';
                form.classList.remove('hidden');
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            if(loadingMessage) loadingMessage.textContent = `오류: ${err.message}`;
        }
    }

    function renderProgramForm(program) {
        safeSetValue('title', program.title);
        safeSetValue('program_code', program.program_code);
        safeSetValue('esg_category', program.esg_category);
        safeSetValue('program_overview', program.program_overview);
        safeSetValue('risk_text', program.risk_text);
        safeSetValue('risk_description', program.risk_description);
        
        const serviceCheckboxes = document.querySelectorAll('input[name="service_region"]');
        serviceCheckboxes.forEach(cb => { cb.checked = false; cb.disabled = false; });
        if (program.service_regions && Array.isArray(program.service_regions)) {
            if (program.service_regions.includes('전국')) {
                const nationwideCheckbox = document.querySelector('input[value="전국"]');
                if(nationwideCheckbox) {
                    nationwideCheckbox.checked = true;
                    nationwideCheckbox.dispatchEvent(new Event('change'));
                }
            } else {
                program.service_regions.forEach(regionValue => {
                    const checkbox = document.querySelector(`input[name="service_region"][value="${regionValue}"]`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        }
        
        opportunityEffectsContainer.innerHTML = '';
        if (program.opportunity_effects && program.opportunity_effects.length > 0) {
            program.opportunity_effects.forEach(effect => addOpportunityEffectRow(effect));
        } else { addOpportunityEffectRow(); }
        
        sectionsContainer.innerHTML = '';
        if (program.content && program.content.length > 0) {
            program.content.forEach(section => addSectionRow(section));
        } else { addSectionRow(); }

        effectsContainer.innerHTML = '';
        if (program.economic_effects && program.economic_effects.length > 0) {
            program.economic_effects.forEach(effect => addEffectRow(effect));
        } else { addEffectRow(); }

        organizationsContainer.innerHTML = '';
        if (program.related_links && program.related_links.length > 0) {
            program.related_links.forEach(org => addOrganizationRow(org));
        } else { addOrganizationRow(); }
    }

    // --- 4. 동적 UI 생성 및 헬퍼 함수들 ---
    /**
     * 파일명: js/admin_program_edit.js
     * 수정 위치: addSectionRow 함수 전체
     * 수정 일시: 2025-07-06 10:35
     */
    function addSectionRow(section = {}) {
        const sectionId = 'section-' + Date.now() + Math.random();
        newSectionFiles[sectionId] = [];
        // 수정 모드일 때, 기존 이미지 URL들을 이 섹션 ID에 연결하여 상태를 관리합니다.
        if(isEditMode) {
            existingImages[sectionId] = section.images || [];
        }

        const newSection = document.createElement('div');
        newSection.className = 'content-section'; 
        newSection.id = sectionId;
        
        // ★★★ UI를 요청하신 내용으로 수정합니다. ★★★
        newSection.innerHTML = `
            <div style="display: flex; justify-content: flex-end;"><button type="button" class="button-danger button-sm remove-section-btn">X</button></div>
            <div class="form-group">
                <label>소제목</label>
                <input type="text" class="form-control section-subheading" value="${section.subheading || ''}">
            </div>
            <div class="form-group">
                <label>상세 내용</label>
                <textarea class="form-control section-description" rows="8">${section.description || ''}</textarea>
            </div>
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
                        <option value="text-right">이미지(좌) / 텍스트(우)</option>
                        <option value="img-bottom">텍스트(상) / 이미지(하)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>내용 글자 크기 (px)</label>
                    <input type="number" class="form-control section-desc-size" value="${section.description_size || 16}">
                </div>
            </div>
        `;
        sectionsContainer.appendChild(newSection);

        if(isEditMode) {
            // DB에 저장된 레이아웃 값으로 드롭다운의 초기값을 설정합니다.
            newSection.querySelector('.section-layout').value = section.layout || 'img-top';
            // 기존 이미지들의 미리보기를 렌더링합니다.
            renderImagePreviews(sectionId);
        }
    }

    function addEffectRow(effect = {}) {
        const newEffect = document.createElement('div');
        newEffect.className = 'effect-item form-group-inline';
        newEffect.innerHTML = `
            <select class="form-control effect-type"><option value="unit_effect" ${effect.type === 'unit_effect' ? 'selected' : ''}>단위 기대효과</option><option value="per_ton_effect" ${effect.type === 'per_ton_effect' ? 'selected' : ''}>톤당 기대효과</option></select>
            <input type="number" class="form-control effect-value" placeholder="효과 값(원)" value="${effect.value || ''}"><input type="text" class="form-control effect-description" placeholder="설명" value="${effect.description || ''}"><button type="button" class="button-danger button-sm remove-effect-btn">X</button>`;
        effectsContainer.appendChild(newEffect);
    }
    
    function addOrganizationRow(org = {}) {
        const newOrg = document.createElement('div');
        newOrg.className = 'organization-item form-group-inline';
        newOrg.innerHTML = `
            <div class="form-group" style="flex: 2;"><label>단체명</label><input type="text" class="form-control organization-name" placeholder="예: 한국환경산업기술원" value="${org.organization_name || ''}"></div>
            <div class="form-group" style="flex: 3;"><label>단체 홈페이지</label><input type="text" class="form-control homepage-url" placeholder="URL 주소" value="${org.homepage_url || ''}"></div>
            <button type="button" class="button-danger button-sm remove-organization-btn">X</button>`;
        organizationsContainer.appendChild(newOrg);
    }

    function updateFormulaPreview(row) {
        if (!row) return;
        const previewEl = row.querySelector('.formula-preview');
        const avgSelect = row.querySelector('.opportunity-avg-data-key');
        const factorInput = row.querySelector('.opportunity-correction-factor');
        if (!previewEl || !avgSelect || !factorInput) return;
        const avgOption = avgSelect.options[avgSelect.selectedIndex];
        const avgText = (avgOption && avgOption.value) ? avgOption.text : '산업 평균값';
        const factorText = factorInput.value || '보정값';
        const effectText = '단위/톤당 기대효과';
        previewEl.textContent = `(${avgText}) x (${effectText}) x (${factorText})`;
    }

    function addOpportunityEffectRow(effect = {}) {
        const isCalc = effect.type === 'calculation';
        const newRow = document.createElement('div');
        newRow.className = 'form-fieldset'; newRow.style.paddingTop = '10px'; newRow.style.marginTop = '10px'; newRow.style.borderTop = '1px dashed #ccc';
        newRow.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;"><strong>개선 시 기대효과</strong><button type="button" class="button-danger button-sm remove-opportunity-btn">X</button></div>
            <div class="form-group"><label>입력 방식</label><select class="form-control opportunity-type-select"><option value="text" ${!isCalc ? 'selected' : ''}>직접 입력</option><option value="calculation" ${isCalc ? 'selected' : ''}>계산식 사용</option></select></div>
            <div class="opportunity-calc-fields" style="display: ${isCalc ? 'block' : 'none'};"><div class="form-group"><label>계산에 사용할 산업 평균값</label><select class="form-control opportunity-avg-data-key"><option value="">-- 선택 --</option></select></div><div class="form-group"><label>보정값</label><input type="number" class="form-control opportunity-correction-factor" value="${isCalc && effect.rule && effect.rule.params ? (effect.rule.params.correctionFactor || 1.0) : 1.0}" step="0.1"></div><div class="form-group"><label>계산식 미리보기</label><p class="formula-preview" style="font-family: monospace; background: #eee; padding: 10px; border-radius: 4px;"></p></div><div class="form-group"><label>결과 표시 텍스트 (세부 설명)</label><textarea class="form-control opportunity-description" rows="2" placeholder="예: 연간 약 {value} 원 절감. {value}는 자동 계산됩니다.">${isCalc ? (effect.description || '') : ''}</textarea></div></div>
            <div class="opportunity-text-fields" style="display: ${!isCalc ? 'block' : 'none'};"><div class="form-group"><label>개선 시 기대효과 (요약 텍스트)</label><input type="text" class="form-control opportunity-text-value" value="${!isCalc ? (effect.value || '') : ''}" placeholder="예: 기업 이미지 약 30% 상승"></div></div>`;
        opportunityEffectsContainer.appendChild(newRow);
        const selectElement = newRow.querySelector('.opportunity-avg-data-key');
        populateAverageDataDropdown(selectElement).then(() => {
            if (isCalc && effect.rule?.params?.avgDataKey) {
                selectElement.value = effect.rule.params.avgDataKey;
            }
            updateFormulaPreview(newRow);
        });
        newRow.querySelector('.opportunity-avg-data-key').addEventListener('change', () => updateFormulaPreview(newRow));
        newRow.querySelector('.opportunity-correction-factor').addEventListener('input', () => updateFormulaPreview(newRow));
        newRow.querySelector('.opportunity-type-select').addEventListener('change', (e) => {
            const calcFields = newRow.querySelector('.opportunity-calc-fields');
            const textFields = newRow.querySelector('.opportunity-text-fields');
            calcFields.style.display = e.target.value === 'calculation' ? 'block' : 'none';
            textFields.style.display = e.target.value === 'text' ? 'block' : 'none';
            if (e.target.value === 'calculation') updateFormulaPreview(newRow);
        });
    }

    async function populateAverageDataDropdown(selectElement) {
        if (!selectElement) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/industry-average-columns`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success && result.columns) {
                while (selectElement.options.length > 1) { selectElement.remove(1); }
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
        const section = document.getElementById(sectionId);
        if (!section) return;
        const previewContainer = section.querySelector('.image-preview-container');
        previewContainer.innerHTML = '';
        (existingImages[sectionId] || []).forEach((filename, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-wrapper';
            wrapper.innerHTML = `<img src="${STATIC_BASE_URL}/uploads/programs/${filename}" style="width: 100px; height: 100px; object-fit: cover;"><button type="button" class="remove-preview-btn" data-type="existing" data-section-id="${sectionId}" data-index="${index}">X</button>`;
            previewContainer.appendChild(wrapper);
        });
        (newSectionFiles[sectionId] || []).forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview-wrapper';
                wrapper.innerHTML = `<img src="${event.target.result}" style="width: 100px; height: 100px; object-fit: cover;"><button type="button" class="remove-preview-btn" data-type="new" data-section-id="${sectionId}" data-index="${index}">X</button>`;
                previewContainer.appendChild(wrapper);
            };
            reader.readAsDataURL(file);
        });
    }

    function safeSetValue(id, value) {
        const element = document.getElementById(id);
        if (!element) { console.error(`[오류!] HTML에서 id가 "${id}"인 요소를 찾을 수 없습니다.`); return; }
        element.value = value || '';
    }
    
    function safeGetValue(id) {
        const element = document.getElementById(id);
        if (!element) { console.error(`[오류!] HTML에서 id가 "${id}"인 요소를 찾을 수 없습니다.`); return ''; }
        return element.value;
    }

    // --- 5. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if(addSectionBtn) addSectionBtn.addEventListener('click', () => addSectionRow());
        if(addEffectBtn) addEffectBtn.addEventListener('click', () => addEffectRow());
        if(addOrganizationBtn) addOrganizationBtn.addEventListener('click', () => addOrganizationRow());
        if(addOpportunityEffectBtn) addOpportunityEffectBtn.addEventListener('click', () => addOpportunityEffectRow());

        if(opportunityEffectsContainer) opportunityEffectsContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-opportunity-btn')) e.target.closest('.form-fieldset').remove(); });
        
        if(sectionsContainer) {
            sectionsContainer.addEventListener('click', e => {
                if (e.target.classList.contains('remove-section-btn')) e.target.closest('.content-section').remove();
                if (e.target.classList.contains('remove-preview-btn')) {
                    const { type, sectionId, index } = e.target.dataset;
                    if (type === 'existing') { existingImages[sectionId].splice(parseInt(index, 10), 1); } 
                    else { newSectionFiles[sectionId].splice(parseInt(index, 10), 1); }
                    renderImagePreviews(sectionId);
                }
            });
            sectionsContainer.addEventListener('change', e => {
                if (e.target.classList.contains('section-images')) {
                    const sectionId = e.target.closest('.content-section').id;
                    if (!newSectionFiles[sectionId]) newSectionFiles[sectionId] = [];
                    const totalImages = (isEditMode ? (existingImages[sectionId] || []) : []).length + newSectionFiles[sectionId].length + Array.from(e.target.files).length;
                    if (totalImages > 3) { alert('이미지는 섹션 당 최대 3개까지 업로드할 수 있습니다.'); e.target.value = ""; return; }
                    for (const file of e.target.files) {
                        if (file.size > 5 * 1024 * 1024) alert(`'${file.name}' 용량이 5MB를 초과합니다.`);
                        else newSectionFiles[sectionId].push(file);
                    }
                    e.target.value = "";
                    renderImagePreviews(sectionId);
                }
            });
        }
        
        if(effectsContainer) effectsContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-effect-btn')) e.target.closest('.effect-item').remove(); });
        if(organizationsContainer) organizationsContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-organization-btn')) e.target.closest('.organization-item').remove(); });
        
        const regionCheckboxes = document.querySelectorAll('input[name="service_region"]');
        const nationwideCheckbox = document.querySelector('input[value="전국"]');
        if (nationwideCheckbox) {
            regionCheckboxes.forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    if (e.target.value === '전국' && e.target.checked) {
                        regionCheckboxes.forEach(cb => { if (cb.value !== '전국') { cb.checked = false; cb.disabled = true; } });
                    } else if (e.target.value === '전국' && !e.target.checked) {
                        regionCheckboxes.forEach(cb => { if (cb.value !== '전국') { cb.disabled = false; } });
                    } else if (e.target.value !== '전국' && e.target.checked) {
                        nationwideCheckbox.checked = false;
                        regionCheckboxes.forEach(cb => cb.disabled = false);
                    }
                });
            });
        }
        
        // 폼 제출 이벤트를 여기에 연결
        form.addEventListener('submit', handleProgramSubmit);
    }
    
    // --- 6. 폼 제출 핸들러 ---
    /**
     * 파일명: js/admin_program_edit.js
     * 수정 위치: handleProgramSubmit 함수 전체
     * 수정 일시: 2025-07-06 10:35
     */
    async function handleProgramSubmit(event) {
        event.preventDefault();
        try {
            const formData = new FormData();
            // 기본 정보 추가 (기존과 동일)
            formData.append('title', safeGetValue('title'));
            formData.append('program_code', safeGetValue('program_code'));
            // ... (다른 기본 정보, 기대효과, 연계 단체 등 formData에 추가하는 로직은 기존과 동일)

            // ★★★ content 데이터와 이미지 파일을 함께 처리하는 로직 수정 ★★★
            const finalContent = [];
            let imageCounter = 0; // FormData에 추가될 파일의 고유 키를 만들기 위한 카운터

            for (const section of sectionsContainer.querySelectorAll('.content-section')) {
                const sectionId = section.id;
                const keptImages = (isEditMode && existingImages[sectionId]) ? existingImages[sectionId] : [];
                const newImageFiles = newSectionFiles[sectionId] || [];
                
                const newImagePlaceholders = [];
                // 새 파일들을 FormData에 추가하고, DB에 저장될 이름표(placeholder)를 생성
                newImageFiles.forEach(file => {
                    const placeholder = `new_image_${imageCounter++}`;
                    formData.append(placeholder, file, file.name); // 실제 파일
                    newImagePlaceholders.push(placeholder);      // 이름표
                });

                finalContent.push({
                    subheading: section.querySelector('.section-subheading').value,
                    description: section.querySelector('.section-description').value,
                    layout: section.querySelector('.section-layout').value, // 새 UI의 값을 읽음
                    description_size: section.querySelector('.section-desc-size').value,
                    images: [...keptImages, ...newImagePlaceholders] // 최종 이미지 목록 = 기존 URL + 새 이름표
                });
            }
            
            formData.append('content', JSON.stringify(finalContent));

            // --- 이하 서버 전송 로직은 기존과 동일 ---
            const url = isEditMode ? `${API_BASE_URL}/admin/programs/${programId}` : `${API_BASE_URL}/admin/programs`;
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || '저장 중 오류 발생');
            
            alert(result.message);
            if (result.success) { window.location.href = 'admin_programs.html'; }
        } catch (err) {
            console.error('프로그램 정보 저장 중 오류:', err);
            alert('프로그램 정보 저장 중 오류가 발생했습니다: ' + err.message);
        }
    }

    // --- 7. 페이지 시작 ---
    initializePage();
});