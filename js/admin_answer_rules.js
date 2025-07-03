// js/admin_answer_rules.js (2025-06-25 14:10:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('locallink-token');
    
    // --- 페이지 요소 찾기 ---
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('rulesTable');
    const tableBodyEl = document.getElementById('rulesTableBody');
    const createForm = document.getElementById('createRuleForm');

    // --- 기능 함수 정의 ---

    // 페이지 초기화
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        
        await Promise.all([
            populateMetricsDropdown(),
            populateQuestionsDropdown()
        ]);
        loadRules();
        attachEventListeners();
    }

    // '지표' 드롭다운 채우기
    async function populateMetricsDropdown() {
        const select = document.getElementById('new_metric_name');
        try {
            const res = await fetch(`${API_BASE_URL}/admin/average-metrics`, { headers: { 'Authorization': `Bearer ${token}` }});
            const result = await res.json();
            if(result.success) {
                select.innerHTML = '<option value="">-- 평균 지표 선택 --</option>';
                result.metrics.forEach(m => select.innerHTML += `<option value="${m}">${m}</option>`);
            }
        } catch(e) { console.error('지표 목록 로딩 실패'); }
    }

    // '질문' 드롭다운 채우기
    async function populateQuestionsDropdown() {
        const select = document.getElementById('new_question_code');
        try {
            const res = await fetch(`${API_BASE_URL}/survey/simple`, { headers: { 'Authorization': `Bearer ${token}` }});
            const result = await res.json();
            if(result.success) {
                select.innerHTML = '<option value="">-- 연관 질문 선택 --</option>';
                result.questions.forEach(q => select.innerHTML += `<option value="${q.question_code}">${q.question_code}</option>`);
            }
        } catch(e) { console.error('질문 목록 로딩 실패'); }
    }

    // 모든 규칙을 불러와 테이블 그리기
    async function loadRules() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/answer-rules`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success) {
                tableBodyEl.innerHTML = '';
                result.rules.forEach(rule => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.id = rule.id;
                    row.insertCell().textContent = rule.id;
                    row.insertCell().textContent = rule.metric_name;
                    row.insertCell().textContent = rule.question_code;
                    row.insertCell().innerHTML = `
                        <input type="number" value="${rule.lower_bound}" data-key="lower_bound" style="width:80px;"> ~ 
                        <input type="number" value="${rule.upper_bound}" data-key="upper_bound" style="width:80px;">`;
                    row.insertCell().innerHTML = `<input type="text" value="${rule.resulting_answer_value}" data-key="resulting_answer_value">`;
                    row.insertCell().innerHTML = `<button class="button-primary button-sm save-btn">저장</button> <button class="button-danger button-sm delete-btn">삭제</button>`;
                });
            } else { throw new Error(result.message); }
        } catch (error) { loadingEl.textContent = `오류: ${error.message}`; }
        loadingEl.style.display = 'none';
        tableEl.classList.remove('hidden');
    }
    
    // 이벤트 리스너 연결
    function attachEventListeners() {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newData = {
                metric_name: document.getElementById('new_metric_name').value,
                question_code: document.getElementById('new_question_code').value,
                lower_bound: document.getElementById('new_lower_bound').value,
                upper_bound: document.getElementById('new_upper_bound').value,
                resulting_answer_value: document.getElementById('new_resulting_answer_value').value,
            };
            try {
                const response = await fetch(`${API_BASE_URL}/admin/answer-rules`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newData) });
                const result = await response.json();
                alert(result.message);
                if (result.success) { e.target.reset(); loadRules(); }
            } catch (err) { alert('새 규칙 추가 중 오류 발생'); }
        });
    
        tableBodyEl.addEventListener('click', async (e) => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;

            if (target.classList.contains('save-btn')) {
                const updatedData = {
                    lower_bound: row.querySelector('[data-key="lower_bound"]').value,
                    upper_bound: row.querySelector('[data-key="upper_bound"]').value,
                    resulting_answer_value: row.querySelector('[data-key="resulting_answer_value"]').value
                };
                const response = await fetch(`${API_BASE_URL}/admin/answer-rules/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(updatedData) });
                alert((await response.json()).message);
            }

            if (target.classList.contains('delete-btn')) {
                if (confirm(`규칙 ID ${id}를 정말로 삭제하시겠습니까?`)) {
                    const response = await fetch(`${API_BASE_URL}/admin/answer-rules/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                    alert((await response.json()).message);
                    loadRules();
                }
            }
        });
    }
    
    initializePage();
});