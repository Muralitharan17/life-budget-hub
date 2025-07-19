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
    try {
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
