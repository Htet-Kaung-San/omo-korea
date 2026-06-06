# HeyPNU
## 부산대학교 외국인 유학생 통합 지원 서비스
 
---
 
### 1. 프로젝트 소개
 
#### 1.1. 개발배경 및 필요성
 
대한민국은 'Study Korea 300K Project'를 통해 2027년까지 외국인 유학생 30만 명 유치를 목표로 하고 있으며, 부산대학교 역시 매년 증가하는 외국인 유학생을 맞이하고 있습니다. 그러나 실제 유학생들은 입학 준비 단계부터 재학 중 생활 전반에 걸쳐 파편화된 정보 환경 속에서 많은 어려움을 겪고 있습니다.
 
외국인 유학생 대상 설문조사에 따르면, 대학 지원 과정에서 정보 탐색의 어려움을 호소하는 비율이 높으며, 입국 이후에도 행정 절차, 언어 장벽, 생활 정보 부족으로 인한 정착 어려움이 지속되는 것으로 나타났습니다. 특히 필요한 정보를 여러 플랫폼에서 개별적으로 찾아야 하는 비효율적인 구조와, 부산대학교에 특화된 정보(학과 안내, 캠퍼스 시설, 행정 절차 등)를 외국어로 제공하는 통합 서비스가 존재하지 않는다는 점이 핵심 문제입니다.
 
**HeyPNU**는 이러한 문제를 해결하기 위해, 유학 준비생부터 재학생까지 부산대학교 유학의 전 과정을 하나의 플랫폼에서 지원하는 AI 기반 통합 서비스입니다.
 
#### 1.2. 개발 목표 및 주요 내용
 
본 프로젝트의 목표는 외국인 유학생이 부산대학교 유학 준비부터 졸업 이후 진로까지, 필요한 모든 정보와 기능을 한 곳에서 이용할 수 있는 통합 플랫폼을 구축하는 것입니다.
 
- **유학 준비생**: MBTI·관심 분야·언어 실력 기반 학과 추천 AI, 나라별 서류 체크리스트, 장학 정보
- **재학생**: 수강 과목 추천 AI, 졸업요건 체크리스트, 캠퍼스 맵, 학교 시설 가이드, 커뮤니티 게시판, 취업 정보
- **공통**: 다국어 지원(6개 언어+), 비자연장 알림, Emergency 긴급 기능, 주변 생활 편의 정보
#### 1.3. 세부내용
 
**① 유학 준비생 기능**
- MBTI 유형, 장점, 관심 분야, 언어 실력을 입력하면 AI가 적합한 학과·전공을 추천하고 목표 기반 격차 분석(Goal-Oriented Gap Analysis) 리포트를 제공
- 국가별 비자 신청 서류 체크리스트 자동 생성, 마감일 임박 알림
- GKS(정부초청장학금)·대학 자체 장학금 등 사용자 조건 맞춤형 장학 정보 통합 제공
**② 재학생 기능**
- 전공·이수 학점 분석 기반 다음 학기 수강 과목 추천 AI
- 졸업요건 체크리스트 (전공·교양·어학 이수 현황 자동 계산, 미충족 요건 표시)
- 비교과 프로그램 추천 AI (동아리, 공모전, 봉사활동, 인턴십 등)
- 학교 시설 사용 가이드 (학식 메뉴, 헬스장, 도서관 등 LINE 알림 연동)
- 다국어 캠퍼스 맵 (GPS 기반 건물·시설 위치 안내)
- 인턴십 매칭, 수강 변경 알림, 기숙사·국제처 공지사항 통합 제공
**③ 공통 기능**
- 한국어·영어·중국어·일본어·베트남어 등 다국어 UI (문화적 맥락 반영 현지화)
- 비자 만료일 기반 단계별 연장 알림 (D-90 / D-60 / D-30 / D-7)
- Emergency 긴급 기능 (119·112 원터치 연결, 국가별 대사관 연락처 자동 제공)
- 주변 상점·병원·마트·약국 위치 및 외국인 친화 업소 정보
- 집·부동산 주의 동향 및 전세 사기 예방 가이드
#### 1.4. 기존 서비스 대비 차별성
 
| 구분 | Study in Korea | Hi Korea | Go! Go! Hanguk | **HeyPNU** |
|---|---|---|---|---|
| AI 학과 추천 | ❌ | ❌ | ❌ | ✅ MBTI·관심 분야 기반 |
| 부산대 특화 정보 | ❌ | ❌ | ❌ | ✅ PNU 전용 커스터마이징 |
| 졸업요건 관리 | ❌ | ❌ | ❌ | ✅ 자동 체크리스트 |
| 다국어 UI | 한/영 일부 | 한국어 중심 | 제한적 | ✅ 6개 언어+ 현지화 |
| 커뮤니티/멘토링 | ❌ | ❌ | ❌ | ✅ 학적 인증 기반 멘토 매칭 |
| 비자연장 알림 | ❌ | 일부 | D-4만 | ✅ 전 비자 종류 단계별 알림 |
| Emergency 기능 | ❌ | ❌ | ❌ | ✅ 긴급 원터치 연결 |
| 생활 편의 정보 | ❌ | ❌ | ❌ | ✅ 상점·병원·부동산 통합 |
 
