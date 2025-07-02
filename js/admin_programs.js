import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 페이지 초기화 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        
        // 이벤트 리스너를 한 번만 연결하고, 목록을 불러옵니다.
        attachEventListeners();
        loadPrograms();
    }

    // --- 서버에서 프로그램 목록을 불러와 테이블을 그리는 함수 ---
    async function loadPrograms() {
        const token = localStorage.getItem('locallink-token');
        const loadingEl = document.getElementById('loadingMessage');
        const tableEl = document.getElementById('programsTable');
        const tableBodyEl = document.getElementById('programsTableBody');

        try {
            const response = await fetch('${API_BASE_URL}/admin/programs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const errorResult = await response.json().catch(() => null);
                const errorMessage = errorResult ? errorResult.message : `서버 응답 오류 (상태: ${response.status})`;
                throw new Error(errorMessage);
            }
            
            const result = await response.json();
            
            if (result.success) {
                tableBodyEl.innerHTML = ''; // 테이블 비우기
                result.programs.forEach(program => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.id = program.id;
                    
                    row.insertCell().textContent = program.id;
                    row.insertCell().textContent = program.title;
                    row.insertCell().textContent = program.program_code;
                    row.insertCell().textContent = program.esg_category;
                    
                    const organizationsCell = row.insertCell();
                    if (program.related_links && program.related_links.length > 0) {
                        organizationsCell.innerHTML = program.related_links.map(org => org.organization_name || '이름 없음').join('<br>');
                    } else {
                        organizationsCell.textContent = '-';
                    }
                    
                    const statusCell = row.insertCell();
                    statusCell.className = 'program-status';
                    statusCell.textContent = program.status || 'draft'; 

                    const actionsCell = row.insertCell();
                    actionsCell.className = 'program-actions';
                    
                    // 상태에 따라 다른 버튼을 표시
                    let statusButtonHtml = '';
                    if (!program.status || program.status === 'draft') {
                        statusButtonHtml = `<button type="button" class="button-primary button-sm publish-btn">발행</button>`;
                    } else {
                        statusButtonHtml = `<button type="button" class="button-warning button-sm unpublish-btn">발행 취소</button>`;
                    }

                    // ★★★ 수정된 부분: '발행/취소' 버튼을 innerHTML에 포함 ★★★
                    actionsCell.innerHTML = `
                        <a href="admin_program_edit.html?id=${program.id}" class="button-secondary button-sm">수정</a>
                        <button type="button" class="button-danger button-sm delete-btn">삭제</button>
                        ${statusButtonHtml}
                    `;
                });
                loadingEl.style.display = 'none';
                tableEl.classList.remove('hidden');
            } else { 
                throw new Error(result.message); 
            }
        } catch (error) {
            loadingEl.textContent = `오류: ${error.message}`;
        }
    }

    // --- 이벤트 리스너들을 한 곳에서 관리 ---
    function attachEventListeners() {
        const tableBodyEl = document.getElementById('programsTableBody');

        tableBodyEl.addEventListener('click', async (e) => {
            const row = e.target.closest('tr');
            if (!row) return;

            const programId = row.dataset.id;
            const token = localStorage.getItem('locallink-token');

            // '삭제' 버튼 클릭 시
            if (e.target.classList.contains('delete-btn')) {
                if (!confirm(`프로그램 ID ${programId}을(를) 정말로 삭제하시겠습니까?`)) return;
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/programs/${programId}`, {
                        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await response.json();
                    alert(result.message);
                    if (result.success) loadPrograms();
                } catch (err) { alert('프로그램 삭제 중 오류 발생'); }
            }

            // '발행' 또는 '발행 취소' 버튼 클릭 시
            else if (e.target.classList.contains('publish-btn') || e.target.classList.contains('unpublish-btn')) {
                const isPublishing = e.target.classList.contains('publish-btn');
                const newStatus = isPublishing ? 'published' : 'draft';
                const confirmMessage = isPublishing 
                    ? `ID ${programId}번 프로그램을 발행하시겠습니까?`
                    : `ID ${programId}번 프로그램의 발행을 취소하고 초안 상태로 되돌리시겠습니까?`;

                if (!confirm(confirmMessage)) return;

                try {
                    const response = await fetch(`${API_BASE_URL}/admin/programs/${programId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ status: newStatus })
                    });
                    const result = await response.json();
                    alert(result.message);
                    if (result.success) loadPrograms(); // 성공 시 목록을 새로고침하여 버튼과 상태를 모두 업데이트
                } catch (error) {
                    console.error('상태 변경 중 오류:', error);
                    alert('오류가 발생했습니다.');
                }
            }
        });
    }

    // --- 페이지 실행 ---
    initializePage();
});