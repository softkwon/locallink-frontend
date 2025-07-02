// js/script.js (산업 평균 전체 표시 기능 추가 최종본, 250613

function updateHeaderUI() {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const userEmail = localStorage.getItem('loggedInUserEmail');
    const userAuthStatusDiv = document.getElementById('userAuthStatus');
    if (userAuthStatusDiv) {
        userAuthStatusDiv.innerHTML = ''; 
        if (isLoggedIn) {
            userAuthStatusDiv.innerHTML = `
                <span style="margin-right: 10px; vertical-align: middle;">${userEmail || '사용자'}님, 환영합니다!</span>
                <a href="main_member_info.html" class="nav-link-item" style="margin-right: 10px; vertical-align: middle;">회원정보</a>
                <button id="logoutButton" class="button-logout">로그아웃</button>
            `;
            const logoutButton = document.getElementById('logoutButton');
            if (logoutButton) {
                logoutButton.onclick = function() {
                    localStorage.clear();
                    alert('로그아웃 되었습니다.');
                    window.location.href = 'index.html'; 
                };
            }
        } else { 
            userAuthStatusDiv.innerHTML = `
                <a href="main_login.html" style="margin-right: 10px;">로그인</a>
                <a href="main_signup.html">회원가입</a>
            `;
        }
    }
}


// 질문 ID와 데이터 키를 연결하는 맵 (어떤 질문에서 정보 박스를 보여줄지 결정)
const QUESTION_TO_DATA_KEY_MAP = {
    'Q2_1': { key: 'greenhouseGas', category: 'E' },
    'Q3_1': { key: 'energyUsage', category: 'E' },
    'Q4_1': { key: 'wasteGeneration', category: 'E' },
    'Q5_1': { key: 'nonRegularRatio', category: 'S' },
    'Q6_1': { key: 'disabilityEmploymentRatio', category: 'S' },
    'Q7_1': { key: 'femaleEmployeeRatio', category: 'S' },
    'Q8_1': { key: 'yearsOfService', category: 'S' },
    'Q11_1': { key: 'outsideDirectorRatio', category: 'G' },
    'Q12_1': { key: 'boardMeetings', category: 'G' },
    'Q13_1': { key: 'executiveCompensationRatio', category: 'G' }
};

// 데이터 키를 사용자 친화적인 텍스트와 단위로 변환하기 위한 맵
const DATA_KEY_TO_LABEL_MAP = {
    'greenhouseGas': { label: '온실가스 배출량', unit: 'tCO₂eq' },
    'energyUsage': { label: '에너지 사용량', unit: 'MWh' },
    'wasteGeneration': { label: '폐기물 발생량', unit: '톤' },
    'nonRegularRatio': { label: '비정규직 비율', unit: '%' },
    'disabilityEmploymentRatio': { label: '장애인 고용률', unit: '%' },
    'femaleEmployeeRatio': { label: '여성 직원 비율', unit: '%' },
    'yearsOfService': { label: '평균 근속년수', unit: '년' },
    'outsideDirectorRatio': { label: '사외이사 비율', unit: '%' },
    'boardMeetings': { label: '연간 이사회 개최', unit: '회' },
    'executiveCompensationRatio': { label: '매출액 대비 임원보수', unit: '%' }
};

// ★★★ 카테고리별로 어떤 데이터 키들을 보여줄지 정의하는 맵 추가 ★★★
const CATEGORY_TO_DATA_KEYS_MAP = {
    E: ['greenhouseGas', 'energyUsage', 'wasteGeneration'],
    S: ['nonRegularRatio', 'disabilityEmploymentRatio', 'femaleEmployeeRatio', 'yearsOfService'],
    G: ['outsideDirectorRatio', 'boardMeetings', 'executiveCompensationRatio']
};


/**
 * 특정 질문에 대한 특별 점수 계산 로직을 처리하는 함수
 * @param {string} questionId - 질문 ID
 * @param {string} answerValue - 사용자의 답변 값
 * @param {string} userIndustryCode - 사용자의 산업 분류 코드
 * @returns {number|null} - 특별 점수를 반환하거나, 해당 없으면 null을 반환
 */
