import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";

interface MetricCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: string;
  trendColor?: "success" | "warning" | "destructive";
  testId?: string;
}

export function MetricCard({ title, value, icon, trend, trendColor, testId }: MetricCardProps) {
  const getTrendColor = (color?: string) => {
    switch (color) {
      case "success": return "bg-chart-2/10 text-chart-2";
      case "warning": return "bg-accent/10 text-accent";
      case "destructive": return "bg-destructive/10 text-destructive";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card data-testid={testId}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            {icon}
          </div>
          {trend && (
            <Badge variant="outline" className={getTrendColor(trendColor)}>
              {trend}
            </Badge>
          )}
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{title}</p>
      </CardContent>
    </Card>
  );
}
