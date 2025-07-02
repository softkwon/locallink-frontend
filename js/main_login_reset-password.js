// js/main_login_reset-password.js (2025-07-02 01:10:00)
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';


document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('resetPasswordForm');
    const newPasswordInput = document.getElementById('newPassword');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const messageArea = document.getElementById('message-area');
    
    // ★★★ URL의 쿼리 파라미터(?)에서 토큰 값을 가져옵니다. ★★★
    const token = new URLSearchParams(window.location.search).get('token');

    if (!token) {
        form.innerHTML = '<p>유효하지 않은 접근입니다. 이메일을 통해 다시 시도해주세요.</p>';
        return;
    }

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const newPassword = newPasswordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        if (newPassword.length < 6) {
            showMessage('비밀번호는 6자 이상이어야 합니다.', 'error');
            return;
        }
        if (newPassword !== passwordConfirm) {
            showMessage('비밀번호가 일치하지 않습니다.', 'error');
            return;
        }

        try {
            const response = await fetch(`${API_BASE_URL}/auth/reset-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: token,
                    password: newPassword,
                    passwordConfirm: passwordConfirm
                })
            });

            const result = await response.json();

            if (result.success) {
                showMessage(result.message, 'success');
                setTimeout(() => {
                    window.location.href = 'main_login.html';
                }, 2000);
            } else {
                showMessage(result.message, 'error');
            }
        } catch (error) {
            showMessage('오류가 발생했습니다. 잠시 후 다시 시도해주세요.', 'error');
        }
    });

    function showMessage(text, type) {
        messageArea.textContent = text;
        messageArea.className = `message-box ${type}`;
        messageArea.classList.remove('hidden');
    }
});