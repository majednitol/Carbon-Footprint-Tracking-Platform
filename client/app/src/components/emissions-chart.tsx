import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

interface EmissionsChartProps {
  data: {
    transport: number;
    energy: number;
    food: number;
    waste: number;
  };
  total: number;
}

export function EmissionsChart({ data, total }: EmissionsChartProps) {
  const categories = [
    { key: 'transport', label: 'Transport', color: 'hsl(var(--primary))', value: data.transport },
    { key: 'energy', label: 'Energy', color: 'hsl(var(--accent))', value: data.energy },
    { key: 'food', label: 'Food', color: 'hsl(var(--chart-2))', value: data.food },
    { key: 'waste', label: 'Waste', color: 'hsl(var(--chart-3))', value: data.waste },
  ];

  // Calculate percentages
  const categoriesWithPercentages = categories.map(cat => ({
    ...cat,
    percentage: total > 0 ? (cat.value / total) * 100 : 0,
  }));

  // Calculate stroke dash arrays for donut chart
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  
  let cumulativePercentage = 0;

  return (
    <Card data-testid="card-emissions-breakdown">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Emissions by Category</CardTitle>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground">Current Month</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Donut Chart */}
        <div className="flex items-center justify-center mb-6">
          <div className="relative w-48 h-48">
            <svg className="w-48 h-48" style={{ transform: 'rotate(-90deg)' }}>
              {categoriesWithPercentages.map((category, index) => {
                const strokeDasharray = `${(category.percentage / 100) * circumference} ${circumference}`;
                const strokeDashoffset = -cumulativePercentage / 100 * circumference;
                cumulativePercentage += category.percentage;
                
                return (
                  <circle
                    key={category.key}
                    cx="96"
                    cy="96"
                    r={radius}
                    fill="none"
                    stroke={category.color}
                    strokeWidth="20"
                    strokeDasharray={strokeDasharray}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-all duration-300"
                  />
                );
              })}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className="text-2xl font-bold text-foreground">{total.toFixed(0)}</span>
                <p className="text-sm text-muted-foreground">kg CO₂</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Legend */}
        <div className="space-y-3">
          {categoriesWithPercentages.map((category) => (
            <div key={category.key} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: category.color }}
                ></div>
                <span className="text-sm text-foreground">{category.label}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-foreground">
                  {category.value.toFixed(0)} kg
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  {category.percentage.toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
