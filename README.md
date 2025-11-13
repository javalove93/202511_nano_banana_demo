# Nano Banana 이미지 편집기 🎨

Nano Banana는 Google Gemini 2.5 Flash Image API를 활용한 AI 기반 이미지 생성 및 편집 도구입니다. 간단한 스케치와 텍스트 프롬프트만으로 창의적인 이미지를 생성할 수 있습니다.

## 🌟 주요 기능

- **AI 이미지 생성**: Gemini 2.5 Flash Image API를 통한 고품질 이미지 생성
- **드로잉 캔버스**: 브러시, 지우개, 박스 도구를 이용한 스케치 작성
- **Coworking 모드**: 협업 모드로 여러 이미지를 참조하여 새로운 이미지 생성
- **이미지 편집**: Imagen 3.0을 활용한 인페인팅, 아웃페인팅, 배경 교체 등
- **데모 관리**: Firestore를 통한 작업 저장 및 불러오기
- **사용자 인증**: JWT 기반 안전한 사용자 인증 시스템

## 🛠 기술 스택

- **Backend**: Flask, Python 3.x
- **AI/ML**: Google Gemini 2.5 Flash Image, Imagen 3.0
- **Database**: Google Cloud Firestore
- **Storage**: Google Cloud Storage
- **Authentication**: JWT (PyJWT)
- **Image Processing**: Pillow (PIL)
- **Package Management**: uv

## 📋 사전 요구사항

1. **Python 3.8 이상**
2. **uv 설치** (Python 패키지 관리 도구)
   ```bash
   pip install uv
   ```
3. **Google Cloud 프로젝트**
   - Vertex AI API 활성화
   - Firestore Database 생성
   - Google Cloud Storage 버킷 생성
   - 서비스 계정 키 또는 Application Default Credentials 설정

4. **Google Cloud CLI 설치 및 인증**
   ```bash
   gcloud auth application-default login
   ```

## 🚀 설치 및 실행

### 1. 저장소 클론

```bash
git clone <repository-url>
cd 202511_nano_banana_demo
```

### 2. 가상환경 설정 및 패키지 설치

프로젝트에 포함된 `setup_venv.sh` 스크립트를 사용하여 자동으로 설정합니다:

```bash
bash setup_venv.sh
```

이 스크립트는 다음 작업을 수행합니다:
- `.venv` 디렉토리에 가상환경 생성 (없는 경우)
- 가상환경 활성화
- `requirements.txt`의 모든 패키지 설치

### 3. 환경 변수 설정

프로젝트 루트에 `.env` 파일을 생성하고 다음 환경 변수를 설정합니다:

```bash
# Google Cloud 설정
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_REGION=us-central1
LOCATION=global

# Firestore 설정
FIRESTORE_COLLECTION_ID=nanobanana
FIRESTORE_DATABASE_ID=(default)
ACCOUNTS_ID=user_accounts

# Google Cloud Storage 설정
SHOWCASE_GCS_PATH=gs://your-bucket-name/your-folder

# JWT 보안 설정
JWT_SECRET_KEY=your-super-secret-key-change-this

# 관리자 계정 설정
ADMIN_USERNAME=admin
```

**중요**: 
- `JWT_SECRET_KEY`는 반드시 안전한 랜덤 문자열로 변경하세요
- Google Cloud 인증 정보가 올바르게 설정되었는지 확인하세요

### 4. 애플리케이션 실행

가상환경을 활성화하고 애플리케이션을 실행합니다:

```bash
bash run.sh
```

또는 수동으로:

```bash
source .venv/bin/activate
python app.py
```

애플리케이션은 기본적으로 `http://localhost:5000`에서 실행됩니다.

## 📖 사용 방법

### 첫 번째 주요 기능: Coworking 모드를 활용한 AI 이미지 생성

#### 1️⃣ 새 캔버스 생성
- **New** 버튼을 클릭하여 새로운 이미지 캔버스를 생성합니다
- 캔버스 크기는 상단의 **Large** / **Medium** / **Small** 링크로 조정할 수 있습니다

#### 2️⃣ 스케치 그리기
- **Brush** 버튼을 클릭하여 브러시 모드를 활성화합니다
- 색상 선택기에서 원하는 색상을 선택합니다 (기본값: 빨간색)
- 두께 슬라이더로 선의 굵기를 조정합니다 (1-50px)
- 캔버스에 원하는 스케치를 그립니다

**드로잉 도구:**
- **Brush**: 자유롭게 선 그리기
- **Eraser**: 그린 선 지우기
- **Box**: 영역 박스 그리기
- **Clear Canvas**: 캔버스 전체 초기화

#### 3️⃣ Coworking 모드 활성화
- **Coworking** 체크박스를 체크합니다
- 이 모드는 여러 이미지를 참조하여 AI가 유사한 스타일의 이미지를 생성합니다

#### 4️⃣ 프롬프트 입력
- 상단 텍스트 입력란에 고정 프롬프트 헤더를 입력합니다 (기본: "Create an image that is, ")
- 하단 텍스트 영역에 생성하고 싶은 이미지에 대한 설명을 입력합니다
  - 예: "a beautiful red flower with five petals and green leaves"

