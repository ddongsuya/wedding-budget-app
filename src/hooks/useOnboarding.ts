import { useState, useCallback, useEffect } from 'react';

type OnboardingStep = 'welcome' | 'setup' | 'hints' | 'complete';

interface OnboardingState {
  currentStep: OnboardingStep;
  isFirstVisit: boolean;
  hasCompletedSetup: boolean;
  hasSeenHints: boolean;
  completeWelcome: () => void;
  completeSetup: (data?: any) => void;
  completeHints: () => void;
  skipOnboarding: () => void;
  resetOnboarding: () => void;
}

const STORAGE_KEYS = {
  hasVisited: 'hasVisited',
  hasCompletedSetup: 'hasCompletedSetup',
  hasSeenHints: 'hasSeenHints',
  setupData: 'onboardingSetupData',
};

export const useOnboarding = (): OnboardingState => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('complete');
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [hasCompletedSetup, setHasCompletedSetup] = useState(true);
  const [hasSeenHints, setHasSeenHints] = useState(true);

  useEffect(() => {
    const visited = localStorage.getItem(STORAGE_KEYS.hasVisited);
    const setup = localStorage.getItem(STORAGE_KEYS.hasCompletedSetup);
    const hints = localStorage.getItem(STORAGE_KEYS.hasSeenHints);

    const firstVisit = !visited;
    const completedSetup = setup === 'true';
    const seenHints = hints === 'true';

    setIsFirstVisit(firstVisit);
    setHasCompletedSetup(completedSetup);
    setHasSeenHints(seenHints);

    // 온보딩 단계 결정
    if (firstVisit) {
      setCurrentStep('welcome');
    } else if (!completedSetup) {
      setCurrentStep('setup');
    } else if (!seenHints) {
      setCurrentStep('hints');
    } else {
      setCurrentStep('complete');
    }
  }, []);

  const completeWelcome = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.hasVisited, 'true');
    setIsFirstVisit(false);
    setCurrentStep('setup');
  }, []);

  const completeSetup = useCallback((data?: any) => {
    localStorage.setItem(STORAGE_KEYS.hasCompletedSetup, 'true');
    if (data) {
      localStorage.setItem(STORAGE_KEYS.setupData, JSON.stringify(data));
    }
    setHasCompletedSetup(true);
    setCurrentStep('hints');
  }, []);

  const completeHints = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.hasSeenHints, 'true');
    setHasSeenHints(true);
    setCurrentStep('complete');
  }, []);

  const skipOnboarding = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.hasVisited, 'true');
    localStorage.setItem(STORAGE_KEYS.hasCompletedSetup, 'true');
    localStorage.setItem(STORAGE_KEYS.hasSeenHints, 'true');
    setIsFirstVisit(false);
    setHasCompletedSetup(true);
    setHasSeenHints(true);
    setCurrentStep('complete');
  }, []);

  const resetOnboarding = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.hasVisited);
    localStorage.removeItem(STORAGE_KEYS.hasCompletedSetup);
    localStorage.removeItem(STORAGE_KEYS.hasSeenHints);
    localStorage.removeItem(STORAGE_KEYS.setupData);
    setIsFirstVisit(true);
    setHasCompletedSetup(false);
    setHasSeenHints(false);
    setCurrentStep('welcome');
  }, []);

  return {
    currentStep,
    isFirstVisit,
    hasCompletedSetup,
    hasSeenHints,
    completeWelcome,
    completeSetup,
    completeHints,
    skipOnboarding,
    resetOnboarding,
  };
};

export default useOnboarding;
