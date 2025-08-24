<template>
  <div>
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Petty Cash Management</h2>
        <p class="text-gray-600 mt-1">Record petty cash transactions for accurate reconciliation</p>
      </div>
      <Button @click="showAddEntryDialog = true" variant="default"> Add Entry </Button>
    </div>

    <!-- Today's Summary -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      <div class="bg-green-50 border border-green-200 rounded-lg p-4">
        <div class="text-green-600 text-sm font-medium">Cash In</div>
        <div class="text-2xl font-bold text-green-900">
          ${{ endOfDayStore.pettyCashSummary.totalIn.toFixed(2) }}
        </div>
      </div>

      <div class="bg-red-50 border border-red-200 rounded-lg p-4">
        <div class="text-red-600 text-sm font-medium">Cash Out</div>
        <div class="text-2xl font-bold text-red-900">
          ${{ endOfDayStore.pettyCashSummary.totalOut.toFixed(2) }}
        </div>
      </div>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div class="text-blue-600 text-sm font-medium">Net Change</div>
        <div
          class="text-2xl font-bold"
          :class="endOfDayStore.pettyCashSummary.netChange >= 0 ? 'text-green-900' : 'text-red-900'"
        >
          {{ endOfDayStore.pettyCashSummary.netChange >= 0 ? '+' : '' }}${{
            endOfDayStore.pettyCashSummary.netChange.toFixed(2)
          }}
        </div>
      </div>
    </div>

    <!-- Petty Cash Entries Table -->
    <div class="bg-white rounded-lg border border-gray-200">
      <div class="p-4 border-b border-gray-200">
        <h3 class="text-lg font-medium text-gray-900">Today's Entries</h3>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Time
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Description
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Category
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Type
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Amount
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Receipt #
              </th>
              <th
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="entry in endOfDayStore.todaysPettyCash" :key="entry.id">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">
                  {{
                    new Date(entry.date).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }}
                </div>
              </td>
              <td class="px-6 py-4">
                <div class="text-sm text-gray-900">{{ entry.description }}</div>
                <div v-if="entry.notes" class="text-sm text-gray-500">{{ entry.notes }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                >
                  {{ getCategoryLabel(entry.category) }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span
                  class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                  :class="
                    entry.type === 'income'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  "
                >
                  {{ entry.type === 'income' ? 'Cash In' : 'Cash Out' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div
                  class="text-sm font-medium"
                  :class="entry.type === 'income' ? 'text-green-600' : 'text-red-600'"
                >
                  {{ entry.type === 'income' ? '+' : '-' }}${{ entry.amount.toFixed(2) }}
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-500">{{ entry.receiptNumber || '-' }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button @click="editEntry(entry)" class="text-blue-600 hover:text-blue-900 mr-3">
                  Edit
                </button>
                <button @click="deleteEntry(entry.id)" class="text-red-600 hover:text-red-900">
                  Delete
                </button>
              </td>
            </tr>
          </tbody>
        </table>

        <div
          v-if="endOfDayStore.todaysPettyCash.length === 0"
          class="text-center py-12 text-gray-500"
        >
          <div class="text-lg font-medium mb-2">No Petty Cash Entries</div>
          <p>Add entries for any cash transactions outside of sales</p>
        </div>
      </div>
    </div>

    <!-- Complete Button -->
    <div class="mt-6 flex justify-end">
      <Button @click="completePettyCash" variant="default">
        Continue to Cash Reconciliation
      </Button>
    </div>

    <!-- Add/Edit Entry Dialog -->
    <div
      v-if="showAddEntryDialog || editingEntry"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 class="text-lg font-medium text-gray-900 mb-4">
          {{ editingEntry ? 'Edit' : 'Add' }} Petty Cash Entry
        </h3>

        <form @submit.prevent="saveEntry" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Description * </label>
            <input
              v-model="entryForm.description"
              type="text"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Brief description of transaction"
            />
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Type * </label>
              <select
                v-model="entryForm.type"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="income">Cash In</option>
                <option value="expense">Cash Out</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1"> Amount * </label>
              <input
                v-model="entryForm.amount"
                type="number"
                step="0.01"
                min="0"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Category * </label>
            <select
              v-model="entryForm.category"
              required
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option
                v-for="category in endOfDayStore.pettyCashCategories"
                :key="category.value"
                :value="category.value"
              >
                {{ category.label }}
              </option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Receipt Number </label>
            <input
              v-model="entryForm.receiptNumber"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Optional receipt/reference number"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1"> Notes </label>
            <textarea
              v-model="entryForm.notes"
              rows="3"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Additional notes or details"
            ></textarea>
          </div>

          <div class="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="outline" @click="cancelEntry"> Cancel </Button>
            <Button type="submit" variant="default">
              {{ editingEntry ? 'Update' : 'Add' }} Entry
            </Button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useEndOfDayStore } from '@/stores/endOfDay'
import type { PettyCashEntry } from '@/stores/endOfDay'
import { Button } from '@/components/ui/button'

const emit = defineEmits<{
  complete: []
}>()

const endOfDayStore = useEndOfDayStore()
const showAddEntryDialog = ref(false)
const editingEntry = ref<PettyCashEntry | null>(null)

const entryForm = reactive({
  description: '',
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  category: 'supplies' as 'supplies' | 'maintenance' | 'utilities' | 'other',
  receiptNumber: '',
  notes: '',
})

function getCategoryLabel(category: string) {
  const categoryMap: Record<string, string> = {
    supplies: 'Supplies',
    maintenance: 'Maintenance',
    utilities: 'Utilities',
    other: 'Other',
  }
  return categoryMap[category] || category
}

function editEntry(entry: PettyCashEntry) {
  editingEntry.value = entry
  entryForm.description = entry.description
  entryForm.type = entry.type
  entryForm.amount = entry.amount
  entryForm.category = entry.category
  entryForm.receiptNumber = entry.receiptNumber || ''
  entryForm.notes = entry.notes || ''
}

function deleteEntry(entryId: string) {
  if (confirm('Are you sure you want to delete this entry?')) {
    endOfDayStore.deletePettyCashEntry(entryId)
  }
}

function saveEntry() {
  if (editingEntry.value) {
    endOfDayStore.updatePettyCashEntry(editingEntry.value.id, {
      description: entryForm.description,
      type: entryForm.type,
      amount: entryForm.amount,
      category: entryForm.category,
      receiptNumber: entryForm.receiptNumber || undefined,
      notes: entryForm.notes || undefined,
    })
  } else {
    endOfDayStore.addPettyCashEntry({
      description: entryForm.description,
      type: entryForm.type,
      amount: entryForm.amount,
      category: entryForm.category,
      receiptNumber: entryForm.receiptNumber || undefined,
      notes: entryForm.notes || undefined,
    })
  }

  cancelEntry()
}

function cancelEntry() {
  showAddEntryDialog.value = false
  editingEntry.value = null
  resetForm()
}

function resetForm() {
  entryForm.description = ''
  entryForm.type = 'expense'
  entryForm.amount = 0
  entryForm.category = 'supplies'
  entryForm.receiptNumber = ''
  entryForm.notes = ''
}

function completePettyCash() {
  emit('complete')
}
</script>
