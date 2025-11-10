import { useEffect, useState } from "react";
import { FileText, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { analyzeService, compareMetrics, checkReportExists } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

export const DashboardHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [reportFileExists, setReportFileExists] = useState(false);
  const [comparisonFileExists, setComparisonFileExists] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isComparing, setIsComparing] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  // Check if files exist on mount only
  useEffect(() => {
    const checkFiles = async () => {
      setIsChecking(true);
      try {
        const reportExists = await checkReportExists("t-mobile.json");
        const comparisonExists = await checkReportExists("comparison_tmobile.json");
        setReportFileExists(reportExists);
        setComparisonFileExists(comparisonExists);
      } catch (error) {
        console.error("Error checking files:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkFiles();
  }, []); // Only check on mount

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    try {
      await analyzeService("t-mobile");
      // Verify the file was created before setting state
      const reportExists = await checkReportExists("t-mobile.json");
      if (reportExists) {
        setReportFileExists(true);
        toast({
          title: "Report Generated",
          description: "T-Mobile report has been generated successfully.",
        });
        navigate("/tmobile-report");
      } else {
        throw new Error("Report file was not created");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate report",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleCompareCompetitors = async () => {
    setIsComparing(true);
    try {
      await compareMetrics();
      // Verify the file was created before setting state
      const comparisonExists = await checkReportExists("comparison_tmobile.json");
      if (comparisonExists) {
        setComparisonFileExists(true);
        toast({
          title: "Comparison Complete",
          description: "Competitor comparison has been generated successfully.",
        });
        navigate("/comparison");
      } else {
        throw new Error("Comparison file was not created");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to compare competitors",
        variant: "destructive",
      });
    } finally {
      setIsComparing(false);
    }
  };

  const isLoading = isGeneratingReport || isComparing;
  const buttonText = reportFileExists ? "Compare Competitors" : "Generate Report";
  const ButtonIcon = reportFileExists ? Users : FileText;

  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <img 
                src="/tmobile-logo.png" 
                alt="T-Mobile Logo" 
                className="h-12 w-auto object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">T-Mobile Outage Monitor</h1>
                <p className="text-sm text-muted-foreground">Real-time service status tracking</p>
              </div>
            </div>
            <nav className="flex items-center gap-2">
              <Link to="/">
                <Button 
                  variant={location.pathname === "/" ? "default" : "ghost"}
                  size="sm"
                >
                  Dashboard
                </Button>
              </Link>
              {reportFileExists && (
                <Link to="/tmobile-report">
                  <Button 
                    variant={location.pathname === "/tmobile-report" ? "default" : "ghost"}
                    size="sm"
                  >
                    T-Mobile Report
                  </Button>
                </Link>
              )}
              {reportFileExists && comparisonFileExists && (
                <Link to="/comparison">
                  <Button 
                    variant={location.pathname === "/comparison" ? "default" : "ghost"}
                    size="sm"
                  >
                    Comparison
                  </Button>
                </Link>
              )}
            </nav>
          </div>
          <Button 
            size="lg" 
            className="gap-2 text-base font-semibold"
            onClick={reportFileExists ? handleCompareCompetitors : handleGenerateReport}
            disabled={isLoading || isChecking}
          >
            {isLoading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <ButtonIcon className="h-5 w-5" />
            )}
            {isLoading ? (isGeneratingReport ? "Generating..." : "Comparing...") : buttonText}
          </Button>
        </div>
      </div>
    </header>
  );
};
