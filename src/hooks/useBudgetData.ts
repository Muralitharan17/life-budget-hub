import { useState, useEffect, useCallback } from "react";
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

  const fetchBudgetData = useCallback(async () => {
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
        console.error("Supabase connectivity test failed:");
        console.error("Full error object:", JSON.stringify(testError, null, 2));
        console.error("Error type:", typeof testError);
        console.error("Error keys:", Object.keys(testError));
        console.error("Structured error:", {
          message: testError.message || "No message",
          details: testError.details || "No details",
          hint: testError.hint || "No hint",
          code: testError.code || "No code",
          name: testError.name || "No name",
        });
      } else {
        console.log("Supabase connectivity test passed", testData);
      }

      // Fetch budget config
      const { data: configData, error: configError } = await supabase
        .from("budget_configs")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (configError && configError.code !== "PGRST116") {
        console.error("Error fetching budget config:");
        console.error(
          "Full error object:",
          JSON.stringify(configError, null, 2),
        );
        console.error("Error keys:", Object.keys(configError));
        console.error("Structured error:", {
          message: configError.message || "No message",
          details: configError.details || "No details",
          hint: configError.hint || "No hint",
          code: configError.code || "No code",
          name: configError.name || "No name",
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
        console.error("Error fetching portfolios:");
        console.error(
          "Full error object:",
          JSON.stringify(portfolioError, null, 2),
        );
        console.error("Error keys:", Object.keys(portfolioError));
        console.error("Structured error:", {
          message: portfolioError.message || "No message",
          details: portfolioError.details || "No details",
          hint: portfolioError.hint || "No hint",
          code: portfolioError.code || "No code",
          name: portfolioError.name || "No name",
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
        console.error("Error fetching transactions:");
        console.error(
          "Full error object:",
          JSON.stringify(transactionError, null, 2),
        );
        console.error("Error keys:", Object.keys(transactionError));
        console.error("Structured error:", {
          message: transactionError.message || "No message",
          details: transactionError.details || "No details",
          hint: transactionError.hint || "No hint",
          code: transactionError.code || "No code",
          name: transactionError.name || "No name",
        });

        if (transactionError.code === "42P01") {
          console.error(
            '❌ Table "transactions" does not exist in your Supabase database',
          );
        } else if (transactionError.code === "PGRST301") {
          console.error("❌ RLS is blocking access to transactions table");
        }
      } else {
        setTransactions(transactionData || []);
      }
    } catch (error) {
      console.error("Error fetching budget data:");
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error("Structured error:", {
        error,
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
        stringified: String(error),
      });
    } finally {
      setLoading(false);
    }
  }, [user, isSupabaseConfigured]);

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
