# 20251113 1700 Nano Banana 기능 사용자 인증 계획

이 문서는 `app_nano_banana.py`의 'Generate' 및 'Save Demo' 기능에 대한 사용자 인증 구현 계획을 기술합니다.

---

### **1. 목표**

-   'Generate' 또는 'Save Demo' 기능 사용 시 사용자가 로그인했는지 확인합니다.
-   로그인하지 않은 경우, 로그인 다이얼로그(팝업)를 표시합니다.
-   사용자는 어드민 페이지에서 관리되는 계정(`user_accounts` 컬렉션)으로 로그인합니다.
-   로그인 시, 계정의 만료일(`expires_at`)을 확인하여 만료된 계정은 접근을 차단합니다.
-   로그인에 성공하면, 인증 토큰(JWT)을 발급하여 브라우저의 로컬 스토리지(Local Storage)에 저장합니다.
-   사용자가 페이지를 다시 방문했을 때 로컬 스토리지에 유효한 토큰이 있으면 자동으로 로그인 상태를 유지합니다.
-   관리자 페이지(`/admin`)는 `.env` 파일에 지정된 특정 관리자 계정(`ADMIN_USERNAME`)만 접근할 수 있도록 제한합니다.

---

### **2. 기술 스택**

-   **백엔드**: Python, Flask, Blueprint
-   **프론트엔드**: HTML, CSS, **JavaScript** (로그인 UI 및 API 연동)
-   **데이터베이스**: Google Cloud Firestore
-   **Python 라이브러리 추가**:
    -   `PyJWT`: JSON Web Token 생성 및 검증을 위한 라이브러리.

---

### **3. 프로젝트 구조 (변경되는 파일)**

```
.
├── app_nano_banana.py         # 로그인 API 및 토큰 검증 로직 추가
├── templates/
│   └── nano_banana.html       # 로그인 다이얼로그 UI 및 관련 JavaScript 로직 추가
├── requirements.txt         # PyJWT 라이브러리 추가
└── .env                     # ADMIN_USERNAME 환경 변수 추가
```

---

### **4. 개발 단계별 계획**

**1단계: 백엔드 설정 및 로그인 API 구현**

-   **`requirements.txt` 업데이트**:
    -   `PyJWT`를 의존성 목록에 추가합니다.
-   **`.env` 파일 구조 정의 추가**:
    -   `ADMIN_USERNAME`: 관리자 페이지 접근 권한을 가질 사용자의 ID (예: "admin").
-   **로그인 API 엔드포인트 생성 (`app_nano_banana.py`)**:
    -   `POST /nano_banana/login` 라우트를 추가합니다.
    -   **로직**:
        1.  요청 본문(JSON)에서 `user_id`와 `password`를 받습니다.
        2.  Firestore의 `ACCOUNTS_ID` 컬렉션에서 해당 `user_id`의 문서를 조회합니다.
        3.  사용자가 없으면 `401 Unauthorized` 오류를 반환합니다.
        4.  `werkzeug.security.check_password_hash`를 사용해 비밀번호가 일치하는지 확인합니다. 일치하지 않으면 `401` 오류를 반환합니다.
        5.  사용자 문서의 `expires_at` 필드를 확인합니다. 만료일이 지났으면 `401` 오류를 반환합니다.
        6.  모든 검증을 통과하면, `PyJWT`를 사용해 JWT(JSON Web Token)를 생성합니다. 토큰에는 `user_id`와 만료 시간(`exp`)만 포함합니다.
        7.  생성된 토큰을 JSON 응답으로 클라이언트에 반환합니다. (`{'token': '...'}`)

**2단계: 기존 API 보안 강화 (토큰 검증)**

-   **인증 데코레이터(Decorator) 생성 (`app_nano_banana.py` 및 `app_admin.py`)**:
    -   `@token_required(admin_only=False)`와 같이 관리자 전용 여부를 인자로 받는 데코레이터를 만듭니다.
    -   **로직 (강화)**:
        1.  요청 헤더에서 `Authorization: Bearer <token>` 값을 확인하고 토큰을 추출합니다.
        2.  토큰이 없거나 형식이 유효하지 않으면 `401 Unauthorized`를 반환합니다.
        3.  `PyJWT`를 사용해 토큰을 디코딩하고 `user_id`를 추출합니다. 서명이나 형식이 유효하지 않으면 `401`을 반환합니다.
        4.  추출된 `user_id`를 사용하여 Firestore에서 최신 사용자 문서를 조회합니다.
        5.  사용자 문서가 존재하지 않거나, 문서 내 `expires_at` 필드가 현재 시간보다 이전(만료)이면 `401`을 반환합니다.
        6.  `admin_only=True`인 경우, `user_id`가 `.env`의 `ADMIN_USERNAME`과 일치하는지 확인합니다. 일치하지 않으면 `403 Forbidden`을 반환합니다.
        7.  모든 검증을 통과하면, 현재 사용자 정보를 요청 컨텍스트(예: `g.user`)에 저장하고 원래 함수를 실행합니다.
-   **기존 라우트에 데코레이터 적용**:
    -   `app_nano_banana.py`의 `/generate_nano_banana`, `/save_nano_banana_demo` 라우트에는 `@token_required()`를 적용합니다.
    -   `app_admin.py`의 모든 라우트에는 `@token_required(admin_only=True)`를 적용하여 지정된 관리자만 접근할 수 있도록 보호합니다.

**3단계: 프론트엔드 로그인 UI 및 로직 구현 (`templates/nano_banana.html` 및 `templates/admin.html`)**

-   **로그인 다이얼로그 UI 추가**:
    -   HTML로 사용자 ID와 비밀번호를 입력받는 폼을 포함한 모달(modal) 창을 만듭니다.
    -   기본적으로는 보이지 않도록 CSS (`display: none;`)로 스타일을 지정합니다.
-   **JavaScript 로직 구현**:
    -   **상태 관리**: 페이지 로드 시, 로컬 스토리지에 유효한 토큰이 있는지 확인하여 로그인 상태를 관리합니다.
    -   **기능 호출 가로채기(Intercept)**:
        1.  사용자가 'Generate'나 'Save' 버튼을 클릭했을 때, 바로 API를 호출하는 대신 로그인 상태를 먼저 확인합니다.
        2.  로그인 상태가 아니면(로컬 스토리지에 토큰이 없으면), 기본 동작을 중단하고 로그인 다이얼로그를 표시합니다.
    -   **로그인 처리**:
        1.  사용자가 로그인 폼을 제출하면, `fetch`를 사용해 `/nano_banana/login` API로 ID와 비밀번호를 전송합니다.
        2.  로그인에 성공하면, 응답으로 받은 토큰을 `localStorage.setItem('authToken', token)`을 사용해 로컬 스토리지에 저장합니다.
        3.  로그인 다이얼로그를 닫고, 원래 시도했던 'Generate' 또는 'Save' 기능을 다시 실행합니다.
        4.  로그인에 실패하면, 다이얼로그에 오류 메시지를 표시합니다.
    -   **인증된 API 호출**:
        1.  'Generate', 'Save' 등 보호된 API를 호출할 때, 로컬 스토리지에서 토큰을 가져옵니다.
        2.  `fetch` 요청의 헤더에 `Authorization: 'Bearer ' + token`을 포함하여 전송합니다.
