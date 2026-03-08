/**
 * 예산 미설정 안내 배너 표시 여부를 결정하는 순수 함수
 * totalBudget이 0이면 배너를 표시하고, 0보다 크면 표시하지 않는다.
 */
export function shouldShowBudgetBanner(totalBudget: number): boolean {
  return totalBudget === 0;
}
