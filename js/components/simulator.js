/**
 * 지정된 컨테이너에 예산 편성 시뮬레이터의 HTML을 로드하고 모든 기능을 초기화하는 함수
 * @param {string} containerSelector - 시뮬레이터가 삽입될 부모 요소의 CSS 선택자
 * @param {function} onLoadedCallback - (선택 사항) 모든 초기화가 완료된 후 실행될 콜백 함수
 */
function initializeSimulator(containerSelector, onLoadedCallback) {
    const container = document.querySelector(containerSelector);
    if (!container) {
        console.error(`시뮬레이터 컨테이너(${containerSelector})를 찾을 수 없습니다.`);
        return;
    }

    fetch('components/simulator.html')
        .then(response => {
            if (!response.ok) throw new Error("components/simulator.html 파일을 찾을 수 없습니다.");
            return response.text();
        })
        .then(html => {
            const closeButton = container.querySelector('.close-button');
            container.innerHTML = ''; 
            if(closeButton) container.appendChild(closeButton);
            container.insertAdjacentHTML('beforeend', html);
            setupSimulatorLogic(container);
            if (typeof onLoadedCallback === 'function') {
                onLoadedCallback();
            }
        })
        .catch(error => console.error('시뮬레이터 컴포넌트 로딩 중 오류 발생:', error));
}


/**
 * 시뮬레이터의 모든 이벤트와 계산 로직을 설정하는 내부 함수
 * @param {HTMLElement} container - 시뮬레이터의 최상위 컨테이너 요소
 */
