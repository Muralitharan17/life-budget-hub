import { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  PiggyBank,
  CreditCard,
  Target,
  Calendar,
  Users,
  Wallet,
  Settings,
  Lock,
  Home,
  Music,
  Plus,
  Edit,
  Trash2,
  Filter,
  Search,
  UserCheck,
  Eye,
  EyeOff,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useBudgetData } from "@/hooks/useBudgetData";
import { useAuth } from "@/hooks/useAuth";
import SalaryConfig from "./SalaryConfig";
import InvestmentConfig from "./InvestmentConfig";
import ConfigurationInheritance from "./ConfigurationInheritance";

interface BudgetAllocation {
  need: number;
  want: number;
  savings: number;
  investments: number;
}

interface CategorySpending {
  need: number;
  want: number;
  savings: number;
  investments: number;
}

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

interface InvestmentEntry {
  id: string;
  date: string;
  amount: number;
  notes: string;
  portfolioId: string;
  categoryId?: string;
  fundId?: string;
  isDirectInvestment: boolean;
}

interface ExpenseEntry {
  id: string;
  date: string;
  spentFor: string;
  amount: number;
  notes: string;
  category: "need" | "want" | "savings" | "investments";
  tag?: string;
  paymentType?: "SENT BY ME" | "SENT TO VALAR" | "SENT TO MURALI";
}

interface BankBalanceEntry {
  month: number;
  year: number;
  openingBalance: number;
}

interface RefundEntry {
  id: string;
  date: string;
  refundFor: string;
  amount: number;
  notes: string;
  category: "need" | "want" | "savings" | "investments";
  tag?: string;
  originalExpenseId?: string;
}

interface UserProfile {
  name: string;
  partnerName: string;
  salary: number;
  budgetPercentage: number;
  budgetAllocation: BudgetAllocation;
  expenses: ExpenseEntry[];
  customTags: string[];
  investmentPlan: InvestmentPlan;
  investmentEntries: InvestmentEntry[];
  bankBalances: BankBalanceEntry[];
  refunds: RefundEntry[];
}

const DEFAULT_TAGS = {
  need: [
    "EMI's",
    "Entertainments",
    "Fuel",
    "Gas",
    "Grocessories",
    "Hotels/Food",
    "Mobile recharges",
    "Others",
    "Rent",
    "Transportation",
  ],
  want: [
    "Entertainments",
    "Hobbies",
    "Movies",
    "Others",
    "Restaurants",
    "Shopping",
  ],
  savings: ["Emergency Fund", "Fixed Deposit", "Others", "Savings Account"],
  investments: ["Mutual Funds", "Others", "PPF", "Stocks", "SIP"],
};

const TAG_COLORS = {
  Rent: "bg-red-100 text-red-800 border-red-200",
  "Hotels/Food": "bg-orange-100 text-orange-800 border-orange-200",
  Transportation: "bg-blue-100 text-blue-800 border-blue-200",
  Grocessories: "bg-green-100 text-green-800 border-green-200",
  "Mobile recharges": "bg-purple-100 text-purple-800 border-purple-200",
  "EMI's": "bg-pink-100 text-pink-800 border-pink-200",
  Entertainments: "bg-yellow-100 text-yellow-800 border-yellow-200",
  Gas: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Fuel: "bg-gray-100 text-gray-800 border-gray-200",
  Others: "bg-slate-100 text-slate-800 border-slate-200",
  Hobbies: "bg-teal-100 text-teal-800 border-teal-200",
  Movies: "bg-cyan-100 text-cyan-800 border-cyan-200",
  Restaurants: "bg-amber-100 text-amber-800 border-amber-200",
  Shopping: "bg-rose-100 text-rose-800 border-rose-200",
  "Emergency Fund": "bg-emerald-100 text-emerald-800 border-emerald-200",
  "Fixed Deposit": "bg-lime-100 text-lime-800 border-lime-200",
  "Savings Account": "bg-green-100 text-green-800 border-green-200",
  "Mutual Funds": "bg-blue-100 text-blue-800 border-blue-200",
  PPF: "bg-indigo-100 text-indigo-800 border-indigo-200",
  Stocks: "bg-purple-100 text-purple-800 border-purple-200",
  SIP: "bg-pink-100 text-pink-800 border-pink-200",
};

