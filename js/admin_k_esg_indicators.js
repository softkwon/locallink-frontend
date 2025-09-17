import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async function() {
    
    const token = localStorage.getItem('locallink-token');
    
    const tableBody = document.getElementById('indicators-table-body');
    const addBtn = document.getElementById('add-indicator-btn');
    const importBtn = document.getElementById('import-btn');
    const csvFileInput = document.getElementById('csvFile');
    const exportBtn = document.getElementById('export-btn');
    const modal = document.getElementById('form-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalForm = document.getElementById('modal-form');
    const closeButton = modal.querySelector('.close-button');

    let indicatorsCache = [];

    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin']);
        if (!hasPermission) {
            document.querySelector('.admin-section').innerHTML = '<h2>접근 권한이 없습니다.</h2>';
            return;
        }
        await loadIndicators();
        attachEventListeners();
    }

    async function loadIndicators() {
        try {
            const response = await fetch(`${API_BASE_URL}/admin/k-esg-indicators`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            indicatorsCache = result.indicators;
            renderTable();
        } catch (error) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">목록 로딩 실패: ${error.message}</td></tr>`;
        }
    }

    function renderTable() {
        tableBody.innerHTML = '';
        if (indicatorsCache.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="8" style="text-align:center;">등록된 지표가 없습니다.</td></tr>`;
            return;
        }
        indicatorsCache.forEach(ind => {
            const row = tableBody.insertRow();
            row.insertCell().textContent = ind.domain || '-';
            row.insertCell().textContent = ind.category || '-';
            row.insertCell().textContent = ind.indicator_code || '-';
            row.insertCell().textContent = ind.indicator_name || '-';
            const overviewCell = row.insertCell();
            overviewCell.textContent = ind.overview || '-';
            overviewCell.className = 'overview-col';
            overviewCell.title = ind.overview || '';
            row.insertCell().textContent = ind.weight || '-';
            row.insertCell().textContent = ind.max_score || '-';
            row.insertCell().innerHTML = `
                <button class="button-secondary button-sm edit-btn" data-id="${ind.id}">수정</button>
                <button class="button-danger button-sm delete-btn" data-id="${ind.id}">삭제</button>
            `;
        });
    }

    function openModal(indicator = null) {
        const isEdit = !!indicator;
        modalTitle.textContent = isEdit ? 'K-ESG 지표 수정' : '새 K-ESG 지표 추가';
        modalForm.innerHTML = `
            <input type="hidden" name="id" value="${isEdit ? indicator.id : ''}">
            
            <fieldset>
                <legend>기본 정보</legend>
                <div class="form-group-grid">
                    <div class="form-group">
                        <label for="domain">영역*</label>
                        <select id="domain" name="domain" required>
                            <option value="E" ${isEdit && indicator.domain === 'E' ? 'selected' : ''}>E (환경)</option>
                            <option value="S" ${isEdit && indicator.domain === 'S' ? 'selected' : ''}>S (사회)</option>
                            <option value="G" ${isEdit && indicator.domain === 'G' ? 'selected' : ''}>G (지배구조)</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="category">범주*</label>
                        <input type="text" id="category" name="category" value="${isEdit ? indicator.category || '' : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="indicator_code">지표 코드*</label>
                        <input type="text" id="indicator_code" name="indicator_code" value="${isEdit ? indicator.indicator_code || '' : ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="indicator_name">진단항목*</label>
                        <input type="text" id="indicator_name" name="indicator_name" value="${isEdit ? indicator.indicator_name || '' : ''}" required>
                    </div>
                </div>
            </fieldset>

            <fieldset>
                <legend>세부 내용</legend>
                <div class="form-group">
                    <label for="overview">개요</label>
                    <textarea id="overview" name="overview" rows="3">${isEdit ? indicator.overview || '' : ''}</textarea>
                </div>
                <div class="form-group-grid">
                    <div class="form-group">
                        <label for="objective">목표</label>
                        <input type="text" id="objective" name="objective" value="${isEdit ? indicator.objective || '' : ''}">
                    </div>
                    <div class="form-group">
                        <label for="detailed_objective">세부목표</label>
                        <input type="text" id="detailed_objective" name="detailed_objective" value="${isEdit ? indicator.detailed_objective || '' : ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label for="expected_result">결과</label>
                    <input type="text" id="expected_result" name="expected_result" value="${isEdit ? indicator.expected_result || '' : ''}">
                </div>
                <div class="form-group">
                    <label for="content">내용 (기존 설명)</label>
                    <textarea id="content" name="content" rows="3">${isEdit ? indicator.content || '' : ''}</textarea>
                </div>
            </fieldset>

            <fieldset>
                <legend>평가 정보</legend>
                <div class="form-group-grid">
                    <div class="form-group">
                        <label for="weight">가중치</label>
                        <input type="number" step="0.01" id="weight" name="weight" value="${isEdit && indicator.weight !== null ? indicator.weight : ''}">
                    </div>
                    <div class="form-group">
                        <label for="max_score">총배점</label>
                        <input type="number" step="0.01" id="max_score" name="max_score" value="${isEdit && indicator.max_score !== null ? indicator.max_score : ''}">
                    </div>
                </div>
                 <div class="form-group">
                    <label for="calculation_formula">계산식</label>
                    <input type="text" id="calculation_formula" name="calculation_formula" value="${isEdit ? indicator.calculation_formula || '' : ''}">
                </div>
                 <div class="form-group">
                    <label for="scope">범위</label>
                    <input type="text" id="scope" name="scope" value="${isEdit ? indicator.scope || '' : ''}">
                </div>
            </fieldset>
            
            <div class="modal-footer">
                <button type="submit" class="button-primary">${isEdit ? '수정' : '추가'}</button>
            </div>
        `;
        modalForm.onsubmit = isEdit ? handleEditSubmit : handleAddSubmit;
        modal.style.display = 'block';
    }

    function closeModal() {
        modal.style.display = 'none';
        modalForm.innerHTML = '';
        modalForm.onsubmit = null;
    }

    async function handleAddSubmit(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        console.log('Submitting data for new indicator:', data); // 디버깅용 로그
        try {
            const response = await fetch(`${API_BASE_URL}/admin/k-esg-indicators`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            closeModal();
            await loadIndicators();
        } catch (error) { alert(`오류: ${error.message}`); }
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        const data = Object.fromEntries(new FormData(e.target).entries());
        console.log('Submitting data for update:', data); // 디버깅용 로그
        try {
            const response = await fetch(`${API_BASE_URL}/admin/k-esg-indicators/${data.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(data)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            closeModal();
            await loadIndicators();
        } catch (error) { alert(`오류: ${error.message}`); }
    }
    
    async function handleDelete(indicatorId) {
        const indicator = indicatorsCache.find(i => i.id === indicatorId);
        if (!indicator || !confirm(`'${indicator.indicator_code}' 지표를 삭제하시겠습니까?`)) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/k-esg-indicators/${indicatorId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            await loadIndicators();
        } catch (error) { alert(`오류: ${error.message}`); }
    }
    
    async function handleImport(file) {
        const formData = new FormData();
        formData.append('csvFile', file);
        try {
            const response = await fetch(`${API_BASE_URL}/admin/k-esg-indicators/import`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            alert(result.message);
            await loadIndicators();
        } catch (error) { alert(`가져오기 실패: ${error.message}`); }
    }

    function attachEventListeners() {
        addBtn.addEventListener('click', () => openModal());
        closeButton.addEventListener('click', closeModal);
        window.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        tableBody.addEventListener('click', e => {
            if (e.target.classList.contains('edit-btn')) {
                const indicatorId = parseInt(e.target.dataset.id);
                const indicator = indicatorsCache.find(i => i.id === indicatorId);
                if(indicator) openModal(indicator);
            }
            if (e.target.classList.contains('delete-btn')) {
                const indicatorId = parseInt(e.target.dataset.id);
                handleDelete(indicatorId);
            }
        });

        importBtn.addEventListener('click', () => csvFileInput.click());
        csvFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) handleImport(file);
        });
        
        exportBtn.addEventListener('click', () => {
            fetch(`${API_BASE_URL}/admin/k-esg-indicators/export`, { headers: { 'Authorization': `Bearer ${token}` } })
                .then(res => {
                    if (!res.ok) throw new Error('다운로드 실패');
                    const disposition = res.headers.get('Content-Disposition');
                    const filenameMatch = disposition && disposition.match(/filename="(.+?)"/);
                    const filename = filenameMatch ? filenameMatch[1] : `k-esg-indicators-${new Date().toISOString().slice(0,10)}.csv`;
                    return Promise.all([res.blob(), filename]);
                })
                .then(([blob, filename]) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = filename;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                })
                .catch(err => alert(err.message));
        });
    }
    
    initializePage();
});