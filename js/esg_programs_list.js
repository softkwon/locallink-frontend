import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const loadingEl = document.getElementById('loadingMessage');
    const mainTabNav = document.querySelector('.esg-tab-nav');
    const subcategoryNavContainer = document.getElementById('subcategory-nav-container');
    const subcategoryDescription = document.getElementById('subcategory-description');
    const cardsContainer = document.getElementById('program-cards-container');
    
    let allPrograms = [];
    let allCategories = [];
    let myPlanIds = new Set();

    async function initializePage() {
        if (!mainTabNav || !cardsContainer) return;
        
        updateMyPlan();

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

    function renderSubCategoryTabs(parentCategory) {
        const subCategories = allCategories.filter(cat => cat.parent_category === parentCategory);
        subcategoryNavContainer.innerHTML = subCategories.map(cat => 
            `<button class="subcategory-button" data-category-name="${cat.category_name}">${cat.category_name}</button>`
        ).join('');

        // 첫 번째 서브카테고리를 자동으로 클릭하여 기본 콘텐츠 표시
        const firstSubCategoryButton = subcategoryNavContainer.querySelector('.subcategory-button');
        if (firstSubCategoryButton) {
            firstSubCategoryButton.click();
        } else {
            // 해당 E,S,G 대분류에 프로그램이 하나도 없을 경우
            subcategoryDescription.style.display = 'none';
            cardsContainer.innerHTML = `<p style="text-align:center;">이 카테고리에는 등록된 프로그램이 없습니다.</p>`;
        }
    }

    function renderCategoryContent(categoryName) {
        const descriptionBox = document.getElementById('subcategory-description');
        const category = allCategories.find(cat => cat.category_name === categoryName);

        if (category && category.description) {
            descriptionBox.innerHTML = category.description;
            descriptionBox.style.display = 'block';
            
            descriptionBox.classList.remove('theme-E', 'theme-S', 'theme-G');
            if (category.parent_category) {
                descriptionBox.classList.add(`theme-${category.parent_category}`);
            }
            
        } else {
            descriptionBox.style.display = 'none';
        }
        renderProgramCards(categoryName);
    }

    function renderProgramCards(categoryName) {
        cardsContainer.innerHTML = '';
        const programs = allPrograms.filter(p => p.solution_categories && p.solution_categories.includes(categoryName));
        
        if (programs.length === 0) {
            cardsContainer.innerHTML = `<p style="text-align:center;">이 분야에는 아직 등록된 프로그램이 없습니다.</p>`;
            return;
        }

        const cardsHtml = programs.map(program => {
            const isInPlan = myPlanIds.has(program.id);
            return `
                <div class="program-card">
                    <div class="program-card-content">
                        <h3>${program.title}</h3>
                        <p>${program.program_overview || '프로그램 개요'}</p>
                    </div>
                    <div class="program-card-footer">
                        <button type="button" class="${isInPlan ? 'button-danger' : 'button-secondary'} button-sm add-to-plan-btn" data-program-id="${program.id}">${isInPlan ? '플랜에서 제거' : '내 플랜에 담기'}</button>
                        <a href="esg_program_detail.html?id=${program.id}" target="_blank" class="button-primary button-sm">자세히 보기</a>
                    </div>
                </div>
            `;
        }).join('');
        cardsContainer.innerHTML = cardsHtml;
    }

    function updateMyPlan() {
        const myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
        myPlanIds = new Set(myPlan.map(p => p.id));
    }

    function updatePlanButtonUI(button, programId) {
        const isInPlan = myPlanIds.has(programId);
        button.textContent = isInPlan ? '플랜에서 제거' : '내 플랜에 담기';
        button.classList.toggle('button-danger', isInPlan);
        button.classList.toggle('button-secondary', !isInPlan);
    }

    function attachEventListeners() {
        // 1차 탭 (E, S, G) 클릭 이벤트
        mainTabNav.addEventListener('click', e => {
            const button = e.target.closest('.esg-tab-button');
            if (!button) return;

            document.querySelectorAll('.esg-tab-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderSubCategoryTabs(button.dataset.category);
        });

        // 2차 탭 (세부 카테고리) 클릭 이벤트
        subcategoryNavContainer.addEventListener('click', e => {
            const button = e.target.closest('.subcategory-button');
            if (!button) return;

            document.querySelectorAll('.subcategory-button').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            renderCategoryContent(button.dataset.categoryName);
        });

        // '플랜 담기' 버튼 클릭 이벤트
        cardsContainer.addEventListener('click', e => {
            const button = e.target.closest('.add-to-plan-btn');
            if (!button) return;

            const programId = parseInt(button.dataset.programId, 10);
            const program = allPrograms.find(p => p.id === programId);
            if (!program) return;
            
            let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
            if (myPlanIds.has(programId)) {
                myPlan = myPlan.filter(p => p.id !== programId);
                alert(`'${program.title}' 프로그램을 내 플랜에서 제거했습니다.\nStep 5 시뮬레이터에 반영됩니다.`);
            } else {
                myPlan.push({ id: programId, title: program.title });
                alert(`'${program.title}' 프로그램이 내 플랜에 추가되었습니다.\nStep 5 시뮬레이터에 반영됩니다.`);
            }
            localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
            
            updateMyPlan();
            updatePlanButtonUI(button, programId);
        });
    }

    initializePage();
});