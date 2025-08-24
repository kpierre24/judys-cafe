<script setup lang="ts">
import { ref, computed } from 'vue'
import { useHardwareStore } from '@/stores/hardware'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  TvIcon,
  CogIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
  EyeIcon,
  SunIcon,
  SpeakerWaveIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  StarIcon,
  SparklesIcon,
} from '@heroicons/vue/24/outline'

const hardwareStore = useHardwareStore()
const branchesStore = useBranchesStore()

const activeTab = ref('content')
const showEditPromotion = ref(false)

const promotionForm = ref({
  title: '',
  description: '',
  type: 'discount' as 'discount' | 'bogo' | 'combo' | 'announcement',
  value: 0,
  validUntil: '',
  isActive: true,
  priority: 1,
})

// Computed
const boardStats = computed(() => {
  const boards = hardwareStore.currentBranchMenuBoards
  return {
    total: boards.length,
    online: boards.filter((b) => b.status === 'online').length,
    updating: boards.filter((b) => b.status === 'updating').length,
  }
})

const contentStats = computed(() => {
  const content = hardwareStore.currentMenuContent
  if (!content) return { items: 0, categories: 0, promotions: 0, available: 0 }

  const totalItems = content.categories.reduce((sum, cat) => sum + cat.items.length, 0)
  const availableItems = content.categories.reduce(
    (sum, cat) => sum + cat.items.filter((item) => item.isAvailable).length,
    0,
  )

  return {
    items: totalItems,
    categories: content.categories.length,
    promotions: content.promotions.filter((p) => p.isActive).length,
    available: availableItems,
  }
})

