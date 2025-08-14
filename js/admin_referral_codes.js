import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async function() {
    const hasPermission = await checkAdminPermission(['super_admin', 'vice_super_admin']);
    if (!hasPermission) return;

    const token = localStorage.getItem('locallink-token'); 

    const tableBody = document.getElementById('codes-table-body');
    const addCodeBtn = document.getElementById('add-code-btn');
    const modal = document.getElementById('code-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeButton = document.querySelector('.modal .close-button');
    const codeForm = document.getElementById('code-form');
    const adminSelect = document.getElementById('linked-admin-id');

    async function loadAdmins() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/admins-list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();
            if (data.success) {
                adminSelect.innerHTML = '<option value="">-- 단체 선택 --</option>';
                data.admins.forEach(admin => {
                    const option = document.createElement('option');
                    option.value = admin.id;
                    option.textContent = `${admin.company_name} (ID: ${admin.id})`;
                    adminSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error('관리자 목록 로딩 실패:', error);
        }
    }

    async function loadCodes() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/referral-codes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 404) {
                renderTable([]);
                return;
            }
            
            if (!response.ok) {
                throw new Error(`서버 응답 오류: ${response.status}`);
            }

            const data = await response.json();
            if (data.success) {
                renderTable(data.codes);
            } else {
                if (data.codes && data.codes.length === 0) {
                    renderTable([]);
                } else {
                    alert(data.message);
                }
            }
        } catch (error) {
            console.error('추천 코드 로딩 실패:', error);
        }
    }

    function renderTable(codes) {
        tableBody.innerHTML = '';
        if (codes.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5">생성된 추천 코드가 없습니다.</td></tr>';
            return;
        }
        codes.forEach(code => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${code.id}</td>
                <td>${code.code}</td>
                <td>${code.organization_name || 'N/A'}</td>
                <td>${new Date(code.created_at).toLocaleDateString()}</td>
                <td>${code.expires_at ? new Date(code.expires_at).toLocaleString() : '없음'}</td>
                <td>
                    <button class="button-danger button-sm delete-btn" data-id="${code.id}">삭제</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    function openModal() {
        modalTitle.textContent = '신규 코드 추가';
        codeForm.reset();
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    async function handleFormSubmit(event) {
        event.preventDefault();
        const formData = new FormData(codeForm);
        const codeData = {
            code: formData.get('code'),
            linked_admin_id: formData.get('linked_admin_id') || null,
            expires_at: formData.get('expires_at') || null
        };
        try {
            const response = await fetch(`${API_BASE_URL}/admin/referral-codes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(codeData)
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert(result.message);
                closeModal();
                loadCodes();
            } else {
                alert(result.message || '코드 생성에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 생성 에러:', error);
            alert('요청 처리 중 오류가 발생했습니다.');
        }
    }
    
    async function deleteCode(codeId) {
        if (!confirm(`정말로 이 추천 코드를 삭제하시겠습니까?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/referral-codes/${codeId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (response.ok && result.success) {
                alert(result.message);
                loadCodes();
            } else {
                alert(result.message || '코드 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('코드 삭제 에러:', error);
            alert('요청 처리 중 오류가 발생했습니다.');
        }
    }

    addCodeBtn.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target == modal) closeModal(); });
    codeForm.addEventListener('submit', handleFormSubmit);
    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            deleteCode(event.target.dataset.id);
        }
    });

    loadAdmins();
    loadCodes();
});
