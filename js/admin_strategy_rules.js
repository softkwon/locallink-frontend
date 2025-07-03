// js/admin_strategy_rules.js (수정된 코드)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { checkAdminPermission } from './admin_common.js';

document.addEventListener('DOMContentLoaded', function() {
    
    // --- 1. 페이지 요소 및 전역 변수 ---
    const token = localStorage.getItem('locallink-token');
    const tableBody = document.getElementById('rulesTableBody');
    const newRuleForm = document.getElementById('newRuleForm');
    const programsSelect = document.getElementById('recommendedProgramSelect');
    const addConditionBtn = document.getElementById('add-condition-btn');
    const conditionsContainer = document.getElementById('conditions-container');
    
    // [수정] 테이블과 로딩 메시지 요소를 변수로 추가
    const rulesTable = document.getElementById('rulesTable'); 
    const loadingMessage = document.getElementById('loadingMessage');

    let allQuestions = []; // 질문 목록을 저장할 전역 변수

    // --- 2. 페이지 초기화 ---
    async function initializePage() {
        const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
        if (!hasPermission) return;

        loadRulesAndPrograms(); 
        populateFormDropdowns();
        attachEventListeners();
    }

    // --- 3. 기능 함수들 ---

    /**
     * 규칙과 프로그램 목록을 불러와 테이블을 그리는 함수
     */
    async function loadRulesAndPrograms() {
        // [수정] 로딩 메시지 표시 로직 변경
        if(loadingMessage) loadingMessage.innerHTML = '<p>기존 규칙 목록을 불러오는 중입니다...</p>';
        if(rulesTable) rulesTable.classList.add('hidden'); // 테이블 숨김
        if(tableBody) tableBody.innerHTML = ''; // 테이블 내용 초기화

        try {
            const [rulesRes, programsRes] = await Promise.all([
                fetch(`${API_BASE_URL}/admin/strategy-rules`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/admin/programs`, { headers: { 'Authorization': `Bearer ${token}` } })
            ]);

            if (!rulesRes.ok || !programsRes.ok) throw new Error('규칙 또는 프로그램 목록을 불러오는 데 실패했습니다.');

            const rulesResult = await rulesRes.json();
            const programsResult = await programsRes.json();

            if (rulesResult.success && programsResult.success) {
                // [수정] 성공 시 로딩 메시지 숨기고 테이블 표시
                if (loadingMessage) loadingMessage.style.display = 'none';
                if (rulesTable) rulesTable.classList.remove('hidden');
                
                renderRulesTable(rulesResult.rules, programsResult.programs);
            } else {
                throw new Error(rulesResult.message || programsResult.message || '데이터 처리 중 오류가 발생했습니다.');
            }
        } catch (error) {
            // [수정] 오류 발생 시 로딩 메시지 영역에 오류 문구 표시
            if (loadingMessage) {
                loadingMessage.innerHTML = `<p style="color:red;">오류: ${error.message}</p>`;
                loadingMessage.style.display = 'block';
            }
            if (rulesTable) rulesTable.classList.add('hidden'); // 오류 시 테이블 확실히 숨김
        }
    }

    /**
     * '새 규칙 추가' 폼의 드롭다운 메뉴들을 채우는 함수
     */
    async function populateFormDropdowns() {
        try {
            const programsRes = await fetch(`${API_BASE_URL}/admin/programs`, { headers: { 'Authorization': `Bearer ${token}` } });
            const programsResult = await programsRes.json();
            if (programsResult.success) {
                populateProgramsDropdown(programsResult.programs);
            }

            const questionsRes = await fetch(`${API_BASE_URL}/admin/questions`, { headers: { 'Authorization': `Bearer ${token}` } });
            const questionsResult = await questionsRes.json();
            if (questionsResult.success) {
                allQuestions = questionsResult.questions;
                if (conditionsContainer && conditionsContainer.children.length === 0) {
                    addConditionRow();
                }
            }
        } catch (error) {
            console.error("폼 드롭다운 로딩 실패:", error);
            if (conditionsContainer && conditionsContainer.children.length === 0) {
                addConditionRow();
            }
        }
    }
    
    function populateProgramsDropdown(programs) {
        if (!programsSelect) return;
        programsSelect.innerHTML = '<option value="">-- 추천할 프로그램 선택 --</option>';
        programs.forEach(program => {
            const option = document.createElement('option');
            option.value = program.program_code;
            option.textContent = `[${program.program_code}] ${program.title}`;
            programsSelect.appendChild(option);
        });
    }

    function renderRulesTable(rules, programs) {
        if (!tableBody || !rules || !programs) return;
        tableBody.innerHTML = '';
        if (rules.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">생성된 규칙이 없습니다. 새 규칙을 추가해 주세요.</td></tr>`;
            return;
        }
        rules.forEach(rule => {
            const row = tableBody.insertRow();
            const programInfo = programs.find(p => p.program_code === rule.recommended_program_code);
            row.insertCell().textContent = rule.id;
            row.insertCell().textContent = rule.description;
            const conditionCell = row.insertCell();
            conditionCell.innerHTML = formatConditions(rule.conditions);
            conditionCell.style.fontSize = '0.85em';
            conditionCell.style.color = '#333';
            const programCell = row.insertCell();
            programCell.textContent = programInfo ? `[${programInfo.program_code}] ${programInfo.title}` : rule.recommended_program_code;
            row.insertCell().textContent = rule.priority;
            row.insertCell().innerHTML = `<button class="button-danger button-sm delete-rule-btn" data-id="${rule.id}">삭제</button>`;
        });
    }

    function formatConditions(conditions) {
        if (!conditions || !conditions.rules || conditions.rules.length === 0) return '<span>조건 없음</span>';
        const conditionStrings = conditions.rules.map(rule => {
            let itemText = rule.item;
            if (rule.type === 'category_score') itemText = `${rule.item.toUpperCase()} 점수`;
            else if (rule.type === 'question_score') itemText = `${rule.item} 문항 점수`;
            return `<strong>${itemText}</strong> ${rule.operator} ${rule.value}`;
        });
        const operatorHtml = `<span style="color: #007bff; font-weight: bold;">${conditions.operator}</span>`;
        return conditionStrings.join(`<br>${operatorHtml}<br>`);
    }

    function addConditionRow() {
        if (!conditionsContainer) return;
        const newCondition = document.createElement('div');
        newCondition.className = 'form-group-inline condition-row';
        newCondition.innerHTML = `
            <select class="form-control condition-type"><option value="category_score">카테고리 점수</option><option value="question_score">개별문항 점수</option></select>
            <select class="form-control condition-item-category"><option value="E">E</option><option value="S">S</option><option value="G">G</option></select>
            <select class="form-control condition-item-question" style="display:none;"><option value="">-- 문항 선택 --</option></select>
            <select class="form-control condition-operator"><option value="<">&lt;</option><option value="<=">&lt;=</option><option value="==">==</option><option value=">=">&gt;=</option><option value=">">&gt;</option></select>
            <input type="number" class="form-control condition-value" placeholder="값" required>
            <button type="button" class="button-danger button-sm remove-condition-btn">X</button>
        `;
        conditionsContainer.appendChild(newCondition);
        const questionDropdown = newCondition.querySelector('.condition-item-question');
        allQuestions.forEach(q => {
            const option = document.createElement('option');
            option.value = q.question_code;
            option.textContent = `[${q.question_code}] ${q.question_text.substring(0, 30)}...`;
            questionDropdown.appendChild(option);
        });
    }

    // --- 4. 이벤트 리스너 연결 ---
    function attachEventListeners() {
        if (addConditionBtn) addConditionBtn.addEventListener('click', addConditionRow);

        if (conditionsContainer) {
            conditionsContainer.addEventListener('click', e => {
                if (e.target.classList.contains('remove-condition-btn')) e.target.closest('.condition-row').remove();
            });
            conditionsContainer.addEventListener('change', e => {
                if (e.target.classList.contains('condition-type')) {
                    const row = e.target.closest('.condition-row');
                    const categorySelect = row.querySelector('.condition-item-category');
                    const questionSelect = row.querySelector('.condition-item-question');
                    categorySelect.style.display = e.target.value === 'category_score' ? 'block' : 'none';
                    questionSelect.style.display = e.target.value === 'question_score' ? 'block' : 'none';
                }
            });
        }
        
        if (newRuleForm) {
            newRuleForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const rules = [];
                document.querySelectorAll('.condition-row').forEach(row => {
                    const type = row.querySelector('.condition-type').value;
                    const item = type === 'category_score' ? row.querySelector('.condition-item-category').value : row.querySelector('.condition-item-question').value;
                    rules.push({
                        type: type,
                        item: item,
                        operator: row.querySelector('.condition-operator').value,
                        value: parseFloat(row.querySelector('.condition-value').value)
                    });
                });
                
                const newRuleData = {
                    description: document.getElementById('newRuleDescription').value,
                    conditions: {
                        operator: document.getElementById('conditionOperator').value,
                        rules: rules
                    },
                    recommended_program_code: programsSelect.value,
                    priority: parseInt(document.getElementById('newRulePriority').value, 10)
                };

                if(!newRuleData.description || !newRuleData.recommended_program_code) {
                    return alert('규칙 설명과 추천 프로그램을 모두 입력해주세요.');
                }

                try {
                    const response = await fetch(`${API_BASE_URL}/admin/strategy-rules`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify(newRuleData)
                    });
                    const result = await response.json();
                    alert(result.message);
                    if (result.success) {
                        newRuleForm.reset();
                        conditionsContainer.innerHTML = '';
                        addConditionRow();
                        loadRulesAndPrograms(); // [수정] initializePage() 대신 loadRulesAndPrograms() 호출
                    }
                } catch (error) { alert('규칙 저장 중 오류 발생'); }
            });
        }

        if (tableBody) {
            tableBody.addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-rule-btn')) {
                    const ruleId = e.target.dataset.id;
                    if (confirm(`정말로 규칙 ID ${ruleId}번을 삭제하시겠습니까?`)) {
                        try {
                            const response = await fetch(`${API_BASE_URL}/admin/strategy-rules/${ruleId}`, {
                                method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                            });
                            const result = await response.json();
                            alert(result.message);
                            if (result.success) loadRulesAndPrograms(); // [수정] initializePage() 대신 loadRulesAndPrograms() 호출
                        } catch (error) { alert('규칙 삭제 중 오류 발생'); }
                    }
                }
            });
        }
    }
    
    // --- 5. 페이지 시작 ---
    initializePage();
});