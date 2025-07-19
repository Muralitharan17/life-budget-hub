import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { Database } from "@/lib/database.types";

type BudgetConfig = Database["public"]["Tables"]["budget_configs"]["Row"];
type InvestmentPortfolio =
  Database["public"]["Tables"]["investment_portfolios"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type TransactionHistory =
  Database["public"]["Tables"]["transaction_history"]["Row"];

type TransactionInsert = Database["public"]["Tables"]["transactions"]["Insert"];
type TransactionUpdate = Database["public"]["Tables"]["transactions"]["Update"];
type InvestmentPortfolioInsert =
  Database["public"]["Tables"]["investment_portfolios"]["Insert"];
type InvestmentPortfolioUpdate =
  Database["public"]["Tables"]["investment_portfolios"]["Update"];

export function useBudgetData(selectedMonth?: number, selectedYear?: number) {
  const { user } = useAuth();
  const [budgetConfig, setBudgetConfig] = useState<BudgetConfig | null>(null);
  const [portfolios, setPortfolios] = useState<InvestmentPortfolio[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionHistory, setTransactionHistory] = useState<
    TransactionHistory[]
  >([]);
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
      setTransactionHistory([]);
      setLoading(false);
    }
  }, [user]);

  // Helper function to load data from localStorage
  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem("budgetProfiles");
      if (saved) {
        const profiles = JSON.parse(saved);
        const userProfile =
          profiles[user?.email?.split("@")[0]] ||
          profiles["murali"] ||
          profiles["valar"];
        if (userProfile) {
          setBudgetConfig({
            id: "local",
            user_id: user?.id || "local",
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
          console.log("✅ Loaded data from localStorage as fallback");
          return true;
        }
      }
    } catch (localError) {
      console.error("Error loading from localStorage fallback:", localError);
    }
    return false;
  };

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
      loadFromLocalStorage();
      setLoading(false);
      return;
    }

    try {
      // Test network connectivity first
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      console.log("Testing network connectivity to Supabase...");

      try {
        // Test basic network connectivity
        const healthCheck = await fetch(`${supabaseUrl}/health`, {
          method: "GET",
          mode: "cors",
          headers: {
            "Content-Type": "application/json",
          },
        });
        console.log("Network connectivity test:", healthCheck.status);
      } catch (networkError) {
        console.error("Network connectivity failed:");
        console.error("Network error:", JSON.stringify(networkError, null, 2));
        console.error("This might be a CORS, network, or firewall issue");
        // Continue anyway as health endpoint might not exist
      }

      // Test basic Supabase connectivity with better error handling
      console.log("Testing Supabase API connectivity...");
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
        console.error(
          "Structured error:",
          JSON.stringify(
            {
              message: testError.message || "No message",
              details: testError.details || "No details",
              hint: testError.hint || "No hint",
              code: testError.code || "No code",
              name: testError.name || "No name",
            },
            null,
            2,
          ),
        );

        // Check for specific network errors
        if (
          testError.message &&
          (testError.message.includes("Failed to fetch") ||
            testError.message.includes("TypeError"))
        ) {
          console.error(
            "❌ Supabase connection failed - falling back to localStorage",
          );
          console.error("💡 Possible solutions:");
          console.error(
            "  1. Check if your Supabase project is active: https://supabase.com/dashboard",
          );
          console.error(
            "  2. Free tier projects pause after inactivity - visit dashboard to wake it up",
          );
          console.error("  3. Verify Supabase URL:", supabaseUrl);
          console.error("  4. Check your internet connection");

          // Immediately fall back to localStorage for network errors
          const fallbackLoaded = loadFromLocalStorage();
          if (fallbackLoaded) {
            setLoading(false);
            return; // Exit early with localStorage data
          }
        }
      } else {
        console.log("✅ Supabase connectivity test passed", testData);
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
        console.error(
          "Structured error:",
          JSON.stringify(
            {
              message: configError.message || "No message",
              details: configError.details || "No details",
              hint: configError.hint || "No hint",
              code: configError.code || "No code",
              name: configError.name || "No name",
            },
            null,
            2,
          ),
        );

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
        console.error(
          "Structured error:",
          JSON.stringify(
            {
              message: portfolioError.message || "No message",
              details: portfolioError.details || "No details",
              hint: portfolioError.hint || "No hint",
              code: portfolioError.code || "No code",
              name: portfolioError.name || "No name",
            },
            null,
            2,
          ),
        );

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

      // Fetch transactions filtered by month/year if provided
      let transactionQuery = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      // Add month/year filtering if provided
      if (selectedMonth !== undefined && selectedYear !== undefined) {
        const startDate = new Date(selectedYear, selectedMonth, 1)
          .toISOString()
          .split("T")[0];
        const endDate = new Date(selectedYear, selectedMonth + 1, 0)
          .toISOString()
          .split("T")[0];
        transactionQuery = transactionQuery
          .gte("date", startDate)
          .lte("date", endDate);
      } else {
        transactionQuery = transactionQuery.limit(100);
      }

      const { data: transactionData, error: transactionError } =
        await transactionQuery;

      if (transactionError) {
        console.error("Error fetching transactions:");
        console.error(
          "Full error object:",
          JSON.stringify(transactionError, null, 2),
        );
        console.error("Error keys:", Object.keys(transactionError));
        console.error(
          "Structured error:",
          JSON.stringify(
            {
              message: transactionError.message || "No message",
              details: transactionError.details || "No details",
              hint: transactionError.hint || "No hint",
              code: transactionError.code || "No code",
              name: transactionError.name || "No name",
            },
            null,
            2,
          ),
        );

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

      // Fetch transaction history for audit trail
      if (selectedMonth !== undefined && selectedYear !== undefined) {
        const { data: historyData } = await supabase
          .from("transaction_history")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50);

        setTransactionHistory(historyData || []);
      }
    } catch (error) {
      console.error("Error fetching budget data:");
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error(
        "Structured error:",
        JSON.stringify(
          {
            error: String(error),
            message: error instanceof Error ? error.message : "Unknown error",
            stack: error instanceof Error ? error.stack : undefined,
            stringified: String(error),
          },
          null,
          2,
        ),
      );

      // If it's a network error, fall back to localStorage
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      if (
        errorMessage.includes("Failed to fetch") ||
        errorMessage.includes("network") ||
        errorMessage.includes("TypeError")
      ) {
        console.warn(
          "⚠️ Network error detected, falling back to localStorage...",
        );
        console.warn("💡 Common causes:");
        console.warn("  - Supabase project might be paused (free tier)");
        console.warn("  - Network connectivity issues");
        console.warn("  - CORS or firewall blocking requests");
        console.warn(
          "  - Check your Supabase project status at: https://supabase.com/dashboard",
        );

        loadFromLocalStorage();
      }
    } finally {
      setLoading(false);
    }
  }, [user, isSupabaseConfigured, selectedMonth, selectedYear]);

  // CRUD Operations for Budget Config
  const saveBudgetConfig = async (
    config: Omit<BudgetConfig, "id" | "user_id" | "created_at" | "updated_at">,
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      // First, ensure the user profile exists
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          email: user.email || "",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );

      if (profileError) {
        console.error("Error creating/updating profile:");
        console.error(
          "Full error object:",
          JSON.stringify(profileError, null, 2),
        );
        throw profileError;
      }

      // Now save the budget config
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
      console.error("Error saving budget config:");
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error(
        "Structured error:",
        JSON.stringify(
          {
            message: error?.message || "No message",
            details: error?.details || "No details",
            hint: error?.hint || "No hint",
            code: error?.code || "No code",
            name: error?.name || "No name",
            stringified: String(error),
          },
          null,
          2,
        ),
      );
      return { data: null, error };
    }
  };

  // CRUD Operations for Investment Portfolios
  const saveInvestmentPortfolio = async (
    portfolio: Omit<
      InvestmentPortfolioInsert,
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
      console.error("Error saving portfolio:");
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error(
        "Structured error:",
        JSON.stringify(
          {
            message: error?.message || "No message",
            details: error?.details || "No details",
            hint: error?.hint || "No hint",
            code: error?.code || "No code",
            name: error?.name || "No name",
            stringified: String(error),
          },
          null,
          2,
        ),
      );
      return { data: null, error };
    }
  };

  const updateInvestmentPortfolio = async (
    id: string,
    updates: InvestmentPortfolioUpdate,
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("investment_portfolios")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setPortfolios((prev) => prev.map((p) => (p.id === id ? data : p)));
      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating portfolio:", error);
      return { data: null, error };
    }
  };

  const deleteInvestmentPortfolio = async (id: string) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { error } = await supabase
        .from("investment_portfolios")
        .update({ is_active: false })
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      setPortfolios((prev) => prev.filter((p) => p.id !== id));
      return { error: null };
    } catch (error: any) {
      console.error("Error deleting portfolio:", error);
      return { error };
    }
  };

  // CRUD Operations for Transactions
  const addTransaction = async (
    transaction: Omit<
      TransactionInsert,
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
      console.error("Error adding transaction:");
      console.error("Full error object:", JSON.stringify(error, null, 2));
      console.error("Error type:", typeof error);
      console.error("Error keys:", Object.keys(error || {}));
      console.error(
        "Structured error:",
        JSON.stringify(
          {
            message: error?.message || "No message",
            details: error?.details || "No details",
            hint: error?.hint || "No hint",
            code: error?.code || "No code",
            name: error?.name || "No name",
            stringified: String(error),
          },
          null,
          2,
        ),
      );
      return { data: null, error };
    }
  };

  const updateTransaction = async (id: string, updates: TransactionUpdate) => {
    if (!user) return { error: "User not authenticated" };

    try {
      const { data, error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      setTransactions((prev) => prev.map((t) => (t.id === id ? data : t)));
      return { data, error: null };
    } catch (error: any) {
      console.error("Error updating transaction:", error);
      return { data: null, error };
    }
  };

  const deleteTransaction = async (id: string, softDelete = true) => {
    if (!user) return { error: "User not authenticated" };

    try {
      if (softDelete) {
        const { error } = await supabase
          .from("transactions")
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
            status: "cancelled",
          })
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      } else {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id)
          .eq("user_id", user.id);

        if (error) throw error;
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }

      return { error: null };
    } catch (error: any) {
      console.error("Error deleting transaction:", error);
      return { error };
    }
  };

  const refundTransaction = async (
    originalTransactionId: string,
    refundAmount: number,
    notes?: string,
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      // Get original transaction
      const { data: originalTransaction, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", originalTransactionId)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      // Create refund transaction
      const { data: refundTransaction, error: refundError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "refund",
          category: originalTransaction.category,
          amount: refundAmount,
          description: `Refund for: ${originalTransaction.description || "Transaction"}`,
          notes: notes,
          date: new Date().toISOString().split("T")[0],
          time: new Date().toTimeString().split(" ")[0],
          payment_type: originalTransaction.payment_type,
          refund_for: originalTransactionId,
          status: "active",
        })
        .select()
        .single();

      if (refundError) throw refundError;

      // Update original transaction status
      const newStatus =
        refundAmount >= originalTransaction.amount
          ? "refunded"
          : "partial_refund";
      await supabase
        .from("transactions")
        .update({
          status: newStatus,
          original_transaction_id: refundTransaction.id,
        })
        .eq("id", originalTransactionId);

      setTransactions((prev) => [
        refundTransaction,
        ...prev.map((t) =>
          t.id === originalTransactionId ? { ...t, status: newStatus } : t,
        ),
      ]);

      return { data: refundTransaction, error: null };
    } catch (error: any) {
      console.error("Error processing refund:", error);
      return { data: null, error };
    }
  };

  const reduceInvestmentAmount = async (
    transactionId: string,
    reductionAmount: number,
    notes?: string,
  ) => {
    if (!user) return { error: "User not authenticated" };

    try {
      // Get original transaction
      const { data: originalTransaction, error: fetchError } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .single();

      if (fetchError) throw fetchError;

      if (originalTransaction.amount <= reductionAmount) {
        return {
          error:
            "Reduction amount cannot be greater than or equal to original amount",
        };
      }

      const newAmount = originalTransaction.amount - reductionAmount;

      // Update original transaction
      const { data, error } = await supabase
        .from("transactions")
        .update({
          amount: newAmount,
          notes: `${originalTransaction.notes || ""}\nAmount reduced by ₹${reductionAmount}${notes ? `: ${notes}` : ""}`,
        })
        .eq("id", transactionId)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      // Log the reduction in history
      await supabase.from("transaction_history").insert({
        transaction_id: transactionId,
        user_id: user.id,
        action: "amount_reduced",
        old_values: { amount: originalTransaction.amount },
        new_values: { amount: newAmount },
        changes_description: `Amount reduced by ₹${reductionAmount}${notes ? `: ${notes}` : ""}`,
        created_by: user.id,
      });

      setTransactions((prev) =>
        prev.map((t) => (t.id === transactionId ? data : t)),
      );
      return { data, error: null };
    } catch (error: any) {
      console.error("Error reducing investment amount:", error);
      return { data: null, error };
    }
  };

  return {
    budgetConfig,
    portfolios,
    transactions,
    transactionHistory,
    loading,

    // Budget Config Operations
    saveBudgetConfig,

    // Portfolio Operations
    saveInvestmentPortfolio,
    updateInvestmentPortfolio,
    deleteInvestmentPortfolio,

    // Transaction Operations
    addTransaction,
    updateTransaction,
    deleteTransaction,
    refundTransaction,
    reduceInvestmentAmount,

    // Utility
    refetch: fetchBudgetData,
  };
}
