// js/survey_step3_result.js (2025-06-29 09:15:00)

document.addEventListener('DOMContentLoaded', async function() {    
    // --- 1. 페이지 변수 및 요소 초기화 ---
    const urlParams = new URLSearchParams(window.location.search);
    const diagnosisId = urlParams.get('diagId');
    const token = localStorage.getItem('locallink-token');

    const elements = {
        loading: document.getElementById('loadingMessage'),
        resultContainer: document.getElementById('resultContainer'),
        companyName: document.getElementById('companyNameDisplay'),
        totalScore: document.getElementById('esgTotalScoreDisplay'),
        grade: document.getElementById('esgGradeDisplay'),
        comment: document.getElementById('esgCoreCommentDisplay'),
        categoryContainer: document.getElementById('categoryResultsContainer'),
        tableBody: document.getElementById('evaluationTableBody'),
    };
    
    // --- 2. 기능 함수 정의 ---

    function generatePdf() {
        const downloadBtn = document.getElementById('downloadPdfBtn');
        const element = document.querySelector('main.container');
        const options = {
            margin: 10,
            filename: 'ESG_간편진단_리포트.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, letterRendering: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        if(downloadBtn) {
            downloadBtn.textContent = 'PDF 생성 중...';
            downloadBtn.disabled = true;
        }

        html2pdf().from(element).set(options).save().finally(() => {
            if(downloadBtn) {
                downloadBtn.textContent = 'PDF로 저장 📄';
                downloadBtn.disabled = false;
            }
        });
    }

    function getGradeAndComment(score) {
        if (score >= 80) return { grade: '우수', comment: 'ESG 핵심 영역 관리가 매우 우수합니다.' };
        if (score >= 60) return { grade: '양호', comment: 'ESG 핵심 영역 관리가 양호한 수준입니다.' };
        if (score >= 40) return { grade: '보통', comment: 'ESG 핵심 영역에 대한 개선 노력이 필요합니다.' };
        return { grade: '미흡', comment: 'ESG 핵심 영역에 대한 적극적인 관심과 개선이 시급합니다.' };
    }

    function renderCategoryResults(diagnosis) {
        if (!elements.categoryContainer) return;
        elements.categoryContainer.innerHTML = '';
        const categories = { E: '환경(E)', S: '사회(S)', G: '지배구조(G)' };
        
        for(const cat in categories) {
            const score = parseFloat(diagnosis[`${cat.toLowerCase()}_score`] || 0);
            const { grade } = getGradeAndComment(score);
            const categoryDiv = document.createElement('div');
            categoryDiv.className = 'category';
            categoryDiv.innerHTML = `
                <h4>${categories[cat]} 영역</h4>
                <div class="progress-bar-container"><div class="progress-bar" style="width: ${score.toFixed(1)}%;">${score.toFixed(1)}</div></div>
                <p>점수: ${score.toFixed(1)} 점 / 등급: ${grade}</p>`;
            elements.categoryContainer.appendChild(categoryDiv);
        }
    }

    function renderEvaluationTable(userAnswers) {
        const tableBody = document.getElementById('evaluationTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        userAnswers.sort((a, b) => a.display_order - b.display_order);

        userAnswers.forEach(answer => {
            let answerText = answer.answer_value;
            if (answer.options && Array.isArray(answer.options) && answer.options.length > 0) {
                const foundOption = answer.options.find(opt => opt.value === answer.answer_value);
                if (foundOption) answerText = foundOption.text;
            }
            const scoreDisplay = answer.score !== null ? answer.score : '-';
            const row = tableBody.insertRow();
            if (answer.esg_category) row.className = `row-${answer.esg_category.toLowerCase()}`;
            row.insertCell().innerHTML = `<strong>${answer.question_code}</strong><br>${answer.question_text}`;
            row.insertCell().textContent = answerText;
            row.insertCell().textContent = scoreDisplay;
            row.insertCell().innerHTML = answer.criteria_text || '-';
        });
    }

    // --- 3. 페이지 초기화 실행 ---
    async function initializePage() {
        if (!token || !diagnosisId) {
            alert('잘못된 접근입니다. 진단을 먼저 진행해주세요.');
            return window.location.href = 'survey_step1.html';
        }
        try {
            const response = await fetch(`${API_BASE_URL}/diagnoses/${diagnosisId}/results`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('결과를 불러오는 데 실패했습니다.');
            
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            const { diagnosis, userAnswers } = result.results;

            const totalScore = parseFloat(diagnosis.total_score || 0);
            const { grade, comment } = getGradeAndComment(totalScore);
            elements.companyName.textContent = diagnosis.company_name;
            elements.totalScore.textContent = totalScore.toFixed(1);
            elements.grade.textContent = grade;
            elements.comment.textContent = comment;

            renderCategoryResults(diagnosis);
            renderEvaluationTable(userAnswers);

            // '다음 단계(Step4)' 버튼을 찾아, URL에 현재 진단 ID를 추가합니다.
            const navStrategyLink = document.getElementById('navStrategyLink');
            if (navStrategyLink) {
                navStrategyLink.href = `survey_step4_esg_strategy.html?diagId=${diagnosisId}`;
            }
            // 'ESG프로그램 제안(Step5)' 링크에도 diagId를 추가합니다.
            const navProposalLink = document.getElementById('navProposalLink');
            if (navProposalLink) {
                navProposalLink.href = `survey_step5_program_proposal.html?diagId=${diagnosisId}`;
            }
            elements.loading.style.display = 'none';
            elements.resultContainer.classList.remove('hidden');

            const downloadBtn = document.getElementById('downloadPdfBtn');
            if (downloadBtn) {
                downloadBtn.addEventListener('click', generatePdf);
            }

            if (typeof checkLoginAndRenderHeader === 'function') {
                checkLoginAndRenderHeader();
            }
            // ★★★ 이 부분을 추가해주세요. ★★★
            // '다음 단계(Step4)' 버튼을 찾아, URL에 현재 진단 ID를 추가합니다.
            const viewStrategyBtn = document.getElementById('viewStrategyBtn');
            if (viewStrategyBtn) {
                viewStrategyBtn.href = `survey_step4_esg_strategy.html?diagId=${diagnosisId}`;
            }
            
            // 로딩 메시지 숨기고 결과 컨테이너 보여주기 및 헤더 복구
            elements.loading.style.display = 'none';
            elements.resultContainer.classList.remove('hidden');
            if (typeof checkLoginAndRenderHeader === 'function') {
                checkLoginAndRenderHeader();
            }
        } catch (error) {
            elements.loading.innerHTML = `<h2>오류가 발생했습니다</h2><p>${error.message}</p>`;
        }
    }

    initializePage();
});