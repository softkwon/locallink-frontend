/**
 * 파일명: js/helpers/modal_helper.js
 * 기능: 복사 가능한 코드를 보여주는 커스텀 모달을 생성합니다.
 * 생성 일시: 2025-07-04 03:08
 */

export function showCopyableCodeModal(title, codeString) {
    // 기존에 모달이 있다면 제거
    const existingModal = document.getElementById('copyableModal');
    if (existingModal) existingModal.remove();

    // 모달 HTML 구조 생성
    const modalHtml = `
        <div class="modal-overlay" id="copyableModalOverlay">
            <div class="modal-content" style="width: 90%; max-width: 600px;">
                <h3>${title}</h3>
                <textarea readonly class="form-control" style="height: 200px; margin-top: 15px; font-family: monospace; white-space: pre;">${codeString.trim()}</textarea>
                <div class="modal-footer" style="text-align: right; margin-top: 15px;">
                    <button id="copyableModalCloseBtn" class="button-primary">닫기</button>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // 이벤트 리스너 연결
    const modal = document.getElementById('copyableModalOverlay');
    const closeBtn = document.getElementById('copyableModalCloseBtn');

    function closeModal() {
        modal.remove();
    }

    closeBtn.onclick = closeModal;
    modal.onclick = (event) => {
        if (event.target === modal) {
            closeModal();
        }
    };
}