#### 1.5. 사회적가치 도입 계획
 
**(1) 유학생 정착 지원을 통한 대학 행정 효율 강화**
AI 기반 컨시어지 서비스와 맞춤형 체크리스트로 언어 장벽과 행정 절차의 복잡함을 해소하여, 국제처 담당 인력의 업무 부담을 줄이고 부산대학교의 국제화 역량을 강화합니다.
 
**(2) 지역 산업 맞춤형 인재 양성 및 지역 소멸 문제 해소**
AI 학과 추천과 Goal-Oriented Gap Analysis를 통해 유학생의 역량을 지역 산업 수요와 연결하여, 졸업 후 지역 기업 취업 및 정주로 이어지는 선순환 구조를 형성합니다. 이는 학령인구 감소로 인한 지역 소멸 문제를 해결하는 실질적 도구로 활용될 수 있습니다.
 
**(3) 글로벌 커뮤니티 형성 및 사회 통합 촉진**
멘토링 매칭·스터디 그룹 기능으로 유학생 간 유대감을 강화하고 내국인 학생 및 지역 주민과의 교류 기회를 확대하여, 다문화 수용성을 높이고 지역 사회 내 공동체 의식을 함양합니다.
 
**(4) 비자 준수 및 법적 안정성 확보**
비자 종류별(D-2, D-4, D-10, E-7 등) 갱신 안내와 합법적 아르바이트 정보 제공으로 불법 체류 등 사회적 부작용을 예방하고, 유학생이 법적 권리를 보호받으며 안전하게 정착할 수 있도록 돕습니다.
 
---
 
### 2. 상세설계
 
#### 2.1. 시스템 구성도
 
> 시스템 구성도(infra, front, back 등의 node 간의 관계) 사진을 삽입하세요.
 
#### 2.2. 사용 기술
 
