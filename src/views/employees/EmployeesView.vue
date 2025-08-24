<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEmployeeStore } from '@/stores/employees'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  UserPlusIcon,
  ClockIcon,
  CalendarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  PlayIcon,
  StopIcon,
} from '@heroicons/vue/24/outline'
import type { Employee } from '@/stores/employees'

const employeeStore = useEmployeeStore()

const activeTab = ref('overview')
const showAddEmployeeDialog = ref(false)

// Forms
const newEmployee = ref<Partial<Employee>>({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  position: 'barista',
  department: 'operations',
  hourlyRate: 15.0,
  status: 'active',
  maxHoursPerWeek: 40,
})

// Computed
const todaysWorkers = computed(() => {
  return employeeStore.todaysSchedule.map((schedule) => {
    const employee = employeeStore.employees.find((emp) => emp.id === schedule.employeeId)
    return {
      schedule,
      employee,
      timeEntry: employeeStore.timeEntries.find(
        (entry) =>
          entry.employeeId === schedule.employeeId &&
          entry.date.toDateString() === new Date().toDateString(),
      ),
    }
  })
})

const weeklySchedule = computed(() => {
  const today = new Date()
  const startOfWeek = new Date(today)
  startOfWeek.setDate(today.getDate() - today.getDay())

  const schedule = []
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek)
    date.setDate(date.getDate() + i)

    const daySchedules = employeeStore.schedules
      .filter((s) => s.date.toDateString() === date.toDateString())
      .map((schedule) => ({
        ...schedule,
        employee: employeeStore.employees.find((emp) => emp.id === schedule.employeeId),
      }))

    schedule.push({
      date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      schedules: daySchedules,
    })
  }

  return schedule
})

const employeePerformance = computed(() => {
  return employeeStore.employees.map((employee) => {
    const metrics = employeeStore.performanceMetrics.find((m) => m.employeeId === employee.id)
    const thisWeekHours = employeeStore.timeEntries
      .filter((entry) => {
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        return entry.employeeId === employee.id && entry.date >= weekStart
      })
      .reduce((sum, entry) => sum + entry.totalHours, 0)

    return {
      employee,
      metrics,
      thisWeekHours,
      status: getEmployeeStatus(employee.id),
    }
  })
})

// Functions
function getEmployeeStatus(employeeId: string) {
  const timeEntry = employeeStore.timeEntries.find(
    (entry) =>
      entry.employeeId === employeeId &&
      entry.date.toDateString() === new Date().toDateString() &&
      entry.status === 'clocked_in',
  )

  if (timeEntry) {
    return timeEntry.status === 'on_break' ? 'On Break' : 'Working'
  }

  const todaySchedule = employeeStore.todaysSchedule.find((s) => s.employeeId === employeeId)
  if (todaySchedule) {
    const now = new Date()
    const [startHour, startMin] = todaySchedule.startTime.split(':').map(Number)
    const [endHour, endMin] = todaySchedule.endTime.split(':').map(Number)

    const startTime = new Date()
    startTime.setHours(startHour, startMin, 0, 0)
    const endTime = new Date()
    endTime.setHours(endHour, endMin, 0, 0)

    if (now >= startTime && now <= endTime) {
      return 'Scheduled'
    }
  }

  return 'Off Duty'
}

function addEmployee() {
  if (newEmployee.value.firstName && newEmployee.value.lastName) {
    employeeStore.addEmployee({
      ...newEmployee.value,
      employeeId: `JC${Date.now().toString().slice(-3)}`,
      hireDate: new Date(),
      branchId: 'branch-1', // This should come from branch store
      permissions: getDefaultPermissions(newEmployee.value.position || 'barista'),
      emergencyContact: {
        name: '',
        relationship: '',
        phone: '',
      },
      availability: getDefaultAvailability(),
      address: '',
    } as Omit<Employee, 'id'>)

    resetNewEmployee()
    showAddEmployeeDialog.value = false
  }
}

function resetNewEmployee() {
  newEmployee.value = {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: 'barista',
    department: 'operations',
    hourlyRate: 15.0,
    status: 'active',
    maxHoursPerWeek: 40,
  }
}

function getDefaultPermissions(position: string): string[] {
  switch (position) {
    case 'manager':
      return ['all']
    case 'assistant_manager':
      return ['pos', 'inventory', 'reports', 'employees_view']
    case 'supervisor':
      return ['pos', 'inventory_view', 'employees_view']
    default:
      return ['pos']
  }
}

