<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">End of Day Report</h2>
        <p class="text-gray-600 mt-1">Daily operations summary and closure report</p>
      </div>
      <div class="flex space-x-3">
        <Button @click="printReport" variant="outline"> Print Report </Button>
        <Button @click="downloadReport" variant="outline"> Download PDF </Button>
      </div>
    </div>

    <div v-if="report" class="space-y-6">
      <!-- Report Header -->
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-xl font-bold text-gray-900">Judy's Cafe</h3>
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
  </div>
</template>

<script setup lang="ts">
import {
  CurrencyDollarIcon,
  ArchiveBoxIcon,
  BanknotesIcon,
  WalletIcon,
  ExclamationTriangleIcon,
} from '@heroicons/vue/24/outline'
import { Button } from '@/components/ui/button'
import type { EndOfDayReport } from '@/stores/endOfDay'

interface Props {
  report: EndOfDayReport | null
}

defineProps<Props>()

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
  // In a real implementation, this would generate and download a PDF
  alert('PDF download functionality would be implemented here')
}
</script>
