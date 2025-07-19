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
    let allUserScoresCache = {}; // ★★★ 사용자의 전체 점수를 저장할 변수

    // --- 2. 초기화: 프로그램 목록과 "전체 질문 목록" 불러오기 ---
    try {
        const [programsRes, questionsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/admin/my-programs`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/admin/survey-questions/all`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        const programsResult = await programsRes.json();
        if (programsResult.success) {
            programsResult.programs.forEach(p => programSelect.innerHTML += `<option value="${p.id}">${p.title}</option>`);
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
            result.applications.forEach(app => applicationSelect.innerHTML += `<option value="${app.id}">${app.company_name}</option>`);
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
                const linked_question_codes = Array.from(card.querySelectorAll('.linked-question-code')).map(select => select.value).filter(Boolean);
                const milestone = {
                    id: card.dataset.id,
                    milestone_name: card.querySelector('.milestone-name').value,
                    score_value: parseInt(card.querySelector('.milestone-score').value, 10) || 0,
                    linked_question_codes: linked_question_codes,
                    content: card.querySelector('.milestone-content').value,
                    display_order: parseInt(card.querySelector('.milestone-order').value, 10) || 0,
                    attachment_url: card.querySelector('a')?.href || null
                };
                const fileInput = card.querySelector('.milestone-attachment');
                if (fileInput.files[0]) {
                    const placeholder = `file_${fileCounter++}`;
                    formData.append(placeholder, fileInput.files[0]);
                    milestone.filePlaceholder = placeholder;
                }
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
    
    // [이벤트] 5. 마일스톤 카드 내부의 동적 이벤트 처리
    milestoneList.addEventListener('click', (e) => {
        const card = e.target.closest('.milestone-card');
        if (!card) return;
        if (e.target.classList.contains('add-question-link-btn')) {
            card.querySelector('.linked-questions-container').appendChild(createQuestionLinkRow());
        }
        if (e.target.classList.contains('remove-question-link-btn')) {
            e.target.closest('.linked-question-row').remove();
        }
        if (e.target.classList.contains('remove-milestone-btn')) {
            card.remove();
        }
    });

    // ★★★ [신규] 연동 질문 선택 시, 현재 점수 실시간 업데이트 ★★★
    milestoneList.addEventListener('change', (e) => {
        if (e.target.classList.contains('linked-question-code')) {
            const selectedCode = e.target.value;
            const scoreContainer = e.target.nextElementSibling; // 바로 옆의 score-container
            const score = allUserScoresCache[selectedCode];
            
            if (score !== undefined) {
                scoreContainer.innerHTML = `<span class="current-score-display"> (현재 점수: <strong>${score}</strong>)</span>`;
            } else {
                scoreContainer.innerHTML = `<span class="current-score-display"> (점수 없음)</span>`;
            }
        }
    });

    // --- 4. 동적 UI 및 데이터 로딩 함수 ---
    
    async function loadMilestones(applicationId) {
        const res = await fetch(`${API_BASE_URL}/admin/applications/${applicationId}/milestones`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await res.json();
        milestoneList.innerHTML = '';
        if (result.success) {
            allUserScoresCache = result.allUserScores || {}; // ★★★ 사용자의 전체 점수 저장
            result.milestones.forEach(createMilestoneCard);
        }
    }

    function createMilestoneCard(milestone = {}) {
        const card = document.createElement('div');
        card.className = 'milestone-card';
        card.dataset.id = milestone.id || 'new';

        let linkedQuestionsHtml = '';
        if (milestone.linked_questions_with_scores && milestone.linked_questions_with_scores.length > 0) {
            milestone.linked_questions_with_scores.forEach(q => {
                linkedQuestionsHtml += createQuestionLinkRow(q.code, q.score);
            });
        } else {
            linkedQuestionsHtml = createQuestionLinkRow();
        }

        card.innerHTML = `
            <div class="milestone-header"><strong>마일스톤 상세 설정</strong><button type="button" class="button-danger button-sm remove-milestone-btn">삭제</button></div>
            <div class="form-group"><label>마일스톤 이름</label><input type="text" class="form-control milestone-name" value="${milestone.milestone_name || ''}"></div>
            <div class="form-group"><label>추가 개선 점수</label><input type="number" class="form-control milestone-score" value="${milestone.score_value || 0}"></div>
            <div class="form-group">
                <label>연동할 진단 문항 (여러 개 추가 가능)</label>
                <div class="linked-questions-container">${linkedQuestionsHtml}</div>
                <button type="button" class="button-secondary button-sm add-question-link-btn" style="margin-top: 5px;">+ 연동 질문 추가</button>
            </div>
            <div class="form-group"><label>상세 내용 (사용자에게 보임)</label><textarea class="form-control milestone-content" rows="3">${milestone.content || ''}</textarea></div>
            <div class="form-group"><label>파일 첨부</label><input type="file" class="form-control milestone-attachment">${milestone.attachment_url ? `<p>현재 파일: <a href="${milestone.attachment_url}" target="_blank">${milestone.attachment_url.split('/').pop()}</a></p>` : ''}</div>
            <div class="form-group"><label>표시 순서</label><input type="number" class="form-control milestone-order" value="${milestone.display_order || 0}"></div>
        `;
        milestoneList.appendChild(card);
    }

    function createQuestionLinkRow(selectedCode = '', score = null) {
        const row = document.createElement('div');
        row.className = 'linked-question-row form-group-inline';
        const optionsHtml = allQuestionsCache.map(q => `<option value="${q.question_code}" ${selectedCode === q.question_code ? 'selected' : ''}>${q.question_code}: ${q.question_text}</option>`).join('');
        const scoreHtml = score !== null && score !== 'N/A' ? `<span class="current-score-display"> (현재 점수: <strong>${score}</strong>)</span>` : '';
        row.innerHTML = `<select class="form-control linked-question-code"><option value="">-- 문항 선택 --</option>${optionsHtml}</select><span class="score-container">${scoreHtml}</span><button type="button" class="button-danger button-sm remove-question-link-btn">X</button>`;
        return row;
    }
});
