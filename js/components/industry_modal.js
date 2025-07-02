// js/components/industry_modal.js (개선된 최종본)
import { API_BASE_URL } from '../config.js';

/**
 * 모달 창의 기본 HTML 구조를 생성하는 함수
 * @returns {string} HTML 템플릿 문자열
 */
function createModalHTML() {
    return `
        <div class="modal-overlay" id="industryModal">
            <div class="modal-content">
                <h3>산업분류코드 검색</h3>
                <input type="text" id="industrySearchInput" class="form-control" placeholder="산업명 또는 코드로 검색 (예: 정보통신, 62)">
                <ul id="industryList" class="industry-list-container" style="overflow-y: auto; height: 300px; margin-top: 15px;">
                    </ul>
                <div class="modal-footer">
                    <p class="modal-footnote"><span class="star-icon">★</span>는 주력 산업을 의미합니다.</p>
                    <button id="confirmIndustrySelectionBtn" class="button-primary">선택 완료</button>
                </div>
                <button class="close-button" aria-label="닫기">&times;</button>
            </div>
        </div>
    `;
}

/**
 * 산업 분류 모달을 초기화하고 화면에 표시하는 메인 함수
 * @param {object} options - 모달 옵션 객체
 * @param {array} options.initialSelection - 초기에 선택된 항목 배열
 * @param {function} options.onConfirm - '선택 완료' 시 실행될 콜백 함수
 */
export async function initializeIndustryModal(options = {}) {
    // 1. 기존 모달이 있다면 제거하고, 새로운 모달 HTML을 body에 추가합니다.
    const existingModal = document.getElementById('industryModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', createModalHTML());

    // 2. 방금 추가한 HTML 요소들을 변수에 할당합니다.
    const modal = document.getElementById('industryModal');
    const closeButton = modal.querySelector('.close-button');
    const searchInput = modal.querySelector('#industrySearchInput');
    const industryList = modal.querySelector('#industryList');
    const confirmBtn = modal.querySelector('#confirmIndustrySelectionBtn');
    
    // 3. 변수 및 상태를 설정합니다.
    let selectedIndustries = new Map((options.initialSelection || []).map(item => [item.code, item]));
    let allIndustriesData = [];

    // 4. 백엔드 API에서 전체 산업 목록 데이터를 가져옵니다.
    industryList.innerHTML = '<li>데이터를 불러오는 중...</li>';
    try {
        const response = await fetch(`${API_BASE_URL}/industries`);
        const result = await response.json();
        if (!result.success) throw new Error(result.message);
        allIndustriesData = result.industries;
    } catch (error) {
        industryList.innerHTML = `<li>데이터 로딩 실패: ${error.message}</li>`;
        return;
    }
    
    // 5. 데이터를 화면에 그리고, 필터링하는 함수를 정의합니다.
    const displayIndustryData = (filter = '') => {
        industryList.innerHTML = '';
        const lowerCaseFilter = filter.toLowerCase();
        const primaryCode = selectedIndustries.size > 0 ? selectedIndustries.keys().next().value : null;

        allIndustriesData.forEach(item => {
            if (`[${item.code}] ${item.name}`.toLowerCase().includes(lowerCaseFilter)) {
                const li = document.createElement('li');
                const isPrimary = item.code === primaryCode;
                const isSelected = selectedIndustries.has(item.code);
                
                li.innerHTML = `${isPrimary ? '<span class="star-icon">★</span> ' : ''}[${item.code}] ${item.name}`;
                li.dataset.code = item.code;
                li.dataset.name = item.name;
                if (isSelected) li.classList.add('selected');
                
                industryList.appendChild(li);
            }
        });
    };

    // 6. 모달을 열고 닫는 함수를 정의합니다.
    const openModal = () => {
        displayIndustryData(); // 데이터를 먼저 그리고
        modal.style.display = 'flex'; // 모달을 화면에 표시
    };
    const closeModal = () => {
        modal.remove(); // 모달을 DOM에서 완전히 제거
    };

    // 7. 모든 이벤트 리스너를 연결합니다.
    searchInput.onkeyup = () => displayIndustryData(searchInput.value);
    closeButton.onclick = closeModal;
    confirmBtn.onclick = () => {
        if (typeof options.onConfirm === 'function') {
            options.onConfirm(Array.from(selectedIndustries.values()));
        }
        closeModal();
    };
    modal.onclick = (event) => { // 모달 바깥 영역 클릭 시 닫기
        if (event.target === event.currentTarget) closeModal(); 
    };
    industryList.onclick = (e) => { // 목록 아이템 클릭 시 선택/해제
        if (e.target && e.target.nodeName === "LI") {
            const code = e.target.dataset.code;
            const name = e.target.dataset.name;
            if (selectedIndustries.has(code)) {
                selectedIndustries.delete(code);
            } else if (selectedIndustries.size < 3) {
                selectedIndustries.set(code, { code, name });
            } else {
                alert('산업은 최대 3개까지 선택할 수 있습니다.');
            }
            displayIndustryData(searchInput.value); // 선택 상태가 바뀌었으므로 다시 그리기
        }
    };
    
    // 8. 모든 설정이 끝났으니, 모달을 엽니다.
    openModal();
}