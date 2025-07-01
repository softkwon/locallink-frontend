// js/legal_page_loader.js (2025-07-01 23:35:00)
document.addEventListener('DOMContentLoaded', async () => {
    const path = window.location.pathname;
    let type = '';
    let pageTitle = '';

    if (path.includes('terms')) {
        type = 'terms';
        pageTitle = '이용약관';
    } else if (path.includes('privacy')) {
        type = 'privacy';
        pageTitle = '개인정보 처리방침';
    } else if (path.includes('marketing')) {
        type = 'marketing';
        pageTitle = '마케팅 정보 수신 동의';
    }

    const titleEl = document.getElementById('legal-title');
    const contentEl = document.getElementById('legal-content');
    
    if(titleEl) titleEl.textContent = pageTitle;
    document.title = `${pageTitle} - LocalLink`;

    if (!type) {
        if(contentEl) contentEl.textContent = '잘못된 페이지입니다.';
        return;
    }

    try {
      // ★★★ API_BASE_URL을 사용하여 전체 API 주소를 만듭니다. ★★★
      const response = await fetch(`${API_BASE_URL}/content/legal/${type}`);
      const result = await response.json();
      
      if(result.success) {
          if(contentEl) contentEl.textContent = result.content;
      } else {
          if(contentEl) contentEl.textContent = '내용을 불러올 수 없습니다.';
      }
    } catch (e) {
      if(contentEl) contentEl.textContent = '오류가 발생했습니다.';
    }
});