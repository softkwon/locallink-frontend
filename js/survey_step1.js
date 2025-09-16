import { API_BASE_URL } from './config.js';
import { initializeIndustryModal } from './components/industry_modal.js';

// --- 전역 범위에 변수 선언 ---
let selectedIndustryCodes = []; 
let allIndustries = [];
let selectedMajorCompany = null;
let allMajorCompanies = [];

// --- 함수 정의 ---

function renderSelectedCodes() {
    const container = document.getElementById('selectedIndustryCodesContainerSurveyStep1');
    const displayInput = document.getElementById('industryCodeDisplaySurvey');
    if (!container || !displayInput) return;

    container.innerHTML = ''; 
    if (selectedIndustryCodes.length === 0) {
        displayInput.placeholder = '우측 ⓘ 아이콘으로 검색/선택 (최대 3개)';
        displayInput.value = '';
    } else {
        displayInput.value = `${selectedIndustryCodes.length}개 선택됨`;
        selectedIndustryCodes.forEach((codeObj, index) => {
            const tag = document.createElement('span');
            tag.className = 'selected-code-tag';
            tag.textContent = `[${codeObj.code}] ${codeObj.name} `;
            const removeBtn = document.createElement('span');
            removeBtn.className = 'remove-code';
            removeBtn.innerHTML = '&times;';
            removeBtn.onclick = (e) => { 
                e.stopPropagation(); 
                selectedIndustryCodes.splice(index, 1); 
                renderSelectedCodes(); 
            };
            tag.appendChild(removeBtn);
            container.appendChild(tag);
        });
    }
}

function initializeMajorCompanyModal() {
    document.querySelector('.modal-overlay')?.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.style.display = 'flex';
    
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>벤치마킹 대기업 선택</h3>
                <button class="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <input type="text" id="majorCompanySearchInput" class="form-control" placeholder="기업명으로 검색하세요..." style="margin-bottom: 15px;">
                <ul class="industry-list-container" id="majorCompanyListContainer" style="max-height: 300px; overflow-y: auto;"></ul>
            </div>
            <div class="modal-footer">
                <p class="modal-footnote">목록에서 벤치마킹할 기업을 1개 선택해주세요.</p>
                <button id="confirmMajorCompanySelection" class="button-primary">확인</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const searchInput = document.getElementById('majorCompanySearchInput');
    const listContainer = document.getElementById('majorCompanyListContainer');
    
    const renderList = (filter = '') => {
        listContainer.innerHTML = '';
        const filtered = allMajorCompanies.filter(c => c.company_name.toLowerCase().includes(filter.toLowerCase()));
        
        filtered.forEach(company => {
            const li = document.createElement('li');
            li.textContent = company.company_name;
            li.dataset.companyId = company.id;
            li.dataset.companyName = company.company_name;
            if (selectedMajorCompany && selectedMajorCompany.id === company.id) {
                li.classList.add('selected');
            }
            li.addEventListener('click', () => {
                listContainer.querySelectorAll('li').forEach(item => item.classList.remove('selected'));
                li.classList.add('selected');
            });
            listContainer.appendChild(li);
        });
    };

    searchInput.addEventListener('input', () => renderList(searchInput.value));
    
    const closeModal = () => modalOverlay.remove();
    modalOverlay.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

    document.getElementById('confirmMajorCompanySelection').addEventListener('click', () => {
        const selectedLi = listContainer.querySelector('li.selected');
        if (selectedLi) {
            selectedMajorCompany = {
                id: parseInt(selectedLi.dataset.companyId),
                company_name: selectedLi.dataset.companyName
            };
        } else {
            selectedMajorCompany = null;
        }
        renderSelectedMajorCompany();
        closeModal();
    });

    renderList();
}

function renderSelectedMajorCompany() {
    const container = document.getElementById('selectedMajorCompanyContainer');
    const displayInput = document.getElementById('majorCompanyDisplay');
    if (!container || !displayInput) return;

    container.innerHTML = '';
    if (selectedMajorCompany) {
        displayInput.value = `1개 선택됨`;
        const tag = document.createElement('span');
        tag.className = 'selected-code-tag';
        tag.textContent = `${selectedMajorCompany.company_name} `;
        const removeBtn = document.createElement('span');
        removeBtn.className = 'remove-code';
        removeBtn.innerHTML = '&times;';
        removeBtn.onclick = (e) => {
            e.stopPropagation();
            selectedMajorCompany = null;
            renderSelectedMajorCompany();
        };
        tag.appendChild(removeBtn);
        container.appendChild(tag);
    } else {
        displayInput.placeholder = '우측 ⓘ 아이콘으로 검색/선택';
        displayInput.value = '';
    }
}

