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
        Relationships: [];
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
          monthly_salary?: number;
          budget_percentage?: number;
          allocation_need?: number;
          allocation_want?: number;
          allocation_savings?: number;
          allocation_investments?: number;
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
        Relationships: [
          {
            foreignKeyName: "budget_configs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          allocation_type?: "percentage" | "amount";
          allocation_value?: number;
          allocated_amount?: number;
          invested_amount?: number;
          allow_direct_investment?: boolean;
          is_active?: boolean;
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
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "investment_portfolios_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          type:
            | "expense"
            | "income"
            | "refund"
            | "investment"
            | "savings"
            | "transfer";
          category: "need" | "want" | "savings" | "investments";
          amount: number;
          description: string | null;
          notes: string | null;
          date: string;
          time: string | null;
          payment_type:
            | "cash"
            | "card"
            | "upi"
            | "netbanking"
            | "cheque"
            | "other"
            | null;
          spent_for: string | null;
          tag: string | null;
          portfolio_id: string | null;
          investment_type: string | null;
          refund_for: string | null;
          original_transaction_id: string | null;
          status: "active" | "cancelled" | "refunded" | "partial_refund";
          is_deleted: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          type:
            | "expense"
            | "income"
            | "refund"
            | "investment"
            | "savings"
            | "transfer";
          category: "need" | "want" | "savings" | "investments";
          amount: number;
          description?: string | null;
          notes?: string | null;
          date: string;
          time?: string | null;
          payment_type?:
            | "cash"
            | "card"
            | "upi"
            | "netbanking"
            | "cheque"
            | "other"
            | null;
          spent_for?: string | null;
          tag?: string | null;
          portfolio_id?: string | null;
          investment_type?: string | null;
          refund_for?: string | null;
          original_transaction_id?: string | null;
          status?: "active" | "cancelled" | "refunded" | "partial_refund";
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?:
            | "expense"
            | "income"
            | "refund"
            | "investment"
            | "savings"
            | "transfer";
          category?: "need" | "want" | "savings" | "investments";
          amount?: number;
          description?: string | null;
          notes?: string | null;
          date?: string;
          time?: string | null;
          payment_type?:
            | "cash"
            | "card"
            | "upi"
            | "netbanking"
            | "cheque"
            | "other"
            | null;
          spent_for?: string | null;
          tag?: string | null;
          portfolio_id?: string | null;
          investment_type?: string | null;
          refund_for?: string | null;
          original_transaction_id?: string | null;
          status?: "active" | "cancelled" | "refunded" | "partial_refund";
          is_deleted?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_portfolio_id_fkey";
            columns: ["portfolio_id"];
            referencedRelation: "investment_portfolios";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_refund_for_fkey";
            columns: ["refund_for"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_original_transaction_id_fkey";
            columns: ["original_transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      transaction_history: {
        Row: {
          id: string;
          transaction_id: string;
          user_id: string;
          action:
            | "created"
            | "updated"
            | "deleted"
            | "refunded"
            | "amount_reduced";
          old_values: Json | null;
          new_values: Json | null;
          changes_description: string | null;
          created_at: string;
          created_by: string | null;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          user_id: string;
          action:
            | "created"
            | "updated"
            | "deleted"
            | "refunded"
            | "amount_reduced";
          old_values?: Json | null;
          new_values?: Json | null;
          changes_description?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Update: {
          id?: string;
          transaction_id?: string;
          user_id?: string;
          action?:
            | "created"
            | "updated"
            | "deleted"
            | "refunded"
            | "amount_reduced";
          old_values?: Json | null;
          new_values?: Json | null;
          changes_description?: string | null;
          created_at?: string;
          created_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "transaction_history_transaction_id_fkey";
            columns: ["transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_history_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transaction_history_created_by_fkey";
            columns: ["created_by"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
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
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
