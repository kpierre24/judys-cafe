import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database type definitions for TypeScript
export interface Database {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string
          name: string
          address: string
          phone: string
          email: string
          manager: string
          opening_hours: string
          status: 'active' | 'inactive' | 'maintenance'
          total_sales: number
          daily_sales: number
          employees: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          phone: string
          email: string
          manager: string
          opening_hours: string
          status?: 'active' | 'inactive' | 'maintenance'
          total_sales?: number
          daily_sales?: number
          employees?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string
          phone?: string
          email?: string
          manager?: string
          opening_hours?: string
          status?: 'active' | 'inactive' | 'maintenance'
          total_sales?: number
          daily_sales?: number
          employees?: number
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          role: 'admin' | 'manager' | 'cashier'
          branch_id: string | null
          accessible_branches: string[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          role: 'admin' | 'manager' | 'cashier'
          branch_id?: string | null
          accessible_branches?: string[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          role?: 'admin' | 'manager' | 'cashier'
          branch_id?: string | null
          accessible_branches?: string[]
          is_active?: boolean
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          name: string
          category: string
          price: number
          description: string | null
          is_available: boolean
          branch_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          price: number
          description?: string | null
          is_available?: boolean
          branch_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          price?: number
          description?: string | null
          is_available?: boolean
          branch_id?: string
          updated_at?: string
        }
      }
      inventory_items: {
        Row: {
          id: string
          name: string
          category: string
          current_stock: number
          min_threshold: number
          max_threshold: number
          unit: string
          cost_price: number
          supplier_id: string | null
          branch_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          current_stock: number
          min_threshold: number
          max_threshold: number
          unit: string
          cost_price: number
          supplier_id?: string | null
          branch_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          current_stock?: number
          min_threshold?: number
          max_threshold?: number
          unit?: string
          cost_price?: number
          supplier_id?: string | null
          branch_id?: string
          updated_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          receipt_number: string
          customer_name: string | null
          customer_phone: string | null
          subtotal: number
          tax: number
          tip: number
          total: number
          payment_method: 'cash' | 'card' | 'mobile'
          order_type: 'dine-in' | 'takeout' | 'delivery'
          cashier_name: string
          branch_id: string
          status: 'completed' | 'refunded' | 'void'
          transaction_date: string
          created_at: string
        }
        Insert: {
          id?: string
          receipt_number: string
          customer_name?: string | null
          customer_phone?: string | null
          subtotal: number
          tax: number
          tip: number
          total: number
          payment_method: 'cash' | 'card' | 'mobile'
          order_type: 'dine-in' | 'takeout' | 'delivery'
          cashier_name: string
          branch_id: string
          status?: 'completed' | 'refunded' | 'void'
          transaction_date?: string
          created_at?: string
        }
        Update: {
          id?: string
          receipt_number?: string
          customer_name?: string | null
          customer_phone?: string | null
          subtotal?: number
          tax?: number
          tip?: number
          total?: number
          payment_method?: 'cash' | 'card' | 'mobile'
          order_type?: 'dine-in' | 'takeout' | 'delivery'
          cashier_name?: string
          branch_id?: string
          status?: 'completed' | 'refunded' | 'void'
          transaction_date?: string
        }
      }
      employees: {
        Row: {
          id: string
          employee_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          position: string
          department: string | null
          hourly_rate: number | null
          hire_date: string
          status: 'active' | 'inactive' | 'terminated'
          address: string | null
          emergency_contact: any
          availability: any
          branch_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          employee_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          position: string
          department?: string | null
          hourly_rate?: number | null
          hire_date?: string
          status?: 'active' | 'inactive' | 'terminated'
          address?: string | null
          emergency_contact?: any
          availability?: any
          branch_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          employee_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          position?: string
          department?: string | null
          hourly_rate?: number | null
          hire_date?: string
          status?: 'active' | 'inactive' | 'terminated'
          address?: string | null
          emergency_contact?: any
          availability?: any
          branch_id?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          customer_id: string
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          loyalty_card: any
          preferences: any
          is_active: boolean
          branch_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          first_name: string
          last_name: string
          email?: string | null
          phone?: string | null
          loyalty_card?: any
          preferences?: any
          is_active?: boolean
          branch_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          first_name?: string
          last_name?: string
          email?: string | null
          phone?: string | null
          loyalty_card?: any
          preferences?: any
          is_active?: boolean
          branch_id?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
