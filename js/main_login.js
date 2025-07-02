// js/main_login.js

// 설정 파일(config.js)에서 백엔드 API 기본 주소를 가져옵니다.
import { API_BASE_URL } from './config.js';

// HTML 문서가 모두 로드되면 아래 함수를 실행합니다.
document.addEventListener('DOMContentLoaded', function() {
    
    // HTML에서 id가 'loginForm'인 요소를 찾아 'submit' 이벤트가 발생하면
    // handleLogin 함수를 실행하도록 연결합니다.
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
});

// 로그인 로직을 실제로 처리하는 비동기 함수
async function handleLogin(event) {
    // form의 기본 동작(페이지 새로고침)을 막습니다.
    event.preventDefault();

    // 입력된 이메일과 비밀번호 값을 가져옵니다.
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    // 두 값 중 하나라도 비어있으면 경고창을 띄우고 함수를 종료합니다.
    if (!email || !password) {
        alert('이메일과 비밀번호를 모두 입력해주세요.');
        return;
    }

    // 백엔드로 보낼 데이터를 객체 형태로 만듭니다.
    const formData = {
        email: email,
        password: password
    };

    try {
        // fetch 함수를 사용해 백엔드 로그인 API를 호출합니다.
        // 주소는 백틱(`)을 사용해서 변수를 올바르게 포함시킵니다.
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST', // 요청 방식
            headers: {
                'Content-Type': 'application/json' // 보내는 데이터의 형식
            },
            body: JSON.stringify(formData) // 데이터를 JSON 문자열로 변환
        });

        // 백엔드로부터 받은 응답을 JSON 형태로 파싱합니다.
        const result = await response.json();

        // 응답이 성공적인지(HTTP 상태 코드가 2xx) 확인합니다.
        if (response.ok) {
            // 로그인 성공 시, 받은 토큰을 브라우저의 로컬 스토리지에 저장합니다.
            localStorage.setItem('locallink-token', result.token);
            alert(result.message || "로그인 성공!"); // 성공 메시지 표시
            window.location.href = 'index.html'; // 메인 페이지로 이동
        } else {
            // 로그인 실패 시, 서버가 보낸 실패 메시지를 표시합니다.
            alert(result.message || "로그인에 실패했습니다.");
        }

    } catch (error) {
        // 네트워크 오류 등 요청 자체가 실패했을 때 실행됩니다.
        console.error('로그인 요청 실패:', error);
        alert('로그인 중 오류가 발생했습니다.');
    }
}