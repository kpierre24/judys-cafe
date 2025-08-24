import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBranchesStore } from './branches'

export interface User {
  id: string
  username: string
  name: string
  role: 'admin' | 'manager' | 'cashier'
  branch_id?: string // For non-admin users, this restricts them to specific branch
  accessible_branches?: string[] // For managers who can access multiple branches
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const branchesStore = useBranchesStore()

  const isAuthenticated = computed(() => !!token.value)
  const isAdmin = computed(() => user.value?.role === 'admin')
  const isManager = computed(() => user.value?.role === 'manager')
  const isCashier = computed(() => user.value?.role === 'cashier')

  // Branch-related computed properties
  const userAccessibleBranches = computed(() => {
    if (!user.value) return []

    if (isAdmin.value) {
      // Admins can access all branches
      return branchesStore.branches
    } else if (isManager.value) {
      // Managers can access branches listed in accessible_branches or their assigned branch
      const accessibleBranchIds =
        user.value.accessible_branches || (user.value.branch_id ? [user.value.branch_id] : [])
      return branchesStore.branches.filter((branch) => accessibleBranchIds.includes(branch.id))
    } else {
      // Cashiers can only access their assigned branch
      return user.value.branch_id
        ? branchesStore.branches.filter((branch) => branch.id === user.value.branch_id)
        : []
    }
  })

  const canAccessBranch = computed(() => (branchId: string) => {
    return userAccessibleBranches.value.some((branch) => branch.id === branchId)
  })

  const requiresBranchSelection = computed(() => {
    return (
      isAuthenticated.value &&
      userAccessibleBranches.value.length > 1 &&
      !branchesStore.selectedBranchId
    )
  })

  function login(credentials: { username: string; password: string }) {
    // Simulate login - in real app, this would call an API
    const mockUsers: Record<string, User & { password: string }> = {
      admin: {
        id: '1',
        username: 'admin',
        name: 'Admin User',
        role: 'admin',
        password: 'admin123',
        // Admins have access to all branches
      },
      manager: {
        id: '2',
        username: 'manager',
        name: 'Branch Manager',
        role: 'manager',
        branch_id: 'branch-1',
        accessible_branches: ['branch-1', 'branch-2'], // Can manage multiple branches
        password: 'manager123',
      },
      manager2: {
        id: '4',
        username: 'manager2',
        name: 'Multi-Branch Manager',
        role: 'manager',
        accessible_branches: ['branch-2', 'branch-3'], // Can manage different branches
        password: 'manager123',
      },
      cashier: {
        id: '3',
        username: 'cashier',
        name: 'Cashier User',
        role: 'cashier',
        branch_id: 'branch-1', // Restricted to one branch
        password: 'cashier123',
      },
      cashier2: {
        id: '5',
        username: 'cashier2',
        name: 'Mall Cashier',
        role: 'cashier',
        branch_id: 'branch-3', // Different branch cashier
        password: 'cashier123',
      },
    }

    const foundUser = mockUsers[credentials.username]

    if (foundUser && foundUser.password === credentials.password) {
      const userWithoutPassword = { ...foundUser }
      delete (userWithoutPassword as Record<string, unknown>).password

      user.value = userWithoutPassword
      token.value = `mock-token-${Date.now()}`
      localStorage.setItem('auth_token', token.value)
      localStorage.setItem('auth_user', JSON.stringify(user.value))

      // Auto-select branch for users with only one accessible branch
      setTimeout(() => {
        const accessibleBranches = userAccessibleBranches.value
        if (accessibleBranches.length === 1) {
          branchesStore.selectBranch(accessibleBranches[0].id)
        }
      }, 0)

      return { success: true, user: user.value }
    }

    return { success: false, error: 'Invalid credentials' }
  }

  function logout() {
    user.value = null
    token.value = null
    branchesStore.clearBranchSelection()
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  function initFromStorage() {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')

    if (savedToken && savedUser) {
      token.value = savedToken
      user.value = JSON.parse(savedUser)

      // Initialize branches store and restore branch selection
      branchesStore.initFromStorage()

      // Auto-select branch for users with only one accessible branch
      setTimeout(() => {
        if (!branchesStore.selectedBranchId) {
          const accessibleBranches = userAccessibleBranches.value
          if (accessibleBranches.length === 1) {
            branchesStore.selectBranch(accessibleBranches[0].id)
          }
        }
      }, 0)
    }
  }

  return {
    user,
    token,
    isAuthenticated,
    isAdmin,
    isManager,
    isCashier,
    userAccessibleBranches,
    canAccessBranch,
    requiresBranchSelection,
    login,
    logout,
    initFromStorage,
  }
})
