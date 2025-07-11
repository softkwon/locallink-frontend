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
     * 수정 일시: 2025-07-11    02:33
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
                result.partners.forEach((p, index) => {
                    const row = tableBodyEl.insertRow();
                    row.dataset.id = p.id;
                    
                    // ★★★ 수정된 부분: 백엔드가 보내준 logo_url을 그대로 사용합니다. ★★★
                    const logoUrl = p.logo_url || '/images/default_logo.png'; // 로고가 없을 경우 기본 이미지

                    row.insertCell().textContent = p.id;
                    row.insertCell().innerHTML = `<input type="text" class="form-control" value="${p.name}" data-key="name">`;
                    row.insertCell().innerHTML = `<img src="${logoUrl}" alt="${p.name}" data-original-logo="${p.logo_url || ''}" style="width:100px; height:auto;">`;
                    row.insertCell().innerHTML = `<input type="file" class="form-control logo-file-input" accept="image/*">`;
                    row.insertCell().innerHTML = `<input type="text" class="form-control" value="${p.link_url || ''}" data-key="link_url">`;
                    
                    // 순서 변경 버튼
                    const orderCell = row.insertCell();
                    orderCell.className = 'order-controls';
                    orderCell.innerHTML = `
                        <button class="arrow-btn up-btn" data-id="${p.id}" title="위로" ${index === 0 ? 'disabled' : ''}>▲</button>
                        <button class="arrow-btn down-btn" data-id="${p.id}" title="아래로" ${index === result.partners.length - 1 ? 'disabled' : ''}>▼</button>
                    `;

                    row.insertCell().innerHTML = `<div class="button-group"><button class="button-primary button-sm save-btn">저장</button> <button class="button-danger button-sm delete-btn">삭제</button></div>`;
                });
            } else { 
                throw new Error(result.message); 
            }
        } catch (error) { 
            loadingEl.textContent = `오류: ${error.message}`; 
        }
        loadingEl.style.display = 'none';
        tableEl.classList.remove('hidden');
    }
    
    // --- 이벤트 리스너 연결 ---
    function attachEventListeners() {
        // '새 협력사 추가' 폼 제출 이벤트 (기존과 동일)
        createForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(createForm);
            
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

        // 테이블 내의 버튼 클릭 이벤트 (이벤트 위임 방식)
        tableBodyEl.addEventListener('click', async (e) => {
            const target = e.target;
            const row = target.closest('tr');
            if (!row) return;
            const id = row.dataset.id;

            // ▼▼▼ 순서 변경 버튼 클릭 시 처리 로직 추가 ▼▼▼
            if (target.matches('.arrow-btn')) {
                const direction = target.classList.contains('up-btn') ? 'up' : 'down';
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/partners/reorder`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ partnerId: id, direction: direction })
                    });
                    const result = await response.json();
                    if (result.success) {
                        loadPartners(); // 성공 시 목록 새로고침
                    } else {
                        alert('순서 변경 실패: ' + result.message);
                    }
                } catch (error) {
                    console.error('순서 변경 중 오류:', error);
                    alert('순서 변경 중 오류가 발생했습니다.');
                }
                return; // 다른 버튼 로직을 실행하지 않고 종료
            }
            // ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲

            // '저장' 버튼 클릭 (기존 로직)
            if (target.classList.contains('save-btn')) {
                const fileInput = row.querySelector('.logo-file-input');
                const file = fileInput.files[0];
                
                const formData = new FormData();
                formData.append('name', row.querySelector('[data-key="name"]').value);
                formData.append('link_url', row.querySelector('[data-key="link_url"]').value);
                
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
                        if(result.success) loadPartners();
                    } catch(err) { 
                        alert('수정 중 오류 발생'); 
                    }
                }
            }

            // '삭제' 버튼 클릭 (기존 로직)
            if (target.classList.contains('delete-btn')) {
                if (confirm(`ID ${id} 항목을 정말로 삭제하시겠습니까?`)) {
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/partners/${id}`, {
                            method: 'DELETE',
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
                        const result = await response.json();
                        alert(result.message);
                        if(result.success) loadPartners();
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