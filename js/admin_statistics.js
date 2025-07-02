// js/admin_statistics.js (2025-06-26 21:30:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 변수 초기화 ---
    const token = localStorage.getItem('locallink-token');
    const loadingEl = document.getElementById('loadingMessage');
    const tableContainerEl = document.getElementById('tableContainer');
    const tableHeadEl = document.getElementById('statsTableHead');
    const tableBodyEl = document.getElementById('statsTableBody');
    const tabContainer = document.getElementById('statsTabNav');

    // --- 2. 기능 함수 정의 ---

    // 페이지 초기화 함수
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;
        
        await createYearTabs(); // 연도 탭부터 생성
        loadStatistics('all');  // 처음에는 '전체' 데이터 로드
        attachEventListeners();
    }

    // 연도 탭을 동적으로 생성하는 함수
    async function createYearTabs() {
        if (!tabContainer) return;
        try {
            const response = await fetch(`${API_BASE_URL}/admin/statistics/available-years`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (result.success) {
                tabContainer.innerHTML = '<button class="tab-button active" data-year="all">전체</button>';
                result.years.forEach(year => {
                    tabContainer.innerHTML += `<button class="tab-button" data-year="${year}">${year}년</button>`;
                });
                
                // 각 탭 버튼에 클릭 이벤트 연결
                tabContainer.querySelectorAll('.tab-button').forEach(button => {
                    button.addEventListener('click', () => {
                        tabContainer.querySelector('.active').classList.remove('active');
                        button.classList.add('active');
                        loadStatistics(button.dataset.year);
                    });
                });
            }
        } catch (e) {
            if(tabContainer) tabContainer.innerHTML = '<p>연도 목록 로딩 실패</p>';
        }
    }
    
    // 질문 코드를 자연어 순으로 정렬하는 함수 (예: S-Q2 다음에 S-Q10이 오지 않도록)
    const naturalSort = (a, b) => {
        const re = /(\d+)/g;
        const a_parts = a.split(re).filter(Boolean);
        const b_parts = b.split(re).filter(Boolean);
        for (let i = 0; i < Math.min(a_parts.length, b_parts.length); i++) {
            const a_part = a_parts[i];
            const b_part = b_parts[i];
            if (!isNaN(a_part) && !isNaN(b_part)) {
                const a_num = parseInt(a_part, 10);
                const b_num = parseInt(b_part, 10);
                if (a_num !== b_num) return a_num - b_num;
            } else {
                if (a_part !== b_part) return a_part.localeCompare(b_part);
            }
        }
        return a_parts.length - b_parts.length;
    };
    
    // 통계 데이터를 연도별로 불러와 테이블을 그리는 함수
    async function loadStatistics(year = 'all') {
        loadingEl.textContent = '데이터를 불러오는 중입니다...';
        loadingEl.style.display = 'block';
        tableContainerEl.classList.add('hidden');
        try {
            let url = `${API_BASE_URL}/admin/statistics/all-diagnoses`;
            if (year !== 'all') {
                url += `?year=${year}`;
            }
            const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();

            if (result.success && result.statistics.length > 0) {
                const statsData = result.statistics;
                
                let allAnsweredQuestions = new Set();
                statsData.forEach(stat => {
                    if (stat.answers) stat.answers.forEach(ans => allAnsweredQuestions.add(ans.question_code));
                });
                const sortedQuestionCodes = Array.from(allAnsweredQuestions).sort(naturalSort);

                renderStatisticsTable(statsData, sortedQuestionCodes);

            } else {
                loadingEl.textContent = '표시할 통계 데이터가 없습니다.';
                tableHeadEl.innerHTML = '';
                tableBodyEl.innerHTML = '';
            }
        } catch (error) {
            loadingEl.textContent = `오류: ${error.message}`;
        }
    }

    // 테이블 HTML을 생성하는 함수
    function renderStatisticsTable(statsData, sortedQuestionCodes) {
        let headers = ['Diag ID', '회사명', '이메일', '산업코드', '주요사업장', '관심분야', '설립연도', '직원 수', '매출액', '영업이익', '수출비중(%)', '상장여부', '기업규모', '진단상태', '진단타입', '총점', 'E', 'S', 'G'];
        sortedQuestionCodes.forEach(code => {
            headers.push(`${code}_답변`, `${code}_점수`);
        });
        tableHeadEl.innerHTML = `<tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr>`;

        tableBodyEl.innerHTML = '';
        statsData.forEach(stat => {
            const row = tableBodyEl.insertRow();
            row.insertCell().textContent = stat.diagnosis_id;
            row.insertCell().textContent = stat.company_name;
            row.insertCell().textContent = stat.email;
            row.insertCell().textContent = Array.isArray(stat.industry_codes) ? stat.industry_codes.join(', ') : '-';
            row.insertCell().textContent = stat.business_location;
            row.insertCell().textContent = Array.isArray(stat.interests) ? stat.interests.join(', ') : '-';
            row.insertCell().textContent = stat.establishment_year;
            row.insertCell().textContent = stat.employee_count;
            row.insertCell().textContent = stat.recent_sales;
            row.insertCell().textContent = stat.recent_operating_profit;
            row.insertCell().textContent = stat.export_percentage;
            row.insertCell().textContent = stat.is_listed ? '상장' : '비상장';
            row.insertCell().textContent = stat.company_size;
            row.insertCell().textContent = stat.status;
            row.insertCell().textContent = stat.diagnosis_type;
            row.insertCell().textContent = stat.total_score;
            row.insertCell().textContent = stat.e_score;
            row.insertCell().textContent = stat.s_score;
            row.insertCell().textContent = stat.g_score;
            
            const answersMap = new Map();
            if(stat.answers) stat.answers.forEach(ans => answersMap.set(ans.question_code, ans));

            sortedQuestionCodes.forEach(code => {
                const answer = answersMap.get(code);
                row.insertCell().textContent = answer ? answer.answer_value : '-';
                row.insertCell().textContent = answer ? answer.score : '-';
            });
        });
        
        loadingEl.style.display = 'none';
        tableContainerEl.classList.remove('hidden');
    }

    // 이벤트 리스너 연결 함수
    function attachEventListeners() {
        const exportBtn = document.getElementById('exportCsvBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', async () => {
                const token = localStorage.getItem('locallink-token');
                exportBtn.textContent = '생성 중...';
                exportBtn.disabled = true;
                try {
                    const response = await fetch(`${API_BASE_URL}/admin/statistics/all-diagnoses/export`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('데이터를 내보내는 중 오류가 발생했습니다.');
                    
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.style.display = 'none';
                    a.href = url;
                    a.download = `diagnoses-statistics-${new Date().toISOString().slice(0,10)}.csv`;
                    document.body.appendChild(a);
a.click();
                    window.URL.revokeObjectURL(url);
                    a.remove();
                } catch (error) {
                    alert(error.message);
                } finally {
                    exportBtn.textContent = 'CSV로 내보내기';
                    exportBtn.disabled = false;
                }
            });
        }
    }

    // --- 4. 페이지 시작 ---
    initializePage();
});