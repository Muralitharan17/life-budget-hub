import { useState } from "react";
import {
  Download,
  Calendar,
  Settings,
  TrendingUp,
  Calculator,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useBudgetData } from "@/hooks/useBudgetData";

interface BudgetAllocation {
  need: number;
  want: number;
  savings: number;
  investments: number;
}

interface InvestmentPlan {
  portfolios: Portfolio[];
}

interface Portfolio {
  id: string;
  name: string;
  allocationType: "percentage" | "amount";
  allocationValue: number;
  allocatedAmount: number;
  investedAmount: number;
  allowDirectInvestment: boolean;
  categories: PortfolioCategory[];
}

interface PortfolioCategory {
  id: string;
  name: string;
  allocationType: "percentage" | "amount";
  allocationValue: number;
  allocatedAmount: number;
  investedAmount: number;
  funds: Fund[];
}

interface Fund {
  id: string;
  name: string;
  allocatedAmount: number;
  investedAmount: number;
}

interface ConfigurationInheritanceProps {
  onConfigurationsInherited: (configurations: {
    budgetConfig: {
      salary: number;
      budgetPercentage: number;
      allocation: BudgetAllocation;
    };
    investmentPlan: InvestmentPlan;
  }) => void;
  currentMonth?: number;
  currentYear?: number;
  currentUser: string;
}