function setupSimulatorLogic(container) {
    // --- 1. DOM 요소 가져오기 ---
    const simRevenueEl = container.querySelector('#simCurrentRevenue');
    const simOpProfitEl = container.querySelector('#simCurrentOpProfit');
    const simCurrentDonationEl = container.querySelector('#simCurrentDonation');
    const simTargetDonationEl = container.querySelector('#simTargetDonation');
    const simDisabledMandatoryCountEl = container.querySelector('#simDisabledMandatoryCount');
    const simActualDisabledCountEl = container.querySelector('#simActualDisabledCount');
    const disabilityInputsContainer = container.querySelector('#disabilityInputsContainer');
    
    const runSimulationBtn = container.querySelector('#runBudgetSimulationBtn');
    const resultsContainerDiv = container.querySelector('#budgetSimulationResultsAndOptionalInputs');
    const simulationResultsTableBodyEl = container.querySelector('#simulationResultsTableBody');
    const costSavingEffectsTableBodyEl = container.querySelector('#costSavingEffectsTableBody');
    const totalCostSavingEffectEl = container.querySelector('#totalCostSavingEffect');
    const optionalEffectsTableBodyEl = container.querySelector('#optionalEffectsTableBody');
    const recommendedDonationDiv = container.querySelector('#recommendedDonationSection');
    const refDonationTaxReductionEl = container.querySelector('#refDonationTaxReduction');
    const refDonationMaxDeductibleEl = container.querySelector('#refDonationMaxDeductible');
    const recDonationVsRevenueEl = container.querySelector('#recDonationVsRevenue');
    const minDonationVsOpProfitEl = container.querySelector('#minDonationVsOpProfit');
    
    const myPlanContainer = container.querySelector('#myPlanContainer');
    const myPlanItemsGrid = container.querySelector('#my-plan-items-grid');
    const myPlanTotalCostEl = container.querySelector('#my-plan-total-cost');
    
    const totalEconomicEffectBoxEl = container.querySelector('#totalEconomicEffectBox');
    const totalEconomicEffectValueEl = container.querySelector('#totalEconomicEffectValue');
    
    // --- 2. '내 플랜' 관련 함수 ---
    function displayMyPlan() {
        if (!myPlanContainer) return;
        const myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];

        const hasDisabilityProgram = myPlan.some(p => p.id === 'program-disability');
        if (disabilityInputsContainer) {
            disabilityInputsContainer.style.display = hasDisabilityProgram ? 'block' : 'none';
        }

        myPlanContainer.style.display = 'block';
        myPlanItemsGrid.innerHTML = '';
        let totalCost = 0;

        if (myPlan.length > 0) {
            myPlan.forEach(program => {
                const itemBox = document.createElement('div');
                itemBox.className = 'plan-item-box';
                const costInEok = (program.cost / 100000000).toFixed(2);
                totalCost += program.cost;
                itemBox.innerHTML = `<div class="title-cost-wrapper"><div class="title">${program.title}</div><div class="cost">${costInEok} 억원</div></div><button type="button" class="remove-btn" data-program-id="${program.id}" title="플랜에서 제거">&times;</button>`;
                myPlanItemsGrid.appendChild(itemBox);
            });
        } else {
            myPlanItemsGrid.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: #888; font-size: 0.9em;">아직 추가된 플랜이 없습니다. 프로그램 상세 페이지에서 플랜을 추가해보세요.</p>';
        }

        const totalCostInEok = (totalCost / 100000000);
        myPlanTotalCostEl.textContent = totalCostInEok.toFixed(2);
        simTargetDonationEl.value = totalCostInEok.toFixed(2);
    }
    
    if (myPlanItemsGrid) {
        myPlanItemsGrid.addEventListener('click', function(e) {
            if (e.target.matches('.remove-btn')) {
                const programIdToRemove = e.target.dataset.programId;
                let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
                myPlan = myPlan.filter(p => p.id !== programIdToRemove);
                localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
                displayMyPlan();
                if(resultsContainerDiv && resultsContainerDiv.style.display === 'block') {
                    runSimulationBtn.click();
                }
            }
        });
    }

    // --- 3. 핵심 로직 함수들 ---
    function prefillSimulatorInputs() {
        const surveyStep1InfoString = localStorage.getItem('surveyStep1CompanyInfo');
        let employeeCount = 0;
        if (surveyStep1InfoString) {
            try {
                const companyInfo = JSON.parse(surveyStep1InfoString);
                employeeCount = parseInt(companyInfo.employeeCount) || 0;
                if(simRevenueEl) simRevenueEl.value = companyInfo.annualRevenue || '';
                if(simOpProfitEl) simOpProfitEl.value = companyInfo.operatingProfit || '';
                if(simDisabledMandatoryCountEl) simDisabledMandatoryCountEl.value = (employeeCount >= 50) ? Math.floor(employeeCount * 0.031) : 0;
            } catch (e) { console.error("기업 정보 파싱 오류:", e); }
        }
        
        const surveyResultsString = localStorage.getItem('esgFinalResults');
        if (surveyResultsString) {
            try {
                const surveyResults = JSON.parse(surveyResultsString);
                if (surveyResults.rawAnswers?.["Q9_2"]) {
                    if(simCurrentDonationEl) simCurrentDonationEl.value = surveyResults.rawAnswers["Q9_2"].answerValue || '';
                }
                if (surveyResults.rawAnswers?.["Q6_1"] && employeeCount > 0) {
                    const disabledRatio = parseFloat(surveyResults.rawAnswers["Q6_1"].answerValue) || 0;
                    if(simActualDisabledCountEl) simActualDisabledCountEl.value = Math.floor(employeeCount * (disabledRatio / 100));
                }
            } catch (e) { console.error("진단 결과 파싱 오류:", e); }
        }
        displayMyPlan();
        calculateAndDisplayRecommendedDonations();
    }
    
    function calculateAndDisplayRecommendedDonations() {
        const opProfit = parseFloat(simOpProfitEl.value) || 0;
        const revenue = parseFloat(simRevenueEl.value) || 0;
        if (!recommendedDonationDiv) return;
        
        let donationTaxReduction = 0;
        if (opProfit > 200) { donationTaxReduction = (opProfit <= 3000) ? opProfit - 200 : opProfit - 3000; }
        else if (opProfit > 2) { donationTaxReduction = opProfit - 2; }
        donationTaxReduction = Math.max(0, donationTaxReduction);
        
        let applicableTaxRate = 0;
        if (opProfit <= 2) { applicableTaxRate = 11; } 
        else if (opProfit <= 200) { applicableTaxRate = 22; } 
        else if (opProfit <= 3000) { applicableTaxRate = 24.2; } 
        else { applicableTaxRate = 27.5; }
        
        const donationMaxDeductible = opProfit > 0 ? opProfit * (applicableTaxRate / 100) : 0;
        const donationVsRevenueGuide = revenue > 0 ? revenue * 0.01 : 0; 
        const minDonationVsOpProfitGuide = opProfit > 0 ? Math.max(0.5, opProfit * 0.012) : 0.5;
        
        if(refDonationTaxReductionEl) refDonationTaxReductionEl.textContent = donationTaxReduction.toFixed(2);
        if(refDonationMaxDeductibleEl) refDonationMaxDeductibleEl.textContent = donationMaxDeductible.toFixed(2);
        if(recDonationVsRevenueEl) recDonationVsRevenueEl.textContent = donationVsRevenueGuide.toFixed(2);
        if(minDonationVsOpProfitEl) minDonationVsOpProfitEl.textContent = minDonationVsOpProfitGuide.toFixed(2);
    }

    if (runSimulationBtn) {
        runSimulationBtn.onclick = function() {
            // 1. 기본 변수 및 계산
            const revenue = parseFloat(simRevenueEl.value) || 0;
            const opProfit = parseFloat(simOpProfitEl.value) || 0;
            const targetDonation = parseFloat(simTargetDonationEl.value) || 0;
            if (opProfit <= 0 && targetDonation > 0) { alert("영업이익은 0보다 커야 계산이 의미있습니다."); return; }

            const myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
            const hasDisabilityProgram = myPlan.some(program => program.id === 'program-disability');

            let taxRate = 0;
            if (opProfit <= 2) { taxRate = 9.9; } 
            else if (opProfit <= 200) { taxRate = 20.9; } 
            else if (opProfit <= 3000) { taxRate = 23.1; } 
            else { taxRate = 26.4; }
            
            const recognized = Math.min(targetDonation, opProfit > 0 ? opProfit * 0.1 : 0);
            const taxReduction = recognized * (taxRate / 100);
            
            const guide = revenue > 0 ? revenue * 0.01 : 0.00001;
            const esgAddition = isFinite((revenue * 0.005) * (targetDonation / guide)) ? (revenue * 0.005) * (targetDonation / guide) : 0;
            const trustEffect = isFinite((revenue / opProfit) * (targetDonation / guide) * 0.005) ? (revenue / opProfit) * (targetDonation / guide) * 0.005 : 0;
            const marketingEffect = targetDonation * 0.1;
            
            let disabledEmploymentEffect = 0, shortfall = 0;
            if (hasDisabilityProgram) {
                const mandatoryCount = parseFloat(simDisabledMandatoryCountEl.value) || 0;
                const actualCount = parseFloat(simActualDisabledCountEl.value) || 0;
                shortfall = Math.max(0, mandatoryCount - actualCount);
                disabledEmploymentEffect = shortfall * 12 * 1239000 / 100000000;
            }

            // 2. 각 테이블 내용 채우기
            calculateAndDisplayRecommendedDonations();

            if(simulationResultsTableBodyEl) {
                simulationResultsTableBodyEl.innerHTML = `
                    <tr><td>적용세율 (%)</td><td class="amount-cell">${taxRate.toFixed(1)} %</td></tr>
                    <tr><td>손금산입 인정 기부금 (억원)</td><td class="amount-cell">${recognized.toFixed(2)}</td></tr>
                    <tr><td>총 절감 세액 (억원)</td><td class="amount-cell">${taxReduction.toFixed(2)}</td></tr>`;
            }

            const costSavingItems = [
                { label: "총 절감 세액 (억원)", effect: taxReduction, description: "목표 기부금액 기준 자동계산결과에 따른 예상 절감 세액" },
                { label: "지역협력활동 ESG가산 (추정치)", effect: esgAddition, description: "ESG활동으로 매출증가효과(공공사업가산, 가이던스기관DB)" },
                { label: "홍보비 절감효과(기부액 대비)", effect: marketingEffect, description: "ESG마케팅 활용(Gartner <2024 CMO 지출 조사>)" },
                { label: "소비자신뢰도 향상(기부액 대비)", effect: trustEffect, description: "매출증가효과(기부금대비)에 따른 소비자신뢰도 향상효과(Gartner <2024 CMO 지출 조사>)" }
            ];
            
            let totalCostSaving = 0;
            if (costSavingEffectsTableBodyEl) {
                costSavingEffectsTableBodyEl.innerHTML = '';
                costSavingItems.forEach(item => {
                    const row = costSavingEffectsTableBodyEl.insertRow();
                    row.insertCell().textContent = item.label;
                    const effectCell = row.insertCell();
                    effectCell.textContent = item.effect.toFixed(2);
                    effectCell.className = 'amount-cell';
                    row.insertCell().textContent = item.description || '';
                    totalCostSaving += item.effect;
                });
                if (totalCostSavingEffectEl) totalCostSavingEffectEl.textContent = totalCostSaving.toFixed(2);
            }

            if (optionalEffectsTableBodyEl) {
                optionalEffectsTableBodyEl.innerHTML = '';
                if (hasDisabilityProgram) {
                    const row = optionalEffectsTableBodyEl.insertRow();
                    row.insertCell().textContent = "장애인 고용효과";
                    const effectCell = row.insertCell();
                    effectCell.textContent = disabledEmploymentEffect.toFixed(2);
                    effectCell.className = 'amount-cell';
                    const descCell = row.insertCell();
                    descCell.textContent = `의무고용 미달인원(${shortfall.toFixed(0)}명) 기준 연간 부담금 절감 추정치`;
                    descCell.className = 'description-cell';
                }
            }

            // 3. '총 경제적 기대효과' 계산 및 표시
            const totalEconomicEffect = totalCostSaving + disabledEmploymentEffect;
            if (totalEconomicEffectBoxEl && totalEconomicEffectValueEl) {
                totalEconomicEffectValueEl.textContent = totalEconomicEffect.toFixed(2);
                totalEconomicEffectBoxEl.style.display = 'block';
            }
            
            // 4. 모든 결과 영역 표시
            if(resultsContainerDiv) resultsContainerDiv.style.display = 'block';
        };
    }
    
    // --- 4. 초기화 ---
    prefillSimulatorInputs();
}