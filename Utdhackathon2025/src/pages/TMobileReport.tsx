import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { AlertCircle, Activity, MapPin, TrendingUp, Phone, Zap, Signal, Frown, AlertTriangle, Lightbulb, TrendingDown, Clock, Star } from "lucide-react";
import { getReport } from "@/lib/api";

const TMobileReport = () => {
  const [tMobileData, setTMobileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getReport("t-mobile.json");
        setTMobileData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load report");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">Loading T-Mobile report...</p>
        </div>
      </div>
    );
  }

  if (error || !tMobileData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading report</p>
          <p className="text-muted-foreground text-sm">{error || "No report available"}</p>
        </div>
      </div>
    );
  }

  const statusColor = tMobileData.header.status_color === "red" ? "destructive" : "warning";

  // Icon mapping for key metrics
  const getMetricIcon = (icon: string) => {
    switch(icon) {
      case "⚡": return Zap;
      case "📞": return Phone;
      case "🚨": return AlertCircle;
      case "📶": return Signal;
      case "😠": return Frown;
      default: return Activity;
    }
  };

  // Trend icon mapping
  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case "up": return TrendingUp;
      case "down": return TrendingDown;
      default: return Activity;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Header Status Card */}
        <Card className="p-6 mb-8 border-2 border-destructive/20">
          <div className="flex items-center justify-between flex-wrap gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <h2 className="text-3xl font-bold text-foreground">{tMobileData.header.provider}</h2>
                <Badge variant={statusColor} className="text-sm">
                  {tMobileData.header.status.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center flex-wrap gap-6 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>{tMobileData.header.total_reports_24h} reports in last 24h</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Last updated: {new Date(tMobileData.header.last_updated).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 fill-primary text-primary" />
                  <span className="font-semibold text-foreground">{tMobileData.header.star_rating}</span>
                  <span>({tMobileData.header.rating_count})</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Sidebar - Insights & Sentiment */}
          <div className="lg:col-span-3 space-y-6">
            {/* Critical Insights */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <h3 className="text-lg font-semibold text-foreground">Critical Insights</h3>
              </div>
              <div className="space-y-3">
                {tMobileData.critical_insights.map((insight, index) => (
                  <div key={index} className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                    <p className="text-sm text-foreground">{insight}</p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Sentiment Analysis */}
            <Card className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-foreground mb-1">Sentiment Analysis</h3>
                <p className="text-sm text-muted-foreground">Customer feedback tone</p>
              </div>
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Negative</span>
                  <span className="text-lg font-bold text-destructive">{tMobileData.sentiment.negative}%</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div 
                    className="bg-destructive rounded-full h-2 transition-all" 
                    style={{ width: `${tMobileData.sentiment.negative}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Neutral</span>
                  <span className="text-sm font-medium">{tMobileData.sentiment.neutral}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Positive</span>
                  <span className="text-sm font-medium">{tMobileData.sentiment.positive}%</span>
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <h4 className="text-sm font-semibold text-foreground mb-3">Recent Feedback</h4>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {tMobileData.sentiment.samples.map((sample, index) => (
                      <div key={index} className="p-3 rounded-lg bg-card/50 border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-foreground">{sample.user}</span>
                          <Badge variant="secondary" className="text-xs">{sample.tone}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{sample.text}</p>
                        <span className="text-xs text-muted-foreground">{sample.time_ago}</span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-9">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              {tMobileData.key_metrics.map((metric, index) => {
                const Icon = getMetricIcon(metric.icon);
                const TrendIcon = getTrendIcon(metric.trend);
                const variant = metric.trend === "up" ? "destructive" : metric.trend === "down" ? "success" : "default";
                
                return (
                  <Card key={index} className="p-4 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-2">
                      <Icon className="h-5 w-5 text-primary" />
                      {metric.trend !== "stable" && (
                        <TrendIcon className={`h-4 w-4 ${metric.trend === "up" ? "text-destructive" : "text-success"}`} />
                      )}
                    </div>
                    <p className="text-2xl font-bold text-foreground mb-1">{metric.value}</p>
                    <p className="text-xs font-medium text-muted-foreground mb-1">{metric.title}</p>
                    <p className={`text-xs ${metric.trend === "up" ? "text-destructive" : metric.trend === "down" ? "text-success" : "text-muted-foreground"}`}>
                      {metric.trend_value}
                    </p>
                  </Card>
                );
              })}
            </div>

            {/* Trend Analysis */}
            <Card className="p-6 mb-8">
              <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Trend Analysis</h3>
                <Badge variant="secondary">{tMobileData.trend_analysis.direction}</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{tMobileData.trend_analysis.description}</p>
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground">
                  <span className="font-semibold">Chart Insights: </span>
                  {tMobileData.trend_analysis.chart_insights}
                </p>
              </div>
            </Card>

            {/* Geographic Hotspots and Pain Index */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="p-6 lg:col-span-2">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-foreground mb-1">Geographic Hotspots</h3>
                  <p className="text-sm text-muted-foreground">Areas with highest report volumes</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {tMobileData.geographic_hotspots.map((hotspot, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg border-2 ${
                        hotspot.severity === "high" 
                          ? "border-destructive/50 bg-destructive/5" 
                          : "border-warning/50 bg-warning/5"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <MapPin className={hotspot.severity === "high" ? "h-4 w-4 text-destructive" : "h-4 w-4 text-warning"} />
                          <span className="font-semibold text-foreground">{hotspot.city}</span>
                        </div>
                        <Badge variant={hotspot.severity === "high" ? "destructive" : "secondary"}>
                          {hotspot.severity}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Reports:</span>
                          <span className="font-bold text-foreground">{hotspot.reports_count}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Top Issue:</span>
                          <span className="font-medium text-foreground">{hotspot.top_issue}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Pain Index */}
              <Card className="p-6 flex flex-col items-center justify-center">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-foreground mb-2">Pain Index</h3>
                  <p className="text-sm text-muted-foreground mb-6">Overall service disruption severity</p>
                  <div className="mb-2">
                    <div className="text-6xl font-bold text-destructive">{tMobileData.pain_index}</div>
                    <p className="text-sm text-muted-foreground mt-2">out of 10.0</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Recommendations */}
            <Card className="p-6">
              <div className="mb-4 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-warning" />
                <h3 className="text-lg font-semibold text-foreground">Recommendations</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {tMobileData.recommendations.map((rec, index) => (
                  <div key={index} className="p-4 rounded-lg bg-success/5 border border-success/20 hover:border-success/40 transition-colors">
                    <p className="text-sm text-foreground">{rec}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TMobileReport;

