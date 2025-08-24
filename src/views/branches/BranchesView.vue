<script setup lang="ts">
import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog } from '@/components/ui/dialog'

interface Branch {
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

const authStore = useAuthStore()

// State
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

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const selectedBranch = ref<Branch | null>(null)

const newBranch = ref({
  name: '',
  address: '',
  phone: '',
  email: '',
  manager: '',
  openingHours: '',
  status: 'active' as const,
})

// Functions
function openAddDialog() {
  resetForm()
  showAddDialog.value = true
}

function openEditDialog(branch: Branch) {
  selectedBranch.value = branch
  newBranch.value = {
    name: branch.name,
    address: branch.address,
    phone: branch.phone,
    email: branch.email,
    manager: branch.manager,
    openingHours: branch.openingHours,
    status: branch.status,
  }
  showEditDialog.value = true
}

function resetForm() {
  newBranch.value = {
    name: '',
    address: '',
    phone: '',
    email: '',
    manager: '',
    openingHours: '',
    status: 'active',
  }
}

function addBranch() {
  const branch: Branch = {
    ...newBranch.value,
    id: `branch-${Date.now()}`,
    totalSales: 0,
    dailySales: 0,
    employees: 0,
    lastUpdated: new Date(),
  }
  branches.value.push(branch)
  showAddDialog.value = false
}

function updateBranch() {
  if (selectedBranch.value) {
    const index = branches.value.findIndex((b) => b.id === selectedBranch.value!.id)
    if (index !== -1) {
      branches.value[index] = {
        ...branches.value[index],
        ...newBranch.value,
        lastUpdated: new Date(),
      }
    }
    showEditDialog.value = false
  }
}

function deleteBranch(branch: Branch) {
  if (confirm(`Are you sure you want to delete "${branch.name}"?`)) {
    const index = branches.value.findIndex((b) => b.id === branch.id)
    if (index !== -1) {
      branches.value.splice(index, 1)
    }
  }
}

function getStatusColor(status: string) {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-red-100 text-red-800',
    maintenance: 'bg-yellow-100 text-yellow-800',
  }
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'
}

function getStatusIcon(status: string) {
  const icons = {
    active: '✅',
    inactive: '❌',
    maintenance: '🔧',
  }
  return icons[status as keyof typeof icons] || '❔'
}

