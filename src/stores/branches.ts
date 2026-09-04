import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useSyncStore } from './sync'

export interface Branch {
  id: string
  name: string
  address: string
  phone: string
  email: string
  manager: string
  status: 'active' | 'inactive' | 'maintenance'
  openingHours: string
  totalSales: number
  dailySales: number
  employees: number
  lastUpdated: Date
}

export const useBranchesStore = defineStore('branches', () => {
  const getDefaultBranches = (): Branch[] => [
    {
      id: 'branch-1',
      name: "Judy's Cafe Downtown (Flagship)",
      address: '123 Main Street, Downtown City, DC 12345',
      phone: '(555) 123-4567',
      email: 'downtown@judyscafe.com',
      manager: 'Sarah Johnson',
      status: 'active',
      openingHours: '6:00 AM - 10:00 PM',
      totalSales: 125450.75,
      dailySales: 1250.5,
      employees: 8,
      lastUpdated: new Date(),
    },
    {
      id: 'branch-2',
      name: "Judy's Cafe Uptown Roastery",
      address: '456 Oak Avenue, Uptown City, UC 67890',
      phone: '(555) 987-6543',
      email: 'uptown@judyscafe.com',
      manager: 'Michael Chen',
      status: 'active',
      openingHours: '7:00 AM - 9:00 PM',
      totalSales: 98750.25,
      dailySales: 980.25,
      employees: 6,
      lastUpdated: new Date(),
    },
    {
      id: 'branch-3',
      name: "Judy's Express Bayfront",
      address: '789 Shopping Center, Mall District, MD 54321',
      phone: '(555) 456-7890',
      email: 'bayfront@judyscafe.com',
      manager: 'Emma Rodriguez',
      status: 'maintenance',
      openingHours: '10:00 AM - 10:00 PM',
      totalSales: 76230.5,
      dailySales: 0,
      employees: 5,
      lastUpdated: new Date(),
    },
  ]

  const loadBranches = (): Branch[] => {
    const saved = localStorage.getItem('judys_branches')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        return parsed.map((b: any) => ({
          ...b,
          lastUpdated: new Date(b.lastUpdated)
        }))
      } catch (e) {
        console.error('Failed to parse saved branches', e)
      }
    }
    return getDefaultBranches()
  }

  const branches = ref<Branch[]>(loadBranches())

  const selectedBranchId = ref<string | null>(null)

  function saveBranches() {
    localStorage.setItem('judys_branches', JSON.stringify(branches.value))
  }

  // Computed properties
  const selectedBranch = computed(() => {
    if (!selectedBranchId.value) return null
    return branches.value.find((branch) => branch.id === selectedBranchId.value) || null
  })

  const activeBranches = computed(() =>
    branches.value.filter((branch) => branch.status === 'active'),
  )

  const userAccessibleBranches = computed(() => {
    // This will be filtered based on user permissions in the components
    return branches.value
  })

  // Actions
  function selectBranch(branchId: string) {
    const branch = branches.value.find((b) => b.id === branchId)
    if (branch) {
      selectedBranchId.value = branchId
      localStorage.setItem('selected_branch_id', branchId)
      return true
    }
    return false
  }

  function clearBranchSelection() {
    selectedBranchId.value = null
    localStorage.removeItem('selected_branch_id')
  }

  function getBranchById(branchId: string): Branch | null {
    return branches.value.find((branch) => branch.id === branchId) || null
  }

  function addBranch(branchData: Omit<Branch, 'id' | 'totalSales' | 'dailySales' | 'lastUpdated'>) {
    const newBranch: Branch = {
      ...branchData,
      id: `branch-${Date.now()}`,
      totalSales: 0,
      dailySales: 0,
      lastUpdated: new Date(),
    }
    branches.value.push(newBranch)
    saveBranches()

    // Sync with Supabase
    const syncStore = useSyncStore()
    syncStore.queueAction('branches', 'insert', {
      id: newBranch.id,
      name: newBranch.name,
      address: newBranch.address,
      phone: newBranch.phone,
      email: newBranch.email,
      manager: newBranch.manager,
      status: newBranch.status,
      opening_hours: newBranch.openingHours,
      total_sales: newBranch.totalSales,
      daily_sales: newBranch.dailySales,
      employees: newBranch.employees
    })

    return newBranch
  }

  function updateBranch(branchId: string, updates: Partial<Branch>) {
    const index = branches.value.findIndex((branch) => branch.id === branchId)
    if (index !== -1) {
      branches.value[index] = {
        ...branches.value[index],
        ...updates,
        lastUpdated: new Date(),
      }
      saveBranches()

      // Sync with Supabase
      const syncStore = useSyncStore()
      const updated = branches.value[index]
      syncStore.queueAction('branches', 'update', {
        id: updated.id,
        name: updated.name,
        address: updated.address,
        phone: updated.phone,
        email: updated.email,
        manager: updated.manager,
        status: updated.status,
        opening_hours: updated.openingHours,
        total_sales: updated.totalSales,
        daily_sales: updated.dailySales,
        employees: updated.employees
      })

      return branches.value[index]
    }
    return null
  }

  function deleteBranch(branchId: string) {
    const index = branches.value.findIndex((branch) => branch.id === branchId)
    if (index !== -1) {
      // Clear selection if deleting the selected branch
      if (selectedBranchId.value === branchId) {
        clearBranchSelection()
      }
      branches.value.splice(index, 1)
      saveBranches()
      return true
    }
    return false
  }

  function initFromStorage() {
    const savedBranchId = localStorage.getItem('selected_branch_id')
    if (savedBranchId && getBranchById(savedBranchId)) {
      selectedBranchId.value = savedBranchId
    }
  }

  return {
    // State
    branches,
    selectedBranchId,

    // Computed
    selectedBranch,
    activeBranches,
    userAccessibleBranches,

    // Actions
    selectBranch,
    clearBranchSelection,
    getBranchById,
    addBranch,
    updateBranch,
    deleteBranch,
    initFromStorage,
  }
})