function getSpecialScore(questionId, answerValue, userIndustryCode) {
    const mapping = QUESTION_TO_DATA_KEY_MAP[questionId];
    if (!mapping) return null; 

    // 산업 평균 데이터가 없는 경우 50점 처리
    if (typeof INDUSTRY_AVERAGE_DATA === 'undefined' || !INDUSTRY_AVERAGE_DATA[userIndustryCode]) return 50; 
    const industryData = INDUSTRY_AVERAGE_DATA[userIndustryCode];
    const industryAverage = industryData[mapping.key];
    const userAnswer = parseFloat(answerValue);

    // 사용자 답변이 숫자가 아니거나, 비교할 산업 평균값이 없는 경우 0점 처리
    if (isNaN(userAnswer) || industryAverage === undefined) return 0;
    const lowerBound = industryAverage * 0.9;
    const upperBound = industryAverage * 1.1;

    if (mapping.higherIsWorse) {
        if (userAnswer < lowerBound) return 100;
        if (userAnswer <= upperBound) return 50;
        return 0;
    } else {
        if (userAnswer > upperBound) return 100;
        if (userAnswer >= lowerBound) return 50;
        return 0;
    }

    // ★★★ 수정된 점수 계산 로직 ★★★
    // 이 질문들은 모두 '값이 낮을수록 좋음'을 기준으로 합니다.
    if (userAnswer < industryAverage) {
        return 75; // 평균보다 낮으면(우수) 75점
    } else if (userAnswer === industryAverage) {
        return 50; // 평균과 같으면 50점
    } else { // (userAnswer > industryAverage)
        return 0;  // 평균보다 높으면(미흡) 0점
    }
}

/**
 * 사용자의 답변을 기반으로 ESG 점수를 계산하는 함수 (수정된 최종본)
 * @param {object} answers - 사용자의 답변 객체
 * @param {string} userIndustryCode - 사용자의 산업 분류 코드
 * @returns {object} - 계산된 최종 결과 객체
 */
function calculateEsgResults(answers, userIndustryCode) {
    let categoryScores = { E: 0, S: 0, G: 0 }; 
    const CATEGORY_TOPIC_COUNT = { E: 4, S: 6, G: 6 };

    for (const qId in answers) {
        if (answers.hasOwnProperty(qId)) {
            const answerData = answers[qId];
            const category = answerData.category;

            // surveyData에서 현재 질문의 정의를 찾음
            const questionDef = (typeof surveyData !== 'undefined') ? surveyData.find(q => q.id === qId) : null;

            if (category && categoryScores.hasOwnProperty(category) && questionDef) {
                let achievedScore = 0;
                
                // ★★★ 수정된 로직: INPUT 타입일 때만 특별 점수 계산 시도 ★★★
                if (questionDef.type === 'INPUT' && questionDef.maxScore > 0) {
                    // 산업 평균 비교 점수 계산 (예: Q2_1, Q3_1, Q4_1)
                    const specialScore = getSpecialScore(qId, answerData.answerValue, userIndustryCode);
                    achievedScore = (specialScore !== null) ? specialScore : 0;
                } else {
                    // 그 외의 경우(YN, SELECT_ONE)는 survey_data에 정의된 점수 사용
                    achievedScore = Number(answerData.score) || 0;
                }
                
                answerData.score = achievedScore; // 최종 점수를 rawAnswers에 다시 기록
                
                // 배점이 있는 항목만 총점에 합산
                categoryScores[category] += achievedScore;
            }
        }
    }

    const categoryResults = {};
    const esgCoreCategories = ['E', 'S', 'G'];
    let totalAchievedScore = 0;
    let totalMaxScore = 0;

    esgCoreCategories.forEach(catKey => {
        const achieved = categoryScores[catKey];
        const fixedDenominator = CATEGORY_TOPIC_COUNT[catKey];
        const percentage = fixedDenominator > 0 ? (achieved / fixedDenominator) : 0;
        let grade = "평가 불가";
        if (fixedDenominator > 0) {
            const gradeScore = (achieved / (fixedDenominator * 100)) * 100;
            if (gradeScore >= 80) grade = "우수";
            else if (gradeScore >= 60) grade = "양호";
            else if (gradeScore >= 40) grade = "보통";
            else grade = "미흡";
        }
        categoryResults[catKey] = {
            score: achieved, 
            maxScore: fixedDenominator * 100,
            percentage: parseFloat(percentage.toFixed(1)), 
            grade: grade
        };
        totalAchievedScore += achieved;
        totalMaxScore += (fixedDenominator * 100);
    });

    const esgCorePercentage = totalMaxScore > 0 ? (totalAchievedScore / totalMaxScore) * 100 : 0;
    let esgCoreGrade = "평가 불가";
    if (totalMaxScore > 0) {
        if (esgCorePercentage >= 80) esgCoreGrade = "우수";
        else if (esgCorePercentage >= 60) esgCoreGrade = "양호";
        else if (esgCorePercentage >= 40) esgCoreGrade = "보통";
        else esgCoreGrade = "미흡";
    }
    
    return {
        esgCorePercentage: parseFloat(esgCorePercentage.toFixed(1)), 
        esgCoreGrade, 
        categoryResults, 
        rawAnswers: answers 
    };
}

