// js/admin_applications.js (2025-06-29 07:20:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const token = localStorage.getItem('locallink-token');
    const tableBody = document.getElementById('applicationsTableBody');
    const loadingEl = document.getElementById('loadingMessage');
    const exportBtn = document.getElementById('exportBtn');
    const statusOptions = ['신청', '접수', '진행', '완료'];

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'user_manager']);
        if (!hasPermission) {
            if(loadingEl) loadingEl.textContent = '접근 권한이 없습니다.';
            return;
        }
        loadApplications();
        attachEventListeners();
    }

    // --- 3. 데이터 로딩 및 테이블 렌더링 ---
    async function loadApplications() {
        if(loadingEl) loadingEl.style.display = 'block';
        if(tableBody) tableBody.innerHTML = '';

        try {
            const response = await fetch(`${API_BASE_URL}/admin/applications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();

            if (result.success) {
                renderTable(result.applications);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            if(loadingEl) loadingEl.innerHTML = `<p style="color:red;">오류: ${error.message}</p>`;
        } finally {
            if(loadingEl) loadingEl.style.display = 'none';
        }
    }

    function renderTable(applications) {
        if (!tableBody) return;
        tableBody.innerHTML = '';

        if (applications.length === 0) {
            const row = tableBody.insertRow();
            const cell = row.insertCell();
            cell.colSpan = 9; // 컬럼 개수에 맞게 수정
            cell.textContent = '신청 내역이 없습니다.';
            cell.style.textAlign = 'center';
            return;
        }

        applications.forEach(app => {
            const row = tableBody.insertRow();
            row.dataset.id = app.id;

            row.insertCell().textContent = app.company_name || '-';
            row.insertCell().textContent = app.manager_name || '-';
            row.insertCell().textContent = app.manager_phone || '-';
            row.insertCell().textContent = app.email || '-';
            row.insertCell().textContent = app.program_title || '-';
            row.insertCell().textContent = app.organization_name || '-';
            row.insertCell().textContent = new Date(app.created_at).toLocaleString('ko-KR');
            
            const statusCell = row.insertCell();
            const statusSelect = document.createElement('select');
            statusSelect.className = 'form-control-sm status-select';
            statusOptions.forEach(opt => {
                const option = document.createElement('option');
                option.value = opt;
                option.textContent = opt;
                if (opt === app.status) option.selected = true;
                statusSelect.appendChild(option);
            });
            statusCell.appendChild(statusSelect);

            const actionCell = row.insertCell();
            actionCell.className = 'status-cell';
            actionCell.innerHTML = `<button type="button" class="button-primary button-sm status-save-btn">저장</button>`;
        });
    }

    // --- 4. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        // 'CSV로 내보내기' 버튼 이벤트
        if(exportBtn) {
            exportBtn.addEventListener('click', async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/applications/export`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('파일 다운로드에 실패했습니다.');

                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `applications-${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                } catch(error) {
                    alert(error.message);
                }
            });
        }

        // 테이블 내부 버튼 이벤트 (상태 저장)
        if(tableBody) {
            // 'select' 값이 변경되면 '저장' 버튼을 표시하는 로직
            tableBody.addEventListener('change', e => {
                if (e.target.classList.contains('status-select')) {
                    const row = e.target.closest('tr');
                    const saveBtn = row.querySelector('.status-save-btn');
                    if(saveBtn) saveBtn.classList.add('visible');
                }
            });

            // '저장' 버튼을 클릭했을 때의 로직
            tableBody.addEventListener('click', async e => {
                if (e.target.classList.contains('status-save-btn')) {
                    const row = e.target.closest('tr');
                    const applicationId = row.dataset.id;
                    const newStatus = row.querySelector('.status-select').value;
                    
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}/status`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ status: newStatus })
                        });
                        const result = await response.json();
                        alert(result.message);
                        if(result.success) {
                            // ★★★ 수정된 부분: 성공 시 테이블을 다시 로드합니다. ★★★
                            loadApplications();
                        }
                    } catch (err) { 
                        alert('상태 변경 중 오류 발생'); 
                        console.error(err);
                    }
                }
            });
        }
    }

    // --- 5. 페이지 실행 ---
    initializePage();
});