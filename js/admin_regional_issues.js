// js/admin_regional_issues.js (2025-06-25 04:00:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('locallink-token');
    
    const loadingEl = document.getElementById('loadingMessage');
    const tableContainerEl = document.getElementById('tableContainer');
    const tableBodyEl = document.getElementById('issuesTableBody');
    const createForm = document.getElementById('createIssueForm');
    const newRegionSelect = document.getElementById('new_region');

    const regions = [ "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주" ];

    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        populateRegionDropdown();
        loadIssues();
        attachEventListeners();
    }

    function populateRegionDropdown() {
        if(!newRegionSelect) return;
        newRegionSelect.innerHTML = '<option value="">-- 지역 선택 --</option>';
        regions.forEach(region => {
            newRegionSelect.innerHTML += `<option value="${region}">${region}</option>`;
        });
    }

    async function loadIssues() {
        if(!loadingEl || !tableContainerEl || !tableBodyEl) return;
        loadingEl.textContent = '목록을 불러오는 중입니다...';
        loadingEl.style.display = 'block';
        tableContainerEl.classList.add('hidden');

        try {
            const response = await fetch(`${API_BASE_URL}/admin/regional-issues`, { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('서버 응답 오류');
            
            const result = await response.json();
            if (result.success) {
                tableBodyEl.innerHTML = '';
                if(result.issues.length === 0) {
                    loadingEl.textContent = '표시할 데이터가 없습니다.';
                    return;
                }
                result.issues.forEach(item => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.id = item.id;
                    row.insertCell().textContent = item.id;
                    row.insertCell().innerHTML = `<input type="text" class="form-control" value="${item.region}" data-key="region" readonly style="background:#eee;">`;
                    const esgCell = row.insertCell();
                    const esgSelect = document.createElement('select');
                    esgSelect.className = 'form-control';
                    esgSelect.dataset.key = 'esg_category';
                    esgSelect.innerHTML = `<option value="E">E</option><option value="S">S</option><option value="G">G</option>`;
                    esgSelect.value = item.esg_category;
                    esgCell.appendChild(esgSelect);
                    row.insertCell().innerHTML = `<textarea class="form-control" data-key="content">${item.content || ''}</textarea>`;

                    // ★★★ 관리 셀에 순서 변경 버튼을 포함하여 수정합니다. ★★★
                    const actionCell = row.insertCell();
                    actionCell.className = 'actions-cell'; // CSS 적용을 위해 클래스 추가
                    actionCell.innerHTML = `
                        <button type="button" class="button-secondary button-sm reorder-btn" data-direction="up" title="위로">🔼</button>
                        <button type="button" class="button-secondary button-sm reorder-btn" data-direction="down" title="아래로">🔽</button>
                        <button type="button" class="button-primary button-sm save-btn">저장</button> 
                        <button type="button" class="button-danger button-sm delete-btn">삭제</button>
                    `;
                });
                loadingEl.style.display = 'none';
                tableContainerEl.classList.remove('hidden');
            } else { 
                throw new Error(result.message);
            }
        } catch (error) {
            loadingEl.textContent = `오류: ${error.message}`;
        }
    }
    
    function attachEventListeners() {
        if (createForm) {
            createForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const newData = {
                    region: document.getElementById('new_region').value,
                    esg_category: document.getElementById('new_esg_category').value,
                    content: document.getElementById('new_content').value
                };
                if(!newData.region || !newData.esg_category) { alert('지역과 카테고리를 모두 선택해주세요.'); return; }
                if(!newData.content) { alert('내용을 입력해주세요.'); return; }
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/regional-issues`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newData) });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    alert(result.message);
                    if (result.success) { e.target.reset(); loadIssues(); }
                } catch (err) { alert(`새 항목 추가 중 오류 발생: ${err.message}`); }
            });
        }
    
        if (tableBodyEl) {
            tableBodyEl.addEventListener('click', async (e) => {
                const target = e.target;
                const row = target.closest('tr');
                if (!row) return;
                const id = row.dataset.id;

                // ★★★ 순서 변경 버튼 로직 추가 ★★★
                if (target.classList.contains('reorder-btn')) {
                    const direction = target.dataset.direction;
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/regional-issues/reorder`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                            body: JSON.stringify({ issueId: id, direction: direction })
                        });
                        const result = await response.json();
                        if(result.success) {
                            loadIssues(); // 성공 시 목록 새로고침
                        } else {
                            alert(result.message);
                        }
                    } catch(err) {
                        alert('순서 변경 중 오류 발생');
                    }
                }

                // 저장 버튼 로직 (기존과 동일)
                if (target.classList.contains('save-btn')) {
                    const updatedData = {
                        region: row.querySelector('[data-key="region"]').value,
                        esg_category: row.querySelector('[data-key="esg_category"]').value,
                        content: row.querySelector('[data-key="content"]').value
                    };
                    const response = await fetch(`${API_BASE_URL}/admin/regional-issues/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(updatedData) });
                    alert((await response.json()).message);
                }

                // 삭제 버튼 로직 (기존과 동일)
                if (target.classList.contains('delete-btn')) {
                    if (confirm(`ID ${id} 항목을 정말로 삭제하시겠습니까?`)) {
                        const response = await fetch(`${API_BASE_URL}/admin/regional-issues/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                        alert((await response.json()).message);
                        loadIssues();
                    }
                }
            });
        }
    }

    initializePage();
});