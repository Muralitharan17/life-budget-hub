import { useState } from "react";
import {
  Eye,
  EyeOff,
  Save,
  Calculator,
  DollarSign,
  Percent,
  PiggyBank,
  ShoppingCart,
  Home,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface SalaryConfigProps {
  onSalaryUpdate: (salary: number, budgetPercentage: number) => void;
  currentSalary?: number;
  currentBudgetPercentage?: number;
}

interface BudgetAllocation {
  need: number;
  want: number;
  savings: number;
  investments: number;
}

const SalaryConfig = ({
  onSalaryUpdate,
  currentSalary = 0,
  currentBudgetPercentage = 70,
}: SalaryConfigProps) => {
  const [actualSalary, setActualSalary] = useState(currentSalary);
  const [budgetPercentage, setBudgetPercentage] = useState(
    currentBudgetPercentage,
  );
  const [showSalary, setShowSalary] = useState(false);

  // Budget allocation percentages (default 50/30/20 rule modified)
  const [budgetAllocation, setBudgetAllocation] = useState<BudgetAllocation>({
    need: 50, // Essential expenses
    want: 30, // Discretionary spending
    savings: 15, // Emergency fund, short-term savings
    investments: 5, // Long-term investments
  });

  const { toast } = useToast();

  const handleAllocationChange = (
    category: keyof BudgetAllocation,
    value: number,
  ) => {
    setBudgetAllocation((prev) => ({
      ...prev,
      [category]: value,
    }));
  };

  const getTotalAllocationPercentage = () => {
    return (
      budgetAllocation.need +
      budgetAllocation.want +
      budgetAllocation.savings +
      budgetAllocation.investments
    );
  };

  const handleSaveConfiguration = () => {
    if (actualSalary <= 0) {
      toast({
        title: "Invalid Salary",
        description: "Please enter a valid salary amount.",
        variant: "destructive",
      });
      return;
    }

    if (budgetPercentage <= 0 || budgetPercentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Budget percentage must be between 1% and 100%.",
        variant: "destructive",
      });
      return;
    }

    const totalAllocation = getTotalAllocationPercentage();
    if (totalAllocation !== 100) {
      toast({
        title: "Invalid Budget Allocation",
        description: `Budget allocation must total 100%. Current total: ${totalAllocation}%`,
        variant: "destructive",
      });
      return;
    }

    onSalaryUpdate(actualSalary, budgetPercentage);

    // Save budget allocation to localStorage
    localStorage.setItem("budgetAllocation", JSON.stringify(budgetAllocation));

    toast({
      title: "Configuration Saved",
      description: `Salary: ₹${actualSalary.toLocaleString()}, Budget: ${budgetPercentage}% with allocation breakdown saved.`,
      variant: "default",
    });
  };

  const calculatedBudget = Math.round((actualSalary * budgetPercentage) / 100);

  const getAllocatedAmounts = () => {
    return {
      need: Math.round((calculatedBudget * budgetAllocation.need) / 100),
      want: Math.round((calculatedBudget * budgetAllocation.want) / 100),
      savings: Math.round((calculatedBudget * budgetAllocation.savings) / 100),
      investments: Math.round(
        (calculatedBudget * budgetAllocation.investments) / 100,
      ),
    };
  };

  const allocatedAmounts = getAllocatedAmounts();
  const totalAllocationPercentage = getTotalAllocationPercentage();
  const isAllocationValid = totalAllocationPercentage === 100;

  // Preset allocation templates
  const allocationPresets = {
    "50/30/20 Rule": { need: 50, want: 30, savings: 15, investments: 5 },
    Conservative: { need: 60, want: 20, savings: 15, investments: 5 },
    "Aggressive Saver": { need: 40, want: 20, savings: 25, investments: 15 },
    "Investor Focus": { need: 45, want: 25, savings: 10, investments: 20 },
  };

  return (
    <div className="space-y-6">
      {/* Salary Configuration */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <DollarSign className="h-6 w-6" />
            Salary Configuration
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure your actual salary and budget allocation percentage
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Actual Salary Input */}
          <div className="space-y-2">
            <Label htmlFor="salary">Monthly Salary</Label>
            <div className="relative">
              <Input
                id="salary"
                type={showSalary ? "number" : "password"}
                value={actualSalary || ""}
                onChange={(e) => setActualSalary(Number(e.target.value))}
                placeholder="Enter your monthly salary"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSalary(!showSalary)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showSalary ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            {showSalary && actualSalary > 0 && (
              <p className="text-sm text-muted-foreground">
                Annual Salary: ₹{(actualSalary * 12).toLocaleString()}
              </p>
            )}
          </div>

          {/* Budget Percentage */}
          <div className="space-y-2">
            <Label htmlFor="percentage">Budget Allocation Percentage</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="percentage"
                type="number"
                min="1"
                max="100"
                value={budgetPercentage}
                onChange={(e) => setBudgetPercentage(Number(e.target.value))}
                placeholder="70"
                className="flex-1"
              />
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of salary to allocate for monthly budget
            </p>
          </div>

          {/* Quick Percentage Presets */}
          <div className="space-y-2">
            <Label>Quick Percentage Presets</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[50, 60, 70, 80].map((preset) => (
                <Button
                  key={preset}
                  variant="outline"
                  size="sm"
                  onClick={() => setBudgetPercentage(preset)}
                  className={
                    budgetPercentage === preset
                      ? "bg-primary text-primary-foreground"
                      : ""
                  }
                >
                  {preset}%
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Budget Allocation Configuration */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-secondary">
            <Calculator className="h-6 w-6" />
            Budget Allocation Breakdown
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Allocate your budget across different categories (must total 100%)
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Allocation Presets */}
          <div className="space-y-2">
            <Label>Allocation Templates</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {Object.entries(allocationPresets).map(([name, preset]) => (
                <Button
                  key={name}
                  variant="outline"
                  size="sm"
                  onClick={() => setBudgetAllocation(preset)}
                  className="text-xs"
                >
                  {name}
                </Button>
              ))}
            </div>
          </div>

          {/* Individual Allocation Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Need */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Home className="h-4 w-4 text-destructive" />
                Need (Essential)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={budgetAllocation.need}
                  onChange={(e) =>
                    handleAllocationChange("need", Number(e.target.value))
                  }
                  className="flex-1"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Rent, utilities, groceries, insurance
              </p>
            </div>

            {/* Want */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ShoppingCart className="h-4 w-4 text-warning" />
                Want (Discretionary)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={budgetAllocation.want}
                  onChange={(e) =>
                    handleAllocationChange("want", Number(e.target.value))
                  }
                  className="flex-1"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Entertainment, dining out, hobbies
              </p>
            </div>

            {/* Savings */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <PiggyBank className="h-4 w-4 text-success" />
                Savings (Emergency)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={budgetAllocation.savings}
                  onChange={(e) =>
                    handleAllocationChange("savings", Number(e.target.value))
                  }
                  className="flex-1"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Emergency fund, short-term goals
              </p>
            </div>

            {/* Investments */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Investments (Long-term)
              </Label>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={budgetAllocation.investments}
                  onChange={(e) =>
                    handleAllocationChange(
                      "investments",
                      Number(e.target.value),
                    )
                  }
                  className="flex-1"
                />
                <Percent className="h-4 w-4 text-muted-foreground" />
              </div>
              <p className="text-xs text-muted-foreground">
                Stocks, mutual funds, retirement
              </p>
            </div>
          </div>

          {/* Total Allocation Indicator */}
          <div
            className={`p-3 rounded-lg border ${
              isAllocationValid
                ? "bg-success/10 border-success/30 text-success-foreground"
                : "bg-destructive/10 border-destructive/30 text-destructive-foreground"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">Total Allocation:</span>
              <span className="font-bold text-lg">
                {totalAllocationPercentage}%
              </span>
            </div>
            {!isAllocationValid && (
              <p className="text-sm mt-1">
                {totalAllocationPercentage > 100
                  ? `Reduce by ${totalAllocationPercentage - 100}%`
                  : `Add ${100 - totalAllocationPercentage}% more`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Budget Calculation Preview */}
      {actualSalary > 0 && budgetPercentage > 0 && (
        <Card className="bg-gradient-to-r from-primary/5 to-success/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-primary">
                Complete Budget Breakdown
              </h3>
            </div>

            {/* Main Budget Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Monthly Salary</p>
                <p className="text-lg font-bold text-foreground">
                  ₹{actualSalary.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  Budget Allocation
                </p>
                <p className="text-lg font-bold text-primary">
                  {budgetPercentage}%
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total Budget</p>
                <p className="text-lg font-bold text-success">
                  ₹{calculatedBudget.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Detailed Allocation Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                <div className="flex items-center gap-2 mb-2">
                  <Home className="h-4 w-4 text-destructive" />
                  <span className="font-medium text-destructive">Need</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {budgetAllocation.need}%
                </p>
                <p className="text-lg font-bold">
                  ₹{allocatedAmounts.need.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-warning/10 rounded-lg border border-warning/20">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingCart className="h-4 w-4 text-warning" />
                  <span className="font-medium text-warning">Want</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {budgetAllocation.want}%
                </p>
                <p className="text-lg font-bold">
                  ₹{allocatedAmounts.want.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-success/10 rounded-lg border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <PiggyBank className="h-4 w-4 text-success" />
                  <span className="font-medium text-success">Savings</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {budgetAllocation.savings}%
                </p>
                <p className="text-lg font-bold">
                  ₹{allocatedAmounts.savings.toLocaleString()}
                </p>
              </div>

              <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">Investments</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {budgetAllocation.investments}%
                </p>
                <p className="text-lg font-bold">
                  ₹{allocatedAmounts.investments.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Remaining Amount */}
            <div className="p-3 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Remaining Amount:</strong> ₹
                {(actualSalary - calculatedBudget).toLocaleString()}(
                {100 - budgetPercentage}% - for emergency funds, extra savings,
                etc.)
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Save Button */}
      <Button
        onClick={handleSaveConfiguration}
        className="w-full"
        variant="success"
        size="lg"
        disabled={!isAllocationValid}
      >
        <Save className="h-4 w-4 mr-2" />
        Save Complete Configuration
      </Button>
    </div>
  );
};

export default SalaryConfig;
