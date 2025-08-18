import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const accordionContainer = document.getElementById('program-accordion-container');
    const loadingEl = document.getElementById('loadingMessage');
    const token = localStorage.getItem('locallink-token');
    const diagId = new URLSearchParams(window.location.search).get('diagId');
    const hasCompletedDiagnosis = !!diagId; 

    async function initializePage() {
        if (!accordionContainer) return;

        try {
            const [programsRes, categoriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/programs`),
                fetch(`${API_BASE_URL}/admin/solution-categories-public`)
            ]);

            const programsResult = await programsRes.json();
            const categoriesResult = await categoriesRes.json();

            if (programsResult.success && categoriesResult.success) {
                displayProgramsByCategory(programsResult.programs, categoriesResult.categories);
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

    
    function displayProgramsByCategory(programs, categories) {
        if (!accordionContainer) return;
        accordionContainer.innerHTML = '';

        const programsByCat = {};
        programs.forEach(program => {
            (program.solution_categories || []).forEach(catName => {
                if (!programsByCat[catName]) {
                    programsByCat[catName] = [];
                }
                programsByCat[catName].push(program);
            });
        });

        categories.forEach(category => {
            const categoryPrograms = programsByCat[category.category_name] || [];
            if (categoryPrograms.length === 0) return; 

            const accordionItem = document.createElement('div');
            accordionItem.className = 'accordion-item';
            
            accordionItem.innerHTML = `
                <div class="accordion-header">
                    <div class="accordion-header-content">
                        <h3>${category.category_name}</h3>
                        <p>${category.description || '카테고리 설명이 없습니다.'}</p>
                    </div>
                    <span class="accordion-arrow">▼</span>
                </div>
                <div class="accordion-panel">
                    <div class="program-card-grid">
                        ${categoryPrograms.map(program => renderProgramCard(program)).join('')}
                    </div>
                </div>
            `;
            accordionContainer.appendChild(accordionItem);
        });
    }

    
    function renderProgramCard(program) {
        const representativeImage = program.content && program.content[0]?.images?.length > 0 
            ? (program.content[0].images[0].startsWith('http') ? program.content[0].images[0] : `${STATIC_BASE_URL}/${program.content[0].images[0]}`)
            : '/images/default_program.png';
        
        const regionsText = (program.service_regions && program.service_regions.length > 0) ? program.service_regions.join(', ') : '전국';
        const detailUrl = `esg_program_detail.html?id=${program.id}${diagId ? '&diagId='+diagId : ''}`;

        let actionsHtml = `<button type="button" class="button-primary button-sm apply-btn" data-program-id="${program.id}" data-program-title="${program.title}">신청하기</button>`;
        if (hasCompletedDiagnosis) {
            actionsHtml = `
                <button type="button" class="button-secondary button-sm add-to-plan-btn" data-program-id="${program.id}" data-program-title="${program.title}">내 플랜에 담기</button>
                ${actionsHtml}
            `;
        }

        return `
            <div class="program-card">
                <a href="${detailUrl}" target="_blank" style="text-decoration:none; color:inherit; display:flex; flex-direction:column; flex-grow:1;">
                    <img src="${representativeImage}" alt="${program.title}" class="card-image">
                    <div class="card-content">
                        <span class="category-badge category-${program.esg_category.toLowerCase()}">${program.esg_category}</span>
                        <h4>${program.title}</h4>
                        <p class="overview">${program.program_overview || '프로그램 개요가 없습니다.'}</p>
                        <div class="service-regions"><strong>서비스 지역:</strong> ${regionsText}</div>
                    </div>
                </a>
                <div class="program-actions">${actionsHtml}</div>
            </div>
        `;
    }

    
    function attachEventListeners() {
        if (!accordionContainer) return;
        
        accordionContainer.addEventListener('click', e => {
            const header = e.target.closest('.accordion-header');
            if (header) {
                header.classList.toggle('active');
                const panel = header.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                } else {
                    panel.style.maxHeight = panel.scrollHeight + "px";
                }
            }

            const button = e.target.closest('button');
            if (button) {
                handleButtonClick(button);
            }
        });
    }

    
    async function handleButtonClick(button) {
        const programId = button.dataset.programId;
        if (!programId) return;

        const programTitle = button.dataset.programTitle;

        if (button.classList.contains('add-to-plan-btn')) {
            let myPlan = JSON.parse(localStorage.getItem('esgMyPlan')) || [];
            if (myPlan.some(p => p.id == programId)) {
                alert('이미 플랜에 추가된 프로그램입니다.');
                return;
            }
            myPlan.push({ id: parseInt(programId), title: programTitle });
            localStorage.setItem('esgMyPlan', JSON.stringify(myPlan));
            alert(`'${programTitle}' 프로그램이 내 플랜에 추가되었습니다.\n[ESG프로그램 제안] 페이지의 시뮬레이터에서 확인하세요.`);
        }

        if (button.classList.contains('apply-btn')) {
            if (!token) {
                alert('로그인이 필요한 기능입니다.');
                window.location.href = 'main_login.html';
                return;
            }
            
            if (!hasCompletedDiagnosis) {
                alert("먼저 간이진단을 진행하세요.");
                return;
            }
            
            if (confirm(`'${programTitle}' 프로그램을 신청하시겠습니까?`)) {
                try {
                    const response = await fetch(`${API_BASE_URL}/applications/me`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ programId: parseInt(programId) })
                    });
                    const result = await response.json();
                    alert(result.message);
                } catch (error) {
                    alert('신청 처리 중 오류가 발생했습니다.');
                }
            }
        }
    }

    initializePage();
});
