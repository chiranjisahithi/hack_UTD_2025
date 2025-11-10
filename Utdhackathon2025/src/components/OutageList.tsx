import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface OutageReport {
  city: string;
  reason: string;
  time_human: string;
  time_iso: string;
}

interface OutageListProps {
  reports: OutageReport[];
}

const getProblemVariant = (reason: string) => {
  const lowerReason = reason.toLowerCase();
  if (lowerReason.includes("blackout")) return "destructive";
  if (lowerReason.includes("internet")) return "warning";
  return "secondary";
};

export const OutageList = ({ reports }: OutageListProps) => {
  return (
    <Card className="p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-foreground mb-1">Recent Reports</h3>
        <p className="text-sm text-muted-foreground">Latest outage notifications</p>
      </div>
      
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-3">
          {reports.map((report, index) => (
            <div 
              key={`${report.city}-${index}`}
              className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors bg-card/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span className="font-medium text-foreground">{report.city}</span>
                </div>
                <Badge variant={getProblemVariant(report.reason)}>
                  {report.reason}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{report.time_human}</span>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
