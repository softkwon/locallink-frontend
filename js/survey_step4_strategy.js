import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { getCompanySizeName } from './admin_common.js'; 

document.addEventListener('DOMContentLoaded', async function() {
    
    // --- 1. 페이지 초기화 및 데이터 로딩 ---
    const diagnosisId = new URLSearchParams(window.location.search).get('diagId');
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const contentEl = document.getElementById('strategyContent');

    // '진단 결과보기' 링크에 현재 diagId를 설정하여 사용자가 돌아갈 수 있도록 함
    const resultPageLink = document.getElementById('resultPageLink');
    if(resultPageLink && diagnosisId) {
        resultPageLink.href = `survey_step3_esg_result.html?diagId=${diagnosisId}`;
    }

    // ★★★ 'ESG프로그램 제안(Step5)' 링크에 diagId를 추가하는 로직 ★★★
    const navProposalLink = document.getElementById('navProposalLink');
    if (navProposalLink && diagnosisId) {
        navProposalLink.href = `survey_step5_program_proposal.html?diagId=${diagnosisId}`;
    }
    
    // 필수 정보가 없으면 에러 메시지를 표시하고 실행 중단
    if (!diagnosisId || !token) {
        if(loadingEl) loadingEl.innerHTML = '<h2>잘못된 접근입니다.</h2><p>진단 결과 페이지에서 다시 접근해주세요.</p>';
        return;
    }

    try {
        // 전략 데이터와 규제 데이터를 동시에 요청
        const [strategyRes, regulationsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/strategy/${diagnosisId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/admin/regulations`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

        // --- 1. 전략 데이터 처리 ---
        if (!strategyRes.ok) {
            const errorResult = await strategyRes.json().catch(() => ({ message: '전략 데이터를 불러오는 중 서버에 문제가 발생했습니다.' }));
            throw new Error(errorResult.message);
        }
        const strategyResult = await strategyRes.json();
        if (!strategyResult.success) {
            throw new Error(strategyResult.message);
        }
        const data = strategyResult.strategyData;

        const userName = data.userDiagnosis.company_name || '고객';
        document.getElementById('marketStatusTitle').textContent = `${userName}님이 속한 시장현황`;
        document.getElementById('customStrategyTitle').textContent = `${userName}님의 맞춤 ESG 대응`;
        document.getElementById('customStrategyDescription').innerHTML = `설문결과를 기반하여 <strong>${userName}님</strong>의 ESG경영 개선을 도와 ESG 투자비용절감, 신규수익창출 및 국내외 ESG규제에 효과적으로 대응하기 위한 맞춤형 프로그램 분야를 제안합니다.`;
        
        const taskContainer = document.getElementById('taskAnalysisContainer');
        if (taskContainer) {
            taskContainer.addEventListener('click', e => {
                if (e.target.classList.contains('program-proposal-btn')) {
                    const programId = e.target.dataset.programId;
                    const diagId = new URLSearchParams(window.location.search).get('diagId');
                    const url = `esg_program_detail.html?id=${programId}&from=strategy&diagId=${diagId}`;
                    const windowFeatures = 'width=1024,height=768,scrollbars=yes,resizable=yes';
                    window.open(url, 'programDetailWindow', windowFeatures);
                }
            });
        }

        // --- 2. [핵심] 규제 타임라인 데이터 처리 (이 부분이 누락된 것으로 보입니다) ---
        const regulationsResult = await regulationsRes.json();
        if (regulationsResult.success) {
            renderRegulationTimeline(regulationsResult.regulations);
        } else {
            document.getElementById('regulation-timeline-container').innerHTML = '<p>규제 정보를 불러오는 데 실패했습니다.</p>';
        }

        // --- 3. 받아온 데이터로 나머지 섹션을 그리는 함수들 호출 ---
        renderAiAnalysis(data.aiAnalysis);
        renderBenchmarkCharts(data.userDiagnosis, data.benchmarkScores, data.userAnswers, data.allQuestions);
        renderIndustryIssues(data.industryIssues, data.userDiagnosis);
        renderTasksAndAnalysis(data.recommendedPrograms, data.allSolutionCategories);
        renderRegionalMapAndIssues(data.userDiagnosis, data.regionalIssues);
        renderCompanySizeIssues(data.companySizeIssue, data.userDiagnosis.company_size);

        if(loadingEl) loadingEl.style.display = 'none';
        if(contentEl) contentEl.classList.remove('hidden');

        equalizeSectionHeights();

    } catch (error) {
        if(loadingEl) loadingEl.innerHTML = `<h2>오류 발생</h2><p>${error.message}</p>`;
    }
});


/**
 * 벤치마크 차트(영역별, 항목별)를 그리는 함수
 * @param {object} diagnosis - 사용자의 진단 결과 객체
 * @param {Array} benchmarkScores - 산업별 항목별 벤치마크 점수 배열
 * @param {Array} userAnswers - 사용자의 답변 목록
 * @param {Array} allQuestions - 모든 질문 정보
 */
function renderBenchmarkCharts(diagnosis, benchmarkScores, userAnswers, allQuestions) {
    if (typeof Chart === 'undefined') { console.error("Chart.js is not loaded."); return; }

    const catChartCanvas = document.getElementById('categoryBenchmarkChart');
    const qChartCanvas = document.getElementById('questionBenchmarkChart');

    // ★★★ 산업분류코드 표시를 위한 요소 찾기 (추가) ★★★
    const benchmarkInfoEl = document.getElementById('benchmarkIndustryInfo');

    if (!catChartCanvas || !qChartCanvas || !diagnosis) return;

    // ★★★ 받아온 진단 정보로 산업분류코드 표시 (추가) ★★★
    if (benchmarkInfoEl && diagnosis.industry_codes && diagnosis.industry_codes.length > 0) {
        // 백엔드에서 industry_name도 함께 보내주면 더 좋습니다.
        // 지금은 코드만 표시하는 것으로 구현합니다.
        benchmarkInfoEl.innerHTML = `<strong>적용 산업분류:</strong> [${diagnosis.industry_codes[0]}] ${diagnosis.industry_name || ''}`;
    }

    // 영역별 종합 성과 비교 차트 (Bar Chart)
    new Chart(catChartCanvas, {
        type: 'bar',
        data: {
            labels: ['환경(E)', '사회(S)', '지배구조(G)'],
            datasets: [
                { label: '우리 회사', data: [diagnosis.e_score, diagnosis.s_score, diagnosis.g_score], backgroundColor: 'rgba(54, 162, 235, 0.7)' },
                { label: '업계 평균', data: [50, 55, 45], backgroundColor: 'rgba(201, 203, 207, 0.7)' } 
            ]
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });

    // 항목별 성과 비교 차트 로직
    const branchingQuestions = ['S-Q1', 'S-Q2', 'S-Q3', 'S-Q4', 'S-Q5', 'S-Q6', 'S-Q7', 'S-Q8', 'S-Q9', 'S-Q10', 'S-Q11', 'S-Q12', 'S-Q13', 'S-Q14', 'S-Q15', 'S-Q16'];
    const filteredBenchmarkScores = (benchmarkScores || []).filter(item => !branchingQuestions.includes(item.question_code));
    const questionMap = new Map((allQuestions || []).map(q => [q.question_code, q.question_text]));

    filteredBenchmarkScores.sort((a, b) => {
        const getCodeNumbers = (code) => {
            const match = code.match(/Q(\d+)(?:_(\d+))?/);
            if (!match) return [999, 999];
            return [parseInt(match[1]), match[2] ? parseInt(match[2]) : 0];
        };
        const [mainA, subA] = getCodeNumbers(a.question_code);
        const [mainB, subB] = getCodeNumbers(b.question_code);
        if (mainA !== mainB) return mainA - mainB;
        return subA - subB;
    });

    const labels = [];
    const userScores = [];
    const industryScores = [];

    filteredBenchmarkScores.forEach(item => {
        const fullQuestionText = questionMap.get(item.question_code) || item.question_code;
        const shortLabelMatch = fullQuestionText.match(/^\((.*?)\)/);
        labels.push(shortLabelMatch ? shortLabelMatch[1] : item.question_code.replace('S-',''));

        industryScores.push(item.average_score);
        const userAnswer = (userAnswers || []).find(ans => ans.question_code === item.question_code);
        userScores.push(userAnswer && userAnswer.score != null ? userAnswer.score : 0);
    });
    
    if (labels.length === 0) {
        const container = qChartCanvas.parentElement;
        if(container) container.innerHTML = '<h4>항목별 성과 비교</h4><p>비교할 벤치마크 데이터가 없습니다.</p>';
        return;
    }

    new Chart(qChartCanvas, {
        type: 'line',
        data: { 
            labels: labels, 
            datasets: [
                { label: '우리 회사', data: userScores, borderColor: 'rgba(54, 162, 235, 1)', tension: 0.1 },
                { label: '업계 평균', data: industryScores, borderColor: 'rgba(255, 99, 132, 1)', borderDash: [5, 5], tension: 0.1 }
            ]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false, 
            scales: { y: { beginAtZero: true, max: 100 } },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(tooltipItems) {
                            const index = tooltipItems[0].dataIndex;
                            const questionCode = filteredBenchmarkScores[index].question_code;
                            return questionMap.get(questionCode) || questionCode;
                        },
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) { label += ': '; }
                            if (context.parsed.y !== null) { label += context.parsed.y.toFixed(1) + '점'; }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

/**
 * AI 분석 평가 섹션을 그리는 함수
 * @param {object} analysisData - 백엔드에서 가공된 AI 분석 데이터
 */
function renderAiAnalysis(analysisData) {
    const container = document.getElementById('aiAnalysisContent');
    if (!container || !analysisData) return;

    const diff = analysisData.percentageDiff;
    let comparisonText = '';
    let adviceText = '';

    // 백엔드에서 보내준 'status' 값에 따라 문구를 선택합니다.
    switch (analysisData.status) {
        case '우수':
            // ★★★ 소수점 첫째 자리까지 표시하도록 수정 ★★★
            comparisonText = `업계 평균보다 약 <strong>${diff.toFixed(1)}% 우수합니다.</strong>`;
            adviceText = `현재 속하신 산업군에서는 <strong>'${analysisData.industryMainIssue}'</strong>, 주요 활동 지역에서는 <strong>'${analysisData.regionMainIssue}'</strong>, 중요하게 다뤄지고 있습니다. 이러한 강점을 바탕으로 ESG 규제에 선제적으로 대응하여, 지속가능한 비즈니스 성장 기회를 적극적으로 모색해 보시길 바랍니다.`;
            break;
        case '부족':
            // ★★★ Math.abs()를 사용하여 음수 부호를 제거하고, 소수점 첫째 자리까지 표시 ★★★
            comparisonText = `업계 평균에 비해 약 <strong>${Math.abs(diff).toFixed(1)}% 부족한 상태입니다.</strong>`;
            adviceText = `현재 속하신 산업군에서는 <strong>'${analysisData.industryMainIssue}'</strong>, 주요 활동 지역에서는 <strong>'${analysisData.regionMainIssue}'</strong>, 중요하게 다뤄지고 있으니 주의가 필요합니다. 부족한 부분을 개선하여 규제 리스크를 줄이고, 새로운 사업 기회를 발굴하는 전략을 추천합니다.`;
            break;
        default: // '비슷'
            // ★★★ '비슷'할 때도 구체적인 수치를 괄호 안에 표시 ★★★
            const signedDiff = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
            comparisonText = `업계 평균과 <strong>비슷한 수준입니다.</strong> <span style="font-size:0.9em; color:#555;">(업계 평균 대비 <strong>${signedDiff}%</strong>)</span>`;
            adviceText = `현재 산업군 및 지역의 핵심 이슈인 <strong>'${analysisData.industryMainIssue}'</strong>, 조금 더 집중하신다면, 경쟁사보다 앞서 나갈 수 있는 좋은 기회가 될 것입니다.`;
            break;
    }

    container.innerHTML = `
        <p>${analysisData.userName}님의 ESG 경영 수준은 ${comparisonText}</p>
        <p>${adviceText}</p>
    `;
}

/**
 * 산업군 주요 ESG 이슈를 표시하는 함수
 * @param {Array} issues - 산업 이슈 배열
 * @param {object} diagnosis - 사용자 진단 정보
 */
function renderIndustryIssues(issues, diagnosis) {
    const container = document.getElementById('industryIssuesContent');
    const infoEl = document.getElementById('currentIndustryInfo');
    
    if(infoEl && diagnosis.industry_codes) {
        infoEl.innerHTML = `현재 적용된 산업 분류: <strong>[${diagnosis.industry_codes[0]}]</strong>`;
    }

    if (!container || !issues || issues.length === 0) {
        if(container) container.innerHTML = '<p>관련된 산업 이슈 정보가 없습니다.</p>';
        return;
    }
    
    const keyIssues = issues.map(i => i.key_issue).filter(Boolean).join('<br>') || '-';
    const opportunities = issues.map(i => i.opportunity).filter(Boolean).join('<br>') || '-';
    const threats = issues.map(i => i.threat).filter(Boolean).join('<br>') || '-';

    container.innerHTML = `
        <table class="styled-table">
            <thead><tr><th>구분</th><th>주요 내용</th></tr></thead>
            <tbody>
                <tr><th>주요 이슈</th><td>${keyIssues}</td></tr>
                <tr><th>기회 요인</th><td>${opportunities}</td></tr>
                <tr><th>위기 요인</th><td>${threats}</td></tr>
            </tbody>
        </table>
    `;
}

/**
 * 회사 규모별 ESG 이슈 테이블을 그리는 함수 (UI/UX 개선 버전)
 * @param {object} issueData - 해당 규모의 이슈 데이터
 * @param {string} userCompanySizeCode - 사용자의 회사 규모 영문 코드 (예: 'large')
 */
function renderCompanySizeIssues(issueData, userCompanySizeCode) {
    const container = document.getElementById('industryIssuesContent');
    if (!container) return;

    const companySizeKorean = getCompanySizeName(userCompanySizeCode);

    let contentHtml = '';
    // 데이터가 있을 때만 테이블을 생성합니다.
    if (issueData) {
        contentHtml = `
            <h4 style="margin-top: 30px;">${companySizeKorean}의 주요 ESG 이슈</h4>
            <table class="styled-table">
                <thead>
                    <tr>
                        <th style="width: 25%;">구분</th>
                        <th>주요 내용</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <th>핵심 이슈</th>
                        <td>${issueData.key_issue || '-'}</td>
                    </tr>
                    <tr>
                        <th>기회 요인</th>
                        <td>${issueData.opportunity || '-'}</td>
                    </tr>
                    <tr>
                        <th>위기 요인</th>
                        <td>${issueData.threat || '-'}</td>
                    </tr>
                </tbody>
            </table>
        `;
    } else {
        // 데이터가 없을 때 표시할 메시지
        contentHtml = `<p style="margin-top: 30px;">귀사의 규모(${companySizeKorean})에 맞는 ESG 이슈 데이터가 없습니다.</p>`;
    }
    
    // 기존 컨테이너의 맨 아래에 내용을 추가합니다.
    container.insertAdjacentHTML('beforeend', contentHtml);
}

/**
 * 지역 현안과 지도를 그리는 함수
 * @param {object} diagnosis - 사용자 진단 정보 (지역명 포함)
 * @param {Array} regionalIssues - 해당 지역의 이슈 데이터
 */
function renderRegionalMapAndIssues(diagnosis, regionalIssues) {
    const container = document.getElementById('regionalMapSection');
    if (!container) return;

    const locationName = diagnosis.business_location_text || '지역 정보 없음';
    const mapFileName = diagnosis.business_location ? `${diagnosis.business_location}.jpg` : 'default.png';
    const mapImageUrl = `/images/maps/${mapFileName}`;
    
    // ★★★ E, S, G 카테고리별로 모든 이슈를 그룹화합니다. (요청사항 3) ★★★
    const issuesByCategory = { E: [], S: [], G: [] };
    if (regionalIssues && regionalIssues.length > 0) {
        regionalIssues.forEach(issue => {
            if (issuesByCategory[issue.esg_category]) {
                issuesByCategory[issue.esg_category].push(issue.content);
            }
        });
    }

    // 오버레이에 표시될 각 줄의 HTML을 생성
    const overlayItemsHtml = ['E', 'S', 'G'].map(cat => {
        if (issuesByCategory[cat].length > 0) {
            const listItems = issuesByCategory[cat].map(item => `<li>${item}</li>`).join('');
            return `
                <div>
                    <h4><span class="map-issue-badge badge-${cat}">${cat}</span></h4>
                    <ul>${listItems}</ul>
                </div>
            `;
        }
        return ''; // 해당 카테고리 이슈가 없으면 아무것도 표시 안함
    }).join('');

    // 최종적으로 지도와 오버레이를 포함한 HTML을 그립니다.
    container.innerHTML = `
        <h3>${locationName}</h3>
        <div class="regional-map-container">
            <img src="${mapImageUrl}" alt="${locationName} 지도">
            <div class="map-overlay">
                ${overlayItemsHtml || '<p>해당 지역의 주요 현안 정보가 없습니다.</p>'}
            </div>
        </div>
    `;
}

// ★★★ 5. 높이를 맞춰주는 함수 (페이지 맨 아래 또는 헬퍼 함수 영역에 추가) ★★★
function equalizeSectionHeights() {
    const industrySection = document.getElementById('industryEsgIssuesSection');
    const mapSection = document.getElementById('regionalMapSection');

    if (!industrySection || !mapSection) return;

    // 높이 초기화
    industrySection.style.height = 'auto';
    mapSection.style.height = 'auto';

    // 렌더링 후 잠시 기다렸다가 높이를 계산해야 정확합니다.
    setTimeout(() => {
        const industryHeight = industrySection.offsetHeight;
        const mapHeight = mapSection.offsetHeight;
        
        const maxHeight = Math.max(industryHeight, mapHeight);

        industrySection.style.height = `${maxHeight}px`;
        mapSection.style.height = `${maxHeight}px`;
    }, 100); 
}

function renderTasksAndAnalysis(programs, allSolutionCategories) {
    const container = document.getElementById('taskAnalysisContainer');
    if (!container) return;

    // 추천된 프로그램이 없을 경우의 메시지
    if (!programs || programs.length === 0) {
        container.innerHTML = '<div class="solution-card" style="text-align: center;"><h4 class="solution-category-title">👍 축하합니다!</h4><p>현재 분석된 데이터를 기반으로 추천되는 시급한 ESG 개선 과제가 없습니다.</p></div>';
        return;
    }

    // 1. 카테고리 이름으로 설명을 쉽게 찾기 위한 Map 생성
    const categoryDescriptionMap = new Map((allSolutionCategories || []).map(cat => [cat.category_name, cat.description]));

    // 2. 프로그램을 카테고리별로 그룹화
    const groupedPrograms = programs.reduce((acc, program) => {
        const categories = program.solution_categories || ['기타'];
        categories.forEach(category => {
            if (!acc[category]) {
                acc[category] = [];
            }
            if (!acc[category].some(p => p.id === program.id)) {
                acc[category].push(program);
            }
        });
        return acc;
    }, {});

    let finalHtml = '';

    // 3. 그룹화된 데이터를 바탕으로 새로운 '솔루션 카드' UI 생성
    for (const category in groupedPrograms) {
        const categoryPrograms = groupedPrograms[category];
        const description = categoryDescriptionMap.get(category) || `${category} 관련 개선이 필요합니다.`;

        // 각 프로그램의 리스크 요약 (중복 제거)
        const riskSummaries = [...new Set(categoryPrograms.map(p => p.risk_text).filter(Boolean))];

        finalHtml += `
            <div class="solution-card">
                <h4 class="solution-category-title">${category}</h4>
                <p class="solution-category-description">${description}</p>
                
                <div class="solution-card-content">
                    <div>
                        <h5>추천 프로그램</h5>
                        <ul class="solution-program-list">
                            ${categoryPrograms.map(p => `<li><a href="esg_program_detail.html?id=${p.id}&from=strategy&diagId=${new URLSearchParams(window.location.search).get('diagId')}" target="_blank">${p.title}</a></li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <h5>주요 리스크</h5>
                        <ul class="solution-risk-list">
                            ${riskSummaries.length > 0 ? riskSummaries.map(risk => `<li>${risk}</li>`).join('') : '<li>-</li>'}
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    container.innerHTML = finalHtml;
}


/**
 * 기대효과 텍스트 목록을 생성하는 함수 (★★★ 최종 수정본 ★★★)
 * @param {object} program - ESG 프로그램 객체
 * @param {object} industryAverageData - 산업 평균 데이터
 * @returns {{riskText: string, opportunityTexts: Array<string>}}
 */
function getFinancialImpactText(program, industryAverageData) {
    // 1. '방치 시 리스크' 데이터 구성
    const risk = {
        summary: program.risk_text || '분석 데이터 없음',
        details: program.risk_description || '' // 툴팁에 들어갈 세부 설명
    };
    
    let opportunities = [];

    // 2. '개선 시 효과' 데이터 구성
    if (program.opportunity_effects && program.opportunity_effects.length > 0) {
        program.opportunity_effects.forEach(effect => {
            // '직접 입력' 타입 처리
            if (effect.type === 'text' && effect.value) {
                opportunities.push({ 
                    summary: effect.value, 
                    details: '' // 직접 입력은 세부 설명 없음
                });
            } 
            // '계산식' 타입 처리
            else if (effect.type === 'calculation') {
                const rule = effect.rule;
                const economicEffects = program.economic_effects;
                let summaryText = `[계산 불가]`; // 기본값
                let detailsText = '';

                if (rule && rule.params && rule.params.avgDataKey && industryAverageData && economicEffects && economicEffects.length > 0) {
                    const params = rule.params;
                    const avgValue = industryAverageData[params.avgDataKey];
                    const ecoEffect = economicEffects[0];
                    const correctionFactor = params.correctionFactor || 1.0;
                    const numericAvgValue = parseFloat(avgValue);
                    const numericEffectValue = ecoEffect ? parseFloat(ecoEffect.value) : NaN;

                    if (!isNaN(numericAvgValue) && !isNaN(numericEffectValue)) {
                        const calculatedValue = numericAvgValue * numericEffectValue * correctionFactor;
                        
                        // ★★★ 수정: 화면에는 숫자와 '원'만 표시
                        summaryText = `<b>${calculatedValue.toLocaleString()}</b> 원`;

                        // ★★★ 수정: 툴팁에는 세부 설명과 새로운 기대값 문구 표시
                        const descriptionTemplate = effect.description || "{value}의 개선 효과";
                        detailsText = descriptionTemplate.replace('{value}', `<b>${calculatedValue.toLocaleString()}</b>`) + "<br><br><em>= (산업평균값으로 추정한 기대값)</em>";

                    } else {
                        summaryText = `[계산 보류]`;
                        detailsText = `계산에 필요한 데이터(산업 평균 또는 기대 효과 값)가 유효하지 않습니다.`;
                    }
                }
                opportunities.push({ summary: summaryText, details: detailsText });
            }
        });
    }

    if (opportunities.length === 0) {
        opportunities.push({ summary: '경쟁력 강화', details: '' });
    }

    return { risk, opportunities };
}

function renderRegulationTimeline(regulations) {
    const container = document.getElementById('regulation-timeline-container');
    if (!container) return;

    container.innerHTML = '<div class="timeline-line"></div>';

    if (!regulations || regulations.length < 1) {
        container.innerHTML += '<p>현재 등록된 규제 정보가 없습니다.</p>';
        return;
    }

    const dates = regulations.map(reg => new Date(reg.effective_date).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const totalDuration = maxDate - minDate;

    let items = regulations.map((reg, index) => {
        const currentDate = new Date(reg.effective_date).getTime();
        let idealPosition = 0;
        if (totalDuration === 0) {
            idealPosition = (index + 1) / (regulations.length + 1) * 100;
        } else {
            idealPosition = ((currentDate - minDate) / totalDuration) * 100;
        }
        return { ...reg, idealPosition, finalPosition: idealPosition };
    });

    const MIN_GAP_PERCENT = 12;
    items.sort((a, b) => a.idealPosition - b.idealPosition);

    for (let i = 1; i < items.length; i++) {
        const prevItem = items[i - 1];
        const currentItem = items[i];
        const gap = currentItem.finalPosition - prevItem.finalPosition;
        if (gap < MIN_GAP_PERCENT) {
            currentItem.finalPosition = prevItem.finalPosition + MIN_GAP_PERCENT;
        }
    }
    const lastPos = items[items.length - 1]?.finalPosition;
    if (lastPos > 100) {
        const scaleFactor = 100 / lastPos;
        items.forEach(item => item.finalPosition *= scaleFactor);
    }

    const sizeMap = { 'large': '대기업', 'medium': '중견기업', 'small_medium': '중소기업', 'small_micro': '소기업/소상공인' };
    let timelineHtml = '';
    items.forEach(item => {
        const targetSizesKorean = (item.target_sizes || []).map(size => sizeMap[size] || size).join(', ');
        timelineHtml += `
            <div class="timeline-node" style="left: ${item.finalPosition}%;">
                <div class="timeline-dot"></div>
                <div class="timeline-label">
                    <span class="date">${new Date(item.effective_date).toLocaleDateString()}</span>
                    <span class="title">${item.regulation_name}</span>
                </div>
                <div class="timeline-details-box">
                    <h4>${item.regulation_name}</h4>
                    <p><strong>시행일:</strong> ${new Date(item.effective_date).toLocaleDateString()}</p>
                    <p><strong>적용 대상:</strong> ${targetSizesKorean}</p>
                    <hr>
                    <p><strong>설명:</strong> ${item.description || '-'}</p>
                    <p><strong>제재사항:</strong> ${item.sanctions || '-'}</p>
                    <p><strong>대응방안:</strong> ${item.countermeasures || '-'}</p>
                    ${item.link_url ? `<p><a href="${item.link_url}" target="_blank" class="details-link">자세히 보기</a></p>` : ''}
                </div>
            </div>
        `;
    });
    container.innerHTML += timelineHtml;
}