import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageSquare, MapPin } from "lucide-react";

interface IssueReport {
  user: string;
  text: string;
  time_iso: string;
  location?: string;
}

interface IssueReportsProps {
  reports: IssueReport[];
}

const formatTimeAgo = (isoTime: string) => {
  const date = new Date(isoTime);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
};

export const IssueReports = ({ reports }: IssueReportsProps) => {
  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          User Reports
        </CardTitle>
        <p className="text-sm text-muted-foreground">Recent complaints and feedback</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-4">
            {reports.map((report, index) => (
              <div 
                key={`${report.user}-${index}`}
                className="p-4 rounded-lg border border-border hover:border-primary/50 transition-colors bg-card/50"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="font-medium text-foreground text-sm">{report.user}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeAgo(report.time_iso)}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-2">
                  {report.text}
                </p>
                {report.location && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{report.location}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

