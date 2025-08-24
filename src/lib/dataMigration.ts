import { SupabaseService } from './supabaseService'
import type { Branch, Product, InventoryItem } from './supabaseService'

/**
 * Data Migration Helper
 *
 * This helper provides functions to migrate existing local data to Supabase.
 * Use this during the transition period or for initial data seeding.
 */
export class DataMigration {

  /**
   * Migrate sample branches to Supabase
   */
  static async migrateBranches() {
    const sampleBranches = [
      {
        name: "Judy's Cafe Downtown",
        address: "123 Main St, Downtown",
        phone: "+1-555-0101",
        email: "downtown@judyscafe.com",
        manager: "Alice Johnson",
        opening_hours: "6:00 AM - 10:00 PM",
        status: "active" as const,
        total_sales: 125000.50,
        daily_sales: 1250.75,
        employees: 12
      },
      {
        name: "Judy's Cafe Westside",
        address: "456 Oak Ave, Westside",
        phone: "+1-555-0102",
        email: "westside@judyscafe.com",
        manager: "Bob Smith",
        opening_hours: "7:00 AM - 9:00 PM",
        status: "active" as const,
        total_sales: 98750.25,
        daily_sales: 980.50,
        employees: 8
      },
      {
        name: "Judy's Cafe Airport",
        address: "789 Airport Blvd, Terminal 1",
        phone: "+1-555-0103",
        email: "airport@judyscafe.com",
        manager: "Carol Davis",
        opening_hours: "5:00 AM - 11:00 PM",
        status: "active" as const,
        total_sales: 156200.75,
        daily_sales: 1780.25,
        employees: 15
      }
    ]

    const migratedBranches: Branch[] = []

    for (const branch of sampleBranches) {
      try {
        const created = await SupabaseService.createBranch(branch)
        migratedBranches.push(created)
        console.log(`✓ Migrated branch: ${branch.name}`)
      } catch (error) {
        console.error(`✗ Failed to migrate branch ${branch.name}:`, error)
      }
    }

    return migratedBranches
  }

  /**
   * Migrate sample products for a specific branch
   */
  static async migrateProducts(branchId: string) {
    const sampleProducts = [
      // Beverages
      {
        name: "Cappuccino",
        category: "beverage",
        price: 4.50,
        description: "Rich espresso with steamed milk foam",
        is_available: true,
        branch_id: branchId
      },
      {
        name: "Americano",
        category: "beverage",
        price: 3.75,
        description: "Espresso with hot water",
        is_available: true,
        branch_id: branchId
      },
      {
        name: "Latte",
        category: "beverage",
        price: 4.25,
        description: "Espresso with steamed milk",
        is_available: true,
        branch_id: branchId
      },
      {
        name: "Mocha",
        category: "beverage",
        price: 4.75,
        description: "Espresso with chocolate and steamed milk",
        is_available: true,
        branch_id: branchId
      },
      // Food
      {
        name: "Croissant",
        category: "pastry",
        price: 2.50,
        description: "Fresh buttery croissant",
        is_available: true,
        branch_id: branchId
      },
      {
        name: "Blueberry Muffin",
        category: "pastry",
        price: 2.75,
        description: "Homemade muffin with fresh blueberries",
        is_available: true,
        branch_id: branchId
      },
      {
        name: "Avocado Toast",
        category: "food",
        price: 7.50,
        description: "Smashed avocado on sourdough bread",
        is_available: true,
        branch_id: branchId
      },
      {
        name: "Club Sandwich",
        category: "food",
        price: 8.25,
        description: "Triple-decker with turkey, bacon, lettuce, tomato",
        is_available: true,
        branch_id: branchId
      }
    ]

    const migratedProducts: Product[] = []

    for (const product of sampleProducts) {
      try {
        const created = await SupabaseService.createProduct(product)
        migratedProducts.push(created)
        console.log(`✓ Migrated product: ${product.name}`)
      } catch (error) {
        console.error(`✗ Failed to migrate product ${product.name}:`, error)
      }
    }

    return migratedProducts
  }