// Functions
function getStatusColor(status: string) {
  const colors = {
    online: 'text-green-600 bg-green-100',
    offline: 'text-red-600 bg-red-100',
    updating: 'text-yellow-600 bg-yellow-100',
  }
  return colors[status as keyof typeof colors] || 'text-gray-600 bg-gray-100'
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

function toggleItemAvailability(item: any) {
  hardwareStore.updateMenuItemAvailability(item.id, !item.isAvailable)
}

function addPromotion() {
  const promotionData = {
    ...promotionForm.value,
    validUntil: promotionForm.value.validUntil
      ? new Date(promotionForm.value.validUntil)
      : undefined,
  }
  hardwareStore.addPromotion(promotionData)
  showEditPromotion.value = false
  // Reset form
  promotionForm.value = {
    title: '',
    description: '',
    type: 'discount',
    value: 0,
    validUntil: '',
    isActive: true,
    priority: 1,
  }
}

function removePromotion(promotionId: string) {
  hardwareStore.removePromotion(promotionId)
}

function refreshBoard(boardId: string) {
  hardwareStore.refreshMenuBoard(boardId)
}

function updateBoardBrightness(boardId: string, brightness: number) {
  hardwareStore.updateMenuBoardSettings(boardId, { brightness })
}

function changeTemplate(template: string) {
  hardwareStore.updateMenuBoardContent({ template: template as any })
}

function toggleDisplaySetting(setting: string) {
  const content = hardwareStore.currentMenuContent
  if (content) {
    const newSettings = {
      ...content.displaySettings,
      [setting]: !content.displaySettings[setting as keyof typeof content.displaySettings],
    }
    hardwareStore.updateMenuBoardContent({ displaySettings: newSettings })
  }
}

function changeTab(tab: string) {
  activeTab.value = tab
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex justify-between items-center">
      <div>
        <h1 class="text-3xl font-bold">Digital Menu Boards</h1>
        <p class="text-gray-600 mt-1">Manage dynamic menu displays and content</p>
      </div>
      <div class="text-right">
        <p class="text-sm text-gray-600">Boards Online</p>
        <p
          class="text-lg font-bold"
          :class="boardStats.online > 0 ? 'text-green-600' : 'text-red-600'"
        >
          {{ boardStats.online }}/{{ boardStats.total }}
        </p>
      </div>
    </div>

    <!-- Board Status Overview -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <TvIcon class="h-6 w-6 text-green-600" />
          </div>
          <p class="text-2xl font-bold text-green-600">{{ boardStats.online }}</p>
          <p class="text-sm text-gray-600">Online Boards</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <PencilIcon class="h-6 w-6 text-blue-600" />
          </div>
          <p class="text-2xl font-bold text-blue-600">{{ contentStats.items }}</p>
          <p class="text-sm text-gray-600">Menu Items</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <SparklesIcon class="h-6 w-6 text-purple-600" />
          </div>
          <p class="text-2xl font-bold text-purple-600">{{ contentStats.promotions }}</p>
          <p class="text-sm text-gray-600">Active Promotions</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent class="p-4 text-center">
          <div
            class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3"
          >
            <CheckCircleIcon class="h-6 w-6 text-yellow-600" />
          </div>
          <p class="text-2xl font-bold text-yellow-600">{{ contentStats.available }}</p>
          <p class="text-sm text-gray-600">Available Items</p>
        </CardContent>
      </Card>
    </div>

    <!-- Tab Navigation -->
    <div class="bg-white rounded-lg border">
      <div class="border-b border-gray-200">
        <nav class="flex space-x-8 px-6">
          <button
            v-for="tab in ['content', 'boards', 'promotions', 'settings']"
            :key="tab"
            @click="changeTab(tab)"
            :class="[
              'py-4 px-1 border-b-2 font-medium text-sm capitalize',
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            {{ tab }}
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Content Management Tab -->
        <div v-if="activeTab === 'content'" class="space-y-6">
          <h3 class="text-lg font-semibold">Menu Content</h3>

          <div v-if="hardwareStore.currentMenuContent" class="space-y-6">
            <div v-for="category in hardwareStore.currentMenuContent.categories" :key="category.id">
              <h4 class="text-lg font-medium mb-4">{{ category.name }}</h4>

              <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <Card v-for="item in category.items" :key="item.id">
                  <CardContent class="p-4">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2">
                          <h5 class="font-semibold">{{ item.name }}</h5>
                          <StarIcon v-if="item.isPopular" class="h-4 w-4 text-yellow-500" />
                          <span
                            v-if="item.isNew"
                            class="px-1 py-0.5 bg-green-100 text-green-800 text-xs rounded"
                            >NEW</span
                          >
                        </div>
                        <p class="text-sm text-gray-600 mt-1">{{ item.description }}</p>
                        <div class="flex items-center space-x-2 mt-2">
                          <span class="font-bold text-lg text-green-600">{{
                            formatCurrency(item.price)
                          }}</span>
                          <span
                            v-if="item.originalPrice && item.originalPrice > item.price"
                            class="text-sm text-gray-500 line-through"
                          >
                            {{ formatCurrency(item.originalPrice) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between mt-3">
                      <div class="flex items-center space-x-2 text-xs text-gray-500">
                        <span v-if="item.calories">{{ item.calories }} cal</span>
                        <span v-if="item.prepTime">{{ item.prepTime }} min</span>
                        <span v-if="item.dietary.length > 0">{{ item.dietary.join(', ') }}</span>
                      </div>
                      <Button
                        @click="toggleItemAvailability(item)"
                        size="sm"
                        :class="
                          item.isAvailable
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        "
                      >
                        {{ item.isAvailable ? 'Available' : 'Unavailable' }}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <!-- Boards Management Tab -->
        <div v-if="activeTab === 'boards'" class="space-y-6">
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <Card v-for="board in hardwareStore.currentBranchMenuBoards" :key="board.id">
              <CardHeader class="pb-3">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-semibold">{{ board.name }}</h3>
                    <p class="text-sm text-gray-600">{{ board.location }}</p>
                  </div>
                  <span
                    :class="`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(board.status)}`"
                  >
                    {{ board.status.toUpperCase() }}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div class="space-y-4">
                  <div class="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p class="text-gray-600">Resolution</p>
                      <p class="font-medium">
                        {{ board.resolution.width }}x{{ board.resolution.height }}
                      </p>
                    </div>
                    <div>
                      <p class="text-gray-600">Template</p>
                      <p class="font-medium capitalize">{{ board.currentTemplate }}</p>
                    </div>
                  </div>

                  <!-- Brightness Control -->
                  <div>
                    <div class="flex items-center justify-between mb-2">
                      <label class="text-sm font-medium">Brightness</label>
                      <span class="text-sm text-gray-600">{{ board.brightness }}%</span>
                    </div>
                    <div class="flex items-center space-x-2">
                      <SunIcon class="h-4 w-4 text-gray-400" />
                      <input
                        type="range"
                        min="20"
                        max="100"
                        :value="board.brightness"
                        @input="
                          updateBoardBrightness(
                            board.id,
                            Number(($event.target as HTMLInputElement).value),
                          )
                        "
                        class="flex-1"
                      />
                    </div>
                  </div>

                  <Button @click="refreshBoard(board.id)" class="w-full text-sm h-8">
                    <ArrowPathIcon class="h-4 w-4 mr-1" />
                    Refresh Board
                  </Button>

                  <div class="text-xs text-gray-500">
                    Last updated: {{ board.lastUpdate.toLocaleString() }}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Promotions Tab -->
        <div v-if="activeTab === 'promotions'" class="space-y-6">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">Active Promotions</h3>
            <Button @click="showEditPromotion = true" class="bg-purple-600 hover:bg-purple-700">
              <PlusIcon class="h-4 w-4 mr-2" />
              Add Promotion
            </Button>
          </div>

          <div
            v-if="hardwareStore.currentMenuContent"
            class="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            <Card
              v-for="promotion in hardwareStore.currentMenuContent.promotions"
              :key="promotion.id"
            >
              <CardContent class="p-4">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex-1">
                    <h4 class="font-semibold">{{ promotion.title }}</h4>
                    <p class="text-sm text-gray-600 mt-1">{{ promotion.description }}</p>
                  </div>
                  <Button
                    @click="removePromotion(promotion.id)"
                    size="sm"
                    class="bg-red-600 hover:bg-red-700"
                  >
                    <TrashIcon class="h-3 w-3" />
                  </Button>
                </div>

                <div class="flex items-center justify-between">
                  <div class="text-sm">
                    <span
                      class="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium capitalize"
                    >
                      {{ promotion.type }}
                    </span>
                    <span v-if="promotion.value" class="ml-2 font-medium">
                      {{
                        promotion.type === 'discount'
                          ? `${promotion.value}% OFF`
                          : `$${promotion.value}`
                      }}
                    </span>
                  </div>
                  <span
                    :class="promotion.isActive ? 'text-green-600' : 'text-red-600'"
                    class="text-sm font-medium"
                  >
                    {{ promotion.isActive ? 'ACTIVE' : 'INACTIVE' }}
                  </span>
                </div>

                <div v-if="promotion.validUntil" class="text-xs text-gray-500 mt-2">
                  Valid until: {{ promotion.validUntil.toLocaleDateString() }}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <!-- Settings Tab -->
        <div v-if="activeTab === 'settings'" class="space-y-6">
          <Card>
            <CardHeader>
              <h3 class="text-lg font-semibold">Display Settings</h3>
            </CardHeader>
            <CardContent>
              <div v-if="hardwareStore.currentMenuContent" class="space-y-4">
                <div class="grid grid-cols-2 gap-4">
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">Show Prices</label>
                    <input
                      type="checkbox"
                      :checked="hardwareStore.currentMenuContent.displaySettings.showPrices"
                      @change="toggleDisplaySetting('showPrices')"
                      class="rounded"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">Show Descriptions</label>
                    <input
                      type="checkbox"
                      :checked="hardwareStore.currentMenuContent.displaySettings.showDescriptions"
                      @change="toggleDisplaySetting('showDescriptions')"
                      class="rounded"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">Show Nutrition Info</label>
                    <input
                      type="checkbox"
                      :checked="hardwareStore.currentMenuContent.displaySettings.showNutrition"
                      @change="toggleDisplaySetting('showNutrition')"
                      class="rounded"
                    />
                  </div>
                  <div class="flex items-center justify-between">
                    <label class="text-sm font-medium">Show Availability</label>
                    <input
                      type="checkbox"
                      :checked="hardwareStore.currentMenuContent.displaySettings.showAvailability"
                      @change="toggleDisplaySetting('showAvailability')"
                      class="rounded"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h3 class="text-lg font-semibold">Templates</h3>
            </CardHeader>
            <CardContent>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  v-for="template in ['classic', 'modern', 'promotional', 'minimal']"
                  :key="template"
                  @click="changeTemplate(template)"
                  :class="[
                    'p-4 border rounded-lg text-center transition-colors',
                    hardwareStore.currentMenuContent?.template === template
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400',
                  ]"
                >
                  <div
                    class="w-full h-20 bg-gray-100 rounded mb-2 flex items-center justify-center"
                  >
                    <TvIcon class="h-8 w-8 text-gray-400" />
                  </div>
                  <p class="text-sm font-medium capitalize">{{ template }}</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>

    <!-- Add Promotion Modal -->
    <div
      v-if="showEditPromotion"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-96 max-w-full">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-lg font-semibold">Add Promotion</h3>
          <Button @click="showEditPromotion = false" variant="outline" size="sm">✕</Button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-1">Title</label>
            <Input v-model="promotionForm.title" placeholder="Promotion title" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Description</label>
            <textarea
              v-model="promotionForm.description"
              placeholder="Promotion description"
              class="w-full border rounded px-3 py-2 h-20"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium mb-1">Type</label>
              <select v-model="promotionForm.type" class="w-full border rounded px-3 py-2">
                <option value="discount">Discount</option>
                <option value="bogo">BOGO</option>
                <option value="combo">Combo</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium mb-1">Value</label>
              <Input v-model.number="promotionForm.value" type="number" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">Valid Until</label>
            <Input v-model="promotionForm.validUntil" type="date" />
          </div>

          <div class="flex space-x-2 pt-4">
            <Button @click="addPromotion" class="flex-1">Add Promotion</Button>
            <Button @click="showEditPromotion = false" variant="outline" class="flex-1"
              >Cancel</Button
            >
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
