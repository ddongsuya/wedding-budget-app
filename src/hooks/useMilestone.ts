import { useState, useEffect, useCallback } from 'react';

type MilestoneType = 'd100' | 'd30' | 'd7' | 'd1' | 'dday' | 'checklist50' | 'checklist100' | 'budget50';

interface MilestoneState {
  currentMilestone: MilestoneType | null;
  dismissMilestone: () => void;
}

const MILESTONE_STORAGE_KEY = 'celebratedMilestones';

export const useMilestone = (
  dDay: number | null,
  checklistProgress: number,
  budgetProgress: number
): MilestoneState => {
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneType | null>(null);

  const getCelebratedMilestones = useCallback((): string[] => {
    try {
      const stored = localStorage.getItem(MILESTONE_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }, []);

  const markMilestoneCelebrated = useCallback((milestone: MilestoneType) => {
    const celebrated = getCelebratedMilestones();
    if (!celebrated.includes(milestone)) {
      celebrated.push(milestone);
      localStorage.setItem(MILESTONE_STORAGE_KEY, JSON.stringify(celebrated));
    }
  }, [getCelebratedMilestones]);

  const dismissMilestone = useCallback(() => {
    if (currentMilestone) {
      markMilestoneCelebrated(currentMilestone);
      setCurrentMilestone(null);
    }
  }, [currentMilestone, markMilestoneCelebrated]);

  useEffect(() => {
    const celebrated = getCelebratedMilestones();
    
    // D-day 마일스톤 체크
    if (dDay !== null) {
      if (dDay === 0 && !celebrated.includes('dday')) {
        setCurrentMilestone('dday');
        return;
      }
      if (dDay === 1 && !celebrated.includes('d1')) {
        setCurrentMilestone('d1');
        return;
      }
      if (dDay === 7 && !celebrated.includes('d7')) {
        setCurrentMilestone('d7');
        return;
      }
      if (dDay === 30 && !celebrated.includes('d30')) {
        setCurrentMilestone('d30');
        return;
      }
      if (dDay === 100 && !celebrated.includes('d100')) {
        setCurrentMilestone('d100');
        return;
      }
    }

    // 체크리스트 마일스톤
    if (checklistProgress >= 100 && !celebrated.includes('checklist100')) {
      setCurrentMilestone('checklist100');
      return;
    }
    if (checklistProgress >= 50 && !celebrated.includes('checklist50')) {
      setCurrentMilestone('checklist50');
      return;
    }

    // 예산 마일스톤
    if (budgetProgress >= 50 && !celebrated.includes('budget50')) {
      setCurrentMilestone('budget50');
      return;
    }
  }, [dDay, checklistProgress, budgetProgress, getCelebratedMilestones]);

  return { currentMilestone, dismissMilestone };
};

export default useMilestone;
