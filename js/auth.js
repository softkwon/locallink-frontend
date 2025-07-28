// js/auth.js (2025-07-01 23:55:00) - 최종 완성본
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

let sessionTimerInterval; // 세션 타이머의 interval ID를 저장하는 전역 변수

// --- 모바일 햄버거 메뉴 기능 ---
/**
 * 파일명: js/auth.js
 * 수정 위치: initializeMobileMenu 함수 전체
 * 수정 일시: 2025-07-04 03:50
 */
function initializeMobileMenu() {
    const toggleButton = document.getElementById('mobile-menu-toggle');
    const mobileMenu = document.getElementById('mobile-menu');
    const overlay = document.getElementById('mobile-menu-overlay');
    const desktopNavList = document.querySelector('.desktop-nav > ul'); // 복사할 원본 메뉴 리스트

    if (!toggleButton || !mobileMenu || !desktopNavList || !overlay) return;

    // --- ★★★ 메뉴 복제 로직 수정 ★★★ ---
    // 기존 innerHTML 복사 대신, 각 메뉴 항목을 순회하며 '현재 href 속성'을 복사합니다.
    const mobileNavList = document.createElement('ul');
    
    // 데스크탑 메뉴의 모든 li 항목을 가져옵니다.
    const desktopListItems = desktopNavList.querySelectorAll(':scope > li');

    desktopListItems.forEach(item => {
        // 각 항목을 그대로 복제합니다. 이렇게 하면 이벤트 리스너는 복제되지 않지만,
        // href나 class 같은 속성은 그대로 복사됩니다.
        const clonedItem = item.cloneNode(true);
        mobileNavList.appendChild(clonedItem);
    });

    mobileMenu.innerHTML = ''; // 기존 내용을 비우고
    mobileMenu.appendChild(mobileNavList); // 새로 만든 리스트를 추가합니다.

    // --- (이하 메뉴 열고 닫는 기능은 기존과 동일) ---
    function openMenu() {
        mobileMenu.classList.add('is-open');
        overlay.classList.add('is-active');
    }
    function closeMenu() {
        mobileMenu.classList.remove('is-open');
        overlay.classList.remove('is-active');
    }

    toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        // ★★★ 다른 페이지의 스크립트가 링크를 업데이트할 시간을 벌기 위해, 메뉴를 열 때마다 내용을 다시 복제합니다. ★★★
        if (!mobileMenu.classList.contains('is-open')) {
            const currentDesktopListItems = desktopNavList.querySelectorAll(':scope > li');
            const newMobileNavList = document.createElement('ul');
            currentDesktopListItems.forEach(item => {
                newMobileNavList.appendChild(item.cloneNode(true));
            });
            mobileMenu.innerHTML = '';
            mobileMenu.appendChild(newMobileNavList);
        }
        
        mobileMenu.classList.contains('is-open') ? closeMenu() : openMenu();
    });

    overlay.addEventListener('click', closeMenu);
}

document.addEventListener('DOMContentLoaded', function() {
    const logoImg = document.getElementById('headerLogoImg');
    if (logoImg) {
        logoImg.src = `images/logo.png`;
    }
    
    checkLoginAndRenderHeader();
    loadAndRenderFooter(); 
    initializeMobileMenu(); 
});

