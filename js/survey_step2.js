// js/survey_step2.js (최종 완성본)
document.addEventListener('DOMContentLoaded', async function() {
    // --- 1. 페이지 변수 및 요소 초기화 ---
    const diagnosisId = sessionStorage.getItem('currentDiagnosisId') || new URLSearchParams(window.location.search).get('diagId');
    const token = localStorage.getItem('locallink-token');
    
    let allQuestions = [];
    let userAnswers = {};
    let questionHistory = [];
    let diagnosisData = null;
    let industryAverages = null;

    const elements = {
        loading: document.getElementById('loadingMessage'),
        container: document.getElementById('questionContainer'),
        navigation: document.getElementById('navigationContainer'),
        legend: document.getElementById('questionLegend'),
        text: document.getElementById('questionText'),
        explanation: document.getElementById('questionExplanation'),
        options: document.getElementById('optionsContainer'),
        averageInfo: document.getElementById('industryAverageInfo'),
        prevBtn: document.getElementById('prevQuestionBtn'),
        nextBtn: document.getElementById('nextQuestionBtn'),
        complete: document.getElementById('surveyCompleteMessage'),
        submitBtn: document.getElementById('submitSurveyBtn'),
        progressText: document.getElementById('progressText'),
        progressBar: document.getElementById('progressBar'),
        primaryIndustry: document.getElementById('primaryIndustryDisplay'),
        userAuthStatus: document.getElementById('userAuthStatus')
    };
    
    // --- 2. 로그인 및 진단 세션 확인 ---
    if (!token || !diagnosisId) {
        alert('잘못된 접근입니다. 1단계부터 다시 시작해주세요.');
        return window.location.href = 'survey_step1.html';
    }
    
    // --- 3. 핵심 기능 함수 정의 ---

    function renderHeader(userData) {
        if (!elements.userAuthStatus || !userData) return;
        elements.userAuthStatus.innerHTML = `
            <strong>${userData.company_name || '사용자'}님</strong> | 
            <a href="main_member_info.html">회원정보</a> | 
            <a href="#" id="logoutBtn">로그아웃</a>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('locallink-token');
                sessionStorage.clear();
                alert('로그아웃 되었습니다.');
                window.location.href = 'main_index.html';
            });
        }
    }

    async function renderQuestion(qIndex) {
        const question = allQuestions[qIndex];
        if (!question) return;

        const mainQuestionNumber = parseInt(question.question_code.match(/Q(\d+)/)[1]);
        elements.legend.textContent = `문항 ${mainQuestionNumber}`;
        elements.text.innerHTML = question.question_text || '(질문 내용이 없습니다)';
        elements.explanation.classList.remove('hidden');
        elements.explanation.innerHTML = question.explanation || '&nbsp;';
        elements.explanation.style.display = 'block';

        if (question.benchmark_metric) {
            elements.averageInfo.classList.remove('hidden');
            const metricKey = question.benchmark_metric;
            const avgValue = industryAverages ? industryAverages[metricKey] : null;
            if (avgValue !== null && avgValue !== undefined) {
                let unit = '';
                if (metricKey.includes('ratio')) unit = '%';
                else if (metricKey.includes('ghg')) unit = ' tCO₂eq';
                else if (metricKey.includes('energy')) unit = ' MWh';
                else if (metricKey.includes('waste')) unit = ' 톤';
                else if (metricKey.includes('years')) unit = ' 년';
                else if (metricKey.includes('meetings')) unit = ' 회';
                elements.averageInfo.textContent = `참고: 귀사 업종의 평균은 약 ${avgValue}${unit} 입니다.`;
            } else {
                elements.averageInfo.textContent = "참고: '산업평균치'를 기준으로 계산합니다.";
            }
        } else {
            elements.averageInfo.classList.add('hidden');
        }

        elements.options.innerHTML = '';
        const savedAnswer = userAnswers[question.question_code];
        if (question.question_type === 'YN' || question.question_type === 'SELECT_ONE') {
            elements.options.className = 'survey-options radio-group';
            question.options.forEach(opt => {
                const label = document.createElement('label');
                if (savedAnswer === opt.value) label.classList.add('selected');
                label.innerHTML = `<input type="radio" name="${question.question_code}" value="${opt.value}" ${savedAnswer === opt.value ? 'checked' : ''}><span>${opt.text}</span>`;
                elements.options.appendChild(label);
            });
        } else if (question.question_type === 'INPUT') {
            elements.options.className = 'survey-options';
            elements.options.innerHTML = `<input type="number" name="${question.question_code}" class="form-control" value="${savedAnswer || ''}" placeholder="숫자를 입력하세요">`;
        }
        
        elements.options.querySelectorAll('.radio-group label').forEach(label => {
            label.addEventListener('click', () => {
                const radio = label.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;
                handleNext();
            });
        });

        elements.prevBtn.style.display = questionHistory.length > 1 ? 'inline-block' : 'none';
        elements.nextBtn.style.display = (question.question_type === 'SELECT_ONE' || question.question_type === 'INPUT') ? 'inline-block' : 'none';
    
        const totalMainQuestions = allQuestions.filter(q => !q.question_code.includes('_')).length || 16;
        const progressPercentage = ((mainQuestionNumber - 1) / totalMainQuestions) * 100;
        elements.progressBar.style.width = `${progressPercentage > 100 ? 100 : progressPercentage}%`;
        elements.progressText.textContent = `진행도: ${Math.round(progressPercentage > 100 ? 100 : progressPercentage)}%`;
    }

    function saveCurrentAnswer() {
        const qIndex = questionHistory[questionHistory.length - 1];
        if (qIndex === undefined) return null;
        const question = allQuestions[qIndex];
        const input = elements.options.querySelector(`[name="${question.question_code}"]`);
        if (!input) return null;
        userAnswers[question.question_code] = (input.type === 'radio') 
            ? elements.options.querySelector(`[name="${question.question_code}"]:checked`)?.value 
            : input.value;
        return userAnswers[question.question_code];
    }

    async function handleNext() {
    const qIndex = questionHistory[questionHistory.length - 1];
    const currentQ = allQuestions[qIndex];
    const currentA = saveCurrentAnswer();
    if (!currentA || currentA === "") {
        return;
    }
    
    // --- ▼▼▼ 핵심 수정: 다음 질문 경로 결정 로직 수정 ▼▼▼ ---

    let nextQuestionCode = currentQ.next_question_default; // 1. 일단 '기본' 경로를 기본값으로 설정

    if (currentQ.question_type === 'YN') {
        // 2. YN 질문일 경우, 특정 경로가 있는지 확인하고 있으면 덮어쓰기
        if (currentA === 'Yes' && currentQ.next_question_if_yes) {
            nextQuestionCode = currentQ.next_question_if_yes;
        } else if (currentA === 'No' && currentQ.next_question_if_no) {
            nextQuestionCode = currentQ.next_question_if_no;
        }
    }
    
    // --- ▲▲▲ 여기까지 수정 ▲▲▲ ---

    if (!nextQuestionCode || nextQuestionCode === 'END_SURVEY') {
        elements.container.classList.add('hidden');
        elements.navigation.classList.add('hidden');
        elements.complete.classList.remove('hidden');
        elements.progressBar.style.width = `100%`;
        elements.progressText.textContent = `진행도: 100%`;
        return;
    }
    
    const nextIndex = allQuestions.findIndex(q => q.question_code === nextQuestionCode);
    if (nextIndex !== -1) {
        questionHistory.push(nextIndex);
        await renderQuestion(nextIndex);
    } else {
        console.error(`다음 질문을 찾을 수 없습니다: ${nextQuestionCode}`);
        elements.container.classList.add('hidden');
        elements.navigation.classList.add('hidden');
        elements.complete.classList.remove('hidden');
    }
}

    async function handlePrev() {
        if (questionHistory.length > 1) {
            questionHistory.pop();
            await renderQuestion(questionHistory[questionHistory.length - 1]);
        }
    }

    async function submitSurvey() {
        elements.submitBtn.disabled = true;
        elements.submitBtn.textContent = '제출 중...';
        try {
            const response = await fetch(`${API_BASE_URL}/diagnoses/${diagnosisId}/answers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
                body: JSON.stringify(userAnswers)
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem('locallink-token');
                sessionStorage.clear();
                alert('로그인 세션이 만료되었습니다. 다시 로그인해주세요.');
                window.location.href = 'main_login.html';
                return;
            }
            
            const result = await response.json();
            if (result.success) {
                alert(result.message);
                localStorage.setItem('lastCompletedDiagnosisId', diagnosisId);
                window.location.href = `survey_step3_esg_result.html?diagId=${diagnosisId}`;
            } else { 
                throw new Error(result.message); 
            }
        } catch (error) {
            alert(`설문 제출 중 오류가 발생했습니다: ${error.message}`);
            elements.submitBtn.disabled = false;
            elements.submitBtn.textContent = '결과보기';
        }
    }

    // --- 4. 페이지 초기화 실행 ---
    async function initializePage() {
        try {
            const [diagRes, surveyRes, industriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/diagnoses/${diagnosisId}`, { headers: { 'Authorization': `Bearer ${token}` }}),
                fetch('${API_BASE_URL}/survey/simple', { headers: { 'Authorization': `Bearer ${token}` }}),
                fetch('${API_BASE_URL}/industries', { headers: { 'Authorization': `Bearer ${token}` }})
            ]);

            if (!diagRes.ok || !surveyRes.ok || !industriesRes.ok) throw new Error("데이터 로딩 오류");
            
            const diagResult = await diagRes.json();
            const surveyResult = await surveyRes.json();
            const industriesResult = await industriesRes.json();
            
            if (!diagResult.success || !surveyResult.success || !industriesResult.success) throw new Error("데이터 처리 오류");
            
            diagnosisData = diagResult.diagnosis;
            allQuestions = surveyResult.questions;
            const allIndustries = industriesResult.industries;

            renderHeader(diagnosisData);
            
            const primaryIndustryCode = diagnosisData.industry_codes ? diagnosisData.industry_codes[0] : null;
            if (primaryIndustryCode) {
                elements.primaryIndustry.textContent = `진단 기준 대표 산업: [${primaryIndustryCode}] ${allIndustries.find(i => i.code === primaryIndustryCode)?.name || ''}`;
                elements.primaryIndustry.classList.remove('hidden');
                
                const avgRes = await fetch(`${API_BASE_URL}/averages/${primaryIndustryCode}`, { headers: { 'Authorization': `Bearer ${token}` }});
                const avgResult = await avgRes.json();
                if (avgResult.success) industryAverages = avgResult.averages;
            }

            elements.prevBtn.addEventListener('click', handlePrev);
            elements.nextBtn.addEventListener('click', handleNext);
            elements.submitBtn.addEventListener('click', submitSurvey);
            
            questionHistory.push(0);
            elements.loading.style.display = 'none';
            elements.container.classList.remove('hidden');
            elements.navigation.classList.remove('hidden');
            renderQuestion(0);

            // ★★★ 모든 작업이 끝난 후, 이 코드를 추가합니다. ★★★
            // 다른 스크립트에 의해 변경되었을 수 있는 헤더를 다시 올바르게 그립니다.
            if (typeof checkLoginAndRenderHeader === 'function') {
                checkLoginAndRenderHeader();
            }
            
        } catch (error) {
            elements.loading.textContent = `오류가 발생했습니다: ${error.message}`;
            console.error(error);
        }
    }

    initializePage();
});