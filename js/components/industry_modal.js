// js/components/industry_modal.js (백엔드 API 연동 최종본)
import { API_BASE_URL, STATIC_BASE_URL } from '../config.js';

async function initializeIndustryModal(options) {
    // 1. 모달 HTML을 동적으로 불러옵니다.
    const existingModal = document.getElementById('industryModal');
    if (existingModal) existingModal.remove();

    try {
        const response = await fetch('components/industry_modal.html');
        if (!response.ok) throw new Error('components/industry_modal.html을 불러오는 데 실패했습니다.');
        
        const modalHtml = await response.text();
        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // 2. 이제 삽입된 HTML과 백엔드 API 데이터를 기반으로 모달의 상세 기능을 설정합니다.
        await setupModalLogicWithAPI(options);

    } catch (error) {
        console.error("모달 초기화 실패:", error);
    }
}

async function setupModalLogicWithAPI(options) {
    const modal = document.getElementById('industryModal');
    const closeButton = modal.querySelector('.close-button');
    const searchInput = modal.querySelector('#industrySearchInput');
    const industryList = modal.querySelector('#industryList');
    const confirmBtn = modal.querySelector('#confirmIndustrySelectionBtn');
    
    let selectedIndustries = new Map((options.initialSelection || []).map(item => [item.code, item]));
    let allIndustriesData = [];

    // 데이터를 표시하기 전에 로딩 상태를 보여줄 수 있습니다.
    industryList.innerHTML = '<li>데이터를 불러오는 중...</li>';

    // 백엔드 API에서 데이터를 가져옵니다.
    try {
        const response = await fetch(`${API_BASE_URL}/industries`);
        const result = await response.json();
        if (!result.success) {
            throw new Error(result.message);
        }
        allIndustriesData = result.industries;
    } catch (error) {
        industryList.innerHTML = `<li>데이터 로딩 실패: ${error.message}</li>`;
        return;
    }
    
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

    const openModal = () => {
        displayIndustryData();
        modal.style.display = 'flex';
    };
    const closeModal = () => {
        modal.remove();
    };

    // 이벤트 리스너 연결
    searchInput.onkeyup = () => displayIndustryData(searchInput.value);
    closeButton.onclick = closeModal;
    confirmBtn.onclick = () => {
        if (typeof options.onConfirm === 'function') {
            options.onConfirm(Array.from(selectedIndustries.values()));
        }
        closeModal();
    };
    modal.onclick = (event) => { if (event.target === event.currentTarget) closeModal(); };
    industryList.onclick = (e) => {
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
            displayIndustryData(searchInput.value);
        }
    };
    
    openModal();
}