const BudgetDashboard = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentUser, setCurrentUser] = useState<
    "murali" | "valar" | "combined"
  >("murali");
  const [showConfigHint, setShowConfigHint] = useState(false);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [filterDate, setFilterDate] = useState("");
  const [isConfigAuthenticated, setIsConfigAuthenticated] = useState(false);
  const { toast } = useToast();

  // Supabase data integration
  const { user } = useAuth();
  const {
    budgetConfig,
    portfolios,
    transactions: supabaseTransactions,
    loading: dataLoading,
    saveBudgetConfig,
    saveInvestmentPortfolio,
    addTransaction,
    refetch,
    } = useBudgetData(selectedMonth, selectedYear, currentUser === "combined" ? "murali" : currentUser);

  const [profiles, setProfiles] = useState<
    Record<"murali" | "valar", UserProfile>
  >({
    murali: {
      name: "Murali",
      partnerName: "Valar",
      salary: 0,
      budgetPercentage: 0,
      budgetAllocation: { need: 0, want: 0, savings: 0, investments: 0 },
      expenses: [],
      customTags: [],
      investmentPlan: { portfolios: [] },
      investmentEntries: [],
      bankBalances: [],
      refunds: [],
    },
    valar: {
      name: "Valar",
      partnerName: "Murali",
      salary: 0,
      budgetPercentage: 0,
      budgetAllocation: { need: 0, want: 0, savings: 0, investments: 0 },
      expenses: [],
      customTags: [],
      investmentPlan: { portfolios: [] },
      investmentEntries: [],
      bankBalances: [],
      refunds: [],
    },
  });

  // Create current profile from Supabase data
  const currentProfile = budgetConfig
    ? {
        name: user?.email?.split("@")[0] || "User",
        partnerName: "",
        salary: budgetConfig.monthly_salary,
        budgetPercentage: budgetConfig.budget_percentage,
        budgetAllocation: {
          need: budgetConfig.allocation_need,
          want: budgetConfig.allocation_want,
          savings: budgetConfig.allocation_savings,
          investments: budgetConfig.allocation_investments,
        },
        expenses: supabaseTransactions.filter((t) => t.type === "expense"),
        customTags: [],
        investmentPlan: { portfolios: portfolios || [] },
        investmentEntries: supabaseTransactions.filter(
          (t) => t.type === "investment",
        ),
        bankBalances: [],
        refunds: supabaseTransactions.filter((t) => t.type === "refund"),
      }
    : {
        name: user?.email?.split("@")[0] || "User",
        partnerName: "",
        salary: 0,
        budgetPercentage: 0,
        budgetAllocation: { need: 0, want: 0, savings: 0, investments: 0 },
        expenses: [],
        customTags: [],
        investmentPlan: { portfolios: [] },
        investmentEntries: [],
        bankBalances: [],
        refunds: [],
      };

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

  const calculatedTotalBudget =
    currentUser === "combined"
      ? Math.round(
          (profiles.murali.salary * profiles.murali.budgetPercentage) / 100,
        ) +
        Math.round(
          (profiles.valar.salary * profiles.valar.budgetPercentage) / 100,
        )
      : Math.round(
          (currentProfile.salary * currentProfile.budgetPercentage) / 100,
        );

    // Check if we have actual data for the selected month/year
  const hasDataForSelectedMonth = () => {
    const currentDate = new Date();
    const isCurrentMonth =
      selectedMonth === currentDate.getMonth() &&
      selectedYear === currentDate.getFullYear();

    // For current month, only show data if we have a valid budget configuration
    if (isCurrentMonth) {
      // Check if we have a valid budget config with meaningful salary/allocation data
      if (budgetConfig && (budgetConfig.monthly_salary > 0 || budgetConfig.budget_percentage > 0)) {
        return true;
      }
      // For localStorage users, check if they have valid profile data
      if (currentProfile.salary > 0 && currentProfile.budgetPercentage > 0) {
        return true;
      }
      return false;
    }

    // For Supabase data, check if we have actual transaction data for the selected month/year
    if (supabaseTransactions?.length > 0) {
      return supabaseTransactions.some((transaction) => {
        const transactionDate = new Date(transaction.date);
        return (
          transactionDate.getMonth() === selectedMonth &&
          transactionDate.getFullYear() === selectedYear
        );
      });
    }

    // For localStorage data, check if we have expenses or transactions
    if (currentUser === "combined") {
      const hasExpenses = [
        ...profiles.murali.expenses,
        ...profiles.valar.expenses,
      ].some((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === selectedMonth &&
          expenseDate.getFullYear() === selectedYear
        );
      });
      const hasRefunds = [
        ...profiles.murali.refunds,
        ...profiles.valar.refunds,
      ].some((refund) => {
        const refundDate = new Date(refund.date);
        return (
          refundDate.getMonth() === selectedMonth &&
          refundDate.getFullYear() === selectedYear
        );
      });
      return hasExpenses || hasRefunds;
    } else {
      const hasExpenses = currentProfile.expenses.some((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === selectedMonth &&
          expenseDate.getFullYear() === selectedYear
        );
      });
      const hasRefunds = currentProfile.refunds.some((refund) => {
        const refundDate = new Date(refund.date);
        return (
          refundDate.getMonth() === selectedMonth &&
          refundDate.getFullYear() === selectedYear
        );
      });
      return hasExpenses || hasRefunds;
    }
  };

  const getAllocatedAmounts = () => {
    const hasData = hasDataForSelectedMonth();

    // If no data for this month/year, return zeros
    if (!hasData) {
      return {
        need: 0,
        want: 0,
        savings: 0,
        investments: 0,
        hasData: false,
      };
    }

    let result;
    if (currentUser === "combined") {
      // Calculate combined allocations
      const muraliBudget = Math.round(
        (profiles.murali.salary * profiles.murali.budgetPercentage) / 100,
      );
      const valarBudget = Math.round(
        (profiles.valar.salary * profiles.valar.budgetPercentage) / 100,
      );

      const muraliAllocations = {
        need: Math.round(
          (muraliBudget * profiles.murali.budgetAllocation.need) / 100,
        ),
        want: Math.round(
          (muraliBudget * profiles.murali.budgetAllocation.want) / 100,
        ),
        savings: Math.round(
          (muraliBudget * profiles.murali.budgetAllocation.savings) / 100,
        ),
        investments: Math.round(
          (muraliBudget * profiles.murali.budgetAllocation.investments) / 100,
        ),
      };

      const valarAllocations = {
        need: Math.round(
          (valarBudget * profiles.valar.budgetAllocation.need) / 100,
        ),
        want: Math.round(
          (valarBudget * profiles.valar.budgetAllocation.want) / 100,
        ),
        savings: Math.round(
          (valarBudget * profiles.valar.budgetAllocation.savings) / 100,
        ),
        investments: Math.round(
          (valarBudget * profiles.valar.budgetAllocation.investments) / 100,
        ),
      };

      result = {
        need: muraliAllocations.need + valarAllocations.need,
        want: muraliAllocations.want + valarAllocations.want,
        savings: muraliAllocations.savings + valarAllocations.savings,
        investments:
          muraliAllocations.investments + valarAllocations.investments,
      };
    } else {
      result = {
        need: Math.round(
          (calculatedTotalBudget * currentProfile.budgetAllocation.need) / 100,
        ),
        want: Math.round(
          (calculatedTotalBudget * currentProfile.budgetAllocation.want) / 100,
        ),
        savings: Math.round(
          (calculatedTotalBudget * currentProfile.budgetAllocation.savings) /
            100,
        ),
        investments: Math.round(
          (calculatedTotalBudget *
            currentProfile.budgetAllocation.investments) /
            100,
        ),
      };
    }

    return { ...result, hasData: true };
  };

  const allocatedAmounts = getAllocatedAmounts();

  // Calculate spending from expenses minus refunds
  const getSpendingByCategory = () => {
    let currentMonthExpenses = [];
    let currentMonthRefunds = [];

    if (currentUser === "combined") {
      // Combine expenses from both users
      const muraliExpenses = profiles.murali.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === selectedMonth &&
          expenseDate.getFullYear() === selectedYear
        );
      });
      const valarExpenses = profiles.valar.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === selectedMonth &&
          expenseDate.getFullYear() === selectedYear
        );
      });
      currentMonthExpenses = [...muraliExpenses, ...valarExpenses];

      // Combine refunds from both users
      const muraliRefunds = profiles.murali.refunds.filter((refund) => {
        const refundDate = new Date(refund.date);
        return (
          refundDate.getMonth() === selectedMonth &&
          refundDate.getFullYear() === selectedYear
        );
      });
      const valarRefunds = profiles.valar.refunds.filter((refund) => {
        const refundDate = new Date(refund.date);
        return (
          refundDate.getMonth() === selectedMonth &&
          refundDate.getFullYear() === selectedYear
        );
      });
      currentMonthRefunds = [...muraliRefunds, ...valarRefunds];
    } else {
      currentMonthExpenses = currentProfile.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return (
          expenseDate.getMonth() === selectedMonth &&
          expenseDate.getFullYear() === selectedYear
        );
      });

      currentMonthRefunds = currentProfile.refunds.filter((refund) => {
        const refundDate = new Date(refund.date);
        return (
          refundDate.getMonth() === selectedMonth &&
          refundDate.getFullYear() === selectedYear
        );
      });
    }

    // Calculate expenses by category
    const expensesByCategory = {
      need: currentMonthExpenses
        .filter((e) => e.category === "need")
        .reduce((sum, e) => sum + e.amount, 0),
      want: currentMonthExpenses
        .filter((e) => e.category === "want")
        .reduce((sum, e) => sum + e.amount, 0),
      savings: currentMonthExpenses
        .filter((e) => e.category === "savings")
        .reduce((sum, e) => sum + e.amount, 0),
      investments: currentMonthExpenses
        .filter((e) => e.category === "investments")
        .reduce((sum, e) => sum + e.amount, 0),
    };

    // Calculate refunds by category
    const refundsByCategory = {
      need: currentMonthRefunds
        .filter((r) => r.category === "need")
        .reduce((sum, r) => sum + r.amount, 0),
      want: currentMonthRefunds
        .filter((r) => r.category === "want")
        .reduce((sum, r) => sum + r.amount, 0),
      savings: currentMonthRefunds
        .filter((r) => r.category === "savings")
        .reduce((sum, r) => sum + r.amount, 0),
      investments: currentMonthRefunds
        .filter((r) => r.category === "investments")
        .reduce((sum, r) => sum + r.amount, 0),
    };

    // Return net spending (expenses minus refunds)
    return {
      need: Math.max(0, expensesByCategory.need - refundsByCategory.need),
      want: Math.max(0, expensesByCategory.want - refundsByCategory.want),
      savings: Math.max(
        0,
        expensesByCategory.savings - refundsByCategory.savings,
      ),
      investments: Math.max(
        0,
        expensesByCategory.investments - refundsByCategory.investments,
      ),
    };
  };

  const categorySpending = getSpendingByCategory();

  // Calculate investment amounts for nested structure
  const getInvestmentAmounts = () => {
    let currentMonthEntries = [];

    if (currentUser === "combined") {
      // Combine investment entries from both users
      const muraliEntries = profiles.murali.investmentEntries.filter(
        (entry) => {
          const entryDate = new Date(entry.date);
          return (
            entryDate.getMonth() === selectedMonth &&
            entryDate.getFullYear() === selectedYear
          );
        },
      );
      const valarEntries = profiles.valar.investmentEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() === selectedMonth &&
          entryDate.getFullYear() === selectedYear
        );
      });
      currentMonthEntries = [...muraliEntries, ...valarEntries];
    } else {
      currentMonthEntries = currentProfile.investmentEntries.filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() === selectedMonth &&
          entryDate.getFullYear() === selectedYear
        );
      });
    }

    // Calculate invested amounts for each level
    const portfolioInvested = new Map<string, number>();
    const categoryInvested = new Map<string, number>();
    const fundInvested = new Map<string, number>();

    currentMonthEntries.forEach((entry) => {
      // Fund level (only if not direct investment)
      if (entry.fundId) {
        fundInvested.set(
          entry.fundId,
          (fundInvested.get(entry.fundId) || 0) + entry.amount,
        );
      }

      // Category level (only if not direct investment)
      if (entry.categoryId) {
        categoryInvested.set(
          entry.categoryId,
          (categoryInvested.get(entry.categoryId) || 0) + entry.amount,
        );
      }

      // Portfolio level (always)
      portfolioInvested.set(
        entry.portfolioId,
        (portfolioInvested.get(entry.portfolioId) || 0) + entry.amount,
      );
    });

    return { portfolioInvested, categoryInvested, fundInvested };
  };

  const investmentAmounts = getInvestmentAmounts();
  const totalInvestmentSpent = Array.from(
    investmentAmounts.portfolioInvested.values(),
  ).reduce((sum, amount) => sum + amount, 0);

  // Updated total spent calculation: sum of all category spending with new investment tracking
  const totalSpent =
    categorySpending.need +
    categorySpending.want +
    categorySpending.savings +
    totalInvestmentSpent;
  const totalRemaining = calculatedTotalBudget - totalSpent;

  const handleSalaryUpdate = async (
    salary: number,
    percentage: number,
    allocation: BudgetAllocation,
  ) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to save your budget configuration.",
        variant: "destructive",
      });
      return;
    }

    try {
      await saveBudgetConfig({
        monthly_salary: salary,
        budget_percentage: percentage,
        allocation_need: allocation.need,
        allocation_want: allocation.want,
        allocation_savings: allocation.savings,
        allocation_investments: allocation.investments,
      });

      toast({
        title: "Configuration Saved",
        description: "Your budget configuration has been saved to Supabase.",
      });
    } catch (error) {
      console.error("Error saving budget config:", error);
      toast({
        title: "Save Failed",
        description: "Failed to save budget configuration. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInvestmentPlanUpdate = (plan: InvestmentPlan) => {
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        investmentPlan: plan,
      },
    };

    saveProfiles(updatedProfiles);
  };

  const handleConfigurationsInherited = async (configurations: {
    budgetConfig: {
      salary: number;
      budgetPercentage: number;
      allocation: BudgetAllocation;
    };
    investmentPlan: InvestmentPlan;
  }) => {
    try {
      // Update budget configuration if available
      if (configurations.budgetConfig.salary > 0) {
        await handleSalaryUpdate(
          configurations.budgetConfig.salary,
          configurations.budgetConfig.budgetPercentage,
          configurations.budgetConfig.allocation,
        );
      }

      // Update investment plan if available
      if (configurations.investmentPlan.portfolios.length > 0) {
        // For Supabase users, save each portfolio
        if (user) {
          for (const portfolio of configurations.investmentPlan.portfolios) {
            try {
              await saveInvestmentPortfolio({
                name: portfolio.name,
                allocation_type: portfolio.allocationType,
                allocation_value: portfolio.allocationValue,
                allocated_amount: portfolio.allocatedAmount,
                allow_direct_investment: portfolio.allowDirectInvestment,
                categories: portfolio.categories || [],
                is_active: true,
              });
            } catch (error) {
              console.warn("Failed to save portfolio:", portfolio.name, error);
            }
          }
        } else {
          // For localStorage users
          handleInvestmentPlanUpdate(configurations.investmentPlan);
        }
      }

      toast({
        title: "Configurations Applied",
        description:
          "All inherited configurations have been successfully applied to the current period.",
      });
    } catch (error) {
      console.error("Error applying inherited configurations:", error);
      toast({
        title: "Application Failed",
        description:
          "Some configurations could not be applied. Please check and try again.",
        variant: "destructive",
      });
    }
  };

  const handleProfileChange = (value: string) => {
    if (value) {
      setCurrentUser(value as "murali" | "valar" | "combined");
    }
  };

  // Refetch data when month/year changes or when user changes
  useEffect(() => {
    if (user) {
      refetch();
    }
  }, [selectedMonth, selectedYear, user]);

  useEffect(() => {
    const saved = localStorage.getItem("budgetProfiles");
    if (saved) {
      const loadedProfiles = JSON.parse(saved);

      // Add backward compatibility for portfolios without allowDirectInvestment field
      Object.keys(loadedProfiles).forEach((userKey) => {
        if (loadedProfiles[userKey].investmentPlan?.portfolios) {
          loadedProfiles[userKey].investmentPlan.portfolios = loadedProfiles[
            userKey
          ].investmentPlan.portfolios.map((portfolio: any) => ({
            ...portfolio,
            allowDirectInvestment: portfolio.allowDirectInvestment ?? false,
            investedAmount: portfolio.investedAmount ?? 0,
            categories:
              portfolio.categories?.map((category: any) => ({
                ...category,
                investedAmount: category.investedAmount ?? 0,
                funds:
                  category.funds?.map((fund: any) => ({
                    ...fund,
                    investedAmount: fund.investedAmount ?? 0,
                  })) || [],
              })) || [],
          }));
        }

        // Add backward compatibility for investmentEntries
        if (!loadedProfiles[userKey].investmentEntries) {
          loadedProfiles[userKey].investmentEntries = [];
        }

        // Add backward compatibility for bankBalances
        if (!loadedProfiles[userKey].bankBalances) {
          loadedProfiles[userKey].bankBalances = [];
        }

        // Add backward compatibility for refunds
        if (!loadedProfiles[userKey].refunds) {
          loadedProfiles[userKey].refunds = [];
        }
      });

      setProfiles(loadedProfiles);
    }
  }, []);

  const saveProfiles = (newProfiles: typeof profiles) => {
    setProfiles(newProfiles);
    localStorage.setItem("budgetProfiles", JSON.stringify(newProfiles));
  };

  const addExpense = (
    category: string,
    spentFor: string,
    amount: number,
    notes: string,
    tag?: string,
    paymentType?: string,
  ) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Add Expense",
        description:
          "Expenses cannot be added in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const newExpense: ExpenseEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      spentFor,
      amount,
      notes,
      category: category as "need" | "want" | "savings" | "investments",
      tag,
      paymentType: paymentType as
        | "SENT BY ME"
        | "SENT TO VALAR"
        | "SENT TO MURALI",
    };

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        expenses: [...profiles[currentUser].expenses, newExpense],
      },
    };

    saveProfiles(updatedProfiles);

    // Auto-switch to the month of the added expense
    const expenseMonth = new Date(selectedDate).getMonth();
    if (expenseMonth !== selectedMonth) {
      setSelectedMonth(expenseMonth);
    }

    toast({
      title: "Expense Added",
      description: `Added ₹${amount} for ${spentFor}`,
    });
  };

  const updateExpense = (
    id: string,
    spentFor: string,
    amount: number,
    notes: string,
    tag?: string,
    paymentType?: string,
  ) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Update Expense",
        description:
          "Expenses cannot be updated in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        expenses: profiles[currentUser].expenses.map((expense) =>
          expense.id === id
            ? { ...expense, spentFor, amount, notes, tag, paymentType }
            : expense,
        ),
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Expense Updated",
      description: `Updated expense for ${spentFor}`,
    });
  };

  const deleteExpense = (id: string) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Delete Expense",
        description:
          "Expenses cannot be deleted in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        expenses: profiles[currentUser].expenses.filter(
          (expense) => expense.id !== id,
        ),
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Expense Deleted",
      description: "Expense has been removed",
    });
  };

  const addCustomTag = (category: string, newTag: string) => {
    if (currentUser === "combined") {
      // In combined mode, don't add custom tags
      toast({
        title: "Cannot Add Custom Tag",
        description:
          "Custom tags cannot be added in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        customTags: [
          ...profiles[currentUser].customTags,
          `${category}:${newTag}`,
        ],
      },
    };

    saveProfiles(updatedProfiles);
  };

  const addRefund = (
    category: string,
    refundFor: string,
    amount: number,
    notes: string,
    tag?: string,
    originalExpenseId?: string,
  ) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Add Refund",
        description:
          "Refunds cannot be added in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const newRefund: RefundEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      refundFor,
      amount,
      notes,
      category: category as "need" | "want" | "savings" | "investments",
      tag,
      originalExpenseId,
    };

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        refunds: [...profiles[currentUser].refunds, newRefund],
      },
    };

    saveProfiles(updatedProfiles);

    // Auto-switch to the month of the added refund
    const refundMonth = new Date(selectedDate).getMonth();
    if (refundMonth !== selectedMonth) {
      setSelectedMonth(refundMonth);
    }

    toast({
      title: "Refund Added",
      description: `Added ₹${amount} refund for ${refundFor}`,
    });
  };

  const updateRefund = (
    id: string,
    refundFor: string,
    amount: number,
    notes: string,
    tag?: string,
  ) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Update Refund",
        description:
          "Refunds cannot be updated in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        refunds: profiles[currentUser].refunds.map((refund) =>
          refund.id === id
            ? { ...refund, refundFor, amount, notes, tag }
            : refund,
        ),
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Refund Updated",
      description: `Updated refund for ${refundFor}`,
    });
  };

  const deleteRefund = (id: string) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Delete Refund",
        description:
          "Refunds cannot be deleted in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        refunds: profiles[currentUser].refunds.filter(
          (refund) => refund.id !== id,
        ),
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Refund Deleted",
      description: "Refund has been removed",
    });
  };

  const addInvestmentEntry = (
    portfolioId: string,
    categoryId: string | undefined,
    fundId: string | undefined,
    amount: number,
    notes: string,
    isDirectInvestment: boolean = false,
  ) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Add Investment",
        description:
          "Investments cannot be added in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const newEntry: InvestmentEntry = {
      id: Date.now().toString(),
      date: selectedDate,
      amount,
      notes,
      portfolioId,
      categoryId,
      fundId,
      isDirectInvestment,
    };

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        investmentEntries: [
          ...profiles[currentUser].investmentEntries,
          newEntry,
        ],
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Investment Added",
      description: `Added ₹${amount} investment`,
    });
  };

  const updateInvestmentEntry = (id: string, amount: number, notes: string) => {
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        investmentEntries: profiles[currentUser].investmentEntries.map(
          (entry) => (entry.id === id ? { ...entry, amount, notes } : entry),
        ),
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Investment Updated",
      description: "Investment entry has been updated",
    });
  };

  const deleteInvestmentEntry = (id: string) => {
    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        investmentEntries: profiles[currentUser].investmentEntries.filter(
          (entry) => entry.id !== id,
        ),
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Investment Deleted",
      description: "Investment entry has been removed",
    });
  };

  const getTagsForCategory = (category: string) => {
    const defaultTags =
      DEFAULT_TAGS[category as keyof typeof DEFAULT_TAGS] || [];

    let customTags = [];
    if (currentUser === "combined") {
      // Combine custom tags from both users
      const muraliTags = profiles.murali.customTags
        .filter((tag) => tag.startsWith(`${category}:`))
        .map((tag) => tag.split(":")[1]);
      const valarTags = profiles.valar.customTags
        .filter((tag) => tag.startsWith(`${category}:`))
        .map((tag) => tag.split(":")[1]);
      customTags = [...muraliTags, ...valarTags];
    } else {
      customTags = profiles[currentUser].customTags
        .filter((tag) => tag.startsWith(`${category}:`))
        .map((tag) => tag.split(":")[1]);
    }

    return [...defaultTags, ...customTags].sort();
  };

  const getTagColor = (tag: string) => {
    return (
      TAG_COLORS[tag as keyof typeof TAG_COLORS] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  // Bank balance management functions
  const getOpeningBalance = (month: number, year: number) => {
    if (currentUser === "combined") return 0;

    const balanceEntry = currentProfile.bankBalances.find(
      (entry) => entry.month === month && entry.year === year,
    );
    return balanceEntry?.openingBalance || 0;
  };

  const setOpeningBalance = (month: number, year: number, amount: number) => {
    if (currentUser === "combined") {
      toast({
        title: "Cannot Set Balance",
        description:
          "Bank balance cannot be set in combined view. Please switch to an individual profile.",
        variant: "destructive",
      });
      return;
    }

    const existingEntryIndex = currentProfile.bankBalances.findIndex(
      (entry) => entry.month === month && entry.year === year,
    );

    let updatedBalances = [...currentProfile.bankBalances];

    if (existingEntryIndex >= 0) {
      updatedBalances[existingEntryIndex].openingBalance = amount;
    } else {
      updatedBalances.push({ month, year, openingBalance: amount });
    }

    const updatedProfiles = {
      ...profiles,
      [currentUser]: {
        ...profiles[currentUser],
        bankBalances: updatedBalances,
      },
    };

    saveProfiles(updatedProfiles);

    toast({
      title: "Opening Balance Updated",
      description: `Set opening balance for ${monthNames[month]} ${year} to ₹${amount.toLocaleString()}`,
    });
  };

  const getCurrentMonthExpensesByCategory = () => {
    let currentMonthExpenses = [];
    let currentMonthRefunds = [];

    if (currentUser === "combined") {
      const muraliExpenses = profiles.murali.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth;
      });
      const valarExpenses = profiles.valar.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth;
      });
      currentMonthExpenses = [...muraliExpenses, ...valarExpenses];

      const muraliRefunds = profiles.murali.refunds.filter((refund) => {
        const refundDate = new Date(refund.date);
        return refundDate.getMonth() === selectedMonth;
      });
      const valarRefunds = profiles.valar.refunds.filter((refund) => {
        const refundDate = new Date(refund.date);
        return refundDate.getMonth() === selectedMonth;
      });
      currentMonthRefunds = [...muraliRefunds, ...valarRefunds];
    } else {
      currentMonthExpenses = currentProfile.expenses.filter((expense) => {
        const expenseDate = new Date(expense.date);
        return expenseDate.getMonth() === selectedMonth;
      });

      currentMonthRefunds = currentProfile.refunds.filter((refund) => {
        const refundDate = new Date(refund.date);
        return refundDate.getMonth() === selectedMonth;
      });
    }

    // Calculate net expenses (expenses minus refunds)
    const expensesByCategory = {
      need: currentMonthExpenses
        .filter((e) => e.category === "need")
        .reduce((sum, e) => sum + e.amount, 0),
      want: currentMonthExpenses
        .filter((e) => e.category === "want")
        .reduce((sum, e) => sum + e.amount, 0),
      savings: currentMonthExpenses
        .filter((e) => e.category === "savings")
        .reduce((sum, e) => sum + e.amount, 0),
    };

    const refundsByCategory = {
      need: currentMonthRefunds
        .filter((r) => r.category === "need")
        .reduce((sum, r) => sum + r.amount, 0),
      want: currentMonthRefunds
        .filter((r) => r.category === "want")
        .reduce((sum, r) => sum + r.amount, 0),
      savings: currentMonthRefunds
        .filter((r) => r.category === "savings")
        .reduce((sum, r) => sum + r.amount, 0),
    };

    return {
      need: Math.max(0, expensesByCategory.need - refundsByCategory.need),
      want: Math.max(0, expensesByCategory.want - refundsByCategory.want),
      savings: Math.max(
        0,
        expensesByCategory.savings - refundsByCategory.savings,
      ),
      investments: totalInvestmentSpent,
    };
  };

  const calculateCurrentBalance = () => {
    const openingBalance = getOpeningBalance(selectedMonth, selectedYear);
    const expenses = getCurrentMonthExpensesByCategory();
    const totalExpenses =
      expenses.need + expenses.want + expenses.savings + expenses.investments;

    return {
      openingBalance,
      totalExpenses,
      currentBalance: openingBalance - totalExpenses,
      expenses,
    };
  };

  const QuickStatsCard = ({
    title,
    amount,
    icon: Icon,
    variant = "default",
    change,
  }: any) => (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-300 transform hover:scale-[1.02] bg-gradient-to-br from-card to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon
          className={`h-5 w-5 ${
            variant === "success"
              ? "text-success"
              : variant === "warning"
                ? "text-warning"
                : variant === "destructive"
                  ? "text-destructive"
                  : "text-primary"
          }`}
        />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">
          ₹{amount.toLocaleString()}
        </div>
        {change && (
          <p
            className={`text-xs ${change >= 0 ? "text-success" : "text-destructive"}`}
          >
            {change >= 0 ? "+" : ""}
            {change}% from last month
          </p>
        )}
      </CardContent>
    </Card>
  );

  const CategoryProgressCard = ({
    title,
    icon: Icon,
    allocated,
    spent,
    variant = "default",
  }: {
    title: string;
    icon: any;
    allocated: number;
    spent: number;
    variant?: string;
  }) => {
    const remaining = allocated - spent;
    const progressPercentage =
      allocated > 0 ? Math.min((spent / allocated) * 100, 100) : 0;
    const isOverBudget = spent > allocated;

    return (
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon
                className={`h-5 w-5 ${
                  variant === "need"
                    ? "text-destructive"
                    : variant === "want"
                      ? "text-warning"
                      : variant === "savings"
                        ? "text-success"
                        : variant === "investments"
                          ? "text-primary"
                          : "text-muted-foreground"
                }`}
              />
              <span className="text-sm font-medium">{title}</span>
            </div>
            <span className="text-xs text-muted-foreground">
              {progressPercentage.toFixed(0)}%
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Progress
            value={progressPercentage}
            className={`h-2 ${isOverBudget ? "[&>div]:bg-destructive" : ""}`}
          />
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center">
              <p className="text-muted-foreground">Planned</p>
              <p className="font-semibold">₹{allocated.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Spent</p>
              <p
                className={`font-semibold ${isOverBudget ? "text-destructive" : "text-foreground"}`}
              >
                ₹{spent.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-muted-foreground">Remaining</p>
              <p
                className={`font-semibold ${
                  remaining >= 0 ? "text-success" : "text-destructive"
                }`}
              >
                ₹{remaining.toLocaleString()}
              </p>
            </div>
          </div>
          {isOverBudget && (
            <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
              Over budget by ₹{(spent - allocated).toLocaleString()}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const ConfigurationSection = ({
    onSalaryUpdate,
    currentSalary,
    currentBudgetPercentage,
    totalInvestmentAmount,
    currentUser,
    onInvestmentPlanUpdate,
    currentInvestmentPlan,
    isAuthenticated,
    setIsAuthenticated,
    currentProfile,
  }: {
    onSalaryUpdate: (
      salary: number,
      budgetPercentage: number,
      allocation: BudgetAllocation,
    ) => void;
    currentSalary: number;
    currentBudgetPercentage: number;
    totalInvestmentAmount: number;
    currentUser: string;
    onInvestmentPlanUpdate: (plan: InvestmentPlan) => void;
    currentInvestmentPlan: InvestmentPlan;
    isAuthenticated: boolean;
    setIsAuthenticated: (value: boolean) => void;
    currentProfile: UserProfile;
  }) => {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const SECRET_PASSWORD = "budget2024";

    const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (password === SECRET_PASSWORD) {
        setIsAuthenticated(true);
        toast({
          title: "Access Granted",
          description: "You can now access all configuration settings.",
        });
      } else {
        toast({
          title: "Access Denied",
          description: "Incorrect password. Please try again.",
          variant: "destructive",
        });
        setPassword("");
      }
    };

    if (!isAuthenticated) {
      return (
        <div className="max-w-md mx-auto mt-8">
          <Card className="shadow-card">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center gap-2 text-warning">
                <Lock className="h-6 w-6" />
                Secure Configuration Access
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Enter password to access salary and investment configuration
              </p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="config-password">Password</Label>
                  <div className="relative">
                    <Input
                      id="config-password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
                <Button type="submit" className="w-full" variant="default">
                  Access Configuration
                </Button>
              </form>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground text-center">
                  Demo password:{" "}
                  <code className="bg-background px-1 rounded">budget2024</code>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="p-4 bg-success/10 border border-success/30 rounded-lg">
          <p className="text-success font-medium">
            ✅ Authentication Successful
          </p>
          <p className="text-xs text-muted-foreground">
            You now have access to all configuration settings
          </p>
        </div>

        <ConfigurationInheritance
          onConfigurationsInherited={handleConfigurationsInherited}
          currentMonth={selectedMonth}
          currentYear={selectedYear}
        />

        <SalaryConfig
          onSalaryUpdate={onSalaryUpdate}
          currentSalary={currentSalary}
          currentBudgetPercentage={currentBudgetPercentage}
          currentBudgetAllocation={currentProfile.budgetAllocation}
        />

        <InvestmentConfig
          totalInvestmentAmount={totalInvestmentAmount}
          currentUser={currentUser}
          onInvestmentPlanUpdate={onInvestmentPlanUpdate}
          currentInvestmentPlan={currentInvestmentPlan}
        />
      </div>
    );
  };

  const InvestmentEntryDialog = () => {
    const [open, setOpen] = useState(false);
    const [selectedPortfolio, setSelectedPortfolio] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");
    const [selectedFund, setSelectedFund] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");

    const availablePortfolios = currentProfile.investmentPlan.portfolios;
    const selectedPortfolioData = selectedPortfolio
      ? availablePortfolios.find((p) => p.id === selectedPortfolio)
      : null;
    const isDirectInvestment =
      selectedPortfolioData?.allowDirectInvestment || false;

    const availableCategories =
      selectedPortfolio && !isDirectInvestment
        ? selectedPortfolioData?.categories || []
        : [];
    const availableFunds =
      selectedCategory && !isDirectInvestment
        ? availableCategories.find((c) => c.id === selectedCategory)?.funds ||
          []
        : [];

    const resetForm = () => {
      setSelectedPortfolio("");
      setSelectedCategory("");
      setSelectedFund("");
      setAmount("");
      setNotes("");
    };

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      // Validation based on investment type
      if (!selectedPortfolio || !amount) {
        toast({
          title: "Missing Information",
          description: "Please select portfolio and enter amount",
          variant: "destructive",
        });
        return;
      }

      if (!isDirectInvestment && (!selectedCategory || !selectedFund)) {
        toast({
          title: "Missing Information",
          description: "Please select category and fund for this portfolio",
          variant: "destructive",
        });
        return;
      }

      addInvestmentEntry(
        selectedPortfolio,
        isDirectInvestment ? undefined : selectedCategory,
        isDirectInvestment ? undefined : selectedFund,
        parseFloat(amount),
        notes,
        isDirectInvestment,
      );
      resetForm();
      setOpen(false);
    };

    const handlePortfolioChange = (portfolioId: string) => {
      setSelectedPortfolio(portfolioId);
      setSelectedCategory("");
      setSelectedFund("");
    };

    const handleCategoryChange = (categoryId: string) => {
      setSelectedCategory(categoryId);
      setSelectedFund("");
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Investment
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when interacting with date picker
            const target = e.target as Element;
            if (
              target?.closest('[role="dialog"]') ||
              target?.closest(".react-datepicker")
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Add Investment Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">Portfolio *</Label>
              <Select
                value={selectedPortfolio}
                onValueChange={handlePortfolioChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  {availablePortfolios.map((portfolio) => (
                    <SelectItem key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedPortfolio && isDirectInvestment && (
              <div className="p-3 bg-primary/10 border border-primary/30 rounded-lg">
                <p className="text-sm text-primary font-medium">
                  Direct Investment Portfolio
                </p>
                <p className="text-xs text-muted-foreground">
                  This portfolio allows direct investments without categories or
                  funds.
                </p>
              </div>
            )}
            {selectedPortfolio && !isDirectInvestment && (
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCategories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {selectedCategory && !isDirectInvestment && (
              <div className="space-y-2">
                <Label htmlFor="fund">Fund *</Label>
                <Select value={selectedFund} onValueChange={setSelectedFund}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a fund" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableFunds.map((fund) => (
                      <SelectItem key={fund.id} value={fund.id}>
                        {fund.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit">Add Investment</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const RefundEntryDialog = ({
    category,
    categoryTitle,
    icon: Icon,
  }: {
    category: string;
    categoryTitle: string;
    icon: any;
  }) => {
    const [open, setOpen] = useState(false);
    const [refundFor, setRefundFor] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const [customTag, setCustomTag] = useState("");
    const [showCustomTag, setShowCustomTag] = useState(false);

    const tags = getTagsForCategory(category);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!refundFor || !amount || !selectedTag) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields including tag",
          variant: "destructive",
        });
        return;
      }

      let finalTag = selectedTag;
      if (selectedTag === "Others" && customTag) {
        finalTag = customTag;
        addCustomTag(category, customTag);
      }

      addRefund(category, refundFor, parseFloat(amount), notes, finalTag);
      setRefundFor("");
      setAmount("");
      setNotes("");
      setSelectedTag("");
      setCustomTag("");
      setShowCustomTag(false);
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Add {categoryTitle} Refund
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when interacting with date picker
            const target = e.target as Element;
            if (
              target?.closest('[role="dialog"]') ||
              target?.closest(".react-datepicker")
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Add {categoryTitle} Refund
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="refund-date">Date</Label>
              <Input
                id="refund-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refundFor">Refund For *</Label>
              <Input
                id="refundFor"
                value={refundFor}
                onChange={(e) => setRefundFor(e.target.value)}
                placeholder="What was the refund for?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-amount">Amount *</Label>
              <Input
                id="refund-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="refund-tag">Tag *</Label>
              <Select
                value={selectedTag}
                onValueChange={(value) => {
                  setSelectedTag(value);
                  setShowCustomTag(value === "Others");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCustomTag && (
              <div className="space-y-2">
                <Label htmlFor="refund-customTag">Custom Tag Name *</Label>
                <Input
                  id="refund-customTag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Enter custom tag name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="refund-notes">Notes</Label>
              <Textarea
                id="refund-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes about the refund (optional)"
                rows={3}
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
              <Button type="submit">Add Refund</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const ExpenseEntryDialog = ({
    category,
    categoryTitle,
    icon: Icon,
  }: {
    category: string;
    categoryTitle: string;
    icon: any;
  }) => {
    const [open, setOpen] = useState(false);
    const [spentFor, setSpentFor] = useState("");
    const [amount, setAmount] = useState("");
    const [notes, setNotes] = useState("");
    const [selectedTag, setSelectedTag] = useState("");
    const [customTag, setCustomTag] = useState("");
    const [paymentType, setPaymentType] = useState("SENT BY ME");
    const [showCustomTag, setShowCustomTag] = useState(false);

    const tags = getTagsForCategory(category);
    const paymentOptions =
      currentUser === "murali"
        ? ["SENT BY ME", "SENT TO VALAR"]
        : ["SENT BY ME", "SENT TO MURALI"];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!spentFor || !amount || !selectedTag) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields including tag",
          variant: "destructive",
        });
        return;
      }

      let finalTag = selectedTag;
      if (selectedTag === "Others" && customTag) {
        finalTag = customTag;
        addCustomTag(category, customTag);
      }

      addExpense(
        category,
        spentFor,
        parseFloat(amount),
        notes,
        finalTag,
        paymentType,
      );
      setSpentFor("");
      setAmount("");
      setNotes("");
      setSelectedTag("");
      setCustomTag("");
      setPaymentType("SENT BY ME");
      setShowCustomTag(false);
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Add {categoryTitle} Entry
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when interacting with date picker
            const target = e.target as Element;
            if (
              target?.closest('[role="dialog"]') ||
              target?.closest(".react-datepicker")
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Icon className="h-5 w-5" />
              Add {categoryTitle} Entry
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="spentFor">Spent For *</Label>
              <Input
                id="spentFor"
                value={spentFor}
                onChange={(e) => setSpentFor(e.target.value)}
                placeholder="What did you spend on?"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount *</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tag">Tag *</Label>
              <Select
                value={selectedTag}
                onValueChange={(value) => {
                  setSelectedTag(value);
                  setShowCustomTag(value === "Others");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCustomTag && (
              <div className="space-y-2">
                <Label htmlFor="customTag">Custom Tag Name *</Label>
                <Input
                  id="customTag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Enter custom tag name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                {paymentOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional notes (optional)"
                rows={3}
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
              <Button type="submit">Add Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const EditExpenseDialog = ({ expense }: { expense: ExpenseEntry }) => {
    const [open, setOpen] = useState(false);
    const [spentFor, setSpentFor] = useState(expense.spentFor);
    const [amount, setAmount] = useState(expense.amount.toString());
    const [notes, setNotes] = useState(expense.notes);
    const [selectedTag, setSelectedTag] = useState(expense.tag || "");
    const [customTag, setCustomTag] = useState("");
    const [paymentType, setPaymentType] = useState(
      expense.paymentType || "SENT BY ME",
    );
    const [showCustomTag, setShowCustomTag] = useState(false);

    const tags = getTagsForCategory(expense.category);
    const paymentOptions =
      currentUser === "murali"
        ? ["SENT BY ME", "SENT TO VALAR"]
        : ["SENT BY ME", "SENT TO MURALI"];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!spentFor || !amount || !selectedTag) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields including tag",
          variant: "destructive",
        });
        return;
      }

      let finalTag = selectedTag;
      if (selectedTag === "Others" && customTag) {
        finalTag = customTag;
        addCustomTag(expense.category, customTag);
      }

      updateExpense(
        expense.id,
        spentFor,
        parseFloat(amount),
        notes,
        finalTag,
        paymentType,
      );
      setOpen(false);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        </DialogTrigger>
        <DialogContent
          className="max-w-md"
          onInteractOutside={(e) => {
            // Prevent dialog from closing when interacting with date picker
            const target = e.target as Element;
            if (
              target?.closest('[role="dialog"]') ||
              target?.closest(".react-datepicker")
            ) {
              e.preventDefault();
            }
          }}
        >
          <DialogHeader>
            <DialogTitle>Edit Expense</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-spentFor">Spent For *</Label>
              <Input
                id="edit-spentFor"
                value={spentFor}
                onChange={(e) => setSpentFor(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount *</Label>
              <Input
                id="edit-amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-tag">Tag *</Label>
              <Select
                value={selectedTag}
                onValueChange={(value) => {
                  setSelectedTag(value);
                  setShowCustomTag(value === "Others");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a tag" />
                </SelectTrigger>
                <SelectContent>
                  {tags.map((tag) => (
                    <SelectItem key={tag} value={tag}>
                      {tag}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {showCustomTag && (
              <div className="space-y-2">
                <Label htmlFor="edit-customTag">Custom Tag Name *</Label>
                <Input
                  id="edit-customTag"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  placeholder="Enter custom tag name"
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label>Payment Type *</Label>
              <RadioGroup value={paymentType} onValueChange={setPaymentType}>
                {paymentOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={`edit-${option}`} />
                    <Label htmlFor={`edit-${option}`}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
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
              <Button type="submit">Update Entry</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const BankBalanceTracker = () => {
    const [newOpeningBalance, setNewOpeningBalance] = useState("");
    const balanceData = calculateCurrentBalance();

    const handleSetOpeningBalance = (e: React.FormEvent) => {
      e.preventDefault();
      if (!newOpeningBalance || parseFloat(newOpeningBalance) < 0) {
        toast({
          title: "Invalid Amount",
          description: "Please enter a valid opening balance amount",
          variant: "destructive",
        });
        return;
      }

      setOpeningBalance(
        selectedMonth,
        selectedYear,
        parseFloat(newOpeningBalance),
      );
      setNewOpeningBalance("");
    };

    return (
      <div className="space-y-6">
        {/* Opening Balance Setting */}
        <Card className="border-l-4 border-l-primary">
          <CardHeader>
            <CardTitle className="text-lg">
              Set Opening Balance for {monthNames[selectedMonth]} {selectedYear}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Enter your bank balance at the beginning of the month
            </p>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSetOpeningBalance}
              className="flex items-end gap-4"
            >
              <div className="flex-1">
                <Label htmlFor="opening-balance">Opening Balance (₹)</Label>
                <Input
                  id="opening-balance"
                  type="number"
                  step="0.01"
                  value={newOpeningBalance}
                  onChange={(e) => setNewOpeningBalance(e.target.value)}
                  placeholder={
                    balanceData.openingBalance > 0
                      ? balanceData.openingBalance.toString()
                      : "Enter amount"
                  }
                  className="mt-1"
                />
              </div>
              <Button type="submit" className="mb-0">
                {balanceData.openingBalance > 0 ? "Update" : "Set"} Balance
              </Button>
            </form>
            {balanceData.openingBalance > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                Current opening balance: ₹
                {balanceData.openingBalance.toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Balance Summary */}
        <Card className="shadow-card bg-gradient-to-r from-primary/5 to-success/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Bank Balance Summary for {monthNames[selectedMonth]}{" "}
              {selectedYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Opening Balance</p>
                <p className="text-2xl font-bold text-primary">
                  ��{balanceData.openingBalance.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-destructive">
                  ₹{balanceData.totalExpenses.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Balance</p>
                <p
                  className={`text-2xl font-bold ${balanceData.currentBalance >= 0 ? "text-success" : "text-destructive"}`}
                >
                  ₹{balanceData.currentBalance.toLocaleString()}
                </p>
              </div>
              <div className="text-center p-4 bg-background/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Balance Status</p>
                <p
                  className={`text-lg font-semibold ${balanceData.currentBalance >= 0 ? "text-success" : "text-destructive"}`}
                >
                  {balanceData.currentBalance >= 0 ? "Positive" : "Negative"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {balanceData.openingBalance > 0
                    ? `${((Math.abs(balanceData.currentBalance) / balanceData.openingBalance) * 100).toFixed(1)}%`
                    : "Set opening balance"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Expense Breakdown */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <p className="text-sm text-muted-foreground">
              How your expenses are affecting your bank balance this month
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center justify-between p-3 bg-destructive/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-destructive" />
                    <span className="font-medium">Need</span>
                  </div>
                  <span className="font-bold text-destructive">
                    -₹{balanceData.expenses.need.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Music className="h-4 w-4 text-warning" />
                    <span className="font-medium">Want</span>
                  </div>
                  <span className="font-bold text-warning">
                    -₹{balanceData.expenses.want.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-success/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PiggyBank className="h-4 w-4 text-success" />
                    <span className="font-medium">Savings</span>
                  </div>
                  <span className="font-bold text-success">
                    -₹{balanceData.expenses.savings.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span className="font-medium">Investments</span>
                  </div>
                  <span className="font-bold text-primary">
                    -₹{balanceData.expenses.investments.toLocaleString()}
                  </span>
                </div>
              </div>

              {balanceData.openingBalance > 0 && (
                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-muted-foreground/20"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="bg-background px-2 text-muted-foreground">
                        Balance Calculation
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 p-4 bg-muted/20 rounded-lg">
                    <div className="flex items-center justify-between text-sm">
                      <span>Opening Balance:</span>
                      <span className="font-semibold">
                        ₹{balanceData.openingBalance.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-1">
                      <span>Total Expenses:</span>
                      <span className="font-semibold text-destructive">
                        -₹{balanceData.totalExpenses.toLocaleString()}
                      </span>
                    </div>
                    <div className="border-t border-muted-foreground/20 mt-2 pt-2">
                      <div className="flex items-center justify-between font-bold">
                        <span>Current Balance:</span>
                        <span
                          className={
                            balanceData.currentBalance >= 0
                              ? "text-success"
                              : "text-destructive"
                          }
                        >
                          ₹{balanceData.currentBalance.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const InvestmentTrackingView = () => {
    const availablePortfolios = currentProfile.investmentPlan.portfolios;

    if (availablePortfolios.length === 0) {
      return (
        <div className="text-center py-8">
          <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
          <h3 className="text-lg font-semibold text-muted-foreground mb-2">
            No Investment Plan Configured
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Please configure your investment plan in the Configuration tab to
            start tracking investments.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowConfigHint(true)}
            className="mx-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Go to Configuration
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {availablePortfolios.map((portfolio) => {
          const portfolioInvested =
            investmentAmounts.portfolioInvested.get(portfolio.id) || 0;
          const portfolioRemaining =
            portfolio.allocatedAmount - portfolioInvested;
          const portfolioProgress =
            portfolio.allocatedAmount > 0
              ? (portfolioInvested / portfolio.allocatedAmount) * 100
              : 0;

          return (
            <Card key={portfolio.id} className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{portfolio.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span>
                        Allocated: ₹{portfolio.allocatedAmount.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span className="text-primary">
                        Invested: ₹{portfolioInvested.toLocaleString()}
                      </span>
                      <span>•</span>
                      <span
                        className={
                          portfolioRemaining >= 0
                            ? "text-success"
                            : "text-destructive"
                        }
                      >
                        Remaining: ₹{portfolioRemaining.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">
                      Progress
                    </span>
                    <p className="text-lg font-bold">
                      {portfolioProgress.toFixed(1)}%
                    </p>
                  </div>
                </CardTitle>
                <Progress
                  value={Math.min(portfolioProgress, 100)}
                  className="mt-2"
                />
              </CardHeader>
              <CardContent className="space-y-4">
                {portfolio.allowDirectInvestment ? (
                  <div className="p-4 bg-primary/10 border border-primary/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-primary">
                          Direct Investment Portfolio
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          Investments are tracked directly at portfolio level
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
                ) : (
                  portfolio.categories.map((category) => {
                    const categoryInvested =
                      investmentAmounts.categoryInvested.get(category.id) || 0;
                    const categoryRemaining =
                      category.allocatedAmount - categoryInvested;
                    const categoryProgress =
                      category.allocatedAmount > 0
                        ? (categoryInvested / category.allocatedAmount) * 100
                        : 0;

                    return (
                      <Card
                        key={category.id}
                        className="border-l-4 border-l-secondary"
                      >
                        <CardHeader className="pb-3">
                          <CardTitle className="text-base">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{category.name}</h4>
                                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                  <span>
                                    Allocated: ₹
                                    {category.allocatedAmount.toLocaleString()}
                                  </span>
                                  <span>•</span>
                                  <span className="text-primary">
                                    Invested: ₹
                                    {categoryInvested.toLocaleString()}
                                  </span>
                                  <span>•</span>
                                  <span
                                    className={
                                      categoryRemaining >= 0
                                        ? "text-success"
                                        : "text-destructive"
                                    }
                                  >
                                    Remaining: ��
                                    {categoryRemaining.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-xs text-muted-foreground">
                                  Progress
                                </span>
                                <p className="text-sm font-bold">
                                  {categoryProgress.toFixed(1)}%
                                </p>
                              </div>
                            </div>
                          </CardTitle>
                          <Progress
                            value={Math.min(categoryProgress, 100)}
                            className="mt-2"
                          />
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2">
                            {category.funds.map((fund) => {
                              const fundInvested =
                                investmentAmounts.fundInvested.get(fund.id) ||
                                0;
                              const fundRemaining =
                                fund.allocatedAmount - fundInvested;
                              const fundProgress =
                                fund.allocatedAmount > 0
                                  ? (fundInvested / fund.allocatedAmount) * 100
                                  : 0;

                              return (
                                <div
                                  key={fund.id}
                                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                                >
                                  <div className="flex-1">
                                    <p className="font-medium text-sm">
                                      {fund.name}
                                    </p>
                                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                                      <span>
                                        Allocated: ₹
                                        {fund.allocatedAmount.toLocaleString()}
                                      </span>
                                      <span>•</span>
                                      <span className="text-primary">
                                        Invested: ₹
                                        {fundInvested.toLocaleString()}
                                      </span>
                                      <span>•</span>
                                      <span
                                        className={
                                          fundRemaining >= 0
                                            ? "text-success"
                                            : "text-destructive"
                                        }
                                      >
                                        Remaining: ₹
                                        {fundRemaining.toLocaleString()}
                                      </span>
                                    </div>
                                    <Progress
                                      value={Math.min(fundProgress, 100)}
                                      className="mt-2"
                                    />
                                  </div>
                                  <div className="text-right ml-4">
                                    <span className="text-xs text-muted-foreground">
                                      Progress
                                    </span>
                                    <p className="text-sm font-bold">
                                      {fundProgress.toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  const ExpenseAndRefundTable = ({
    category,
    categoryTitle,
  }: {
    category: string;
    categoryTitle: string;
  }) => {
    let categoryExpenses = [];
    let categoryRefunds = [];

    if (currentUser === "combined") {
      // Combine expenses from both users and add user info
      const muraliExpenses = profiles.murali.expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          const matchesCategory = expense.category === category;
          const matchesMonth =
            expenseDate.getMonth() === selectedMonth &&
            expenseDate.getFullYear() === selectedYear;
          const matchesDateFilter = !filterDate || expense.date === filterDate;
          return matchesCategory && matchesMonth && matchesDateFilter;
        })
        .map((expense) => ({
          ...expense,
          userName: "Murali",
          type: "expense",
        }));

      const valarExpenses = profiles.valar.expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          const matchesCategory = expense.category === category;
          const matchesMonth =
            expenseDate.getMonth() === selectedMonth &&
            expenseDate.getFullYear() === selectedYear;
          const matchesDateFilter = !filterDate || expense.date === filterDate;
          return matchesCategory && matchesMonth && matchesDateFilter;
        })
        .map((expense) => ({ ...expense, userName: "Valar", type: "expense" }));

      // Combine refunds from both users
      const muraliRefunds = profiles.murali.refunds
        .filter((refund) => {
          const refundDate = new Date(refund.date);
          const matchesCategory = refund.category === category;
          const matchesMonth =
            refundDate.getMonth() === selectedMonth &&
            refundDate.getFullYear() === selectedYear;
          const matchesDateFilter = !filterDate || refund.date === filterDate;
          return matchesCategory && matchesMonth && matchesDateFilter;
        })
        .map((refund) => ({
          ...refund,
          userName: "Murali",
          type: "refund",
          spentFor: refund.refundFor,
        }));

      const valarRefunds = profiles.valar.refunds
        .filter((refund) => {
          const refundDate = new Date(refund.date);
          const matchesCategory = refund.category === category;
          const matchesMonth =
            refundDate.getMonth() === selectedMonth &&
            refundDate.getFullYear() === selectedYear;
          const matchesDateFilter = !filterDate || refund.date === filterDate;
          return matchesCategory && matchesMonth && matchesDateFilter;
        })
        .map((refund) => ({
          ...refund,
          userName: "Valar",
          type: "refund",
          spentFor: refund.refundFor,
        }));

      const allEntries = [
        ...muraliExpenses,
        ...valarExpenses,
        ...muraliRefunds,
        ...valarRefunds,
      ];
      categoryExpenses = allEntries.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    } else {
      const expenses = currentProfile.expenses
        .filter((expense) => {
          const expenseDate = new Date(expense.date);
          const matchesCategory = expense.category === category;
          const matchesMonth =
            expenseDate.getMonth() === selectedMonth &&
            expenseDate.getFullYear() === selectedYear;
          const matchesDateFilter = !filterDate || expense.date === filterDate;
          return matchesCategory && matchesMonth && matchesDateFilter;
        })
        .map((expense) => ({ ...expense, type: "expense" }));

      const refunds = currentProfile.refunds
        .filter((refund) => {
          const refundDate = new Date(refund.date);
          const matchesCategory = refund.category === category;
          const matchesMonth =
            refundDate.getMonth() === selectedMonth &&
            refundDate.getFullYear() === selectedYear;
          const matchesDateFilter = !filterDate || refund.date === filterDate;
          return matchesCategory && matchesMonth && matchesDateFilter;
        })
        .map((refund) => ({
          ...refund,
          type: "refund",
          spentFor: refund.refundFor,
        }));

      categoryExpenses = [...expenses, ...refunds].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{categoryTitle} Entries</h3>
          <div className="flex items-center space-x-2">
            <Input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-auto"
              placeholder="Filter by date"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFilterDate("")}
            >
              Clear
            </Button>
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">S.No</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                {currentUser === "combined" && <TableHead>User</TableHead>}
                <TableHead>Tag</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Type</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-24">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryExpenses.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={currentUser === "combined" ? 10 : 9}
                    className="text-center text-muted-foreground py-8"
                  >
                    No entries found for {categoryTitle.toLowerCase()}
                  </TableCell>
                </TableRow>
              ) : (
                categoryExpenses.map((expense, index) => (
                  <TableRow
                    key={expense.id}
                    className={`${expense.tag ? getTagColor(expense.tag) : ""} ${expense.type === "refund" ? "bg-green-50 border-l-4 border-l-green-500" : ""}`}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      {new Date(expense.date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          expense.type === "refund" ? "default" : "secondary"
                        }
                        className={`text-xs ${expense.type === "refund" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
                      >
                        {expense.type === "refund" ? "Refund" : "Expense"}
                      </Badge>
                    </TableCell>
                    {currentUser === "combined" && (
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${expense.userName === "Murali" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}
                        >
                          {expense.userName}
                        </Badge>
                      </TableCell>
                    )}
                    <TableCell>
                      {expense.tag && (
                        <Badge
                          variant="outline"
                          className={getTagColor(expense.tag)}
                        >
                          {expense.tag}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{expense.spentFor}</TableCell>
                    <TableCell
                      className={
                        expense.type === "refund"
                          ? "text-green-600 font-semibold"
                          : ""
                      }
                    >
                      {expense.type === "refund" ? "+" : "-"}₹
                      {expense.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {expense.type === "expense" && (
                        <Badge variant="secondary" className="text-xs">
                          {expense.paymentType || "SENT BY ME"}
                        </Badge>
                      )}
                      {expense.type === "refund" && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-100 text-green-800"
                        >
                          Refund
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {expense.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {expense.type === "expense" ? (
                          <>
                            <EditExpenseDialog expense={expense} />
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Expense
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete this expense
                                    entry? This action cannot be undone.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteExpense(expense.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    Delete
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        ) : (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Refund
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this refund
                                  entry? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteRefund(expense.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  // Show loading state while fetching data
  if (dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-bg p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your budget data...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show connection status if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-bg p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="text-center py-12">
            <Card className="max-w-md mx-auto">
              <CardContent className="pt-6">
                <UserCheck className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">
                  Authentication Required
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Please sign in to access your budget data stored in Supabase.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-bg">
      {/* Header */}
      <div className="bg-card shadow-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-primary p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">
                  Budget Tracker
                </h1>
                {user && budgetConfig?.id !== "local" ? (
                  <Badge variant="default" className="text-xs bg-success">
                    Supabase Connected
                  </Badge>
                ) : user && budgetConfig?.id === "local" ? (
                  <Badge
                    variant="secondary"
                    className="text-xs bg-warning text-warning-foreground"
                  >
                    Offline Mode
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    Local Mode Only
                  </Badge>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">
                    Profile:
                  </span>
                  <ToggleGroup
                    type="single"
                    value={currentUser}
                    onValueChange={handleProfileChange}
                    className="border border-border rounded-md"
                  >
                    <ToggleGroupItem
                      value="murali"
                      aria-label="Murali's Profile"
                      className="text-xs px-3 py-1"
                    >
                      Murali
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="valar"
                      aria-label="Valar's Profile"
                      className="text-xs px-3 py-1"
                    >
                      Valar
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="combined"
                      aria-label="Combined Profile"
                      className="text-xs px-3 py-1"
                    >
                      Combined
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <Badge variant="outline" className="text-sm">
                  {currentUser === "combined"
                    ? "Combined View"
                    : `${currentProfile.name}'s Profile`}
                </Badge>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {monthNames.map((month, index) => (
                  <option key={index} value={index}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-background border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {Array.from(
                  { length: 10 },
                  (_, i) => new Date().getFullYear() - 5 + i,
                ).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* No Data Message */}
        {!allocatedAmounts.hasData && !budgetConfig && (
          <Card className="border-muted-foreground/20 bg-muted/5 mb-6">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-xl text-foreground">
                    No Data for {monthNames[selectedMonth]} {selectedYear}
                  </h3>
                  <p className="text-muted-foreground max-w-lg mx-auto">
                    There are no budget configurations or transactions recorded
                    for this month and year. To get started, you can either
                    inherit configurations from a previous period or set up new
                    ones.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Button
                    onClick={() => setIsConfigAuthenticated(true)}
                    variant="default"
                    className="flex items-center gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Set Up New Configuration
                  </Button>
                  <Button
                    onClick={() => {
                      const currentDate = new Date();
                      setSelectedMonth(currentDate.getMonth());
                      setSelectedYear(currentDate.getFullYear());
                    }}
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Calendar className="h-4 w-4" />
                    Go to Current Month
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-4 p-3 bg-muted/10 rounded-lg">
                  <p className="font-medium mb-2">
                    💡 Budget data is shown when:
                  </p>
                  <div className="space-y-1">
                    <p>
                      • It's the current month (
                      {monthNames[new Date().getMonth()]}{" "}
                      {new Date().getFullYear()})
                    </p>
                    <p>
                      • There are recorded transactions for the selected period
                    </p>
                    <p>
                      • Configurations have been inherited or set up for this
                      period
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Show quick stats only if we have data or it's current month */}
        {(allocatedAmounts.hasData || budgetConfig) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <QuickStatsCard
              title="Total Budget"
              amount={calculatedTotalBudget}
              icon={Target}
              variant="default"
              change={5.2}
            />
            <QuickStatsCard
              title="Need (Essential)"
              amount={allocatedAmounts.need}
              icon={Home}
              variant="destructive"
            />
            <QuickStatsCard
              title="Want (Discretionary)"
              amount={allocatedAmounts.want}
              icon={Music}
              variant="warning"
            />
            <QuickStatsCard
              title="Savings"
              amount={allocatedAmounts.savings}
              icon={PiggyBank}
              variant="success"
            />
            <QuickStatsCard
              title="Investments"
              amount={allocatedAmounts.investments}
              icon={TrendingUp}
              variant="default"
            />
          </div>
        )}

        {/* Main Navigation Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-muted p-1 rounded-lg">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="need" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              <span className="hidden sm:inline">Need</span>
            </TabsTrigger>
            <TabsTrigger value="want" className="flex items-center gap-2">
              <Music className="h-4 w-4" />
              <span className="hidden sm:inline">Want</span>
            </TabsTrigger>
            <TabsTrigger value="savings" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              <span className="hidden sm:inline">Savings</span>
            </TabsTrigger>
            <TabsTrigger
              value="investments"
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Investments</span>
            </TabsTrigger>
            <TabsTrigger
              value="transactions"
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              <span className="hidden sm:inline">Bank & Transactions</span>
            </TabsTrigger>
            <TabsTrigger
              value="config"
              className="flex items-center gap-2 text-warning"
              title="Salary Configuration (Password Protected)"
            >
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-6">
              {/* Data Source Status */}
              {!user && (
                <Card className="border-warning/50 bg-warning/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-warning/20 rounded-lg">
                        <UserCheck className="h-5 w-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-warning mb-2">
                          Supabase Integration Required
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Your data is currently stored locally. For full
                          functionality including proper month/year filtering
                          and data synchronization, you need to set up Supabase:
                        </p>
                        <div className="bg-background/50 rounded-lg p-3 mb-3">
                          <h4 className="font-medium text-sm mb-2">
                            Quick Setup:
                          </h4>
                          <ol className="text-xs text-muted-foreground list-decimal list-inside space-y-1">
                            <li>
                              Create a Supabase project at{" "}
                              <code className="bg-muted px-1 rounded">
                                supabase.com
                              </code>
                            </li>
                            <li>
                              Add environment variables to{" "}
                              <code className="bg-muted px-1 rounded">
                                .env.local
                              </code>
                              :
                            </li>
                            <div className="bg-muted/50 p-2 rounded mt-1 mb-1">
                              <code className="text-xs">
                                VITE_SUPABASE_URL=your_project_url
                                <br />
                                VITE_SUPABASE_ANON_KEY=your_anon_key
                              </code>
                            </div>
                            <li>
                              Run database migrations:{" "}
                              <code className="bg-muted px-1 rounded">
                                supabase db push
                              </code>
                            </li>
                            <li>Restart the application</li>
                          </ol>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          See <code>SUPABASE_SETUP.md</code> for detailed
                          instructions
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user && budgetConfig?.id !== "local" && (
                <Card className="border-success/50 bg-success/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-success/20 rounded-lg">
                        <UserCheck className="h-5 w-5 text-success" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-success mb-1">
                          Supabase Connected
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Your data is now synchronized with Supabase and will
                          update when you change months or years. All budget
                          configurations and transactions are saved to the
                          cloud.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {user && budgetConfig?.id === "local" && (
                <Card className="border-warning/50 bg-warning/5">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-warning/20 rounded-lg">
                        <Lock className="h-5 w-5 text-warning" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-warning mb-1">
                          Running in Offline Mode
                        </h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Supabase connection failed. Using local data for now.
                        </p>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>💡 Common fixes:</p>
                          <p>• Check if your Supabase project is active</p>
                          <p>• Free tier projects pause after inactivity</p>
                          <p>
                            • Visit{" "}
                            <a
                              href="https://supabase.com/dashboard"
                              target="_blank"
                              className="text-primary hover:underline"
                            >
                              Supabase Dashboard
                            </a>{" "}
                            to wake it up
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Budget Category Progress Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <CategoryProgressCard
                  title="Need (Essential)"
                  icon={Home}
                  allocated={allocatedAmounts.need}
                  spent={categorySpending.need}
                  variant="need"
                />
                <CategoryProgressCard
                  title="Want (Discretionary)"
                  icon={Music}
                  allocated={allocatedAmounts.want}
                  spent={categorySpending.want}
                  variant="want"
                />
                <CategoryProgressCard
                  title="Savings"
                  icon={PiggyBank}
                  allocated={allocatedAmounts.savings}
                  spent={categorySpending.savings}
                  variant="savings"
                />
                <CategoryProgressCard
                  title="Investments"
                  icon={TrendingUp}
                  allocated={allocatedAmounts.investments}
                  spent={totalInvestmentSpent}
                  variant="investments"
                />
              </div>

              {/* Overall Summary */}
              <Card className="shadow-card bg-gradient-to-r from-primary/5 to-success/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    {currentUser === "combined"
                      ? "Combined Budget Summary"
                      : "Monthly Budget Summary"}
                  </CardTitle>
                  {currentUser === "combined" && (
                    <p className="text-sm text-muted-foreground">
                      Combined view showing total budget and expenses for both
                      Murali and Valar
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Total Allocated
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        ₹{calculatedTotalBudget.toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        Total Spent
                      </p>
                      <p className="text-2xl font-bold text-destructive">
                        ₹{totalSpent.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Need + Want + Savings + Investments
                      </p>
                    </div>
                    <div className="text-center p-4 bg-background/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Remaining</p>
                      <p className="text-2xl font-bold text-accent">
                        ₹{totalRemaining.toLocaleString()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Total Allocated - Total Spent
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="need">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <Home className="h-6 w-6" />
                    Need (Essential Expenses)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your essential expenses like rent, utilities,
                    groceries, insurance
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Need Progress"
                      icon={Home}
                      allocated={allocatedAmounts.need}
                      spent={categorySpending.need}
                      variant="need"
                    />
                  </div>
                  {currentUser === "combined" ? (
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/50">
                      <p className="text-sm text-muted-foreground text-center">
                        Switch to an individual profile to add new expenses
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <ExpenseEntryDialog
                        category="need"
                        categoryTitle="Need"
                        icon={Home}
                      />
                      <RefundEntryDialog
                        category="need"
                        categoryTitle="Need"
                        icon={Home}
                      />
                    </div>
                  )}
                  <ExpenseAndRefundTable category="need" categoryTitle="Need" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="want">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-warning">
                    <Music className="h-6 w-6" />
                    Want (Discretionary Expenses)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your discretionary spending like entertainment, dining
                    out, hobbies
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Want Progress"
                      icon={Music}
                      allocated={allocatedAmounts.want}
                      spent={categorySpending.want}
                      variant="want"
                    />
                  </div>
                  {currentUser === "combined" ? (
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/50">
                      <p className="text-sm text-muted-foreground text-center">
                        Switch to an individual profile to add new expenses
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <ExpenseEntryDialog
                        category="want"
                        categoryTitle="Want"
                        icon={Music}
                      />
                      <RefundEntryDialog
                        category="want"
                        categoryTitle="Want"
                        icon={Music}
                      />
                    </div>
                  )}
                  <ExpenseAndRefundTable category="want" categoryTitle="Want" />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="savings">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-success">
                    <PiggyBank className="h-6 w-6" />
                    Savings (Emergency Fund)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your savings contributions and emergency fund building
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Savings Progress"
                      icon={PiggyBank}
                      allocated={allocatedAmounts.savings}
                      spent={categorySpending.savings}
                      variant="savings"
                    />
                  </div>
                  {currentUser === "combined" ? (
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/50">
                      <p className="text-sm text-muted-foreground text-center">
                        Switch to an individual profile to add new expenses
                      </p>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <ExpenseEntryDialog
                        category="savings"
                        categoryTitle="Savings"
                        icon={PiggyBank}
                      />
                      <RefundEntryDialog
                        category="savings"
                        categoryTitle="Savings"
                        icon={PiggyBank}
                      />
                    </div>
                  )}
                  <ExpenseAndRefundTable
                    category="savings"
                    categoryTitle="Savings"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="investments">
            <div className="space-y-6">
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-6 w-6" />
                    Investments (Portfolio Tracking)
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Track your investments across portfolios, categories, and
                    funds
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="mb-6">
                    <CategoryProgressCard
                      title="Overall Investment Progress"
                      icon={TrendingUp}
                      allocated={allocatedAmounts.investments}
                      spent={totalInvestmentSpent}
                      variant="investments"
                    />
                  </div>
                  {currentUser === "combined" ? (
                    <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/50">
                      <p className="text-sm text-muted-foreground text-center">
                        Switch to an individual profile to add new investments
                      </p>
                    </div>
                  ) : (
                    <InvestmentEntryDialog />
                  )}
                  <InvestmentTrackingView />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <div className="space-y-6">
              {/* Bank Balance Section - Only for Individual Users */}
              {currentUser !== "combined" && (
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <CreditCard className="h-6 w-6" />
                      Bank Balance Tracker
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Track your bank balance and see how your expenses affect
                      it throughout the month
                    </p>
                  </CardHeader>
                  <CardContent>
                    <BankBalanceTracker />
                  </CardContent>
                </Card>
              )}

              {/* Transactions Statement */}
              <Card className="shadow-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <CreditCard className="h-6 w-6" />
                    Transaction Statement
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    All transactions for {monthNames[selectedMonth]}{" "}
                    {selectedYear} -{" "}
                    {currentUser === "combined"
                      ? "Combined View"
                      : currentProfile.name}
                  </p>
                </CardHeader>
                <CardContent>
                  {(() => {
                    // Get all transactions
                    let allTransactions = [];

                    if (currentUser === "combined") {
                      // Combine transactions from both users
                      const muraliExpenses = profiles.murali.expenses
                        .filter((expense) => {
                          const expenseDate = new Date(expense.date);
                          return (
                            expenseDate.getMonth() === selectedMonth &&
                            expenseDate.getFullYear() === selectedYear
                          );
                        })
                        .map((expense) => ({
                          ...expense,
                          type: "expense",
                          user: "Murali",
                        }));
                      const valarExpenses = profiles.valar.expenses
                        .filter((expense) => {
                          const expenseDate = new Date(expense.date);
                          return (
                            expenseDate.getMonth() === selectedMonth &&
                            expenseDate.getFullYear() === selectedYear
                          );
                        })
                        .map((expense) => ({
                          ...expense,
                          type: "expense",
                          user: "Valar",
                        }));
                      const muraliRefunds = profiles.murali.refunds
                        .filter((refund) => {
                          const refundDate = new Date(refund.date);
                          return (
                            refundDate.getMonth() === selectedMonth &&
                            refundDate.getFullYear() === selectedYear
                          );
                        })
                        .map((refund) => ({
                          ...refund,
                          type: "refund",
                          user: "Murali",
                        }));
                      const valarRefunds = profiles.valar.refunds
                        .filter((refund) => {
                          const refundDate = new Date(refund.date);
                          return (
                            refundDate.getMonth() === selectedMonth &&
                            refundDate.getFullYear() === selectedYear
                          );
                        })
                        .map((refund) => ({
                          ...refund,
                          type: "refund",
                          user: "Valar",
                        }));
                      const muraliInvestments =
                        profiles.murali.investmentEntries
                          .filter((investment) => {
                            const investmentDate = new Date(investment.date);
                            return (
                              investmentDate.getMonth() === selectedMonth &&
                              investmentDate.getFullYear() === selectedYear
                            );
                          })
                          .map((investment) => ({
                            ...investment,
                            type: "investment",
                            user: "Murali",
                            category: "investments",
                          }));
                      const valarInvestments = profiles.valar.investmentEntries
                        .filter((investment) => {
                          const investmentDate = new Date(investment.date);
                          return (
                            investmentDate.getMonth() === selectedMonth &&
                            investmentDate.getFullYear() === selectedYear
                          );
                        })
                        .map((investment) => ({
                          ...investment,
                          type: "investment",
                          user: "Valar",
                          category: "investments",
                        }));

                      allTransactions = [
                        ...muraliExpenses,
                        ...valarExpenses,
                        ...muraliRefunds,
                        ...valarRefunds,
                        ...muraliInvestments,
                        ...valarInvestments,
                      ];
                    } else {
                      // Single user transactions
                      const expenses = currentProfile.expenses
                        .filter((expense) => {
                          const expenseDate = new Date(expense.date);
                          return (
                            expenseDate.getMonth() === selectedMonth &&
                            expenseDate.getFullYear() === selectedYear
                          );
                        })
                        .map((expense) => ({
                          ...expense,
                          type: "expense",
                          user: currentProfile.name,
                        }));
                      const refunds = currentProfile.refunds
                        .filter((refund) => {
                          const refundDate = new Date(refund.date);
                          return (
                            refundDate.getMonth() === selectedMonth &&
                            refundDate.getFullYear() === selectedYear
                          );
                        })
                        .map((refund) => ({
                          ...refund,
                          type: "refund",
                          user: currentProfile.name,
                        }));
                      const investments = currentProfile.investmentEntries
                        .filter((investment) => {
                          const investmentDate = new Date(investment.date);
                          return (
                            investmentDate.getMonth() === selectedMonth &&
                            investmentDate.getFullYear() === selectedYear
                          );
                        })
                        .map((investment) => ({
                          ...investment,
                          type: "investment",
                          user: currentProfile.name,
                          category: "investments",
                        }));

                      allTransactions = [
                        ...expenses,
                        ...refunds,
                        ...investments,
                      ];
                    }

                    // Sort by date (newest first)
                    allTransactions.sort(
                      (a, b) =>
                        new Date(b.date).getTime() - new Date(a.date).getTime(),
                    );

                    return allTransactions.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Wallet className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>
                          No transactions found for {monthNames[selectedMonth]}{" "}
                          {selectedYear}
                        </p>
                        <p className="text-sm">
                          Add some expenses, refunds, or investments to see them
                          here
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                          <Card className="bg-destructive/10 border-destructive/20">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <Home className="h-5 w-5 text-destructive" />
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    Need Expenses
                                  </p>
                                  <p className="text-lg font-bold text-destructive">
                                    ₹
                                    {allTransactions
                                      .filter(
                                        (t) =>
                                          t.type === "expense" &&
                                          t.category === "need",
                                      )
                                      .reduce((sum, t) => sum + t.amount, 0)
                                      .toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-warning/10 border-warning/20">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <Music className="h-5 w-5 text-warning" />
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    Want Expenses
                                  </p>
                                  <p className="text-lg font-bold text-warning">
                                    ₹
                                    {allTransactions
                                      .filter(
                                        (t) =>
                                          t.type === "expense" &&
                                          t.category === "want",
                                      )
                                      .reduce((sum, t) => sum + t.amount, 0)
                                      .toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-success/10 border-success/20">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <PiggyBank className="h-5 w-5 text-success" />
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    Savings
                                  </p>
                                  <p className="text-lg font-bold text-success">
                                    ₹
                                    {allTransactions
                                      .filter(
                                        (t) =>
                                          t.type === "expense" &&
                                          t.category === "savings",
                                      )
                                      .reduce((sum, t) => sum + t.amount, 0)
                                      .toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                          <Card className="bg-primary/10 border-primary/20">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between">
                                <TrendingUp className="h-5 w-5 text-primary" />
                                <div className="text-right">
                                  <p className="text-sm text-muted-foreground">
                                    Investments
                                  </p>
                                  <p className="text-lg font-bold text-primary">
                                    ₹
                                    {allTransactions
                                      .filter(
                                        (t) =>
                                          t.type === "investment" ||
                                          (t.type === "expense" &&
                                            t.category === "investments"),
                                      )
                                      .reduce((sum, t) => sum + t.amount, 0)
                                      .toLocaleString()}
                                  </p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Transactions Table */}
                        <div className="rounded-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Tag</TableHead>
                                {currentUser === "combined" && (
                                  <TableHead>User</TableHead>
                                )}
                                <TableHead className="text-right">
                                  Amount
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {allTransactions.map((transaction, index) => (
                                <TableRow
                                  key={`${transaction.type}-${transaction.id || index}`}
                                >
                                  <TableCell className="font-medium">
                                    {new Date(
                                      transaction.date,
                                    ).toLocaleDateString("en-IN")}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      variant={
                                        transaction.type === "expense"
                                          ? "destructive"
                                          : transaction.type === "refund"
                                            ? "default"
                                            : "secondary"
                                      }
                                    >
                                      {transaction.type === "expense"
                                        ? "Expense"
                                        : transaction.type === "refund"
                                          ? "Refund"
                                          : "Investment"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {transaction.type === "investment"
                                      ? transaction.notes || "Investment Entry"
                                      : transaction.spentFor ||
                                        transaction.refundFor ||
                                        "N/A"}
                                  </TableCell>
                                  <TableCell>
                                    <Badge
                                      className={getTagColor(
                                        transaction.category || "investments",
                                      )}
                                      variant="outline"
                                    >
                                      {transaction.category || "investments"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {transaction.tag && (
                                      <Badge
                                        className={getTagColor(transaction.tag)}
                                        variant="outline"
                                      >
                                        {transaction.tag}
                                      </Badge>
                                    )}
                                  </TableCell>
                                  {currentUser === "combined" && (
                                    <TableCell>
                                      <Badge variant="outline">
                                        {transaction.user}
                                      </Badge>
                                    </TableCell>
                                  )}
                                  <TableCell
                                    className={`text-right font-semibold ${
                                      transaction.type === "refund"
                                        ? "text-success"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {transaction.type === "refund" ? "+" : "-"}₹
                                    {transaction.amount.toLocaleString()}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="config">
            {currentUser === "combined" ? (
              <div className="text-center py-12">
                <Card className="max-w-md mx-auto">
                  <CardContent className="pt-6">
                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-lg font-semibold mb-2">
                      Combined View Active
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Configuration settings are not available in combined view.
                      Please switch to an individual profile to modify settings.
                    </p>
                    <div className="flex justify-center">
                      <ToggleGroup
                        type="single"
                        value={currentUser}
                        onValueChange={handleProfileChange}
                        className="border border-border rounded-md"
                      >
                        <ToggleGroupItem
                          value="murali"
                          aria-label="Murali's Profile"
                          className="text-xs px-3 py-1"
                        >
                          Murali
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="valar"
                          aria-label="Valar's Profile"
                          className="text-xs px-3 py-1"
                        >
                          Valar
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <ConfigurationSection
                onSalaryUpdate={handleSalaryUpdate}
                currentSalary={currentProfile.salary}
                currentBudgetPercentage={currentProfile.budgetPercentage}
                totalInvestmentAmount={allocatedAmounts.investments}
                currentUser={currentUser}
                onInvestmentPlanUpdate={handleInvestmentPlanUpdate}
                currentInvestmentPlan={currentProfile.investmentPlan}
                isAuthenticated={isConfigAuthenticated}
                setIsAuthenticated={setIsConfigAuthenticated}
                currentProfile={currentProfile}
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BudgetDashboard;