async function checkLoginAndRenderHeader() {
    const menuContainer = document.getElementById('user-menu-container');
    if (!menuContainer) return;

    const token = localStorage.getItem('locallink-token');

    if (!token) {
        menuContainer.innerHTML = `<a href="main_login.html" class="button-outline" style="margin-right:10px;">로그인</a><a href="main_signup.html" class="button-primary">회원가입</a>`;
        attachHeaderLinkListeners();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) return logout('로그인 시간이 만료되었습니다. 다시 로그인 해주세요.');
        
        const result = await response.json();
        if (!result.success) return logout('사용자 정보를 가져올 수 없습니다.');

        const user = result.user;
        const isAdmin = ['super_admin', 'user_manager', 'content_manager'].includes(user.role);
        const adminLink = isAdmin ? `<a href="admin_dashboard.html">관리자 페이지</a>` : '';
        const profileImgUrl = (user.profile_image_url && user.profile_image_url.startsWith('http'))
            ? user.profile_image_url
            : `${STATIC_BASE_URL}/images/default_avatar.png`;
        
        const dropdownHtml = `
            <div class="dropdown-user-info">
                <strong>${user.company_name || '사용자'}</strong><br>
                <small>${user.email}</small>
            </div>
            <a href="main_member_info.html">회원정보 수정</a>
            <div class="dropdown-divider"></div>
            <a href="#" data-action="show-history">나의 진단 이력</a>
            <a href="main_my_esg_dashboard.html">나의 ESG 프로그램</a>
            <a href="#" data-action="show-inquiries">나의 문의내역</a>
            ${adminLink ? `<div class="dropdown-divider"></div>${adminLink}` : ''}
            <div class="dropdown-divider"></div>
            <a href="#" id="logoutBtn" style="color: #dc3545;">로그아웃</a>
            <div class="dropdown-session-info">
                <label>남은 시간:</label>
                <span id="session-timer"></span>
                <button id="extendSessionBtn" class="button-sm-icon" title="세션 1시간 연장">🔄</button>
            </div>
        `;
        
        // ★★★ 수정된 부분 ★★★
        // 기존 menuContainer의 innerHTML을 수정하여, 알림 아이콘 관련 HTML을 user-menu 앞에 추가합니다.
        menuContainer.innerHTML = `
            <div class="notification-container">
                <button id="notification-bell-btn" class="notification-bell">
                    🔔
                    <span id="notification-dot" class="notification-dot hidden"></span>
                </button>
                <div id="notification-panel" class="notification-panel hidden">
                    <div class="notification-header">알림</div>
                    <ul id="notification-list">
                        <li>알림을 불러오는 중...</li>
                    </ul>
                </div>
            </div>
            <span class="user-level-badge level-${user.level}">LV.${user.level}</span>
            <div id="user-menu">
                <button id="user-menu-button" style="background-image: url('${profileImgUrl}')" title="${user.company_name || '사용자'}님 메뉴"></button>
                <div id="user-menu-dropdown" style="display: none;">${dropdownHtml}</div>
            </div>
        `;

        attachHeaderLinkListeners();
        startSessionTimer(token);
        
        // ★★★ 추가된 부분 ★★★
        // 사용자 메뉴가 그려진 후, 알림 기능을 초기화하는 함수를 호출합니다.
        initializeNotifications();

    } catch (error) {
        console.error("사용자 메뉴 생성 중 에러:", error);
        menuContainer.innerHTML = `<a href="main_login.html">로그인</a>`;
    }
}

/**
 * 헤더의 모든 링크와 버튼에 이벤트 리스너를 연결하는 함수
 */