document.addEventListener('DOMContentLoaded', function() {
    updateHeaderUI();

    if (document.getElementById('questionContainer')) {
        let currentSurveyQuestionId = null; 
        const userSurveyAnswers = {};       
        let questionHistory = []; 
        
        const questionContainer = document.getElementById('questionContainer'); 
        const questionTextElement = document.getElementById('questionText');   
        const optionsContainerElement = document.getElementById('optionsContainer'); 
        const surveyCompleteMessageElement = document.getElementById('surveyCompleteMessage'); 
        const prevQuestionBtn = document.getElementById('prevQuestionBtn');
        const questionExplanationDiv = document.getElementById('questionExplanation');
        const industryAverageDiv = document.getElementById('industryAverageInfo');

        function startSurvey() {
            if (typeof surveyData === 'undefined' || !Array.isArray(surveyData)) return;
            currentSurveyQuestionId = surveyData[0].id;
            renderSurveyQuestion(currentSurveyQuestionId);
        }


        function renderSurveyQuestion(questionId) {
            const question = surveyData.find(q => q.id === questionId);
            if (!question || questionId === "END_SURVEY") { 
                showSurveyCompletion(); return; 
            }
            questionTextElement.textContent = question.question;
            optionsContainerElement.innerHTML = '';
            
            if (questionExplanationDiv) questionExplanationDiv.style.display = 'none';
            if (industryAverageDiv) industryAverageDiv.style.display = 'none';

            if (questionExplanationDiv && typeof QUESTION_EXPLANATIONS !== 'undefined' && QUESTION_EXPLANATIONS[questionId]) {
                questionExplanationDiv.innerHTML = QUESTION_EXPLANATIONS[questionId];
                questionExplanationDiv.style.display = 'block';
            }

            // ★★★ 수정된 산업 평균 데이터 표시 로직 ★★★
            const dataMapping = QUESTION_TO_DATA_KEY_MAP[questionId];
            if (industryAverageDiv && dataMapping) {
                const userIndustryCode = localStorage.getItem('currentUserIndustryCode');
                const industryInfo = (typeof industryData !== 'undefined') ? industryData.find(i => i.code === userIndustryCode) : null;
                const industryName = industryInfo ? industryInfo.name : '선택된 산업';

                // 표시할 데이터 키 목록 가져오기
                const keysToShow = CATEGORY_TO_DATA_KEYS_MAP[dataMapping.category];

                // 표시할 HTML 생성
                let infoHtml = `<p><strong>[참고] '${industryName}' 업계 평균 데이터</strong></p><ul>`;
                let hasData = false;

                if (userIndustryCode && typeof INDUSTRY_AVERAGE_DATA !== 'undefined' && INDUSTRY_AVERAGE_DATA[userIndustryCode]) {
                    const averageData = INDUSTRY_AVERAGE_DATA[userIndustryCode];
                    
                    keysToShow.forEach(key => {
                        const dataKeyInfo = DATA_KEY_TO_LABEL_MAP[key];
                        if (averageData[key] !== undefined && dataKeyInfo) {
                            infoHtml += `<li>${dataKeyInfo.label}: <strong>${averageData[key].toLocaleString()} ${dataKeyInfo.unit}</strong></li>`;
                            hasData = true;
                        }
                    });
                } 
                
                infoHtml += `</ul>`;

                if(hasData){
                    industryAverageDiv.innerHTML = infoHtml;
                    industryAverageDiv.style.display = 'block';
                } else {
                    // 해당 산업에 대한 데이터가 하나도 없을 경우
                    industryAverageDiv.innerHTML = `<p><strong>[참고]</strong> 선택하신 산업의 평균 데이터가 없습니다. <strong>전체 산업 평균값을 기준으로 참고</strong>해주세요.</p>`;
                    industryAverageDiv.style.display = 'block';
                }
            }
                const previousAnswerData = userSurveyAnswers[questionId];
                    switch (question.type) {
                    case 'YN':
                    question.options.forEach(option => {
                        const button = document.createElement('button');
                        button.textContent = option.text;
                        button.className = 'button-secondary survey-option-button';
                        if (previousAnswerData && previousAnswerData.answerValue === option.value) {
                             button.classList.replace('button-secondary', 'button-primary');
                        }
                        button.onclick = () => handleSurveyAnswer(question, option.value); 
                        optionsContainerElement.appendChild(button);
                    });
                    break;
                    case 'SELECT_ONE':
                    question.options.forEach(option => {
                        const div = document.createElement('div');
                        div.className = 'radio-group survey-radio-group';
                        const radioButton = document.createElement('input'); 
                        radioButton.type = 'radio';
                        radioButton.name = `survey_q_${question.id}`;
                        radioButton.id = `survey_q_${question.id}_opt_${option.value}`;
                        radioButton.value = option.value;
                        if (previousAnswerData && previousAnswerData.answerValue === option.value) {
                            radioButton.checked = true;
                        }
                        const label = document.createElement('label'); 
                        label.htmlFor = radioButton.id;
                        label.textContent = option.text;
                        radioButton.onchange = () => handleSurveyAnswer(question, option.value); 
                        div.appendChild(radioButton);
                        div.appendChild(label);
                        optionsContainerElement.appendChild(div);
                    });
                    break;
                    case 'INPUT':
                    const inputField = document.createElement('input');
                    inputField.type = question.inputType || 'text';
                    inputField.id = `survey_q_${question.id}_input`;
                    inputField.className = 'form-control';
                    if (previousAnswerData) inputField.value = previousAnswerData.answerValue || '';
                    optionsContainerElement.appendChild(inputField);

                    const submitInputButton = document.createElement('button');
                    submitInputButton.textContent = '다음'; 
                    submitInputButton.className = 'button-primary survey-input-submit';
                    const handleSubmit = () => {
                        if (inputField.value.trim() === '') {
                            alert('값을 입력해주세요.');
                            return;
                        }
                        handleSurveyAnswer(question, inputField.value.trim());
                    };
                    submitInputButton.onclick = handleSubmit;
                    optionsContainerElement.appendChild(submitInputButton);
                    inputField.onkeypress = (e) => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } };
                    break;
            }
            if (prevQuestionBtn) prevQuestionBtn.style.display = (questionHistory.length > 0) ? 'inline-block' : 'none';
        } 

        function handleSurveyAnswer(question, answerValue) {
            if (!question || !question.id) return;
            if (questionHistory.length === 0 || questionHistory[questionHistory.length - 1] !== question.id) {
                questionHistory.push(question.id);
            }
            let currentScore = 0;
            let selectedOptionText = answerValue; 
            if (question.type !== 'INPUT') {
                const chosenOption = question.options.find(opt => opt.value === answerValue);
                if (chosenOption) {
                    currentScore = Number(chosenOption.score) || 0; 
                    selectedOptionText = chosenOption.text;
                }
            }
            userSurveyAnswers[question.id] = { 
                questionText: question.question, answerValue, answerText: selectedOptionText, 
                score: currentScore, category: question.category, maxScore: Number(question.maxScore) || 0 
            };
            
            let nextId = (question.type === 'YN') ? (answerValue === 'Yes' ? question.nextIfYes : question.nextIfNo) : question.next;
            
            currentSurveyQuestionId = (nextId && nextId !== "END_SURVEY") ? nextId : "END_SURVEY";
            renderSurveyQuestion(currentSurveyQuestionId);
        }
        
        function showSurveyCompletion() { 
            if (questionContainer) questionContainer.style.display = 'none';
            if (surveyCompleteMessageElement) {
                surveyCompleteMessageElement.classList.remove('hidden');
                surveyCompleteMessageElement.innerHTML = `
                    <h3>수고하셨습니다. 진단이 완료되었습니다!</h3>
                    <p>아래 버튼을 눌러 결과를 확인하세요.</p>
                    <button id="viewResultBtn" class="button-primary">결과 보기</button>
                `;
                document.getElementById('viewResultBtn').onclick = () => {
                    const userIndustryCode = localStorage.getItem('currentUserIndustryCode');
                    const finalResults = calculateEsgResults(userSurveyAnswers, userIndustryCode);
                    localStorage.setItem('esgFinalResults', JSON.stringify(finalResults));
                    window.location.href = 'survey_step3_esg_result.html';
                };
            }
        }

        if (prevQuestionBtn) {
            prevQuestionBtn.onclick = function() {
                if (questionHistory.length > 0) { // 맨 처음 질문에서는 동작하지 않도록
                    currentSurveyQuestionId = questionHistory.pop(); 
                    renderSurveyQuestion(currentSurveyQuestionId);
                }
            };
        }
        startSurvey(); 
    }
});