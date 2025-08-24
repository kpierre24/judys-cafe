import { supabase } from './supabase'
import type { Database } from './supabase'

// Type aliases for easier use
type Tables = Database['public']['Tables']
type Branch = Tables['branches']['Row']
type Product = Tables['products']['Row']
type InventoryItem = Tables['inventory_items']['Row']
type Transaction = Tables['transactions']['Row']
type Employee = Tables['employees']['Row']
type Customer = Tables['customers']['Row']

export class SupabaseService {
  // Branch operations
  static async getBranches(): Promise<Branch[]> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .order('name')

    if (error) throw error
    return data
  }

  static async getBranch(id: string): Promise<Branch | null> {
    const { data, error } = await supabase
      .from('branches')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  static async createBranch(branch: Tables['branches']['Insert']): Promise<Branch> {
    const { data, error } = await supabase
      .from('branches')
      .insert(branch)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateBranch(id: string, updates: Tables['branches']['Update']): Promise<Branch> {
    const { data, error } = await supabase
      .from('branches')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Product operations
  static async getProducts(branchId: string): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('branch_id', branchId)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return data
  }

  static async createProduct(product: Tables['products']['Insert']): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateProduct(id: string, updates: Tables['products']['Update']): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)

    if (error) throw error
  }

  // Inventory operations
  static async getInventoryItems(branchId: string): Promise<InventoryItem[]> {
    const { data, error } = await supabase
      .from('inventory_items')
      .select('*')
      .eq('branch_id', branchId)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) throw error
    return data
  }

  static async updateInventoryItem(id: string, updates: Tables['inventory_items']['Update']): Promise<InventoryItem> {
    const { data, error } = await supabase
      .from('inventory_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Transaction operations
  static async createTransaction(transaction: Tables['transactions']['Insert']): Promise<Transaction> {
    const { data, error } = await supabase
      .from('transactions')
      .insert(transaction)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getTransactions(branchId: string, limit = 50): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  static async getTransactionsByDateRange(
    branchId: string,
    startDate: string,
    endDate: string
  ): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('branch_id', branchId)
      .gte('transaction_date', startDate)
      .lte('transaction_date', endDate)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  // Employee operations
  static async getEmployees(branchId: string): Promise<Employee[]> {
    const { data, error } = await supabase
      .from('employees')
      .select('*')
      .eq('branch_id', branchId)
      .order('first_name', { ascending: true })

    if (error) throw error
    return data
  }

  static async createEmployee(employee: Tables['employees']['Insert']): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .insert(employee)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateEmployee(id: string, updates: Tables['employees']['Update']): Promise<Employee> {
    const { data, error } = await supabase
      .from('employees')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Customer operations
  static async getCustomers(branchId: string): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('branch_id', branchId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data
  }

  static async createCustomer(customer: Tables['customers']['Insert']): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert(customer)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async updateCustomer(id: string, updates: Tables['customers']['Update']): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Authentication helpers
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    if (error) throw error
    return data
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async signUp(email: string, password: string, userData: { name: string; role: string }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    if (error) throw error
    return data
  }

  // Realtime subscriptions
  static subscribeToTable(
    table: keyof Tables,
    callback: (payload: any) => void,
    filter?: { column: string; value: string }
  ) {
    let query = supabase.channel(`public:${table}`)
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table,
          ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {})
        },
        callback
      )
      .subscribe()

    return query
  }

  // Utility functions
  static async checkConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('branches')
        .select('id')
        .limit(1)

      return !error
    } catch {
      return false
    }
  }
}

// Export types for use in stores
export type {
  Branch,
  Product,
  InventoryItem,
  Transaction,
  Employee,
  Customer,
  Tables
}
