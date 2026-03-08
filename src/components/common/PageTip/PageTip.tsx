import React, { useState, useEffect } from 'react';
import { X, Lightbulb } from 'lucide-react';
import { shouldShowFeatureTip, getVisitedPages, markPageVisited, PAGE_TIPS } from '@/utils/featureTipLogic';

interface PageTipProps {
  pageKey: string;
}

export const PageTip: React.FC<PageTipProps> = ({ pageKey }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const visited = getVisitedPages();
    if (shouldShowFeatureTip(pageKey, visited)) {
      setVisible(true);
    }
  }, [pageKey]);

  const handleDismiss = () => {
    markPageVisited(pageKey);
    setVisible(false);
  };

  const tip = PAGE_TIPS[pageKey];
  if (!visible || !tip) return null;

  return (
    <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl mb-4">
      <Lightbulb className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium text-blue-800">{tip.title}</p>
        <p className="text-xs text-blue-600 mt-1">{tip.description}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 text-blue-400 hover:text-blue-600 rounded-full hover:bg-blue-100"
        aria-label="팁 닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PageTip;
