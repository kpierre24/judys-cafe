<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHardwareStore } from '@/stores/hardware'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  CubeIcon,
  PrinterIcon,
  QrCodeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  PlayIcon,
  StopIcon,
  CogIcon,
  BellIcon,
  SignalIcon,
  BoltIcon,
} from '@heroicons/vue/24/outline'

const hardwareStore = useHardwareStore()
const branchesStore = useBranchesStore()

const activeTab = ref('overview')
const manualBarcode = ref('')
const paymentAmount = ref(0)
const receiptContent = ref('')
const showDiagnostics = ref(false)
const selectedDeviceId = ref('')
const diagnosticsResult = ref<any>(null)

// Computed
const devicesByType = computed(() => {
  const devices = hardwareStore.currentBranchDevices
  return {
    cashDrawer: devices.find((d) => d.type === 'cash_drawer'),
    receiptPrinter: devices.find((d) => d.type === 'receipt_printer'),
    barcodeScanner: devices.find((d) => d.type === 'barcode_scanner'),
    cardReader: devices.find((d) => d.type === 'card_reader'),
  }
})

const deviceHealth = computed(() => {
  const devices = hardwareStore.currentBranchDevices
  const total = devices.length
  const online = devices.filter((d) => d.status === 'online').length
  const offline = devices.filter((d) => d.status === 'offline').length
  const errors = devices.filter((d) => d.status === 'error').length

  return { total, online, offline, errors, health: (online / total) * 100 }
})

// Functions
function getStatusColor(status: string) {
  const colors = {
    online: 'text-green-600 bg-green-100',
    offline: 'text-gray-600 bg-gray-100',
    error: 'text-red-600 bg-red-100',
    maintenance: 'text-yellow-600 bg-yellow-100',
  }
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
}

function getDeviceIcon(type: string) {
  const icons = {
    cash_drawer: CubeIcon,
    receipt_printer: PrinterIcon,
    barcode_scanner: QrCodeIcon,
    card_reader: CreditCardIcon,
  }
  return icons[type as keyof typeof icons] || CubeIcon
}

async function toggleCashDrawer() {
  if (hardwareStore.cashDrawerOpen) {
    hardwareStore.closeCashDrawer()
  } else {
    await hardwareStore.openCashDrawer()
  }
}

function scanBarcode() {
  if (manualBarcode.value) {
    hardwareStore.simulateBarcodeScan(manualBarcode.value)
    manualBarcode.value = ''
  } else {
    hardwareStore.simulateBarcodeScan()
  }
}

async function processTestPayment() {
  if (paymentAmount.value > 0) {
    await hardwareStore.processPayment(paymentAmount.value, 'card')
    paymentAmount.value = 0
  }
}

function printTestReceipt() {
  const content =
    receiptContent.value ||
    `
JUDY'S CAFE
Test Receipt
${new Date().toLocaleString()}
------------------
Test Item         $5.00
Tax               $0.40
------------------
Total            $5.40

Thank you!
`
  hardwareStore.printReceipt(content)
  receiptContent.value = ''
}

async function runDiagnostics(deviceId: string) {
  selectedDeviceId.value = deviceId
  showDiagnostics.value = true
  diagnosticsResult.value = null

  try {
    diagnosticsResult.value = await hardwareStore.runDeviceDiagnostics(deviceId)
  } catch (error) {
    diagnosticsResult.value = { success: false, message: 'Diagnostics failed', details: {} }
  }
}

async function calibrateDevice(deviceId: string) {
  await hardwareStore.calibrateDevice(deviceId)
}

