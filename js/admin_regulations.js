import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('locallink-token');
    if (!await checkAdminPermission(['super_admin', 'vice_super_admin', 'content_manager'])) return;

    // --- 1. 요소 가져오기 ---
    const tableBody = document.getElementById('regulations-table-body');
    const modal = document.getElementById('regulation-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('regulation-form');
    const addBtn = document.getElementById('add-regulation-btn');
    const closeBtn = document.querySelector('.close-btn');

    // ★★★ [신규] 한글-영문 매핑 객체 ★★★
    const sizeMap = {
        'large': '대기업',
        'medium': '중견기업',
        'small_medium': '중소기업',
        'small_micro': '소기업/소상공인'
    };

    // --- 2. 함수 정의 ---

    // 규제 목록을 불러와서 테이블에 그리는 함수
    async function loadRegulations() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/regulations`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await res.json();
            tableBody.innerHTML = '';
            if (result.success) {
                result.regulations.forEach(reg => {
                    const row = tableBody.insertRow();
                    // ★★★ [수정] 영문 코드를 한글로 변환하여 표시 ★★★
                    const targetSizesKorean = (reg.target_sizes || []).map(size => sizeMap[size] || size).join(', ');
                    row.innerHTML = `
                        <td>${new Date(reg.effective_date).toLocaleDateString()}</td>
                        <td>${reg.regulation_name}</td>
                        <td>${targetSizesKorean}</td>
                        <td>
                            <button class="button-secondary button-sm edit-btn" data-id="${reg.id}">수정</button>
                            <button class="button-danger button-sm delete-btn" data-id="${reg.id}">삭제</button>
                        </td>
                    `;
                });
            }
        } catch (e) {
            console.error("규제 목록 로딩 실패:", e);
            tableBody.innerHTML = '<tr><td colspan="4">데이터를 불러오는 데 실패했습니다.</td></tr>';
        }
    }

    // 모달(팝업)을 여는 함수
    function openModal(regulation = null) {
        form.reset();
        if (regulation) {
            // 수정 모드
            modalTitle.textContent = '규제 정보 수정';
            document.getElementById('regulation-id').value = regulation.id;
            document.getElementById('regulation-name').value = regulation.regulation_name;
            document.getElementById('effective-date').value = new Date(regulation.effective_date).toISOString().split('T')[0];
            document.getElementById('description').value = regulation.description;
            document.getElementById('link-url').value = regulation.link_url;
            // ★★★ [수정] 새로운 컬럼 데이터 채우기 ★★★
            document.getElementById('sanctions').value = regulation.sanctions;
            document.getElementById('countermeasures').value = regulation.countermeasures;
            (regulation.target_sizes || []).forEach(size => {
                const checkbox = document.querySelector(`input[name="target_size"][value="${size}"]`);
                if (checkbox) checkbox.checked = true;
            });
        } else {
            // 생성 모드
            modalTitle.textContent = '새 규제 추가';
            document.getElementById('regulation-id').value = '';
        }
        modal.style.display = 'block';
    }

    // 모달을 닫는 함수
    function closeModal() {
        modal.style.display = 'none';
    }

    // --- 3. 이벤트 리스너 연결 ---

    addBtn.addEventListener('click', () => openModal());
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target == modal) closeModal(); });

    // 폼 제출 (저장) 이벤트
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('regulation-id').value;
        const target_sizes = Array.from(document.querySelectorAll('input[name="target_size"]:checked')).map(cb => cb.value);
        
        const data = {
            regulation_name: document.getElementById('regulation-name').value,
            effective_date: document.getElementById('effective-date').value,
            description: document.getElementById('description').value,
            link_url: document.getElementById('link-url').value,
            target_sizes: target_sizes,
            // ★★★ [수정] 새로운 컬럼 데이터 포함 ★★★
            sanctions: document.getElementById('sanctions').value,
            countermeasures: document.getElementById('countermeasures').value
        };

        const url = id ? `${API_BASE_URL}/admin/regulations/${id}` : `${API_BASE_URL}/admin/regulations`;
        const method = id ? 'PUT' : 'POST';

        try {
            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            
            alert(result.message);
            closeModal();
            await loadRegulations();
        } catch (err) {
            alert(`저장 실패: ${err.message}`);
        }
    });

    // 테이블 내의 수정/삭제 버튼 이벤트
    tableBody.addEventListener('click', async (e) => {
        const target = e.target;
        const id = target.dataset.id;

        if (target.classList.contains('edit-btn')) {
            const res = await fetch(`${API_BASE_URL}/admin/regulations`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await res.json();
            if (result.success) {
                const regulationToEdit = result.regulations.find(r => r.id == id);
                if (regulationToEdit) openModal(regulationToEdit);
            }
        }

        if (target.classList.contains('delete-btn')) {
            if (confirm('정말로 이 규제 정보를 삭제하시겠습니까?')) {
                try {
                    const res = await fetch(`${API_BASE_URL}/admin/regulations/${id}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const result = await res.json();
                    if (!res.ok) throw new Error(result.message);
                    alert(result.message);
                    await loadRegulations();
                } catch (err) {
                    alert(`삭제 실패: ${err.message}`);
                }
            }
        }
    });

    // --- 4. 페이지 초기화 실행 ---
    await loadRegulations();
});
