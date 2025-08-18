import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const loadingEl = document.getElementById('loadingMessage');
    const tabNav = document.querySelector('.esg-tab-nav');
    const cardsContainer = document.getElementById('solution-cards-container');
    const diagId = new URLSearchParams(window.location.search).get('diagId');

    let allPrograms = [];
    let allCategories = [];
    let programsByCatName = {};

    async function initializePage() {
        if (!tabNav || !cardsContainer) return;

        try {
            const [programsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/programs`),
                fetch(`${API_BASE_URL}/admin/solution-categories-public`)
            ]);

            const programsResult = await programsRes.json();
            const categoriesResult = await categoriesRes.json();

            if (programsResult.success && categoriesResult.success) {
                allPrograms = programsResult.programs;
                allCategories = categoriesResult.categories;
                
                allPrograms.forEach(program => {
                    (program.solution_categories || []).forEach(catName => {
                        if (!programsByCatName[catName]) programsByCatName[catName] = [];
                        programsByCatName[catName].push(program);
                    });
                });

                attachEventListeners();
                document.getElementById('tab-E').click();
            } else {
                throw new Error(programsResult.message || categoriesResult.message);
            }
        } catch (error) {
            if(loadingEl) loadingEl.innerHTML = `<p>데이터 로딩 오류: ${error.message}</p>`;
        } finally {
            if(loadingEl) loadingEl.style.display = 'none';
        }
    }

    /**
     * 특정 대분류(E, S, G)에 해당하는 솔루션 카드들을 렌더링하는 함수
     */
    function renderSolutionCards(parentCategory) {
        cardsContainer.innerHTML = '';
        const solutionCategories = allCategories.filter(cat => cat.parent_category === parentCategory);

        if (solutionCategories.length === 0) {
            cardsContainer.innerHTML = `<p style="text-align:center;">이 카테고리에는 등록된 솔루션이 없습니다.</p>`;
            return;
        }

        const cardsHtml = solutionCategories.map(category => {
            const categoryPrograms = programsByCatName[category.category_name] || [];
            if (categoryPrograms.length === 0) return '';

            // ★★★ 카드에 E,S,G 클래스를 추가합니다. ★★★
            return `
                <div class="solution-card-item solution-card-${parentCategory}">
                    <div class="solution-card-header">
                        <h3>${category.category_name}</h3>
                        <p>${category.description || ''}</p>
                    </div>
                    <div class="solution-card-footer">
                        <button type="button" class="button-secondary button-sm view-programs-btn">프로그램 보기</button>
                    </div>
                    <div class="solution-card-panel">
                        <ul class="program-link-list">
                            ${categoryPrograms.map(p => `<li><a href="esg_program_detail.html?id=${p.id}${diagId ? '&diagId='+diagId : ''}" target="_blank">${p.title}</a></li>`).join('')}
                        </ul>
                    </div>
                </div>
            `;
        }).join('');

        cardsContainer.innerHTML = cardsHtml;
    }

    /**
     * 이벤트 리스너를 연결하는 함수
     */
    function attachEventListeners() {
        tabNav.addEventListener('click', e => {
            const button = e.target.closest('.esg-tab-button');
            if (!button) return;

            document.querySelectorAll('.esg-tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            const category = button.dataset.category;
            renderSolutionCards(category);
        });

        cardsContainer.addEventListener('click', e => {
            const button = e.target.closest('.view-programs-btn');
            if (!button) return;

            const cardItem = button.closest('.solution-card-item');
            const panel = cardItem.querySelector('.solution-card-panel');
            
            button.classList.toggle('active');

            if (panel.style.maxHeight) {
                panel.style.maxHeight = null;
                button.textContent = '프로그램 보기';
            } else {
                panel.style.maxHeight = panel.scrollHeight + "px";
                button.textContent = '숨기기';
            }
        });
    }

    initializePage();
});
