"use client"
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "../src/components/ui/card";
import { Button } from "../src/components/ui/button";
import { ActivityForm } from "../src/components/activity-form";

import { Car, Zap, Utensils, Trash2 } from "lucide-react";
import { useToast } from "../src/hooks/use-toast";
import { apiRequest } from "../src/lib/queryClient";

const activityTypes = [
  {
    id: "transport",
    name: "Transport",
    icon: Car,
    color: "primary",
  },
  {
    id: "energy", 
    name: "Energy",
    icon: Zap,
    color: "accent",
  },
  {
    id: "food",
    name: "Food",
    icon: Utensils,
    color: "chart-2",
  },
  {
    id: "waste",
    name: "Waste",
    icon: Trash2,
    color: "chart-3",
  },
];

export default function ActivityLogging() {
  const [selectedType, setSelectedType] = useState<string>("transport");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createActivityMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/activities", data);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Activity logged successfully!",
      });
      // Invalidate and refetch dashboard data
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to log activity",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: any) => {
    createActivityMutation.mutate({
      ...data,
      category: selectedType,
    });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Log New Activity</h1>
            <p className="text-muted-foreground">Track your carbon footprint by logging daily activities</p>
          </div>

          {/* Activity Type Selection */}
          <Card className="mb-6" data-testid="card-activity-types">
            <CardHeader>
              <CardTitle>Select Activity Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {activityTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedType === type.id;
                  
                  return (
                    <Button
                      key={type.id}
                      variant="outline"
                      onClick={() => setSelectedType(type.id)}
                      className={`p-4 h-auto flex-col gap-3 ${
                        isSelected 
                          ? "border-primary bg-primary/5 text-primary" 
                          : "hover:bg-muted"
                      }`}
                      data-testid={`button-activity-type-${type.id}`}
                    >
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isSelected 
                          ? "bg-primary text-primary-foreground"
                          : `bg-${type.color}/10`
                      }`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-sm font-medium">{type.name}</span>
                    </Button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Activity Form */}
          <Card data-testid="card-activity-form">
            <CardHeader>
              <CardTitle>
                {activityTypes.find(t => t.id === selectedType)?.name} Activity Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityForm
                activityType={selectedType}
                onSubmit={handleSubmit}
                isLoading={createActivityMutation.isPending}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
