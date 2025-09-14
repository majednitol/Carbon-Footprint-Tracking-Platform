import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent } from "./ui/card";
import { Calculator } from "lucide-react";
import { Button } from "./ui/button";

const activityFormSchema = z.object({
  type: z.string().min(1, "Activity type is required"),
  quantity: z.number().positive("Quantity must be positive"),
  unit: z.string().min(1, "Unit is required"),
  description: z.string().optional(),
  activityDate: z.string().min(1, "Date is required"),
});

type ActivityFormData = z.infer<typeof activityFormSchema>;

interface ActivityFormProps {
  activityType: string;
  onSubmit: (data: ActivityFormData) => void;
  isLoading: boolean;
}

const activityOptions = {
  transport: {
    types: [
      { value: "car_gasoline", label: "Car - Gasoline", unit: "km", factor: 0.21 },
      { value: "car_electric", label: "Car - Electric", unit: "km", factor: 0.05 },
      { value: "flight_domestic", label: "Flight - Domestic", unit: "km", factor: 0.25 },
      { value: "flight_international", label: "Flight - International", unit: "km", factor: 0.3 },
      { value: "train", label: "Train", unit: "km", factor: 0.04 },
      { value: "bus", label: "Bus", unit: "km", factor: 0.08 },
      { value: "motorcycle", label: "Motorcycle", unit: "km", factor: 0.15 },
    ],
  },
  energy: {
    types: [
      { value: "electricity", label: "Electricity", unit: "kWh", factor: 0.5 },
      { value: "natural_gas", label: "Natural Gas", unit: "kWh", factor: 0.2 },
      { value: "heating_oil", label: "Heating Oil", unit: "L", factor: 0.3 },
    ],
  },
  food: {
    types: [
      { value: "beef", label: "Beef", unit: "kg", factor: 27 },
      { value: "pork", label: "Pork", unit: "kg", factor: 12 },
      { value: "chicken", label: "Chicken", unit: "kg", factor: 6 },
      { value: "fish", label: "Fish", unit: "kg", factor: 6 },
      { value: "dairy", label: "Dairy Products", unit: "kg", factor: 3.2 },
      { value: "vegetables", label: "Vegetables", unit: "kg", factor: 2 },
      { value: "grains", label: "Grains/Cereals", unit: "kg", factor: 1.4 },
    ],
  },
  waste: {
    types: [
      { value: "general", label: "General Waste", unit: "kg", factor: 0.5 },
      { value: "recycled", label: "Recycled Waste", unit: "kg", factor: 0.1 },
      { value: "organic", label: "Organic Waste", unit: "kg", factor: 0.3 },
    ],
  },
};

export function ActivityForm({ activityType, onSubmit, isLoading }: ActivityFormProps) {
  const [selectedType, setSelectedType] = useState<string>("");
  const [estimatedEmission, setEstimatedEmission] = useState<number>(0);
  
  const options = activityOptions[activityType as keyof typeof activityOptions]?.types || [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ActivityFormData>({
    resolver: zodResolver(activityFormSchema),
    defaultValues: {
      activityDate: new Date().toISOString().slice(0, 16), // Current datetime
    },
  });

  const quantity = watch("quantity");

  // Calculate estimated emission when type or quantity changes
  useEffect(() => {
    if (selectedType && quantity) {
      const typeOption = options.find(opt => opt.value === selectedType);
      if (typeOption) {
        setEstimatedEmission(quantity * typeOption.factor);
      }
    }
  }, [selectedType, quantity, options]);

  const handleTypeChange = (value: string) => {
    setSelectedType(value);
    setValue("type", value);
    
    const typeOption = options.find(opt => opt.value === value);
    if (typeOption) {
      setValue("unit", typeOption.unit);
    }
  };

  const handleFormSubmit = (data: ActivityFormData) => {
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="type">Activity Type</Label>
          <Select onValueChange={handleTypeChange} data-testid="select-activity-type">
            <SelectTrigger>
              <SelectValue placeholder="Select activity type" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.type && (
            <p className="text-sm text-destructive mt-1">{errors.type.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="activityDate">Date & Time</Label>
          <Input
            id="activityDate"
            type="datetime-local"
            {...register("activityDate")}
            data-testid="input-activity-date"
          />
          {errors.activityDate && (
            <p className="text-sm text-destructive mt-1">{errors.activityDate.message}</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="quantity">
            Quantity ({options.find(opt => opt.value === selectedType)?.unit || "units"})
          </Label>
          <Input
            id="quantity"
            type="number"
            step="0.01"
            placeholder="Enter quantity"
            {...register("quantity", { valueAsNumber: true })}
            data-testid="input-quantity"
          />
          {errors.quantity && (
            <p className="text-sm text-destructive mt-1">{errors.quantity.message}</p>
          )}
        </div>
        
        <div>
          <Label htmlFor="unit">Unit</Label>
          <Input
            id="unit"
            {...register("unit")}
            readOnly
            className="bg-muted"
            placeholder="Select type first"
            data-testid="input-unit"
          />
        </div>
      </div>
      
      <div>
        <Label htmlFor="description">Description (Optional)</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Add details about this activity..."
          {...register("description")}
          data-testid="input-description"
        />
      </div>
      
      {/* Carbon Impact Preview */}
      {estimatedEmission > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Calculator className="text-primary h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">Estimated Carbon Impact</h4>
                  <p className="text-xs text-muted-foreground">Based on your inputs</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-lg font-bold text-primary" data-testid="text-estimated-emission">
                  {estimatedEmission.toFixed(1)} kg
                </span>
                <p className="text-xs text-muted-foreground">CO₂ equivalent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex gap-4 pt-4">
        <Button 
          type="submit" 
          disabled={isLoading}
          data-testid="button-submit-activity"
        >
          {isLoading ? "Logging..." : "Log Activity"}
        </Button>
        <Button type="button" variant="outline" data-testid="button-cancel">
          Cancel
        </Button>
      </div>
    </form>
  );
}
