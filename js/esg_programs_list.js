
import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const esgContainer = document.getElementById('esg-category-container');
    const loadingEl = document.getElementById('loadingMessage');
    const diagId = new URLSearchParams(window.location.search).get('diagId');

    async function initializePage() {
        if (!esgContainer) return;

        try {
            const [programsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/programs`),
                fetch(`${API_BASE_URL}/admin/solution-categories-public`)
            ]);

            const programsResult = await programsRes.json();
            const categoriesResult = await categoriesRes.json();

            if (programsResult.success && categoriesResult.success) {
                displayProgramsByEsgCategory(programsResult.programs, categoriesResult.categories);
                attachEventListeners();
            } else {
                throw new Error(programsResult.message || categoriesResult.message);
            }
        } catch (error) {
            if(loadingEl) loadingEl.innerHTML = `<p>프로그램을 불러오는 중 오류가 발생했습니다: ${error.message}</p>`;
        } finally {
            if(loadingEl) loadingEl.style.display = 'none';
        }
    }

    
    function displayProgramsByEsgCategory(programs, categories) {
        // 1. 프로그램을 솔루션 카테고리 이름별로 그룹화
        const programsByCatName = {};
        programs.forEach(program => {
            (program.solution_categories || []).forEach(catName => {
                if (!programsByCatName[catName]) programsByCatName[catName] = [];
                programsByCatName[catName].push(program);
            });
        });

        // 2. 솔루션 카테고리를 E, S, G 대분류별로 그룹화
        const categoriesByParent = { E: [], S: [], G: [] };
        categories.forEach(category => {
            if (categoriesByParent[category.parent_category]) {
                categoriesByParent[category.parent_category].push(category);
            }
        });

        // 3. 각 대분류(E, S, G)를 순회하며 UI 생성
        for (const parentCat in categoriesByParent) {
            const container = document.querySelector(`#category-${parentCat} .solution-cards-wrapper`);
            if (!container) continue;

            container.innerHTML = '';
            const solutionCategories = categoriesByParent[parentCat];

            solutionCategories.forEach(category => {
                const categoryPrograms = programsByCat[category.category_name] || [];
                if (categoryPrograms.length === 0) return; // 프로그램이 없는 카테고리는 표시하지 않음

                const accordionItem = document.createElement('div');
                accordionItem.className = 'solution-card-item';
                accordionItem.innerHTML = `
                    <div class="solution-card-header">
                        <div class="solution-card-header-content">
                            <h3>${category.category_name}</h3>
                            <p>${category.description || ''}</p>
                        </div>
                        <span class="solution-card-arrow">▼</span>
                    </div>
                    <div class="solution-card-panel">
                        <ul class="program-link-list">
                            ${categoryPrograms.map(p => `<li><a href="esg_program_detail.html?id=${p.id}${diagId ? '&diagId='+diagId : ''}" target="_blank">${p.title}</a></li>`).join('')}
                        </ul>
                    </div>
                `;
                container.appendChild(accordionItem);
            });
        }
    }

    /**
     * 이벤트 리스너를 연결하는 함수
     */
    function attachEventListeners() {
        if (!esgContainer) return;
        
        // 아코디언 토글 이벤트 (이벤트 위임)
        esgContainer.addEventListener('click', e => {
            const header = e.target.closest('.solution-card-header');
            if (header) {
                header.classList.toggle('active');
                const panel = header.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                } else {
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            }
        });
    }

    initializePage();
});
