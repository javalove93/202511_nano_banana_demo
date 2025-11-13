# 20251113 1800 README.md 작성 계획

## 목표
사용자가 Nano Banana 이미지 편집기를 쉽게 사용할 수 있도록 한국어로 된 README.md 파일 생성

## 현재 상태 분석
- Flask 기반 웹 애플리케이션
- Gemini 2.5 Flash Image API를 사용한 이미지 생성 기능
- 드로잉 캔버스를 통한 스케치 입력
- Coworking 모드 지원
- Firestore를 통한 데모 저장/불러오기 기능
- JWT 기반 사용자 인증 시스템

## README.md 구성 내용

### 1. 프로젝트 소개
- Nano Banana 이미지 편집기 개요
- 주요 기능 설명
- 기술 스택

### 2. 설치 및 실행 방법
- 사전 요구사항 (Python, uv, Google Cloud 설정)
- 환경 변수 설정
- 가상환경 생성 및 패키지 설치
- 애플리케이션 실행

### 3. 주요 기능 사용법
#### 첫 번째 기능: Coworking 모드
- **New 버튼**: 새로운 이미지 캔버스 생성
- **드로잉 도구**: 
  - Brush: 선 그리기
  - Eraser: 지우개
  - Box: 영역 선택
  - Clear Canvas: 캔버스 초기화
- **Coworking 체크박스**: 협업 모드 활성화
- **프롬프트 입력**: 생성하고 싶은 이미지 설명 입력
- **Generate 버튼**: 입력한 스케치와 프롬프트를 기반으로 AI가 유사한 이미지 생성

#### 기타 기능
- 이미지 업로드 (Load Image)
- 클립보드에서 붙여넣기 (From Clipboard)
- 캔버스 크기 조정 (Large/Medium/Small)
- 브러시 색상 및 두께 조정
- 생성된 이미지 저장 및 다운로드
- 데모 저장/불러오기

### 4. 환경 변수 설정
- GOOGLE_CLOUD_PROJECT_ID
- LOCATION
- SHOWCASE_GCS_PATH
- FIRESTORE_COLLECTION_ID
- FIRESTORE_DATABASE_ID
- JWT_SECRET_KEY
- 기타 필수 환경 변수

### 5. 사용자 인증
- 로그인 방법
- 토큰 관리

### 6. 문제 해결
- 자주 발생하는 문제 및 해결 방법

## 구현 단계
1. README.md 파일 생성
2. 한국어로 내용 작성
3. 사용자 확인 및 피드백 반영

## 비고
- 한국어로 작성
- 이미지 예시가 있으면 더 좋겠지만 현재는 텍스트로만 작성
- 실제 사용 흐름에 맞춰 단계별로 설명

