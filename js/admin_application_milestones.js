import { API_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', async () => {
    // --- 1. 기본 요소 및 변수 설정 ---
    const token = localStorage.getItem('locallink-token');
    if (!await checkAdminPermission(['super_admin', 'vice_super_admin', 'content_manager'])) return;

    const programSelect = document.getElementById('program-select');
    const applicationSelectContainer = document.getElementById('application-select-container');
    const applicationSelect = document.getElementById('application-select');
    const milestonesEditor = document.getElementById('milestones-editor');
    const editorTitle = document.getElementById('editor-title');
    const milestoneList = document.getElementById('milestone-list');
    const addMilestoneBtn = document.getElementById('add-milestone-btn');
    const saveAllBtn = document.getElementById('save-all-btn');

    let currentApplicationId = null;

    // --- 2. 초기화: 내가 만든 프로그램 목록 불러오기 ---
    try {
        const res = await fetch(`${API_BASE_URL}/admin/my-programs`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) {
            result.programs.forEach(p => {
                programSelect.innerHTML += `<option value="${p.id}">${p.title}</option>`;
            });
        }
    } catch (e) { console.error("프로그램 목록 로딩 실패:", e); }

    // --- 3. 이벤트 리스너 설정 ---

    // [이벤트] 1. 프로그램을 선택했을 때
    programSelect.addEventListener('change', async (e) => {
        const programId = e.target.value;
        applicationSelect.innerHTML = '<option value="">-- 이 프로그램을 신청한 사용자를 선택하세요 --</option>';
        milestonesEditor.classList.add('hidden');
        if (!programId) {
            applicationSelectContainer.classList.add('hidden');
            return;
        }
        const res = await fetch(`${API_BASE_URL}/admin/programs/${programId}/applications`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        if (result.success) {
            result.applications.forEach(app => {
                applicationSelect.innerHTML += `<option value="${app.id}">${app.company_name}</option>`;
            });
            applicationSelectContainer.classList.remove('hidden');
        }
    });

    // [이벤트] 2. 사용자를 선택했을 때
    applicationSelect.addEventListener('change', async (e) => {
        currentApplicationId = e.target.value;
        if (!currentApplicationId) {
            milestonesEditor.classList.add('hidden');
            return;
        }
        const programName = programSelect.options[programSelect.selectedIndex].text;
        const userName = e.target.options[e.target.selectedIndex].text;
        editorTitle.textContent = `[${userName}]님의 [${programName}] 프로그램 마일스톤`;
        await loadMilestones(currentApplicationId); // 마일스톤 로딩 함수 호출
        milestonesEditor.classList.remove('hidden');
    });

    // [이벤트] 3. '새 마일스톤 추가' 버튼 클릭
    addMilestoneBtn.addEventListener('click', () => createMilestoneCard());

    // ★★★ [이벤트] 4. '모든 변경사항 저장' 버튼 클릭 (핵심 기능) ★★★
    saveAllBtn.addEventListener('click', async () => {
        if (!currentApplicationId) return;

        saveAllBtn.disabled = true;
        saveAllBtn.textContent = '저장 중...';

        try {
            const formData = new FormData();
            const milestonesData = [];
            let fileCounter = 0;

            // 화면의 모든 마일스톤 카드를 순회하며 데이터 수집
            document.querySelectorAll('#milestone-list .milestone-card').forEach(card => {
                const milestone = {
                    id: card.dataset.id,
                    milestone_name: card.querySelector('.milestone-name').value,
                    score_value: parseInt(card.querySelector('.milestone-score').value, 10) || 0,
                    linked_question_code: card.querySelector('.linked-question-code').value,
                    content: card.querySelector('.milestone-content').value,
                    display_order: parseInt(card.querySelector('.milestone-order').value, 10) || 0,
                    attachment_url: card.querySelector('a')?.href || null // 기존 파일 URL
                };

                // 새 첨부파일이 있는지 확인
                const fileInput = card.querySelector('.milestone-attachment');
                if (fileInput.files[0]) {
                    const placeholder = `file_${fileCounter++}`;
                    formData.append(placeholder, fileInput.files[0]);
                    milestone.filePlaceholder = placeholder; // 파일이 있다는 표시
                }
                milestonesData.push(milestone);
            });

            formData.append('milestonesData', JSON.stringify(milestonesData));

            // 백엔드 API 호출
            const res = await fetch(`${API_BASE_URL}/admin/applications/${currentApplicationId}/milestones/batch-update`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);

            alert(result.message);
            await loadMilestones(currentApplicationId); // 저장 후 목록 새로고침

        } catch (error) {
            alert(`저장 실패: ${error.message}`);
            console.error("마일스톤 저장 에러:", error);
        } finally {
            saveAllBtn.disabled = false;
            saveAllBtn.textContent = '모든 변경사항 저장';
        }
    });
    
    // [이벤트] 5. 개별 마일스톤 삭제 버튼 (UI에서만 제거)
    milestoneList.addEventListener('click', (e) => {
        if(e.target.classList.contains('remove-milestone-btn')) {
            e.target.closest('.milestone-card').remove();
        }
    });

    // --- 4. 동적 UI 및 데이터 로딩 함수 ---
    
    // 마일스톤 목록을 불러와 화면에 그리는 함수
    async function loadMilestones(applicationId) {
        const res = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}/milestones`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        milestoneList.innerHTML = '';
        if (result.success) {
            result.milestones.forEach(createMilestoneCard);
        }
    }

    // 마일스톤 카드 한 개를 만드는 함수
    function createMilestoneCard(milestone = {}) {
        const card = document.createElement('div');
        card.className = 'milestone-card';
        card.dataset.id = milestone.id || 'new';
        card.innerHTML = `
            <div class="milestone-header">
                <strong>마일스톤 상세 설정</strong>
                <button type="button" class="button-danger button-sm remove-milestone-btn">삭제</button>
            </div>
            <div class="form-group">
                <label>마일스톤 이름</label>
                <input type="text" class="form-control milestone-name" placeholder="예: 1차 개선 보고서 제출" value="${milestone.milestone_name || ''}">
            </div>
            <div class="form-group-inline">
                <div class="form-group">
                    <label>추가 개선 점수</label>
                    <input type="number" class="form-control milestone-score" value="${milestone.score_value || 0}">
                </div>
                <div class="form-group">
                    <label>연동할 진단 문항 (선택)</label>
                    <select class="form-control linked-question-code">
                        <option value="">-- 문항 선택 --</option>
                        ${Array.from({length: 16}, (_, i) => `<option value="S-Q${i+1}" ${milestone.linked_question_code === `S-Q${i+1}` ? 'selected' : ''}>S-Q${i+1}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="form-group">
                <label>상세 내용 (사용자에게 보임)</label>
                <textarea class="form-control milestone-content" rows="3" placeholder="사용자에게 안내할 내용을 입력하세요.">${milestone.content || ''}</textarea>
            </div>
            <div class="form-group">
                <label>파일 첨부</label>
                <input type="file" class="form-control milestone-attachment">
                ${milestone.attachment_url ? `<p>현재 파일: <a href="${milestone.attachment_url}" target="_blank" style="word-break:break-all;">${milestone.attachment_url.split('/').pop()}</a></p>` : ''}
            </div>
             <div class="form-group">
                <label>표시 순서</label>
                <input type="number" class="form-control milestone-order" value="${milestone.display_order || 0}">
            </div>
        `;
        milestoneList.appendChild(card);
    }
});
