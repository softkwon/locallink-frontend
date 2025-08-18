
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission, getCompanySizeName } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('locallink-token');
    const programId = new URLSearchParams(window.location.search).get('id');
    const isEditMode = !!programId;
    const form = document.getElementById(isEditMode ? 'editProgramForm' : 'createProgramForm');
    
    const loadingMessage = document.getElementById('loadingMessage');
    const sectionsContainer = document.getElementById('sections-container');
    const addSectionBtn = document.getElementById('add-section-btn');
    const effectsContainer = document.getElementById('effects-container');
    const addEffectBtn = document.getElementById('add-effect-btn');
    const organizationsContainer = document.getElementById('organizations-container');
    const addOrganizationBtn = document.getElementById('add-organization-btn');
    const opportunityEffectsContainer = document.getElementById('opportunity-effects-container');
    const addOpportunityEffectBtn = document.getElementById('add-opportunity-effect-btn');
    const serviceCostsContainer = document.getElementById('service-costs-container');
    const addServiceCostBtn = document.getElementById('add-service-cost-btn');

    let existingImages = {}; 
    let newSectionFiles = {}; 
    let currentUserRole = null;

    async function initializePage() {
        if (!form) {
            console.error('오류: 폼 요소를 찾을 수 없습니다. HTML의 form 태그 id를 확인해주세요.');
            return;
        }
        
        const permissionResult = await checkAdminPermission(['super_admin', 'content_manager'], true); 
        
        if (!permissionResult.hasPermission) return;
        
        currentUserRole = permissionResult.user.role; 

        if (currentUserRole === 'super_admin') {
            const authorContainer = document.getElementById('author-select-container');
            if (authorContainer) {
                authorContainer.style.display = 'block';
                await loadContentManagers(); 
            }
        }

        attachEventListeners(); 

        if (isEditMode) {
            await loadAndRenderProgramData(); 
        } else {
            addSectionRow(); 
            addEffectRow(); 
            addOrganizationRow(); 
            addOpportunityEffectRow();
        }
    }

    async function loadContentManagers() {
        const authorSelect = document.getElementById('author_id');
        if (!authorSelect) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/admins-list`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success) {
                authorSelect.innerHTML = '<option value="">-- 소유자 선택 (기본: 본인) --</option>';
                result.admins.forEach(admin => {
                    const option = document.createElement('option');
                    option.value = admin.id;
                    option.textContent = `${admin.company_name} (ID: ${admin.id})`;
                    authorSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("콘텐츠 매니저 목록 로딩 실패:", error);
        }
    }
    
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
        // --- 기본 정보 채우기 ---
        safeSetValue('title', program.title);
        safeSetValue('program_code', program.program_code);
        safeSetValue('esg_category', program.esg_category);
        safeSetValue('program_overview', program.program_overview);
        safeSetValue('risk_text', program.risk_text);
        safeSetValue('risk_description', program.risk_description);
        safeSetValue('potential_e', program.potential_e);
        safeSetValue('potential_s', program.potential_s);
        safeSetValue('potential_g', program.potential_g);

        const isAdminRecommendedCheckbox = document.getElementById('is_admin_recommended');
        if (isAdminRecommendedCheckbox) {
            isAdminRecommendedCheckbox.checked = program.is_admin_recommended || false;
        }

        // --- [수정] 서비스 비용 정보 채우기 ---
        if (program.existing_cost_details) {
            safeSetValue('existing_cost_description', program.existing_cost_details.description);
            safeSetValue('existing_cost_amount', program.existing_cost_details.amount);
        } else {
            safeSetValue('existing_cost_description', '');
            safeSetValue('existing_cost_amount', '');
        }
        
        serviceCostsContainer.innerHTML = '';
        if (program.service_costs && program.service_costs.length > 0) {
            program.service_costs.forEach(cost => addServiceCostRow(cost));
        } else {
            addServiceCostRow();
        }
        
        if (program.execution_type) {
            const radioBtn = document.querySelector(`input[name="executionType"][value="${program.execution_type}"]`);
            if (radioBtn) {
                radioBtn.checked = true;
            }
        }
        
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
        
        const selectedSolutionCategories = program.solution_categories || [];
        document.querySelectorAll('input[name="solution_category"]').forEach(checkbox => {
            if (selectedSolutionCategories.includes(checkbox.value)) {
                checkbox.checked = true; 
            } else {
                checkbox.checked = false;
            }
        });

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

    function addSectionRow(section = {}) {
        const sectionId = 'section-' + Date.now() + Math.random().toString(36).substr(2, 9);
        newSectionFiles[sectionId] = [];

        const newSection = document.createElement('div');
        newSection.className = 'content-section'; 
        newSection.id = sectionId;
        
        newSection.innerHTML = `
            <div style="display:flex; justify-content:flex-end; margin-bottom: 15px;">
                <button type="button" class="button-danger button-sm remove-section-btn">X</button>
            </div>
            <div class="form-group"><label>소제목</label><input type="text" class="form-control section-subheading" value="${section.subheading || ''}"></div>
            <div class="form-group"><label>상세 내용</label><textarea class="form-control section-description" rows="8">${section.description || ''}</textarea></div>
            
            <div class="form-group">
                <label>이미지 파일 (최대 3개)</label>
                <div class="image-preview-container" style="margin-bottom:10px;"></div>
                <input type="file" class="form-control section-images" multiple accept="image/*">
                <input type="hidden" class="kept-image-urls" value="${(section.images || []).join(',') || ''}">
            </div>
            
            <div class="form-group-inline">
                <div class="form-group">
                    <label>이미지 배치</label>
                    <select class="form-control section-layout">
                        <option value="img-top">이미지(상) / 텍스트(하)</option>
                        <option value="text-left">텍스트(좌) / 이미지(우)</option>
                        <option value="img-left">이미지(좌) / 텍스트(우)</option> <option value="img-bottom">텍스트(상) / 이미지(하)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>내용 글자 크기 (px)</label>
                    <input type="number" class="form-control section-desc-size" value="${section.description_size || 16}">
                </div>
            </div>
        `;
        sectionsContainer.appendChild(newSection);

        if (isEditMode) {
            const layoutValue = section.layout === 'text-right' ? 'img-left' : section.layout;
            newSection.querySelector('.section-layout').value = layoutValue || 'img-top';
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

    function addServiceCostRow(cost = {}) {
        const newRow = document.createElement('div');
        newRow.className = 'service-cost-item form-group-inline';
        newRow.innerHTML = `
            <div class="form-group" style="flex: 2;">
                <label>제공 서비스</label>
                <textarea class="form-control service-description" rows="3">${cost.service || ''}</textarea>
            </div>
            <div class="form-group" style="flex: 1;">
                <label>금액 (원)</label>
                <input type="number" class="form-control service-amount" value="${cost.amount || ''}">
            </div>
            <button type="button" class="button-danger button-sm remove-service-cost-btn">X</button>
        `;
        serviceCostsContainer.appendChild(newRow);
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
        const sectionDiv = document.getElementById(sectionId);
        if (!sectionDiv) return;

        const previewContainer = sectionDiv.querySelector('.image-preview-container');
        const hiddenInput = sectionDiv.querySelector('.kept-image-urls');
        
        if (!previewContainer || !hiddenInput) return;

        const existingUrls = hiddenInput.value ? hiddenInput.value.split(',').filter(Boolean) : [];
        const newFiles = newSectionFiles[sectionId] || [];

        previewContainer.innerHTML = '';
        
        existingUrls.forEach((url, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'image-preview-wrapper';
            
            
            const imageUrl = url;

            wrapper.innerHTML = `<img src="${imageUrl}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"><button type="button" class="remove-preview-btn" data-type="existing" data-index="${index}">X</button>`;
            previewContainer.appendChild(wrapper);
        });
        
        newFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const wrapper = document.createElement('div');
                wrapper.className = 'image-preview-wrapper';
                wrapper.innerHTML = `<img src="${event.target.result}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 4px;"><button type="button" class="remove-preview-btn" data-type="new" data-index="${index}">X</button>`;
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

    function attachEventListeners() {
        if(addSectionBtn) addSectionBtn.addEventListener('click', () => addSectionRow());
        if(addEffectBtn) addEffectBtn.addEventListener('click', () => addEffectRow());
        if(addOrganizationBtn) addOrganizationBtn.addEventListener('click', () => addOrganizationRow());
        if(addOpportunityEffectBtn) addOpportunityEffectBtn.addEventListener('click', () => addOpportunityEffectRow());

        if(opportunityEffectsContainer) opportunityEffectsContainer.addEventListener('click', e => { if (e.target.classList.contains('remove-opportunity-btn')) e.target.closest('.form-fieldset').remove(); });
        
        if (sectionsContainer) {
            sectionsContainer.addEventListener('click', e => {
                const target = e.target;
                const sectionDiv = target.closest('.content-section');
                if (!sectionDiv) return;
                
                if (target.matches('.remove-section-btn')) {
                    if (confirm('이 섹션을 삭제하시겠습니까?')) sectionDiv.remove();
                }
                
                if (target.matches('.remove-preview-btn')) {
                    const type = target.dataset.type;
                    const indexToRemove = parseInt(target.dataset.index, 10);
                    
                    if (type === 'new') { 
                        newSectionFiles[sectionDiv.id].splice(indexToRemove, 1);
                    } else { 
                        const hiddenInput = sectionDiv.querySelector('.kept-image-urls');
                        let imageUrls = hiddenInput.value.split(',');
                        imageUrls.splice(indexToRemove, 1);
                        hiddenInput.value = imageUrls.join(',');
                    }
                    renderImagePreviews(sectionDiv.id);
                }
            });

            sectionsContainer.addEventListener('change', e => {
                if (e.target.classList.contains('section-images')) {
                    const sectionId = e.target.closest('.content-section').id;
                    if (!newSectionFiles[sectionId]) newSectionFiles[sectionId] = [];
                    const hiddenInput = document.querySelector(`#${sectionId} .kept-image-urls`);
                    const existingUrls = hiddenInput.value ? hiddenInput.value.split(',').filter(Boolean) : [];
                     const currentNewFiles = newSectionFiles[sectionId] || [];

                    if (existingUrls.length + currentNewFiles.length + e.target.files.length > 3) {
                    alert('이미지는 섹션 당 최대 3개까지 업로드할 수 있습니다.'); e.target.value = ""; return;
                    }
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

        if(addServiceCostBtn) addServiceCostBtn.addEventListener('click', () => addServiceCostRow());

        if(serviceCostsContainer) {
            serviceCostsContainer.addEventListener('click', e => {
                if (e.target.classList.contains('remove-service-cost-btn')) {
                    e.target.closest('.service-cost-item').remove();
                }
            });
        }
        
        form.addEventListener('submit', handleProgramSubmit);
    }
        
    
    async function handleProgramSubmit(event) {
        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = isEditMode ? '수정 중...' : '저장 중...';

        try {
            const formData = new FormData();
            
            if (currentUserRole === 'super_admin') {
                const authorId = document.getElementById('author_id').value;
                if (authorId) {
                    formData.append('author_id', authorId);
                }
            }

            formData.append('title', safeGetValue('title'));
            formData.append('program_code', safeGetValue('program_code'));
            formData.append('esg_category', safeGetValue('esg_category'));
            formData.append('program_overview', safeGetValue('program_overview'));
            formData.append('risk_text', safeGetValue('risk_text'));
            formData.append('risk_description', safeGetValue('risk_description'));
            formData.append('potential_e', safeGetValue('potential_e'));
            formData.append('potential_s', safeGetValue('potential_s'));
            formData.append('potential_g', safeGetValue('potential_g'));

            const isAdminRecommended = document.getElementById('is_admin_recommended')?.checked || false;
            formData.append('is_admin_recommended', isAdminRecommended);
            
            const executionType = document.querySelector('input[name="executionType"]:checked')?.value || 'donation';
            formData.append('execution_type', executionType);
            
            const serviceRegions = Array.from(document.querySelectorAll('input[name="service_region"]:checked')).map(checkbox => checkbox.value);
            formData.append('service_regions', serviceRegions.join(','));

            const selectedSolutionCategories = Array.from(document.querySelectorAll('input[name="solution_category"]:checked')).map(cb => cb.value);
            formData.append('solution_categories', selectedSolutionCategories.join(','));
            
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

            // --- [수정] 서비스 비용 데이터 수집 ---
            const existingCostDetails = {
                description: safeGetValue('existing_cost_description'),
                amount: parseFloat(safeGetValue('existing_cost_amount')) || null
            };
            formData.append('existing_cost_details', JSON.stringify(existingCostDetails));
            
            const serviceCosts = Array.from(document.querySelectorAll('.service-cost-item')).map(item => ({
                service: item.querySelector('.service-description').value,
                amount: parseFloat(item.querySelector('.service-amount').value) || 0
            })).filter(item => item.service);
            formData.append('service_costs', JSON.stringify(serviceCosts));
            
            const finalContent = [];
            let imageCounter = 0; 
            document.querySelectorAll('.content-section').forEach(section => {
                const sectionId = section.id;
                const newFiles = newSectionFiles[sectionId] || [];
                const keptImages = section.querySelector('.kept-image-urls').value.split(',').filter(Boolean);
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
                    images: [...keptImages, ...newImagePlaceholders]
                });
            });
            formData.append('content', JSON.stringify(finalContent));
            
            const url = isEditMode ? `${API_BASE_URL}/admin/programs/${programId}` : `${API_BASE_URL}/admin/programs`;
            const method = isEditMode ? 'PUT' : 'POST';
            
            const response = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || '저장 중 오류가 발생했습니다.');
            }
            
            alert(result.message);
            if (result.success) { 
                window.location.href = 'admin_programs.html'; 
            }

        } catch (err) {
            console.error('프로그램 정보 저장 중 오류:', err);
            alert('프로그램 정보 저장 중 오류가 발생했습니다: ' + err.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = isEditMode ? '변경사항 저장' : '저장하기';
        }
    }    
    initializePage();
});