function attachHeaderLinkListeners() {
    const token = localStorage.getItem('locallink-token');

    // '심화진단' 버튼 클릭 이벤트
    const advancedLink = document.getElementById('startAdvancedDiagnosisLink');
    if (advancedLink) {
        advancedLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('관리자에게 문의하세요.');
        });
    }

    // '간이진단' 버튼 클릭 이벤트
    const simpleLink = document.getElementById('startSimpleDiagnosisLink');
    if(simpleLink) {
        simpleLink.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!token) { 
                alert('로그인이 필요한 서비스입니다.');
                return window.location.href = 'main_login.html';
            }
            try {
                const response = await fetch(`${API_BASE_URL}/diagnoses/count`, { headers: { 'Authorization': `Bearer ${token}` } });
                const result = await response.json();
                if (result.success && result.count < result.limit) {
                    sessionStorage.removeItem('currentDiagnosisId');
                    window.location.href = 'survey_step1.html';
                } else {
                    alert(`진단 횟수(${result.limit}회)를 모두 사용하셨습니다.\n회원정보에서 이전 진단 기록을 삭제하고 다시 시도해주세요.`);
                }
            } catch (error) { alert('오류가 발생했습니다.'); }
        });
    }

    // 사용자 메뉴 드롭다운 관련 이벤트
    const menuButton = document.getElementById('user-menu-button');
    const dropdown = document.getElementById('user-menu-dropdown');
    if (menuButton && dropdown) {
        menuButton.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
        });
        dropdown.addEventListener('click', async (e) => {
            const targetLink = e.target.closest('a');
            if (targetLink && targetLink.dataset.action) {
                e.preventDefault();
                const action = targetLink.dataset.action;
                if (action === 'show-history') await fetchAndShowHistory();
                else if (action === 'show-inquiries') await fetchAndShowInquiries();
            }
        });
    }
    document.getElementById('logoutBtn')?.addEventListener('click', (e) => { e.preventDefault(); logout(); });
    document.getElementById('extendSessionBtn')?.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            const currentToken = localStorage.getItem('locallink-token');
            const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${currentToken}` }
            });
            const refreshResult = await refreshResponse.json();
            if(refreshResult.success) {
                localStorage.setItem('locallink-token', refreshResult.token);
                startSessionTimer(refreshResult.token);
                alert('세션이 1시간 연장되었습니다.');
            } else { throw new Error(refreshResult.message); }
        } catch(error) {
            alert('로그인 연장이 필요합니다. 다시 로그인해주세요.');
            logout();
        }
    });
    document.addEventListener('click', (e) => {
        if (menuButton && dropdown && !menuButton.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });
}

/**
 * 로그아웃을 처리하는 공통 함수
 */
function logout(message = '로그아웃 되었습니다.') {
    localStorage.removeItem('locallink-token');
    sessionStorage.clear();
    if(sessionTimerInterval) clearInterval(sessionTimerInterval);
    alert(message);
    window.location.href = 'index.html';
}


function startSessionTimer(token) {
    if (sessionTimerInterval) clearInterval(sessionTimerInterval);
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000;
        const timerElement = document.getElementById('session-timer');
        if(!timerElement) return;

        sessionTimerInterval = setInterval(() => {
            const remainingTime = expirationTime - Date.now();
            if (remainingTime <= 0) {
                logout('로그인 시간이 만료되었습니다.');
                return;
            }
            const minutes = Math.floor((remainingTime / 1000 / 60) % 60);
            const seconds = Math.floor((remainingTime / 1000) % 60);
            timerElement.textContent = `(${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')})`;
        }, 1000);
    } catch (e) {
        console.error("토큰 디코딩 또는 타이머 설정 오류:", e);
    }
}

/**
 * 모달창을 생성하고 화면에 표시하는 공통 함수
 */
