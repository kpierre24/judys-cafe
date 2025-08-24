import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useBranchesStore } from './branches'

export interface Employee {
  id: string
  employeeId: string // Employee badge/ID number
  firstName: string
  lastName: string
  email: string
  phone: string
  address: string
  position: 'manager' | 'assistant_manager' | 'barista' | 'cashier' | 'cleaner' | 'supervisor'
  department: 'operations' | 'kitchen' | 'front_of_house' | 'management' | 'maintenance'
  hireDate: Date
  hourlyRate: number
  branchId: string
  status: 'active' | 'inactive' | 'terminated' | 'on_leave'
  permissions: string[]
  emergencyContact: {
    name: string
    relationship: string
    phone: string
  }
  availability: {
    monday: { available: boolean; start?: string; end?: string }
    tuesday: { available: boolean; start?: string; end?: string }
    wednesday: { available: boolean; start?: string; end?: string }
    thursday: { available: boolean; start?: string; end?: string }
    friday: { available: boolean; start?: string; end?: string }
    saturday: { available: boolean; start?: string; end?: string }
    sunday: { available: boolean; start?: string; end?: string }
  }
  maxHoursPerWeek: number
  profilePicture?: string
}

export interface Schedule {
  id: string
  employeeId: string
  branchId: string
  date: Date
  startTime: string // HH:mm format
  endTime: string
  position: string
  notes?: string
  status: 'scheduled' | 'confirmed' | 'called_off' | 'no_show' | 'completed'
  isPublished: boolean
  createdBy: string
  createdAt: Date
  shiftType: 'opening' | 'mid' | 'closing' | 'full_day'
}

export interface TimeEntry {
  id: string
  employeeId: string
  branchId: string
  date: Date
  clockIn: Date
  clockOut?: Date
  breakStart?: Date
  breakEnd?: Date
  totalHours: number
  regularHours: number
  overtimeHours: number
  status: 'clocked_in' | 'on_break' | 'clocked_out'
  location: { lat: number; lng: number } // GPS tracking
  notes?: string
  approvedBy?: string
  approvedAt?: Date
}

export interface PayrollPeriod {
  id: string
  startDate: Date
  endDate: Date
  status: 'draft' | 'calculated' | 'approved' | 'paid'
  branchId: string
  entries: PayrollEntry[]
  totalAmount: number
  createdAt: Date
}

export interface PayrollEntry {
  employeeId: string
  regularHours: number
  overtimeHours: number
  holidayHours: number
  sickHours: number
  vacationHours: number
  bonuses: number
  deductions: number
  grossPay: number
  netPay: number
  taxes: number
}

export interface PerformanceMetric {
  id: string
  employeeId: string
  branchId: string
  period: 'weekly' | 'monthly' | 'quarterly'
  startDate: Date
  endDate: Date
  metrics: {
    salesAmount: number
    transactionCount: number
    averageTransactionValue: number
    customerRating: number
    punctualityScore: number
    attendancePercentage: number
    tasksCompleted: number
    customerComplaints: number
    customerCompliments: number
  }
  goals: {
    salesTarget: number
    transactionTarget: number
    customerRatingTarget: number
  }
  overallScore: number
  notes?: string
}

export interface ShiftRequest {
  id: string
  employeeId: string
  branchId: string
  type: 'time_off' | 'schedule_change' | 'extra_hours' | 'swap_shift'
  requestDate: Date
  affectedDates: Date[]
  reason: string
  status: 'pending' | 'approved' | 'denied'
  reviewedBy?: string
  reviewedAt?: Date
  reviewNotes?: string
  relatedEmployeeId?: string // For shift swaps
}

