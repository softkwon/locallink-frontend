// js/admin_common.js
import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

export async function checkAdminPermission(requiredRoles) {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return false;
    }

    try {
        const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!meRes.ok) throw new Error('인증에 실패했습니다.');

        const meResult = await meRes.json();
        const userRole = meResult.user.role;

        // ★★★ 수정된 권한 확인 로직 ★★★
        // 1. 'super_admin'은 항상 모든 권한을 가집니다.
        if (userRole === 'super_admin') {
            return true;
        }
        
        // 2. 'vice_super_admin'은 'super_admin' 전용 권한이 아닐 경우 접근을 허용합니다.
        if (userRole === 'vice_super_admin' && !requiredRoles.includes('super_admin')) {
            return true;
        }

        // 3. 그 외 역할은, 요구되는 역할 목록에 자신의 역할이 포함되어 있는지 확인합니다.
        if (requiredRoles.includes(userRole)) {
            return true;
        }

        // 모든 조건을 통과하지 못하면 권한 없음 처리
        alert('접근 권한이 없습니다.');
        window.location.href = 'admin_dashboard.html';
        return false;

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
export function getCompanySizeName(sizeCode) {
    const sizeMap = {
        'large': '대기업',
        'medium': '중견기업',
        'small_medium': '중소기업',
        'small_micro': '소기업/소상공인'
    };
    return sizeMap[sizeCode] || sizeCode; // 맵에 없는 값이면 원래 코드를 그대로 반환
}
