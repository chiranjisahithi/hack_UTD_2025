import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { TrendingUp, TrendingDown, MapPin, AlertCircle, Star, Wifi, Phone, Zap } from "lucide-react";
import { getReport } from "@/lib/api";

const ComparisonPage = () => {
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const data = await getReport("comparison_tmobile.json");
        setComparisonData(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load comparison");
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
          <p className="text-muted-foreground">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  if (error || !comparisonData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive mb-2">Error loading comparison</p>
          <p className="text-muted-foreground text-sm">{error || "No comparison data available"}</p>
        </div>
      </div>
    );
  }

  const { tmobile, providers } = comparisonData;

  // Helper function to determine if metric is better (lower is better for reports/issues, higher for rating)
  const isBetter = (metric: string, providerValue: number, tmobileValue: number) => {
    if (metric === "star_rating") {
      return providerValue > tmobileValue;
    }
    // For other metrics, lower is better
    return providerValue < tmobileValue;
  };

  // Get icon for metric type
  const getMetricIcon = (metric: string) => {
    switch (metric) {
      case "star_rating":
        return Star;
      case "total_reports":
        return AlertCircle;
      case "locations":
        return MapPin;
      case "total_blackout_pct":
        return Zap;
      case "internet_pct":
        return Wifi;
      case "phone_pct":
        return Phone;
      default:
        return AlertCircle;
    }
  };

  // Format metric label
  const formatMetricLabel = (metric: string) => {
    const labels: { [key: string]: string } = {
      star_rating: "Star Rating",
      total_reports: "Total Reports",
      locations: "Locations",
      total_blackout_pct: "Blackout %",
      internet_pct: "Internet %",
      phone_pct: "Phone %",
    };
    return labels[metric] || metric;
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8 animate-fade-in">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground mb-2">Provider Comparison</h2>
          <p className="text-muted-foreground">Comparing {comparisonData.baseline} against major telecommunications providers</p>
        </div>

        {/* T-Mobile Baseline Card */}
        <Card className="p-6 mb-8 border-2 border-primary/30 bg-primary/5">
          <div className="mb-4">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-foreground">T-Mobile (Baseline)</h3>
              <Badge variant="default">Reference Provider</Badge>
            </div>
            <p className="text-sm text-muted-foreground">All comparisons are measured against these metrics</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-primary fill-primary" />
                <span className="text-xs font-medium text-muted-foreground">Star Rating</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{tmobile.star_rating}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <span className="text-xs font-medium text-muted-foreground">Reports</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{tmobile.total_reports.toLocaleString()}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-warning" />
                <span className="text-xs font-medium text-muted-foreground">Locations</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{tmobile.locations}</p>
            </div>
            
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-destructive" />
                <span className="text-xs font-medium text-muted-foreground">Blackout</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{tmobile.total_blackout_pct}%</p>
            </div>
            
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Wifi className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Internet</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{tmobile.internet_pct}%</p>
            </div>
            
            <div className="p-4 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2 mb-2">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-muted-foreground">Phone</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{tmobile.phone_pct}%</p>
            </div>
          </div>
        </Card>

        {/* Competitors Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {providers.map((provider, index) => {
            const betterCount = provider.better_than_tmobile.length;
            const worseCount = provider.worse_than_tmobile.length;
            const overallBetter = betterCount > worseCount;

            return (
              <Card key={index} className="p-6 hover:shadow-lg transition-all duration-300">
                {/* Provider Header */}
                <div className="mb-4 pb-4 border-b border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-bold text-foreground">{provider.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                        {betterCount} Better
                      </Badge>
                      <Badge className="bg-success/20 text-success border-success/30">
                        {worseCount} Worse
                      </Badge>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{provider.reasoning}</p>
                </div>

                {/* Metrics Comparison */}
                <div className="space-y-3">
                  {/* Star Rating */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-2">
                      <Star className={`h-4 w-4 ${provider.better_than_tmobile.includes('star_rating') ? 'text-destructive fill-destructive' : provider.worse_than_tmobile.includes('star_rating') ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">Star Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{provider.star_rating}</span>
                      {provider.better_than_tmobile.includes('star_rating') && (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      {provider.worse_than_tmobile.includes('star_rating') && (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>

                  {/* Total Reports */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-2">
                      <AlertCircle className={`h-4 w-4 ${provider.better_than_tmobile.includes('total_reports') ? 'text-destructive' : provider.worse_than_tmobile.includes('total_reports') ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">Total Reports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{provider.total_reports.toLocaleString()}</span>
                      {provider.better_than_tmobile.includes('total_reports') && (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      {provider.worse_than_tmobile.includes('total_reports') && (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>

                  {/* Locations */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-2">
                      <MapPin className={`h-4 w-4 ${provider.better_than_tmobile.includes('locations') ? 'text-destructive' : provider.worse_than_tmobile.includes('locations') ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">Locations</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{provider.locations}</span>
                      {provider.better_than_tmobile.includes('locations') && (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      {provider.worse_than_tmobile.includes('locations') && (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>

                  {/* Blackout % */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-2">
                      <Zap className={`h-4 w-4 ${provider.better_than_tmobile.includes('total_blackout_pct') ? 'text-destructive' : provider.worse_than_tmobile.includes('total_blackout_pct') ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">Blackout %</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{provider.total_blackout_pct}%</span>
                      {provider.better_than_tmobile.includes('total_blackout_pct') && (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      {provider.worse_than_tmobile.includes('total_blackout_pct') && (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>

                  {/* Internet % */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-2">
                      <Wifi className={`h-4 w-4 ${provider.better_than_tmobile.includes('internet_pct') ? 'text-destructive' : provider.worse_than_tmobile.includes('internet_pct') ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">Internet %</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{provider.internet_pct}%</span>
                      {provider.better_than_tmobile.includes('internet_pct') && (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      {provider.worse_than_tmobile.includes('internet_pct') && (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>

                  {/* Phone % */}
                  <div className="flex items-center justify-between p-3 rounded-lg bg-card/50">
                    <div className="flex items-center gap-2">
                      <Phone className={`h-4 w-4 ${provider.better_than_tmobile.includes('phone_pct') ? 'text-destructive' : provider.worse_than_tmobile.includes('phone_pct') ? 'text-success' : 'text-muted-foreground'}`} />
                      <span className="text-sm font-medium text-foreground">Phone %</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{provider.phone_pct}%</span>
                      {provider.better_than_tmobile.includes('phone_pct') && (
                        <TrendingUp className="h-4 w-4 text-destructive" />
                      )}
                      {provider.worse_than_tmobile.includes('phone_pct') && (
                        <TrendingDown className="h-4 w-4 text-success" />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Summary Insights */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-semibold text-foreground mb-4">Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-success/5 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-success" />
                <span className="font-semibold text-foreground">Best Overall</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Cricket Wireless leads with highest star rating (3.08) and fewer reports
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-destructive" />
                <span className="font-semibold text-foreground">Highest Volume</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Charter Communications has significantly more reports (10,056) than all others
              </p>
            </div>
            
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-primary" />
                <span className="font-semibold text-foreground">T-Mobile Position</span>
              </div>
              <p className="text-sm text-muted-foreground">
                T-Mobile ranks mid-tier with moderate reports and balanced issue distribution
              </p>
            </div>
          </div>
        </Card>
      </main>
    </div>
  );
};

export default ComparisonPage;

