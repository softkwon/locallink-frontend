// js/admin_industry_issues.js (최종 완성본)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('locallink-token');
    
    // --- 1. 페이지 요소 찾기 ---
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('issuesTable');
    const tableBodyEl = document.getElementById('issuesTableBody');
    const createForm = document.getElementById('createIssueForm');
    const newIndustrySelect = document.getElementById('new_industry_code');

    // --- 2. 기능 함수 정의 ---

    // 페이지 초기화 함수
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        await loadIndustriesForDropdown();
        loadIssues();
    }

    // '새 항목 추가' 폼의 '산업' 드롭다운을 채우는 함수
    async function loadIndustriesForDropdown() {
        try {
            const res = await fetch(`${API_BASE_URL}/industries`);
            const result = await res.json();
            if(result.success) {
                if(newIndustrySelect) {
                    newIndustrySelect.innerHTML = '<option value="">-- 산업 선택 --</option>';
                    result.industries.forEach(i => {
                        newIndustrySelect.innerHTML += `<option value="${i.code}">[${i.code}] ${i.name}</option>`;
                    });
                }
            }
        } catch(e) { console.error('산업 목록 로딩 실패:', e); }
    }

    // 모든 산업별 이슈를 불러와 테이블을 그리는 함수
    async function loadIssues() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/industry-issues`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            
            if (result.success) {
                tableBodyEl.innerHTML = '';
                result.issues.forEach(item => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.id = item.id;
                    row.insertCell().textContent = item.id;
                    row.insertCell().textContent = `[${item.industry_code}] ${item.industry_name}`;
                    row.insertCell().innerHTML = `<textarea class="form-control" data-key="key_issue">${item.key_issue || ''}</textarea>`;
                    row.insertCell().innerHTML = `<textarea class="form-control" data-key="opportunity">${item.opportunity || ''}</textarea>`;
                    row.insertCell().innerHTML = `<textarea class="form-control" data-key="threat">${item.threat || ''}</textarea>`;
                    row.insertCell().innerHTML = `<textarea class="form-control" data-key="linked_metric">${item.linked_metric || ''}</textarea>`;
                    row.insertCell().innerHTML = `<textarea class="form-control" data-key="notes">${item.notes || ''}</textarea>`;
                    row.insertCell().innerHTML = `<button class="button-primary button-sm save-btn">저장</button> <button class="button-danger button-sm delete-btn">삭제</button>`;
                });
            } else { throw new Error(result.message); }
        } catch (error) { 
            loadingEl.textContent = `오류: ${error.message}`; 
        }
        loadingEl.style.display = 'none';
        tableEl.classList.remove('hidden');
    }
    
    // --- 3. 이벤트 리스너 연결 ---

    // 새 항목 추가
    if (createForm) {
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newData = {
                industry_code: document.getElementById('new_industry_code').value,
                esg_category: 'E', // 임시 값, 현재 UI에서는 사용하지 않음
                key_issue: '',
                opportunity: '',
                threat: '',
                linked_metric: '',
                notes: ''
            };
            if(!newData.industry_code) { alert('산업을 선택해주세요.'); return; }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/industry-issues`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newData) });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                alert(result.message);
                loadIssues();
            } catch (err) { alert(`새 항목 추가 중 오류 발생: ${err.message}`); }
        });
    }
    
    // 기존 항목 수정/삭제 (이벤트 위임)
    if (tableBodyEl) {
        tableBodyEl.addEventListener('click', async (e) => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;

            // '저장' 버튼 클릭 시
            if (target.classList.contains('save-btn')) {
                const updatedData = {
                    // ★★★ data-key를 사용해 모든 textarea의 값을 읽어옵니다. ★★★
                    key_issue: row.querySelector('[data-key="key_issue"]').value,
                    opportunity: row.querySelector('[data-key="opportunity"]').value,
                    threat: row.querySelector('[data-key="threat"]').value,
                    linked_metric: row.querySelector('[data-key="linked_metric"]').value,
                    notes: row.querySelector('[data-key="notes"]').value
                };

                if (confirm(`ID ${id} 항목의 내용을 수정하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/industry-issues/${id}`, { 
                            method: 'PUT', 
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, 
                            body: JSON.stringify(updatedData) 
                        });
                        const result = await response.json();
                        alert(result.message);
                        if (result.success) loadIssues(); // 성공 시 목록 새로고침
                    } catch(err) {
                        alert('수정 중 오류 발생');
                    }
                }
            }

            // '삭제' 버튼 클릭 시
            if (target.classList.contains('delete-btn')) {
                if (confirm(`ID ${id} 항목을 정말로 삭제하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/industry-issues/${id}`, { 
                            method: 'DELETE', 
                            headers: { 'Authorization': `Bearer ${token}` } 
                        });
                        const result = await response.json();
                        alert(result.message);
                        if(result.success) loadIssues();
                    } catch(err) {
                        alert('삭제 중 오류가 발생했습니다.');
                    }
                }
            }
        });
    }

    // ★★★ CSV 내보내기 버튼 이벤트 리스너 추가 ★★★
    const exportBtn = document.getElementById('exportCsvBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', async () => {
            exportBtn.textContent = '생성 중...';
            exportBtn.disabled = true;
            try {
                const response = await fetch(`${API_BASE_URL}/admin/industry-issues/export`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error('데이터 내보내기 실패');
                
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `industry-issues-${new Date().toISOString().slice(0,10)}.csv`;
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

    // ★★★ CSV 가져오기 폼 제출 이벤트 리스너 추가 ★★★
    const importForm = document.getElementById('importCsvForm');
    if(importForm) {
        importForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const fileInput = document.getElementById('csvFile');
            const file = fileInput.files[0];
            if (!file) {
                alert('CSV 파일을 선택해주세요.');
                return;
            }

            const formData = new FormData();
            formData.append('csvFile', file);

            try {
                const response = await fetch(`${API_BASE_URL}/admin/industry-issues/import`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                alert(result.message);
                if (result.success) {
                    loadIssues(); // 성공 시 테이블 새로고침
                }
            } catch (err) {
                alert('파일 업로드 중 오류가 발생했습니다.');
            }
        });
    }
    
    // --- 4. 페이지 시작 ---
    initializePage();
});