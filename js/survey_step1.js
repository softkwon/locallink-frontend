// js/survey_step1.js (2025-06-29 11:40:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { initializeIndustryModal } from './components/industry_modal.js';
    

// 페이지 전역에서 사용할 변수
let selectedIndustryCodes = []; 
let allIndustries = [];

// 모달에서 '선택완료' 시 호출될 콜백 함수를 window 객체에 할당
window.handleIndustryCodeSelectionForSurveyStep1 = function(items) {
    selectedIndustryCodes = items;
    renderSelectedCodes();
};

// 선택된 산업 코드 UI를 화면에 그려주는 함수
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

// '저장 후 다음 단계로' 버튼 클릭 시 실행될 메인 함수
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
        exportPercentage: document.getElementById('exportPercentage').value,
        isListed: document.querySelector('input[name="listingStatus"]:checked')?.value === 'listed',
        companySize: document.querySelector('input[name="companySize"]:checked')?.value,
        mainBusinessRegion: Array.from(document.querySelectorAll('input[name="businessRegions"]:checked')).map(cb => cb.value).join(',')
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

/**
 * 서버에서 가져온 초기 데이터로 폼 필드를 채우는 함수
 * @param {object} data - 진단 또는 사용자 정보 객체
 */
function populateForm(data) {
    if (!data) return;

    document.getElementById('companyNameSurvey').value = data.company_name || '';
    document.getElementById('ceoNameSurvey').value = data.representative_name || data.representative || '';
    document.getElementById('establishmentYear').value = data.establishment_year || '';
    document.getElementById('employeeCount').value = data.employee_count || '';
    document.getElementById('mainProducts').value = data.products_services || '';
    document.getElementById('annualRevenue').value = data.recent_sales ? (data.recent_sales / 100000000) : '';
    document.getElementById('operatingProfit').value = data.recent_operating_profit ? (data.recent_operating_profit / 100000000) : '';
    document.getElementById('exportPercentage').value = data.export_percentage || '';

    if (data.is_listed !== undefined && data.is_listed !== null) {
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
    
    const industryCodesToPrefill = data.industry_codes || [];
    if (industryCodesToPrefill.length > 0 && allIndustries.length > 0) {
        selectedIndustryCodes = industryCodesToPrefill.map(code => {
            const found = allIndustries.find(item => item.code === code);
            return { code: code, name: found ? found.name : '알 수 없음' };
        }).filter(Boolean);
        renderSelectedCodes();
    }
}

// --- 페이지 로드 시 실행되는 메인 로직 ---
document.addEventListener('DOMContentLoaded', async function() {
    
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요한 서비스입니다. 로그인 페이지로 이동합니다.');
        window.location.href = 'main_login.html';
        return;
    }

    // 산업 코드 목록 미리 불러오기
    try {
        const industryResponse = await fetch(`${API_BASE_URL}/industries`, { headers: { 'Authorization': `Bearer ${token}` } });
        const industryResult = await industryResponse.json();
        if (industryResult.success) {
            allIndustries = industryResult.industries;
        } else {
            console.error("산업코드 목록 로딩 실패:", industryResult.message);
        }
    } catch (e) { 
        console.error("산업코드 목록 API 호출 실패:", e);
    }

    // ★★★ 수정된 부분: 이벤트 리스너 연결 부분을 데이터 로딩과 분리하고, 모달 함수 존재 여부를 확실히 체크합니다. ★★★
    
    // 1. 이벤트 리스너 먼저 연결
    document.getElementById('industryCodeInfoIconSurveyStep1')?.addEventListener('click', function() {
        // 'initializeIndustryModal' 함수가 실제로 존재하는지 확인
        if (typeof initializeIndustryModal === 'function') {
            initializeIndustryModal({
                initialSelection: selectedIndustryCodes,
                onConfirm: (confirmedSelection) => {
                    window.handleIndustryCodeSelectionForSurveyStep1(confirmedSelection);
                }
            });
        } else {
            console.error('initializeIndustryModal 함수를 찾을 수 없습니다. common_modal.js 파일이 올바르게 로드되었는지 확인하세요.');
            alert('산업분류표를 여는 데 실패했습니다. 페이지를 새로고침하거나 관리자에게 문의하세요.');
        }
    });
    document.querySelector('.form-actions .button-primary')?.addEventListener('click', saveAndProceed);


    // 2. 데이터 로딩 및 폼 채우기
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