function getDefaultAvailability() {
  return {
    monday: { available: true, start: '09:00', end: '17:00' },
    tuesday: { available: true, start: '09:00', end: '17:00' },
    wednesday: { available: true, start: '09:00', end: '17:00' },
    thursday: { available: true, start: '09:00', end: '17:00' },
    friday: { available: true, start: '09:00', end: '17:00' },
    saturday: { available: false },
    sunday: { available: false },
  }
}

function clockIn(employeeId: string) {
  // Simulate GPS location
  const location = { lat: 40.7128, lng: -74.006 }
  employeeStore.clockIn(employeeId, location)
}

function clockOut(employeeId: string) {
  employeeStore.clockOut(employeeId)
}

function formatTime(timeString: string) {
  const [hours, minutes] = timeString.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function getPositionColor(position: string) {
  const colors: Record<string, string> = {
    manager: 'bg-purple-100 text-purple-800',
    assistant_manager: 'bg-blue-100 text-blue-800',
    supervisor: 'bg-green-100 text-green-800',
    barista: 'bg-yellow-100 text-yellow-800',
    cashier: 'bg-orange-100 text-orange-800',
    cleaner: 'bg-gray-100 text-gray-800',
  }
  return colors[position] || 'bg-gray-100 text-gray-800'
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    Working: 'bg-green-100 text-green-800',
    'On Break': 'bg-yellow-100 text-yellow-800',
    Scheduled: 'bg-blue-100 text-blue-800',
    'Off Duty': 'bg-gray-100 text-gray-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function approveRequest(requestId: string) {
  employeeStore.approveShiftRequest(requestId, 'Approved by manager')
}

function denyRequest(requestId: string) {
  employeeStore.denyShiftRequest(requestId, 'Denied by manager')
}

function generatePayroll() {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 14) // Last 2 weeks
  const endDate = new Date()

  const payroll = employeeStore.calculatePayroll(startDate, endDate)
  alert(
    `Payroll generated: ${formatCurrency(payroll.totalAmount)} for ${payroll.entries.length} employees`,
  )
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold">Employee Management</h1>
      <div class="flex space-x-2">
        <Button @click="generatePayroll" variant="outline">
          <ChartBarIcon class="h-4 w-4 mr-2" />
          Generate Payroll
        </Button>
        <Button @click="showAddEmployeeDialog = true">
          <UserPlusIcon class="h-4 w-4 mr-2" />
          Add Employee
        </Button>
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Total Employees</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">{{ employeeStore.employees.length }}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Active Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-green-600">
            {{ employeeStore.todaysSchedule.length }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Currently Working</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-blue-600">
            {{ employeeStore.currentlyWorking.length }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold text-orange-600">
            {{ employeeStore.pendingRequests.length }}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-2">
          <CardTitle class="text-sm font-medium">This Week Hours</CardTitle>
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">
            {{
              employeeStore.timeEntries.reduce((sum, entry) => sum + entry.totalHours, 0).toFixed(1)
            }}
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Main Tabs -->
    <Tabs v-model="activeTab" class="w-full">
      <TabsList class="grid w-full grid-cols-6">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="employees">Employees</TabsTrigger>
        <TabsTrigger value="schedule">Schedule</TabsTrigger>
        <TabsTrigger value="time-tracking">Time Tracking</TabsTrigger>
        <TabsTrigger value="performance">Performance</TabsTrigger>
        <TabsTrigger value="requests">Requests</TabsTrigger>
      </TabsList>

      <!-- Overview Tab -->
      <TabsContent value="overview" class="space-y-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Today's Workers -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center">
                <ClockIcon class="h-5 w-5 mr-2" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div v-if="todaysWorkers.length === 0" class="text-gray-500 text-sm">
                  No employees scheduled today
                </div>
                <div
                  v-for="worker in todaysWorkers"
                  :key="worker.schedule.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded"
                >
                  <div class="flex items-center space-x-3">
                    <div
                      class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                    >
                      {{ worker.employee?.firstName?.charAt(0)
                      }}{{ worker.employee?.lastName?.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-medium">
                        {{ worker.employee?.firstName }} {{ worker.employee?.lastName }}
                      </p>
                      <p class="text-sm text-gray-600">
                        {{ formatTime(worker.schedule.startTime) }} -
                        {{ formatTime(worker.schedule.endTime) }}
                      </p>
                    </div>
                  </div>
                  <div class="flex items-center space-x-2">
                    <span
                      :class="`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getEmployeeStatus(worker.schedule.employeeId))}`"
                    >
                      {{ getEmployeeStatus(worker.schedule.employeeId) }}
                    </span>
                    <div
                      v-if="
                        !worker.timeEntry &&
                        getEmployeeStatus(worker.schedule.employeeId) === 'Scheduled'
                      "
                    >
                      <Button size="sm" @click="clockIn(worker.schedule.employeeId)">
                        <PlayIcon class="h-3 w-3 mr-1" />Clock In
                      </Button>
                    </div>
                    <div v-else-if="worker.timeEntry?.status === 'clocked_in'">
                      <Button
                        size="sm"
                        variant="outline"
                        @click="clockOut(worker.schedule.employeeId)"
                      >
                        <StopIcon class="h-3 w-3 mr-1" />Clock Out
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <!-- Pending Requests -->
          <Card>
            <CardHeader>
              <CardTitle class="flex items-center">
                <ExclamationTriangleIcon class="h-5 w-5 mr-2 text-orange-500" />
                Pending Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div class="space-y-3">
                <div
                  v-if="employeeStore.pendingRequests.length === 0"
                  class="text-gray-500 text-sm"
                >
                  No pending requests
                </div>
                <div
                  v-for="request in employeeStore.pendingRequests"
                  :key="request.id"
                  class="flex items-center justify-between p-3 bg-orange-50 rounded"
                >
                  <div class="flex-1">
                    <p class="font-medium">{{ request.type.replace('_', ' ').toUpperCase() }}</p>
                    <p class="text-sm text-gray-600">{{ request.reason }}</p>
                    <p class="text-xs text-gray-500">
                      {{ request.requestDate.toLocaleDateString() }}
                    </p>
                  </div>
                  <div class="flex space-x-1">
                    <Button size="sm" @click="approveRequest(request.id)">
                      <CheckCircleIcon class="h-3 w-3" />
                    </Button>
                    <Button size="sm" variant="outline" @click="denyRequest(request.id)">
                      <XCircleIcon class="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <!-- Employees Tab -->
      <TabsContent value="employees" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Employee Directory</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="employee in employeeStore.employees"
                :key="employee.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex items-center space-x-4">
                  <div
                    class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold"
                  >
                    {{ employee.firstName.charAt(0) }}{{ employee.lastName.charAt(0) }}
                  </div>
                  <div>
                    <h3 class="font-semibold">{{ employee.firstName }} {{ employee.lastName }}</h3>
                    <p class="text-sm text-gray-600">{{ employee.email }}</p>
                    <div class="flex items-center space-x-2 mt-1">
                      <span
                        :class="`px-2 py-1 rounded-full text-xs font-medium ${getPositionColor(employee.position)}`"
                      >
                        {{ employee.position.replace('_', ' ').toUpperCase() }}
                      </span>
                      <span class="text-xs text-gray-500">{{ employee.employeeId }}</span>
                    </div>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-medium">{{ formatCurrency(employee.hourlyRate) }}/hr</p>
                  <p class="text-sm text-gray-600">{{ employee.maxHoursPerWeek }}h/week max</p>
                  <Badge :variant="employee.status === 'active' ? 'default' : 'secondary'">
                    {{ employee.status.toUpperCase() }}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Schedule Tab -->
      <TabsContent value="schedule" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle class="flex items-center">
              <CalendarIcon class="h-5 w-5 mr-2" />
              Weekly Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="grid grid-cols-7 gap-2">
              <div
                v-for="day in weeklySchedule"
                :key="day.date.toISOString()"
                class="border rounded p-2"
              >
                <h4 class="font-medium text-center mb-2">{{ day.dayName }}</h4>
                <div class="text-xs text-center text-gray-600 mb-2">
                  {{ day.date.getDate() }}
                </div>
                <div class="space-y-1">
                  <div
                    v-for="schedule in day.schedules"
                    :key="schedule.id"
                    class="bg-blue-100 p-1 rounded text-xs"
                  >
                    <p class="font-medium">{{ schedule.employee?.firstName }}</p>
                    <p>{{ formatTime(schedule.startTime) }}-{{ formatTime(schedule.endTime) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Time Tracking Tab -->
      <TabsContent value="time-tracking" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="entry in employeeStore.timeEntries.slice(0, 10)"
                :key="entry.id"
                class="flex items-center justify-between p-3 border rounded"
              >
                <div class="flex items-center space-x-3">
                  <div
                    class="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                  >
                    {{
                      employeeStore.employees
                        .find((emp) => emp.id === entry.employeeId)
                        ?.firstName?.charAt(0)
                    }}
                  </div>
                  <div>
                    <p class="font-medium">
                      {{
                        employeeStore.employees.find((emp) => emp.id === entry.employeeId)
                          ?.firstName
                      }}
                      {{
                        employeeStore.employees.find((emp) => emp.id === entry.employeeId)?.lastName
                      }}
                    </p>
                    <p class="text-sm text-gray-600">{{ entry.date.toLocaleDateString() }}</p>
                  </div>
                </div>
                <div class="text-right">
                  <p class="font-medium">{{ entry.totalHours.toFixed(2) }}h</p>
                  <p class="text-sm text-gray-600">
                    {{ entry.clockIn.toLocaleTimeString() }} -
                    {{ entry.clockOut?.toLocaleTimeString() || 'In Progress' }}
                  </p>
                  <Badge :variant="entry.status === 'clocked_out' ? 'default' : 'secondary'">
                    {{ entry.status.replace('_', ' ').toUpperCase() }}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Performance Tab -->
      <TabsContent value="performance" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Employee Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="perf in employeePerformance"
                :key="perf.employee.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex items-center space-x-4">
                  <div
                    class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-semibold"
                  >
                    {{ perf.employee.firstName.charAt(0) }}{{ perf.employee.lastName.charAt(0) }}
                  </div>
                  <div>
                    <h3 class="font-semibold">
                      {{ perf.employee.firstName }} {{ perf.employee.lastName }}
                    </h3>
                    <p class="text-sm text-gray-600">
                      This week: {{ perf.thisWeekHours.toFixed(1) }} hours
                    </p>
                  </div>
                </div>
                <div class="text-right">
                  <div v-if="perf.metrics" class="space-y-1">
                    <p class="text-sm">
                      Sales: {{ formatCurrency(perf.metrics.metrics.salesAmount) }}
                    </p>
                    <p class="text-sm">
                      Rating: ⭐ {{ perf.metrics.metrics.customerRating.toFixed(1) }}
                    </p>
                    <p class="text-sm">Score: {{ perf.metrics.overallScore.toFixed(1) }}%</p>
                  </div>
                  <Badge :variant="perf.status === 'Working' ? 'default' : 'secondary'">
                    {{ perf.status }}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <!-- Requests Tab -->
      <TabsContent value="requests" class="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>All Shift Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-if="employeeStore.shiftRequests.length === 0"
                class="text-center text-gray-500 py-8"
              >
                No shift requests found
              </div>
              <div
                v-for="request in employeeStore.shiftRequests"
                :key="request.id"
                class="flex items-center justify-between p-4 border rounded-lg"
              >
                <div class="flex-1">
                  <div class="flex items-center space-x-3">
                    <h3 class="font-semibold">
                      {{ request.type.replace('_', ' ').toUpperCase() }}
                    </h3>
                    <Badge
                      :variant="
                        request.status === 'pending'
                          ? 'warning'
                          : request.status === 'approved'
                            ? 'default'
                            : 'destructive'
                      "
                    >
                      {{ request.status.toUpperCase() }}
                    </Badge>
                  </div>
                  <p class="text-sm text-gray-600 mt-1">{{ request.reason }}</p>
                  <p class="text-xs text-gray-500 mt-1">
                    Requested: {{ request.requestDate.toLocaleDateString() }}
                  </p>
                  <div v-if="request.reviewNotes" class="text-xs text-gray-600 mt-1">
                    Review: {{ request.reviewNotes }}
                  </div>
                </div>
                <div v-if="request.status === 'pending'" class="flex space-x-2">
                  <Button size="sm" @click="approveRequest(request.id)"> Approve </Button>
                  <Button size="sm" variant="outline" @click="denyRequest(request.id)">
                    Deny
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>

    <!-- Add Employee Dialog -->
    <Dialog v-model:open="showAddEmployeeDialog">
      <DialogContent class="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Add New Employee</DialogTitle>
        </DialogHeader>
        <div class="grid gap-4 py-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">First Name</label>
              <Input v-model="newEmployee.firstName" />
            </div>
            <div>
              <label class="text-sm font-medium">Last Name</label>
              <Input v-model="newEmployee.lastName" />
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="text-sm font-medium">Email</label>
              <Input v-model="newEmployee.email" type="email" />
            </div>
            <div>
              <label class="text-sm font-medium">Phone</label>
              <Input v-model="newEmployee.phone" />
            </div>
          </div>
          <div class="grid grid-cols-3 gap-4">
            <div>
              <label class="text-sm font-medium">Position</label>
              <Select v-model="newEmployee.position">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="assistant_manager">Assistant Manager</SelectItem>
                  <SelectItem value="barista">Barista</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label class="text-sm font-medium">Hourly Rate</label>
              <Input v-model.number="newEmployee.hourlyRate" type="number" step="0.25" />
            </div>
            <div>
              <label class="text-sm font-medium">Max Hours/Week</label>
              <Input v-model.number="newEmployee.maxHoursPerWeek" type="number" />
            </div>
          </div>
        </div>
        <div class="flex justify-end space-x-2">
          <Button variant="outline" @click="showAddEmployeeDialog = false">Cancel</Button>
          <Button @click="addEmployee">Add Employee</Button>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>
