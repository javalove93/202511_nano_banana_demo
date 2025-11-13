
# 20251113 1500 HTML 및 스크립트 분리 계획

## 목표

`templates` 디렉토리에 있는 HTML 파일들에서 JavaScript 코드를 별도의 `.js` 파일로 분리하여 코드의 가독성과 유지보수성을 높입니다.

## 작업 절차

1.  **`static/js` 디렉토리 생성**: 분리된 JavaScript 파일들을 저장할 `static/js` 디렉토리를 생성합니다.
2.  **HTML 파일 분석 및 스크립트 분리**:
    *   `templates/nano_banana.html`
    *   `templates/admin.html`
    *   `templates/index.html`
    위 파일들을 순서대로 확인하여 내부에 포함된 `<script>` 태그 안의 JavaScript 코드를 추출합니다.
3.  **JavaScript 파일 생성**:
    *   추출된 스크립트 코드를 각각 `static/js/nano_banana.js`, `static/js/admin.js`, `static/js/index.js` 파일로 저장합니다.
4.  **HTML 파일 수정**:
    *   기존의 인라인 스크립트 코드를 제거합니다.
    *   분리된 JavaScript 파일을 로드하도록 `<script src="..."></script>` 태그를 `<body>` 태그가 끝나기 직전에 추가합니다.

## 예상 결과물

*   `static/js/nano_banana.js`
*   `static/js/admin.js`
*   `static/js/index.js`
*   `templates/nano_banana.html` (스크립트 참조 포함)
*   `templates/admin.html` (스크립트 참조 포함)
*   `templates/index.html` (스크립트 참조 포함)

## 다음 단계

*   위 계획에 대한 사용자 확인을 받은 후 실제 파일 분리 작업을 시작합니다.

## 작업 완료 기록

### 완료된 작업

1. ✅ `static/js` 디렉토리 생성 완료
2. ✅ `templates/nano_banana.html` 스크립트 분리
   - 인라인 스크립트 (`<script>` 태그 내용)를 `static/js/nano_banana.js`로 추출
   - HTML 파일에서 외부 JavaScript 파일 참조로 변경: `<script src="{{ url_for('static', filename='js/nano_banana.js') }}"></script>`
3. ✅ `templates/admin.html` 확인
   - 인라인 JavaScript 없음, 작업 불필요
4. ✅ `templates/index.html` 스크립트 분리
   - 인라인 스크립트를 `static/js/index.js`로 추출
   - HTML 파일에서 외부 JavaScript 파일 참조로 변경: `<script src="{{ url_for('static', filename='js/index.js') }}"></script>`

### 생성된 파일

- `static/js/nano_banana.js` - nano_banana.html의 JavaScript 코드 (약 1630줄)
- `static/js/index.js` - index.html의 JavaScript 코드 (약 345줄)

### 수정된 파일

- `templates/nano_banana.html` - 인라인 스크립트 제거, 외부 스크립트 참조 추가
- `templates/index.html` - 인라인 스크립트 제거, 외부 스크립트 참조 추가

모든 작업이 성공적으로 완료되었습니다.