async function saveAndProceed() {
    const form = document.getElementById('surveyStep1Form');
    if (!form.checkValidity() || selectedIndustryCodes.length === 0) {
        alert("별표(*) 표시된 필수 항목을 모두 입력하거나 선택해주세요.\n(산업분류코드는 최소 1개 이상 선택해야 합니다.)");
        form.reportValidity();
        return;
    }
    
    const formData = {
        companyName: document.getElementById('companyNameSurvey').value,
        representativeName: document.getElementById('ceoNameSurvey').value,
        industryCodes: selectedIndustryCodes.map(item => item.code),
        establishmentYear: parseInt(document.getElementById('establishmentYear').value),
        employeeCount: parseInt(document.getElementById('employeeCount').value),
        productsServices: document.getElementById('mainProducts').value,
        recentSales: parseFloat(document.getElementById('annualRevenue').value) * 100000000,
        recentOperatingProfit: parseFloat(document.getElementById('operatingProfit').value) * 100000000,
        exportPercentage: document.querySelector('input[name="exportPercentage"]:checked')?.value,
        isListed: document.querySelector('input[name="listingStatus"]:checked')?.value === 'listed',
        companySize: document.querySelector('input[name="companySize"]:checked')?.value,
        mainBusinessRegion: Array.from(document.querySelectorAll('input[name="businessRegions"]:checked')).map(cb => cb.value).join(','),
        selected_major_company_id: selectedMajorCompany ? selectedMajorCompany.id : null
    };

    const token = localStorage.getItem('locallink-token');
    const diagnosisId = sessionStorage.getItem('currentDiagnosisId');
    const method = diagnosisId ? 'PUT' : 'POST';
    const apiUrl = diagnosisId ? `${API_BASE_URL}/diagnoses/${diagnosisId}` : `${API_BASE_URL}/diagnoses`;

    try {
        const response = await fetch(apiUrl, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(formData)
        });
        const result = await response.json();

        if (result.success) {
            alert("1단계 정보가 저장되었습니다. 다음 설문 단계로 이동합니다.");
            sessionStorage.setItem('currentDiagnosisId', result.diagnosisId);
            window.location.href = `survey_step2.html`;
        } else {
            alert('오류: ' + result.message);
        }
    } catch (error) {
        console.error('Step 1 데이터 저장/수정 실패:', error);
        alert('데이터 처리 중 오류가 발생했습니다.');
    }
}

function populateForm(data) {
    if (!data) return;

    document.getElementById('companyNameSurvey').value = data.company_name || '';
    document.getElementById('ceoNameSurvey').value = data.representative_name || data.representative || '';
    document.getElementById('establishmentYear').value = data.establishment_year || '';
    document.getElementById('employeeCount').value = data.employee_count || '';
    document.getElementById('mainProducts').value = data.products_services || '';
    document.getElementById('annualRevenue').value = data.recent_sales ? (data.recent_sales / 100000000) : '';
    document.getElementById('operatingProfit').value = data.recent_operating_profit ? (data.recent_operating_profit / 100000000) : '';
    
    if (data.export_percentage) {
        const el = document.querySelector(`input[name="exportPercentage"][value="${data.export_percentage}"]`);
        if (el) el.checked = true;
    }
    if (data.is_listed !== undefined) {
        const el = document.querySelector(`input[name="listingStatus"][value="${data.is_listed ? 'listed' : 'unlisted'}"]`);
        if(el) el.checked = true;
    }
    if (data.company_size) {
        const el = document.querySelector(`input[name="companySize"][value="${data.company_size}"]`);
        if(el) el.checked = true;
    }
    if (data.main_business_region) {
        const regions = data.main_business_region.split(',');
        regions.forEach(region => {
            const el = document.querySelector(`input[name="businessRegions"][value="${region}"]`);
            if(el) el.checked = true;
        });
    }
    
    if (data.industry_codes?.length > 0 && allIndustries.length > 0) {
        selectedIndustryCodes = data.industry_codes.map(code => {
            const found = allIndustries.find(item => item.code === code);
            return { code: code, name: found ? found.name : '알 수 없음' };
        }).filter(Boolean);
        renderSelectedCodes();
    }

    if (data.selected_major_company_id && allMajorCompanies.length > 0) {
        const found = allMajorCompanies.find(c => c.id === data.selected_major_company_id);
        if (found) {
            selectedMajorCompany = { id: found.id, company_name: found.company_name };
            renderSelectedMajorCompany();
        }
    }
}

// --- 페이지 로드 시 실행될 메인 로직 ---
document.addEventListener('DOMContentLoaded', async function() {
    
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
        window.location.href = 'main_login.html';
        return;
    }

    try {
        const [industryResponse, majorCompanyResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/industries`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/admin/major-companies-public`)
        ]);

        const industryResult = await industryResponse.json();
        if (industryResult.success) {
            allIndustries = industryResult.industries;
        } else {
            console.error("산업코드 목록 로딩 실패:", industryResult.message);
        }

        const majorCompanyResult = await majorCompanyResponse.json();
        if (majorCompanyResult.success) {
            allMajorCompanies = majorCompanyResult.companies;
        } else {
            console.error("대기업 목록 로딩 실패:", majorCompanyResult.message);
        }
    } catch (e) { 
        console.error("초기 데이터 로딩 실패:", e);
    }
    
    document.getElementById('industryCodeInfoIconSurveyStep1')?.addEventListener('click', function() {
        initializeIndustryModal({
            initialSelection: selectedIndustryCodes,
            onConfirm: (confirmedSelection) => {
                selectedIndustryCodes = confirmedSelection;
                renderSelectedCodes();
            }
        });
    });
    
    document.getElementById('majorCompanyInfoIcon')?.addEventListener('click', function() {
        initializeMajorCompanyModal();
    });

    document.querySelector('.form-actions .button-primary')?.addEventListener('click', saveAndProceed);

    const diagnosisId = sessionStorage.getItem('currentDiagnosisId');
    const dataEndpoint = diagnosisId ? `${API_BASE_URL}/diagnoses/${diagnosisId}` : `${API_BASE_URL}/users/me`;

    try {
        const response = await fetch(dataEndpoint, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('세션이 만료되었거나 유효하지 않습니다.');
        
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        
        const initialData = diagnosisId ? result.diagnosis : result.user;
        populateForm(initialData);
    } catch(error) {
        localStorage.removeItem('locallink-token');
        sessionStorage.removeItem('currentDiagnosisId');
        alert(error.message || '정보를 불러오는 데 실패했습니다. 다시 로그인해주세요.');
        window.location.href = 'main_login.html';
    }
});