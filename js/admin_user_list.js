// js/admin_user_list.js (2025-07-02 00:25:00)

document.addEventListener('DOMContentLoaded', async function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('userListTable');
    const tableBodyEl = document.getElementById('userListTableBody');
    let currentUserRole = ''; // 현재 로그인한 관리자의 역할을 저장

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        if (!tableEl) {
            console.error("테이블 요소를 찾을 수 없습니다.");
            if(loadingEl) loadingEl.textContent = '페이지 구성에 오류가 있습니다.';
            return;
        }
        
        // 권한 확인
        const hasPermission = await checkAdminPermission(['super_admin', 'user_manager']);
        if (!hasPermission) {
            document.querySelector('.page-section').innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }

        // 현재 관리자 역할 가져오기 (역할 변경 UI 제어용)
        try {
            const meRes = await fetch('${API_BASE_URL}/users/me', { headers: { 'Authorization': `Bearer ${token}` }});
            const meResult = await meRes.json();
            if(meResult.success) currentUserRole = meResult.user.role;
        } catch(e) { console.error("관리자 역할 정보 로딩 실패:", e); }

        await loadUsers();
        attachEventListeners();
    }

    /**
     * 서버에서 사용자 목록을 불러와 테이블을 그리는 함수
     */
    async function loadUsers() {
        if (!tableBodyEl) return;
        tableBodyEl.innerHTML = `<tr><td colspan="8" style="text-align:center;">회원 목록을 불러오는 중입니다...</td></tr>`;

        try {
            const response = await fetch('${API_BASE_URL}/admin/users', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('회원 목록을 불러오는 데 실패했습니다.');
            
            const result = await response.json();
            if (result.success) {
                renderUserTable(result.users);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            if(loadingEl) loadingEl.style.display = 'none';
            if(tableBodyEl) tableBodyEl.innerHTML = `<tr><td colspan="8" style="text-align:center;">오류가 발생했습니다: ${error.message}</td></tr>`;
        }
    }

    /**
     * 받아온 데이터로 사용자 테이블을 그리는 함수
     */
    function renderUserTable(users) {
        if (!tableBodyEl) return;
        tableBodyEl.innerHTML = '';
        if (users.length === 0) {
            tableBodyEl.innerHTML = `<tr><td colspan="8" style="text-align:center;">등록된 회원이 없습니다.</td></tr>`;
            return;
        }

        users.forEach(user => {
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = user.id;
            row.insertCell().textContent = user.email;
            row.insertCell().textContent = user.company_name || '-';
            row.insertCell().textContent = user.manager_name || '-';
            row.insertCell().textContent = user.manager_phone || '-';
            row.insertCell().textContent = getCompanySizeName(user.company_size);
            
            const roleCell = row.insertCell();
            if (currentUserRole === 'super_admin') {
                const roleSelect = document.createElement('select');
                roleSelect.className = 'form-control-sm';
                roleSelect.dataset.userid = user.id;
                ['user', 'content_manager', 'user_manager', 'super_admin'].forEach(role => {
                    const option = document.createElement('option');
                    option.value = role;
                    option.textContent = role;
                    if (role === user.role) option.selected = true;
                    roleSelect.appendChild(option);
                });
                roleCell.appendChild(roleSelect);
            } else {
                roleCell.textContent = user.role;
            }
            
            const actionCell = row.insertCell();
            if (currentUserRole === 'super_admin') {
                actionCell.innerHTML = `
                    <div class="button-group">
                        <button class="button-primary button-sm save-role-btn" data-userid="${user.id}">역할 저장</button>
                        <button class="button-danger button-sm delete-user-btn" data-userid="${user.id}">삭제</button>
                    </div>
                `;
            } else {
                actionCell.textContent = '-';
            }
        });

        if(loadingEl) loadingEl.style.display = 'none';
        if(tableEl) tableEl.classList.remove('hidden');
    }

    /**
     * 모든 이벤트 리스너를 연결하는 함수
     */
    function attachEventListeners() {
        if (!tableBodyEl) return;

        tableBodyEl.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userid;
            if (!userId) return;

            // 역할 저장 버튼
            if (e.target.classList.contains('save-role-btn')) {
                const newRole = document.querySelector(`select[data-userid='${userId}']`).value;
                if (confirm(`사용자 ID ${userId}의 역할을 '${newRole}'(으)로 변경하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}/role`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ role: newRole })
                        });
                        const result = await response.json();
                        alert(result.message);
                    } catch(err) { alert('역할 변경 중 오류 발생'); }
                }
            }
            // 삭제 버튼
            if (e.target.classList.contains('delete-user-btn')) {
                if (confirm(`사용자 ID ${userId}를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (result.success) loadUsers(); // 성공 시 목록 새로고침
                    } catch (err) { alert('사용자 삭제 중 오류 발생'); }
                }
            }
        });
    }

    // --- 페이지 실행 ---
    initializePage();
});
