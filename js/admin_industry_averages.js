// js/admin_industry_averages.js
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async function() {
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const tableContainerEl = document.getElementById('tableContainer');
    const tableBodyEl = document.getElementById('averagesTableBody');

    // 페이지 초기화 함수
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        loadAverages();
    }

    // 데이터 로드 및 테이블 렌더링 함수
    async function loadAverages() {
    try {
        const response = await fetch(`${API_BASE_URL}/admin/industry-averages`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success) {
            tableBodyEl.innerHTML = '';
            result.averages.forEach(avg => {
                const row = tableBodyEl.insertRow();
                row.dataset.id = avg.id;

                row.insertCell().textContent = avg.industry_code;
                row.insertCell().textContent = avg.industry_name;
                row.insertCell().innerHTML = `<button class="button-primary button-sm save-btn">저장</button>`;
                
                // ★★★ 모든 컬럼에 대한 input 필드를 생성합니다. ★★★
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.ghg_emissions_avg || ''}" data-key="ghg_emissions_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.energy_usage_avg || ''}" data-key="energy_usage_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.waste_generation_avg || ''}" data-key="waste_generation_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.non_regular_ratio_avg || ''}" data-key="non_regular_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.01" value="${avg.disability_employment_ratio_avg || ''}" data-key="disability_employment_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.female_employee_ratio_avg || ''}" data-key="female_employee_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.years_of_service_avg || ''}" data-key="years_of_service_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.outside_director_ratio_avg || ''}" data-key="outside_director_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.board_meetings_avg || ''}" data-key="board_meetings_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.01" value="${avg.executive_compensation_ratio_avg || ''}" data-key="executive_compensation_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.donation_ratio_avg || ''}" data-key="donation_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.quality_mgmt_ratio_avg || ''}" data-key="quality_mgmt_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.cumulative_voting_ratio_avg || ''}" data-key="cumulative_voting_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.dividend_policy_ratio_avg || ''}" data-key="dividend_policy_ratio_avg">`;
                row.insertCell().innerHTML = `<input type="number" step="0.1" value="${avg.legal_violation_ratio_avg || ''}" data-key="legal_violation_ratio_avg">`;
                row.insertCell().innerHTML = `<button class="button-primary button-sm save-btn">저장</button>`;
            });
            loadingEl.style.display = 'none';
            tableContainerEl.classList.remove('hidden');
        } else {
            throw new Error(result.message);
        }
    } catch (error) {
        loadingEl.textContent = `오류가 발생했습니다: ${error.message}`;
    }
}

    // 저장 버튼 클릭 이벤트 처리
    tableBodyEl.addEventListener('click', async (e) => {
        if (e.target.classList.contains('save-btn')) {
            const row = e.target.closest('tr');
            const id = row.dataset.id;
            const inputs = row.querySelectorAll('input[type="number"]');
            
            const updatedData = {};
            inputs.forEach(input => {
                updatedData[input.dataset.key] = parseFloat(input.value);
            });

            if (confirm(`ID ${id} 산업의 평균 데이터를 수정하시겠습니까?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/industry-averages/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                        body: JSON.stringify(updatedData)
                    });
                    const result = await response.json();
                    alert(result.message);
                } catch(err) {
                    alert('업데이트 중 오류 발생');
                }
            }
        }
    });

    initializePage();
});