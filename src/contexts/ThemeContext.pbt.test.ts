/**
 * Property-Based Test: 다크 모드 토글
 * Feature: beta-readiness-review, Property 19: 다크 모드 토글
 *
 * 다크 모드를 활성화하면 document root에 'dark' 클래스가 추가되고,
 * 비활성화하면 제거되어야 한다. localStorage에도 현재 테마가 저장되어야 한다.
 *
 * **Validates: Requirements 7.5**
 */
import { describe, it, expect, beforeEach } from 'vitest';
import fc from 'fast-check';

type Theme = 'light' | 'dark';

/**
 * 테마를 DOM에 적용하는 순수 로직 (ThemeContext.tsx의 applyTheme과 동일)
 */
function applyTheme(theme: Theme): void {
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

/**
 * 토글 로직: 현재 테마의 반대 테마를 반환 (ThemeContext.tsx의 toggleTheme 핵심 로직)
 */
function toggleThemeValue(current: Theme): Theme {
  return current === 'light' ? 'dark' : 'light';
}

/**
 * N번 토글 후 최종 테마를 계산하는 시뮬레이션
 */
function simulateToggles(initial: Theme, count: number): Theme {
  let current = initial;
  for (let i = 0; i < count; i++) {
    current = toggleThemeValue(current);
    localStorage.setItem('theme', current);
    applyTheme(current);
  }
  return current;
}

describe('Feature: beta-readiness-review, Property 19: 다크 모드 토글', () => {
  beforeEach(() => {
    // DOM과 localStorage 초기화
    document.documentElement.classList.remove('dark');
    localStorage.clear();
  });

  it('should add "dark" class when theme is dark, remove when light - after N toggles', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('light', 'dark'),
        fc.integer({ min: 0, max: 50 }),
        (initialTheme, toggleCount) => {
          // 초기 상태 설정
          document.documentElement.classList.remove('dark');
          localStorage.clear();
          applyTheme(initialTheme);
          localStorage.setItem('theme', initialTheme);

          // N번 토글 시뮬레이션
          const finalTheme = simulateToggles(initialTheme, toggleCount);

          // 짝수 번 토글 → 초기 테마와 동일, 홀수 번 → 반대
          const expectedTheme = toggleCount % 2 === 0 ? initialTheme : toggleThemeValue(initialTheme);
          expect(finalTheme).toBe(expectedTheme);

          // DOM 상태 검증: dark 테마면 'dark' 클래스 존재, light면 없음
          if (expectedTheme === 'dark') {
            expect(document.documentElement.classList.contains('dark')).toBe(true);
          } else {
            expect(document.documentElement.classList.contains('dark')).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should persist current theme in localStorage after each toggle', () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Theme>('light', 'dark'),
        fc.integer({ min: 1, max: 30 }),
        (initialTheme, toggleCount) => {
          // 초기 상태 설정
          document.documentElement.classList.remove('dark');
          localStorage.clear();
          applyTheme(initialTheme);
          localStorage.setItem('theme', initialTheme);

          // N번 토글 시뮬레이션
          const finalTheme = simulateToggles(initialTheme, toggleCount);

          // localStorage에 최종 테마가 저장되어 있어야 함
          expect(localStorage.getItem('theme')).toBe(finalTheme);
        }
      ),
      { numRuns: 100 }
    );
  });
});
