// js/function_simulator.js (2025-06-29 17:10:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('locallink-token');
    
    // --- 1. 페이지 요소 찾기 ---
    const elements = {
        loading: document.getElementById('loadingMessage'),
        content: document.getElementById('simulatorContent'),
        revenue: document.getElementById('simCurrentRevenue'),
        opProfit: document.getElementById('simCurrentOpProfit'),
        currentDonation: document.getElementById('simCurrentDonation'),
        targetDonation: document.getElementById('simTargetDonation'),
        runBtn: document.getElementById('runBudgetSimulationBtn'),
        planContainer: document.getElementById('myPlanContainer'),
        planItemsGrid: document.getElementById('my-plan-items-grid'),
        planTotalCost: document.getElementById('my-plan-total-cost'),
        referenceSection: document.getElementById('referenceSection'),
        refDonationTax: document.getElementById('refDonationTaxReduction'),
        refDonationDeduct: document.getElementById('refDonationMaxDeductible'),
        refDonationVsRevenue: document.getElementById('recDonationVsRevenue'),
        refDonationVsOpProfit: document.getElementById('minDonationVsOpProfit'),
        resultsSection: document.getElementById('simulationResults'),
        autoCalcTableBody: document.getElementById('autoCalculationResultTableBody'),
        costSavingEffectsTableBody: document.getElementById('costSavingEffectsTableBody'),
        totalCostSavingEffectValue: document.getElementById('totalCostSavingEffectValue'),
        optionalEffectsTableBody: document.getElementById('optionalEffectsTableBody'),
        totalEconomicEffectBox: document.getElementById('totalEconomicEffectBox'),
        totalEconomicEffectValue: document.getElementById('totalEconomicEffectValue'),
    };
    
    let simParams = {};
    let planPrograms = [];

    /**
     * 파일명: js/function_simulator.js
     * 수정 위치: initializePage 함수 전체
     * 수정 일시: 2025-07-06 08:49
     */
    async function initializePage() {
        if (!token) {
            elements.loading.innerHTML = '<h2>로그인이 필요합니다.</h2><a href="main_login.html">로그인 페이지로 이동</a>';
            return;
        }
        try {
            const myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
            
            // ★★★ Set을 사용하여 중복된 프로그램 ID를 제거합니다. ★★★
            const uniqueProgramIds = [...new Set(myPlan.map(p => p.id))];

            const [paramsRes, programsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/simulator/parameters`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/programs/batch-details`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ programIds: uniqueProgramIds }) // 중복이 제거된 ID 목록으로 요청
                })
            ]);
            
            const paramsResult = await paramsRes.json();
            if (paramsResult.success) simParams = paramsResult.parameters; else throw new Error('시뮬레이터 매개변수 로딩 실패');
            
            const programsResult = await programsRes.json();
            if (programsResult.success) planPrograms = programsResult.programs; else throw new Error('플랜 프로그램 정보 로딩 실패');
            
            displayMyPlan(myPlan);
            prefillInputsFromStorage();
            attachEventListeners();
            elements.loading.style.display = 'none';
            elements.content.classList.remove('hidden');
        } catch (error) {
            elements.loading.innerHTML = `<h2>오류</h2><p>시뮬레이터 초기화에 실패했습니다: ${error.message}</p>`;
        }
    }

    // --- 3. 기능 함수들 ---
    function displayMyPlan(myPlan) {
        if(!elements.planContainer) return;
        let totalCost = 0;
        elements.planItemsGrid.innerHTML = '';
        if (myPlan.length > 0) {
            myPlan.forEach(program => {
                totalCost += 30000000;
                const itemBox = document.createElement('div');
                itemBox.className = 'plan-item-box';
                itemBox.innerHTML = `<span>${program.title}</span><button type="button" class="remove-btn" data-program-id="${program.id}" title="플랜에서 제거">&times;</button>`;
                elements.planItemsGrid.appendChild(itemBox);
            });
            elements.planContainer.style.display = 'block';
        } else {
            elements.planContainer.style.display = 'none';
        }
        const totalCostInEok = totalCost / 100000000;
        elements.planTotalCost.textContent = totalCostInEok.toFixed(2);
        elements.targetDonation.value = totalCostInEok > 0 ? totalCostInEok.toFixed(2) : '';
    }

    function prefillInputsFromStorage() {
        const diagDataStr = sessionStorage.getItem('latestDiagnosisData');
        if (!diagDataStr) {
            console.warn('세션에 진단 데이터가 없습니다.');
            calculateAndDisplayReferenceDonations();
            return;
        }

        try {
            const diagData = JSON.parse(diagDataStr);
            if (diagData) {
                elements.revenue.value = diagData.recent_sales ? (diagData.recent_sales / 100000000).toFixed(2) : '';
                elements.opProfit.value = diagData.recent_operating_profit ? (diagData.recent_operating_profit / 100000000).toFixed(2) : '';
            }
        } catch (e) {
            console.error("저장된 진단 데이터 파싱 오류:", e);
        }
        
        calculateAndDisplayReferenceDonations();
    }
    
    // 참고기부금 관련 계산 및 표시
    function calculateAndDisplayReferenceDonations() {
        if (!elements.referenceSection) return;
        const opProfit = parseFloat(elements.opProfit.value) || 0;
        const revenue = parseFloat(elements.revenue.value) || 0;

        // 1. 참고기부금 (세율하향용) 계산
        let donationForTaxRate = 0;
        const taxBase2 = simParams.corp_tax_base_tier2 || 200;
        const taxBase3 = simParams.corp_tax_base_tier3 || 3000;
        const taxBase1 = simParams.corp_tax_base_tier1 || 2;
        if (opProfit > taxBase2) {
            donationForTaxRate = (opProfit <= taxBase3) ? opProfit - taxBase2 : opProfit - taxBase3;
        } else if (opProfit > taxBase1) {
            donationForTaxRate = opProfit - taxBase1;
        }
        elements.refDonationTax.textContent = Math.max(0, donationForTaxRate).toFixed(2);

        // 2. 참고기부금 (MAX손금산입) 계산: 영업이익 * 50%
        const maxDeductibleRatio = simParams.donation_deduction_limit_max_ref || 0.5;
        elements.refDonationDeduct.textContent = (opProfit * maxDeductibleRatio).toFixed(2);
        
        // 3. 추천기부금 (국제기준, 매출대비) 계산: 매출액 * 1%
        const recRevenueRatio = simParams.donation_ratio_revenue_intl || 0.01;
        elements.refDonationVsRevenue.textContent = (revenue * recRevenueRatio).toFixed(2);
        
        // 4. 최소기부금 (가이드라인, 영업이익대비) 계산
        const minDonationAmount = simParams.donation_min_amount || 0.5;
        const minOpProfitRatio = simParams.donation_ratio_op_profit_guide || 0.012;
        elements.refDonationVsOpProfit.textContent = Math.max(minDonationAmount, opProfit * minOpProfitRatio).toFixed(2);
        
        elements.referenceSection.style.display = 'block';
    }
    
    // '계산하기' 버튼 클릭 시 모든 시뮬레이션 로직을 실행하는 함수     
    function runSimulation() {
        const revenue = parseFloat(elements.revenue.value) || 0;
        const opProfit = parseFloat(elements.opProfit.value) || 0;
        const targetDonation = parseFloat(elements.targetDonation.value) || 0;

        if (opProfit <= 0 && targetDonation > 0) {
            alert("영업이익은 0보다 커야 계산이 의미있습니다.");
            return;
        }

        // --- 2. [자동계산 결과] 계산 ---
        let taxRate = 0;
        if (opProfit <= (simParams.tax_base_tier1 || 2)) { taxRate = simParams.tax_rate_tier1 || 9.9; } 
        else if (opProfit <= (simParams.tax_base_tier2 || 200)) { taxRate = simParams.tax_rate_tier2 || 20.9; } 
        else if (opProfit <= (simParams.tax_base_tier3 || 3000)) { taxRate = simParams.tax_rate_tier3 || 23.1; } 
        else { taxRate = simParams.tax_rate_tier4 || 26.4; }
        
        const deductibleLimitRatio = simParams.donation_deduction_limit_op_profit || 0.5;
        const deductibleLimit = opProfit * deductibleLimitRatio;
        const recognizedDonation = Math.min(targetDonation, deductibleLimit);
        const taxBaseBeforeDonation = opProfit;
        const taxBaseAfterDonation = opProfit - recognizedDonation;
        const corpTaxBefore = taxBaseBeforeDonation * (taxRate / 100);
        const corpTaxAfter = taxBaseAfterDonation * (taxRate / 100);
        const corpTaxSaving = corpTaxBefore - corpTaxAfter;
        const localTaxSaving = corpTaxSaving * (simParams.local_tax_rate || 0.1);
        const totalTaxSaving = corpTaxSaving + localTaxSaving;

        // ★ 1. [자동계산 결과] 표시 항목 수정 ★
        elements.autoCalcTableBody.innerHTML = `
            <tr><th>적용세율 (%)</th><td class="amount-cell">${taxRate.toFixed(1)} %</td></tr>
            <tr><th>손금산입 인정 기부금</th><td class="amount-cell">${recognizedDonation.toFixed(2)} 억원</td></tr>
            <tr><th>기부전 과세표준</th><td class="amount-cell">${taxBaseBeforeDonation.toFixed(2)} 억원</td></tr>
            <tr><th>기부후 과세표준</th><td class="amount-cell">${taxBaseAfterDonation.toFixed(2)} 억원</td></tr>
            <tr><th>법인세(기부전)</th><td class="amount-cell">${corpTaxBefore.toFixed(2)} 억원</td></tr>
            <tr><th>법인세(기부후)</th><td class="amount-cell">${corpTaxAfter.toFixed(2)} 억원</td></tr>
            <tr><th>지방세 절감액</th><td class="amount-cell">${localTaxSaving.toFixed(2)} 억원</td></tr>
            <tr><th>총 절감 세액</th><td class="amount-cell">${totalTaxSaving.toFixed(2)} 억원</td></tr>
        `;

        // --- 3. [비용절감 효과] 계산 및 표시 (컬럼 수정) ---
        const esgBonusRatio = simParams.esg_bonus_ratio || 0.005;
        const marketingEffectRatio = simParams.marketing_effect_ratio || 0.1;
        const trustCoefficient = simParams.trust_coefficient || 0.005;
        const referenceDonationForCalc = revenue * (simParams.donation_ratio_revenue_intl || 0.01);
        
        const esgActivityEffect = (referenceDonationForCalc > 0) ? (revenue * esgBonusRatio) * (targetDonation / referenceDonationForCalc) : 0;
        const marketingEffect = targetDonation * marketingEffectRatio;
        const trustEffect = (opProfit > 0 && referenceDonationForCalc > 0) ? (revenue / opProfit) * (targetDonation / referenceDonationForCalc) * trustCoefficient : 0;
        
        elements.costSavingEffectsTableBody.innerHTML = `
            <tr><td>ESG활동 기대효과(추정치)</td><td class="amount-cell">${esgActivityEffect.toFixed(2)}</td></tr>
            <tr><td>ESG활동 마케팅 효과</td><td class="amount-cell">${marketingEffect.toFixed(2)}</td></tr>
            <tr><td>기업신뢰도 향상</td><td class="amount-cell">${trustEffect.toFixed(2)}</td></tr>
        `;

        // --- 3. [플랜수행에 따른 기대효과] 계산 ★★★ 로직 수정 ★★★
        let optionalEffectsHtml = ''; // 매번 계산 시 변수를 초기화합니다.
        let totalOptionalEffect = 0;
        
        planPrograms.forEach(program => {
            const unitEffectObj = program.economic_effects?.find(e => e.type === 'unit_effect');
            if (unitEffectObj && unitEffectObj.value > 0) {
                const effectValueInEok = (targetDonation * unitEffectObj.value) / 100000000;
                totalOptionalEffect += effectValueInEok;
                
                // 중복되던 부분을 삭제하고, 하나의 tr만 생성하도록 수정합니다.
                optionalEffectsHtml += `
                    <tr>
                        <td>${program.title}</td>
                        <td class="amount-cell">${effectValueInEok.toFixed(2)}</td>
                        <td class="description-cell">${unitEffectObj.description || '-'}</td>
                    </tr>
                `;
            }
        });
        elements.optionalEffectsTableBody.innerHTML = optionalEffectsHtml || '<tr><td colspan="3" style="text-align:center;">선택된 플랜에 해당하는 기대효과가 없습니다.</td></tr>';
        
        // --- 5. 최종 합계 및 결과 표시 ---
        const totalEconomicEffect = totalTaxSaving + esgActivityEffect + marketingEffect + trustEffect + totalOptionalEffect;
        elements.totalEconomicEffectValue.textContent = totalEconomicEffect.toFixed(2);
        elements.resultsSection.style.display = 'block';
    }

    // --- 4. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if(elements.runBtn) elements.runBtn.addEventListener('click', runSimulation);
        if(elements.planItemsGrid) {
            elements.planItemsGrid.addEventListener('click', e => {
                if (e.target.matches('.remove-btn')) {
                    const programIdToRemove = e.target.dataset.programId;
                    let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
                    myPlan = myPlan.filter(p => p.id != programIdToRemove);
                    localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
                    window.location.reload();
                }
            });
        }
        if(elements.revenue) elements.revenue.addEventListener('input', calculateAndDisplayReferenceDonations);
        if(elements.opProfit) elements.opProfit.addEventListener('input', calculateAndDisplayReferenceDonations);
    }

    // --- 5. 페이지 실행 ---
    initializePage();
});