function showModal(title, contentHtml, onModalOpen) {
    document.querySelector('.modal-overlay')?.remove();
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header"><h3>${title}</h3><button class="modal-close-btn">&times;</button></div>
            <div class="modal-body">${contentHtml}</div>
        </div>
    `;
    document.body.appendChild(modalOverlay);
    modalOverlay.querySelector('.modal-close-btn').addEventListener('click', () => modalOverlay.remove());
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.remove();
    });
    if (onModalOpen) {
        onModalOpen(modalOverlay);
    }
}

/**
 * '나의 진단 이력' 데이터를 API로 가져와 모달로 표시하는 함수
 */
async function fetchAndShowHistory() {
    try {
        const token = localStorage.getItem('locallink-token');
        const response = await fetch(`${API_BASE_URL}/diagnoses/my-history`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await response.json();
        let contentHtml = '';
        if (result.success && result.history.length > 0) {
            result.history.forEach(item => {
                const date = new Date(item.created_at).toLocaleDateString();
                const score = parseFloat(item.total_score || 0).toFixed(1);
                // ★★★ '결과보기' 링크를 step4 전략 페이지로 수정합니다. ★★★
                contentHtml += `<div class="modal-list-item"><span>${date} - 종합점수: <strong>${score}점</strong></span><div class="button-group"><a href="survey_step3_esg_result.html?diagId=${item.id}" class="button-secondary button-sm">결과보기</a><button type="button" class="button-danger button-sm delete-diagnosis-btn" data-diag-id="${item.id}">삭제</button></div></div>`;
            });
        } else {
            contentHtml = '<p>완료된 진단 이력이 없습니다.</p>';
        }
        showModal('나의 진단 이력', contentHtml, (modal) => {
            modal.querySelector('.modal-body').addEventListener('click', async (e) => {
                if (e.target.classList.contains('delete-diagnosis-btn')) {
                    const diagId = e.target.dataset.diagId;
                    if (confirm(`진단 기록(ID: ${diagId})을 정말로 삭제하시겠습니까?`)) {
                        try {
                            const deleteRes = await fetch(`${API_BASE_URL}/diagnoses/${diagId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }});
                            const deleteResult = await deleteRes.json();
                            alert(deleteResult.message);
                            if (deleteResult.success) {
                                modal.remove();
                                fetchAndShowHistory();
                            }
                        } catch (err) { alert('삭제 중 오류 발생'); }
                    }
                }
            });
        });
    } catch (error) {
        showModal('오류', '<p>진단 이력을 불러오는 데 실패했습니다.</p>');
    }
}

/**
 * '나의 문의 내역' 데이터를 API로 가져와 모달로 표시하는 함수
 */
async function fetchAndShowInquiries() {
    try {
        const token = localStorage.getItem('locallink-token');
        const response = await fetch(`${API_BASE_URL}/inquiries/my-inquiries`, { headers: { 'Authorization': `Bearer ${token}` } });
        const result = await response.json();
        let contentHtml = '';
        if (result.success && result.inquiries.length > 0) {
             result.inquiries.forEach(item => {
                const snippet = item.content.length > 30 ? item.content.substring(0, 30) + '...' : item.content;
                contentHtml += `
                    <div class="modal-list-item" title="${item.content.replace(/"/g, '&quot;')}">
                        <span>${new Date(item.created_at).toLocaleDateString()} - [${item.inquiry_type}]</span>
                        <strong>처리상태: ${item.status}</strong>
                    </div>
                    <p class="inquiry-content-snippet">${snippet}</p>
                `;
            });
        } else {
            contentHtml = '<p>문의 내역이 없습니다.</p>';
        }
        showModal('나의 문의 내역', contentHtml);
    } catch (error) {
        showModal('오류', '<p>문의 내역을 불러오는 데 실패했습니다.</p>');
    }
}

/**
 * ★★★ getCompanySizeName 함수를 auth.js에 추가합니다. ★★★
 * 회사 규모 영문 코드를 한글명으로 변환하는 함수
 * @param {string} sizeCode - 'large', 'medium' 등 영문 코드
 * @returns {string} - '대기업', '중견기업' 등 한글명
 */
function getCompanySizeName(sizeCode) {
    const sizeMap = {
        'large': '대기업',
        'medium': '중견기업',
        'small_medium': '중소기업',
        'small_micro': '소기업/소상공인'
    };
    return sizeMap[sizeCode] || sizeCode;
}

/**
 * footer.html을 불러와서 푸터를 완성하고, 이벤트 리스너를 연결하는 함수
 */
