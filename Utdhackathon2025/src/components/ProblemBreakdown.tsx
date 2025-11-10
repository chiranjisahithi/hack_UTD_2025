import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Problem {
  label: string;
  percent: number;
}

interface ProblemBreakdownProps {
  problems: Problem[];
}

const COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--muted))",
];

export const ProblemBreakdown = ({ problems }: ProblemBreakdownProps) => {
  return (
    <Card className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-foreground mb-1">Problem Distribution</h3>
        <p className="text-sm text-muted-foreground">Most reported issues</p>
      </div>
      
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={problems} layout="vertical" margin={{ left: 20, right: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
          <YAxis 
            type="category" 
            dataKey="label" 
            stroke="hsl(var(--muted-foreground))"
            width={100}
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "var(--radius)",
            }}
            labelStyle={{ color: "hsl(var(--foreground))" }}
            itemStyle={{ color: "hsl(var(--foreground))" }}
          />
          <Bar dataKey="percent" radius={[0, 8, 8, 0]}>
            {problems.map((_, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
        {problems.map((problem, index) => (
          <div key={problem.label} className="flex items-center gap-2">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: COLORS[index % COLORS.length] }}
            />
            <span className="text-sm text-muted-foreground">{problem.label}</span>
            <span className="text-sm font-semibold text-foreground ml-auto">{problem.percent}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
};
