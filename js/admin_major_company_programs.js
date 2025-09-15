import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async function() {
    
    const token = localStorage.getItem('locallink-token');
    
    // --- 페이지 요소 ---
    const companyListUl = document.getElementById('company-list-ul');
    const addCompanyBtn = document.getElementById('add-company-btn');
    const programListTitle = document.getElementById('program-list-title');
    const programsTableBody = document.getElementById('programs-table-body');
    const addProgramBtn = document.getElementById('add-program-btn');
    const modal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-form');
    const closeButton = modal.querySelector('.close-button');

    // --- 상태 변수 ---
    let selectedCompany = null; // { id, name }
    let companiesCache = [];

    // --- 페이지 초기화 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'vice_super_admin']);
        if (!hasPermission) {
            document.querySelector('.management-grid').innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }
        await loadMajorCompanies();
        attachEventListeners();
    }

    // --- 데이터 로딩 및 렌더링 함수 ---
    async function loadMajorCompanies() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/major-companies`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            companiesCache = result.companies;
            renderCompanyList();
        } catch (error) {
            console.error(error);
            if(companyListUl) companyListUl.innerHTML = `<li>목록 로딩 실패</li>`;
        }
    }

    function renderCompanyList() {
        if(!companyListUl) return;
        companyListUl.innerHTML = '';
        if (companiesCache.length === 0) {
            companyListUl.innerHTML = `<li>등록된 기업이 없습니다.</li>`;
            return;
        }
        companiesCache.forEach(company => {
            const li = document.createElement('li');
            li.dataset.companyId = company.id;
            li.dataset.companyName = company.company_name;
            li.innerHTML = `
                <span>${company.company_name}</span>
                <div class="company-actions">
                    <button type="button" class="button-secondary button-sm edit-company-btn" title="이름 수정">수정</button>
                    <button type="button" class="button-danger button-sm delete-company-btn" title="삭제">삭제</button>
                </div>
            `;
            if (selectedCompany && selectedCompany.id === company.id) {
                li.classList.add('active');
            }
            companyListUl.appendChild(li);
        });
    }

    async function loadCompanyPrograms(companyId) {
        if(!programsTableBody) return;
        programsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">프로그램 목록을 불러오는 중...</td></tr>`;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/major-company-programs/${companyId}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            renderProgramsTable(result.programs);
        } catch (error) {
            console.error(error);
            programsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">목록 로딩 실패</td></tr>`;
        }
    }
    
    function renderProgramsTable(programs) {
        if(!programsTableBody) return;
        programsTableBody.innerHTML = '';
        if (programs.length === 0) {
            programsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">등록된 프로그램이 없습니다.</td></tr>`;
            return;
        }
        programs.forEach(program => {
            const row = programsTableBody.insertRow();
            row.insertCell().textContent = program.program_name;
            row.insertCell().textContent = program.program_description || '-';
            row.insertCell().innerHTML = program.link_url ? `<a href="${program.link_url}" target="_blank">링크</a>` : '-';
            row.insertCell().innerHTML = `
                <button type="button" class="button-secondary button-sm edit-program-btn" data-program-id="${program.id}">수정</button>
                <button type="button" class="button-danger button-sm delete-program-btn" data-program-id="${program.id}">삭제</button>
            `;
        });
    }

    // --- 모달 관리 함수 ---
    function openModal(config) {
        if (!modal || !modalTitle || !modalForm) return;
        modalTitle.textContent = config.title;
        modalForm.innerHTML = config.formHtml;
        modalForm.onsubmit = config.onSubmit;
        modal.style.display = 'block';
    }

    function closeModal() {
        if (!modal || !modalForm) return;
        modal.style.display = 'none';
        modalForm.innerHTML = '';
        modalForm.onsubmit = null;
    }

    // --- 이벤트 핸들러 ---
    function handleAddCompany() {
        openModal({
            title: '새 대기업 추가',
            formHtml: `
                <label for="company_name">회사명</label>
                <input type="text" id="company_name" name="company_name" required>
                <div class="modal-footer"><button type="submit" class="button-primary">추가</button></div>
            `,
            onSubmit: async function(e) {
                e.preventDefault();
                const companyName = this.elements.company_name.value;
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/major-companies`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ company_name: companyName })
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    alert(result.message);
                    closeModal();
                    await loadMajorCompanies();
                } catch (error) { alert(`오류: ${error.message}`); }
            }
        });
    }

    function handleEditCompany(companyId, companyName) {
        openModal({
            title: '대기업 이름 수정',
            formHtml: `
                <label for="company_name">회사명</label>
                <input type="text" id="company_name" name="company_name" value="${companyName}" required>
                <div class="modal-footer"><button type="submit" class="button-primary">수정</button></div>
            `,
            onSubmit: async function(e) {
                e.preventDefault();
                const newCompanyName = this.elements.company_name.value;
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/major-companies/${companyId}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ company_name: newCompanyName })
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    alert(result.message);
                    closeModal();
                    await loadMajorCompanies();
                } catch (error) { alert(`오류: ${error.message}`); }
            }
        });
    }

    async function handleDeleteCompany(companyId, companyName) {
        if (!confirm(`'${companyName}' 기업과 모든 관련 프로그램을 삭제하시겠습니까?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/major-companies/${companyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            selectedCompany = null;
            if(programListTitle) programListTitle.textContent = '대표 프로그램 목록';
            if(addProgramBtn) addProgramBtn.style.display = 'none';
            if(programsTableBody) programsTableBody.innerHTML = `<tr><td colspan="4" style="text-align:center;">먼저 왼쪽에서 기업을 선택해주세요.</td></tr>`;
            await loadMajorCompanies();
        } catch (error) { alert(`오류: ${error.message}`); }
    }
    
    function handleAddProgram() {
        if (!selectedCompany) return;
        openModal({
            title: `'${selectedCompany.name}' 새 프로그램 추가`,
            formHtml: `
                <input type="hidden" name="company_id" value="${selectedCompany.id}">
                <label for="program_name">프로그램명</label>
                <input type="text" id="program_name" name="program_name" required>
                <label for="program_description">설명 (선택)</label>
                <textarea id="program_description" name="program_description" rows="4"></textarea>
                <label for="link_url">관련 링크 (선택)</label>
                <input type="text" id="link_url" name="link_url">
                <div class="modal-footer"><button type="submit" class="button-primary">추가</button></div>
            `,
            onSubmit: async function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const data = Object.fromEntries(formData.entries());
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/major-company-programs`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(data)
                    });
                    const result = await response.json();
                    if (!response.ok) throw new Error(result.message);
                    alert(result.message);
                    closeModal();
                    await loadCompanyPrograms(selectedCompany.id);
                } catch (error) { alert(`오류: ${error.message}`); }
            }
        });
    }

    async function handleEditProgram(programId) {
        if(!selectedCompany) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/major-company-programs/${selectedCompany.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!result.success) throw new Error('프로그램 정보 로딩 실패');
            const program = result.programs.find(p => p.id === programId);
            if (!program) throw new Error('프로그램을 찾을 수 없습니다.');
            
            openModal({
                title: `프로그램 수정`,
                formHtml: `
                    <label for="program_name">프로그램명</label>
                    <input type="text" id="program_name" name="program_name" value="${program.program_name}" required>
                    <label for="program_description">설명 (선택)</label>
                    <textarea id="program_description" name="program_description" rows="4">${program.program_description || ''}</textarea>
                    <label for="link_url">관련 링크 (선택)</label>
                    <input type="text" id="link_url" name="link_url" value="${program.link_url || ''}">
                    <div class="modal-footer"><button type="submit" class="button-primary">수정</button></div>
                `,
                onSubmit: async function(e) {
                    e.preventDefault();
                    const formData = new FormData(this);
                    const data = Object.fromEntries(formData.entries());
                    try {
                        const response = await fetch(`${API_BASE_URL}/admin/major-company-programs/${programId}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify(data)
                        });
                        const result = await response.json();
                        if (!response.ok) throw new Error(result.message);
                        alert(result.message);
                        closeModal();
                        await loadCompanyPrograms(selectedCompany.id);
                    } catch (error) { alert(`오류: ${error.message}`); }
                }
            });
        } catch (error) { alert(`오류: ${error.message}`); }
    }

    async function handleDeleteProgram(programId) {
        if (!confirm(`이 프로그램을 삭제하시겠습니까?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/major-company-programs/${programId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            if(selectedCompany) await loadCompanyPrograms(selectedCompany.id);
        } catch (error) { alert(`오류: ${error.message}`); }
    }

    // --- 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if(addCompanyBtn) addCompanyBtn.addEventListener('click', handleAddCompany);
        if(addProgramBtn) addProgramBtn.addEventListener('click', handleAddProgram);
        if(closeButton) closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        if(companyListUl) {
            companyListUl.addEventListener('click', e => {
                const li = e.target.closest('li');
                const editBtn = e.target.closest('.edit-company-btn');
                const deleteBtn = e.target.closest('.delete-company-btn');

                if (editBtn) {
                    const companyId = li?.dataset.companyId;
                    const companyName = li?.dataset.companyName;
                    if(companyId && companyName) handleEditCompany(parseInt(companyId), companyName);
                    return;
                }
                if (deleteBtn) {
                    const companyId = li?.dataset.companyId;
                    const companyName = li?.dataset.companyName;
                    if(companyId && companyName) handleDeleteCompany(parseInt(companyId), companyName);
                    return;
                }
                if (li && li.dataset.companyId) {
                    const companyId = parseInt(li.dataset.companyId);
                    const companyName = li.dataset.companyName;
                    selectedCompany = { id: companyId, name: companyName };
                    renderCompanyList();
                    if(programListTitle) programListTitle.textContent = `${companyName} - 대표 프로그램`;
                    if(addProgramBtn) addProgramBtn.style.display = 'inline-block';
                    loadCompanyPrograms(companyId);
                }
            });
        }

        if(programsTableBody) {
            programsTableBody.addEventListener('click', e => {
                const editBtn = e.target.closest('.edit-program-btn');
                const deleteBtn = e.target.closest('.delete-program-btn');
                if (editBtn) {
                    handleEditProgram(parseInt(editBtn.dataset.programId));
                }
                if (deleteBtn) {
                    handleDeleteProgram(parseInt(deleteBtn.dataset.programId));
                }
            });
        }
    }
    
    initializePage();
});