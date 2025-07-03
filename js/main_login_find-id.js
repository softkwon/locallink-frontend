/**
 * 파일명: js/main_login_find-id.js
 * 기능: 아이디 찾기 페이지의 모든 기능을 담당합니다.
 * 수정 일시: 2025-07-03 14:32
 */
import { API_BASE_URL } from '../config.js';

document.addEventListener('DOMContentLoaded', function() {
    const findIdForm = document.getElementById('findIdForm');
    const responseMessage = document.getElementById('response-message');
    const resultSection = document.getElementById('result-section');
    const foundEmailEl = document.getElementById('found-email');

    findIdForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const managerName = document.getElementById('managerName').value;
        const managerPhone = document.getElementById('managerPhone').value;

        if (!managerName || !managerPhone) {
            responseMessage.textContent = '모든 정보를 입력해주세요.';
            responseMessage.style.color = 'red';
            return;
        }

        try {
            // ★★★ fetch 주소를 백틱(`)으로 감싸줍니다. ★★★
            const response = await fetch(`${API_BASE_URL}/auth/find-id`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ managerName, managerPhone })
            });
            const result = await response.json();

            if (result.success) {
                responseMessage.textContent = '';
                const [localPart, domain] = result.email.split('@');
                const maskedLocalPart = localPart.length > 3 ? localPart.substring(0, 3) + '*'.repeat(localPart.length - 3) : localPart;
                foundEmailEl.textContent = `${maskedLocalPart}@${domain}`;
                resultSection.style.display = 'block';
            } else {
                responseMessage.textContent = result.message;
                responseMessage.style.color = 'red';
                resultSection.style.display = 'none';
            }
        } catch (error) {
            console.error('아이디 찾기 실패:', error);
            responseMessage.textContent = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            responseMessage.style.color = 'red';
        }
    });
});