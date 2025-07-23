import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('locallink-token');
    if (!await checkAdminPermission(['super_admin', 'vice_super_admin', 'content_manager'])) return;

    const tableBody = document.getElementById('categories-table-body');
    const modal = document.getElementById('edit-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('edit-form');
    const closeBtn = document.querySelector('.close-btn');

    let allCategories = []; // 불러온 카테고리 데이터를 저장할 배열

    // 카테고리 목록을 불러와서 테이블에 그리는 함수
    async function loadCategories() {
        try {
            const res = await fetch(`${API_BASE_URL}/admin/solution-categories`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await res.json();
            tableBody.innerHTML = '';
            if (result.success) {
                allCategories = result.categories; // 데이터 캐싱
                allCategories.forEach(cat => {
                    const row = tableBody.insertRow();
                    row.innerHTML = `
                        <td><strong>${cat.parent_category}</strong></td>
                        <td>${cat.category_name}</td>
                        <td>${cat.description || '<em>설명이 없습니다.</em>'}</td>
                        <td><button class="button-secondary button-sm edit-btn" data-id="${cat.id}">수정</button></td>
                    `;
                });
            }
        } catch (e) {
            console.error("카테고리 목록 로딩 실패:", e);
            tableBody.innerHTML = '<tr><td colspan="4">데이터를 불러오는 데 실패했습니다.</td></tr>';
        }
    }

    function openModal(category) {
        document.getElementById('category-id').value = category.id;
        modalTitle.textContent = `'${category.category_name}' 설명 수정`;
        document.getElementById('category-description').value = category.description || '';
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
    }

    // 이벤트 리스너 연결
    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => { if (e.target == modal) closeModal(); });

    tableBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-btn')) {
            const id = parseInt(e.target.dataset.id, 10);
            const categoryToEdit = allCategories.find(cat => cat.id === id);
            if (categoryToEdit) {
                openModal(categoryToEdit);
            }
        }
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('category-id').value;
        const description = document.getElementById('category-description').value;

        try {
            const res = await fetch(`${API_BASE_URL}/admin/solution-categories/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ description })
            });
            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            
            alert(result.message);
            closeModal();
            await loadCategories(); // 목록 새로고침
        } catch (err) {
            alert(`저장 실패: ${err.message}`);
        }
    });

    // 페이지 초기화 실행
    await loadCategories();
});