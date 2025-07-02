/**
 * 파일명: js/pages/main_signup.js
 * 기능: 회원가입 페이지의 모든 기능(DOM 조작, 이벤트 처리, API 연동)을 담당합니다.
 * 수정 일시: 2025-07-03 02:45
 */

// 1. 필요한 부품(모듈)들을 각 파일에서 가져옵니다.
import { API_BASE_URL } from '../config.js';
import { initializeIndustryModal } from '../components/industry_modal.js';
import { openPostcodeSearch } from '../helpers/postcode_helper.js';

// 2. 페이지의 모든 HTML 요소가 로드된 후에 아래의 모든 코드를 실행합니다.
document.addEventListener('DOMContentLoaded', function() {
    
    // --- 페이지에서 사용할 상태(데이터) 변수 선언 ---
    let selectedIndustryCodes = []; // 사용자가 선택한 산업 코드를 저장하는 배열
    let emailVerificationTimer; // 이메일 인증 타이머 ID

    // --- 기능 함수 정의 ---

    /** 선택된 산업분류 코드를 화면에 태그 형태로 그려주는 함수 */
    function renderSelectedCodes() {
        const container = document.getElementById('selectedIndustryCodesContainer');
        const displayInput = document.getElementById('industryCodeDisplay');
        if (!container || !displayInput) return;

        container.innerHTML = '';
        if (selectedIndustryCodes.length === 0) {
            displayInput.placeholder = '우측 ⓘ 아이콘으로 검색/선택';
            displayInput.value = '';
        } else {
            displayInput.value = `${selectedIndustryCodes.length}개 선택됨`;
            selectedIndustryCodes.forEach((codeObj, index) => {
                const tag = document.createElement('span');
                tag.className = 'selected-code-tag';
                tag.textContent = `[${codeObj.code}] ${codeObj.name} `;
                
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove-code';
                removeBtn.textContent = '×';
                removeBtn.onclick = (e) => {
                    e.stopPropagation();
                    selectedIndustryCodes.splice(index, 1);
                    renderSelectedCodes();
                };
                
                tag.appendChild(removeBtn);
                container.appendChild(tag);
            });
        }
    }

    /** 최종 회원가입 버튼 클릭 시 실행될 함수 */
    async function handleSignup(event) {
        event.preventDefault();

        const signupForm = document.getElementById('signupForm');
        
        // --- 1. 모든 유효성 검사 ---
        if (!document.getElementById('agreeTerms').checked || !document.getElementById('agreePrivacy').checked) {
            return alert('필수 약관에 동의해주세요.');
        }
        if (!signupForm.checkValidity()) {
            return signupForm.reportValidity(); // HTML5 기본 유효성 검사 메시지를 표시합니다.
        }
        if (selectedIndustryCodes.length === 0) {
            return alert('산업분류코드를 선택해주세요.');
        }
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('passwordConfirm').value;
        if (password !== passwordConfirm) {
            return alert('비밀번호가 일치하지 않습니다.');
        }
        // 이메일 인증 완료 여부 확인 로직은 필요에 따라 추가...

        // --- 2. 백엔드 API로 전송할 데이터 생성 ---
        const formData = {
            companyName: document.getElementById('companyName').value.trim(),
            industryCodes: selectedIndustryCodes.map(item => item.code),
            representative: document.getElementById('ceoName').value.trim(),
            address: `${document.getElementById('companyAddress').value.trim()} ${document.getElementById('companyAddressDetail').value.trim()}`.trim(),
            businessLocation: document.getElementById('mainBusinessLocation').value,
            managerName: document.getElementById('contactPersonName').value.trim(),
            managerPhone: document.getElementById('contactPersonPhone').value.replace(/\D/g, ''),
            email: document.getElementById('contactPersonEmail').value.trim(),
            password: password,
            interests: Array.from(document.querySelectorAll('input[name="interests"]:checked')).map(cb => cb.value),
            verificationCode: document.getElementById('verificationCode') ? document.getElementById('verificationCode').value : undefined
        };
        
        // --- 3. 백엔드 API 호출 ---
        try {
            const response = await fetch(`${API_BASE_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            const result = await response.json();

            if (response.ok) {
                alert('회원가입이 성공적으로 완료되었습니다! 로그인 페이지로 이동합니다.');
                window.location.href = 'main_login.html';
            } else {
                alert(result.message || '회원가입에 실패했습니다.');
            }
        } catch (error) {
            console.error('회원가입 요청 실패:', error);
            alert('회원가입 중 오류가 발생했습니다.');
        }
    }

    // --- 4. 이벤트 리스너(기능) 연결 ---
    
    // 회원가입 폼 제출 이벤트
    document.getElementById('signupForm').addEventListener('submit', handleSignup);
    
    // 산업분류코드 'ⓘ' 아이콘 클릭 시 모달 열기
    document.getElementById('industryCodeInfoIcon').addEventListener('click', () => {
        initializeIndustryModal({
            initialSelection: selectedIndustryCodes,
            onConfirm: (confirmedSelection) => {
                selectedIndustryCodes = confirmedSelection;
                renderSelectedCodes();
            }
        });
    });

    // 우편번호 검색 버튼
    document.getElementById('searchPostalCodeBtn').addEventListener('click', () => {
        openPostcodeSearch({
            postcodeFieldId: 'companyPostalCode',
            addressFieldId: 'companyAddress',
            detailAddressFieldId: 'companyAddressDetail'
        });
    });

    // 약관 전체 동의 체크박스
    const agreeAllCheckbox = document.getElementById('agreeAll');
    const individualCheckboxes = document.querySelectorAll('.agreement-section input[type="checkbox"]:not(#agreeAll)');
    if (agreeAllCheckbox) {
        agreeAllCheckbox.addEventListener('change', function() {
            individualCheckboxes.forEach(checkbox => { checkbox.checked = this.checked; });
        });
    }

    // 이메일 인증번호 발송 버튼
    document.getElementById('sendVerificationBtn').addEventListener('click', async () => {
        const emailInput = document.getElementById('contactPersonEmail');
        const emailMessage = document.getElementById('email-message');
        const sendBtn = document.getElementById('sendVerificationBtn');
        const email = emailInput.value;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return alert('올바른 이메일 주소를 입력해주세요.');
        }
        
        emailMessage.textContent = '';
        sendBtn.disabled = true;
        sendBtn.textContent = '발송 중...';

        try {
            const response = await fetch(`${API_BASE_URL}/auth/send-verification-email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const result = await response.json();

            if (response.ok) {
                document.getElementById('verificationCodeSection').style.display = 'block';
                emailMessage.textContent = result.message;
                emailMessage.style.color = 'green';
                // 타이머 로직 추가...
            } else {
                emailMessage.textContent = result.message;
                emailMessage.style.color = 'red';
                sendBtn.disabled = false;
                sendBtn.textContent = '인증번호 발송';
            }
        } catch (error) {
            emailMessage.textContent = '오류가 발생했습니다.';
            emailMessage.style.color = 'red';
            sendBtn.disabled = false;
            sendBtn.textContent = '인증번호 발송';
        }
    });

    // 비밀번호 유효성 및 일치 검사
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const passwordMessage = document.getElementById('password-message');

    function validatePassword() {
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        if (password === "" && passwordConfirm === "") {
             passwordMessage.textContent = '';
             return;
        }
        if (password !== passwordConfirm) {
            passwordMessage.textContent = '비밀번호가 일치하지 않습니다.';
            passwordMessage.style.color = 'red';
        } else {
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (passwordRegex.test(password)) {
                passwordMessage.textContent = '안전한 비밀번호입니다.';
                passwordMessage.style.color = 'green';
            } else {
                passwordMessage.textContent = '비밀번호는 8자 이상이며, 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.';
                passwordMessage.style.color = 'red';
            }
        }
    }
    passwordInput.addEventListener('keyup', validatePassword);
    passwordConfirmInput.addEventListener('keyup', validatePassword);

});