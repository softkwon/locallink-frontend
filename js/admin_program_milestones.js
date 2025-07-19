import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('locallink-token');
    if (!await checkAdminPermission(['super_admin', 'vice_super_admin', 'content_manager'])) return;

    const programSelect = document.getElementById('program-select');
    const milestonesContainer = document.getElementById('milestones-container');
    const milestoneList = document.getElementById('milestone-list');
    const selectedProgramTitle = document.getElementById('selected-program-title');
    const addMilestoneBtn = document.getElementById('add-milestone-btn');
    const saveMilestonesBtn = document.getElementById('save-milestones-btn');

    let currentProgramId = null;

    // 1. 프로그램 목록을 불러와 Select Box에 채우기
    try {
        const res = await fetch(`${API_BASE_URL}/admin/programs`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) {
            result.programs.forEach(p => {
                programSelect.innerHTML += `<option value="${p.id}">${p.title}</option>`;
            });
        }
    } catch (e) { console.error("프로그램 목록 로딩 실패:", e); }

    // 2. 프로그램 선택 시, 해당 프로그램의 마일스톤 불러오기
    programSelect.addEventListener('change', async (e) => {
        currentProgramId = e.target.value;
        if (!currentProgramId) {
            milestonesContainer.classList.add('hidden');
            return;
        }
        selectedProgramTitle.textContent = e.target.options[e.target.selectedIndex].text;
        
        const res = await fetch(`${API_BASE_URL}/admin/programs/${currentProgramId}/milestones`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        
        milestoneList.innerHTML = '';
        if (result.success) {
            result.milestones.forEach(createMilestoneRow);
        }
        milestonesContainer.classList.remove('hidden');
    });

    // 3. '새 마일스톤 추가' 버튼 클릭 이벤트
    addMilestoneBtn.addEventListener('click', () => createMilestoneRow());

    // 4. '저장' 버튼 기능은 아직 구현하지 않음 (다음 단계에서 진행)
    saveMilestonesBtn.addEventListener('click', () => alert('저장 기능은 다음 단계에서 구현됩니다.'));

    // 마일스톤 한 줄(row)을 만드는 함수
    function createMilestoneRow(milestone = {}) {
        const div = document.createElement('div');
        div.className = 'milestone-item';
        div.dataset.id = milestone.id || 'new'; // 새 항목은 'new'
        div.innerHTML = `
            <input type="text" class="form-control milestone-name" placeholder="마일스톤 이름" value="${milestone.milestone_name || ''}">
            <input type="number" class="form-control milestone-score" placeholder="개선 점수" value="${milestone.score_value || 0}">
            <input type="number" class="form-control milestone-order" placeholder="순서" value="${milestone.display_order || 0}">
            <button type="button" class="button-danger button-sm remove-milestone-btn">삭제</button>
        `;
        milestoneList.appendChild(div);
    }
    
    // 삭제 버튼 이벤트
    milestoneList.addEventListener('click', (e) => {
        if(e.target.classList.contains('remove-milestone-btn')){
            e.target.closest('.milestone-item').remove();
        }
    });
});