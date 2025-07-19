import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { Database } from "@/lib/database.types";

type BudgetConfig = Database["public"]["Tables"]["budget_configs"]["Row"];
type InvestmentPortfolio =
  Database["public"]["Tables"]["investment_portfolios"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

export function useBudgetData() {
  const { user } = useAuth();
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [portfolios, setPortfolios] = useState<InvestmentPortfolio[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if Supabase is properly configured
  const isSupabaseConfigured =
    import.meta.env.VITE_SUPABASE_URL &&
    import.meta.env.VITE_SUPABASE_ANON_KEY &&
    import.meta.env.VITE_SUPABASE_URL !== "https://placeholder.supabase.co" &&
    import.meta.env.VITE_SUPABASE_ANON_KEY !== "placeholder-key";

  useEffect(() => {
    if (user) {
      fetchBudgetData();
    } else {
      setBudgetConfig(null);
      setPortfolios([]);
      setTransactions([]);
      setLoading(false);
    }
  }, [user]);

  const fetchBudgetData = async () => {
    if (!user) return;

    setLoading(true);

    // Debug Supabase connection
    console.log("Supabase URL:", import.meta.env.VITE_SUPABASE_URL);
    console.log("User ID:", user.id);
    console.log("Supabase configured:", isSupabaseConfigured);
    console.log("Attempting to fetch budget data...");

    if (!isSupabaseConfigured) {
      console.warn("Supabase not configured - falling back to localStorage");
      // Fallback to localStorage for development
      try {
        const saved = localStorage.getItem("budgetProfiles");
        if (saved) {
          const profiles = JSON.parse(saved);
          const userProfile =
            profiles[user.email?.split("@")[0]] ||
            profiles["murali"] ||
            profiles["valar"];
          if (userProfile) {
            setBudgetConfig({
              id: "local",
              user_id: user.id,
              monthly_salary: userProfile.salary || 0,
              budget_percentage: userProfile.budgetPercentage || 0,
              allocation_need: userProfile.budgetAllocation?.need || 0,
              allocation_want: userProfile.budgetAllocation?.want || 0,
              allocation_savings: userProfile.budgetAllocation?.savings || 0,
              allocation_investments:
                userProfile.budgetAllocation?.investments || 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.error("Error loading from localStorage:", error);
      }
      setLoading(false);
      return;
    }

    try {
      // Test basic Supabase connectivity
      const { data: testData, error: testError } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (testError) {
        console.error("Supabase connectivity test failed:", {
          message: testError.message,
          details: testError.details,
          hint: testError.hint,
          code: testError.code,
        });
      } else {
        console.log("Supabase connectivity test passed");
      }

      // Fetch budget config
      const { data: configData, error: configError } = await supabase
        .from("budget_configs")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (configError && configError.code !== "PGRST116") {
        console.error("Error fetching budget config:", {
          message: configError.message,
          details: configError.details,
          hint: configError.hint,
          code: configError.code,
        });

        // Show helpful error messages for common issues
        if (configError.code === "42P01") {
          console.error(
            '❌ Table "budget_configs" does not exist in your Supabase database',
          );
          console.log(
            "💡 Please run the database migration scripts to create the required tables",
          );
        } else if (configError.code === "PGRST301") {
          console.error(
            "❌ RLS (Row Level Security) is blocking access to budget_configs table",
          );
          console.log(
            "💡 Please check your RLS policies or disable RLS for development",
          );
        }
      } else {
        setBudgetConfig(configData);
      }

      // Fetch investment portfolios
      const { data: portfolioData, error: portfolioError } = await supabase
        .from("investment_portfolios")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (portfolioError) {
        console.error("Error fetching portfolios:", {
          message: portfolioError.message,
          details: portfolioError.details,
          hint: portfolioError.hint,
          code: portfolioError.code,
        });

        if (portfolioError.code === "42P01") {
          console.error(
            '❌ Table "investment_portfolios" does not exist in your Supabase database',
          );
        } else if (portfolioError.code === "PGRST301") {
          console.error(
            "❌ RLS is blocking access to investment_portfolios table",
          );
        }
      } else {
        setPortfolios(portfolioData || []);
      }

      // Fetch recent transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .limit(50);

      if (transactionError) {
        console.error("Error fetching transactions:", {
          message: transactionError.message,
          details: transactionError.details,
          hint: transactionError.hint,
          code: transactionError.code,
        });
      } else {
        setTransactions(transactionData || []);
      }
    } catch (error) {
      console.error("Error fetching budget data:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  const saveBudgetConfig = async (
    config: Omit<BudgetConfig, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("budget_configs")
        .upsert({
          user_id: user.id,
          ...config,
        })
        .select()
        .single();

      if (error) throw error;

      setBudgetConfig(data);
      return { data, error: null };
    } catch (error: any) {
      console.error("Error saving budget config:", error);
      return { data: null, error };
    }
  };

  const saveInvestmentPortfolio = async (
    portfolio: Omit<
      InvestmentPortfolio,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("investment_portfolios")
        .insert({
          user_id: user.id,
          ...portfolio,
        })
        .select()
        .single();

      if (error) throw error;

      setPortfolios((prev) => [...prev, data]);
      return { data, error: null };
    } catch (error: any) {
      console.error("Error saving portfolio:", error);
      return { data: null, error };
    }
  };

  const addTransaction = async (
    transaction: Omit<
      Transaction,
      "id" | "user_id" | "created_at" | "updated_at"
    >,
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          ...transaction,
        })
        .select()
        .single();

      if (error) throw error;

      setTransactions((prev) => [data, ...prev]);
      return { data, error: null };
    } catch (error: any) {
      console.error("Error adding transaction:", error);
      return { data: null, error };
    }
  };

  return {
    budgetConfig,
    portfolios,
    transactions,
    loading,
    saveBudgetConfig,
    saveInvestmentPortfolio,
    addTransaction,
    refetch: fetchBudgetData,
  };
}
