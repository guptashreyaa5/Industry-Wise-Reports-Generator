export interface ReportEntry {
  reportName: string;
  publisher: string;
  frequency: string;
  metricsCovered: string;
  link: string;
  categories: string[];
}

export interface GroundingChunk {
  web: {
    uri: string;
    title: string;
  };
}

export interface ReportData {
  reports: ReportEntry[];
  sources: GroundingChunk[];
}