| 분야 | 기술 스택 | 버전 | 활용 목적 |
|---|---|---|---|
| **Frontend** | ![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/TailwindCSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white) | React v18 / TS v5 / Tailwind v3 | 다국어 반응형 웹 UI, 대시보드 컴포넌트 개발 |
| **Backend** | ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white) ![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white) | Node.js v20 / Express v4 | REST API 서버, 비즈니스 로직 및 AI API 연동 처리 |
| **Database** | ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white) | v16 | 유학생 정보, 체크리스트, 커뮤니티 데이터 관리 |
| **AI** | ![Claude](https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white) ![Gemini](https://img.shields.io/badge/Gemini-8E75B2?style=for-the-badge&logo=googlegemini&logoColor=white) | - | 학과·과목 추천, 공지사항 다국어 요약 |
| **Infra** | ![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white) ![AWS](https://img.shields.io/badge/AWS_EC2-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white) | - | 프론트엔드 배포 / 백엔드 서버 운영 |
| **생성형 AI · AI 코딩 도구** | ![GitHub Copilot](https://img.shields.io/badge/GitHub_Copilot-181717?style=for-the-badge&logo=github&logoColor=white) ![Claude](https://img.shields.io/badge/Claude-D97757?style=for-the-badge&logo=anthropic&logoColor=white) ![Cursor](https://img.shields.io/badge/Cursor-000000?style=for-the-badge&logoColor=white) | - | 코드 자동완성·리팩토링·디버깅, 기획 및 문서 작성 보조 |
| **협업** | ![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white) ![Notion](https://img.shields.io/badge/Notion-000000?style=for-the-badge&logo=notion&logoColor=white) | - | 버전 관리, 문서화 및 일정 관리 |
 
---
 
### 3. 개발결과
 
#### 3.1. 전체시스템 흐름도
 
```
[준비생 사용자]                      [재학생 사용자]
       │                                    │
       ▼                                    ▼
 MBTI·관심분야·언어 입력           학점·수강이력 입력
       │                                    │
       ▼                                    ▼
 AI 학과 추천 엔진                  AI 과목 추천 엔진
 (Claude API)                       (Claude API)
       │                                    │
       ▼                                    ▼
 나라별 서류 체크리스트              졸업요건 체크리스트
 장학 정보 매칭                      비교과 프로그램 추천
 Agency 정보 제공                    캠퍼스 맵 · 시설 가이드
       │                                    │
       └──────────────┬─────────────────────┘
                      ▼
           [공통 기능 레이어]
      ┌──────────────────────────────┐
      │  다국어 UI (6개 언어+)        │
      │  비자연장 알림 (D-90~D-7)     │
      │  Emergency 긴급 기능          │
      │  커뮤니티 · 멘토링 게시판     │
      │  생활 편의 정보               │
      └──────────────────────────────┘
                      │
                      ▼
          [Backend: Node.js + Express]
          [Database: PostgreSQL]
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
      Claude API           Gemini API
   (학과·과목 추천)       (공지 다국어 요약)
                      │
                      ▼
          [배포: Vercel(FE) + AWS EC2(BE)]
```
 
#### 3.2. 기능설명
 
> 각 페이지마다 사용자의 입력 종류와 입력에 따른 결과를 설명하고 시연 영상을 첨부하세요.
>
> ex. 학과 추천 페이지:
>
> - MBTI 유형, 관심 분야, 언어 실력을 선택·입력하면 AI 분석이 시작됩니다.
>
> - 분석 완료 시 적합도 순으로 정렬된 학과 추천 목록과 Goal-Oriented Gap Analysis 리포트가 표시됩니다.
>
> - 각 학과 카드를 클릭하면 입학 요건, 장학금, 졸업 후 진로 정보로 이동합니다.
>
> (시연 영상 첨부)
 
#### 3.3. 기능명세서
 
> 개발한 제품에 대한 기능명세서를 작성해 제출하세요.
>
> 노션 링크, 한글 문서, PDF 파일, 구글 스프레드시트 등...
 
#### 3.4. 디렉토리 구조
 
```
HeyPNU/
├── client/                        # React 프론트엔드
│   ├── public/                    # 정적 파일 (로고, 아이콘 등)
│   └── src/
│       ├── components/            # 공통 UI 컴포넌트
│       ├── pages/
│       │   ├── PrepStudent/       # 준비생 기능 (학과추천, 서류체크리스트 등)
│       │   ├── CurrentStudent/    # 재학생 기능 (과목추천, 졸업요건 등)
│       │   └── Common/            # 공통 기능 (비자알림, 긴급, 커뮤니티 등)
│       ├── hooks/                 # 커스텀 훅
│       ├── utils/                 # 다국어 처리 등 유틸리티 함수
│       └── types/                 # TypeScript 타입 정의
├── server/                        # Node.js 백엔드
│   ├── routes/                    # API 라우터
│   ├── controllers/               # 비즈니스 로직
│   ├── models/                    # DB 모델 (PostgreSQL)
│   ├── services/                  # AI API 연동 (Claude, Gemini)
│   └── middleware/                # 인증, 다국어 미들웨어
├── docs/                          # 시스템 구성도, 기능명세서 등
├── .env.example
├── .gitignore
└── README.md
```
 
> 실제 API 키가 포함된 `.env.local`은 GitHub에 업로드하지 않으며, `.env.example`만 포함합니다.
 
#### 3.5. AI 도구 활용
 
> AI 도구를 어떤 단계에서 어떻게 활용했는지, 어떤 성과가 도출되었는지 기술해주세요.
>
> ex.
> - **Claude**: 학과 추천 알고리즘 설계 보조, 기능명세서 초안 작성, 코드 리뷰 및 디버깅
> - **Gemini API**: 캠퍼스 공지사항 다국어 요약 기능 구현에 활용
> - **GitHub Copilot**: 반복적인 CRUD 코드 자동 완성, 테스트 코드 생성
> - **Cursor**: 복잡한 DB 쿼리 설계 및 API 연동 로직 작성 가속화
 
---
 
### 4. 설치 및 사용 방법
 
```bash
# 레포지토리 클론
git clone https://github.com/PNU-2026-AI-Hackathon/[팀_레포명].git
cd HeyPNU
 
# 환경변수 설정
cp .env.example .env.local
# .env.local 에 Claude API Key, Gemini API Key 등 입력
 
# 프론트엔드 실행
cd client
npm install
npm start
 
# 백엔드 실행
cd server
npm install
npm run dev
```
 
> 필요한 환경변수 목록은 `.env.example` 파일을 참고하세요.
 
---
 
### 5. 소개 및 시연 영상
 
> 프로젝트에 대한 소개와 시연 영상을 넣으세요.
> 프로젝트 소개 동영상을 교육원 메일(swedu@pusan.ac.kr)로 제출 이후 센터에서 부여받은 YouTube URL 주소를 넣으세요.
 
---
 
### 6. 팀 소개
 
| 이름 (팀장) | 이름 | 이름 | 이름 | 이름 |
|---|---|---|---|---|
| GitHub 프로필 이미지 | GitHub 프로필 이미지 | GitHub 프로필 이미지 | GitHub 프로필 이미지 | GitHub 프로필 이미지 |
| 역할 (ex. 풀스택) | 역할 (ex. 백엔드) | 역할 (ex. 프론트엔드) | 역할 (ex. AI/기획) | 역할 (ex. 디자인) |
| 학과 | 학과 | 학과 | 학과 | 학과 |
| 이메일 | 이메일 | 이메일 | 이메일 | 이메일 |
 
---
 
### 7. 해커톤 참여 후기
 
- **[팀원 이름]**
  - 내용 작성
- **[팀원 이름]**
  - 내용 작성
- **[팀원 이름]**
  - 내용 작성
- **[팀원 이름]**
  - 내용 작성
- **[팀원 이름]**
  - 내용 작성
 