function simulateError(deviceType: string) {
  hardwareStore.simulateHardwareEvent(deviceType, 'paper_low')
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function changeTab(tab: string) {
  activeTab.value = tab
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">POS Hardware Simulation</h1>
        <p class="text-gray-600 mt-1">Monitor and control point-of-sale hardware devices</p>
      </div>
      <div class="flex items-center space-x-4">
        <div class="text-right">
          <p class="text-sm text-gray-600">System Health</p>
          <p
            class="text-lg font-bold"
            :class="deviceHealth.health > 80 ? 'text-green-600' : 'text-red-600'"
          >
            {{ Math.round(deviceHealth.health) }}%
          </p>
        </div>
        <div
          class="w-12 h-12 rounded-full flex items-center justify-center"
          :class="deviceHealth.health > 80 ? 'bg-green-100' : 'bg-red-100'"
        >
          <component
            :is="deviceHealth.health > 80 ? CheckCircleIcon : ExclamationTriangleIcon"
            class="h-6 w-6"
            :class="deviceHealth.health > 80 ? 'text-green-600' : 'text-red-600'"
          />
        </div>
      </div>
    </div>

    <!-- Device Status Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <CheckCircleIcon class="h-6 w-6 text-green-600" />
          </div>
          <p class="text-2xl font-bold text-green-600">{{ deviceHealth.online }}</p>
          <p class="text-sm text-gray-600">Online Devices</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <ExclamationTriangleIcon class="h-6 w-6 text-red-600" />
          </div>
          <p class="text-2xl font-bold text-red-600">{{ deviceHealth.errors }}</p>
          <p class="text-sm text-gray-600">Error Devices</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <PrinterIcon class="h-6 w-6 text-blue-600" />
          </div>
          <p class="text-2xl font-bold text-blue-600">{{ hardwareStore.pendingReceipts.length }}</p>
          <p class="text-sm text-gray-600">Print Queue</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <QrCodeIcon class="h-6 w-6 text-purple-600" />
          </div>
          <p class="text-2xl font-bold text-purple-600">{{ hardwareStore.recentScans.length }}</p>
          <p class="text-sm text-gray-600">Recent Scans</p>
        </CardContent>
      </Card>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white rounded-lg border">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6">
          <button
            v-for="tab in ['overview', 'cash_drawer', 'printer', 'scanner', 'card_reader']"
            :key="tab"
            @click="changeTab(tab)"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm capitalize',
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            {{ tab.replace('_', ' ') }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Overview Tab -->
        <div v-if="activeTab === 'overview'" class="space-y-6">
          <!-- Device List -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card v-for="device in hardwareStore.currentBranchDevices" :key="device.id">
              <CardHeader class="pb-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-3">
                    <component :is="getDeviceIcon(device.type)" class="h-6 w-6 text-gray-600" />
                    <div>
                      <h3 class="font-semibold">{{ device.name }}</h3>
                      <p class="text-sm text-gray-600">{{ device.model }}</p>
                    </div>
                  </div>
                  <span
                    :class="`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(device.status)}`"
                  >
                    {{ device.status.toUpperCase() }}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-gray-600">Serial Number</p>
                      <p class="font-medium">{{ device.serialNumber }}</p>
                    </div>
                    <div>
                      <p class="text-gray-600">Last Maintenance</p>
                      <p class="font-medium">{{ device.lastMaintenance.toLocaleDateString() }}</p>
                    </div>
                  </div>

                  <div
                    v-if="device.errorMessage"
                    class="p-2 bg-red-50 border border-red-200 rounded"
                  >
                    <p class="text-sm text-red-800">{{ device.errorMessage }}</p>
                  </div>

                  <div class="flex space-x-2">
                    <Button @click="runDiagnostics(device.id)" class="flex-1 text-sm h-8">
                      <CogIcon class="h-4 w-4 mr-1" />
                      Diagnostics
                    </Button>
                    <Button
                      @click="calibrateDevice(device.id)"
                      class="flex-1 text-sm h-8"
                      variant="outline"
                    >
                      Calibrate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Cash Drawer Tab -->
        <div v-if="activeTab === 'cash_drawer'" class="space-y-6">
          <Card>
            <CardHeader>
              <h3 class="text-lg font-semibold flex items-center">
                <CubeIcon class="h-5 w-5 mr-2" />
                Cash Drawer Control
              </h3>
            </CardHeader>
            <CardContent>
              <div class="space-y-4">
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p class="font-medium">Drawer Status</p>
                    <p :class="hardwareStore.cashDrawerOpen ? 'text-red-600' : 'text-green-600'">
                      {{ hardwareStore.cashDrawerOpen ? 'OPEN' : 'CLOSED' }}
                    </p>
                  </div>
                  <Button
                    @click="toggleCashDrawer"
                    :class="
                      hardwareStore.cashDrawerOpen
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-green-600 hover:bg-green-700'
                    "
                  >
                    {{ hardwareStore.cashDrawerOpen ? 'Close Drawer' : 'Open Drawer' }}
                  </Button>
                </div>

                <div class="grid grid-cols-3 gap-4 text-center">
                  <div class="p-3 bg-blue-50 rounded-lg">
                    <p class="text-sm text-gray-600">Last Opened</p>
                    <p class="font-medium">
                      {{
                        (hardwareStore.deviceStatuses.cashDrawer.lastOpened as Date)?.toLocaleTimeString() ||
                        'Never'
                      }}
                    </p>
                  </div>
                  <div class="p-3 bg-green-50 rounded-lg">
                    <p class="text-sm text-gray-600">Cash Count</p>
                    <p class="font-medium">
                      {{ hardwareStore.deviceStatuses.cashDrawer.cashCount }}
                    </p>
                  </div>
                  <div class="p-3 bg-purple-50 rounded-lg">
                    <p class="text-sm text-gray-600">Device Status</p>
                    <p class="font-medium">{{ devicesByType.cashDrawer?.status.toUpperCase() }}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <!-- Receipt Printer Tab -->
        <div v-if="activeTab === 'printer'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold flex items-center">
                  <PrinterIcon class="h-5 w-5 mr-2" />
                  Print Control
                </h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Test Receipt Content</label>
                    <textarea
                      v-model="receiptContent"
                      placeholder="Enter receipt content or leave blank for default..."
                      class="w-full h-32 border rounded px-3 py-2 text-sm"
                    ></textarea>
                  </div>
                  <Button @click="printTestReceipt" class="w-full">
                    <PrinterIcon class="h-4 w-4 mr-2" />
                    Print Test Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold">Printer Status</h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-blue-50 rounded-lg text-center">
                      <p class="text-sm text-gray-600">Paper Level</p>
                      <p class="text-xl font-bold text-blue-600">
                        {{ hardwareStore.deviceStatuses.receiptPrinter.paperLevel }}%
                      </p>
                      <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                        <div
                          class="bg-blue-500 h-2 rounded-full"
                          :style="`width: ${hardwareStore.deviceStatuses.receiptPrinter.paperLevel}%`"
                        ></div>
                      </div>
                    </div>
                    <div class="p-3 bg-orange-50 rounded-lg text-center">
                      <p class="text-sm text-gray-600">Queue Length</p>
                      <p class="text-xl font-bold text-orange-600">
                        {{ hardwareStore.pendingReceipts.length }}
                      </p>
                    </div>
                  </div>

                  <div class="space-y-2">
                    <h4 class="font-medium">Recent Print Jobs</h4>
                    <div class="space-y-1 max-h-32 overflow-y-auto">
                      <div
                        v-for="job in hardwareStore.receiptQueue.slice(-5)"
                        :key="job.id"
                        class="flex items-center justify-between text-sm p-2 bg-gray-50 rounded"
                      >
                        <span>{{ job.paperType }} - {{ job.copies }}x</span>
                        <span
                          :class="job.status === 'completed' ? 'text-green-600' : 'text-orange-600'"
                        >
                          {{ job.status }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    @click="simulateError('receipt_printer')"
                    class="w-full"
                    variant="outline"
                  >
                    Simulate Paper Low Warning
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Barcode Scanner Tab -->
        <div v-if="activeTab === 'scanner'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold flex items-center">
                  <QrCodeIcon class="h-5 w-5 mr-2" />
                  Barcode Scanning
                </h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Manual Barcode Entry</label>
                    <div class="flex space-x-2">
                      <Input
                        v-model="manualBarcode"
                        placeholder="Enter barcode or leave blank for random..."
                        class="flex-1"
                      />
                      <Button @click="scanBarcode">
                        <QrCodeIcon class="h-4 w-4 mr-2" />
                        Scan
                      </Button>
                    </div>
                  </div>

                  <div class="p-3 bg-green-50 rounded-lg text-center">
                    <p class="text-sm text-gray-600">Battery Level</p>
                    <p class="text-xl font-bold text-green-600">
                      {{ hardwareStore.deviceStatuses.barcodeScanner.batteryLevel }}%
                    </p>
                    <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div
                        class="bg-green-500 h-2 rounded-full"
                        :style="`width: ${hardwareStore.deviceStatuses.barcodeScanner.batteryLevel}%`"
                      ></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold">Scan History</h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-3">
                  <div class="text-center p-3 bg-purple-50 rounded-lg">
                    <p class="text-xl font-bold text-purple-600">
                      {{ hardwareStore.deviceStatuses.barcodeScanner.scanCount }}
                    </p>
                    <p class="text-sm text-gray-600">Total Scans Today</p>
                  </div>

                  <div class="space-y-2 max-h-40 overflow-y-auto">
                    <div
                      v-for="scan in hardwareStore.recentScans"
                      :key="`${scan.barcode}-${scan.timestamp.getTime()}`"
                      class="p-2 border rounded text-sm"
                    >
                      <div class="flex justify-between items-center">
                        <span class="font-medium">{{ scan.productName || 'Unknown Product' }}</span>
                        <span class="text-green-600">{{
                          scan.price ? formatCurrency(scan.price) : '-'
                        }}</span>
                      </div>
                      <div class="flex justify-between text-xs text-gray-500">
                        <span>{{ scan.barcode }}</span>
                        <span>{{ scan.timestamp.toLocaleTimeString() }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Card Reader Tab -->
        <div v-if="activeTab === 'card_reader'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold flex items-center">
                  <CreditCardIcon class="h-5 w-5 mr-2" />
                  Payment Processing
                </h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div>
                    <label class="block text-sm font-medium mb-2">Test Payment Amount</label>
                    <div class="flex space-x-2">
                      <Input
                        v-model.number="paymentAmount"
                        type="number"
                        step="0.01"
                        placeholder="Enter amount..."
                        class="flex-1"
                      />
                      <Button @click="processTestPayment" :disabled="paymentAmount <= 0">
                        <CreditCardIcon class="h-4 w-4 mr-2" />
                        Process
                      </Button>
                    </div>
                  </div>

                  <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-blue-50 rounded-lg text-center">
                      <SignalIcon class="h-6 w-6 mx-auto text-blue-600 mb-1" />
                      <p class="text-sm text-gray-600">Connectivity</p>
                      <p class="font-medium capitalize">
                        {{ hardwareStore.deviceStatuses.cardReader.connectivity }}
                      </p>
                    </div>
                    <div class="p-3 bg-green-50 rounded-lg text-center">
                      <BoltIcon class="h-6 w-6 mx-auto text-green-600 mb-1" />
                      <p class="text-sm text-gray-600">Battery</p>
                      <p class="font-medium">{{ devicesByType.cardReader?.batteryLevel }}%</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 class="text-lg font-semibold">Transaction History</h3>
              </CardHeader>
              <CardContent>
                <div class="space-y-2 max-h-48 overflow-y-auto">
                  <div
                    v-for="transaction in hardwareStore.paymentTransactions.slice(-5)"
                    :key="transaction.id"
                    class="p-3 border rounded"
                  >
                    <div class="flex justify-between items-center mb-1">
                      <span class="font-medium">{{ formatCurrency(transaction.amount) }}</span>
                      <span
                        :class="
                          transaction.status === 'approved' ? 'text-green-600' : 'text-red-600'
                        "
                        class="text-sm font-medium uppercase"
                      >
                        {{ transaction.status }}
                      </span>
                    </div>
                    <div class="flex justify-between text-xs text-gray-500">
                      <span
                        >{{ transaction.cardType?.toUpperCase() }} ****{{
                          transaction.lastFourDigits
                        }}</span
                      >
                      <span>{{ transaction.timestamp.toLocaleTimeString() }}</span>
                    </div>
                    <div v-if="transaction.approvalCode" class="text-xs text-gray-500 mt-1">
                      Auth: {{ transaction.approvalCode }}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>

    <!-- Diagnostics Modal -->
    <div
      v-if="showDiagnostics"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-96 max-w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Device Diagnostics</h3>
          <Button @click="showDiagnostics = false" variant="outline" size="sm">✕</Button>
        </div>

        <div v-if="!diagnosticsResult" class="text-center py-8">
          <div
            class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"
          ></div>
          <p>Running diagnostics...</p>
        </div>

        <div v-else class="space-y-4">
          <div class="flex items-center space-x-2">
            <component
              :is="diagnosticsResult.success ? CheckCircleIcon : ExclamationTriangleIcon"
              class="h-5 w-5"
              :class="diagnosticsResult.success ? 'text-green-600' : 'text-red-600'"
            />
            <span :class="diagnosticsResult.success ? 'text-green-600' : 'text-red-600'">
              {{ diagnosticsResult.message }}
            </span>
          </div>

          <div class="space-y-2">
            <h4 class="font-medium">Diagnostic Details</h4>
            <div class="bg-gray-50 rounded p-3 text-sm">
              <div
                v-for="(value, key) in diagnosticsResult.details"
                :key="key"
                class="flex justify-between"
              >
                <span class="capitalize">{{ String(key).replace(/([A-Z])/g, ' $1').trim() }}:</span>
                <span>{{ value }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
