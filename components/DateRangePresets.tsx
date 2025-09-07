
import React from 'react';
import { formatDateToISO } from '../dateUtils';

interface DateRangePresetsProps {
  setStartDate: (date: string) => void;
  setEndDate: (date: string) => void;
  activePreset: string;
  setActivePreset: (preset: string) => void;
}

const PRESETS = [
  'Custom',
  'Last 7 Days',
  'Last 30 Days',
  'Last Quarter',
  'Last Year',
];

const DateRangePresets: React.FC<DateRangePresetsProps> = ({ setStartDate, setEndDate, activePreset, setActivePreset }) => {
  const handlePresetClick = (label: string) => {
    if (activePreset === label) {
      // Clicking an active preset deselects it, clears dates, and reverts to Custom.
      // Clicking 'Custom' when it's already active does nothing.
      if (label === 'Custom') return;
      
      setStartDate('');
      setEndDate('');
      setActivePreset('Custom');
      return;
    }

    setActivePreset(label);

    // If switching to custom, do nothing to the dates, allowing manual entry.
    if (label === 'Custom') {
      return;
    }

    // Otherwise, calculate and set dates for the selected preset.
    const today = new Date();
    const endDateStr = formatDateToISO(today);
    const startDate = new Date(today);
    
    switch (label) {
      case 'Last 7 Days':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'Last 30 Days':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case 'Last Quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'Last Year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        return;
    }
    
    const startDateStr = formatDateToISO(startDate);
    
    setEndDate(endDateStr);
    setStartDate(startDateStr);
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium text-on-surface-secondary mr-2">Quick Select:</span>
        {PRESETS.map((label) => (
        <button
            key={label}
            type="button"
            onClick={() => handlePresetClick(label)}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors duration-200 ${
            activePreset === label
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-on-surface-secondary hover:bg-gray-200'
            }`}
        >
            {label}
        </button>
        ))}
    </div>
  );
};

export default DateRangePresets;
