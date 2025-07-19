export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      budget_configs: {
        Row: {
          id: string;
          user_id: string;
          monthly_salary: number;
          budget_percentage: number;
          allocation_need: number;
          allocation_want: number;
          allocation_savings: number;
          allocation_investments: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          monthly_salary: number;
          budget_percentage: number;
          allocation_need: number;
          allocation_want: number;
          allocation_savings: number;
          allocation_investments: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          monthly_salary?: number;
          budget_percentage?: number;
          allocation_need?: number;
          allocation_want?: number;
          allocation_savings?: number;
          allocation_investments?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      investment_portfolios: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          allocation_type: "percentage" | "amount";
          allocation_value: number;
          allocated_amount: number;
          invested_amount: number;
          allow_direct_investment: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          allocation_type: "percentage" | "amount";
          allocation_value: number;
          allocated_amount: number;
          invested_amount: number;
          allow_direct_investment: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          allocation_type?: "percentage" | "amount";
          allocation_value?: number;
          allocated_amount?: number;
          invested_amount?: number;
          allow_direct_investment?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      investment_categories: {
        Row: {
          id: string;
          portfolio_id: string;
          name: string;
          allocation_type: "percentage" | "amount";
          allocation_value: number;
          allocated_amount: number;
          invested_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          portfolio_id: string;
          name: string;
          allocation_type: "percentage" | "amount";
          allocation_value: number;
          allocated_amount: number;
          invested_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          portfolio_id?: string;
          name?: string;
          allocation_type?: "percentage" | "amount";
          allocation_value?: number;
          allocated_amount?: number;
          invested_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      investment_funds: {
        Row: {
          id: string;
          category_id: string;
          name: string;
          allocated_amount: number;
          invested_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          category_id: string;
          name: string;
          allocated_amount: number;
          invested_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          category_id?: string;
          name?: string;
          allocated_amount?: number;
          invested_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: number;
          category: "need" | "want" | "savings" | "investments";
          subcategory: string | null;
          description: string | null;
          date: string;
          type: "income" | "expense" | "refund" | "investment";
          notes: string | null;
          tag: string | null;
          payment_type: string | null;
          spent_for: string | null;
          refund_for: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: number;
          category: "need" | "want" | "savings" | "investments";
          subcategory?: string | null;
          description?: string | null;
          date: string;
          type: "income" | "expense" | "refund" | "investment";
          notes?: string | null;
          tag?: string | null;
          payment_type?: string | null;
          spent_for?: string | null;
          refund_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: number;
          category?: "need" | "want" | "savings" | "investments";
          subcategory?: string | null;
          description?: string | null;
          date?: string;
          type?: "income" | "expense" | "refund" | "investment";
          notes?: string | null;
          tag?: string | null;
          payment_type?: string | null;
          spent_for?: string | null;
          refund_for?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      monthly_summaries: {
        Row: {
          id: string;
          user_id: string;
          year: number;
          month: number;
          total_income: number;
          total_expenses: number;
          need_spent: number;
          want_spent: number;
          savings_amount: number;
          investments_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          year: number;
          month: number;
          total_income: number;
          total_expenses: number;
          need_spent: number;
          want_spent: number;
          savings_amount: number;
          investments_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          year?: number;
          month?: number;
          total_income?: number;
          total_expenses?: number;
          need_spent?: number;
          want_spent?: number;
          savings_amount?: number;
          investments_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
