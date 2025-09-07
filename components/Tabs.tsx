import React from 'react';

interface TabsProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange }) => {
  return (
    <div className="border-b border-border-color">
      <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-secondary hover:text-on-surface hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200`}
            aria-current={activeTab === tab ? 'page' : undefined}
          >
            {tab}
          </button>
        ))}
      </nav>
    </div>
  );
};

export default Tabs;