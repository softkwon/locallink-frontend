// js/admin_question_create.js (최종 완성본)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', async function() {
    
    // --- 1. 권한 확인 ---
    // auth.js, admin_common.js가 먼저 로드되어 checkAdminPermission 함수를 사용할 수 있다고 가정합니다.
    const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
    if (!hasPermission) return;

    // --- 2. 페이지 요소 및 변수 초기화 ---
    const form = document.getElementById('createQuestionForm');
    const token = localStorage.getItem('locallink-token');
    const optionsContainer = document.getElementById('options-container');
    const addOptionBtn = document.getElementById('add-option-btn');
    const nextDefaultSelect = document.getElementById('next_question_default');
    const nextYesSelect = document.getElementById('next_question_if_yes');
    const nextNoSelect = document.getElementById('next_question_if_no');
    const benchmarkMetricSelect = document.getElementById('benchmark_metric');

    // --- 3. 기능 함수 정의 ---

    // 드롭다운 메뉴들을 채우는 함수
    async function populateDropdowns() {
        try {
            const [allQuestionsRes, metricsRes] = await Promise.all([
                fetch('${API_BASE_URL}/admin/questions', { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch('${API_BASE_URL}/admin/average-metrics', { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            const allQuestionsResult = await allQuestionsRes.json();
            const metricsResult = await metricsRes.json();

            if (allQuestionsResult.success) {
                const questions = allQuestionsResult.questions.sort((a, b) => a.display_order - b.display_order);
                [nextDefaultSelect, nextYesSelect, nextNoSelect].forEach(select => {
                    if (select) {
                        select.innerHTML = '<option value="">-- 다음 질문 없음 --</option>';
                        select.innerHTML += '<option value="END_SURVEY">-- 설문 종료 (END_SURVEY) --</option>';
                        questions.forEach(q => {
                            select.innerHTML += `<option value="${q.question_code}">[${q.question_code}] ${q.question_text.substring(0, 30)}...</option>`;
                        });
                    }
                });
            }

            if (metricsResult.success) {
                if (benchmarkMetricSelect) {
                    benchmarkMetricSelect.innerHTML = '<option value="">-- 벤치마크 지표 없음 --</option>';
                    metricsResult.metrics.forEach(metric => {
                        benchmarkMetricSelect.innerHTML += `<option value="${metric}">${metric}</option>`;
                    });
                }
            }
        } catch (error) {
            console.error("드롭다운 목록을 불러오는 중 오류 발생:", error);
        }
    }
    
    // '보기 추가' 버튼 클릭 이벤트
    addOptionBtn.addEventListener('click', () => {
        const newItem = document.createElement('div');
        newItem.className = 'option-item';
        newItem.style.cssText = 'display: flex; gap: 10px; margin-bottom: 10px;';
        newItem.innerHTML = `
            <input type="text" class="form-control option-text" placeholder="표시될 텍스트">
            <input type="text" class="form-control option-value" placeholder="저장될 값">
            <button type="button" class="button-danger button-sm remove-option-btn" style="flex-shrink: 0;">삭제</button>
        `;
        optionsContainer.appendChild(newItem);
    });

    // '삭제' 버튼 클릭 이벤트 (이벤트 위임)
    optionsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-option-btn')) {
            e.target.closest('.option-item').remove();
        }
    });

    // 폼 제출 이벤트 리스너
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const optionsArray = [];
        const optionItems = optionsContainer.querySelectorAll('.option-item');
        optionItems.forEach(item => {
            const text = item.querySelector('.option-text').value;
            const value = item.querySelector('.option-value').value;
            if (text && value) {
                optionsArray.push({ text, value });
            }
        });
        
        const newQuestionData = {
            question_code: document.getElementById('question_code').value,
            display_order: parseInt(document.getElementById('display_order').value),
            esg_category: document.getElementById('esg_category').value,
            diagnosis_type: document.getElementById('diagnosis_type').value, // ★★★ 이 줄 추가 ★★★
            question_text: document.getElementById('question_text').value,
            explanation: document.getElementById('explanation').value,
            question_type: document.getElementById('question_type').value,
            options: optionsArray,
            benchmark_metric: benchmarkMetricSelect.value || null,
            scoring_method: document.getElementById('scoring_method').value,
            next_question_default: nextDefaultSelect.value || null,
            next_question_if_yes: nextYesSelect.value || null,
            next_question_if_no: nextNoSelect.value || null
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/admin/questions`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newQuestionData)
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                window.location.href = 'admin_question_list.html';
            }
        } catch(err) {
            alert('질문 생성 중 오류가 발생했습니다.');
        }
    });

    // --- 4. 페이지 초기화 실행 ---
    populateDropdowns();
});