import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission, getCompanySizeName } from './admin_common.js';
import { getMyUserId } from './auth.js';


document.addEventListener('DOMContentLoaded', async function() {
    
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('userListTable');
    const tableBodyEl = document.getElementById('userListTableBody');
    let currentUserRole = ''; 

    async function initializePage() {
        if (!tableEl) {
            console.error("테이블 요소를 찾을 수 없습니다.");
            if(loadingEl) loadingEl.textContent = '페이지 구성에 오류가 있습니다.';
            return;
        }
        
        const hasPermission = await checkAdminPermission(['super_admin', 'user_manager']);
        if (!hasPermission) {
            document.querySelector('.page-section').innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }

        try {
            const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` }});
            const meResult = await meRes.json();
            if(meResult.success) currentUserRole = meResult.user.role;
        } catch(e) { console.error("관리자 역할 정보 로딩 실패:", e); }

        await loadUsers();
        attachEventListeners();
    }

    
    async function loadUsers() {
        if (!tableBodyEl) return;
        tableBodyEl.innerHTML = `<tr><td colspan="8" style="text-align:center;">회원 목록을 불러오는 중입니다...</td></tr>`;

        try {
            const response = await fetch(`${API_BASE_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('회원 목록을 불러오는 데 실패했습니다.');
            
            const result = await response.json();
            console.log('서버로부터 받은 데이터:', result)

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

    function renderUserTable(users) {
        if (!tableBodyEl) return;
        tableBodyEl.innerHTML = '';
        if (users.length === 0) {
            tableBodyEl.innerHTML = `<tr><td colspan="9" style="text-align:center;">등록된 회원이 없습니다.</td></tr>`;
            return;
        }

        const myUserId = getMyUserId(); 

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
            
            if (!canEditRole) {
                roleSelect.disabled = true;
            }
            roleCell.appendChild(roleSelect);
            
            const levelCell = row.insertCell();
            levelCell.innerHTML = `<span class="user-level-badge level-${user.level}">LV.${user.level}</span>`;
            levelCell.style.textAlign = 'center';
            
            row.insertCell().textContent = new Date(user.created_at).toLocaleDateString();

            row.insertCell().textContent = user.used_referral_code || '-';
            row.insertCell().textContent = user.recommending_organization_name || '-';
            
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

    function attachEventListeners() {
        if (!tableBodyEl) return;

        const exportBtn = document.getElementById('exportCsvBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                exportBtn.textContent = '생성 중...';
                exportBtn.disabled = true;
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/users/export`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) {
                        throw new Error('데이터를 내보내는 중 오류가 발생했습니다.');
                    }
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `users-list-${new Date().toISOString().slice(0,10)}.csv`;
                    
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
        
        tableBodyEl.addEventListener('click', async (e) => {
            const userId = e.target.dataset.userid;
            if (!userId) return;

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
            if (e.target.classList.contains('delete-user-btn')) {
                if (confirm(`사용자 ID ${userId}를 정말로 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (result.success) loadUsers(); 
                    } catch (err) { alert('사용자 삭제 중 오류 발생'); }
                }
            }
        });
    }

    initializePage();
});
