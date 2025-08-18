import { API_BASE_URL, STATIC_BASE_URL } from './config.js';

export async function checkAdminPermission(requiredRoles, returnUser = false) {
    const token = localStorage.getItem('locallink-token');
    if (!token) {
        alert('로그인이 필요합니다.');
        window.location.href = 'main_login.html';
        return returnUser ? { hasPermission: false, user: null } : false;
    }

    try {
        const meRes = await fetch(`${API_BASE_URL}/users/me`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!meRes.ok) throw new Error('인증에 실패했습니다.');

        const meResult = await meRes.json();
        if (!meResult.success) throw new Error(meResult.message || '사용자 정보를 가져올 수 없습니다.');
        
        const user = meResult.user;
        const userRole = user.role;
        let hasPermission = false;

        if (userRole === 'super_admin') {
            hasPermission = true;
        } else if (userRole === 'vice_super_admin' && !requiredRoles.includes('super_admin')) {
            hasPermission = true;
        } else if (requiredRoles.includes(userRole)) {
            hasPermission = true;
        }

        if (hasPermission) {
            return returnUser ? { hasPermission: true, user: user } : true;
        }

        alert('접근 권한이 없습니다.');
        window.location.href = 'admin_dashboard.html';
        return returnUser ? { hasPermission: false, user: null } : false;

    } catch (e) {
        alert(e.message || '인증 정보가 유효하지 않습니다.');
        localStorage.removeItem('locallink-token');
        window.location.href = 'main_login.html';
        return returnUser ? { hasPermission: false, user: null } : false;
    }
}


export function getCompanySizeName(sizeCode) {
    const sizeMap = {
        'large': '대기업',
        'medium': '중견기업',
        'small_medium': '중소기업',
        'small_micro': '소기업/소상공인'
    };
    return sizeMap[sizeCode] || sizeCode; 
}
