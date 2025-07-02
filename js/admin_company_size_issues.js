// js/admin_company_size_issues.js (2025-06-29 03:25:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('locallink-token');
    const formContainer = document.getElementById('form-container');
    const form = document.getElementById('issuesForm');

    async function loadIssues() {
        try {
            const hasPermission = await checkAdminPermission(['super_admin', 'content_manager']);
            if (!hasPermission) return;

            const response = await fetch(`${API_BASE_URL}/admin/company-size-issues`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            formContainer.innerHTML = ''; // 기존 내용 비우기
            result.issues.forEach(issue => {
                const card = document.createElement('div');
                card.className = 'issue-card';
                // ★★★ data-size 속성을 카드에 저장하여 나중에 어떤 카드인지 식별 ★★★
                card.dataset.size = issue.company_size; 

                card.innerHTML = `
                    <div class="issue-card-header">
                        <h3>${getCompanySizeName(issue.company_size)}</h3>
                    </div>
                    <div class="issue-card-body">
                        <div class="form-group">
                            <label>핵심 이슈 (Key Issue)</label>
                            <textarea class="form-control key-issue">${issue.key_issue || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>기회 요인 (Opportunity)</label>
                            <textarea class="form-control opportunity">${issue.opportunity || ''}</textarea>
                        </div>
                        <div class="form-group">
                            <label>위기 요인 (Threat)</label>
                            <textarea class="form-control threat">${issue.threat || ''}</textarea>
                        </div>
                    </div>
                `;
                formContainer.appendChild(card);
            });
        } catch (error) {
            formContainer.innerHTML = `<p>데이터 로딩 실패: ${error.message}</p>`;
        }
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const cards = formContainer.querySelectorAll('.issue-card');
        
        // ★★★ 새로운 HTML 구조에 맞게 데이터 수집 방식 변경 ★★★
        const updates = Array.from(cards).map(card => ({
            company_size: card.dataset.size,
            key_issue: card.querySelector('.key-issue').value,
            opportunity: card.querySelector('.opportunity').value,
            threat: card.querySelector('.threat').value,
        }));

        try {
            const response = await fetch(`${API_BASE_URL}/admin/company-size-issues`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ issues: updates })
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) loadIssues();
        } catch (error) {
            alert('저장 중 오류 발생');
        }
    });
    
    loadIssues();
});