/**
 * 파일명: js/helpers/postcode_helper.js
 * 기능: Daum(Kakao) 우편번호 검색 API를 호출하는 범용 헬퍼 함수
 * 수정 일시: 2025-07-03 03:00
 */

/**
 * Daum(Kakao) 우편번호 검색 API를 호출하여 팝업을 엽니다.
 * @param {object} options - 옵션 객체
 * @param {string} options.postcodeFieldId - 우편번호를 입력할 input의 ID
 * @param {string} options.addressFieldId - 기본 주소를 입력할 input의 ID
 * @param {string} options.detailAddressFieldId - 상세 주소 입력란으로 포커스를 이동시킬 input의 ID
 */
export function openPostcodeSearch(options) {
    // daum 객체가 로드되었는지 확인 (외부 스크립트)
    if (typeof daum === 'undefined' || typeof daum.Postcode !== 'function') {
        alert('우편번호 검색 서비스를 불러오는 데 실패했습니다. 페이지를 새로고침 해주세요.');
        return;
    }

    new daum.Postcode({
        oncomplete: function(data) {
            let addr = ''; // 주소 변수
            if (data.userSelectedType === 'R') { // 도로명 주소 선택
                addr = data.roadAddress;
            } else { // 지번 주소 선택
                addr = data.jibunAddress;
            }

            // 옵션으로 전달받은 ID를 사용해 값을 채웁니다.
            const postcodeField = document.getElementById(options.postcodeFieldId);
            const addressField = document.getElementById(options.addressFieldId);
            const detailAddressField = document.getElementById(options.detailAddressFieldId);

            if (postcodeField) postcodeField.value = data.zonecode;
            if (addressField) addressField.value = addr;
            if (detailAddressField) detailAddressField.focus();
        }
    }).open();
}