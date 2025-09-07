import React, { useState, useEffect, useRef } from 'react';
import * as XLSX from 'xlsx';
import type { ReportData, ReportEntry } from '../types';
import LoadingSpinner from './LoadingSpinner';
import { LinkIcon } from './icons/LinkIcon';
import { DownloadIcon } from './icons/DownloadIcon';

interface ReportDisplayProps {
  isLoading: boolean;
  error: string | null;
  report: ReportData | null;
}

const createCSV = (data: ReportEntry[]): string => {
  const headers = ["reportName", "publisher", "frequency", "metricsCovered", "link", "categories"];
  return [
    headers.join(','),
    ...data.map(reportItem => 
      headers.map(header => {
        let value = (reportItem as any)[header];
        if (header === 'categories' && Array.isArray(value)) {
          value = value.join('; ');
        }
        const stringValue = String(value ?? '').replace(/"/g, '""');
        return `"${stringValue}"`;
      }).join(',')
    )
  ].join('\n');
};

const downloadTextAsFile = (content: string, fileName: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


const ReportDisplay: React.FC<ReportDisplayProps> = ({ isLoading, error, report }) => {
  const [selectedReports, setSelectedReports] = useState<ReportEntry[]>([]);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setSelectedReports([]);
  }, [report]);
  
  const allSelected = report && report.reports.length > 0 && selectedReports.length === report.reports.length;
  const isIndeterminate = selectedReports.length > 0 && !allSelected;

  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = isIndeterminate;
    }
  }, [isIndeterminate]);

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedReports(report?.reports || []);
    } else {
      setSelectedReports([]);
    }
  };

  const handleSelectOne = (event: React.ChangeEvent<HTMLInputElement>, item: ReportEntry) => {
    if (event.target.checked) {
      setSelectedReports(prev => [...prev, item]);
    } else {
      setSelectedReports(prev => prev.filter(report => report.link !== item.link));
    }
  };

  const handleDownloadSelected = () => {
    if (selectedReports.length === 0) return;
    const csvContent = createCSV(selectedReports);
    downloadTextAsFile(csvContent, 'ai-reports-selected.csv', 'text/csv;charset=utf-8;');
  };

  const handleExportAll = (format: 'csv' | 'xlsx') => {
    if (!report || report.reports.length === 0) return;

    if (format === 'csv') {
      const csvContent = createCSV(report.reports);
      downloadTextAsFile(csvContent, 'ai-reports-all.csv', 'text/csv;charset=utf-8;');
    } else if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(report.reports);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reports");
      XLSX.writeFile(workbook, "ai-reports-all.xlsx");
    }
  };


  if (isLoading) {
    return <div className="flex justify-center items-center h-full p-10"><LoadingSpinner /></div>;
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-full p-10">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md" role="alert">
          <strong className="font-bold">Error: </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  if (!report || !report.reports || report.reports.length === 0) {
    return (
      <div className="text-center text-on-surface-secondary pt-16">
        <p className="text-lg">{report ? 'No reports found for the selected criteria.' : "Select a time frame and click 'Run' to generate a report."}</p>
        <p className="text-sm mt-2">Your AI-powered industry insights will appear here.</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-on-surface">Industry Reports ({report.reports.length} found)</h2>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleDownloadSelected}
            disabled={selectedReports.length === 0}
            className="px-4 py-2 bg-white text-primary border border-primary text-sm font-semibold rounded-md hover:bg-primary/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <DownloadIcon />
            Download Selected ({selectedReports.length})
          </button>
          <button
            onClick={() => handleExportAll('csv')}
            disabled={!report || report.reports.length === 0}
            className="px-4 py-2 bg-primary text-white text-sm font-semibold rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <DownloadIcon />
            Export All (CSV)
          </button>
          <button
            onClick={() => handleExportAll('xlsx')}
            disabled={!report || report.reports.length === 0}
            className="px-4 py-2 bg-google-green text-white text-sm font-semibold rounded-md hover:bg-google-green/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2 shadow-sm"
          >
            <DownloadIcon />
            Export All (Excel)
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-border-color rounded-lg">
        <table className="min-w-full divide-y divide-border-color text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="relative px-6 sm:w-12 sm:px-8">
                <label htmlFor="select-all" className="sr-only">Select all reports</label>
                <input
                  id="select-all"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  ref={selectAllCheckboxRef}
                  checked={allSelected}
                  onChange={handleSelectAll}
                />
              </th>
              <th scope="col" className="py-3.5 pl-3 pr-3 text-left font-semibold text-on-surface">Report Name</th>
              <th scope="col" className="px-3 py-3.5 text-left font-semibold text-on-surface">Publisher</th>
              <th scope="col" className="px-3 py-3.5 text-left font-semibold text-on-surface">Frequency</th>
              <th scope="col" className="px-3 py-3.5 text-left font-semibold text-on-surface">Metrics Covered</th>
              <th scope="col" className="px-3 py-3.5 text-left font-semibold text-on-surface">Categories</th>
              <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                <span className="sr-only">Link</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color bg-surface">
            {report.reports.map((item: ReportEntry, index: number) => (
              <tr key={index} className={`hover:bg-gray-50 transition-colors ${selectedReports.some(r => r.link === item.link) ? 'bg-primary/5' : ''}`}>
                <td className="relative px-7 sm:w-12 sm:px-8">
                  <label htmlFor={`select-report-${index}`} className="sr-only">Select report: {item.reportName}</label>
                  <input
                    id={`select-report-${index}`}
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    value={item.link}
                    checked={selectedReports.some(r => r.link === item.link)}
                    onChange={(e) => handleSelectOne(e, item)}
                  />
                </td>
                <td className="whitespace-normal py-4 pl-3 pr-3 font-medium text-on-surface max-w-sm">{item.reportName}</td>
                <td className="whitespace-nowrap px-3 py-4 text-on-surface-secondary">{item.publisher}</td>
                <td className="whitespace-nowrap px-3 py-4 text-on-surface-secondary">{item.frequency}</td>
                <td className="whitespace-normal px-3 py-4 text-on-surface-secondary max-w-xs">{item.metricsCovered}</td>
                <td className="whitespace-normal px-3 py-4 text-on-surface-secondary">
                  <div className="flex flex-wrap gap-2 max-w-xs">
                    {item.categories && item.categories.map(cat => (
                      <span key={cat} className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-on-surface-secondary ring-1 ring-inset ring-gray-200">
                        {cat}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right font-medium sm:pr-6">
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/90 inline-flex items-center gap-1">
                    View
                    <LinkIcon />
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {report.sources && report.sources.length > 0 && (
        <div>
          <h3 className="text-xl font-bold text-on-surface mb-4 border-b border-border-color pb-2">Sources Consulted by AI</h3>
          <ul className="space-y-3">
            {report.sources.map((source, index) => (
              <li key={index} className="flex items-start">
                <span className="text-primary mr-3 pt-1"><LinkIcon /></span>
                <a
                  href={source.web.uri}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/90 hover:underline transition-colors"
                >
                  {source.web.title || source.web.uri}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default ReportDisplay;