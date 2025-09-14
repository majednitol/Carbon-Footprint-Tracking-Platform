"use client"
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Activity } from "../../../../server/shared/schema";

interface DashboardData {
  totalEmissions: number;
  transportEmissions: number;
  energyEmissions: number;
  foodEmissions: number;
  wasteEmissions: number;
  totalOffsets: number;
  monthlyEmissions: { month: string; emissions: number }[];
  recentActivities: Activity[];
}
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../src/components/ui/select";
import { Badge } from "../src/components/ui/badge";
import { MetricCard } from "../src/components/metric-card";
import { EmissionsChart } from "../src/components/emissions-chart";

import { Link } from "wouter";
import {
  Car,
  Zap,
  Utensils,
  Trash2,
  Plus,
  Calendar,
  TrendingDown,
  Lightbulb,
  Leaf,
  Recycle,
  Bot,
} from "lucide-react";
import { useToast } from "../src/hooks/use-toast";
import { useAuth } from "../src/hooks/useAuth";
import { isUnauthorizedError } from "../src/lib/authUtils";
import { apiRequest } from "../src/lib/queryClient";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  const { data: dashboardData, isLoading: isDashboardLoading, error } = useQuery<DashboardData>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated && !isLoading,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/dashboard/stats`);
      return res.json();
    },
  });

  // Handle unauthorized errors
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        // window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  // Handle query errors
  useEffect(() => {
    if (error && isUnauthorizedError(error as Error)) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        // window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [error, toast]);

  if (isLoading || isDashboardLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const data = dashboardData || {
    totalEmissions: 0,
    transportEmissions: 0,
    energyEmissions: 0,
    foodEmissions: 0,
    wasteEmissions: 0,
    totalOffsets: 0,
    monthlyEmissions: [],
    recentActivities: [],
  };

  const getActivityIcon = (category: string) => {
    switch (category) {
      case 'transport': return <Car className="h-4 w-4" />;
      case 'energy': return <Zap className="h-4 w-4" />;
      case 'food': return <Utensils className="h-4 w-4" />;
      case 'waste': return <Trash2 className="h-4 w-4" />;
      default: return <Leaf className="h-4 w-4" />;
    }
  };

  const formatEmission = (value: number) => {
    return value.toLocaleString(undefined, { maximumFractionDigits: 1 });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Carbon Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track and manage your organization's carbon footprint</p>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="last-30-days">
              <SelectTrigger className="w-[180px]" data-testid="select-time-period">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-30-days">Last 30 days</SelectItem>
                <SelectItem value="last-90-days">Last 90 days</SelectItem>
                <SelectItem value="last-year">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button asChild data-testid="button-log-activity">
              <Link href="/activity">
                <Plus className="h-4 w-4 mr-2" />
                Log Activity
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Total CO₂ This Month"
            value={`${formatEmission(data.totalEmissions)} kg`}
            icon={<Leaf className="text-primary" />}
            trend="+12%"
            trendColor="destructive"
            testId="metric-total-emissions"
          />
          <MetricCard
            title="Transport Emissions"
            value={`${formatEmission(data.transportEmissions)} kg`}
            icon={<Car className="text-chart-2" />}
            trend="-8%"
            trendColor="success"
            testId="metric-transport-emissions"
          />
          <MetricCard
            title="Energy Usage Emissions"
            value={`${formatEmission(data.energyEmissions)} kg`}
            icon={<Zap className="text-accent" />}
            trend="+5%"
            trendColor="warning"
            testId="metric-energy-emissions"
          />
          <MetricCard
            title="Carbon Offsets"
            value={`${formatEmission(data.totalOffsets)} kg`}
            icon={<Leaf className="text-chart-3" />}
            trend="+15%"
            trendColor="success"
            testId="metric-carbon-offsets"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Emissions Breakdown Chart */}
          <EmissionsChart
            data={{
              transport: data.transportEmissions,
              energy: data.energyEmissions,
              food: data.foodEmissions,
              waste: data.wasteEmissions,
            }}
            total={data.totalEmissions}
          />

          {/* Emissions Trend */}
          <Card data-testid="card-emissions-trend">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Emissions Trend</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  Last 6 months
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Mock Line Chart - Replace with actual chart library */}
              <div className="h-64 flex items-end justify-between gap-2">
                {data.monthlyEmissions.length > 0 ? (
                  data.monthlyEmissions.map((item, index) => (
                    <div key={index} className="flex flex-col items-center gap-2">
                      <div
                        className="w-8 bg-primary rounded-t"
                        style={{
                          height: `${Math.max(20, (item.emissions / Math.max(...data.monthlyEmissions.map(m => m.emissions), 1)) * 200)}px`
                        }}
                      ></div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(item.month + '-01').toLocaleDateString('en', { month: 'short' })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="w-full flex items-center justify-center h-64 text-muted-foreground">
                    No emission data available
                  </div>
                )}
              </div>

              <div className="mt-6 p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-chart-2 rounded-lg flex items-center justify-center">
                    <TrendingDown className="text-white text-sm" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">Track your progress!</p>
                    <p className="text-xs text-muted-foreground">Monitor emissions over time</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities & AI Recommendations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Activities */}
          <Card data-testid="card-recent-activities">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Recent Activities</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/analytics">View All</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recentActivities.length > 0 ? (
                  data.recentActivities.map((activity: any, index: number) => (
                    <div key={index} className="flex items-center gap-4 p-3 hover:bg-muted rounded-lg transition-colors">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        {getActivityIcon(activity.category)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          {activity.description || `${activity.category} activity`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.category} • {formatEmission(parseFloat(activity.carbonEmission || '0'))} kg CO₂ •
                          {activity.activityDate ? new Date(activity.activityDate).toLocaleDateString() : 'Recently'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Plus className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>No activities logged yet</p>
                    <Button variant="outline" size="sm" className="mt-2" asChild>
                      <Link href="/activity">Log your first activity</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* AI Recommendations */}
          <Card data-testid="card-ai-recommendations">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle>AI Recommendations</CardTitle>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <Bot className="h-3 w-3 mr-1" />
                    AI
                  </Badge>
                </div>
                <Button variant="ghost" size="sm">
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary/5 to-chart-2/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
                      <Lightbulb className="text-primary-foreground text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Optimize Transportation</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Consider carpooling or public transport to reduce emissions by up to 45%
                      </p>
                      <Badge variant="secondary" className="text-xs">High Impact</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-accent/5 to-accent/10 rounded-lg border border-accent/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
                      <Leaf className="text-accent-foreground text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Energy Efficiency</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Switch to LED lighting and smart thermostats to cut energy use by 30%
                      </p>
                      <Badge variant="secondary" className="text-xs">Medium Impact</Badge>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-gradient-to-r from-chart-3/5 to-chart-3/10 rounded-lg border border-chart-3/20">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-chart-3 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Recycle className="text-white text-sm" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground mb-1">Waste Reduction</h4>
                      <p className="text-xs text-muted-foreground mb-2">
                        Implement comprehensive recycling to reduce waste emissions by 25%
                      </p>
                      <Badge variant="secondary" className="text-xs">Long-term Impact</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