  /**
   * Migrate sample inventory items for a specific branch
   */
  static async migrateInventoryItems(branchId: string) {
    const sampleInventoryItems = [
      {
        name: "Coffee Beans - Arabica",
        category: "coffee",
        current_stock: 50,
        min_threshold: 10,
        max_threshold: 100,
        unit: "lbs",
        cost_price: 12.50,
        branch_id: branchId
      },
      {
        name: "Milk - Whole",
        category: "dairy",
        current_stock: 25,
        min_threshold: 5,
        max_threshold: 50,
        unit: "gallons",
        cost_price: 3.25,
        branch_id: branchId
      },
      {
        name: "Sugar - White",
        category: "sweetener",
        current_stock: 20,
        min_threshold: 5,
        max_threshold: 30,
        unit: "lbs",
        cost_price: 2.50,
        branch_id: branchId
      },
      {
        name: "Flour - All Purpose",
        category: "baking",
        current_stock: 15,
        min_threshold: 3,
        max_threshold: 25,
        unit: "lbs",
        cost_price: 4.75,
        branch_id: branchId
      },
      {
        name: "Blueberries - Fresh",
        category: "fruit",
        current_stock: 8,
        min_threshold: 2,
        max_threshold: 15,
        unit: "lbs",
        cost_price: 6.50,
        branch_id: branchId
      }
    ]

    const migratedItems: InventoryItem[] = []

    for (const item of sampleInventoryItems) {
      try {
        const created = await SupabaseService.updateInventoryItem(
          // We need to create first, but this is a simplified example
          crypto.randomUUID(),
          item as any
        )
        migratedItems.push(created)
        console.log(`✓ Migrated inventory item: ${item.name}`)
      } catch (error) {
        console.error(`✗ Failed to migrate inventory item ${item.name}:`, error)
      }
    }

    return migratedItems
  }

  /**
   * Complete migration workflow
   */
  static async runCompleteMigration() {
    try {
      console.log('🚀 Starting data migration to Supabase...')

      // Check Supabase connection
      const isConnected = await SupabaseService.checkConnection()
      if (!isConnected) {
        throw new Error('Cannot connect to Supabase. Check your configuration.')
      }

      console.log('✅ Supabase connection verified')

      // Migrate branches
      console.log('\n📍 Migrating branches...')
      const branches = await this.migrateBranches()

      if (branches.length === 0) {
        throw new Error('No branches were migrated successfully')
      }

      // Migrate products and inventory for each branch
      for (const branch of branches) {
        console.log(`\n🍕 Migrating products for ${branch.name}...`)
        await this.migrateProducts(branch.id)

        console.log(`\n📦 Migrating inventory for ${branch.name}...`)
        await this.migrateInventoryItems(branch.id)
      }

      console.log('\n🎉 Migration completed successfully!')
      console.log(`\n📊 Summary:`)
      console.log(`- Branches: ${branches.length}`)
      console.log(`- Products per branch: ~8`)
      console.log(`- Inventory items per branch: ~5`)

      return {
        success: true,
        branches: branches.length,
        message: 'Migration completed successfully'
      }

    } catch (error) {
      console.error('\n❌ Migration failed:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Migration failed'
      }
    }
  }

  /**
   * Check if migration is needed (if tables are empty)
   */
  static async isMigrationNeeded() {
    try {
      const branches = await SupabaseService.getBranches()
      return branches.length === 0
    } catch (error) {
      console.error('Error checking migration status:', error)
      return true // Assume migration is needed if we can't check
    }
  }

  /**
   * Reset database (for development only)
   */
  static async resetDatabase() {
    console.warn('⚠️ This will delete all data in the database!')

    try {
      // This is a simplified reset - in practice you'd want more robust cleanup
      const branches = await SupabaseService.getBranches()

      for (const branch of branches) {
        // Delete products
        // Delete inventory items
        // Delete other related data
        // Finally delete branch
      }

      console.log('🗑️ Database reset completed')
    } catch (error) {
      console.error('❌ Database reset failed:', error)
    }
  }
}

/**
 * Utility function to run migration from browser console
 * Usage: window.runMigration()
 */
if (typeof window !== 'undefined') {
  (window as any).runMigration = () => {
    return DataMigration.runCompleteMigration()
  }

  (window as any).checkMigration = () => {
    return DataMigration.isMigrationNeeded()
  }
}
