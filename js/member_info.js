import { API_BASE_URL, STATIC_BASE_URL } from './config.js';
import { openPostcodeSearch } from './helpers/postcode_helper.js';
import { initializeIndustryModal } from './components/industry_modal.js';

document.addEventListener('DOMContentLoaded', function() {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        return window.location.href = 'main_login.html';
    }

    // --- 페이지 요소 및 상태 변수 ---
    const basicInfoTable = document.getElementById('basicInfoTable');
    const historyContainer = document.getElementById('historyListContainer');
    const inquiriesContainer = document.getElementById('myInquiriesContainer');
    const editInfoBtn = document.getElementById('editInfoBtn');
    const saveInfoBtn = document.getElementById('saveInfoBtn');
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const withdrawalBtn = document.getElementById('withdrawalBtn');
    
    let currentUserData = null; 
    let selectedIndustryCodesForEdit = []; 

    // --- 페이지 초기화 함수 ---
    async function initializePage() {
        try {
            const [meRes, industriesRes] = await Promise.all([
                fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } }),
                fetch(`${API_BASE_URL}/industries`)
            ]);
            
            if (!meRes.ok) throw new Error('세션이 만료되었거나 유효하지 않습니다.');
            
            const result = await meRes.json();
            const industriesResult = await industriesRes.json();

            if (result.success) currentUserData = result.user; else throw new Error(result.message);
            window.allIndustriesDataForLookup = industriesResult.success ? industriesResult.industries : [];
            
            renderUserInfo(false);
            attachEventListeners();
            await loadAndDisplayHistory();
            await loadMyInquiries();

        } catch (error) {
            localStorage.removeItem('locallink-token');
            alert(error.message || '오류가 발생했습니다. 다시 로그인해주세요.');
            window.location.href = 'main_login.html';
        }
    }

    function renderUserInfo(isEditing = false) {
        if (!currentUserData || !document.getElementById('basicInfoTable')) return;
        const tbody = document.getElementById('basicInfoTable').querySelector('tbody');
        if (!tbody) return;

        const { email, company_name, industry_codes, representative, address, business_location, manager_name, manager_phone, interests, profile_image_url, agreed_to_marketing, used_referral_code } = currentUserData;
        
        const addressParts = (address || '').match(/(.*)\s\((\d{5})\)\s*(.*)/) || [null, address || '', '', ''];
        const mainAddress = addressParts[1];
        const postalCode = addressParts[2];
        const detailAddress = addressParts[3];

        const finalProfileImageUrl = (profile_image_url && profile_image_url.startsWith('http'))
            ? profile_image_url
            : `/images/default_avatar.png`; 

        const locations = [ { value: "", text: "선택하세요" }, { value: "서울", text: "서울특별시" }, { value: "부산", text: "부산광역시" }, { value: "대구", text: "대구광역시" }, { value: "인천", text: "인천광역시" }, { value: "광주", text: "광주광역시" }, { value: "대전", text: "대전광역시" }, { value: "울산", text: "울산광역시" }, { value: "세종", text: "세종특별자치시" }, { value: "경기", text: "경기도" }, { value: "강원", text: "강원특별자치도" }, { value: "충북", text: "충청북도" }, { value: "충남", text: "충청남도" }, { value: "전북", text: "전북특별자치도" }, { value: "전남", text: "전라남도" }, { value: "경북", text: "경상북도" }, { value: "경남", text: "경상남도" }, { value: "제주", text: "제주특별자치도" } ];
        const allInterestOptions = {
            E: [ { text: "온실가스 배출 감축", value: "E_interest_1" }, { text: "에너지 사용 효율화", value: "E_interest_2" }, { text: "폐기물 및 자원순환 관리", value: "E_interest_3" }, { text: "오염물질 저감 및 수질·대기 관리", value: "E_interest_4" }, { text: "친환경 인증 및 제품 개발", value: "E_interest_5" } ],
            S: [ { text: "근로자 인권 및 복지", value: "S_interest_1" }, { text: "안전보건 경영", value: "S_interest_2" },{ text: "지역사회협력", value: "S_interest_3" }, { text: "공정거래 및 협력사 ESG 평가", value: "S_interest_4" }, { text: "고객보호 및 서비스책임", value: "S_interest_5" } ],
            G: [ { text: "이사회 운영 및 사외이사 구성", value: "G_interest_1" }, { text: "윤리경영", value: "G_interest_2" },{ text: "임원 보수 및 책임성과 연계", value: "G_interest_3" }, { text: "주주권리 보호", value: "G_interest_4" }, { text: "ESG 리스크 관리 체계 구축", value: "G_interest_5" } ]
        };
        const safeInterests = Array.isArray(interests) ? interests : [];

        tbody.innerHTML = `
            <tr>
                <th>프로필 이미지</th>
                <td>
                    <div id="profileImagePreview" style="width:100px; height:100px; border-radius:50%; background:#eee; margin-bottom:10px; background-image: url('${finalProfileImageUrl}'); background-size: cover; background-position: center;"></div>
                    <div id="profileImageUploader" style="display: ${isEditing ? 'block' : 'none'};">
                        <input type="file" id="profileImageInput" accept="image/*" style="display: block; margin-bottom: 5px;">
                        <button type="button" id="uploadProfileImageBtn" class="button-secondary button-sm">이미지 업로드</button>
                    </div>
                </td>
            </tr>
            <tr><th>이메일 (아이디)</th><td>${email || "-"}</td></tr>
            <tr><th>회사명</th><td>${isEditing ? `<input type="text" id="edit_company_name" class="form-control" value="${company_name || ''}">` : company_name || "-"}</td></tr>
            <tr><th>산업분류코드</th><td>
                ${isEditing 
                    ? `<div style="position: relative;"><input type="text" id="edit_industry_code_display" class="form-control readonly-input" style="margin-bottom:8px;" readonly placeholder="우측 ⓘ 아이콘으로 검색/선택"><div id="selected_codes_container"></div><span class="info-icon-member-edit" id="edit_industry_btn">ⓘ</span></div>` 
                    : (industry_codes && industry_codes.length > 0) ? `<ul class="interest-list">${industry_codes.map(code => `<li>[${code}] ${window.allIndustriesDataForLookup.find(i => i.code === code)?.name || ''}</li>`).join('')}</ul>` : "<span>-</span>"}
            </td></tr>
            <tr><th>대표자명</th><td>${isEditing ? `<input type="text" id="edit_representative" class="form-control" value="${representative || ''}">` : representative || "-"}</td></tr>
            <tr><th>회사주소</th><td>
                ${isEditing 
                    ? `<div style="display:flex; flex-direction:column; gap:8px;"><div style="display:flex; gap:10px;"><input type="text" id="edit_postalCode" class="form-control readonly-input" value="${postalCode}"><button type="button" id="edit_search_post_btn" class="button-secondary">우편번호 검색</button></div><input type="text" id="edit_address" class="form-control readonly-input" value="${mainAddress}"><input type="text" id="edit_address_detail" class="form-control" value="${detailAddress}"></div>` 
                    : address || "-"}
            </td></tr>
            <tr><th>주요사업장 소재지</th><td>${isEditing ? `<select id="edit_business_location" class="form-control">${locations.map(loc => `<option value="${loc.value}" ${loc.value === business_location ? 'selected' : ''}>${loc.text}</option>`).join('')}</select>`: (locations.find(l => l.value === business_location)?.text || "-")}</td></tr>
            <tr><th>담당자명</th><td>${isEditing ? `<input type="text" id="edit_manager_name" class="form-control" value="${manager_name || ''}">` : manager_name || "-"}</td></tr>
            <tr><th>담당자 연락처</th><td>${isEditing ? `<input type="tel" id="edit_manager_phone" class="form-control" value="${manager_phone || ''}">` : manager_phone || "-"}</td></tr>
            <tr><th>관심분야</th><td>
                ${isEditing 
                    ? Object.keys(allInterestOptions).map(catKey => `<div class="interest-category-edit"><h5>${catKey}</h5><div class="checkbox-group-vertical">${allInterestOptions[catKey].map(opt => `<label><input type="checkbox" name="edit_interests" value="${opt.value}" ${ safeInterests.includes(opt.value) ? 'checked' : ''}> ${opt.text}</label>`).join('')}</div></div>`).join('')
                    : (safeInterests.length > 0) ? `<ul class="interest-list">${safeInterests.map(val => `<li>${Object.values(allInterestOptions).flat().find(opt => opt.value === val)?.text || ''}</li>`).join('')}</ul>` : "<span>-</span>"}
            </td></tr>
            <tr>
                <th>추천 코드</th>
                <td>
                    ${isEditing
                        ? (used_referral_code ? `<input type="text" class="form-control readonly-input" value="${used_referral_code}" readonly>` : `<input type="text" id="edit_referral_code" class="form-control" placeholder="추천 코드가 있다면 입력해주세요.">`)
                        : used_referral_code || "-"
                    }
                </td>
            </tr>
            <tr>
                <th>마케팅 정보 수신</th>
                <td>
                    ${isEditing 
                        ? `<label class="checkbox-label"><input type="checkbox" id="edit_agree_marketing" ${agreed_to_marketing ? 'checked' : ''}> <span>(선택) <a href="main_marketing.html" target="_blank">마케팅 정보 수신</a>에 동의합니다.</span></label>`
                        : (agreed_to_marketing ? '동의' : '미동의')
                    }
                </td>
            </tr>
        `;
        
        if (isEditing) {
            selectedIndustryCodesForEdit = (currentUserData.industry_codes || []).slice();
            renderSelectedEditCodes();
        }
    }

    /** 수정 모드에서 선택된 산업 코드를 태그로 그려주는 함수 */
    function renderSelectedEditCodes() {
        const container = document.getElementById('selected_codes_container');
        const displayInput = document.getElementById('edit_industry_code_display');
        if (!container || !displayInput) return;
        
        container.innerHTML = '';
        if (selectedIndustryCodesForEdit.length > 0) {
            displayInput.value = `${selectedIndustryCodesForEdit.length}개 선택됨`;
            selectedIndustryCodesForEdit.forEach((code, index) => {
                const industry = window.allIndustriesDataForLookup.find(i => i.code === code);
                const tag = document.createElement('span');
                tag.className = 'selected-code-tag-member';
                tag.textContent = `[${code}] ${industry ? industry.name : ''} `;
                const removeBtn = document.createElement('span');
                removeBtn.className = 'remove-code';
                removeBtn.textContent = '×';
                removeBtn.onclick = (e) => { e.stopPropagation(); selectedIndustryCodesForEdit.splice(index, 1); renderSelectedEditCodes(); };
                tag.appendChild(removeBtn);
                container.appendChild(tag);
            });
        } else {
            displayInput.placeholder = '우측 ⓘ 아이콘으로 검색/선택';
            displayInput.value = '';
        }
    }
    
    async function loadAndDisplayHistory() {
        if (!historyContainer) return;
        try {
            const response = await fetch(`${API_BASE_URL}/diagnoses/my-history`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            historyContainer.innerHTML = ''; 
            if (result.success && result.history.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'diagnosis-history-list';
                result.history.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'history-item';
                    li.innerHTML = `
                        <span class="history-item-text">
                            ${new Date(item.created_at).toLocaleDateString()} - 종합점수: <strong>${parseFloat(item.total_score || 0).toFixed(1)}점</strong>
                        </span>
                        <div class="history-item-buttons">
                            <a href="survey_step3_esg_result.html?diagId=${item.id}" class="button-secondary button-sm">결과보기</a>
                            <button type="button" class="button-danger button-sm delete-diagnosis-btn" data-diag-id="${item.id}">삭제</button>
                        </div>
                    `;
                    ul.appendChild(li);
                });
                historyContainer.appendChild(ul);
            } else {
                historyContainer.innerHTML = '<p>완료된 진단 이력이 없습니다.</p>';
            }
        } catch (error) { historyContainer.innerHTML = '<p>진단 이력을 불러오는 중 오류가 발생했습니다.</p>'; }
    }

    async function loadMyInquiries() {
        if(!inquiriesContainer) return;
        try {
            const response = await fetch(`${API_BASE_URL}/inquiries/my-inquiries`, { headers: { 'Authorization': `Bearer ${token}` } });
            const result = await response.json();
            inquiriesContainer.innerHTML = '';
            if (result.success && result.inquiries.length > 0) {
                const ul = document.createElement('ul');
                ul.className = 'inquiry-list';
                result.inquiries.forEach(item => {
                    const li = document.createElement('li');
                    li.className = 'inquiry-item';
                    // [수정] 글자 수에 따라 말줄임표(...) 처리 및 title 속성에 전체 내용 추가
                    const snippet = item.title.length > 15 ? item.title.substring(0, 15) + '...' : item.title;
                    const statusText = { 'new': 'new', 'in_progress': 'in_progress', 'resolved': 'resolved' }[item.status] || item.status;
                    
                    li.innerHTML = `
                        <span class="inquiry-item-text" title="${item.title.replace(/"/g, '&quot;')}">
                            ${new Date(item.created_at).toLocaleDateString()} - [${item.inquiry_type}] ${snippet}
                        </span>
                        <span class="inquiry-status status-${item.status}">${statusText}</span>
                    `;
                    ul.appendChild(li);
                });
                inquiriesContainer.appendChild(ul);
            } else {
                inquiriesContainer.innerHTML = '<p>문의 내역이 없습니다.</p>';
            }
        } catch(e) { inquiriesContainer.innerHTML = '<p>문의 내역을 불러오는 데 실패했습니다.</p>'; }
    }

    async function uploadProfileImage() {
        const fileInput = document.getElementById('profileImageInput');
        const uploadBtn = document.getElementById('uploadProfileImageBtn');
        if (!fileInput || fileInput.files.length === 0) {
            return alert('업로드할 이미지를 선택해주세요.');
        }
        const formData = new FormData();
        formData.append('profileImage', fileInput.files[0]);
        try {
            uploadBtn.textContent = '업로드 중...';
            uploadBtn.disabled = true;
            const response = await fetch(`${API_BASE_URL}/users/me/profile-image`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const result = await response.json();
            alert(result.message);
            if (result.success) {
                currentUserData.profile_image_url = result.profileImageUrl;
                renderUserInfo(true);
            }
        } catch (error) {
            alert('업로드 중 오류가 발생했습니다.');
        } finally {
            if(uploadBtn){
                uploadBtn.textContent = '이미지 업로드';
                uploadBtn.disabled = false;
            }
        }
    }

    /** 이벤트 리스너(기능) 연결 함수 */
    function attachEventListeners() {
        editInfoBtn.addEventListener('click', () => { 
            renderUserInfo(true); 
            editInfoBtn.classList.add('hidden');
            saveInfoBtn.classList.remove('hidden');
            cancelEditBtn.classList.remove('hidden');
        });

        cancelEditBtn.addEventListener('click', () => {
            renderUserInfo(false);
            editInfoBtn.classList.remove('hidden');
            saveInfoBtn.classList.add('hidden');
            cancelEditBtn.classList.add('hidden');
        });

        saveInfoBtn.addEventListener('click', async () => {
            // 1. 기본 정보 수집
            const updatedData = {
                companyName: document.getElementById('edit_company_name').value,
                representativeName: document.getElementById('edit_representative').value,
                address: `${document.getElementById('edit_address').value} (${document.getElementById('edit_postalCode').value}) ${document.getElementById('edit_address_detail').value}`.trim(),
                businessLocation: document.getElementById('edit_business_location').value,
                managerName: document.getElementById('edit_manager_name').value,
                managerPhone: document.getElementById('edit_manager_phone').value.replace(/\D/g, ''),
                industryCodes: selectedIndustryCodesForEdit,
                interests: Array.from(document.querySelectorAll('input[name="edit_interests"]:checked')).map(cb => cb.value),
                agreed_to_marketing: document.getElementById('edit_agree_marketing')?.checked || false
            };

            // 2. 새로 입력된 추천 코드 값 가져오기
            const referralCodeInput = document.getElementById('edit_referral_code');
            const newReferralCode = referralCodeInput ? referralCodeInput.value.trim() : null;

            try {
                // 3. 기본 정보 먼저 저장
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify(updatedData)
                });
                const result = await response.json();

                if (!result.success) {
                    throw new Error(result.message || '정보 수정에 실패했습니다.');
                }
                
                currentUserData = result.user; 

                // 4. 기본 정보 저장이 성공하고, 새 추천 코드가 입력되었으면 추천 코드 등록 API 호출
                if (newReferralCode) {
                    const referralResponse = await fetch(`${API_BASE_URL}/users/me/referral`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ referral_code: newReferralCode })
                    });
                    const referralResult = await referralResponse.json();
                    if (!referralResult.success) {
                        alert(`기본 정보는 저장되었으나, 추천 코드 등록에 실패했습니다: ${referralResult.message}`);
                    } else {
                        const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                        const meResult = await meRes.json();
                        currentUserData = meResult.user;
                    }
                }

                alert('정보가 성공적으로 수정되었습니다.');
                renderUserInfo(false);
                editInfoBtn.classList.remove('hidden');
                saveInfoBtn.classList.add('hidden');
                cancelEditBtn.classList.add('hidden');

            } catch (error) {
                alert('오류가 발생했습니다: ' + error.message);
            }
        });

        basicInfoTable.addEventListener('click', function(event) {
            if (event.target.id === 'edit_industry_btn') {
                initializeIndustryModal({
                    initialSelection: selectedIndustryCodesForEdit.map(code => ({ 
                        code: code, 
                        name: window.allIndustriesDataForLookup.find(i => i.code === code)?.name || ''
                    })),
                    onConfirm: (selection) => {
                        selectedIndustryCodesForEdit = selection.map(item => item.code);
                        renderSelectedEditCodes();
                    }
                });
            }
            if (event.target.id === 'edit_search_post_btn') {
                openPostcodeSearch({ 
                    postcodeFieldId: 'edit_postalCode', 
                    addressFieldId: 'edit_address', 
                    detailAddressFieldId: 'edit_address_detail' 
                });
            }
            if (event.target.id === 'uploadProfileImageBtn') {
                uploadProfileImage();
            }
        });

        withdrawalBtn.addEventListener('click', async () => {
            if (!confirm('정말로 탈퇴하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
            
            const password = prompt('계정 삭제를 위해 비밀번호를 입력해주세요.');
            if (!password) {
                alert('비밀번호를 입력해야 합니다.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/users/me`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                    body: JSON.stringify({ password })
                });
                const result = await response.json();
                alert(result.message);

                if (result.success) {
                    localStorage.removeItem('locallink-token');
                    window.location.href = 'index.html';
                }
            } catch (error) {
                alert('회원 탈퇴 중 오류가 발생했습니다.');
            }
        });
    }
    
    // --- 페이지 시작 ---
    initializePage();
});