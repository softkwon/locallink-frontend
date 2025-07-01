// js/config.js (2025-07-02 01:10:00)

// 현재 웹사이트의 주소를 기반으로 백엔드 API 서버 주소를 자동으로 설정합니다.
const API_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000/api' // 로컬 개발 환경일 때
    : 'https://your-production-api-domain.com/api'; // ★ 나중에 실제 배포할 서버 주소로 변경

// 이미지 등 정적 파일을 위한 기본 경로
const STATIC_BASE_URL = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
    ? 'http://localhost:3000' // 로컬 개발 환경일 때
    : 'https://your-production-static-domain.com'; // ★ 나중에 실제 배포할 서버 주소로 변경