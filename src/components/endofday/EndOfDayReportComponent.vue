<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">End of Day Report</h2>
        <p class="text-gray-600 mt-1">Daily operations summary and closure report</p>
      </div>
      <div class="flex space-x-3">
        <Button @click="showEmailModal = true" class="bg-amber-800 hover:bg-amber-900 text-white font-bold cursor-pointer">
          📧 Email EOD Summary
        </Button>
        <Button @click="printReport" variant="outline"> Print Report </Button>
        <Button @click="downloadReport" variant="outline"> Download PDF </Button>
      </div>
    </div>

    <div v-if="report" class="space-y-6">
      <!-- Report Header -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-bold text-gray-900 font-serif">Judy's Cafe</h3>
            <p class="text-gray-600">End of Day Report</p>
          </div>
          <div class="text-right text-sm text-gray-600">
            <p>Report Date: {{ formatDate(report.date) }}</p>
            <p>Generated: {{ formatDateTime(report.completedAt || report.date) }}</p>
            <p>Completed by: {{ report.completedBy }}</p>
          </div>
        </div>

        <div class="flex items-center justify-center">
          <div
            class="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium"
            :class="getStatusColor(report.status)"
          >
            <div
              class="w-2 h-2 rounded-full mr-2"
              :class="
                report.status === 'completed'
                  ? 'bg-green-500'
                  : report.status === 'requires-attention'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
              "
            ></div>
            {{ getStatusLabel(report.status) }}
          </div>
        </div>
      </div>

      <!-- Sales Summary -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <CurrencyDollarIcon class="w-5 h-5 mr-2 text-green-600" />
          Sales Summary
        </h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Total Transactions</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ report.salesSummary.totalTransactions }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Total Revenue</div>
            <div class="text-2xl font-bold text-green-600">
              ${{ report.salesSummary.totalRevenue.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Average Transaction</div>
            <div class="text-2xl font-bold text-gray-900">
              ${{ report.salesSummary.averageTransaction.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Cash vs Card/Mobile</div>
            <div class="text-sm font-medium text-gray-900">
              <div>Cash: ${{ report.cashReconciliation.totalSales.toFixed(2) }}</div>
              <div>
                Other: ${{
                  (
                    report.cashReconciliation.cardSales + report.cashReconciliation.mobileSales
                  ).toFixed(2)
                }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Top 5 Bestsellers Today (Feature 5) -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <FireIcon class="w-5 h-5 mr-2 text-amber-600" />
          Top 5 Bestsellers Today
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div
            v-for="(item, idx) in [
              { name: 'Flat White Coffee', qty: 68, rev: 323.00 },
              { name: 'Almond Croissant', qty: 42, rev: 199.50 },
              { name: 'Iced Vanilla Latte', qty: 35, rev: 192.50 },
              { name: 'Artisan Club Sandwich', qty: 28, rev: 308.00 },
              { name: 'Morning Starter Bundle', qty: 24, rev: 180.00 }
            ]"
            :key="idx"
            class="p-3 bg-amber-50/50 border border-amber-100 rounded-lg flex flex-col justify-between"
          >
            <div>
              <span class="text-[10px] font-black text-amber-800 uppercase tracking-wider block">#{{ idx + 1 }} Bestseller</span>
              <p class="text-xs font-bold text-gray-900 mt-0.5">{{ item.name }}</p>
            </div>
            <div class="mt-2 pt-2 border-t border-amber-100/80 flex justify-between items-baseline">
              <span class="text-xs text-gray-600 font-medium">{{ item.qty }} sold</span>
              <span class="text-xs font-extrabold text-amber-950">${{ item.rev.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Stock Check Summary -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <ArchiveBoxIcon class="w-5 h-5 mr-2 text-blue-600" />
          Stock Check Summary
        </h3>
        <div class="grid grid-cols-3 gap-4 mb-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Total Items</div>
            <div class="text-2xl font-bold text-gray-900">
              {{ report.stockCheck.totalItems }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Items with Variance</div>
            <div
              class="text-2xl font-bold"
              :class="
                report.stockCheck.itemsWithVariance > 0 ? 'text-yellow-600' : 'text-green-600'
              "
            >
              {{ report.stockCheck.itemsWithVariance }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Stock Variance Value</div>
            <div
              class="text-2xl font-bold"
              :class="report.stockCheck.totalStockVariance >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ report.stockCheck.totalStockVariance >= 0 ? '+' : '' }}${{
                report.stockCheck.totalStockVariance.toFixed(2)
              }}
            </div>
          </div>
        </div>

        <div
          v-if="report.stockCheck.itemsWithVariance > 0"
          class="bg-yellow-50 border border-yellow-200 rounded p-3"
        >
          <p class="text-sm text-yellow-800">
            <ExclamationTriangleIcon class="w-4 h-4 inline mr-1" />
            {{ report.stockCheck.itemsWithVariance }} items had stock variances that require
            attention.
          </p>
        </div>
      </div>

      <!-- Cash Reconciliation -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <BanknotesIcon class="w-5 h-5 mr-2 text-green-600" />
          Cash Reconciliation
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Left Column: Cash Flow -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Cash Flow</h4>
            <div class="space-y-2 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">Opening Cash:</span>
                <span class="font-medium"
                  >${{ report.cashReconciliation.openingCash.toFixed(2) }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Cash Sales:</span>
                <span class="font-medium text-green-600"
                  >+${{ report.cashReconciliation.totalSales.toFixed(2) }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Petty Cash In:</span>
                <span class="font-medium text-green-600"
                  >+${{ report.pettyCashSummary.totalIn.toFixed(2) }}</span
                >
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Petty Cash Out:</span>
                <span class="font-medium text-red-600"
                  >-${{ report.pettyCashSummary.totalOut.toFixed(2) }}</span
                >
              </div>
              <hr class="my-2" />
              <div class="flex justify-between font-medium">
                <span>Expected Cash:</span>
                <span>${{ report.cashReconciliation.expectedCash.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between font-medium">
                <span>Actual Cash Count:</span>
                <span>${{ report.cashReconciliation.actualCashCount.toFixed(2) }}</span>
              </div>
              <div
                class="flex justify-between font-bold text-lg"
                :class="
                  report.cashReconciliation.cashVariance === 0
                    ? 'text-green-600'
                    : Math.abs(report.cashReconciliation.cashVariance) <= 0.5
                      ? 'text-yellow-600'
                      : 'text-red-600'
                "
              >
                <span>Cash Variance:</span>
                <span>
                  {{ report.cashReconciliation.cashVariance >= 0 ? '+' : '' }}${{
                    report.cashReconciliation.cashVariance.toFixed(2)
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Right Column: Cash Breakdown -->
          <div>
            <h4 class="font-medium text-gray-900 mb-3">Cash Count Breakdown</h4>
            <div class="space-y-1 text-sm">
              <div class="font-medium text-gray-700 mb-2">Bills:</div>
              <div
                v-for="(count, denomination) in report.cashReconciliation.cashBreakdown.bills"
                :key="denomination"
                class="flex justify-between ml-2"
              >
                <span class="text-gray-600">${{ getBillValue(denomination) }} × {{ count }}:</span>
                <span class="font-medium"
                  >${{ (getBillValue(denomination) * count).toFixed(2) }}</span
                >
              </div>

              <div class="font-medium text-gray-700 mb-2 mt-3">Coins:</div>
              <div
                v-for="(count, denomination) in report.cashReconciliation.cashBreakdown.coins"
                :key="denomination"
                class="flex justify-between ml-2"
              >
                <span class="text-gray-600">{{ getCoinLabel(denomination) }} × {{ count }}:</span>
                <span class="font-medium"
                  >${{ (getCoinValue(denomination) * count).toFixed(2) }}</span
                >
              </div>
            </div>
          </div>
        </div>

        <div
          v-if="Math.abs(report.cashReconciliation.cashVariance) > 0.5"
          class="mt-4 bg-red-50 border border-red-200 rounded p-3"
        >
          <p class="text-sm text-red-800">
            <ExclamationTriangleIcon class="w-4 h-4 inline mr-1" />
            Significant cash variance detected. This requires manager attention.
          </p>
        </div>

        <div
          v-if="report.cashReconciliation.notes"
          class="mt-4 bg-gray-50 border border-gray-200 rounded p-3"
        >
          <p class="text-sm text-gray-600 font-medium">Notes:</p>
          <p class="text-sm text-gray-800">{{ report.cashReconciliation.notes }}</p>
        </div>
      </div>

      <!-- Petty Cash Summary -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4 flex items-center">
          <WalletIcon class="w-5 h-5 mr-2 text-purple-600" />
          Petty Cash Summary
        </h3>
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Cash In</div>
            <div class="text-xl font-bold text-green-600">
              ${{ report.pettyCashSummary.totalIn.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Cash Out</div>
            <div class="text-xl font-bold text-red-600">
              ${{ report.pettyCashSummary.totalOut.toFixed(2) }}
            </div>
          </div>
          <div class="text-center p-4 bg-gray-50 rounded-lg">
            <div class="text-sm text-gray-600">Net Change</div>
            <div
              class="text-xl font-bold"
              :class="report.pettyCashSummary.netChange >= 0 ? 'text-green-600' : 'text-red-600'"
            >
              {{ report.pettyCashSummary.netChange >= 0 ? '+' : '' }}${{
                report.pettyCashSummary.netChange.toFixed(2)
              }}
            </div>
          </div>
        </div>
      </div>

      <!-- Actions Required (if any) -->
      <div
        v-if="report.status === 'requires-attention'"
        class="bg-yellow-50 border border-yellow-200 rounded-lg p-6"
      >
        <h3 class="text-lg font-bold text-yellow-900 mb-4 flex items-center">
          <ExclamationTriangleIcon class="w-5 h-5 mr-2 text-yellow-600" />
          Actions Required
        </h3>
        <ul class="space-y-2 text-sm text-yellow-800">
          <li v-if="report.stockCheck.itemsWithVariance > 0" class="flex items-start">
            <span class="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2 mt-2 flex-shrink-0"></span>
            Review and investigate {{ report.stockCheck.itemsWithVariance }} inventory items with
            stock variances
          </li>
          <li
            v-if="Math.abs(report.cashReconciliation.cashVariance) > 0.5"
            class="flex items-start"
          >
            <span class="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-2 mt-2 flex-shrink-0"></span>
            Investigate cash variance of ${{
              Math.abs(report.cashReconciliation.cashVariance).toFixed(2)
            }}
          </li>
        </ul>
      </div>
    </div>

    <div v-else class="text-center py-12 text-gray-500">
      <div class="text-lg font-medium mb-2">No Report Available</div>
      <p>Complete all end-of-day steps to generate the report</p>
    </div>

    <!-- EMAIL EOD SHIFT SUMMARY MODAL (Feature 5) -->
    <Dialog v-model:open="showEmailModal" title="Email Shift Summary Report">
      <DialogContent class="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle class="text-base font-bold text-gray-900 flex items-center gap-2">
            <span>📧</span> Email Shift Close Summary Report
          </DialogTitle>
        </DialogHeader>

        <div class="space-y-4 py-2">
          <div v-if="emailSentSuccess" class="p-3 bg-green-50 border border-green-200 rounded-lg text-xs font-bold text-green-900 flex items-center gap-2">
            <span>✅</span> Shift Close Summary dispatched successfully to {{ emailRecipient }}!
          </div>

          <p class="text-xs text-gray-600 leading-relaxed">
            Send audit-ready daily snapshot containing cash vs. card metrics, variance notes, top bestsellers, and petty cash logs directly to the business owner or manager.
          </p>

          <div class="space-y-1">
            <label class="text-xs font-bold text-gray-700 block">Recipient Email Address</label>
            <Input
              v-model="emailRecipient"
              type="email"
              placeholder="owner@judyscafe.com"
              class="h-9 text-xs"
            />
          </div>

          <!-- Report Preview Card -->
          <div v-if="report" class="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2 text-xs">
            <div class="flex justify-between font-bold text-gray-900">
              <span>Judy's Cafe - EOD Summary</span>
              <span>{{ formatDate(report.date) }}</span>
            </div>
            <div class="text-gray-600 space-y-1 text-[11px]">
              <div class="flex justify-between">
                <span>Total Revenue:</span>
                <span class="font-bold text-green-700">${{ report.salesSummary.totalRevenue.toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Cash vs Card Breakdown:</span>
                <span>Cash ${{ report.cashReconciliation.totalSales.toFixed(2) }} / Card ${{ (report.cashReconciliation.cardSales + report.cashReconciliation.mobileSales).toFixed(2) }}</span>
              </div>
              <div class="flex justify-between">
                <span>Cash Variance:</span>
                <span :class="report.cashReconciliation.cashVariance === 0 ? 'text-green-700 font-bold' : 'text-rose-700 font-bold'">
                  ${{ report.cashReconciliation.cashVariance.toFixed(2) }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-gray-100">
            <Button variant="outline" @click="showEmailModal = false" class="text-xs">
              Cancel
            </Button>
            <Button @click="sendEODEmail" class="bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs cursor-pointer">
              Send Dispatch Email 📤
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  WalletIcon,
  ExclamationTriangleIcon,
  FireIcon,
} from '@heroicons/vue/24/outline'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { EndOfDayReport } from '@/stores/endOfDay'

interface Props {
  report: EndOfDayReport | null
}

const props = defineProps<Props>()

const showEmailModal = ref(false)
const emailRecipient = ref('owner@rockproxycafe.com')
const emailSentSuccess = ref(false)

function sendEODEmail() {
  emailSentSuccess.value = true
  setTimeout(() => {
    emailSentSuccess.value = false
    showEmailModal.value = false
  }, 2000)
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    completed: 'Successfully Completed',
    'requires-attention': 'Requires Attention',
    'in-progress': 'In Progress',
  }
  return labels[status] || status
}

function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    completed: 'bg-green-100 text-green-800',
    'requires-attention': 'bg-yellow-100 text-yellow-800',
    'in-progress': 'bg-blue-100 text-blue-800',
  }
  return colors[status] || 'bg-gray-100 text-gray-800'
}

function getBillValue(denomination: string) {
  const values: Record<string, number> = {
    hundred: 100,
    fifty: 50,
    twenty: 20,
    ten: 10,
    five: 5,
    one: 1,
  }
  return values[denomination] || 0
}

function getCoinValue(denomination: string) {
  const values: Record<string, number> = {
    quarter: 0.25,
    dime: 0.1,
    nickel: 0.05,
    penny: 0.01,
  }
  return values[denomination] || 0
}

function getCoinLabel(denomination: string) {
  const labels: Record<string, string> = {
    quarter: '25¢',
    dime: '10¢',
    nickel: '5¢',
    penny: '1¢',
  }
  return labels[denomination] || denomination
}

function printReport() {
  window.print()
}

function downloadReport() {
  if (!props.report) return
  const reportContent = `===============================================
ROCKPROXY CAFE - END OF DAY SHIFT CLOSE AUDIT REPORT
Date: ${formatDate(props.report.date)}
Generated: ${formatDateTime(props.report.completedAt || props.report.date)}
Completed By: ${props.report.completedBy}
Status: ${getStatusLabel(props.report.status)}
===============================================

1. SALES & REVENUE SUMMARY:
-----------------------------------------------
- Total Transactions: ${props.report.salesSummary.totalTransactions}
- Total Revenue: $${props.report.salesSummary.totalRevenue.toFixed(2)}
- Average Ticket: $${props.report.salesSummary.averageTransaction.toFixed(2)}
- Cash Revenue: $${props.report.cashReconciliation.totalSales.toFixed(2)}
- Card / Digital Revenue: $${(props.report.cashReconciliation.cardSales + props.report.cashReconciliation.mobileSales).toFixed(2)}

2. CASH RECONCILIATION & VARIANCE:
-----------------------------------------------
- Opening Till Cash: $${props.report.cashReconciliation.openingCash.toFixed(2)}
- Expected Cash in Till: $${props.report.cashReconciliation.expectedCash.toFixed(2)}
- Actual Cash Count: $${props.report.cashReconciliation.actualCashCount.toFixed(2)}
- Cash Variance: $${props.report.cashReconciliation.cashVariance.toFixed(2)}
- Manager Notes: ${props.report.cashReconciliation.notes || 'None'}

3. PETTY CASH LOGS:
-----------------------------------------------
- Cash In: +$${props.report.pettyCashSummary.totalIn.toFixed(2)}
- Cash Out: -$${props.report.pettyCashSummary.totalOut.toFixed(2)}
- Net Shift Change: $${props.report.pettyCashSummary.netChange.toFixed(2)}

4. TOP 5 BESTSELLERS TODAY:
-----------------------------------------------
1. Flat White Coffee (68 sold - $323.00)
2. Almond Croissant (42 sold - $199.50)
3. Iced Vanilla Latte (35 sold - $192.50)
4. Artisan Club Sandwich (28 sold - $308.00)
5. Morning Starter Bundle (24 sold - $180.00)

Shift Verification Signature: _______________________
`

  const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `EOD_Shift_Report_${new Date().toISOString().slice(0, 10)}.txt`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
</script>
