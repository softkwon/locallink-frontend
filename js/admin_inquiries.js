// js/admin_inquiries.js (2025-06-28 09:50:00)
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 변수 초기화 ---
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('inquiriesTable');
    const tableBodyEl = document.getElementById('inquiriesTableBody');
    const tabContainer = document.querySelector('.tab-nav');
    const exportBtn = document.getElementById('exportCsvBtn');

    // --- 2. 페이지 초기화 함수 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'user_manager']);
        if (!hasPermission) return;
        
        attachEventListeners();
        loadInquiries('all'); // 처음에는 '전체' 데이터 로드
    }

    // --- 3. 기능 함수 정의 ---

    // 특정 타입의 문의 목록을 불러와 테이블을 그리는 함수
    async function loadInquiries(type = 'all') {
        if(!loadingEl || !tableEl || !tableBodyEl) return;
        loadingEl.textContent = '문의 목록을 불러오는 중입니다...';
        loadingEl.style.display = 'block';
        tableEl.classList.add('hidden');
        
        try {
            let url = `${API_BASE_URL}/admin/inquiries?type=${encodeURIComponent(type)}`;
            
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('서버 응답 오류');
            
            const result = await response.json();
            
            if (result.success) {
                tableBodyEl.innerHTML = '';
                if(result.inquiries.length === 0) {
                    const row = tableBodyEl.insertRow();
                    const cell = row.insertCell();
                    cell.colSpan = 7; // 테이블 헤더 컬럼 수와 일치
                    cell.textContent = '표시할 문의 내역이 없습니다.';
                    cell.style.textAlign = 'center';
                } else {
                    result.inquiries.forEach(item => {
                        const row = tableBodyEl.insertRow();
                        row.dataset.id = item.id;
                        const createdDate = new Date(item.created_at).toLocaleString();

                        row.insertCell().innerHTML = `${item.id}<br><small>${createdDate}</small>`;
                        row.insertCell().innerHTML = `${item.company_name || '-'}<br><strong>${item.manager_name || ''}</strong>`;
                        row.insertCell().innerHTML = `${item.phone || '-'}<br><small>${item.email || '-'}</small>`;
                        row.insertCell().textContent = item.inquiry_type;
                        row.insertCell().textContent = item.content;
                        
                        const statusCell = row.insertCell();
                        const statusSelect = document.createElement('select');
                        statusSelect.className = 'form-control-sm';
                        statusSelect.innerHTML = `
                            <option value="new" ${item.status === 'new' ? 'selected' : ''}>신규</option>
                            <option value="in_progress" ${item.status === 'in_progress' ? 'selected' : ''}>처리중</option>
                            <option value="resolved" ${item.status === 'resolved' ? 'selected' : ''}>완료</option>
                        `;
                        statusCell.appendChild(statusSelect);
                        
                        row.insertCell().innerHTML = `<button type="button" class="button-danger button-sm delete-btn">삭제</button>`;
                    });
                }
                loadingEl.style.display = 'none';
                tableEl.classList.remove('hidden');
            } else { 
                throw new Error(result.message); 
            }
        } catch (error) {
            loadingEl.textContent = `오류: ${error.message}`;
        }
    }

    // 모든 이벤트 리스너를 한 곳에서 연결하는 함수
    function attachEventListeners() {
        if (tabContainer) {
            tabContainer.addEventListener('click', e => {
                if (e.target.matches('button.tab-button')) {
                    tabContainer.querySelector('.active').classList.remove('active');
                    e.target.classList.add('active');
                    loadInquiries(e.target.dataset.type);
                }
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                exportBtn.textContent = '생성 중...';
                exportBtn.disabled = true;
                try {
                    const response = await fetch('${API_BASE_URL}/admin/inquiries/export', {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('데이터를 내보내는 중 오류가 발생했습니다.');
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `inquiries-${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                } catch (error) {
                    alert(error.message);
                } finally {
                    exportBtn.textContent = 'CSV로 내보내기';
                    exportBtn.disabled = false;
                }
            });
        }
        
        if (tableBodyEl) {
            tableBodyEl.addEventListener('change', async (e) => {
                if (e.target.tagName === 'SELECT') {
                    const row = e.target.closest('tr');
                    const id = row.dataset.id;
                    const newStatus = e.target.value;
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/inquiries/${id}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                            body: JSON.stringify({ status: newStatus })
                        });
                        const result = await response.json();
                        if (!result.success) alert('상태 변경 실패');
                        // 성공 시에는 별도 알림 없이 상태만 변경됨
                    } catch(err) { alert('상태 변경 중 오류 발생'); }
                }
            });

            tableBodyEl.addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-btn')) {
                    const row = e.target.closest('tr');
                    const id = row.dataset.id;
                    if (confirm(`문의 ID ${id} 항목을 정말로 삭제하시겠습니까?`)) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/admin/inquiries/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                            const result = await response.json();
                            alert(result.message);
                            if(result.success) loadInquiries(document.querySelector('.tab-button.active').dataset.type);
                        } catch(err) { alert('문의 삭제 중 오류 발생'); }
                    }
                }
            });
        }
    }

    // --- 4. 페이지 시작 ---
    initializePage();
});