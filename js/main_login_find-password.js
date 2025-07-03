/**
 * 파일명: js/main_login_find-password.js
 * 기능: 비밀번호 찾기 페이지의 모든 기능을 담당합니다.
 * 수정 일시: 2025-07-03 14:32
 */
import { API_BASE_URL } from '../config.js';

document.addEventListener('DOMContentLoaded', function() {
    const findPasswordForm = document.getElementById('findPasswordForm');
    const emailInput = document.getElementById('email');
    const responseMessage = document.getElementById('response-message');

    findPasswordForm.addEventListener('submit', async function(event) {
        event.preventDefault();
        
        const email = emailInput.value;
        if (!email) {
            responseMessage.textContent = '이메일을 입력해주세요.';
            responseMessage.style.color = 'red';
            return;
        }

        try {
            // ★★★ fetch 주소를 백틱(`)으로 감싸줍니다. ★★★
            const response = await fetch(`${API_BASE_URL}/auth/request-password-reset`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email })
            });
            const result = await response.json();

            responseMessage.textContent = result.message;
            if(response.ok) {
                responseMessage.style.color = 'green';
                emailInput.disabled = true;
                document.querySelector('button[type="submit"]').disabled = true;
            } else {
                responseMessage.style.color = 'red';
            }
        } catch (error) {
            console.error('비밀번호 재설정 요청 실패:', error);
            responseMessage.textContent = '오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
            responseMessage.style.color = 'red';
        }
    });
});