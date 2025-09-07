import React, { useState, useCallback } from 'react';
import { INDUSTRIES } from './constants';
import { getIndustryReport } from './services/geminiService';
import type { ReportData } from './types';
import ReportDisplay from './components/ReportDisplay';
import { SearchIcon } from './components/icons/SearchIcon';
import DateRangePresets from './components/DateRangePresets';
import { formatDateToISO, formatDateToDisplay } from './dateUtils';
import { XIcon } from './components/icons/XIcon';

type ReportsState = {
  [key: string]: ReportData | null;
};

type LoadingState = {
  [key: string]: boolean;
};

type ErrorState = {
  [key: string]: string | null;
};

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>(INDUSTRIES[0]);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');
  const [reports, setReports] = useState<ReportsState>({});
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});
  const [errorStates, setErrorStates] = useState<ErrorState>({});
  const [activePreset, setActivePreset] = useState<string>('Custom');
  const [startInputType, setStartInputType] = useState('text');
  const [endInputType, setEndInputType] = useState('text');
  
  const today = formatDateToISO(new Date());

  const handleRun = useCallback(async () => {
    if (!startDate || !endDate) {
      setReports({});
      setErrorStates(prev => ({ ...prev, [activeTab]: 'Please select a start and end date.' }));
      setLoadingStates(prev => ({ ...prev, [activeTab]: false }));
      return;
    }
    
    setLoadingStates(prev => ({ ...prev, [activeTab]: true }));
    setErrorStates(prev => ({ ...prev, [activeTab]: null }));
    setReports(prev => ({ ...prev, [activeTab]: null }));

    try {
      const result = await getIndustryReport(activeTab, startDate, endDate, keyword);
      setReports(prev => ({ ...prev, [activeTab]: result }));
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      setErrorStates(prev => ({ ...prev, [activeTab]: `Failed to generate report: ${errorMessage}` }));
    } finally {
      setLoadingStates(prev => ({ ...prev, [activeTab]: false }));
    }
  }, [activeTab, startDate, endDate, keyword]);
  
  const handleClearFilters = useCallback(() => {
    setActiveTab(INDUSTRIES[0]);
    setStartDate('');
    setEndDate('');
    setKeyword('');
    setReports({});
    setErrorStates({});
    setLoadingStates({});
    setActivePreset('Custom');
  }, []);

  const isDateInputDisabled = activePreset !== 'Custom';
  const showReport = loadingStates[activeTab] || errorStates[activeTab] || reports[activeTab];

  return (
    <div className={`min-h-screen bg-background text-on-surface font-sans flex flex-col transition-all duration-500 ${!showReport ? 'justify-center' : 'pt-8'}`}>
      <div className="w-full container mx-auto px-4">
        <main className="flex flex-col items-center">
            
          <h1 className={`text-center font-bold select-none mb-6 transition-all duration-500 text-on-surface ${!showReport ? 'text-4xl md:text-5xl' : 'text-2xl'}`}>
            Industry-Wise Report Generator
          </h1>

          <div className="w-full max-w-2xl">
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-on-surface-secondary">
                  <SearchIcon />
              </div>
              <input
                id="keyword"
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Keyword (optional, e.g., Hotels, EVs, Smartphones)"
                className="w-full bg-surface border border-border-color rounded-full py-3 pl-11 pr-4 text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary shadow-sm hover:shadow-md transition"
                aria-label="Keyword"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1">
                <label htmlFor="industry-select" className="block text-sm font-medium text-on-surface-secondary mb-1">Industry</label>
                <select
                  id="industry-select"
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="w-full bg-surface border border-border-color rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition h-[42px]"
                  aria-label="Select Industry"
                >
                  {INDUSTRIES.map(industry => <option key={industry} value={industry}>{industry}</option>)}
                </select>
              </div>
              <div className="md:col-span-1">
                 <label htmlFor="start-date" className="block text-sm font-medium text-on-surface-secondary mb-1">Start Date</label>
                 <input
                    id="start-date"
                    type={startInputType}
                    value={startInputType === 'date' ? startDate : formatDateToDisplay(startDate)}
                    placeholder="mm/dd/yyyy"
                    onFocus={() => setStartInputType('date')}
                    onBlur={() => setStartInputType('text')}
                    onChange={(e) => { setStartDate(e.target.value); setActivePreset('Custom'); }}
                    max={endDate || today}
                    className="w-full bg-surface border border-border-color rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    aria-label="Start Date"
                    disabled={isDateInputDisabled}
                 />
              </div>
               <div className="md:col-span-1">
                <label htmlFor="end-date" className="block text-sm font-medium text-on-surface-secondary mb-1">End Date</label>
                <input
                    id="end-date"
                    type={endInputType}
                    value={endInputType === 'date' ? endDate : formatDateToDisplay(endDate)}
                    placeholder="mm/dd/yyyy"
                    onFocus={() => setEndInputType('date')}
                    onBlur={() => setEndInputType('text')}
                    onChange={(e) => { setEndDate(e.target.value); setActivePreset('Custom'); }}
                    min={startDate}
                    max={today}
                    className="w-full bg-surface border border-border-color rounded-md px-3 py-2 text-on-surface focus:ring-2 focus:ring-primary/50 focus:border-primary transition disabled:bg-gray-100 disabled:cursor-not-allowed"
                    aria-label="End Date"
                    disabled={isDateInputDisabled}
                />
              </div>
            </div>
            
            <div className="mb-6">
              <DateRangePresets
                setStartDate={setStartDate}
                setEndDate={setEndDate}
                activePreset={activePreset}
                setActivePreset={setActivePreset}
              />
            </div>

            <div className="flex items-center justify-center gap-4">
               <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 bg-gray-200 text-on-surface-secondary font-medium rounded-md hover:bg-gray-300 shadow-sm transition-all duration-200 flex items-center justify-center gap-2"
                  aria-label="Clear all filters and results"
                >
                  <XIcon />
                  Clear Filters
                </button>
               <button
                  onClick={handleRun}
                  disabled={loadingStates[activeTab]}
                  className="px-6 py-2 bg-primary text-white font-medium rounded-md hover:bg-primary/90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
                >
                  {loadingStates[activeTab] ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating...
                    </>
                  ) : (
                    <>
                      <SearchIcon />
                      Generate Reports
                    </>
                  )}
                </button>
            </div>
          </div>
          
          {showReport && (
            <div className="mt-12 w-full max-w-7xl">
              <ReportDisplay
                isLoading={loadingStates[activeTab] || false}
                error={errorStates[activeTab] || null}
                report={reports[activeTab] || null}
              />
            </div>
          )}
        </main>
      </div>
      <footer className={`text-center text-on-surface-secondary py-6 text-sm ${showReport ? 'mt-auto' : ''}`}>
        <p>&copy; {new Date().getFullYear()} AI Industry Reports. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default App;