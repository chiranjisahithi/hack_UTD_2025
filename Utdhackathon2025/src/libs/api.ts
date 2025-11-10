/**
 * API service for communicating with the FastAPI backend
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface AnalyzeResponse {
  header: {
    provider: string;
    status: string;
    status_color: string;
    star_rating: number;
    rating_count: string;
    total_reports_24h: number;
    last_updated: string;
  };
  key_metrics: Array<{
    title: string;
    value: string;
    icon: string;
    trend: string;
    trend_value: string;
  }>;
  [key: string]: any;
}

export interface CompareResponse {
  baseline: string;
  tmobile: {
    star_rating: number;
    total_reports: number;
    locations: number;
    total_blackout_pct: number;
    internet_pct: number;
    phone_pct: number;
  };
  providers: Array<{
    name: string;
    star_rating: number;
    total_reports: number;
    locations: number;
    total_blackout_pct: number;
    internet_pct: number;
    phone_pct: number;
    better_than_tmobile: string[];
    worse_than_tmobile: string[];
    reasoning: string;
  }>;
}

/**
 * Analyze a service provider and generate a report
 * @param service - Service provider name (e.g., "t-mobile")
 * @returns Promise with the generated report
 */
export async function analyzeService(service: string): Promise<AnalyzeResponse> {
  const response = await fetch(`${API_BASE_URL}/analyze?service=${encodeURIComponent(service)}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || `Failed to analyze ${service}`);
  }
  
  return response.json();
}

/**
 * Compare all providers against T-Mobile
 * @returns Promise with the comparison results
 */
export async function compareMetrics(): Promise<CompareResponse> {
  const response = await fetch(`${API_BASE_URL}/compare_metrics`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to compare metrics');
  }
  
  return response.json();
}

/**
 * Check if a report file exists
 * @param filename - Name of the report file (e.g., "t-mobile.json")
 * @returns Promise<boolean> - true if file exists
 */
export async function checkReportExists(filename: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/check_report?filename=${encodeURIComponent(filename)}`);
    if (!response.ok) return false;
    const data = await response.json();
    return data.exists === true;
  } catch {
    return false;
  }
}

/**
 * Get a report file if it exists
 * @param filename - Name of the report file (e.g., "t-mobile.json")
 * @returns Promise with the report data
 */
export async function getReport(filename: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/get_report?filename=${encodeURIComponent(filename)}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Report not found');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to get report');
  }
  
  return response.json();
}

/**
 * Get scraped data file if it exists
 * @param filename - Name of the scraped data file (e.g., "t-mobile.json")
 * @returns Promise with the scraped data
 */
export async function getScrapedData(filename: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/get_scraped_data?filename=${encodeURIComponent(filename)}`);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Scraped data not found');
    }
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to get scraped data');
  }
  
  return response.json();
}

/**
 * Ensure scraped data exists for a service. If it doesn't exist, triggers scraping.
 * @param service - Service provider name (e.g., "t-mobile")
 * @returns Promise with the scraped data
 */
export async function ensureScrapedData(service: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/ensure_scraped_data?service=${encodeURIComponent(service)}`);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to ensure scraped data');
  }
  
  return response.json();
}

/**
 * Delete a report file if it exists
 * @param filename - Name of the report file (e.g., "t-mobile.json")
 * @returns Promise with deletion result
 */
export async function deleteReport(filename: string): Promise<{ deleted: boolean; message: string }> {
  const response = await fetch(`${API_BASE_URL}/delete_report?filename=${encodeURIComponent(filename)}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(error.detail || 'Failed to delete report');
  }
  
  return response.json();
}