export const useEmployeeStore = defineStore('employees', () => {
  const branchesStore = useBranchesStore()

  // Branch-specific data
  const branchData = ref<
    Record<
      string,
      {
        employees: Employee[]
        schedules: Schedule[]
        timeEntries: TimeEntry[]
        payrollPeriods: PayrollPeriod[]
        performanceMetrics: PerformanceMetric[]
        shiftRequests: ShiftRequest[]
      }
    >
  >({})

  // Helper functions
  function getCurrentBranchData() {
    const branchId = branchesStore.selectedBranchId
    if (!branchId) {
      throw new Error('No branch selected')
    }

    if (!branchData.value[branchId]) {
      initializeBranchData(branchId)
    }

    return branchData.value[branchId]
  }

  function initializeBranchData(branchId: string) {
    branchData.value[branchId] = {
      employees: getDefaultEmployees(branchId),
      schedules: [],
      timeEntries: [],
      payrollPeriods: [],
      performanceMetrics: [],
      shiftRequests: [],
    }

    // Generate sample schedules and time entries
    generateSampleSchedules(branchId)
    generateSampleTimeEntries(branchId)
    generateSamplePerformanceMetrics(branchId)
  }

  function getDefaultEmployees(branchId: string): Employee[] {
    return [
      {
        id: 'emp-1',
        employeeId: 'JC001',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah.johnson@judyscafe.com',
        phone: '+1-555-0201',
        address: '123 Main St, Coffee City',
        position: 'manager',
        department: 'management',
        hireDate: new Date('2023-01-15'),
        hourlyRate: 22.5,
        branchId,
        status: 'active',
        permissions: ['all'],
        emergencyContact: {
          name: 'Mike Johnson',
          relationship: 'Spouse',
          phone: '+1-555-0202',
        },
        availability: {
          monday: { available: true, start: '07:00', end: '17:00' },
          tuesday: { available: true, start: '07:00', end: '17:00' },
          wednesday: { available: true, start: '07:00', end: '17:00' },
          thursday: { available: true, start: '07:00', end: '17:00' },
          friday: { available: true, start: '07:00', end: '17:00' },
          saturday: { available: false },
          sunday: { available: false },
        },
        maxHoursPerWeek: 40,
      },
      {
        id: 'emp-2',
        employeeId: 'JC002',
        firstName: 'Alex',
        lastName: 'Rodriguez',
        email: 'alex.rodriguez@judyscafe.com',
        phone: '+1-555-0203',
        address: '456 Coffee Ave, Bean Town',
        position: 'barista',
        department: 'operations',
        hireDate: new Date('2023-03-20'),
        hourlyRate: 16.75,
        branchId,
        status: 'active',
        permissions: ['pos', 'inventory_view'],
        emergencyContact: {
          name: 'Maria Rodriguez',
          relationship: 'Mother',
          phone: '+1-555-0204',
        },
        availability: {
          monday: { available: true, start: '06:00', end: '14:00' },
          tuesday: { available: true, start: '06:00', end: '14:00' },
          wednesday: { available: true, start: '06:00', end: '14:00' },
          thursday: { available: true, start: '06:00', end: '14:00' },
          friday: { available: true, start: '06:00', end: '14:00' },
          saturday: { available: true, start: '08:00', end: '16:00' },
          sunday: { available: false },
        },
        maxHoursPerWeek: 35,
      },
      {
        id: 'emp-3',
        employeeId: 'JC003',
        firstName: 'Emma',
        lastName: 'Chen',
        email: 'emma.chen@judyscafe.com',
        phone: '+1-555-0205',
        address: '789 Brew St, Espresso Heights',
        position: 'cashier',
        department: 'front_of_house',
        hireDate: new Date('2023-06-10'),
        hourlyRate: 15.25,
        branchId,
        status: 'active',
        permissions: ['pos'],
        emergencyContact: {
          name: 'David Chen',
          relationship: 'Father',
          phone: '+1-555-0206',
        },
        availability: {
          monday: { available: true, start: '14:00', end: '22:00' },
          tuesday: { available: true, start: '14:00', end: '22:00' },
          wednesday: { available: true, start: '14:00', end: '22:00' },
          thursday: { available: false },
          friday: { available: true, start: '14:00', end: '22:00' },
          saturday: { available: true, start: '10:00', end: '18:00' },
          sunday: { available: true, start: '12:00', end: '20:00' },
        },
        maxHoursPerWeek: 25,
      },
    ]
  }

  function generateSampleSchedules(branchId: string) {
    const data = branchData.value[branchId]
    const today = new Date()
    const schedules: Schedule[] = []

    // Generate schedules for the next 7 days
    for (let i = 0; i < 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() + i)

      data.employees.forEach((employee) => {
        const dayName = date.toLocaleDateString('en-US', {
          weekday: 'long',
        }).toLowerCase() as keyof typeof employee.availability
        const availability = employee.availability[dayName]

        if (availability.available && availability.start && availability.end) {
          schedules.push({
            id: `schedule-${employee.id}-${date.toISOString().split('T')[0]}`,
            employeeId: employee.id,
            branchId,
            date,
            startTime: availability.start,
            endTime: availability.end,
            position: employee.position,
            status: i < 2 ? 'completed' : 'scheduled',
            isPublished: true,
            createdBy: 'emp-1',
            createdAt: new Date(),
            shiftType: getShiftType(availability.start, availability.end),
          })
        }
      })
    }

    data.schedules = schedules
  }

  function generateSampleTimeEntries(branchId: string) {
    const data = branchData.value[branchId]
    const today = new Date()
    const timeEntries: TimeEntry[] = []

    // Generate time entries for the past 7 days
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)

      data.employees.forEach((employee) => {
        const schedule = data.schedules.find(
          (s) => s.employeeId === employee.id && s.date.toDateString() === date.toDateString(),
        )

        if (schedule) {
          const clockIn = new Date(date)
          const [startHour, startMin] = schedule.startTime.split(':').map(Number)
          clockIn.setHours(startHour, startMin, 0, 0)

          const clockOut = new Date(date)
          const [endHour, endMin] = schedule.endTime.split(':').map(Number)
          clockOut.setHours(endHour, endMin, 0, 0)

          const totalHours = (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60)
          const regularHours = Math.min(totalHours, 8)
          const overtimeHours = Math.max(totalHours - 8, 0)

          timeEntries.push({
            id: `time-${employee.id}-${date.toISOString().split('T')[0]}`,
            employeeId: employee.id,
            branchId,
            date,
            clockIn,
            clockOut,
            totalHours,
            regularHours,
            overtimeHours,
            status: 'clocked_out',
            location: { lat: 40.7128, lng: -74.006 }, // NYC coordinates
            approvedBy: 'emp-1',
            approvedAt: new Date(),
          })
        }
      })
    }

    data.timeEntries = timeEntries
  }

  function generateSamplePerformanceMetrics(branchId: string) {
    const data = branchData.value[branchId]
    const thisMonth = new Date()
    thisMonth.setDate(1)

    const nextMonth = new Date(thisMonth)
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    data.employees.forEach((employee) => {
      const salesAmount = Math.random() * 5000 + 2000 // $2000-$7000
      const transactionCount = Math.floor(Math.random() * 200 + 100)
      const customerRating = Math.random() * 2 + 3 // 3-5 stars

      data.performanceMetrics.push({
        id: `perf-${employee.id}-${thisMonth.getFullYear()}-${thisMonth.getMonth()}`,
        employeeId: employee.id,
        branchId,
        period: 'monthly',
        startDate: thisMonth,
        endDate: nextMonth,
        metrics: {
          salesAmount,
          transactionCount,
          averageTransactionValue: salesAmount / transactionCount,
          customerRating,
          punctualityScore: Math.random() * 20 + 80, // 80-100%
          attendancePercentage: Math.random() * 10 + 90, // 90-100%
          tasksCompleted: Math.floor(Math.random() * 50 + 30),
          customerComplaints: Math.floor(Math.random() * 3),
          customerCompliments: Math.floor(Math.random() * 10 + 5),
        },
        goals: {
          salesTarget: 4000,
          transactionTarget: 150,
          customerRatingTarget: 4.5,
        },
        overallScore: Math.random() * 30 + 70, // 70-100
      })
    })
  }

  function getShiftType(
    startTime: string,
    endTime: string,
  ): 'opening' | 'mid' | 'closing' | 'full_day' {
    const start = parseInt(startTime.split(':')[0])
    const end = parseInt(endTime.split(':')[0])
    const duration = end - start

    if (duration >= 8) return 'full_day'
    if (start <= 7) return 'opening'
    if (end >= 20) return 'closing'
    return 'mid'
  }

  // Computed properties
  const employees = computed(() => {
    try {
      return getCurrentBranchData().employees
    } catch {
      return []
    }
  })

  const schedules = computed(() => {
    try {
      return getCurrentBranchData().schedules
    } catch {
      return []
    }
  })

  const timeEntries = computed(() => {
    try {
      return getCurrentBranchData().timeEntries
    } catch {
      return []
    }
  })

  const performanceMetrics = computed(() => {
    try {
      return getCurrentBranchData().performanceMetrics
    } catch {
      return []
    }
  })

  const shiftRequests = computed(() => {
    try {
      return getCurrentBranchData().shiftRequests
    } catch {
      return []
    }
  })

  const activeEmployees = computed(() => {
    return employees.value.filter((emp) => emp.status === 'active')
  })

  const currentlyWorking = computed(() => {
    const now = new Date()
    return timeEntries.value.filter(
      (entry) => entry.status === 'clocked_in' && entry.date.toDateString() === now.toDateString(),
    )
  })

  const pendingRequests = computed(() => {
    return shiftRequests.value.filter((req) => req.status === 'pending')
  })

  const todaysSchedule = computed(() => {
    const today = new Date()
    return schedules.value.filter(
      (schedule) => schedule.date.toDateString() === today.toDateString(),
    )
  })

  // Actions
  function addEmployee(employee: Omit<Employee, 'id'>) {
    const data = getCurrentBranchData()
    const newEmployee: Employee = {
      ...employee,
      id: `emp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    }
    data.employees.push(newEmployee)
  }

  function updateEmployee(employeeId: string, updates: Partial<Employee>) {
    const data = getCurrentBranchData()
    const employeeIndex = data.employees.findIndex((emp) => emp.id === employeeId)
    if (employeeIndex !== -1) {
      data.employees[employeeIndex] = { ...data.employees[employeeIndex], ...updates }
    }
  }

  function clockIn(employeeId: string, location: { lat: number; lng: number }) {
    const data = getCurrentBranchData()
    const today = new Date()

    const timeEntry: TimeEntry = {
      id: `time-${employeeId}-${Date.now()}`,
      employeeId,
      branchId: branchesStore.selectedBranchId!,
      date: today,
      clockIn: new Date(),
      totalHours: 0,
      regularHours: 0,
      overtimeHours: 0,
      status: 'clocked_in',
      location,
    }

    data.timeEntries.push(timeEntry)
  }

  function clockOut(employeeId: string) {
    const data = getCurrentBranchData()
    const today = new Date()

    const timeEntry = data.timeEntries.find(
      (entry) =>
        entry.employeeId === employeeId &&
        entry.date.toDateString() === today.toDateString() &&
        entry.status === 'clocked_in',
    )

    if (timeEntry) {
      timeEntry.clockOut = new Date()
      timeEntry.status = 'clocked_out'

      const totalHours =
        (timeEntry.clockOut.getTime() - timeEntry.clockIn.getTime()) / (1000 * 60 * 60)
      timeEntry.totalHours = totalHours
      timeEntry.regularHours = Math.min(totalHours, 8)
      timeEntry.overtimeHours = Math.max(totalHours - 8, 0)
    }
  }

  function createSchedule(schedule: Omit<Schedule, 'id' | 'createdAt'>) {
    const data = getCurrentBranchData()
    const newSchedule: Schedule = {
      ...schedule,
      id: `schedule-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      createdAt: new Date(),
    }
    data.schedules.push(newSchedule)
  }

  function submitShiftRequest(request: Omit<ShiftRequest, 'id' | 'requestDate' | 'status'>) {
    const data = getCurrentBranchData()
    const newRequest: ShiftRequest = {
      ...request,
      id: `request-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      requestDate: new Date(),
      status: 'pending',
    }
    data.shiftRequests.push(newRequest)
  }

  function approveShiftRequest(requestId: string, reviewNotes?: string) {
    const data = getCurrentBranchData()
    const request = data.shiftRequests.find((req) => req.id === requestId)
    if (request) {
      request.status = 'approved'
      request.reviewedAt = new Date()
      request.reviewNotes = reviewNotes
    }
  }

  function denyShiftRequest(requestId: string, reviewNotes?: string) {
    const data = getCurrentBranchData()
    const request = data.shiftRequests.find((req) => req.id === requestId)
    if (request) {
      request.status = 'denied'
      request.reviewedAt = new Date()
      request.reviewNotes = reviewNotes
    }
  }

  function calculatePayroll(startDate: Date, endDate: Date): PayrollPeriod {
    const data = getCurrentBranchData()
    const branchId = branchesStore.selectedBranchId!

    const entries: PayrollEntry[] = data.employees.map((employee) => {
      const employeeTimeEntries = data.timeEntries.filter(
        (entry) =>
          entry.employeeId === employee.id &&
          entry.date >= startDate &&
          entry.date <= endDate &&
          entry.status === 'clocked_out',
      )

      const regularHours = employeeTimeEntries.reduce((sum, entry) => sum + entry.regularHours, 0)
      const overtimeHours = employeeTimeEntries.reduce((sum, entry) => sum + entry.overtimeHours, 0)

      const regularPay = regularHours * employee.hourlyRate
      const overtimePay = overtimeHours * employee.hourlyRate * 1.5
      const grossPay = regularPay + overtimePay
      const taxes = grossPay * 0.25 // Simplified tax calculation
      const netPay = grossPay - taxes

      return {
        employeeId: employee.id,
        regularHours,
        overtimeHours,
        holidayHours: 0,
        sickHours: 0,
        vacationHours: 0,
        bonuses: 0,
        deductions: 0,
        grossPay,
        netPay,
        taxes,
      }
    })

    const totalAmount = entries.reduce((sum, entry) => sum + entry.netPay, 0)

    const payrollPeriod: PayrollPeriod = {
      id: `payroll-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      startDate,
      endDate,
      status: 'calculated',
      branchId,
      entries,
      totalAmount,
      createdAt: new Date(),
    }

    data.payrollPeriods.push(payrollPeriod)
    return payrollPeriod
  }

  return {
    // State
    employees,
    schedules,
    timeEntries,
    performanceMetrics,
    shiftRequests,

    // Computed
    activeEmployees,
    currentlyWorking,
    pendingRequests,
    todaysSchedule,

    // Actions
    addEmployee,
    updateEmployee,
    clockIn,
    clockOut,
    createSchedule,
    submitShiftRequest,
    approveShiftRequest,
    denyShiftRequest,
    calculatePayroll,
  }
})
