// js/admin_news_list.js (2025-07-01 10:40:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const token = localStorage.getItem('locallink-token');
    const tableBody = document.getElementById('newsListTableBody');
    let currentUserRole = '';

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) {
            if(tableBody) tableBody.innerHTML = `<tr><td colspan="7">접근 권한이 없습니다.</td></tr>`;
            return;
        }

        try {
            const meRes = await fetch('${API_BASE_URL}/users/me', { headers: { 'Authorization': `Bearer ${token}` }});
            const meResult = await meRes.json();
            if (meResult.success) currentUserRole = meResult.user.role;
        } catch(e) { console.error("역할 정보 로딩 실패"); }
        
        await loadNews();
        attachEventListeners();
    }

    /**
     * 서버에서 소식 목록을 불러와 테이블을 그리는 함수
     */
    async function loadNews() {
        if (!tableBody) return;
        tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">소식 목록을 불러오는 중입니다...</td></tr>`;
        try {
            const response = await fetch('${API_BASE_URL}/admin/news', { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success) {
                renderNewsTable(result.posts);
            } else { throw new Error(result.message); }
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">목록을 불러오는 데 실패했습니다: ${error.message}</td></tr>`;
        }
    }

    /**
     * 받아온 데이터로 테이블의 내용을 채우는 함수
     */
    function renderNewsTable(posts) {
        tableBody.innerHTML = '';
        if (posts.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="7" style="text-align:center;">작성된 소식이 없습니다.</td></tr>`;
            return;
        }
        posts.forEach(post => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = post.id;
            row.insertCell().textContent = post.category;
            row.insertCell().textContent = post.title;
            
            const statusCell = row.insertCell();
            if (currentUserRole === 'super_admin') {
                const select = document.createElement('select');
                select.className = 'form-control-sm status-select';
                select.dataset.id = post.id;
                ['draft', 'published'].forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt;
                    option.textContent = opt === 'draft' ? '임시저장' : '발행';
                    if (post.status === opt) option.selected = true;
                    select.appendChild(option);
                });
                statusCell.appendChild(select);
            } else {
                statusCell.textContent = post.status === 'draft' ? '임시저장' : '발행';
            }

            const pinCell = row.insertCell();
            if (currentUserRole === 'super_admin') {
                pinCell.innerHTML = `<input type="checkbox" class="pin-checkbox" data-id="${post.id}" ${post.is_pinned ? 'checked' : ''}>`;
            } else {
                pinCell.textContent = post.is_pinned ? '✔️' : '';
            }

            row.insertCell().textContent = new Date(post.created_at).toLocaleDateString();
            row.insertCell().innerHTML = `<div class="button-group"><a href="admin_news_edit.html?id=${post.id}" class="button-secondary button-sm">수정</a><button type="button" class="button-danger button-sm delete-btn" data-id="${post.id}">삭제</button></div>`;
        });
    }

    /**
     * 모든 이벤트 리스너를 연결하는 함수
     */
    function attachEventListeners() {
        if (!tableBody) return;

        // '상태' 드롭다운 및 '고정' 체크박스 변경 이벤트
        tableBody.addEventListener('change', async (e) => {
            const target = e.target;
            const postId = target.dataset.id;

            if (target.classList.contains('status-select')) {
                const newStatus = target.value;
                if (!confirm(`게시물 ${postId}번의 상태를 '${newStatus === 'published' ? '발행' : '임시저장'}'(으)로 변경하시겠습니까?`)) {
                    loadNews(); return;
                }
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/news/${postId}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ status: newStatus })
                    });
                    const result = await response.json();
                    alert(result.message);
                    if(!result.success) loadNews();
                } catch (err) { alert('상태 변경 중 오류 발생'); loadNews(); }
            }

            if (target.classList.contains('pin-checkbox')) {
                const isPinned = target.checked;
                if (!confirm(`게시물 ${postId}번을 '${isPinned ? '상단 고정' : '고정 해제'}' 하시겠습니까?`)) {
                    target.checked = !isPinned; // 사용자가 취소하면 체크박스를 원래 상태로 되돌림
                    return;
                }
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/news/${postId}/pin`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ isPinned: isPinned })
                    });
                    const result = await response.json();
                    alert(result.message);
                    if (!result.success) loadNews(); // 실패 시 목록 새로고침
                } catch (err) {
                    console.error('[Frontend] 고정 상태 변경 중 fetch 오류:', err);
                    alert('고정 상태 변경 중 오류가 발생했습니다.'); 
                    loadNews();
                }
            }
        });

        // '삭제' 버튼 클릭 이벤트
        tableBody.addEventListener('click', async (e) => {
            if (e.target.classList.contains('delete-btn')) {
                const postId = e.target.dataset.id;
                if (confirm(`게시물 ID ${postId}번을 정말로 삭제하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/news/${postId}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (result.success) loadNews();
                    } catch (error) { alert('삭제 중 오류가 발생했습니다.'); }
                }
            }
        });
    }
    
    initializePage();
});
