// js/admin_common.js

async function checkAdminPermission(allowedRoles) {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return false;
    }

    try {
        const meRes = await fetch('${API_BASE_URL}/users/me', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!meRes.ok) throw new Error('인증에 실패했습니다.');

        const meResult = await meRes.json();
        const userRole = meResult.user.role;

        if (!allowedRoles.includes(userRole)) {
            alert('접근 권한이 없습니다.');
            window.location.href = 'admin_dashboard.html';
            return false;
        }
        return true; // 권한이 있으면 true를 반환
    } catch (e) {
        alert(e.message || '인증 정보가 유효하지 않습니다.');
        localStorage.removeItem('locallink-token');
        window.location.href = 'main_login.html';
        return false;
    }
}

/**
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
    return sizeMap[sizeCode] || sizeCode; // 맵에 없는 값이면 원래 코드를 그대로 반환
}
