/**
 * 파일명: js/admin_partners.js
 * 기능: 협력사 관리 페이지의 모든 기능 (S3 업로드 방식으로 전체 수정)
 * 수정 일시: 2025-07-04 02:33
 */
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('locallink-token');
    const tableBodyEl = document.getElementById('partnersTableBody');
    const createForm = document.getElementById('createPartnerForm');
    const loadingEl = document.getElementById('loadingMessage');
    const tableEl = document.getElementById('partnersTable');

    // --- 페이지 초기화 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) {
            document.body.innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }
        
        loadPartners();
        attachEventListeners();
    }

    /**
     * 파일명: js/admin_partners.js
     * 수정 위치: loadPartners 함수 전체
     * 수정 일시: 2025-07-04 03:03
     */
    async function loadPartners() {
        const loadingEl = document.getElementById('loadingMessage');
        const tableEl = document.getElementById('partnersTable');
        const tableBodyEl = document.getElementById('partnersTableBody');
        try {
            const response = await fetch(`${API_BASE_URL}/admin/partners`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success) {
                tableBodyEl.innerHTML = '';
                result.partners.forEach(p => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.id = p.id;
                    
                    // ★★★ 이미지 URL 처리 로직 수정 ★★★
                    const logoUrl = (p.logo_url && p.logo_url.startsWith('http'))
                        ? p.logo_url // S3 전체 주소이면 그대로 사용
                        : `${STATIC_BASE_URL}${p.logo_url}`;

                    row.insertCell().textContent = p.id;
                    row.insertCell().innerHTML = `<input type="text" class="form-control" value="${p.name}" data-key="name">`;
                    row.insertCell().innerHTML = `<img src="${logoUrl}" alt="${p.name}" data-original-logo="${p.logo_url || ''}" style="width:100px; height:auto;">`;
                    row.insertCell().innerHTML = `<input type="file" class="form-control logo-file-input" accept="image/*">`;
                    row.insertCell().innerHTML = `<input type="text" class="form-control" value="${p.link_url || ''}" data-key="link_url">`;
                    
                    // ▼▼▼ '순서 변경' 셀과 버튼을 추가합니다. ▼▼▼
                    const orderCell = row.insertCell();
                    orderCell.className = 'order-controls';
                    orderCell.innerHTML = `
                        <button class="arrow-btn up-btn" data-id="${p.id}" title="위로" ${index === 0 ? 'disabled' : ''}>▲</button>
                        <button class="arrow-btn down-btn" data-id="${p.id}" title="아래로" ${index === result.partners.length - 1 ? 'disabled' : ''}>▼</button>
                    `;                                        
                    
                    row.insertCell().innerHTML = `<div class="button-group"><button class="button-primary button-sm save-btn">저장</button> <button class="button-danger button-sm delete-btn">삭제</button></div>`;
                });
            } else { throw new Error(result.message); }
        } catch (error) { loadingEl.textContent = `오류: ${error.message}`; }
        loadingEl.style.display = 'none';
        tableEl.classList.remove('hidden');
    }
    
    // --- 이벤트 리스너 연결 ---
    function attachEventListeners() {
        // '새 협력사 추가' 폼 제출 이벤트
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(createForm);
            
            // 파일이 선택되었는지 확인
            const fileInput = document.getElementById('new_logo_file');
            if (!fileInput.files[0]) {
                alert('로고 이미지를 선택해주세요.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/admin/partners`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
                    body: formData
                });
                const result = await response.json();
                alert(result.message);
                if (result.success) {
                    createForm.reset();
                    loadPartners();
                }
            } catch (err) { 
                alert(`추가 중 오류 발생: ${err.message}`); 
            }
        });

        // 테이블 내의 '저장' 또는 '삭제' 버튼 클릭 이벤트 (이벤트 위임)
        tableBodyEl.addEventListener('click', async (e) => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;

            // '저장' 버튼 클릭
            if (target.classList.contains('save-btn')) {
                const fileInput = row.querySelector('.logo-file-input');
                const file = fileInput.files[0];
                
                const formData = new FormData();
                formData.append('name', row.querySelector('[data-key="name"]').value);
                formData.append('link_url', row.querySelector('[data-key="link_url"]').value);
                
                // 새 파일이 있으면 'partnerLogo' 필드로 추가하고,
                // 없으면 기존 로고 URL을 'logo_url' 필드로 전송합니다.
                if (file) {
                    formData.append('partnerLogo', file);
                } else {
                    formData.append('logo_url', row.querySelector('img').dataset.originalLogo);
                }

                if (confirm(`ID ${id} 항목을 수정하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/partners/${id}`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` },
                            body: formData
                        });
                        const result = await response.json();
                        alert(result.message);
                        if(result.success) loadPartners(); // 성공 시 목록 새로고침
                    } catch(err) { 
                        alert('수정 중 오류 발생'); 
                    }
                }
            }

            // '삭제' 버튼 클릭
            if (target.classList.contains('delete-btn')) {
                if (confirm(`ID ${id} 항목을 정말로 삭제하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/partners/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if(result.success) loadPartners(); // 성공 시 목록 새로고침
                    } catch(err) { 
                        alert('삭제 중 오류 발생'); 
                    }
                }
            }
        });
    }

    // --- 페이지 시작 ---
    initializePage();
});