import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        // 번들 분석 플러그인 (npm run build 후 stats.html 생성)
        visualizer({
          filename: 'stats.html',
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['favicon.ico', 'icons/*.png', 'splash/*.png', 'custom-sw.js'],
          injectRegister: 'auto',
          manifest: {
            name: '우리의 결혼 준비',
            short_name: '웨딩플래너',
            description: '커플이 함께 사용하는 결혼 예산 관리 앱',
            theme_color: '#8B7355',
            background_color: '#FAF7F2',
            display: 'standalone',
            orientation: 'portrait-primary',
            scope: '/',
            start_url: '/',
            lang: 'ko',
            categories: ['lifestyle', 'finance'],
            icons: [
              {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: '지출 추가',
                short_name: '지출추가',
                description: '새 지출 기록하기',
                url: '/#/expenses',
                icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
              },
              {
                name: '예산 확인',
                short_name: '예산',
                description: '예산 현황 보기',
                url: '/#/budget',
                icons: [{ src: '/icons/icon-96x96.png', sizes: '96x96' }]
              }
            ]
          },
          workbox: {
            // 정적 자산 캐싱 패턴 (Requirements: 2.1)
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,ttf,eot}'],
            maximumFileSizeToCacheInBytes: 3 * 1024 * 1024, // 3MB로 증가
            importScripts: ['custom-sw.js'],
            
            // 런타임 캐싱 전략 (Requirements: 2.1, 2.6)
            runtimeCaching: [
              // API 응답 캐싱 - NetworkFirst 전략
              // 네트워크 우선, 실패 시 캐시 사용
              {
                urlPattern: /^https:\/\/wedding-budget-app-2\.onrender\.com\/api\/(stats|budget|venues|expenses|events|checklist)/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-data-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24, // 24시간
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                  networkTimeoutSeconds: 10, // 10초 타임아웃 후 캐시 사용
                },
              },
              // 인증 관련 API - NetworkOnly 전략
              // 항상 네트워크 사용 (보안상 캐시하지 않음)
              {
                urlPattern: /^https:\/\/wedding-budget-app-2\.onrender\.com\/api\/auth/i,
                handler: 'NetworkOnly',
              },
              // 알림 API - NetworkFirst 전략 (짧은 캐시)
              {
                urlPattern: /^https:\/\/wedding-budget-app-2\.onrender\.com\/api\/notifications/i,
                handler: 'NetworkFirst',
                options: {
                  cacheName: 'api-notifications-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 5, // 5분
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                  networkTimeoutSeconds: 5,
                },
              },
              // 기타 API - StaleWhileRevalidate 전략
              // 캐시 먼저 반환하고 백그라운드에서 업데이트
              {
                urlPattern: /^https:\/\/wedding-budget-app-2\.onrender\.com\/api\/.*/i,
                handler: 'StaleWhileRevalidate',
                options: {
                  cacheName: 'api-general-cache',
                  expiration: {
                    maxEntries: 50,
                    maxAgeSeconds: 60 * 60, // 1시간
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              // Cloudinary 이미지 - CacheFirst 전략
              // 캐시 우선, 없으면 네트워크
              {
                urlPattern: /^https:\/\/res\.cloudinary\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'cloudinary-image-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              // 외부 폰트 - CacheFirst 전략
              {
                urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'google-fonts-cache',
                  expiration: {
                    maxEntries: 30,
                    maxAgeSeconds: 60 * 60 * 24 * 365, // 1년
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              // 기타 이미지 - CacheFirst 전략
              {
                urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'image-cache',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30일
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
            
            // 네비게이션 프리로드 활성화
            navigationPreload: true,
            
            // 오프라인 폴백 페이지
            navigateFallback: '/index.html',
            navigateFallbackDenylist: [/^\/api\//],
          },
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, 'src'),
        }
      },
      build: {
        // 청크 분할 설정
        rollupOptions: {
          output: {
            manualChunks: {
              // React 관련
              'vendor-react': ['react', 'react-dom', 'react-router-dom'],
              
              // UI 라이브러리
              'vendor-ui': ['lucide-react'],
              
              // 차트 라이브러리 (무거움)
              'vendor-charts': ['recharts'],
              
              // 날짜 라이브러리
              'vendor-date': ['date-fns'],
              
              // HTTP 클라이언트
              'vendor-http': ['axios'],
              
              // 애니메이션 라이브러리
              'vendor-animation': ['framer-motion'],
              
              // 에러 트래킹
              'vendor-sentry': ['@sentry/react'],
            },
          },
        },
        // 청크 크기 경고 한도
        chunkSizeWarningLimit: 500,
        
        // 소스맵 (프로덕션에서는 끄기)
        sourcemap: false,
        
        // 압축
        minify: 'esbuild',
      },
      // 의존성 최적화
      optimizeDeps: {
        include: ['react', 'react-dom', 'react-router-dom', 'axios'],
      },
    };
});
