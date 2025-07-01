// js/admin_scoring_rules.js (2025-06-25 18:25:00)
document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('locallink-token');
    const tableBodyEl = document.getElementById('rulesTableBody');
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('rulesTable');

    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;

        // 탭 버튼에 클릭 이벤트 연결
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const type = button.dataset.type;
                loadAndRenderRules(type);
            });
        });

        // 페이지 첫 로드 시 'simple' 규칙을 불러옴
        loadAndRenderRules('simple');
    }

    async function loadAndRenderRules(type = 'simple') {
    loadingEl.style.display = 'block';
    tableEl.classList.add('hidden');
    try {
        const response = await fetch(`${API_BASE_URL}/admin/scoring-rules?type=${type}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();
        
        if (result.success) {
            tableBodyEl.innerHTML = '';
            if (result.rules.length === 0) {
                const row = tableBodyEl.insertRow();
                const cell = row.insertCell();
                cell.colSpan = 6;
                cell.textContent = '표시할 채점 규칙이 없습니다.';
                cell.style.textAlign = 'center';
            } else {
                result.rules.forEach(rule => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.ruleId = rule.id;

                    // ★★★ HTML 헤더 순서와 정확히 일치하도록 수정 ★★★
                    row.insertCell().textContent = rule.question_code;
                    
                    // '질문 내용'을 표시하는 새로운 셀 추가
                    const questionTextCell = row.insertCell();
                    questionTextCell.className = 'truncate';
                    questionTextCell.textContent = rule.question_text || '-';
                    questionTextCell.title = rule.question_text || '';
                    
                    row.insertCell().textContent = rule.answer_condition;
                    row.insertCell().textContent = rule.score;
                    row.insertCell().innerHTML = `<input type="number" class="form-control new-score-input" value="${rule.score}" style="width: 80px;">`;
                    
                    const actionCell = row.insertCell();
                    actionCell.className = 'actions-cell';
                    actionCell.innerHTML = `
                        <button class="button-primary button-sm save-btn">저장</button>
                    `;
                });
            }
        } else { 
            throw new Error(result.message); 
        }
    } catch (error) {
        loadingEl.textContent = `오류: ${error.message}`;
    }
    loadingEl.style.display = 'none';
    tableEl.classList.remove('hidden');
}

    if (tableBodyEl) {
        tableBodyEl.addEventListener('click', async (e) => {
            if (e.target.classList.contains('save-btn')) {
                const row = e.target.closest('tr');
                const ruleId = row.dataset.ruleId;
                const newScore = row.querySelector('input[type="number"]').value;
                
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/scoring-rules/${ruleId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ score: newScore })
                    });
                    const result = await response.json();
                    alert(result.message);
                } catch (err) {
                    alert('점수 수정 중 오류가 발생했습니다.');
                }
            }
        });
    }

    initializePage();
});