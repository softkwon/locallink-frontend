import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { getCompanySizeName } from './admin_common.js'; 

function renderMajorCompanyPrograms(programsData) {
    const container = document.getElementById('majorCompanyProgramsContent');
    if (!container) return;

    if (programsData && programsData.selected && programsData.selected.company_name) {
        let html = `<h4>✔ ${programsData.selected.company_name}의 대표 프로그램</h4>`;
        
        if (programsData.selected.programs && programsData.selected.programs.length > 0) {
            html += '<ul class="program-list-simple">';
            programsData.selected.programs.forEach(prog => {
                html += `
                    <li>
                        <strong>${prog.program_name}</strong>
                        <p>${prog.program_description || ''}</p>
                        ${prog.link_url ? `<a href="${prog.link_url}" target="_blank">자세히 보기 &raquo;</a>` : ''}
                    </li>
                `;
            });
            html += '</ul>';
        } else {
            html += '<p>등록된 대표 프로그램이 없습니다.</p>';
        }
        container.innerHTML = html;
    } else {
        container.innerHTML = '<p>진단 1단계에서 벤치마킹할 대기업을 선택하지 않았습니다.</p>';
    }
}

document.addEventListener('DOMContentLoaded', async function() {
    
    const diagnosisId = new URLSearchParams(window.location.search).get('diagId');
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const contentEl = document.getElementById('strategyContent');

    const resultPageLink = document.getElementById('resultPageLink');
    if(resultPageLink && diagnosisId) {
        resultPageLink.href = `survey_step3_esg_result.html?diagId=${diagnosisId}`;
    }

    const navProposalLink = document.getElementById('navProposalLink');
    if (navProposalLink && diagnosisId) {
        navProposalLink.href = `survey_step5_program_proposal.html?diagId=${diagnosisId}`;
    }
    
    if (!diagnosisId || !token) {
        if(loadingEl) loadingEl.innerHTML = '<h2>잘못된 접근입니다.</h2><p>진단 결과 페이지에서 다시 접근해주세요.</p>';
        return;
    }

    try {
        const [strategyRes, regulationsRes] = await Promise.all([
            fetch(`${API_BASE_URL}/strategy/${diagnosisId}`, { headers: { 'Authorization': `Bearer ${token}` } }),
            fetch(`${API_BASE_URL}/admin/regulations`, { headers: { 'Authorization': `Bearer ${token}` } })
        ]);

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
        document.getElementById('marketStatusDescription').innerHTML = `설문결과를 기반하여 <strong>${userName}님</strong>의 동종업계 대비 현황, 현재 확정된 ESG 규제 타임라인을 분석하여 대응방안을 분석합니다.`;
        document.getElementById('customStrategyTitle').textContent = `${userName}님의 맞춤 ESG 대응`;
        document.getElementById('customStrategyDescription').innerHTML = `설문결과를 기반하여 <strong>${userName}님</strong>의 ESG경영 개선을 도와 ESG 투자비용절감, 신규수익창출 및 국내외 ESG규제에 효과적으로 대응하기 위한 맞춤형 프로그램 분야를 제안합니다. <다음단계:ESG프로그램제안>에서 신청할 수 있습니다.`;

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

        const viewCategoriesBtn = document.getElementById('viewCategoriesBtn');
        const categoriesModal = document.getElementById('categories-modal');
        
        if (viewCategoriesBtn && categoriesModal) {
            renderCategoriesModal(data.allSolutionCategories);

            const closeBtn = categoriesModal.querySelector('.close-btn');
            const accordionContainer = document.getElementById('categories-accordion');

            viewCategoriesBtn.addEventListener('click', () => {
                categoriesModal.style.display = 'block';
            });

            closeBtn.addEventListener('click', () => categoriesModal.style.display = 'none');
            window.addEventListener('click', (e) => {
                if (e.target == categoriesModal) categoriesModal.style.display = 'none';
            });

            accordionContainer.addEventListener('click', function(e) {
                const header = e.target.closest('.accordion-header');
                if (!header) return;
                
                header.classList.toggle('active');
                const panel = header.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                    panel.style.padding = '0 20px';
                } else {
                    panel.style.padding = '15px 20px';
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            });
        }

        const regulationsResult = await regulationsRes.json();
        if (regulationsResult.success) {
            renderRegulationTimeline(regulationsResult.regulations);
        } else {
            document.getElementById('regulation-timeline-container').innerHTML = '<p>규제 정보를 불러오는 데 실패했습니다.</p>';
        }

        const industryAverageScores = renderBenchmarkCharts(data.userDiagnosis, data.benchmarkScores, data.userAnswers, data.allQuestions);
        renderAiAnalysis(data.aiAnalysis, data.userDiagnosis, industryAverageScores); 
        
        renderIndustryIssues(data.industryIssues, data.userDiagnosis);
        renderTasksAndAnalysis(data.priorityRecommendedPrograms, data.engineRecommendedPrograms, data.allSolutionCategories);
        renderRegionalMapAndIssues(data.userDiagnosis, data.regionalIssues); 
        renderCompanySizeIssues(data.companySizeIssue, data.userDiagnosis.company_size);
        renderMajorCompanyPrograms(data.majorCompanyPrograms);
        
        if(loadingEl) loadingEl.style.display = 'none';
        if(contentEl) contentEl.classList.remove('hidden');
        
        if (data.userDiagnosis.diagnosis_type === 'simple') {
        // "AI기반 ESG 전략 수립" 제목 아래 설명 <p> 태그를 찾습니다.
        const introParagraph = document.querySelector('.strategy-intro p'); // 실제 p태그를 가리키는 CSS 선택자로 수정이 필요할 수 있습니다.
        
        if (introParagraph) {
            const noticeElement = document.createElement('p');
            noticeElement.className = 'simple-diagnosis-notice';
            noticeElement.style.color = '#e85a4f'; // 눈에 띄는 색상
            noticeElement.style.fontWeight = 'bold';
            noticeElement.style.marginTop = '10px';
            noticeElement.textContent = '※ 아래 분석은 간이진단을 통해 나온 결과입니다.';
            
            // 기존 설명 문단 바로 다음에 안내 문구를 삽입합니다.
            introParagraph.parentNode.insertBefore(noticeElement, introParagraph.nextSibling);
        }
    }

    } catch (error) {
        if(loadingEl) loadingEl.innerHTML = `<h2>오류 발생</h2><p>${error.message}</p>`;
    }

    const tabContainer = document.querySelector('.tab-container');
    if(tabContainer) {
        const tabLinks = tabContainer.querySelectorAll('.tab-link');
        const tabPanes = tabContainer.querySelectorAll('.tab-pane');

        tabLinks.forEach(link => {
            link.addEventListener('click', () => {
                const tabId = link.dataset.tab;
                
                tabLinks.forEach(l => l.classList.remove('active'));
                tabPanes.forEach(p => p.classList.remove('active'));

                link.classList.add('active');
                document.getElementById(tabId).classList.add('active');
            });
        });
    }
});


