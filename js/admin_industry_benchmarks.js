// js/admin_industry_benchmarks.js (2025-06-25 14:20:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const token = localStorage.getItem('locallink-token');

    // 페이지 초기화
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin']);
        if (!hasPermission) return;
        
        loadAndRenderData();
        attachEventListeners();
    }

    // 데이터 로딩 및 테이블 렌더링
    async function loadAndRenderData() {
        const loadingEl = document.getElementById('loadingMessage');
        const tableContainerEl = document.getElementById('tableContainer');
        loadingEl.textContent = '데이터를 불러오는 중입니다...';
        loadingEl.style.display = 'block';
        tableContainerEl.classList.add('hidden');

        try {
            const [scoresRes, questionsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/benchmark-scores`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/survey/simple`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);
            const scoresResult = await scoresRes.json();
            const questionsResult = await questionsRes.json();

            if (!scoresResult.success || !questionsResult.success) throw new Error('데이터 로딩 실패');
            
            const simpleQuestions = questionsResult.questions.sort((a,b) => a.display_order - b.display_order);
            const pivotData = {};
            scoresResult.scores.forEach(score => {
                if (!pivotData[score.industry_code]) {
                    pivotData[score.industry_code] = { industry_name: score.industry_name, scores: {} };
                }
                pivotData[score.industry_code].scores[score.question_code] = { id: score.id, score: score.average_score };
            });
            renderBenchmarkTable(pivotData, simpleQuestions);

        } catch (error) {
            loadingEl.textContent = `오류: ${error.message}`;
        }
    }

    // 피벗 테이블을 그리는 함수
    function renderBenchmarkTable(pivotData, questions) {
        const tableHeadEl = document.getElementById('benchmarksTableHead');
        const tableBodyEl = document.getElementById('benchmarksTableBody');

        let headerHTML = '<tr><th>산업</th>';
        questions.forEach(q => {
            headerHTML += `<th title="${q.question_text}">${q.question_code}</th>`;
        });
        headerHTML += '<th>관리</th></tr>';
        tableHeadEl.innerHTML = headerHTML;

        tableBodyEl.innerHTML = '';
        for (const industryCode in pivotData) {
            const industryData = pivotData[industryCode];
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = `[${industryCode}] ${industryData.industry_name}`;
            
            questions.forEach(q => {
                const cell = row.insertCell();
                const scoreData = industryData.scores[q.question_code];
                if (scoreData) {
                    cell.innerHTML = `<input type="number" value="${parseFloat(scoreData.score).toFixed(1)}" data-id="${scoreData.id}">`;
                } else {
                    cell.innerHTML = `<span>N/A</span>`; // 계산된 데이터가 없는 경우
                }
            });
            const actionCell = row.insertCell();
            actionCell.className = 'action-cell';
            actionCell.innerHTML = `<button class="button-primary button-sm save-row-btn">행 저장</button>`;
        }
        
        document.getElementById('loadingMessage').style.display = 'none';
        document.getElementById('tableContainer').classList.remove('hidden');
    }
    
    // 이벤트 리스너 연결
    function attachEventListeners() {
        const calcBtn = document.getElementById('calculateBenchmarksBtn');
        calcBtn.addEventListener('click', async () => {
            if(!confirm('모든 산업의 평균 점수를 다시 계산하시겠습니까? (시간이 다소 걸릴 수 있습니다)')) return;
            
            calcBtn.disabled = true;
            calcBtn.textContent = '계산 중...';
            try {
                const response = await fetch(`${API_BASE_URL}/admin/benchmarks/calculate`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
                const result = await response.json();
                alert(result.message);
                if(result.success) loadAndRenderData();
            } catch (err) {
                alert('계산 중 오류가 발생했습니다.');
            } finally {
                calcBtn.disabled = false;
                calcBtn.textContent = '산업 평균 점수 전체 계산';
            }
        });

        const tableBodyEl = document.getElementById('benchmarksTableBody');
        tableBodyEl.addEventListener('click', async (e) => {
            if (e.target.classList.contains('save-row-btn')) {
                const row = e.target.closest('tr');
                const inputs = row.querySelectorAll('input[type="number"]');
                let updateCount = 0;
                
                const updatePromises = Array.from(inputs).map(input => {
                    const id = input.dataset.id;
                    const score = input.value;
                    if (id) { // id가 있는 경우에만 (수정 가능한 항목)
                        return fetch(`${API_BASE_URL}/admin/benchmark-scores/${id}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                            body: JSON.stringify({ average_score: score })
                        });
                    }
                    return Promise.resolve(); // id가 없으면 아무것도 안함
                });
                
                try {
                    await Promise.all(updatePromises);
                    alert('해당 행의 수정 가능한 점수들이 저장되었습니다.');
                } catch(err) {
                    alert('점수 저장 중 오류가 발생했습니다.');
                }
            }
        });
    }

    initializePage();
});