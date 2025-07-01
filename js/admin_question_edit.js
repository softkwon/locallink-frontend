// js/admin_question_edit.js
document.addEventListener('DOMContentLoaded', async function() {
    
    // --- 1. 페이지 요소 및 변수 초기화 ---
    const form = document.getElementById('editQuestionForm');
    const loadingEl = document.getElementById('loadingMessage');
    const token = localStorage.getItem('locallink-token');
    
    const urlParams = new URLSearchParams(window.location.search);
    const questionId = urlParams.get('id');

    const optionsContainer = document.getElementById('options-container');
    const addOptionBtn = document.getElementById('add-option-btn');
    const nextDefaultSelect = document.getElementById('next_question_default');
    const nextYesSelect = document.getElementById('next_question_if_yes');
    const nextNoSelect = document.getElementById('next_question_if_no');
    const benchmarkMetricSelect = document.getElementById('benchmark_metric');

    // --- 2. 페이지 초기화 함수 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;

        if (!questionId) {
            loadingEl.textContent = '잘못된 접근입니다. 질문 ID가 없습니다.';
            return;
        }

        try {
            // 수정할 질문 정보, 전체 질문 목록, 벤치마크 지표 목록을 동시에 가져옵니다.
            const [questionRes, allQuestionsRes, metricsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/questions/${questionId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/admin/questions`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/admin/average-metrics`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!questionRes.ok || !allQuestionsRes.ok || !metricsRes.ok) throw new Error('데이터를 불러오지 못했습니다.');

            const questionResult = await questionRes.json();
            const allQuestionsResult = await allQuestionsRes.json();
            const metricsResult = await metricsRes.json();

            if (questionResult.success && allQuestionsResult.success && metricsResult.success) {
                populateNextQuestionDropdowns(allQuestionsResult.questions);
                populateBenchmarkMetricDropdown(metricsResult.metrics);
                populateForm(questionResult.question);

                loadingEl.style.display = 'none';
                form.classList.remove('hidden');
            } else {
                throw new Error(questionResult.message || allQuestionsResult.message);
            }
        } catch (error) {
            loadingEl.textContent = `오류: ${error.message}`;
        }
    }

    // --- 3. 기능 함수 정의 ---

    // '다음 질문' 드롭다운 메뉴들을 채우는 함수
    function populateNextQuestionDropdowns(questions) {
        const sortedQuestions = questions.sort((a, b) => a.display_order - b.display_order);
        [nextDefaultSelect, nextYesSelect, nextNoSelect].forEach(select => {
            if (select) {
                select.innerHTML = '<option value="">-- 다음 질문 없음 --</option>';
                select.innerHTML += '<option value="END_SURVEY">-- 설문 종료 (END_SURVEY) --</option>';
                sortedQuestions.forEach(q => {
                    select.innerHTML += `<option value="${q.question_code}">[${q.question_code}] ${q.question_text.substring(0, 30)}...</option>`;
                });
            }
        });
    }

    // '벤치마크 지표' 드롭다운 메뉴를 채우는 함수
    function populateBenchmarkMetricDropdown(metrics) {
        if (!benchmarkMetricSelect) return;
        benchmarkMetricSelect.innerHTML = '<option value="">-- 벤치마크 지표 없음 --</option>';
        metrics.forEach(metric => {
            benchmarkMetricSelect.innerHTML += `<option value="${metric}">${metric}</option>`;
        });
    }

    // 보기 입력 행을 하나 추가하는 함수
    function addOptionRow(text = '', value = '') {
        const newItem = document.createElement('div');
        newItem.className = 'option-item';
        newItem.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
        newItem.innerHTML = `
            <input type="text" class="form-control option-text" placeholder="표시될 텍스트" value="${text}">
            <input type="text" class="form-control option-value" placeholder="저장될 값" value="${value}">
            <button type="button" class="button-danger button-sm remove-option-btn" style="flex-shrink: 0;">삭제</button>
        `;
        optionsContainer.appendChild(newItem);
    }
    
    // 폼에 기존 데이터를 채우는 함수
    function populateForm(question) {
        document.getElementById('question_code').value = question.question_code;
        document.getElementById('display_order').value = question.display_order;
        document.getElementById('esg_category').value = question.esg_category;
        document.getElementById('diagnosis_type').value = question.diagnosis_type; // ★★★ 이 줄 추가 ★★★
        document.getElementById('question_text').value = question.question_text;
        document.getElementById('explanation').value = question.explanation || '';
        document.getElementById('question_type').value = question.question_type;
        document.getElementById('benchmark_metric').value = question.benchmark_metric || "";
        document.getElementById('scoring_method').value = question.scoring_method || 'direct_score'; // 이 줄 추가

        const scoringMethodSelect = document.getElementById('scoring_method');
        if (question.benchmark_metric) {
            scoringMethodSelect.value = 'benchmark_comparison';
        } else {
            scoringMethodSelect.value = 'direct_score';
        }

        optionsContainer.innerHTML = '';
        if (question.options && question.options.length > 0) {
            question.options.forEach(opt => addOptionRow(opt.text, opt.value));
        }

        nextDefaultSelect.value = question.next_question_default || "";
        nextYesSelect.value = question.next_question_if_yes || "";
        nextNoSelect.value = question.next_question_if_no || "";
    }

    // --- 4. 이벤트 리스너 연결 ---

    // '보기 추가' 버튼
    addOptionBtn.addEventListener('click', () => addOptionRow());

    // '보기 삭제' 버튼 (이벤트 위임)
    optionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-option-btn')) {
            e.target.closest('.option-item').remove();
        }
    });

    // '저장하기' 폼 제출
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const optionsArray = [];
        optionsContainer.querySelectorAll('.option-item').forEach(item => {
            const text = item.querySelector('.option-text').value;
            const value = item.querySelector('.option-value').value;
            if (text && value) {
                optionsArray.push({ text, value });
            }
        });
        
        const updatedData = {
            display_order: parseInt(document.getElementById('display_order').value),
            question_text: document.getElementById('question_text').value,
            esg_category: document.getElementById('esg_category').value,
            diagnosis_type: document.getElementById('diagnosis_type').value, // ★★★ 이 줄 추가 ★★★
            explanation: document.getElementById('explanation').value,
            question_type: document.getElementById('question_type').value,
            options: optionsArray,
            benchmark_metric: document.getElementById('benchmark_metric').value || null,
            scoring_method: document.getElementById('scoring_method').value,
            next_question_default: nextDefaultSelect.value || null,
            next_question_if_yes: nextYesSelect.value || null,
            next_question_if_no: nextNoSelect.value || null
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/questions/${questionId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(updatedData)
            });
            const result = await response.json();
            alert(result.message);
            if(result.success) {
                window.location.href = 'admin_question_list.html';
            }
        } catch(err) {
            alert('수정 중 오류가 발생했습니다.');
        }
    });

    // --- 5. 페이지 시작 ---
    initializePage();
});