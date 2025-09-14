"use client"
import { useQuery } from "@tanstack/react-query";
import type { Activity } from "../../../../server/shared/schema";

interface DashboardData {
    totalEmissions: number;
    transportEmissions: number;
    energyEmissions: number;
    foodEmissions: number;
    wasteEmissions: number;
    monthlyEmissions: { month: string; emissions: number }[];
}
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../src/components/ui/select";

import { EmissionsChart } from "../src/components/emissions-chart";
import { Car, Zap, Utensils, Trash2, Calendar } from "lucide-react";
import { Badge } from "../src/components/ui/badge";
import { apiRequest } from "../src/lib/queryClient";

export default function Analytics() {
    const { data: activities, isLoading } = useQuery<Activity[]>({
        queryKey: ["/api/activities"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/api/activities`);
            return res.json();
        },
    });

    const { data: dashboardData } = useQuery<DashboardData>({
        queryKey: ["/api/dashboard/stats"],
        queryFn: async () => {
            const res = await apiRequest("GET", `/api/dashboard/stats`);
            return res.json();
        },
    });

    const getActivityIcon = (category: string) => {
        switch (category) {
            case 'transport': return <Car className="h-4 w-4 text-primary" />;
            case 'energy': return <Zap className="h-4 w-4 text-accent" />;
            case 'food': return <Utensils className="h-4 w-4 text-chart-2" />;
            case 'waste': return <Trash2 className="h-4 w-4 text-chart-3" />;
            default: return null;
        }
    };

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'transport': return 'bg-primary/10 text-primary';
            case 'energy': return 'bg-accent/10 text-accent';
            case 'food': return 'bg-chart-2/10 text-chart-2';
            case 'waste': return 'bg-chart-3/10 text-chart-3';
            default: return 'bg-muted text-muted-foreground';
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Analytics</h1>
                        <p className="text-muted-foreground mt-1">Detailed analysis of your carbon emissions</p>
                    </div>
                    <Select defaultValue="last-30-days">
                        <SelectTrigger className="w-[180px]" data-testid="select-analytics-period">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="last-30-days">Last 30 days</SelectItem>
                            <SelectItem value="last-90-days">Last 90 days</SelectItem>
                            <SelectItem value="last-year">Last year</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Emissions Breakdown */}
                    {dashboardData && (
                        <EmissionsChart
                            data={{
                                transport: dashboardData.transportEmissions || 0,
                                energy: dashboardData.energyEmissions || 0,
                                food: dashboardData.foodEmissions || 0,
                                waste: dashboardData.wasteEmissions || 0,
                            }}
                            total={dashboardData.totalEmissions || 0}
                        />
                    )}

                    {/* Monthly Trend */}
                    <Card data-testid="card-monthly-trend">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Monthly Trend</CardTitle>
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Calendar className="h-4 w-4" />
                                    This Year
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-end justify-between gap-2">
                                {dashboardData?.monthlyEmissions && dashboardData.monthlyEmissions.length > 0 ? (
                                    dashboardData.monthlyEmissions.map((item, index) => {
                                        const maxEmissions = Math.max(...dashboardData.monthlyEmissions.map(m => m.emissions), 1);
                                        return (
                                            <div key={index} className="flex flex-col items-center gap-2">
                                                <div
                                                    className="w-8 bg-primary rounded-t"
                                                    style={{
                                                        height: `${Math.max(20, (item.emissions / maxEmissions) * 200)}px`
                                                    }}
                                                ></div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(item.month + '-01').toLocaleDateString('en', { month: 'short' })}
                                                </span>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="w-full flex items-center justify-center h-64 text-muted-foreground">
                                        No monthly data available
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Activity History */}
                <Card data-testid="card-activity-history">
                    <CardHeader>
                        <CardTitle>Activity History</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {activities && activities.length > 0 ? (
                                activities.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                                        data-testid={`activity-item-${index}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center">
                                                {getActivityIcon(activity.category)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <p className="font-medium text-foreground">
                                                        {activity.description || `${activity.category} activity`}
                                                    </p>
                                                    <Badge variant="outline" className={getCategoryBadgeColor(activity.category)}>
                                                        {activity.category}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground">
                                                    {activity.quantity} {activity.unit} •
                                                    {activity.activityDate
                                                        ? new Date(activity.activityDate).toLocaleDateString()
                                                        : 'No date'
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold text-foreground">
                                                {parseFloat(activity.carbonEmission || '0').toFixed(1)} kg
                                            </p>
                                            <p className="text-sm text-muted-foreground">CO₂</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-12 text-muted-foreground">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-medium mb-2">No activities logged yet</h3>
                                    <p className="text-sm">Start logging activities to see your analytics</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
