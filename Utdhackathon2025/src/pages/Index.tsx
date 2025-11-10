import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { DashboardHeader } from "@/components/DashboardHeader";
import { MetricCard } from "@/components/MetricCard";
import { ProblemBreakdown } from "@/components/ProblemBreakdown";
import { OutageList } from "@/components/OutageList";
import { USHeatmap } from "@/components/USHeatmap";
import { StarRating } from "@/components/StarRating";
import { OutageChart } from "@/components/OutageChart";
import { IssueReports } from "@/components/IssueReports";
import { CompanyPosts } from "@/components/CompanyPosts";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertCircle, Activity, MapPin, TrendingUp } from "lucide-react";
import { ensureScrapedData, deleteReport } from "@/lib/api";

const Index = () => {
  const location = useLocation();
  const [outageData, setOutageData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  useEffect(() => {
    // Only delete and scrape when on the dashboard route "/"
    if (location.pathname !== "/") {
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        // Delete report files ONLY on dashboard route to ensure clean state
        try {
          await deleteReport("t-mobile.json");
        } catch (e) {
          // Ignore errors if file doesn't exist
        }
        try {
          await deleteReport("comparison_tmobile.json");
        } catch (e) {
          // Ignore errors if file doesn't exist
        }
        
        setIsScraping(true);
        // This will scrape fresh data every time
        const data = await ensureScrapedData("t-mobile");
        setOutageData(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        setLoading(false);
        setIsScraping(false);
      }
    };

    loadData();
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">
            {isScraping ? "Scraping T-Mobile data..." : "Loading T-Mobile data..."}
          </p>
          {isScraping && (
            <p className="text-sm text-muted-foreground/70">
              This may take a few moments...
            </p>
          )}
        </div>
      </div>
    );
  }

  if (error || !outageData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading data</p>
          <p className="text-muted-foreground text-sm">{error || "No data available"}</p>
        </div>
      </div>
    );
  }

  const totalReports = outageData.latest_reports?.length || 0;
  const affectedCities = outageData.last_15_days_status?.length || 0;
  const topProblem = outageData.most_reported_problems?.[0];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Issue Reports & Company Posts */}
          <div className="lg:col-span-3 space-y-6">
            {outageData.issues_reports && <IssueReports reports={outageData.issues_reports} />}
            {outageData.company_posts && <CompanyPosts posts={outageData.company_posts} />}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <MetricCard
                title="Active Reports"
                value={totalReports}
                icon={Activity}
                variant="default"
              />
              <MetricCard
                title="Affected Cities"
                value={affectedCities}
                icon={MapPin}
                variant="warning"
              />
              {topProblem && (
                <MetricCard
                  title="Top Issue"
                  value={topProblem.label}
                  icon={AlertCircle}
                  variant="destructive"
                  trend={{ value: topProblem.percent, label: `${topProblem.percent}% of reports` }}
                />
              )}
              {!topProblem && (
                <MetricCard
                  title="Top Issue"
                  value="N/A"
                  icon={AlertCircle}
                  variant="default"
                />
              )}
              <MetricCard
                title="Trend"
                value="Monitoring"
                icon={TrendingUp}
                variant="success"
              />
            </div>

            {/* Heatmap */}
            {outageData.last_15_days_status && (
              <div className="mb-8">
                <USHeatmap locations={outageData.last_15_days_status} />
              </div>
            )}

            {/* 24 Hour Chart with Star Rating */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
              <div className="lg:col-span-3">
                <OutageChart chart={outageData.chart} />
              </div>
              <StarRating 
                rating={outageData.star_rating?.current} 
                count={outageData.star_rating?.count} 
              />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {outageData.most_reported_problems && (
                <ProblemBreakdown problems={outageData.most_reported_problems} />
              )}
              {outageData.latest_reports && (
                <OutageList reports={outageData.latest_reports} />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
