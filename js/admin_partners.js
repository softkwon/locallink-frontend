// js/admin_partners.js (2025-06-26 20:00:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('locallink-token');

    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        loadPartners();
    }

    async function loadPartners() {
        const loadingEl = document.getElementById('loadingMessage');
        const tableEl = document.getElementById('partnersTable');
        const tableBodyEl = document.getElementById('partnersTableBody');
        try {
            const response = await fetch('${API_BASE_URL}/admin/partners', { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success) {
                tableBodyEl.innerHTML = '';
                result.partners.forEach(p => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.id = p.id;
                    row.insertCell().textContent = p.id;
                    row.insertCell().innerHTML = `<input type="text" class="form-control" value="${p.name}" data-key="name">`;
                    row.insertCell().innerHTML = `<img src="${STATIC_BASE_URL}/uploads/partners/${p.logo_url}" alt="${p.name}">`;
                    row.insertCell().innerHTML = `<input type="text" class="form-control" value="${p.link_url || ''}" data-key="link_url">`;
                    row.insertCell().innerHTML = `<button class="button-primary button-sm save-btn">저장</button> <button class="button-danger button-sm delete-btn">삭제</button>`;
                });
            } else { throw new Error(result.message); }
        } catch (error) { loadingEl.textContent = `오류: ${error.message}`; }
        loadingEl.style.display = 'none';
        tableEl.classList.remove('hidden');
    }
    
    document.getElementById('createPartnerForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('new_logo_file');
        const file = fileInput.files[0];
        if (!file) { alert('로고 이미지를 선택해주세요.'); return; }
        
        const formData = new FormData();
        formData.append('partnerLogo', file); // 새 업로드 필드명 사용

        try {
            const uploadRes = await fetch('${API_BASE_URL}/admin/upload-partner-logo', { method: 'POST', headers: { 'Authorization': `Bearer ${token}` }, body: formData });
            const uploadResult = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadResult.message || '이미지 업로드 실패');
            
            const newData = {
                name: document.getElementById('new_name').value,
                link_url: document.getElementById('new_link_url').value,
                logo_url: uploadResult.filename
            };
            
            const response = await fetch('${API_BASE_URL}/admin/partners', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(newData) });
            const result = await response.json();
            alert(result.message);
            if(result.success) loadPartners();
        } catch (err) { alert(`추가 중 오류 발생: ${err.message}`); }
    });

    document.getElementById('partnersTableBody').addEventListener('click', async (e) => {
        const target = e.target;
        const row = target.closest('tr');
        if (!row) return;
        const id = row.dataset.id;
        if (target.classList.contains('save-btn')) {
            const updatedData = {
                name: row.querySelector('[data-key="name"]').value,
                link_url: row.querySelector('[data-key="link_url"]').value,
                logo_url: row.querySelector('img').src.split('/').pop() // 기존 이미지 파일명 유지
            };
            const response = await fetch(`${API_BASE_URL}/admin/partners/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`}, body: JSON.stringify(updatedData) });
            alert((await response.json()).message);
        }
        if (target.classList.contains('delete-btn')) {
            if (confirm(`ID ${id} 항목을 정말로 삭제하시겠습니까?`)) {
                const response = await fetch(`${API_BASE_URL}/admin/partners/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                alert((await response.json()).message);
                if((await response.json()).success) loadPartners();
            }
        }
    });

    initializePage();
});