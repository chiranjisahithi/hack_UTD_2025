import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "warning" | "destructive" | "success";
}

export const MetricCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  variant = "default" 
}: MetricCardProps) => {
  const variantStyles = {
    default: "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    destructive: "bg-destructive/10 text-destructive",
    success: "bg-success/10 text-success",
  };

  return (
    <Card className="p-6 hover:shadow-lg transition-all duration-300 border-border/50">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
          <p className="text-3xl font-bold text-foreground mb-2">{value}</p>
          {trend && (
            <p className="text-xs text-muted-foreground">{trend.label}</p>
          )}
        </div>
        <div className={cn("p-3 rounded-lg", variantStyles[variant])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
};
