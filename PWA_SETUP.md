# PWA 설정 가이드

## ✅ 완료된 작업

### 1. 기본 설정
- ✅ vite-plugin-pwa 설치
- ✅ vite.config.ts PWA 설정 추가
- ✅ index.html 메타 태그 추가
- ✅ Service Worker 자동 생성 설정

### 2. 컴포넌트
- ✅ InstallPrompt 컴포넌트 (앱 설치 안내)
- ✅ OfflinePage 컴포넌트 (오프라인 상태)
- ✅ useOnlineStatus 훅 (온라인/오프라인 감지)

### 3. 기능
- ✅ 자동 업데이트
- ✅ 오프라인 지원
- ✅ API 캐싱 (NetworkFirst)
- ✅ 이미지 캐싱 (CacheFirst)
- ✅ iOS 지원
- ✅ 앱 설치 프롬프트

---

## 📱 아이콘 생성 방법

### 옵션 1: 온라인 도구 사용 (추천)

1. **https://realfavicongenerator.net/** 방문
2. 512x512 PNG 이미지 업로드
3. 설정:
   - iOS: 배경색 #FAF7F2, 여백 10%
   - Android: 배경색 #8B7355
   - Windows: 배경색 #FAF7F2
4. 생성된 아이콘들을 `public/icons/` 폴더에 복사

### 옵션 2: Figma/Photoshop

**디자인 가이드**:
- 크기: 512x512px
- 배경: 로즈골드 그라데이션 (#E8B4B8 → #D4A574)
- 아이콘: 웨딩 링 + 하트 또는 달력
- 스타일: 플랫 디자인, 심플

**필요한 크기**:
```
icon-16x16.png
icon-32x32.png
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png
icon-384x384.png
icon-512x512.png
favicon-16x16.png
favicon-32x32.png
```

---

## 🧪 테스트 방법

### 1. 로컬 빌드 테스트

```bash
npm run build
npm run preview
```

### 2. Chrome DevTools 확인

1. F12 → Application 탭
2. Manifest 섹션 확인
3. Service Workers 섹션 확인

### 3. Lighthouse PWA 점수

1. F12 → Lighthouse 탭
2. "Progressive Web App" 체크
3. "Analyze page load" 클릭
4. 목표: 90점 이상

### 4. 모바일 테스트

**Android**:
1. Chrome에서 사이트 접속
2. 주소창 오른쪽 "설치" 버튼 확인
3. 설치 후 홈 화면에서 실행

**iOS**:
1. Safari에서 사이트 접속
2. 공유 버튼 → "홈 화면에 추가"
3. 홈 화면에서 실행

### 5. 오프라인 테스트

1. 앱 실행
2. DevTools → Network → Offline 체크
3. 페이지 새로고침
4. 오프라인 페이지 표시 확인

---

## 🚀 배포 시 확인사항

### Vercel 설정

`vercel.json`에 다음 헤더 추가:

```json
{
  "headers": [
    {
      "source": "/sw.js",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=0, must-revalidate"
        },
        {
          "key": "Service-Worker-Allowed",
          "value": "/"
        }
      ]
    },
    {
      "source": "/manifest.webmanifest",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/manifest+json"
        }
      ]
    }
  ]
}
```

### 환경 변수

Vercel에서 다음 환경 변수 확인:
- `VITE_API_URL`: 백엔드 API URL

---

## 📊 PWA 체크리스트

### 필수 요구사항
- ✅ HTTPS 사용 (Vercel 자동 제공)
- ✅ Service Worker 등록
- ✅ Web App Manifest
- ✅ 아이콘 (192x192, 512x512)
- ✅ 반응형 디자인
- ✅ 오프라인 지원

### 권장 사항
- ✅ 설치 프롬프트
- ✅ 스플래시 스크린 (iOS)
- ✅ 테마 색상
- ✅ 앱 단축키
- ⏳ 푸시 알림 (향후 추가)
- ⏳ 백그라운드 동기화 (향후 추가)

---

## 🎨 브랜딩

### 색상
- **Primary**: #8B7355 (베이지 브라운)
- **Background**: #FAF7F2 (아이보리)
- **Accent**: #F43F5E (로즈)

### 폰트
- Noto Sans KR

### 아이콘 스타일
- 심플하고 모던한 플랫 디자인
- 웨딩 테마 (링, 하트, 달력)

---

## 🔧 문제 해결

### Service Worker가 업데이트되지 않음
```bash
# 캐시 삭제
rm -rf dist
npm run build
```

### iOS에서 아이콘이 안 보임
- `apple-touch-icon` 크기 확인 (최소 180x180)
- PNG 형식 확인
- 투명 배경 제거

### 오프라인에서 API 요청 실패
- `workbox.runtimeCaching` 설정 확인
- Network 탭에서 캐시 확인

---

## 📚 참고 자료

- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Web.dev PWA](https://web.dev/progressive-web-apps/)
- [MDN PWA Guide](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [PWA Builder](https://www.pwabuilder.com/)