const ConfigurationInheritance = ({
  onConfigurationsInherited,
  currentMonth = new Date().getMonth(),
  currentYear = new Date().getFullYear(),
  currentUser,
}: ConfigurationInheritanceProps) => {
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Get data from the selected month/year to check if configurations exist
  // Get configurations for the current user profile from selected month/year
  const {
    budgetConfig: sourceBudgetConfig,
    portfolios: sourcePortfolios,
    loading: dataLoading,
  } = useBudgetData(selectedMonth, selectedYear, currentUser);

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Generate year options (current year ± 5 years)
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const getAvailableConfigurations = () => {
    const configs = [];

    // Since we're using inheritance mode, we can directly check for configurations
    if (sourceBudgetConfig && sourceBudgetConfig.monthly_salary > 0) {
      configs.push("Complete Budget Configuration");
    }

    if (
      sourceBudgetConfig &&
      (sourceBudgetConfig.allocation_need > 0 ||
        sourceBudgetConfig.allocation_want > 0 ||
        sourceBudgetConfig.allocation_savings > 0 ||
        sourceBudgetConfig.allocation_investments > 0)
    ) {
      configs.push("Budget Allocation Breakdown");
    }

    if (sourcePortfolios && sourcePortfolios.length > 0) {
      configs.push("Investment Portfolios");
    }

    return configs;
  };

  const handleInheritConfigurations = async () => {
    setIsLoading(true);

    try {
      const availableConfigs = getAvailableConfigurations();

      if (availableConfigs.length === 0) {
        toast({
          title: "No Configurations Found",
          description: `No configurations available for ${monthNames[selectedMonth]} ${selectedYear}. Please select a different month/year.`,
          variant: "destructive",
        });
        return;
      }

      // Check if we're trying to inherit from the same month/year
      if (selectedMonth === currentMonth && selectedYear === currentYear) {
        toast({
          title: "Same Month/Year Selected",
          description:
            "You cannot inherit configurations from the same month and year. Please select a different period.",
          variant: "destructive",
        });
        return;
      }

      // Prepare budget configuration
      const budgetConfig = {
        salary: sourceBudgetConfig?.monthly_salary || 0,
        budgetPercentage: sourceBudgetConfig?.budget_percentage || 0,
        allocation: {
          need: sourceBudgetConfig?.allocation_need || 0,
          want: sourceBudgetConfig?.allocation_want || 0,
          savings: sourceBudgetConfig?.allocation_savings || 0,
          investments: sourceBudgetConfig?.allocation_investments || 0,
        },
      };

      // Prepare investment plan with new IDs to avoid conflicts
      const investmentPlan: InvestmentPlan = {
        portfolios: (sourcePortfolios || []).map((portfolio) => ({
          ...portfolio,
          id: `inherited_${Date.now()}_${portfolio.id}`,
          categories:
            portfolio.categories?.map((category: any) => ({
              ...category,
              id: `inherited_${Date.now()}_${category.id}`,
              funds:
                category.funds?.map((fund: any) => ({
                  ...fund,
                  id: `inherited_${Date.now()}_${fund.id}`,
                  investedAmount: 0, // Reset invested amounts for new period
                })) || [],
              investedAmount: 0,
            })) || [],
          investedAmount: 0,
        })),
      };

      // Call the callback to apply configurations
      onConfigurationsInherited({
        budgetConfig,
        investmentPlan,
      });

      toast({
        title: "Configurations Inherited Successfully",
        description: `Inherited ${availableConfigs.join(", ")} from ${monthNames[selectedMonth]} ${selectedYear}.`,
      });
    } catch (error) {
      console.error("Error inheriting configurations:", error);
      toast({
        title: "Inheritance Failed",
        description: "Failed to inherit configurations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const availableConfigs = getAvailableConfigurations();
  const hasConfigurations = availableConfigs.length > 0;
  const isSameMonthYear =
    selectedMonth === currentMonth && selectedYear === currentYear;

  return (
    <Card className="shadow-card bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Download className="h-6 w-6" />
          Inherit Configurations
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Copy configurations from a previous month and year to quickly set up
          your current budget
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Month and Year Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Month
            </Label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthNames.map((month, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Select Year
            </Label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Configuration Preview */}
        <div className="space-y-4">
          <div className="border-t pt-4">
            <h4 className="font-medium text-foreground mb-3">
              Available Configurations for {monthNames[selectedMonth]}{" "}
              {selectedYear}:
            </h4>

            {dataLoading ? (
              <div className="text-sm text-muted-foreground">
                Loading configurations...
              </div>
            ) : hasConfigurations ? (
              <div className="space-y-2">
                {availableConfigs.map((config, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-success/10 border border-success/20 rounded-lg"
                  >
                    {config === "Complete Budget Configuration" && (
                      <Calculator className="h-4 w-4 text-success" />
                    )}
                    {config === "Budget Allocation Breakdown" && (
                      <Settings className="h-4 w-4 text-success" />
                    )}
                    {config === "Investment Portfolios" && (
                      <Target className="h-4 w-4 text-success" />
                    )}
                    <span className="text-sm font-medium text-success">
                      ✓ {config}
                    </span>
                  </div>
                ))}

                {sourceBudgetConfig && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 p-3 bg-background/50 rounded-lg border">
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Monthly Salary
                      </p>
                      <p className="text-sm font-semibold">
                        ₹
                        {sourceBudgetConfig.monthly_salary?.toLocaleString() ||
                          0}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">Budget %</p>
                      <p className="text-sm font-semibold">
                        {sourceBudgetConfig.budget_percentage || 0}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-muted-foreground">
                        Portfolios
                      </p>
                      <p className="text-sm font-semibold">
                        {sourcePortfolios?.length || 0} configured
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3 bg-muted/20 border border-muted/40 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No configurations found for {monthNames[selectedMonth]}{" "}
                  {selectedYear}. Please select a different month/year or create
                  configurations first.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Warning for same month/year */}
        {isSameMonthYear && (
          <div className="p-3 bg-warning/10 border border-warning/30 rounded-lg">
            <p className="text-sm text-warning font-medium">
              ⚠️ You have selected the current month and year. Please choose a
              different period to inherit configurations from.
            </p>
          </div>
        )}

        {/* Inherit Button */}
        <Button
          onClick={handleInheritConfigurations}
          disabled={
            !hasConfigurations || isLoading || dataLoading || isSameMonthYear
          }
          className="w-full"
          size="lg"
        >
          <Download className="h-4 w-4 mr-2" />
          {isLoading
            ? "Inheriting Configurations..."
            : `Inherit All Configurations from ${monthNames[selectedMonth]} ${selectedYear}`}
        </Button>

        <div className="text-xs text-muted-foreground bg-muted/20 p-3 rounded-lg">
          <p className="font-medium mb-1">📝 What gets inherited:</p>
          <ul className="space-y-1 ml-4">
            <li>• Complete salary and budget percentage settings</li>
            <li>
              • Budget allocation breakdown (Need/Want/Savings/Investments)
            </li>
            <li>• All investment portfolio structures and allocations</li>
            <li>• Investment categories and fund configurations</li>
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            Note: Invested amounts will be reset to zero for the new period.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConfigurationInheritance;
