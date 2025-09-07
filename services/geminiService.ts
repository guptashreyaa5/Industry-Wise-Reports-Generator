import { GoogleGenAI } from "@google/genai";
import type { ReportData, ReportEntry, GroundingChunk } from '../types';
import { COMPANY_RESOURCES, TOP_REVENUE_COUNTRIES } from "../constants";

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function getIndustryReport(industry: string, startDate: string, endDate: string, keyword: string): Promise<ReportData> {
  const keywordClause = keyword ? ` with a specific focus on "${keyword}"` : '';

  let specialInstructions = '';
  if (industry === 'Country-wise: Import & Export') {
    specialInstructions = `
    **Special Instruction for this Industry:**
    - When searching for "Country-wise: Import & Export" data, you **MUST** prioritize official government sources. This includes national statistics offices, trade ministries, customs agencies, and central banks. For example, look for sources like the U.S. Census Bureau, Eurostat, or the National Bureau of Statistics of China.
    `;
  }

  const prompt = `
    You are an expert market research analyst. Your primary goal is to maximize the number of relevant reports found. Find as many high-quality reports as possible that meet the criteria below, with a minimum target of 25.
    
    **Search Criteria:**
    - **Industry:** "${industry}"${keywordClause}
    - **Publication Date Range:** ${startDate} to ${endDate}
    ${specialInstructions}
    
    **Search Directives:**
    1. **Prioritize Recurring Reports:** Give precedence to reports that are published on a recurring basis (e.g., quarterly, annually). These are often the most valuable for tracking trends.
    2. **Mandatory Source Coverage:** Your search **MUST** include and prioritize findings from the following specific sources and regions. Cross-reference your findings with these providers:
    
    - **Key Research & Consulting Firms:**
      - ${COMPANY_RESOURCES.join('\n      - ')}
    
    - **Top Revenue Countries:**
      - ${TOP_REVENUE_COUNTRIES.join('\n      - ')}
      
    **Output Format:**
    For each report found, extract the following information:
    - reportName: The full title of the report.
    - publisher: The name of the publishing organization.
    - frequency: The publication frequency (e.g., "Quarterly", "Annual", "One-time").
    - metricsCovered: A brief summary of key metrics covered.
    - link: The direct URL to the report. If not available, use the source URL.
    - categories: A list of relevant categories or tags.
    
    Present the output **ONLY** as a single JSON array of objects, enclosed in a single markdown code block. Do not include any introductory text, summary, or any other content outside of the JSON block.
    
    Example:
    \`\`\`json
    [
      {
        "reportName": "Global Hotel Industry Trends 2024",
        "publisher": "PwC (Big 4)",
        "frequency": "Annual",
        "metricsCovered": "Occupancy rates, RevPAR, market segmentation, and investment trends in the US and Europe.",
        "link": "https://pwc.com/report-link",
        "categories": ["Hospitality", "Market Research", "Travel"]
      }
    ]
    \`\`\`
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const responseText = response.text;
    let reports: ReportEntry[] = [];

    try {
        // More robust JSON extraction. Find the string between the first '[' and the last ']'.
        const startIndex = responseText.indexOf('[');
        const endIndex = responseText.lastIndexOf(']');
        
        if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
          throw new Error("No valid JSON array found in the response.");
        }

        const jsonString = responseText.substring(startIndex, endIndex + 1);
        const parsed = JSON.parse(jsonString);

        if (Array.isArray(parsed)) {
            reports = parsed;
        } else {
             console.warn("Parsed JSON is not an array:", parsed);
             // Be lenient and wrap if it's a single object
             if (typeof parsed === 'object' && parsed !== null) {
                reports = [parsed];
             }
        }
    } catch (e) {
        console.error("Failed to parse JSON response from Gemini:", e);
        console.error("Original response text:", responseText);
        throw new Error(`The AI returned a response that could not be understood. Please try again.`);
    }

    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;

    const sources: GroundingChunk[] = groundingMetadata?.groundingChunks?.filter(
        (chunk: any): chunk is GroundingChunk => chunk.web && chunk.web.uri && chunk.web.title
    ) || [];

    return { reports, sources };
    
  } catch (error) {
    console.error("Gemini API call failed:", error);
    if (error instanceof Error) {
        throw new Error(`Gemini API Error: ${error.message}`);
    }
    throw new Error("An unexpected error occurred while fetching the report from Gemini API.");
  }
}