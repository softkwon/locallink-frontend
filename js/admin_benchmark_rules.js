// js/admin_benchmark_rules.js
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 변수 초기화 ---
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('rulesTable');
    const tableBodyEl = document.getElementById('rulesTableBody');
    const createForm = document.getElementById('createRuleForm');
    const newMetricSelect = document.getElementById('new_metric_name');

    // --- 2. 기능 함수 정의 ---

    // 페이지 초기화 함수
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        
        // 규칙 목록과 드롭다운 메뉴를 동시에 불러옵니다.
        Promise.all([
            loadRules(),
            loadMetricsForDropdown()
        ]);
    }

    // '새 규칙 추가' 폼의 '지표 이름' 드롭다운을 채우는 함수
    async function loadMetricsForDropdown() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/average-metrics`, { headers: { 'Authorization': `Bearer ${token}` }});
            const result = await res.json();
            if(result.success && newMetricSelect) {
                newMetricSelect.innerHTML = '<option value="">-- 지표 선택 --</option>';
                result.metrics.forEach(metric => {
                    newMetricSelect.innerHTML += `<option value="${metric}">${metric}</option>`;
                });
            }
        } catch(e) { console.error('지표 목록 로딩 실패:', e); }
    }

    // 모든 벤치마크 규칙을 불러와 테이블을 그리는 함수
    async function loadRules() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/benchmark-rules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (result.success) {
                renderRulesTable(result.rules);
            } else { throw new Error(result.message); }
        } catch (error) {
            loadingEl.textContent = `오류: ${error.message}`;
        }
    }

    // 테이블 HTML을 생성하는 함수
    function renderRulesTable(rules) {
        if(!tableBodyEl) return;
        tableBodyEl.innerHTML = '';
        rules.forEach(rule => {
            const row = tableBodyEl.insertRow();
            row.dataset.id = rule.id; // 각 행에 고유 id 저장
            row.insertCell().textContent = rule.metric_name;
            row.insertCell().innerHTML = `<input type="text" class="form-control" value="${rule.description || ''}">`;
            row.insertCell().innerHTML = `<input type="number" step="0.1" class="form-control" value="${rule.upper_bound}">`;
            row.insertCell().innerHTML = `<input type="number" class="form-control" value="${rule.score}">`;
            row.insertCell().innerHTML = `
                <button class="button-primary button-sm save-btn">저장</button>
                <button class="button-danger button-sm delete-btn">삭제</button>
            `;
        });
        loadingEl.style.display = 'none';
        tableEl.classList.remove('hidden');
    }

    // --- 3. 이벤트 리스너 연결 ---

    // 테이블 안의 저장/삭제 버튼 클릭 처리 (이벤트 위임)
    if(tableBodyEl) {
        tableBodyEl.addEventListener('click', async (e) => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            const ruleId = row.dataset.id;

            // '저장' 버튼 클릭 시
            if (target.classList.contains('save-btn')) {
                const inputs = row.querySelectorAll('input');
                const updatedData = {
                    description: inputs[0].value,
                    upper_bound: parseFloat(inputs[1].value),
                    score: parseInt(inputs[2].value, 10)
                };

                if (confirm(`규칙 ID ${ruleId}의 내용을 수정하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/benchmark-rules/${ruleId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                            body: JSON.stringify(updatedData)
                        });
                        const result = await response.json();
                        alert(result.message);
                    } catch(err) {
                        alert('규칙 업데이트 중 오류 발생');
                    }
                }
            }

            // '삭제' 버튼 클릭 시
            if (target.classList.contains('delete-btn')) {
                if (confirm(`규칙 ID ${ruleId}를 정말로 삭제하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/benchmark-rules/${ruleId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (result.success) loadRules(); // 성공 시 목록 새로고침
                    } catch (err) { alert('규칙 삭제 중 오류 발생'); }
                }
            }
        });
    }

    // '새 규칙 추가' 폼 제출 시
    if(createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newData = {
                metric_name: newMetricSelect.value,
                description: document.getElementById('new_description').value,
                upper_bound: document.getElementById('new_upper_bound').value,
                score: document.getElementById('new_score').value,
                is_inverted: document.getElementById('new_is_inverted').value === 'true',
                comparison_type: document.getElementById('new_comparison_type').value
            };

            if(!newData.metric_name) {
                alert('지표 이름을 선택해주세요.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/benchmark-rules`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(newData)
                });
                const result = await response.json();
                alert(result.message);
                if (result.success) {
                    createForm.reset();
                    loadRules();
                }
            } catch (err) { alert('새 규칙 추가 중 오류 발생'); }
        });
    }

    // --- 4. 페이지 시작 ---
    initializePage();
});