import { API_BASE_URL } from './config.js';

document.addEventListener('DOMContentLoaded', function() {
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

async function handleLogin(event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }

    const formData = {
        email: email,
        password: password
    };

    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', 
            headers: {
                'Content-Type': 'application/json' 
            },
            body: JSON.stringify(formData) 
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.setItem('locallink-token', result.token);
            alert(result.message || "로그인 성공!"); 
            window.location.href = 'index.html'; 
        } else {
            alert(result.message || "로그인에 실패했습니다.");
        }

    } catch (error) {
        console.error('로그인 요청 실패:', error);
        alert('로그인 중 오류가 발생했습니다.');
    }
}