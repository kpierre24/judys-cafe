import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

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
  const branches = ref<Branch[]>([
    {
      id: 'branch-1',
      name: "Judy's Cafe Downtown",
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
      name: "Judy's Cafe Uptown",
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
      name: "Judy's Cafe Mall",
      address: '789 Shopping Center, Mall District, MD 54321',
      phone: '(555) 456-7890',
      email: 'mall@judyscafe.com',
      manager: 'Emma Rodriguez',
      status: 'maintenance',
      openingHours: '10:00 AM - 10:00 PM',
      totalSales: 76230.5,
      dailySales: 0,
      employees: 5,
      lastUpdated: new Date(),
    },
  ])

  const selectedBranchId = ref<string | null>(null)

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