function renderBenchmarkCharts(diagnosis, benchmarkScores, userAnswers, allQuestions) {
    if (typeof Chart === 'undefined') { 
        console.error("Chart.js is not loaded."); 
        return { e: 50, s: 50, g: 50 }; // Chart.js가 없으면 기본값 반환
    }

    const catChartCanvas = document.getElementById('categoryBenchmarkChart');
    const qChartCanvas = document.getElementById('questionBenchmarkChart');
    const benchmarkInfoEl = document.getElementById('benchmarkIndustryInfo');

    if (!catChartCanvas || !qChartCanvas || !diagnosis) {
        return { e: 50, s: 50, g: 50 }; // 필수 요소가 없으면 기본값 반환
    }

    if (benchmarkInfoEl && diagnosis.industry_codes && diagnosis.industry_codes.length > 0) {
        benchmarkInfoEl.innerHTML = `<strong>적용 산업분류:</strong> [${diagnosis.industry_codes[0]}] ${diagnosis.industry_name || ''}`;
    }

    const categoryTotalScores = { e: 0, s: 0, g: 0 };
    const categoryQuestionCounts = { e: 0, s: 0, g: 0 };
    const questionsMap = new Map((allQuestions || []).map(q => [q.question_code, q.esg_category]));

    (benchmarkScores || []).forEach(scoreItem => {
        const category = (questionsMap.get(scoreItem.question_code) || '').toLowerCase();
        if (category && categoryTotalScores.hasOwnProperty(category)) {
            categoryTotalScores[category] += parseFloat(scoreItem.average_score) || 0;
            categoryQuestionCounts[category]++;
        }
    });

    const industryAverageScores = {
        e: categoryQuestionCounts.e > 0 ? categoryTotalScores.e / categoryQuestionCounts.e : 50,
        s: categoryQuestionCounts.s > 0 ? categoryTotalScores.s / categoryQuestionCounts.s : 50,
        g: categoryQuestionCounts.g > 0 ? categoryTotalScores.g / categoryQuestionCounts.g : 50
    };
    
    const datasets = [];
    if (diagnosis.diagnosis_type !== 'simple') {
        datasets.push({ label: '우리 회사', data: [diagnosis.e_score, diagnosis.s_score, diagnosis.g_score], backgroundColor: 'rgba(54, 162, 235, 0.7)' });
    }
    datasets.push({ label: '업계 평균', data: [industryAverageScores.e, industryAverageScores.s, industryAverageScores.g], backgroundColor: 'rgba(201, 203, 207, 0.7)' });

    new Chart(catChartCanvas, {
        type: 'bar',
        data: {
            labels: ['환경(E)', '사회(S)', '지배구조(G)'],
            datasets: datasets
        },
        options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100 } } }
    });

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
        return industryAverageScores; 
    }

    const lineChartDatasets = [{ label: '업계 평균', data: industryScores, borderColor: 'rgba(255, 99, 132, 1)', borderDash: [5, 5], tension: 0.1 }];
    if (diagnosis.diagnosis_type !== 'simple') {
        lineChartDatasets.unshift({ label: '우리 회사', data: userScores, borderColor: 'rgba(54, 162, 235, 1)', tension: 0.1 });
    }

    new Chart(qChartCanvas, {
        type: 'line',
        data: { 
            labels: labels, 
            datasets: lineChartDatasets
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
    
    return industryAverageScores;
}

function renderAiAnalysis(analysisData, userDiagnosis, industryAverages) {
    const container = document.getElementById('aiAnalysisContent');
    if (!container) return;

    // --- 1. '간이진단'일 경우, '비슷한 수준' 기준으로 텍스트 생성 ---
    if (userDiagnosis && userDiagnosis.diagnosis_type === 'simple') {
        if (!analysisData) {
            container.innerHTML = '<p>AI 분석 데이터를 불러올 수 없습니다.</p>';
            return;
        }
        const diff = analysisData.percentageDiff;
        const signedDiff = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
        
        const comparisonText = `업계 평균과 <strong>비슷한 수준입니다.</strong> <span style="font-size:0.9em; color:#555;">(업계 평균 대비 <strong>${signedDiff}%</strong>)</span>`;
        
        const categories = analysisData.recommendedCategories || [];
        const categoryText = categories.length > 0 
            ? `진단 결과에 따르면 <strong>${categories.map(cat => `'${cat}'`).join(', ')}</strong> 관련 분야에` 
            : '진단 결과에 따르면';

        const adviceText = `현재 산업군 및 지역의 핵심 이슈는 <strong>'${analysisData.industryMainIssue || '(분석 정보 없음)'}'</strong> 입니다. ${categoryText} 조금 더 집중하신다면, 경쟁사보다 앞서 나갈 수 있는 좋은 기회가 될 것입니다.`;

        container.innerHTML = `
            <p>${analysisData.userName}님의 ESG 경영 수준은 ${comparisonText}</p>
            <p>${adviceText}</p>
        `;
        return; // 간이진단 로직 종료
    }

    // --- 2. '정밀 진단'일 경우, 기존 분석 로직 수행 ---
    if (!analysisData) {
        container.innerHTML = '<p>AI 분석 데이터를 불러올 수 없습니다.</p>';
        return;
    }

    const diff = analysisData.percentageDiff;
    let comparisonText = '';
    let adviceText = '';
    const categories = analysisData.recommendedCategories || [];
    const categoryText = categories.length > 0 
        ? `특히 <strong>${categories.map(cat => `'${cat}'`).join(', ')}</strong> 분야에서` 
        : '';

    switch (analysisData.status) {
        case '우수':
            comparisonText = `업계 평균보다 약 <strong>${diff.toFixed(1)}% 우수합니다.</strong>`;
            adviceText = `현재 속하신 산업군에서는 <strong>'${analysisData.industryMainIssue}'</strong>, 주요 활동 지역에서는 <strong>'${analysisData.regionMainIssue}'</strong>(이)가 중요하게 다뤄지고 있습니다. 진단 결과, ${categoryText} 강점을 보이고 계십니다. 이러한 강점을 바탕으로 ESG 규제에 선제적으로 대응하여, 지속가능한 비즈니스 성장 기회를 적극적으로 모색해 보시길 바랍니다.`;
            break;
        case '부족':
            const signedDiffForLacking = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
            comparisonText = `업계 평균과 <strong>비슷한 수준입니다.</strong> <span style="font-size:0.9em; color:#555;">(업계 평균 대비 <strong>${signedDiffForLacking}%</strong>)</span>`;
            adviceText = `현재 속하신 산업군에서는 <strong>'${analysisData.industryMainIssue}'</strong>, 주요 활동 지역에서는 <strong>'${analysisData.regionMainIssue}'</strong>(이)가 중요하게 다뤄지고 있으니 주의가 필요합니다. 진단 결과, ${categoryText} 개선이 필요하며, 부족한 부분을 중심으로 규제 리스크를 줄이고 새로운 사업 기회를 발굴하는 전략을 추천합니다.`;
            break;
        default: // '보통'
            const signedDiffForSimilar = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
            comparisonText = `업계 평균과 <strong>비슷한 수준입니다.</strong> <span style="font-size:0.9em; color:#555;">(업계 평균 대비 <strong>${signedDiffForSimilar}%</strong>)</span>`;
            adviceText = `현재 산업군 및 지역의 핵심 이슈는 <strong>'${analysisData.industryMainIssue}'</strong> 입니다. 진단 결과에 따르면 ${categoryText} 관련 분야에 조금 더 집중하신다면, 경쟁사보다 앞서 나갈 수 있는 좋은 기회가 될 것입니다.`;
            break;
    }

    container.innerHTML = `
        <p>${analysisData.userName}님의 ESG 경영 수준은 ${comparisonText}</p>
        <p>${adviceText}</p>
    `;
}

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

function renderCompanySizeIssues(issueData, userCompanySizeCode) {
    const container = document.getElementById('companySizeIssuesSection'); 
    if (!container) return;

    const companySizeKorean = getCompanySizeName(userCompanySizeCode);
    
    let contentHtml = `<p class="tab-pane-description">${companySizeKorean} 기업이 일반적으로 중요하게 다루는 주요 ESG 이슈입니다.</p>`;

    if (issueData) {
        contentHtml += `
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
        contentHtml += `<p>귀사의 규모(${companySizeKorean})에 맞는 ESG 이슈 데이터가 없습니다.</p>`;
    }
    
    container.innerHTML = contentHtml;
}

function renderRegionalMapAndIssues(diagnosis, regionalIssues) {
    const container = document.getElementById('regionalIssuesContent'); 
    if (!container) return;

    const locationName = diagnosis.business_location_text || '지역 정보 없음';
    const mapFileName = diagnosis.business_location ? `${diagnosis.business_location}.jpg` : 'default.png';
    const mapImageUrl = `/images/maps/${mapFileName}`;
    
    const issuesByCategory = { E: [], S: [], G: [] };
    if (regionalIssues && regionalIssues.length > 0) {
        regionalIssues.forEach(issue => {
            if (issuesByCategory[issue.esg_category]) {
                issuesByCategory[issue.esg_category].push(issue.content);
            }
        });
    }

    const issuesHtml = ['E', 'S', 'G'].map(cat => {
        if (issuesByCategory[cat].length > 0) {
            const listItems = issuesByCategory[cat].map(item => `<li>${item}</li>`).join('');
            return `
                <div class="map-issue-item">
                    <strong class="map-issue-badge badge-${cat}">${cat}</strong>
                    <ul>${listItems}</ul>
                </div>
            `;
        }
        return ''; 
    }).join('');

    container.innerHTML = `
        <div class="regional-issue-grid">
            <div class="regional-issue-left">
                <div class="regional-map-container">
                    <img src="${mapImageUrl}" alt="${locationName} 지도">
                </div>
                <div class="luris-link-box">
                    <p>
                        소재지: <strong>${locationName}</strong><br>
                        아래 버튼을 눌러 이동하신 후, 지도에서 <strong>'${locationName}'</strong>를 클릭하여 상세 정보를 확인하세요.
                    </p>
                    <a href="https://www.laiis.go.kr/lips/mlo/wco/wholeCountryList.do" target="_blank" class="button-secondary">
                        토지이용규제정보서비스 (LURIS) 바로가기
                    </a>
                </div>
            </div>
            <div class="regional-issue-right">
                <div class="regional-issue-list">
                    <h4>주요 현안</h4>
                    ${issuesHtml || '<p>해당 지역의 주요 현안 정보가 없습니다.</p>'}
                </div>
            </div>
        </div>
    `;
}

function renderTasksAndAnalysis(priorityPrograms, enginePrograms, allSolutionCategories) {
    const priorityContainer = document.getElementById('priorityTaskContainer');
    const engineContainer = document.getElementById('taskAnalysisContainer');
    
    if (!priorityContainer || !engineContainer) return;

    const categoryDescriptionMap = new Map((allSolutionCategories || []).map(cat => [cat.category_name, cat.description]));

    // --- 1. 우선 추천 프로그램 렌더링 ---
    if (priorityPrograms && priorityPrograms.length > 0) {
        let priorityHtml = `
            <div class="strategy-section">
                <h3>⭐ 추천 단체 제안 프로그램</h3>
                <div class="solution-card-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 25px;">
        `;
        
        priorityPrograms.forEach(program => {
            const mainEsgCategory = program.esg_category || 'E';
            priorityHtml += `
                <div class="solution-card category-${mainEsgCategory}">
                    <h4 class="solution-category-title">${program.title}</h4>
                    <p class="solution-category-description">${program.program_overview || '프로그램 개요가 없습니다.'}</p>
                    <a href="esg_program_detail.html?id=${program.id}&from=strategy&diagId=${new URLSearchParams(window.location.search).get('diagId')}" target="_blank" class="button-primary">자세히 보기</a>
                </div>
            `;
        });

        priorityHtml += `</div></div>`;
        priorityContainer.innerHTML = priorityHtml;
    } else {
        priorityContainer.innerHTML = ''; 
    }

    // --- 2. 엔진 추천 프로그램 렌더링 ---
    if (!enginePrograms || enginePrograms.length === 0) {
        engineContainer.innerHTML = '<div class="solution-card" style="text-align: center;"><h4 class="solution-category-title">👍 훌륭합니다!</h4><p>현재 진단 결과, AI가 추천하는 시급한 개선 과제는 없습니다.</p></div>';
        return;
    }

    const groupedPrograms = enginePrograms.reduce((acc, program) => {
        const categories = program.solution_categories || ['기타'];
        categories.forEach(category => {
            if (!acc[category]) acc[category] = [];
            if (!acc[category].some(p => p.id === program.id)) acc[category].push(program);
        });
        return acc;
    }, {});

    let engineHtml = '';
    for (const category in groupedPrograms) {
        const categoryPrograms = groupedPrograms[category];
        const description = categoryDescriptionMap.get(category) || `${category} 관련 개선이 필요합니다.`;
        const mainEsgCategory = categoryPrograms[0]?.esg_category || 'E';
        const riskSummaries = [...new Set(categoryPrograms.map(p => p.risk_text).filter(Boolean))];
        const programLinks = categoryPrograms.map(p => `<li><a href="esg_program_detail.html?id=${p.id}&from=strategy&diagId=${new URLSearchParams(window.location.search).get('diagId')}" target="_blank">${p.title}</a></li>`).join('');

        engineHtml += `
            <div class="solution-card category-${mainEsgCategory}">
                <h4 class="solution-category-title">${category}</h4>
                <p class="solution-category-description">${description.substring(0, 100)}${description.length > 100 ? '...' : ''}</p>
                <div class="solution-card-content">
                    <div>
                        <h5>추천 프로그램</h5>
                        <ul class="solution-program-list">${programLinks}</ul>
                    </div>
                </div>
                <div class="details-on-hover">
                    <h4>${category}</h4>
                    <p>${description}</p>
                    <h5>주요 리스크</h5>
                    <ul class="solution-risk-list">
                        ${riskSummaries.length > 0 ? riskSummaries.map(risk => `<li>${risk}</li>`).join('') : '<li>-</li>'}
                    </ul>
                </div>
            </div>
        `;
    }
    engineContainer.innerHTML = engineHtml;
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

function renderCategoriesModal(allSolutionCategories) {
    const accordionContainer = document.getElementById('categories-accordion');
    if (!accordionContainer) return;

    const grouped = allSolutionCategories.reduce((acc, cat) => {
        const parent = cat.parent_category;
        if (!acc[parent]) {
            acc[parent] = [];
        }
        acc[parent].push(cat);
        return acc;
    }, {});

    let accordionHtml = '';

    const parentCategoryNames = { E: '환경', S: '사회', G: '지배구조' };

    for (const parent of ['E', 'S', 'G']) {
        if (grouped[parent]) {
            accordionHtml += `
                <div class="accordion-item">
                    <div class="accordion-header">${parentCategoryNames[parent]}(${parent})</div>
                    <div class="accordion-panel">
                        ${grouped[parent].map(cat => `
                            <div class="category-detail-item">
                                <strong>${cat.category_name}</strong>
                                <p>${cat.description || '세부 설명이 등록되지 않았습니다.'}</p>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }
    accordionContainer.innerHTML = accordionHtml;
}