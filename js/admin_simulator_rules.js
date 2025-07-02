// js/admin_simulator_rules.js (2025-06-27 16:10:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('locallink-token');

    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin']);
        if (!hasPermission) return;
        await loadAndRenderParameters();
        attachEventListeners();
    }

    async function loadAndRenderParameters() {
        const loadingEl = document.getElementById('loadingMessage');
        const container = document.getElementById('rulesContainer');
        const saveBtn = document.getElementById('saveAllBtn');
        
        try {
            const response = await fetch('${API_BASE_URL}/admin/simulator-parameters', { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            
            if (result.success) {
                container.innerHTML = '';
                const groupedByCategory = result.parameters.reduce((acc, p) => {
                    acc[p.category] = acc[p.category] || [];
                    acc[p.category].push(p);
                    return acc;
                }, {});

                for (const category in groupedByCategory) {
                    let tableRows = '';
                    groupedByCategory[category].forEach(param => {
                        const readonlyClass = !param.is_editable ? 'readonly-input' : '';
                        const readonlyAttr = !param.is_editable ? 'readonly' : '';

                        // ★★★ value 속성에 DB에서 가져온 값을 정확히 넣어줍니다. ★★★
                        tableRows += `
                            <tr data-id="${param.id}" data-editable="${param.is_editable}">
                                <td>${param.name}</td>
                                <td><textarea class="form-control ${readonlyClass}" data-key="description" ${readonlyAttr}>${param.description || ''}</textarea></td>
                                <td><textarea class="form-control ${readonlyClass}" data-key="formula" ${readonlyAttr}>${param.formula || ''}</textarea></td>
                                <td>
                                    <input type="number" class="form-control ${readonlyClass}" value="${param.parameter_value || ''}" data-key="value" ${readonlyAttr} step="0.01"> 
                                    ${param.unit || ''}
                                </td>
                            </tr>`;
                    });
                    container.innerHTML += `
                        <div class="category-group">
                            <h3 class="category-title">${category}</h3>
                            <table class="styled-table">
                                <thead><tr><th style="width: 20%;">항목명</th><th>비고/설명</th><th>산출 공식</th><th style="width: 15%;">변수 값</th></tr></thead>
                                <tbody>${tableRows}</tbody>
                            </table>
                        </div>`;
                }
            } else { throw new Error(result.message); }
        } catch (error) {
            if(loadingEl) loadingEl.textContent = `오류: ${error.message}`;
        }
        if(loadingEl) loadingEl.style.display = 'none';
        if(saveBtn) saveBtn.classList.remove('hidden');
    }

    function attachEventListeners() {
        const saveAllBtn = document.getElementById('saveAllBtn');
        if (saveAllBtn) {
            saveAllBtn.addEventListener('click', async () => {
                if (!confirm('모든 수정사항을 저장하시겠습니까?')) return;
                
                saveAllBtn.disabled = true;
                saveAllBtn.textContent = '저장 중...';

                const rows = document.querySelectorAll('#rulesContainer tbody tr[data-editable="true"]');
                const updatePromises = [];
                
                rows.forEach(row => {
                    const id = row.dataset.id;
                    const updatedData = {
                        description: row.querySelector('[data-key="description"]').value,
                        formula: row.querySelector('[data-key="formula"]').value,
                        parameter_value: row.querySelector('[data-key="value"]').value,
                    };
                    const promise = fetch(`${API_BASE_URL}/admin/simulator-parameters/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(updatedData)
                    }).then(response => {
                        if (!response.ok) {
                            return response.json().then(err => Promise.reject(err));
                        }
                        return response.json();
                    });
                    updatePromises.push(promise);
                });

                try {
                    await Promise.all(updatePromises);
                    alert('모든 변경사항이 성공적으로 저장되었습니다.');
                } catch (error) {
                    alert(`저장 중 오류가 발생했습니다: ${error.message || '서버 응답 오류'}`);
                } finally {
                    saveAllBtn.disabled = false;
                    saveAllBtn.textContent = '모든 변경사항 저장';
                    loadAndRenderParameters();
                }
            });
        }
    }

    initializePage();
});