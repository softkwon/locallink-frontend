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
    let allQuestionsCache = [];

    // --- 2. 초기화: 내가 만든 프로그램 목록과 "전체 질문 목록" 불러오기 ---
    try {
        const [programsRes, questionsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/my-programs`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/admin/survey-questions/all`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        
        const programsResult = await programsRes.json();
        if (programsResult.success) {
            programsResult.programs.forEach(p => {
                programSelect.innerHTML += `<option value="${p.id}">${p.title}</option>`;
            });
        }

        const questionsResult = await questionsRes.json();
        if (questionsResult.success) {
            allQuestionsCache = questionsResult.questions;
        }

    } catch (e) { console.error("초기 데이터 로딩 실패:", e); }

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
        await loadMilestones(currentApplicationId);
        milestonesEditor.classList.remove('hidden');
    });

    // [이벤트] 3. '새 마일스톤 추가' 버튼 클릭
    addMilestoneBtn.addEventListener('click', () => createMilestoneCard());

    // [이벤트] 4. '모든 변경사항 저장' 버튼 클릭
    saveAllBtn.addEventListener('click', async () => {
        if (!currentApplicationId) return;
        saveAllBtn.disabled = true;
        saveAllBtn.textContent = '저장 중...';

        try {
            const formData = new FormData();
            const milestonesData = [];
            let fileCounter = 0;

            document.querySelectorAll('#milestone-list .milestone-card').forEach(card => {
                const milestone = {
                    id: card.dataset.id,
                    milestone_name: card.querySelector('.milestone-name').value,
                    score_value: parseInt(card.querySelector('.milestone-score').value, 10) || 0,
                    improvement_category: card.querySelector('.improvement-category').value,
                    content: card.querySelector('.milestone-content').value,
                    display_order: parseInt(card.querySelector('.milestone-order').value, 10) || 0,
                    // 기존 파일 URL도 함께 전송
                    image_url: card.querySelector('a[href*="'+ (card.querySelector('.milestone-image')?.nextElementSibling?.querySelector('a')?.href || 'none') +'"]')?.href || null,
                    attachment_url: card.querySelector('a[href*="'+ (card.querySelector('.milestone-attachment')?.nextElementSibling?.querySelector('a')?.href || 'none') +'"]')?.href || null
                };

                // 👇 1. 이미지 파일 처리
                const imageInput = card.querySelector('.milestone-image');
                if (imageInput.files[0]) {
                    const imagePlaceholder = `image_${fileCounter}`;
                    formData.append(imagePlaceholder, imageInput.files[0]);
                    milestone.imagePlaceholder = imagePlaceholder;
                }

                // 👇 2. 첨부 문서 파일 처리
                const attachmentInput = card.querySelector('.milestone-attachment');
                if (attachmentInput.files[0]) {
                    const attachmentPlaceholder = `attachment_${fileCounter}`;
                    formData.append(attachmentPlaceholder, attachmentInput.files[0]);
                    milestone.attachmentPlaceholder = attachmentPlaceholder;
                }
                
                fileCounter++;
                milestonesData.push(milestone);
            });

            formData.append('milestonesData', JSON.stringify(milestonesData));

            const res = await fetch(`${API_BASE_URL}/admin/applications/${currentApplicationId}/milestones/batch-update`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            const result = await res.json();
            if (!res.ok) throw new Error(result.message);
            alert(result.message);
            await loadMilestones(currentApplicationId);

        } catch (error) {
            alert(`저장 실패: ${error.message}`);
        } finally {
            saveAllBtn.disabled = false;
            saveAllBtn.textContent = '모든 변경사항 저장';
        }
    });
    
    // [이벤트] 5. 개별 마일스톤 삭제 버튼
    milestoneList.addEventListener('click', (e) => {
        if(e.target.classList.contains('remove-milestone-btn')) {
            if(confirm('이 마일스톤을 삭제하시겠습니까?')) {
                e.target.closest('.milestone-card').remove();
            }
        }
    });

    // --- 4. 동적 UI 및 데이터 로딩 함수 ---
    
    async function loadMilestones(applicationId) {
        const res = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}/milestones`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        milestoneList.innerHTML = '';
        if (result.success) {
            result.milestones.forEach(createMilestoneCard);
        }
    }

    function createMilestoneCard(milestone = {}) {
        const card = document.createElement('div');
        card.className = 'milestone-card';
        card.dataset.id = milestone.id || 'new';

        // [수정] '이미지 첨부'와 '파일 첨부' UI를 추가하고 순서를 정리합니다.
        card.innerHTML = `
            <div class="milestone-header">
                <strong>마일스톤 상세 설정</strong>
                <button type="button" class="button-danger button-sm remove-milestone-btn">삭제</button>
            </div>
            <div class="form-group">
                <label>마일스톤 이름</label>
                <input type="text" class="form-control milestone-name" value="${milestone.milestone_name || ''}">
            </div>
            <div class="form-group-inline">
                <div class="form-group">
                    <label>개선 항목</label>
                    <select class="form-control improvement-category">
                        <option value="">-- 선택 --</option>
                        <option value="E" ${milestone.improvement_category === 'E' ? 'selected' : ''}>환경(E)</option>
                        <option value="S" ${milestone.improvement_category === 'S' ? 'selected' : ''}>사회(S)</option>
                        <option value="G" ${milestone.improvement_category === 'G' ? 'selected' : ''}>지배구조(G)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>개선 점수</label>
                    <input type="number" class="form-control milestone-score" value="${milestone.score_value || 0}">
                </div>
            </div>

            <div class="form-group">
                <label>이미지 첨부 (사용자에게 보일 대표 이미지)</label>
                <input type="file" class="form-control milestone-image" accept="image/*">
                ${milestone.image_url ? `<p>현재 이미지: <a href="${milestone.image_url}" target="_blank">${milestone.image_url.split('/').pop()}</a></p>` : ''}
            </div>

            <div class="form-group">
                <label>상세 내용 (사용자에게 보임)</label>
                <textarea class="form-control milestone-content" rows="3">${milestone.content || ''}</textarea>
            </div>

            <div class="form-group">
                <label>문서 첨부 (다운로드용 파일)</label>
                <input type="file" class="form-control milestone-attachment">
                ${milestone.attachment_url ? `<p>현재 파일: <a href="${milestone.attachment_url}" target="_blank">${milestone.attachment_url.split('/').pop()}</a></p>` : ''}
            </div>
            <div class="form-group">
                <label>표시 순서</label>
                <input type="number" class="form-control milestone-order" value="${milestone.display_order || 0}">
            </div>
        `;
        milestoneList.appendChild(card);
    }
});