#### 5️⃣ 이미지 생성
- **Generate** 버튼을 클릭합니다
- AI가 스케치와 프롬프트를 분석하여 유사한 스타일의 이미지를 생성합니다
- 생성된 이미지는 우측 **Images** 패널에 자동으로 추가됩니다

#### 6️⃣ 생성된 이미지 관리
우측 Images 패널에서:
- **Check All**: 모든 이미지 선택
- **Uncheck All**: 모든 선택 해제
- **Delete**: 선택한 이미지 삭제
- **Download**: 선택한 이미지 다운로드

각 이미지의 체크박스를 클릭하여 개별 선택도 가능합니다.

### 기타 유용한 기능

#### 이미지 업로드
- **Load Image** 버튼: 로컬 파일에서 이미지 업로드
- **From Clipboard** 버튼: 클립보드에서 이미지 붙여넣기

#### 캔버스 크기 조정
- **Width**: 캔버스 너비 설정 (픽셀)
- **Height**: 캔버스 높이 설정 (픽셀)
- 사이즈 프리셋: Large / Medium / Small

#### 스케치 모드
- **Sketch** 체크박스: 스케치 전용 모드 활성화

#### 작업 저장 및 불러오기
- **Save Demo**: 현재 작업(이미지 + 프롬프트)을 Firestore에 저장
- **Load Demo**: 저장된 작업 목록에서 불러오기

#### 이미지 저장
- **Save** 버튼: 현재 캔버스를 로컬에 저장

## 🔐 사용자 인증

### 로그인
1. 보호된 기능(Generate, Save Demo 등)에 접근하면 로그인 모달이 표시됩니다
2. 사용자 ID와 비밀번호를 입력합니다
3. 로그인 성공 시 JWT 토큰이 브라우저에 저장됩니다

### 로그인 정보 초기화
- 화면 좌측 상단의 **RESET** 버튼을 클릭하여 로그인 정보를 초기화할 수 있습니다

### 계정 생성 (관리자)
관리자는 `/admin` 페이지에서 새 사용자 계정을 생성할 수 있습니다:
```
http://localhost:5000/admin
```

## 📁 프로젝트 구조

```
202511_nano_banana_demo/
├── app.py                      # 메인 Flask 애플리케이션
├── app_nano_banana.py          # Nano Banana 기능 블루프린트
├── app_admin.py                # 관리자 기능 블루프린트
├── requirements.txt            # Python 패키지 의존성
├── setup_venv.sh               # 가상환경 설정 스크립트
├── run.sh                      # 애플리케이션 실행 스크립트
├── templates/                  # HTML 템플릿
│   ├── nano_banana.html       # Nano Banana 메인 페이지
│   ├── admin.html             # 관리자 페이지
│   └── index.html             # 홈 페이지
├── static/                     # 정적 파일
│   └── js/
│       └── nano_banana.js     # Nano Banana JavaScript
└── uploads/                    # 업로드 파일 임시 저장소
```

## 🔧 문제 해결

### 1. "GOOGLE_CLOUD_PROJECT_ID 환경 변수가 설정되지 않았습니다" 오류
- `.env` 파일에 `GOOGLE_CLOUD_PROJECT_ID`가 올바르게 설정되었는지 확인하세요
- 환경 변수가 로드되었는지 확인: `python -c "from dotenv import load_dotenv; import os; load_dotenv(); print(os.getenv('GOOGLE_CLOUD_PROJECT_ID'))"`

### 2. Google Cloud 인증 오류
```bash
# Application Default Credentials 재설정
gcloud auth application-default login

# 서비스 계정 키를 사용하는 경우
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

### 3. Firestore 연결 오류
- Firestore Database가 생성되었는지 확인하세요
- Firestore API가 활성화되었는지 확인하세요
- 올바른 데이터베이스 ID를 사용하고 있는지 확인하세요

### 4. GCS 버킷 접근 오류
- 버킷 이름이 올바른지 확인하세요
- 서비스 계정에 버킷 접근 권한이 있는지 확인하세요
- `SHOWCASE_GCS_PATH` 형식이 `gs://bucket-name/folder`인지 확인하세요

### 5. 이미지 생성 실패
- Vertex AI API가 활성화되었는지 확인하세요
- 프로젝트에 충분한 할당량이 있는지 확인하세요
- `LOCATION` 환경 변수가 올바른지 확인하세요 (기본: `global`)

### 6. uv 관련 오류
```bash
# uv 재설치
pip install --upgrade uv

# 가상환경 재생성
rm -rf .venv
bash setup_venv.sh
```

## 🎯 API 엔드포인트

| 엔드포인트 | 메서드 | 설명 | 인증 필요 |
|-----------|--------|------|----------|
| `/nano_banana` | GET | 메인 페이지 | ❌ |
| `/nano_banana/login` | POST | 사용자 로그인 | ❌ |
| `/generate_nano_banana` | POST | AI 이미지 생성 (스트리밍) | ✅ |
| `/save_nano_banana_demo` | POST | 작업 저장 | ✅ |
| `/list_nano_banana_demos` | GET | 저장된 작업 목록 조회 | ❌ |
| `/get_gcs_image` | GET | GCS 이미지 조회 | ❌ |
| `/get_generated_image/<filename>` | GET | 생성된 이미지 조회 (임시) | ❌ |
| `/admin` | GET | 관리자 페이지 | ✅ (관리자) |

