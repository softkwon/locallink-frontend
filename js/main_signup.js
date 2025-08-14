
import { API_BASE_URL } from '/js/config.js';
import { initializeIndustryModal } from '/js/components/industry_modal.js';
import { openPostcodeSearch } from '/js/helpers/postcode_helper.js';

document.addEventListener('DOMContentLoaded', function() {
    
    let selectedIndustryCodes = []; 
    let emailVerificationTimer; 

    // --- 페이지의 HTML 요소들을 변수에 할당 ---
    const signupForm = document.getElementById('signupForm');
    const industryCodeInfoIcon = document.getElementById('industryCodeInfoIcon');
    const searchPostalCodeBtn = document.getElementById('searchPostalCodeBtn');
    const sendVerificationBtn = document.getElementById('sendVerificationBtn');
    const agreeAllCheckbox = document.getElementById('agreeAll');
    const individualCheckboxes = document.querySelectorAll('.agreement-section input[type="checkbox"]');
    const passwordInput = document.getElementById('password');
    const passwordConfirmInput = document.getElementById('passwordConfirm');
    const passwordMessage = document.getElementById('password-message');

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

        // --- 1. 모든 유효성 검사 ---
        if (!document.getElementById('agreeTerms').checked || !document.getElementById('agreePrivacy').checked) {
            return alert('필수 약관에 동의해주세요.');
        }
        if (!signupForm.checkValidity()) {
            signupForm.reportValidity(); 
            return;
        }
        if (selectedIndustryCodes.length === 0) {
            return alert('산업분류코드를 선택해주세요.');
        }
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;
        if (password !== passwordConfirm) {
            return alert('비밀번호가 일치하지 않습니다.');
        }

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
            verificationCode: document.getElementById('verificationCode') ? document.getElementById('verificationCode').value : undefined,
            referral_code: document.getElementById('referral_code').value.trim()
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

    /** 비밀번호 유효성 및 일치 검사 함수 */
    function validatePassword() {
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        if (password === "" && passwordConfirm === "") {
             passwordMessage.textContent = '';
             return;
        }
        
        // 비밀번호 일치 여부 먼저 확인
        if (passwordConfirm !== "" && password !== passwordConfirm) {
            passwordMessage.textContent = '비밀번호가 일치하지 않습니다.';
            passwordMessage.style.color = 'red';
        } else {
            // 비밀번호 형식 유효성 검사
            const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
            if (passwordRegex.test(password)) {
                passwordMessage.textContent = '안전한 비밀번호입니다.';
                passwordMessage.style.color = 'green';
            } else {
                passwordMessage.textContent = '비밀번호는 8자 이상이며, 대/소문자, 숫자, 특수문자를 모두 포함해야 합니다.';
                passwordMessage.style.color = 'red';
            }
            // 확인 입력란에 입력이 있고, 일치할 때 메시지 변경
            if (passwordConfirm !== "" && password === passwordConfirm) {
                 passwordMessage.textContent = '비밀번호가 일치합니다.';
                 passwordMessage.style.color = 'green';
            }
        }
    }

    // --- 4. 이벤트 리스너(기능) 연결 ---
    
    // ✨ [수정] 폼 자체에 'submit' 이벤트를 연결합니다. 이것이 가장 표준적인 방법입니다.
    if(signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // 산업분류코드 'ⓘ' 아이콘 클릭 시 모달 열기
    if(industryCodeInfoIcon) {
        industryCodeInfoIcon.addEventListener('click', () => {
            initializeIndustryModal({
                initialSelection: selectedIndustryCodes,
                onConfirm: (confirmedSelection) => {
                    selectedIndustryCodes = confirmedSelection;
                    renderSelectedCodes();
                }
            });
        });
    }

    // 우편번호 검색 버튼
    if(searchPostalCodeBtn) {
        searchPostalCodeBtn.addEventListener('click', () => {
            openPostcodeSearch({
                postcodeFieldId: 'companyPostalCode',
                addressFieldId: 'companyAddress',
                detailAddressFieldId: 'companyAddressDetail'
            });
        });
    }

    // 약관 전체 동의 체크박스
    if (agreeAllCheckbox) {
        agreeAllCheckbox.addEventListener('change', function() {
            // '전체 동의' 체크박스 자신을 제외하고 상태를 변경합니다.
            individualCheckboxes.forEach(checkbox => {
                if(checkbox.id !== 'agreeAll') {
                   checkbox.checked = this.checked;
                }
            });
        });
    }

    // 이메일 인증번호 발송 버튼
    if(sendVerificationBtn) {
        sendVerificationBtn.addEventListener('click', async () => {
            const emailInput = document.getElementById('contactPersonEmail');
            const emailMessage = document.getElementById('email-message');
            const email = emailInput.value;

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return alert('올바른 이메일 주소를 입력해주세요.');
            }
            
            emailMessage.textContent = '';
            sendVerificationBtn.disabled = true;
            sendVerificationBtn.textContent = '발송 중...';

            try {
                const response = await fetch(`${API_BASE_URL}/auth/send-verification-email`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const result = await response.json();

                if (response.ok) {
                    document.getElementById('verificationCodeSection').style.display = 'block';
                    emailMessage.textContent = result.message || "인증번호가 발송되었습니다.";
                    emailMessage.style.color = 'green';
                    // TODO: 타이머 로직 시작
                } else {
                    emailMessage.textContent = result.message || "인증번호 발송에 실패했습니다.";
                    emailMessage.style.color = 'red';
                    sendVerificationBtn.disabled = false;
                    sendVerificationBtn.textContent = '인증번호 발송';
                }
            } catch (error) {
                console.error("Email verification error:", error);
                emailMessage.textContent = '오류가 발생했습니다. 다시 시도해주세요.';
                emailMessage.style.color = 'red';
                sendVerificationBtn.disabled = false;
                sendVerificationBtn.textContent = '인증번호 발송';
            }
        });
    }

    // 비밀번호 유효성 및 일치 검사
    if(passwordInput) passwordInput.addEventListener('keyup', validatePassword);
    if(passwordConfirmInput) passwordConfirmInput.addEventListener('keyup', validatePassword);

});