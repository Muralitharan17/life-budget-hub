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
  onSalaryUpdate: (
    salary: number,
    budgetPercentage: number,
    allocation: BudgetAllocation,
  ) => void;
  currentSalary?: number;
  currentBudgetPercentage?: number;
  currentBudgetAllocation?: BudgetAllocation;
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
  currentBudgetPercentage = 0,
  currentBudgetAllocation,
}: SalaryConfigProps) => {
  const [actualSalary, setActualSalary] = useState(currentSalary);
  const [budgetPercentage, setBudgetPercentage] = useState(
    currentBudgetPercentage,
  );
  const [showSalary, setShowSalary] = useState(false);

  // Budget allocation percentages - use current or zero defaults
  const [budgetAllocation, setBudgetAllocation] = useState<BudgetAllocation>(
    currentBudgetAllocation || {
      need: 0, // Essential expenses
      want: 0, // Discretionary spending
      savings: 0, // Emergency fund, short-term savings
      investments: 0, // Long-term investments
    },
  );

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

    console.log('Saving salary configuration:', { actualSalary, budgetPercentage, budgetAllocation });
    
    try {
      onSalaryUpdate(actualSalary, budgetPercentage, budgetAllocation);
      
      toast({
        title: "Configuration Saved",
        description: `Complete budget configuration saved successfully.`,
        variant: "default",
      });
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast({
        title: "Save Failed",
        description: "Failed to save configuration. Please try again.",
        variant: "destructive",
      });
    }
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

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Calculator className="h-6 w-6" />
          Complete Budget Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your salary, budget percentage, and allocation breakdown
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Salary and Budget Percentage Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Actual Salary Input */}
          <div className="space-y-2">
            <Label htmlFor="salary">Monthly Salary</Label>
            <div className="relative">
              <Input
                id="salary"
                type={showSalary ? "number" : "password"}
                value={actualSalary === 0 ? "" : actualSalary}
                onChange={(e) =>
                  setActualSalary(
                    e.target.value === "" ? 0 : Number(e.target.value),
                  )
                }
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
                value={budgetPercentage === 0 ? "" : budgetPercentage}
                onChange={(e) =>
                  setBudgetPercentage(
                    e.target.value === "" ? 0 : Number(e.target.value),
                  )
                }
                placeholder="70"
                className="flex-1"
              />
              <Percent className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground">
              Percentage of salary to allocate for monthly budget
            </p>
          </div>
        </div>

        {/* Budget Allocation Section */}
        <div className="space-y-6">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              Budget Allocation Breakdown
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Allocate your budget across different categories (must total 100%)
            </p>
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
                  value={
                    budgetAllocation.need === 0 ? "" : budgetAllocation.need
                  }
                  onChange={(e) =>
                    handleAllocationChange(
                      "need",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="flex-1"
                  placeholder="0"
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
                  value={
                    budgetAllocation.want === 0 ? "" : budgetAllocation.want
                  }
                  onChange={(e) =>
                    handleAllocationChange(
                      "want",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="flex-1"
                  placeholder="0"
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
                  value={
                    budgetAllocation.savings === 0
                      ? ""
                      : budgetAllocation.savings
                  }
                  onChange={(e) =>
                    handleAllocationChange(
                      "savings",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="flex-1"
                  placeholder="0"
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
                  value={
                    budgetAllocation.investments === 0
                      ? ""
                      : budgetAllocation.investments
                  }
                  onChange={(e) =>
                    handleAllocationChange(
                      "investments",
                      e.target.value === "" ? 0 : Number(e.target.value),
                    )
                  }
                  className="flex-1"
                  placeholder="0"
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
            className={`p-4 rounded-lg border-2 ${
              isAllocationValid
                ? "bg-success/20 border-success/50"
                : "bg-warning/20 border-warning/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <span
                className={`font-semibold text-lg ${
                  isAllocationValid
                    ? "text-success"
                    : "text-orange-700 dark:text-orange-400"
                }`}
              >
                Total Allocation:
              </span>
              <span
                className={`font-bold text-2xl ${
                  isAllocationValid
                    ? "text-success"
                    : "text-orange-700 dark:text-orange-400"
                }`}
              >
                {totalAllocationPercentage}%
              </span>
            </div>
            {!isAllocationValid && (
              <p
                className={`text-base mt-2 font-semibold ${
                  totalAllocationPercentage > 100
                    ? "text-destructive"
                    : "text-blue-700 dark:text-blue-400"
                }`}
              >
                {totalAllocationPercentage > 100
                  ? `⚠️ Reduce by ${totalAllocationPercentage - 100}%`
                  : `⚠️ Add ${100 - totalAllocationPercentage}% more`}
              </p>
            )}
          </div>
        </div>

        {/* Budget Preview Section */}
        {actualSalary > 0 && budgetPercentage > 0 && (
          <div className="space-y-6">
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Complete Budget Breakdown
              </h3>
            </div>

            {/* Main Budget Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">Monthly Salary</p>
                <p className="text-lg font-bold text-foreground">
                  ₹{actualSalary.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border">
                <p className="text-sm text-muted-foreground">
                  Budget Allocation
                </p>
                <p className="text-lg font-bold text-primary">
                  {budgetPercentage}%
                </p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg border">
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
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Remaining Amount:</strong> ₹
                {(actualSalary - calculatedBudget).toLocaleString()} (
                {100 - budgetPercentage}% - for emergency funds, extra savings,
                etc.)
              </p>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button
          onClick={handleSaveConfiguration}
          className="w-full"
          variant="default"
          size="lg"
          disabled={!isAllocationValid}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Complete Configuration
        </Button>
      </CardContent>
    </Card>
  );
};

export default SalaryConfig;
