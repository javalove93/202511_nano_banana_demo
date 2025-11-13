# 20251113 1500 사용자 계정 관리 어드민 페이지 개발 계획 (최종)

이 문서는 Firestore에 저장된 사용자 계정을 관리하기 위한 웹 기반 어드민 페이지 개발 계획을 기술합니다. 어드민 기능은 메인 Flask 앱(`app.py`)에 블루프린트(Blueprint)로 통합됩니다.

---

### **1. 목표**

-   Firestore `user_accounts` 컬렉션의 사용자 목록을 조회합니다.
-   새로운 사용자를 추가하고, 비밀번호는 해싱하여 저장합니다.
-   기존 사용자를 삭제합니다.
-   기존 사용자의 비밀번호를 변경합니다.
-   각 사용자 계정에 만료일을 설정하고 수정합니다.
-   이 모든 기능을 단일 웹 페이지 인터페이스에서 제공합니다.

---

### **2. 기술 스택**

-   **백엔드**: Python, Flask (Blueprint)
-   **프론트엔드**: HTML, CSS (간단한 스타일링)
-   **데이터베이스**: Google Cloud Firestore
-   **Python 라이브러리**:
    -   `Flask`: 웹 프레임워크
    -   `google-cloud-firestore`: Firestore 연동
    -   `Werkzeug`: 비밀번호 해싱
    -   `python-dotenv`: 환경 변수 관리

---

### **3. 프로젝트 구조**

```
.
├── app.py               # 메인 Flask 앱 (admin 블루프린트 로드)
├── app_admin.py         # Admin 기능 블루프린트
├── templates/
│   └── admin.html       # 어드민 페이지 HTML 템플릿
├── requirements.txt     # Python 의존성 목록
├── setup_venv.sh        # Python 가상환경 설정 스크립트
├── run.sh               # app.py 애플리케이션 실행 스크립트
└── .env                 # 환경 변수 설정 파일
```

---

### **4. 개발 단계별 계획**

**1단계: 환경 설정**

-   **`requirements.txt` 확인 및 수정**:
    -   `Flask`, `google-cloud-firestore`, `Werkzeug`, `python-dotenv` 등 필요한 패키지 포함 여부 확인.
-   **`.env` 파일 구조 정의**:
    -   `ACCOUNTS_ID`: 사용자 계정 정보가 저장될 Firestore 컬렉션 이름.
    -   `GOOGLE_CLOUD_PROJECT_ID`: Google Cloud 프로젝트 ID.
    -   `FIRESTORE_DATABASE_ID`: (선택) 사용할 Firestore 데이터베이스 ID.
-   **`setup_venv.sh` 및 `run.sh` 활용**:
    -   기존 스크립트를 사용하여 환경 설정 및 앱 실행.

**2단계: 백엔드 개발 (`app_admin.py`를 Blueprint로)**

-   **초기 설정**:
    -   `Flask`의 `Blueprint`를 사용하여 `admin_bp` 생성.
    -   `.env`의 `GOOGLE_CLOUD_PROJECT_ID`와 `FIRESTORE_DATABASE_ID`를 사용하여 Firestore 클라이언트 초기화.
-   **라우트(API) 구현 (`/admin` 접두사 하위)**:
    -   **`GET /admin`**: 사용자 목록 조회.
    -   **`POST /admin/add_user`**: 사용자 추가 (생성일, 만료일 포함).
    -   **`POST /admin/delete_user`**: 사용자 삭제.
    -   **`POST /admin/update_password`**: 비밀번호 변경.
    -   **`POST /admin/update_expiry`**: 만료일 변경.
-   **메인 앱에 통합 (`app.py`)**:
    -   `app.py`에서 `admin_bp`를 import하고 `app.register_blueprint(admin_bp)`로 등록.

**3단계: 프론트엔드 개발 (`templates/admin.html`)**

-   **기능별 UI 구현**:
    -   **사용자 목록**: `<table>`을 사용하여 사용자 ID, 생성일, 만료일 및 관리 기능 표시.
    -   **폼(Form) 액션**: `url_for` 함수 사용 시 블루프린트 이름을 명시 (예: `url_for('admin.add_user')`).
    -   **기능**: 사용자 추가, 비밀번호 변경, 만료일 변경, 사용자 삭제를 위한 각 폼 구현.
