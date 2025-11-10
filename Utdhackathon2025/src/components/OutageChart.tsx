import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface OutageChartProps {
  chart?: {
    image_src?: string;
    alt_time?: string;
  };
}

export const OutageChart = ({ chart }: OutageChartProps) => {
  if (!chart?.image_src) {
    return (
      <Card className="animate-fade-in">
        <CardHeader>
          <CardTitle>Last 24 Hours - Outage Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="w-full flex items-center justify-center bg-secondary/20 rounded-lg p-4">
            <p className="text-muted-foreground">Chart data not available</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle>Last 24 Hours - Outage Reports</CardTitle>
        {chart.alt_time && (
          <p className="text-sm text-muted-foreground">Updated: {chart.alt_time}</p>
        )}
      </CardHeader>
      <CardContent>
        <div className="w-full flex items-center justify-center bg-secondary/20 rounded-lg p-4">
          <img 
            src={chart.image_src} 
            alt={`Outage chart for the last 24 hours${chart.alt_time ? `, updated at ${chart.alt_time}` : ''}`}
            className="w-full h-auto max-w-full"
            style={{ 
              maxHeight: '300px',
              filter: 'brightness(0.9) saturate(1.2) hue-rotate(-10deg)'
            }}
          />
        </div>
      </CardContent>
    </Card>
  );
};

