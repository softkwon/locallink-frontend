import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async function() {
    // 페이지 접근 권한 확인
    const hasPermission = await checkAdminPermission(['super_admin', 'vice_super_admin']);
    if (!hasPermission) return;

    const token = localStorage.getItem('locallink-token'); // 토큰 이름은 실제 사용하는 이름으로 변경해주세요.

    const tableBody = document.getElementById('codes-table-body');
    const addCodeBtn = document.getElementById('add-code-btn');
    const modal = document.getElementById('code-modal');
    const modalTitle = document.getElementById('modal-title');
    const closeButton = document.querySelector('.modal .close-button');
    const codeForm = document.getElementById('code-form');
    const adminSelect = document.getElementById('linked-admin-id');

    // 추천 단체(관리자) 목록 불러오기
    async function loadAdmins() {
        try {
            const response = await fetch('/api/admin/admins-list', {
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

    // 추천 코드 목록 불러오기
    async function loadCodes() {
        try {
            const response = await fetch('/api/admin/referral-codes', {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.status === 404) {
                console.warn('추천 코드 API(/api/admin/referral-codes)를 찾을 수 없습니다. 빈 목록으로 처리합니다.');
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
                alert(data.message);
            }
        } catch (error) {
            console.error('추천 코드 로딩 실패:', error);
            if (error.message.includes('404')) {
                 renderTable([]); 
            } else {
                alert('데이터를 불러오는 데 실패했습니다. 서버 상태를 확인해주세요.');
            }
        }
    }

    // 테이블 렌더링
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
                <td>${code.expires_at ? new Date(code.expires_at).toLocaleString() : '없음'}</td>
                <td>
                    <button class="button-danger button-sm delete-btn" data-id="${code.id}">삭제</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    }

    // 모달 열기/닫기 및 폼 제출 로직 (이전과 동일)
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
            const response = await fetch('/api/admin/referral-codes', {
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
            const response = await fetch(`/api/admin/referral-codes/${codeId}`, {
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

    // 이벤트 리스너 등록
    addCodeBtn.addEventListener('click', openModal);
    closeButton.addEventListener('click', closeModal);
    window.addEventListener('click', (event) => { if (event.target == modal) closeModal(); });
    codeForm.addEventListener('submit', handleFormSubmit);
    tableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            deleteCode(event.target.dataset.id);
        }
    });

    // 초기 데이터 로드
    loadAdmins();
    loadCodes();
});
