// js/admin_user_list.js (2025-07-02 00:25:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission, getCompanySizeName } from './admin_common.js';
import { getMyUserId } from './auth.js'; // auth.js에서 함수를 불러옵니다.


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
            const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` }});
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
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('회원 목록을 불러오는 데 실패했습니다.');
            
            const result = await response.json();
            // ★★★ 바로 이 부분에 로그를 추가합니다! ★★★
            console.log('서버로부터 받은 데이터:', result)
            // 여기까지 추가 ★★★

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
     * 파일명: js/admin_user_list.js
     * 수정 위치: renderUserTable 함수 전체
     * 수정 일시: 2025-07-11 09:59
     */
    function renderUserTable(users) {
        if (!tableBodyEl) return;
        tableBodyEl.innerHTML = '';
        if (users.length === 0) {
            tableBodyEl.innerHTML = `<tr><td colspan="9" style="text-align:center;">등록된 회원이 없습니다.</td></tr>`;
            return;
        }

        const myUserId = getMyUserId(); // 현재 로그인한 관리자 ID 가져오기

        users.forEach(user => {
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = user.id;
            row.insertCell().textContent = user.email;
            row.insertCell().textContent = user.company_name || '-';
            row.insertCell().textContent = user.manager_name || '-';
            row.insertCell().textContent = user.manager_phone || '-';
            
            const roleCell = row.insertCell();
            const actionCell = row.insertCell();

            const canEditRole = (currentUserRole === 'super_admin' && user.id !== myUserId) ||
                                (currentUserRole === 'vice_super_admin' && user.role !== 'super_admin');

            // 역할 변경 UI (select)
            const roleSelect = document.createElement('select');
            roleSelect.className = 'form-control-sm';
            roleSelect.dataset.userid = user.id;
            
            const roles = ['user', 'content_manager', 'user_manager', 'vice_super_admin', 'super_admin'];
            roles.forEach(role => {
                const option = document.createElement('option');
                option.value = role;
                option.textContent = role;
                if (role === user.role) option.selected = true;
                roleSelect.appendChild(option);
            });
            
            // super_admin이 아니면 역할 변경을 막음
            if (!canEditRole) {
                roleSelect.disabled = true;
            }
            roleCell.appendChild(roleSelect);
            
            // 레벨
            const levelCell = row.insertCell();
            levelCell.innerHTML = `<span class="user-level-badge level-${user.level}">LV.${user.level}</span>`;
            levelCell.style.textAlign = 'center';
            
            // 가입일
            row.insertCell().textContent = new Date(user.created_at).toLocaleDateString();

            // 관리 버튼
            if (canEditRole) {
                actionCell.innerHTML = `
                    <div class="button-group">
                        <button class="button-primary button-sm save-role-btn" data-userid="${user.id}">역할 저장</button>
                        <button class="button-danger button-sm delete-user-btn" data-userid="${user.id}">삭제</button>
                    </div>`;
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

        // ★★★ Export 버튼 이벤트 리스너 추가 ★★★
        const exportBtn = document.getElementById('exportCsvBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                exportBtn.textContent = '생성 중...';
                exportBtn.disabled = true;
                try {
                    // 1. 백엔드 Export API 호출
                    const response = await fetch(`${API_BASE_URL}/admin/users/export`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        throw new Error('데이터를 내보내는 중 오류가 발생했습니다.');
                    }
                    
                    // 2. 응답받은 파일 데이터(blob)로 다운로드 링크 생성
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `users-list-${new Date().toISOString().slice(0,10)}.csv`;
                    
                    // 3. 링크를 클릭하여 파일 다운로드 실행
                    document.body.appendChild(a);
                    a.click();
                    
                    // 4. 임시로 만든 링크와 URL 객체 제거
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