async function loadAndRenderFooter() {
    const placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;
    try {
        const response = await fetch('components/footer.html');
        if (!response.ok) throw new Error('푸터 컴포넌트 로딩 실패');
        const html = await response.text();
        placeholder.innerHTML = html;

        const dataRes = await fetch(`${API_BASE_URL}/content/footer-data`);
        const dataResult = await dataRes.json();
        if(dataResult.success) {
            const { footerInfo, relatedSites } = dataResult;
            
            const infoContainer = document.getElementById('footer-info-container');
            if(infoContainer) {
                infoContainer.innerHTML = `
                    <p>${footerInfo.copyright || ''}</p>
                    <p>${footerInfo.company_info || ''} | 사업자등록번호: ${footerInfo.brn || ''}</p>
                    <p>${footerInfo.address || ''} | 문의: ${footerInfo.contact || ''}</p>
                    <p><a href="main_terms.html">이용약관</a> | <a href="main_privacy.html">개인정보처리방침</a></p>
                `;
            }
            
            const sitesList = document.getElementById('related-sites-list');
            if(sitesList) {
                sitesList.innerHTML = '';
                relatedSites.forEach(site => {
                    sitesList.innerHTML += `<a href="${site.url}" target="_blank">${site.name}</a>`;
                });
            }
        }
        
        // 푸터가 그려진 후, 문의하기 버튼에 기능을 연결합니다.
        attachContactModalEvents();

    } catch (error) { 
        console.error('푸터 로딩 중 오류:', error); 
    }
}

/**
 * '문의하기' 버튼에 클릭 이벤트를 연결하는 함수
 */
function attachContactModalEvents() {
    // 헤더와 푸터에 있는 모든 '문의하기' 버튼을 찾습니다.
    const contactTriggers = document.querySelectorAll('#navContactTrigger, #footerContactTrigger');
    const token = localStorage.getItem('locallink-token');

    contactTriggers.forEach(trigger => {
        if (trigger) {
            trigger.addEventListener('click', async (event) => {
                event.preventDefault();
                if (!token) {
                    alert('로그인이 필요한 서비스입니다.');
                    return window.location.href = 'main_login.html';
                }
                
                let userInfo = {};
                try {
                    const response = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
                    const result = await response.json();
                    if (result.success) userInfo = result.user;
                } catch (e) { console.error("내 정보 불러오기 실패:", e); }

                showContactModal(userInfo);
            });
        }
    });
}

/**
 * '문의하기' 모달을 동적으로 생성하고 화면에 표시하는 함수
 */
function showContactModal(user = {}) {
    document.querySelector('.modal-overlay')?.remove();

    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>문의하기</h3>
                <button class="modal-close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <form id="dynamicContactForm">
                    <div class="form-group"><label>회사명</label><input type="text" id="contact_company_name" class="form-control" value="${user.company_name || ''}" readonly></div>
                    <div class="form-group"><label>담당자명</label><input type="text" id="contact_manager_name" class="form-control" value="${user.manager_name || ''}" readonly></div>
                    <div class="form-group"><label>연락처</label><input type="tel" id="contact_phone" class="form-control" value="${user.manager_phone || ''}" readonly></div>
                    <div class="form-group"><label>이메일</label><input type="email" id="contact_email" class="form-control" value="${user.email || ''}" readonly></div>
                    <div class="form-group"><label>문의 종류</label><select id="inquiry_type" class="form-control" required>
                        <option value="서비스 이용 문의">서비스 이용 문의</option>
                        <option value="기술 지원 문의">기술 지원 문의</option>
                        <option value="제휴 및 파트너십">제휴 및 파트너십</option>
                        <option value="기타">기타</option>
                    </select></div>
                    <div class="form-group"><label>문의 내용</label><textarea id="inquiry_content" class="form-control" rows="5" required></textarea></div>
                    <div class="form-actions"><button type="submit" class="button-primary">문의 접수</button></div>
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector('.modal-close-btn').addEventListener('click', () => modalOverlay.remove());
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.remove();
    });

    modalOverlay.querySelector('#dynamicContactForm').addEventListener('submit', async function(event) {
        event.preventDefault();
        const token = localStorage.getItem('locallink-token');
        const formData = {
            company_name: document.getElementById('contact_company_name').value,
            manager_name: document.getElementById('contact_manager_name').value,
            phone: document.getElementById('contact_phone').value,
            email: document.getElementById('contact_email').value,
            inquiry_type: document.getElementById('inquiry_type').value,
            content: document.getElementById('inquiry_content').value,
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            const result = await response.json();
            if(result.success) {
                modalOverlay.remove();
                showSuccessModal();
            } else {
                alert(`문의 접수 실패: ${result.message}`);
            }
        } catch(e) {
            alert('문의 접수 중 오류가 발생했습니다.');
        }
    });
}

