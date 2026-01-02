import React from 'react';

type TabType = 'summary' | 'budget' | 'schedule';

interface DashboardTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const TABS: { id: TabType; label: string }[] = [
  { id: 'summary', label: '요약' },
  { id: 'budget', label: '예산' },
  { id: 'schedule', label: '일정' },
];

export const DashboardTabs: React.FC<DashboardTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="flex gap-1 p-1 bg-stone-100 rounded-xl">
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            activeTab === tab.id
              ? 'bg-white text-stone-800 shadow-sm'
              : 'text-stone-500 hover:text-stone-700'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default DashboardTabs;
