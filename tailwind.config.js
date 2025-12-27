/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    screens: {
      'xs': '320px',    // 아주 작은 화면 (아이폰 SE 등)
      'sm': '375px',    // 작은 모바일
      'md': '768px',    // 태블릿
      'lg': '1024px',   // 작은 데스크탑
      'xl': '1280px',   // 데스크탑
      '2xl': '1536px',  // 큰 데스크탑
    },
    extend: {
      colors: {
        // 메인 브랜드 컬러 - 웨딩 테마에 맞는 로즈 골드 계열
        rose: {
          50: '#fdf2f4',
          100: '#fce7eb',
          200: '#fbd0da',
          300: '#f8a9bc',
          400: '#f27a98',
          500: '#e84c72',  // 메인 컬러 - 더 세련된 로즈
          600: '#d42a5a',
          700: '#b21e4a',
          800: '#951c42',
          900: '#7d1b3c',
        },
        // 보조 컬러 - 골드 계열 추가
        gold: {
          50: '#fdfaf3',
          100: '#faf3e0',
          200: '#f5e6c0',
          300: '#edd49a',
          400: '#e4bc6a',
          500: '#d4a44a',  // 골드 포인트
          600: '#c08a30',
          700: '#9f6d28',
          800: '#825728',
          900: '#6b4824',
        },
        stone: {
          850: '#1c1917',
        }
      },
      fontFamily: {
        sans: ['Pretendard', 'Noto Sans KR', 'sans-serif'],
        display: ['Pretendard', 'sans-serif'],  // 제목용
      },
      // 더 세련된 border-radius
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      // 부드러운 트랜지션 기본값
      transitionDuration: {
        DEFAULT: '200ms',
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'smooth': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-down': 'slideDown 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'slide-in-right': 'slideInRight 0.3s ease-out',
        'slide-in-bottom': 'slideInBottom 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
        'bounce-in': 'bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s infinite',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'spin-slow': 'spin 2s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideInBottom: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '200% 0' },
          '100%': { backgroundPosition: '-200% 0' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '50%': { transform: 'scale(1.02)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      // 그림자 개선 - 더 부드럽고 세련된 그림자
      boxShadow: {
        'soft': '0 2px 8px -2px rgba(0, 0, 0, 0.06)',
        'soft-md': '0 4px 12px -4px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 8px 24px -8px rgba(0, 0, 0, 0.1)',
        'soft-xl': '0 16px 40px -12px rgba(0, 0, 0, 0.12)',
        'inner-soft': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.03)',
        'glow': '0 0 20px rgba(232, 76, 114, 0.15)',
        'glow-gold': '0 0 20px rgba(212, 164, 74, 0.2)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.04), 0 4px 12px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 16px rgba(0, 0, 0, 0.08), 0 8px 24px rgba(0, 0, 0, 0.06)',
        'button': '0 2px 4px rgba(232, 76, 114, 0.2)',
        'button-hover': '0 4px 12px rgba(232, 76, 114, 0.3)',
      },
      // 배경 그라데이션
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-rose': 'linear-gradient(135deg, #fdf2f4 0%, #fce7eb 100%)',
        'gradient-gold': 'linear-gradient(135deg, #fdfaf3 0%, #f5e6c0 100%)',
        'gradient-card': 'linear-gradient(180deg, #ffffff 0%, #fafaf9 100%)',
        'shimmer': 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.4) 50%, transparent 100%)',
      },
    }
  },
  plugins: [],
}