function showSuccessModal() {
    const successModal = document.createElement('div');
    successModal.className = 'modal-overlay';
    successModal.innerHTML = `<div class="modal-content" style="text-align:center;"><h3>문의가 성공적으로 접수되었습니다.</h3><p>빠른 시일 내에 답변드리겠습니다.</p><button id="closeSuccessModal" class="button-primary">확인</button></div>`;
    document.body.appendChild(successModal);
    successModal.querySelector('#closeSuccessModal').addEventListener('click', () => successModal.remove());
    successModal.addEventListener('click', (e) => {
        if (e.target === successModal) successModal.remove();
    });
}

/**
 * 🔔 알림 아이콘과 관련된 모든 기능을 초기화하는 함수
 */
async function initializeNotifications() {
    const token = localStorage.getItem('locallink-token');
    if (!token) return;

    const bellBtn = document.getElementById('notification-bell-btn');
    const dot = document.getElementById('notification-dot');
    const panel = document.getElementById('notification-panel');
    const list = document.getElementById('notification-list');

    // HTML 요소가 없으면 함수를 종료합니다.
    if (!bellBtn || !dot || !panel || !list) {
        console.error("Notification elements not found.");
        return;
    }

    try {
        // 1. 내 알림 목록 가져오기
        const response = await fetch(`${API_BASE_URL}/notifications`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const result = await response.json();

        if (result.success && result.notifications.length > 0) {
            const notifications = result.notifications;
            
            // 2. 안 읽은 알림이 있는지 확인하고 빨간 점 표시
            const hasUnread = notifications.some(n => !n.is_read);
            dot.classList.toggle('hidden', !hasUnread);

            // 3. 알림 목록 렌더링
            list.innerHTML = notifications.map(n => `
                <li class="${n.is_read ? 'is-read' : ''}">
                    <a href="${n.link_url || '#'}">
                        <p>${n.message}</p>
                        <small>${new Date(n.created_at).toLocaleString()}</small>
                    </a>
                </li>
            `).join('');

        } else {
            list.innerHTML = '<li>새로운 알림이 없습니다.</li>';
        }

    } catch (error) {
        console.error("알림 확인 중 오류:", error);
        list.innerHTML = '<li>알림을 불러오는 데 실패했습니다.</li>';
    }

    // 4. 벨 아이콘 클릭 이벤트 리스너 추가
    bellBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // 이벤트 버블링 방지
        panel.classList.toggle('hidden');
        
        // 알림창이 열리고, 안 읽은 알림이 있으면 '읽음' 처리 API 호출
        if (!panel.classList.contains('hidden') && !dot.classList.contains('hidden')) {
            fetch(`${API_BASE_URL}/notifications/mark-as-read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => res.json())
              .then(result => {
                if (result.success) {
                    dot.classList.add('hidden'); // API 호출 성공 시 바로 빨간 점 숨기기
                }
              });
        }
    });

    // 5. 알림창 바깥을 클릭하면 닫히도록 설정
    document.addEventListener('click', (e) => {
        if (!bellBtn.contains(e.target) && !panel.contains(e.target)) {
            panel.classList.add('hidden');
        }
    });
}

export function getMyUserId() {
    const token = localStorage.getItem('locallink-token');
    if (!token) return null;
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload.userId;
    } catch (e) {
        console.error("Token parsing error:", e);
        return null;
    }
}