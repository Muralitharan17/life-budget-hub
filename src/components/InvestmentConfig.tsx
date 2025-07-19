import { useState, useEffect } from "react";
import {
  Eye,
  EyeOff,
  Save,
  Calculator,
  DollarSign,
  Percent,
  TrendingUp,
  Plus,
  Edit,
  Trash2,
  Target,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

interface Fund {
  id: string;
  name: string;
  allocatedAmount: number;
  investedAmount: number;
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

interface InvestmentPlan {
  portfolios: Portfolio[];
}

interface InvestmentConfigProps {
  totalInvestmentAmount: number;
  currentUser: string;
  onInvestmentPlanUpdate: (plan: InvestmentPlan) => void;
  currentInvestmentPlan?: InvestmentPlan;
}

const InvestmentConfig = ({
  totalInvestmentAmount,
  currentUser,
  onInvestmentPlanUpdate,
  currentInvestmentPlan,
}: InvestmentConfigProps) => {
  const [investmentPlan, setInvestmentPlan] = useState<InvestmentPlan>(
    currentInvestmentPlan || { portfolios: [] },
  );

  const { toast } = useToast();

  const calculatePortfolioAmount = (portfolio: Portfolio) => {
    if (portfolio.allocationType === "percentage") {
      return Math.round(
        (totalInvestmentAmount * portfolio.allocationValue) / 100,
      );
    }
    return portfolio.allocationValue;
  };

  const calculateCategoryAmount = (
    category: PortfolioCategory,
    portfolioAmount: number,
  ) => {
    if (category.allocationType === "percentage") {
      return Math.round((portfolioAmount * category.allocationValue) / 100);
    }
    return category.allocationValue;
  };

  const calculateFundAmount = (
    fund: Fund,
    categoryAmount: number,
    totalFunds: number,
  ) => {
    return totalFunds > 0 ? Math.round(categoryAmount / totalFunds) : 0;
  };

  const updatePortfolioAmounts = (portfolios: Portfolio[]) => {
    return portfolios.map((portfolio) => {
      const portfolioAmount = calculatePortfolioAmount(portfolio);
      const updatedCategories = portfolio.categories.map((category) => {
        const categoryAmount = calculateCategoryAmount(
          category,
          portfolioAmount,
        );
        const updatedFunds = category.funds.map((fund) => ({
          ...fund,
          allocatedAmount: calculateFundAmount(
            fund,
            categoryAmount,
            category.funds.length,
          ),
          investedAmount: fund.investedAmount || 0,
        }));
        return {
          ...category,
          allocatedAmount: categoryAmount,
          investedAmount: category.investedAmount || 0,
          funds: updatedFunds,
        };
      });
      return {
        ...portfolio,
        allocatedAmount: portfolioAmount,
        investedAmount: portfolio.investedAmount || 0,
        categories: updatedCategories,
      };
    });
  };

  const addPortfolio = (
    name: string,
    allocationType: "percentage" | "amount",
    allocationValue: number,
    allowDirectInvestment: boolean,
  ) => {
    const newPortfolio: Portfolio = {
      id: Date.now().toString(),
      name,
      allocationType,
      allocationValue,
      allocatedAmount: 0,
      investedAmount: 0,
      allowDirectInvestment,
      categories: [],
    };

    const updatedPortfolios = updatePortfolioAmounts([
      ...investmentPlan.portfolios,
      newPortfolio,
    ]);
    const newPlan = { portfolios: updatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const updatePortfolio = (
    portfolioId: string,
    name: string,
    allocationType: "percentage" | "amount",
    allocationValue: number,
    allowDirectInvestment: boolean,
  ) => {
    const updatedPortfolios = investmentPlan.portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            name,
            allocationType,
            allocationValue,
            allowDirectInvestment,
          }
        : portfolio,
    );

    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const deletePortfolio = (portfolioId: string) => {
    const updatedPortfolios = investmentPlan.portfolios.filter(
      (p) => p.id !== portfolioId,
    );
    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const addCategory = (
    portfolioId: string,
    name: string,
    allocationType: "percentage" | "amount",
    allocationValue: number,
  ) => {
    const newCategory: PortfolioCategory = {
      id: Date.now().toString(),
      name,
      allocationType,
      allocationValue,
      allocatedAmount: 0,
      investedAmount: 0,
      funds: [],
    };

    const updatedPortfolios = investmentPlan.portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? { ...portfolio, categories: [...portfolio.categories, newCategory] }
        : portfolio,
    );

    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const updateCategory = (
    portfolioId: string,
    categoryId: string,
    name: string,
    allocationType: "percentage" | "amount",
    allocationValue: number,
  ) => {
    const updatedPortfolios = investmentPlan.portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            categories: portfolio.categories.map((category) =>
              category.id === categoryId
                ? { ...category, name, allocationType, allocationValue }
                : category,
            ),
          }
        : portfolio,
    );

    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const deleteCategory = (portfolioId: string, categoryId: string) => {
    const updatedPortfolios = investmentPlan.portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            categories: portfolio.categories.filter((c) => c.id !== categoryId),
          }
        : portfolio,
    );

    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const addFund = (portfolioId: string, categoryId: string, name: string) => {
    const newFund: Fund = {
      id: Date.now().toString(),
      name,
      allocatedAmount: 0,
      investedAmount: 0,
    };

    const updatedPortfolios = investmentPlan.portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            categories: portfolio.categories.map((category) =>
              category.id === categoryId
                ? { ...category, funds: [...category.funds, newFund] }
                : category,
            ),
          }
        : portfolio,
    );

    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const updateFund = (
    portfolioId: string,
    categoryId: string,
    fundId: string,
    name: string,
  ) => {
    const updatedPortfolios = investmentPlan.portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            categories: portfolio.categories.map((category) =>
              category.id === categoryId
                ? {
                    ...category,
                    funds: category.funds.map((fund) =>
                      fund.id === fundId ? { ...fund, name } : fund,
                    ),
                  }
                : category,
            ),
          }
        : portfolio,
    );

    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const deleteFund = (
    portfolioId: string,
    categoryId: string,
    fundId: string,
  ) => {
    const updatedPortfolios = investmentPlan.portfolios.map((portfolio) =>
      portfolio.id === portfolioId
        ? {
            ...portfolio,
            categories: portfolio.categories.map((category) =>
              category.id === categoryId
                ? {
                    ...category,
                    funds: category.funds.filter((f) => f.id !== fundId),
                  }
                : category,
            ),
          }
        : portfolio,
    );

    const recalculatedPortfolios = updatePortfolioAmounts(updatedPortfolios);
    const newPlan = { portfolios: recalculatedPortfolios };
    setInvestmentPlan(newPlan);
  };

  const getTotalAllocatedAmount = () => {
    return investmentPlan.portfolios.reduce(
      (sum, portfolio) => sum + portfolio.allocatedAmount,
      0,
    );
  };

  const getTotalAllocatedPercentage = () => {
    return totalInvestmentAmount > 0
      ? (getTotalAllocatedAmount() / totalInvestmentAmount) * 100
      : 0;
  };

  const isAllocationValid = () => {
    const totalAllocated = getTotalAllocatedAmount();
    return Math.abs(totalAllocated - totalInvestmentAmount) <= 1; // Allow 1 rupee difference for rounding
  };

  const handleSaveConfiguration = () => {
    if (!isAllocationValid()) {
      toast({
        title: "Invalid Allocation",
        description: `Total allocated amount (₹${getTotalAllocatedAmount().toLocaleString()}) must equal investment budget (₹${totalInvestmentAmount.toLocaleString()})`,
        variant: "destructive",
      });
      return;
    }

    onInvestmentPlanUpdate(investmentPlan);

    toast({
      title: "Investment Plan Configuration Saved",
      description: `Investment plan configured with ${investmentPlan.portfolios.length} portfolios`,
    });
  };

  const PortfolioDialog = ({
    portfolio,
    onSave,
  }: {
    portfolio?: Portfolio;
    onSave: (
      name: string,
      allocationType: "percentage" | "amount",
      allocationValue: number,
      allowDirectInvestment: boolean,
    ) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [allocationType, setAllocationType] = useState<
      "percentage" | "amount"
    >("percentage");
    const [allocationValue, setAllocationValue] = useState("");
    const [allowDirectInvestment, setAllowDirectInvestment] = useState(false);

    // Initialize form data when dialog opens
    useEffect(() => {
      if (open && portfolio) {
        setName(portfolio.name);
        setAllocationType(portfolio.allocationType);
        setAllocationValue(portfolio.allocationValue.toString());
        setAllowDirectInvestment(portfolio.allowDirectInvestment);
      } else if (open && !portfolio) {
        setName("");
        setAllocationType("percentage");
        setAllocationValue("");
        setAllowDirectInvestment(false);
      }
    }, [open, portfolio]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !allocationValue) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      onSave(
        name,
        allocationType,
        parseFloat(allocationValue),
        allowDirectInvestment,
      );
      setOpen(false);
      if (!portfolio) {
        setName("");
        setAllocationValue("");
        setAllowDirectInvestment(false);
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={portfolio ? "ghost" : "default"} size="sm">
            {portfolio ? (
              <Edit className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Portfolio
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {portfolio ? "Edit Portfolio" : "Add Portfolio"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="portfolio-name">Portfolio Name *</Label>
              <Input
                id="portfolio-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Stock Market, Mutual Fund, Gold"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Allocation Type *</Label>
              <Select
                value={allocationType}
                onValueChange={(value: "percentage" | "amount") =>
                  setAllocationType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="allocation-value">
                {allocationType === "percentage"
                  ? "Percentage (%)"
                  : "Amount (₹)"}{" "}
                *
              </Label>
              <Input
                id="allocation-value"
                type="number"
                step={allocationType === "percentage" ? "0.1" : "1"}
                value={allocationValue}
                onChange={(e) => setAllocationValue(e.target.value)}
                placeholder={allocationType === "percentage" ? "25.0" : "5000"}
                required
              />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="direct-investment"
                checked={allowDirectInvestment}
                onCheckedChange={setAllowDirectInvestment}
              />
              <Label htmlFor="direct-investment" className="text-sm">
                Allow direct investment (skip categories/funds)
              </Label>
            </div>
            <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
              💡 Enable this for simple investments like direct government
              schemes, gold, or fixed deposits where you don't need to track
              categories and funds.
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {portfolio ? "Update" : "Add"} Portfolio
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const CategoryDialog = ({
    portfolioId,
    category,
    onSave,
  }: {
    portfolioId: string;
    category?: PortfolioCategory;
    onSave: (
      name: string,
      allocationType: "percentage" | "amount",
      allocationValue: number,
    ) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");
    const [allocationType, setAllocationType] = useState<
      "percentage" | "amount"
    >("percentage");
    const [allocationValue, setAllocationValue] = useState("");

    // Initialize form data when dialog opens
    useEffect(() => {
      if (open && category) {
        setName(category.name);
        setAllocationType(category.allocationType);
        setAllocationValue(category.allocationValue.toString());
      } else if (open && !category) {
        setName("");
        setAllocationType("percentage");
        setAllocationValue("");
      }
    }, [open, category]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name || !allocationValue) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields",
          variant: "destructive",
        });
        return;
      }

      onSave(name, allocationType, parseFloat(allocationValue));
      setOpen(false);
      if (!category) {
        setName("");
        setAllocationValue("");
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={category ? "ghost" : "outline"} size="sm">
            {category ? (
              <Edit className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {category ? "Edit Category" : "Add Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category-name">Category Name *</Label>
              <Input
                id="category-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Large Cap, Mid Cap, Small Cap"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Allocation Type *</Label>
              <Select
                value={allocationType}
                onValueChange={(value: "percentage" | "amount") =>
                  setAllocationType(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Percentage</SelectItem>
                  <SelectItem value="amount">Fixed Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category-allocation-value">
                {allocationType === "percentage"
                  ? "Percentage (%)"
                  : "Amount (₹)"}{" "}
                *
              </Label>
              <Input
                id="category-allocation-value"
                type="number"
                step={allocationType === "percentage" ? "0.1" : "1"}
                value={allocationValue}
                onChange={(e) => setAllocationValue(e.target.value)}
                placeholder={allocationType === "percentage" ? "40.0" : "2000"}
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {category ? "Update" : "Add"} Category
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const FundDialog = ({
    portfolioId,
    categoryId,
    fund,
    onSave,
  }: {
    portfolioId: string;
    categoryId: string;
    fund?: Fund;
    onSave: (name: string) => void;
  }) => {
    const [open, setOpen] = useState(false);
    const [name, setName] = useState("");

    // Initialize form data when dialog opens
    useEffect(() => {
      if (open && fund) {
        setName(fund.name);
      } else if (open && !fund) {
        setName("");
      }
    }, [open, fund]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!name) {
        toast({
          title: "Missing Information",
          description: "Please enter fund name",
          variant: "destructive",
        });
        return;
      }

      onSave(name);
      setOpen(false);
      if (!fund) {
        setName("");
      }
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant={fund ? "ghost" : "outline"} size="sm">
            {fund ? (
              <Edit className="h-4 w-4" />
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Fund
              </>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{fund ? "Edit Fund" : "Add Fund"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fund-name">Fund Name *</Label>
              <Input
                id="fund-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., ICICI Prudential Bluechip Fund"
                required
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{fund ? "Update" : "Add"} Fund</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <Target className="h-6 w-6" />
          Investment Plan Configuration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure your investment portfolios and track allocation
        </p>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Investment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gradient-to-r from-primary/5 to-success/5 rounded-lg border border-primary/20">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Total Investment Budget
            </p>
            <p className="text-2xl font-bold text-primary">
              ₹{totalInvestmentAmount.toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Allocated</p>
            <p className="text-2xl font-bold text-secondary">
              ₹{getTotalAllocatedAmount().toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {getTotalAllocatedPercentage().toFixed(1)}%
            </p>
          </div>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Remaining</p>
            <p
              className={`text-2xl font-bold ${
                totalInvestmentAmount - getTotalAllocatedAmount() >= 0
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              ₹
              {(
                totalInvestmentAmount - getTotalAllocatedAmount()
              ).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalInvestmentAmount > 0
                ? (100 - getTotalAllocatedPercentage()).toFixed(1)
                : 0}
              %
            </p>
          </div>
        </div>

        {!isAllocationValid() && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg text-destructive text-sm">
            ⚠️ Total allocated amount must equal the investment budget amount
          </div>
        )}

        {/* Portfolio Management */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Investment Portfolios
              </h3>
              <p className="text-sm text-muted-foreground">
                Manage your investment portfolios and their allocations
              </p>
            </div>
            <PortfolioDialog
              onSave={(
                name,
                allocationType,
                allocationValue,
                allowDirectInvestment,
              ) =>
                addPortfolio(
                  name,
                  allocationType,
                  allocationValue,
                  allowDirectInvestment,
                )
              }
            />
          </div>

          {investmentPlan.portfolios.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No portfolios configured yet</p>
              <p className="text-sm">Add your first portfolio to get started</p>
            </div>
          ) : (
            <div className="space-y-6">
              {investmentPlan.portfolios.map((portfolio) => (
                <Card
                  key={portfolio.id}
                  className="border-l-4 border-l-primary"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div>
                        <h4 className="text-lg font-semibold">
                          {portfolio.name}
                        </h4>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {portfolio.allocationType === "percentage"
                              ? `${portfolio.allocationValue}%`
                              : `₹${portfolio.allocationValue.toLocaleString()}`}
                          </span>
                          <span>•</span>
                          <span>
                            ₹{portfolio.allocatedAmount.toLocaleString()}
                          </span>
                          {portfolio.allowDirectInvestment && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                Direct Investment
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <PortfolioDialog
                          portfolio={portfolio}
                          onSave={(
                            name,
                            allocationType,
                            allocationValue,
                            allowDirectInvestment,
                          ) =>
                            updatePortfolio(
                              portfolio.id,
                              name,
                              allocationType,
                              allocationValue,
                              allowDirectInvestment,
                            )
                          }
                        />
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Portfolio
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "
                                {portfolio.name}
                                "? This will also delete all categories and
                                funds within this portfolio.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePortfolio(portfolio.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!portfolio.allowDirectInvestment && (
                      <>
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Categories</h5>
                          <CategoryDialog
                            portfolioId={portfolio.id}
                            onSave={(name, allocationType, allocationValue) =>
                              addCategory(
                                portfolio.id,
                                name,
                                allocationType,
                                allocationValue,
                              )
                            }
                          />
                        </div>

                        {portfolio.categories.length === 0 ? (
                          <div className="text-center py-4 text-muted-foreground text-sm">
                            No categories added yet
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {portfolio.categories.map((category) => (
                              <Card
                                key={category.id}
                                className="border-l-4 border-l-secondary"
                              >
                                <CardHeader className="pb-3">
                                  <CardTitle className="flex items-center justify-between text-base">
                                    <div>
                                      <h6 className="font-medium">
                                        {category.name}
                                      </h6>
                                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                        <span>
                                          {category.allocationType ===
                                          "percentage"
                                            ? `${category.allocationValue}%`
                                            : `₹${category.allocationValue.toLocaleString()}`}
                                        </span>
                                        <span>•</span>
                                        <span>
                                          ₹
                                          {category.allocatedAmount.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <CategoryDialog
                                        portfolioId={portfolio.id}
                                        category={category}
                                        onSave={(
                                          name,
                                          allocationType,
                                          allocationValue,
                                        ) =>
                                          updateCategory(
                                            portfolio.id,
                                            category.id,
                                            name,
                                            allocationType,
                                            allocationValue,
                                          )
                                        }
                                      />
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm">
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>
                                              Delete Category
                                            </AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Are you sure you want to delete "
                                              {category.name}"? This will also
                                              delete all funds within this
                                              category.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>
                                              Cancel
                                            </AlertDialogCancel>
                                            <AlertDialogAction
                                              onClick={() =>
                                                deleteCategory(
                                                  portfolio.id,
                                                  category.id,
                                                )
                                              }
                                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                            >
                                              Delete
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    </div>
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="flex items-center justify-between mb-3">
                                    <h6 className="text-sm font-medium">
                                      Funds
                                    </h6>
                                    <FundDialog
                                      portfolioId={portfolio.id}
                                      categoryId={category.id}
                                      onSave={(name) =>
                                        addFund(portfolio.id, category.id, name)
                                      }
                                    />
                                  </div>

                                  {category.funds.length === 0 ? (
                                    <div className="text-center py-3 text-muted-foreground text-sm">
                                      No funds added yet
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {category.funds.map((fund) => (
                                        <div
                                          key={fund.id}
                                          className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                        >
                                          <div>
                                            <p className="font-medium text-sm">
                                              {fund.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              ₹
                                              {fund.allocatedAmount.toLocaleString()}
                                              {category.funds.length > 0 &&
                                                ` (${(
                                                  (fund.allocatedAmount /
                                                    category.allocatedAmount) *
                                                  100
                                                ).toFixed(1)}%)`}
                                            </p>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <FundDialog
                                              portfolioId={portfolio.id}
                                              categoryId={category.id}
                                              fund={fund}
                                              onSave={(name) =>
                                                updateFund(
                                                  portfolio.id,
                                                  category.id,
                                                  fund.id,
                                                  name,
                                                )
                                              }
                                            />
                                            <AlertDialog>
                                              <AlertDialogTrigger asChild>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                >
                                                  <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                              </AlertDialogTrigger>
                                              <AlertDialogContent>
                                                <AlertDialogHeader>
                                                  <AlertDialogTitle>
                                                    Delete Fund
                                                  </AlertDialogTitle>
                                                  <AlertDialogDescription>
                                                    Are you sure you want to
                                                    delete "{fund.name}"?
                                                  </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                  <AlertDialogCancel>
                                                    Cancel
                                                  </AlertDialogCancel>
                                                  <AlertDialogAction
                                                    onClick={() =>
                                                      deleteFund(
                                                        portfolio.id,
                                                        category.id,
                                                        fund.id,
                                                      )
                                                    }
                                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                  >
                                                    Delete
                                                  </AlertDialogAction>
                                                </AlertDialogFooter>
                                              </AlertDialogContent>
                                            </AlertDialog>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    {portfolio.allowDirectInvestment && (
                      <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h5 className="font-medium text-primary">
                              Direct Investment Portfolio
                            </h5>
                            <p className="text-sm text-muted-foreground">
                              This portfolio allows direct investments without
                              categories or funds.
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-muted-foreground">
                              Simple Tracking
                            </span>
                            <p className="text-sm font-bold text-primary">
                              No subcategories needed
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSaveConfiguration}
          className="w-full"
          variant="default"
          size="lg"
          disabled={!isAllocationValid()}
        >
          <Save className="h-4 w-4 mr-2" />
          Save Investment Plan Configuration
        </Button>
      </CardContent>
    </Card>
  );
};

export default InvestmentConfig;
