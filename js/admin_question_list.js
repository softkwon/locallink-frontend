// js/admin_question_list.js (최종 완성본)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';


// HTML 문서가 완전히 로드된 후에 모든 스크립트를 실행합니다.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지에 필요한 HTML 요소들을 미리 찾아둡니다. ---
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('questionListTable');
    const tableBodyEl = document.getElementById('questionListTableBody');

    // --- 2. 기능 함수들을 정의합니다. ---

    // 페이지 초기화 함수
    async function initializePage() {
        // 공통 스크립트에 있는 함수를 호출하여 권한을 먼저 확인합니다.
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;

        // 탭 버튼에 클릭 이벤트 연결
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                const type = button.dataset.type;
                loadQuestions(type);
            });
        });

        // 페이지가 처음 열릴 때는 'simple' 타입 질문을 불러옵니다.
        loadQuestions('simple');
    }

    // 특정 타입의 질문 목록을 불러와 테이블을 그리는 함수
    async function loadQuestions(type = 'simple') {
        loadingEl.innerHTML = `<p>${type === 'simple' ? '간이진단' : '심화진단'} 질문 목록을 불러오는 중입니다...</p>`;
        loadingEl.style.display = 'block';
        tableEl.classList.add('hidden');
        if (tableBodyEl) tableBodyEl.innerHTML = '';

        try {
            const response = await fetch(`${API_BASE_URL}/admin/questions`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('질문 목록을 불러오는 데 실패했습니다.');

            const result = await response.json();
            if (result.success) {
                const filteredQuestions = result.questions.filter(q => q.diagnosis_type === type);
                renderQuestionTable(filteredQuestions);

                if (filteredQuestions.length === 0) {
                    loadingEl.innerHTML = `<p>표시할 '${type}' 타입의 질문이 없습니다.</p>`;
                    loadingEl.style.display = 'block';
                    tableEl.classList.add('hidden');
                } else {
                    loadingEl.style.display = 'none';
                    tableEl.classList.remove('hidden');
                }
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            loadingEl.textContent = `오류가 발생했습니다: ${error.message}`;
        }
    }

    // 테이블 HTML을 생성하는 함수
    function renderQuestionTable(questions) {
        if (!tableBodyEl) return;
        tableBodyEl.innerHTML = '';
        
        // DB의 display_order 값으로 먼저 정렬합니다.
        questions.sort((a, b) => a.display_order - b.display_order);
        
        questions.forEach((q, index) => {
            const row = tableBodyEl.insertRow();
            row.dataset.questionId = q.id;
            
            row.insertCell().textContent = index + 1;

            const actionCell = row.insertCell();
            actionCell.className = 'actions-cell';
            actionCell.innerHTML = `
                <button type="button" class="button-secondary button-sm reorder-btn" data-direction="up" title="위로">🔼</button>
                <button type="button" class="button-secondary button-sm reorder-btn" data-direction="down" title="아래로">🔽</button>
                <a href="admin_question_edit.html?id=${q.id}" class="button-secondary button-sm">수정</a>
                <button type="button" class="button-danger button-sm delete-question-btn">삭제</button>
            `;
            
            row.insertCell().textContent = q.question_code;
            row.insertCell().textContent = q.esg_category;
            
            const questionCell = row.insertCell();
            questionCell.className = 'truncate';
            questionCell.textContent = q.question_text;
            questionCell.title = q.question_text;
            
            const explanationCell = row.insertCell();
            explanationCell.className = 'truncate';
            explanationCell.textContent = q.explanation || '-';
            explanationCell.title = q.explanation || '';
        });
    }

    // --- 3. 이벤트 리스너를 설정합니다. (이벤트 위임) ---
    if (tableBodyEl) {
        tableBodyEl.addEventListener('click', async (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            const row = button.closest('tr');
            const questionId = row.dataset.questionId;

            // 삭제 버튼 로직
            if (button.classList.contains('delete-question-btn')) {
                const questionCode = row.cells[2].textContent;
                if (confirm(`정말로 '${questionCode}' 질문을 삭제하시겠습니까?\n관련된 모든 답변, 채점 규칙도 함께 삭제됩니다.`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/questions/${questionId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (result.success) {
                            const currentTab = document.querySelector('.tab-button.active').dataset.type;
                            loadQuestions(currentTab);
                        }
                    } catch (err) { alert('질문 삭제 중 오류 발생'); }
                }
            }

            // 순서 변경 버튼 로직
            if (button.classList.contains('reorder-btn')) {
                const direction = button.dataset.direction;
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/questions/reorder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ questionId, direction })
                    });
                    const result = await response.json();
                    if (result.success) {
                        const currentTab = document.querySelector('.tab-button.active').dataset.type;
                        loadQuestions(currentTab);
                    } else {
                        alert(result.message);
                    }
                } catch (err) {
                    alert('순서 변경 중 오류 발생');
                }
            }
        });
    }

    // --- 4. 페이지 시작 ---
    initializePage();
});