function viewDetails(branch: Branch) {
  // In a real app, this would navigate to branch details page
  alert(
    `Viewing details for ${branch.name}\n\nManager: ${branch.manager}\nDaily Sales: $${branch.dailySales.toFixed(2)}\nEmployees: ${branch.employees}`,
  )
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex justify-between items-start">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Branch Management</h1>
        <p class="text-gray-600">Manage multiple cafe locations and their operations</p>
      </div>
      <Button v-if="authStore.isAdmin" @click="openAddDialog" class="bg-blue-600 hover:bg-blue-700">
        + Add New Branch
      </Button>
    </div>

    <!-- Summary Cards -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Branches</p>
              <p class="text-2xl font-bold text-blue-600">{{ branches.length }}</p>
            </div>
            <div class="text-3xl">🏢</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Active Branches</p>
              <p class="text-2xl font-bold text-green-600">
                {{ branches.filter((b) => b.status === 'active').length }}
              </p>
            </div>
            <div class="text-3xl">✅</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Revenue</p>
              <p class="text-2xl font-bold text-purple-600">
                ${{ branches.reduce((sum, b) => sum + b.totalSales, 0).toFixed(0) }}
              </p>
            </div>
            <div class="text-3xl">💰</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600">Total Employees</p>
              <p class="text-2xl font-bold text-orange-600">
                {{ branches.reduce((sum, b) => sum + b.employees, 0) }}
              </p>
            </div>
            <div class="text-3xl">👥</div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Branches Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
      <Card v-for="branch in branches" :key="branch.id" class="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div class="flex justify-between items-start">
            <div>
              <h3 class="text-lg font-semibold">{{ branch.name }}</h3>
              <p class="text-sm text-gray-600">Manager: {{ branch.manager }}</p>
            </div>
            <div class="flex items-center space-x-2">
              <span
                :class="[
                  'px-2 py-1 rounded-full text-xs font-medium flex items-center space-x-1',
                  getStatusColor(branch.status),
                ]"
              >
                <span>{{ getStatusIcon(branch.status) }}</span>
                <span class="capitalize">{{ branch.status }}</span>
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-4">
          <!-- Contact Info -->
          <div class="space-y-2">
            <div class="flex items-start space-x-2 text-sm">
              <span class="text-gray-500">📍</span>
              <span class="text-gray-700">{{ branch.address }}</span>
            </div>
            <div class="flex items-center space-x-2 text-sm">
              <span class="text-gray-500">📞</span>
              <span class="text-gray-700">{{ branch.phone }}</span>
            </div>
            <div class="flex items-center space-x-2 text-sm">
              <span class="text-gray-500">📧</span>
              <span class="text-gray-700">{{ branch.email }}</span>
            </div>
            <div class="flex items-center space-x-2 text-sm">
              <span class="text-gray-500">🕰️</span>
              <span class="text-gray-700">{{ branch.openingHours }}</span>
            </div>
          </div>

          <!-- Performance Metrics -->
          <div class="grid grid-cols-2 gap-4 pt-4 border-t">
            <div class="text-center">
              <p class="text-sm text-gray-600">Today's Sales</p>
              <p class="text-lg font-bold text-green-600">${{ branch.dailySales.toFixed(0) }}</p>
            </div>
            <div class="text-center">
              <p class="text-sm text-gray-600">Employees</p>
              <p class="text-lg font-bold text-blue-600">{{ branch.employees }}</p>
            </div>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-4">
            <Button variant="outline" size="sm" class="flex-1" @click="viewDetails(branch)">
              👁️ View
            </Button>
            <Button
              v-if="authStore.isAdmin || authStore.isManager"
              variant="outline"
              size="sm"
              class="flex-1"
              @click="openEditDialog(branch)"
            >
              ✏️ Edit
            </Button>
            <Button
              v-if="authStore.isAdmin"
              variant="outline"
              size="sm"
              class="text-red-600 hover:text-red-700"
              @click="deleteBranch(branch)"
            >
              🗑️
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Add Branch Dialog -->
    <Dialog v-model:open="showAddDialog" title="Add New Branch">
      <form @submit.prevent="addBranch" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
          <Input v-model="newBranch.name" required placeholder="e.g., Judy's Cafe Downtown" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input
            v-model="newBranch.address"
            required
            placeholder="Full address with city and zip"
          />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input v-model="newBranch.phone" required placeholder="(555) 123-4567" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              v-model="newBranch.email"
              type="email"
              required
              placeholder="branch@judyscafe.com"
            />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <Input v-model="newBranch.manager" required placeholder="Manager name" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
            <Input v-model="newBranch.openingHours" required placeholder="6:00 AM - 10:00 PM" />
          </div>
        </div>

        <div class="flex gap-3 pt-4">
          <Button type="submit" class="flex-1">Add Branch</Button>
          <Button type="button" variant="outline" @click="showAddDialog = false">Cancel</Button>
        </div>
      </form>
    </Dialog>

    <!-- Edit Branch Dialog -->
    <Dialog v-model:open="showEditDialog" title="Edit Branch">
      <form @submit.prevent="updateBranch" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Branch Name</label>
          <Input v-model="newBranch.name" required />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input v-model="newBranch.address" required />
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input v-model="newBranch.phone" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input v-model="newBranch.email" type="email" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Manager</label>
            <Input v-model="newBranch.manager" required />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Opening Hours</label>
            <Input v-model="newBranch.openingHours" required />
          </div>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            v-model="newBranch.status"
            class="w-full h-10 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </div>

        <div class="flex gap-3 pt-4">
          <Button type="submit" class="flex-1">Update Branch</Button>
          <Button type="button" variant="outline" @click="showEditDialog = false">Cancel</Button>
        </div>
      </form>
    </Dialog>
  </div>
</template>
