<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useHardwareStore } from '@/stores/hardware'
import { useBranchesStore } from '@/stores/branches'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import MenuDisplay from '@/components/MenuDisplay.vue'
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
  ShareIcon,
  PresentationChartLineIcon,
  XMarkIcon,
} from '@heroicons/vue/24/outline'

const hardwareStore = useHardwareStore()
const branchesStore = useBranchesStore()

const activeTab = ref('content')
const showEditPromotion = ref(false)
const showEditItem = ref(false)
const showAddCategoryModal = ref(false)

const isEditingItem = ref(false)
const selectedItemCategoryId = ref('')
const newCategoryName = ref('')

const promotionForm = ref({
  title: '',
  description: '',
  type: 'discount' as 'discount' | 'bogo' | 'combo' | 'announcement',
  value: 0,
  validUntil: '',
  isActive: true,
  priority: 1,
})

const itemForm = ref({
  id: '',
  productId: '',
  name: '',
  description: '',
  price: 3.99,
  originalPrice: undefined as number | undefined,
  isAvailable: true,
  isPopular: false,
  isNew: false,
  dietary: [] as string[],
  calories: undefined as number | undefined,
  prepTime: undefined as number | undefined,
  imageUrl: '',
})

// Stream TV Simulator state
const selectedBoardId = ref('')
const activeStreamCategoryIndex = ref(0)
const streamInterval = ref<any>(null)
const isFullscreenStream = ref(false)
const isCasting = ref(false)

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

const visibleCategories = computed(() => {
  return hardwareStore.currentMenuContent?.categories.filter((c) => c.isVisible !== false) || []
})

const activeBoard = computed(() => {
  const boards = hardwareStore.currentBranchMenuBoards
  if (boards.length === 0) return null
  return boards.find((b) => b.id === selectedBoardId.value) || boards[0]
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

// Category & Item Actions
function handleAddCategory() {
  if (newCategoryName.value.trim()) {
    hardwareStore.addCategory(newCategoryName.value.trim())
    newCategoryName.value = ''
    showAddCategoryModal.value = false
  }
}

function handleDeleteCategory(categoryId: string) {
  if (confirm('Are you sure you want to delete this category and all its items from the menu board?')) {
    hardwareStore.deleteCategory(categoryId)
  }
}

function openAddItemModal(categoryId: string) {
  selectedItemCategoryId.value = categoryId
  isEditingItem.value = false
  itemForm.value = {
    id: '',
    productId: `prod-${Math.floor(Math.random() * 9000 + 1000)}`,
    name: '',
    description: '',
    price: 3.99,
    originalPrice: undefined,
    isAvailable: true,
    isPopular: false,
    isNew: false,
    dietary: [],
    calories: undefined,
    prepTime: undefined,
    imageUrl: '',
  }
  showEditItem.value = true
}

function openEditItemModal(categoryId: string, item: any) {
  selectedItemCategoryId.value = categoryId
  isEditingItem.value = true
  itemForm.value = {
    id: item.id,
    productId: item.productId,
    name: item.name,
    description: item.description || '',
    price: item.price,
    originalPrice: item.originalPrice,
    isAvailable: item.isAvailable,
    isPopular: item.isPopular,
    isNew: item.isNew,
    dietary: [...item.dietary],
    calories: item.calories,
    prepTime: item.prepTime,
    imageUrl: item.imageUrl || '',
  }
  showEditItem.value = true
}

function saveItem() {
  if (isEditingItem.value) {
    hardwareStore.updateMenuItem(selectedItemCategoryId.value, itemForm.value.id, {
      name: itemForm.value.name,
      description: itemForm.value.description,
      price: itemForm.value.price,
      originalPrice: itemForm.value.originalPrice || undefined,
      isAvailable: itemForm.value.isAvailable,
      isPopular: itemForm.value.isPopular,
      isNew: itemForm.value.isNew,
      dietary: itemForm.value.dietary,
      calories: itemForm.value.calories || undefined,
      prepTime: itemForm.value.prepTime || undefined,
      imageUrl: itemForm.value.imageUrl || undefined,
    })
  } else {
    hardwareStore.addMenuItem(selectedItemCategoryId.value, {
      productId: itemForm.value.productId,
      name: itemForm.value.name,
      description: itemForm.value.description,
      price: itemForm.value.price,
      originalPrice: itemForm.value.originalPrice || undefined,
      isAvailable: itemForm.value.isAvailable,
      isPopular: itemForm.value.isPopular,
      isNew: itemForm.value.isNew,
      dietary: itemForm.value.dietary,
      calories: itemForm.value.calories || undefined,
      prepTime: itemForm.value.prepTime || undefined,
      imageUrl: itemForm.value.imageUrl || undefined,
    })
  }
  showEditItem.value = false
}

function handleDeleteItem(categoryId: string, itemId: string) {
  if (confirm('Are you sure you want to delete this menu item from the board?')) {
    hardwareStore.deleteMenuItem(categoryId, itemId)
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

function toggleCategoryVisibility(category: any) {
  category.isVisible = category.isVisible === false ? true : false
  hardwareStore.updateMenuBoardContent({ lastModified: new Date() })
}

// Continuous stream loop functions
function startStreamShow() {
  stopStreamShow()
  const content = hardwareStore.currentMenuContent
  const speed = Math.max(3, content?.displaySettings?.scrollSpeed || 6) * 1000
  streamInterval.value = setInterval(() => {
    if (visibleCategories.value.length > 0) {
      activeStreamCategoryIndex.value = (activeStreamCategoryIndex.value + 1) % visibleCategories.value.length
    }
  }, speed)
}

function stopStreamShow() {
  if (streamInterval.value) {
    clearInterval(streamInterval.value)
    streamInterval.value = null
  }
}

function triggerCasting() {
  isCasting.value = true
  setTimeout(() => {
    isCasting.value = false
    alert('Menu updates pushed to selected display device via AirPlay/Miracast!')
  }, 1500)
}

function toggleFullscreenStream() {
  isFullscreenStream.value = !isFullscreenStream.value
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isFullscreenStream.value) {
    isFullscreenStream.value = false
  }
}

// Watch active tab to start/stop stream interval
watch(activeTab, (newTab) => {
  if (newTab === 'tv-stream') {
    startStreamShow()
  } else {
    stopStreamShow()
  }
})

watch(
  () => hardwareStore.currentMenuContent?.displaySettings.scrollSpeed,
  () => {
    if (activeTab.value === 'tv-stream') {
      startStreamShow()
    }
  }
)

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  // Set default board if available
  const boards = hardwareStore.currentBranchMenuBoards
  if (boards.length > 0) {
    selectedBoardId.value = boards[0].id
  }
  if (activeTab.value === 'tv-stream') {
    startStreamShow()
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  stopStreamShow()
})
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
            v-for="tab in ['content', 'boards', 'promotions', 'settings', 'tv-stream', 'menu-display']"
            :key="tab"
            @click="changeTab(tab)"
            :class="[
              'py-4 px-1 border-b-2 font-semibold text-sm capitalize flex items-center space-x-1.5',
              activeTab === tab
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
            ]"
          >
            <span>{{ tab === 'tv-stream' ? 'Live TV Stream 📺' : tab === 'menu-display' ? 'Menu Grid Display 📊' : tab }}</span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Content Management Tab -->
        <div v-if="activeTab === 'content'" class="space-y-6">
          <div class="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
            <div>
              <h3 class="text-lg font-semibold text-gray-800">Menu Boards Content</h3>
              <p class="text-xs text-gray-500">Edit categories and items displaying on your TV boards</p>
            </div>
            <Button @click="showAddCategoryModal = true" class="bg-blue-600 hover:bg-blue-700">
              <PlusIcon class="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>

          <div v-if="hardwareStore.currentMenuContent" class="space-y-8">
            <div 
              v-for="category in hardwareStore.currentMenuContent.categories" 
              :key="category.id"
              class="border border-gray-200 rounded-xl p-5 bg-white shadow-sm"
            >
              <div class="flex justify-between items-center mb-5 pb-3 border-b border-gray-100">
                <div class="flex items-center space-x-3">
                  <h4 class="text-lg font-bold text-gray-900">{{ category.name }}</h4>
                  <span class="px-2.5 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full font-medium">
                    {{ category.items.length }} {{ category.items.length === 1 ? 'item' : 'items' }}
                  </span>
                </div>
                <div class="flex items-center space-x-2">
                  <Button @click="openAddItemModal(category.id)" size="sm" class="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <PlusIcon class="h-4 w-4 mr-1" />
                    Add Item
                  </Button>
                  <Button @click="handleDeleteCategory(category.id)" size="sm" variant="outline" class="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700">
                    <TrashIcon class="h-4 w-4 mr-1" />
                    Delete Category
                  </Button>
                </div>
              </div>

              <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                <Card v-for="item in category.items" :key="item.id" class="overflow-hidden hover:shadow-md transition-all duration-200 border-gray-100">
                  <CardContent class="p-4">
                    <div class="flex justify-between items-start mb-2">
                      <div class="flex-1">
                        <div class="flex items-center space-x-2">
                          <h5 class="font-bold text-gray-950">{{ item.name }}</h5>
                          <StarIcon v-if="item.isPopular" class="h-4 w-4 text-amber-500 fill-amber-500" />
                          <span
                            v-if="item.isNew"
                            class="px-1.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded"
                            >NEW</span
                          >
                        </div>
                        <p class="text-sm text-gray-600 mt-1.5 line-clamp-2 h-10">{{ item.description || 'No description provided.' }}</p>
                        <div class="flex items-center space-x-2 mt-2">
                          <span class="font-extrabold text-lg text-emerald-600">{{
                            formatCurrency(item.price)
                          }}</span>
                          <span
                            v-if="item.originalPrice && item.originalPrice > item.price"
                            class="text-sm text-gray-400 line-through font-medium"
                          >
                            {{ formatCurrency(item.originalPrice) }}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div class="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                      <div class="flex items-center space-x-2 text-xs text-gray-500 font-medium">
                        <span v-if="item.calories" class="bg-gray-100 px-1.5 py-0.5 rounded">{{ item.calories }} cal</span>
                        <span v-if="item.prepTime" class="bg-gray-100 px-1.5 py-0.5 rounded">{{ item.prepTime }} min</span>
                        <span v-if="item.dietary && item.dietary.length > 0" class="text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">{{ item.dietary.join(', ') }}</span>
                      </div>
                    </div>

                    <div class="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                      <div class="flex space-x-1">
                        <Button
                          @click="openEditItemModal(category.id, item)"
                          size="sm"
                          variant="ghost"
                          class="text-blue-600 hover:bg-blue-50 h-8 w-8 p-0 rounded-lg"
                          title="Edit Item"
                        >
                          <PencilIcon class="h-4.5 w-4.5" />
                        </Button>
                        <Button
                          @click="handleDeleteItem(category.id, item.id)"
                          size="sm"
                          variant="ghost"
                          class="text-red-600 hover:bg-red-50 h-8 w-8 p-0 rounded-lg"
                          title="Delete Item"
                        >
                          <TrashIcon class="h-4.5 w-4.5" />
                        </Button>
                      </div>

                      <Button
                        @click="toggleItemAvailability(item)"
                        size="sm"
                        :class="[
                          'text-xs font-semibold px-3 h-8 rounded-lg',
                          item.isAvailable
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                        ]"
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

                <!-- Transition Speed -->
                <div class="pt-4 border-t mt-4 space-y-2">
                  <div class="flex items-center justify-between mb-2">
                    <label class="text-sm font-medium text-gray-800">Stream Transition Speed</label>
                    <span class="text-sm font-bold text-blue-600">{{ hardwareStore.currentMenuContent.displaySettings.scrollSpeed || 6 }} seconds</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    v-model.number="hardwareStore.currentMenuContent.displaySettings.scrollSpeed"
                    @change="hardwareStore.updateMenuBoardContent({ lastModified: new Date() })"
                    class="w-full"
                  />
                  <p class="text-xs text-gray-500">Adjust how fast categories loop on the live TV stream.</p>
                </div>

                <!-- Category Toggles -->
                <div class="pt-4 border-t mt-4 space-y-4">
                  <div>
                    <label class="text-sm font-medium text-gray-800">Active Categories</label>
                    <p class="text-xs text-gray-500 mb-3">Select which categories appear on the TV display.</p>
                  </div>
                  <div class="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div 
                      v-for="category in hardwareStore.currentMenuContent.categories" 
                      :key="category.id"
                      class="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      @click="toggleCategoryVisibility(category)"
                    >
                      <span class="text-sm font-medium" :class="category.isVisible !== false ? 'text-gray-900' : 'text-gray-400 line-through'">{{ category.name }}</span>
                      <input
                        type="checkbox"
                        :checked="category.isVisible !== false"
                        @change.stop="toggleCategoryVisibility(category)"
                        class="rounded text-blue-600 focus:ring-blue-500"
                      />
                    </div>
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

        <!-- Live TV Streaming Tab -->
        <div v-if="activeTab === 'tv-stream'" class="space-y-6">
          <!-- Control Panel -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div class="md:col-span-2 space-y-3">
              <div class="flex items-center space-x-2">
                <span class="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                <span class="w-2.5 h-2.5 bg-green-500 rounded-full absolute"></span>
                <h4 class="font-bold text-lg text-slate-100">Live TV Stream Casting Engine</h4>
              </div>
              <p class="text-sm text-slate-400">
                You are currently streaming to <span class="text-blue-400 font-semibold font-mono">{{ activeBoard?.name || 'Samsung Smart Signage' }}</span> located at the <span class="text-blue-400 font-semibold">{{ activeBoard?.location || 'Counter' }}</span>. Any content changes, pricing updates, or item disablement made in the 'Content' tab will reflect on the physical screens in real-time.
              </p>
              <div class="flex flex-wrap gap-3 pt-2">
                <Button @click="triggerCasting" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold">
                  <ShareIcon class="h-4 w-4 mr-1.5" />
                  {{ isCasting ? 'Casting Menu...' : 'Sync & Cast to TV' }}
                </Button>
                <Button @click="toggleFullscreenStream" class="bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700">
                  <PresentationChartLineIcon class="h-4 w-4 mr-1.5" />
                  Full-Screen Stream
                </Button>
              </div>
            </div>
            
            <div class="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 text-xs font-mono">
              <div class="text-slate-500 font-bold uppercase tracking-wider text-[10px] border-b border-slate-850 pb-1">Cast Device Metadata</div>
              <div class="flex justify-between">
                <span class="text-slate-500">Device Model:</span>
                <span class="text-slate-300">LG Signage OLED / Samsung UHD TV</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Device Status:</span>
                <span class="text-green-400 font-bold">● CONNECTED (AIRPLAY 2)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Refresh Loop:</span>
                <span class="text-slate-300">Continuous 6s Rotation</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Resolution:</span>
                <span class="text-slate-300">1920 x 1080 (1080p FHD)</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-500">Assigned Board:</span>
                <select v-model="selectedBoardId" class="bg-slate-900 border border-slate-700 text-slate-300 text-[11px] rounded px-1.5 py-0.5 focus:outline-none focus:border-blue-500">
                  <option v-for="board in hardwareStore.currentBranchMenuBoards" :key="board.id" :value="board.id">
                    {{ board.name }}
                  </option>
                </select>
              </div>
            </div>
          </div>

          <!-- The Simulated TV Frame -->
          <div class="relative mx-auto max-w-5xl">
            <!-- TV Outer Bezel -->
            <div class="bg-slate-950 p-6 rounded-[2.5rem] border-[12px] border-slate-800 shadow-2xl relative">
              <!-- TV Power LED -->
              <div class="absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_#3b82f6]"></div>
              
              <!-- TV Screen Area -->
              <div class="bg-black text-white aspect-[16/9] w-full overflow-hidden relative rounded-xl font-sans select-none shadow-inner border border-slate-900">
                <!-- Watermark Overlay -->
                <div class="absolute top-4 right-4 bg-black bg-opacity-65 border border-slate-850 px-2 py-1 rounded text-[10px] font-mono text-slate-400 uppercase tracking-widest z-10 flex items-center space-x-1">
                  <span class="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  <span>Judy's Live Cast</span>
                </div>

                <div v-if="hardwareStore.currentMenuContent" class="h-full flex flex-col justify-between p-8 bg-gradient-to-b from-slate-950 to-neutral-950">
                  <!-- TV Header -->
                  <div class="flex justify-between items-center border-b border-slate-800 pb-4">
                    <div class="flex items-center space-x-3">
                      <div class="bg-amber-600 p-1.5 rounded-lg">
                        <SparklesIcon class="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h2 class="text-2xl font-black tracking-tight text-white uppercase font-serif">Judy's Cafe</h2>
                        <p class="text-xs text-slate-400 font-semibold tracking-wide uppercase">Artisanal Selection • Streamed Live</p>
                      </div>
                    </div>
                    <div class="text-right">
                      <span class="text-sm font-bold bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800 text-slate-300">
                        Device Loop: {{ activeBoard?.name }}
                      </span>
                    </div>
                  </div>

                  <!-- Category Items View Area -->
                  <div class="flex-1 my-6 overflow-hidden">
                    <div v-for="(category, cIdx) in visibleCategories" :key="category.id">
                      <div v-if="cIdx === activeStreamCategoryIndex" class="space-y-4 animate-fade-in">
                        <div class="flex items-center space-x-3 mb-2">
                          <h3 class="text-xl font-extrabold text-amber-400 tracking-wide uppercase border-l-4 border-amber-500 pl-3">
                            {{ category.name }}
                          </h3>
                          <span class="text-xs text-slate-500 font-mono">(Display Loop {{ cIdx + 1 }}/{{ visibleCategories.length }})</span>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-x-8 gap-y-4">
                          <div 
                            v-for="item in category.items.slice(0, 6)" 
                            :key="item.id" 
                            :class="['flex justify-between items-start border-b border-dashed border-slate-900 pb-3', !item.isAvailable ? 'opacity-35' : '']"
                          >
                            <div class="flex-1 pr-4">
                              <div class="flex items-center space-x-2">
                                <span class="font-extrabold text-base text-slate-100 tracking-tight">{{ item.name }}</span>
                                <span v-if="item.isPopular" class="px-1.5 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full">BEST</span>
                                <span v-if="item.isNew" class="px-1.5 py-0.5 bg-blue-500 text-white text-[9px] font-black rounded-full">NEW</span>
                              </div>
                              <p v-if="hardwareStore.currentMenuContent.displaySettings.showDescriptions" class="text-xs text-slate-400 mt-1 line-clamp-1">
                                {{ item.description }}
                              </p>
                              <div class="flex items-center space-x-2 mt-1.5 text-[10px] text-slate-500 font-bold">
                                <span v-if="hardwareStore.currentMenuContent.displaySettings.showNutrition && item.calories">{{ item.calories }} cal</span>
                                <span v-if="item.dietary && item.dietary.length > 0">• {{ item.dietary.join(', ') }}</span>
                              </div>
                            </div>
                            
                            <div class="text-right">
                              <div v-if="hardwareStore.currentMenuContent.displaySettings.showPrices" class="font-mono text-lg font-black text-emerald-400">
                                {{ formatCurrency(item.price) }}
                              </div>
                              <div v-if="item.originalPrice && item.originalPrice > item.price" class="font-mono text-xs text-slate-500 line-through">
                                {{ formatCurrency(item.originalPrice) }}
                              </div>
                              <span v-if="!item.isAvailable && hardwareStore.currentMenuContent.displaySettings.showAvailability" class="text-[9px] font-black bg-rose-950 text-rose-400 px-1.5 py-0.5 rounded uppercase mt-1 inline-block">
                                Out of Stock
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- TV Footer / Ticker promotions -->
                  <div class="border-t border-slate-900 pt-3 flex items-center bg-slate-950 -mx-8 -mb-8 px-8 py-3 rounded-b-xl overflow-hidden relative h-12">
                    <div class="bg-amber-500 text-black text-xs font-black px-3 py-1.5 rounded-r absolute left-0 top-0 bottom-0 flex items-center uppercase tracking-wider z-20 shadow-md">
                      Promotions
                    </div>
                    <div class="w-full pl-24 overflow-hidden relative">
                      <div class="whitespace-nowrap inline-block animate-marquee text-slate-200 text-sm font-bold tracking-wide">
                        <span v-for="promo in hardwareStore.currentMenuContent.promotions" :key="promo.id" class="mx-12 inline-flex items-center space-x-2">
                          <span class="w-2 h-2 bg-amber-400 rounded-full"></span>
                          <span class="text-amber-400 uppercase font-extrabold">[{{ promo.type }}]</span>
                          <span>{{ promo.title }}: {{ promo.description }}</span>
                          <span v-if="promo.value" class="text-emerald-400 font-mono">
                            ({{ promo.type === 'discount' ? `${promo.value}% OFF` : `$${promo.value} value` }})
                          </span>
                        </span>
                        <span v-if="hardwareStore.currentMenuContent.promotions.length === 0" class="mx-12">
                          Welcome to Judy's Cafe! High-Quality, Streamed Menu Boards Active & Synced.
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- TV Stand/Mount Base Simulation -->
            <div class="w-32 h-6 bg-slate-700 mx-auto -mt-1 relative rounded-b shadow-lg border border-slate-800 z-0"></div>
            <div class="w-56 h-2 bg-slate-800 mx-auto rounded shadow-lg z-0"></div>
          </div>
        </div>

        <!-- Menu Grid Display Tab -->
        <div v-if="activeTab === 'menu-display'" class="space-y-6">
          <MenuDisplay />
        </div>
      </div>
    </div>

    <!-- Add Promotion Modal -->
    <div
      v-if="showEditPromotion"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white rounded-lg p-6 w-96 max-w-full animate-fade-in">
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

    <!-- Add Category Modal -->
    <div
      v-if="showAddCategoryModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
    >
      <div class="bg-white rounded-xl p-6 w-96 max-w-full shadow-2xl border border-gray-100">
        <div class="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 class="text-lg font-bold text-gray-900">Add Menu Category</h3>
          <Button @click="showAddCategoryModal = false" variant="ghost" size="sm" class="h-8 w-8 p-0 rounded-full text-gray-500 hover:bg-gray-100">
            <XMarkIcon class="h-5 w-5" />
          </Button>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Category Name</label>
            <Input v-model="newCategoryName" placeholder="e.g., Seasonal Cold Brews, Pastries" @keyup.enter="handleAddCategory" />
          </div>

          <div class="flex space-x-2 pt-4">
            <Button @click="handleAddCategory" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">Add Category</Button>
            <Button @click="showAddCategoryModal = false" variant="outline" class="flex-1 font-medium">Cancel</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Menu Item Modal -->
    <div
      v-if="showEditItem"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in"
    >
      <div class="bg-white rounded-xl p-6 w-[28rem] max-w-full shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4 pb-2 border-b">
          <h3 class="text-lg font-bold text-gray-900">
            {{ isEditingItem ? 'Edit Menu Item' : 'Add Menu Item' }}
          </h3>
          <Button @click="showEditItem = false" variant="ghost" size="sm" class="h-8 w-8 p-0 rounded-full text-gray-500 hover:bg-gray-100">
            <XMarkIcon class="h-5 w-5" />
          </Button>
        </div>

        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Product ID</label>
              <Input v-model="itemForm.productId" placeholder="PROD-ID" disabled class="bg-gray-50 font-mono text-xs" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Price ($)</label>
              <Input v-model.number="itemForm.price" type="number" step="0.01" min="0" />
            </div>
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Item Name</label>
            <Input v-model="itemForm.name" placeholder="e.g., Iced Salted Caramel Latte" />
          </div>

          <div>
            <label class="block text-sm font-semibold text-gray-700 mb-1">Description</label>
            <textarea
              v-model="itemForm.description"
              placeholder="e.g., Rich espresso with caramelized hints, ice cold milk and sea salt topping."
              class="w-full border border-gray-300 rounded px-3 py-2 text-sm h-20 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            ></textarea>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Original Price ($)</label>
              <Input v-model.number="itemForm.originalPrice" type="number" step="0.01" min="0" placeholder="e.g. 4.99 (Optional)" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Calories</label>
              <Input v-model.number="itemForm.calories" type="number" placeholder="Optional" />
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Prep Time (mins)</label>
              <Input v-model.number="itemForm.prepTime" type="number" placeholder="Optional" />
            </div>
            <div>
              <label class="block text-sm font-semibold text-gray-700 mb-1">Dietary Tags</label>
              <Input 
                :model-value="itemForm.dietary.join(', ')" 
                @update:model-value="(val) => {
                  const sVal = String(val || '');
                  itemForm.dietary = sVal.split(',').map((tag: string) => tag.trim()).filter(Boolean);
                }" 
                placeholder="e.g. Vegan, Gluten-Free" 
              />
            </div>
          </div>

          <!-- Feature Flags -->
          <div class="bg-gray-50 p-3 rounded-lg border border-gray-100 grid grid-cols-3 gap-2">
            <label class="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" v-model="itemForm.isPopular" class="rounded text-amber-500 focus:ring-amber-500" />
              <span>Popular ⭐</span>
            </label>
            <label class="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" v-model="itemForm.isNew" class="rounded text-blue-500 focus:ring-blue-500" />
              <span>New ✨</span>
            </label>
            <label class="flex items-center space-x-1.5 text-xs font-semibold text-gray-700 cursor-pointer">
              <input type="checkbox" v-model="itemForm.isAvailable" class="rounded text-green-500 focus:ring-green-500" />
              <span>Available</span>
            </label>
          </div>

          <div class="flex space-x-2 pt-4 border-t border-gray-100">
            <Button @click="saveItem" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium">Save Item</Button>
            <Button @click="showEditItem = false" variant="outline" class="flex-1 font-medium">Cancel</Button>
          </div>
        </div>
      </div>
    </div>

    <!-- Full-screen Live TV Stream Overlay -->
    <div
      v-if="isFullscreenStream"
      class="fixed inset-0 bg-neutral-950 text-white z-50 overflow-hidden flex flex-col justify-between p-12 font-sans select-none animate-fade-in"
    >
      <!-- Exit Button -->
      <Button
        @click="toggleFullscreenStream"
        variant="ghost"
        class="absolute top-6 left-6 text-slate-400 hover:text-white bg-slate-900 bg-opacity-70 border border-slate-800 rounded-full h-10 px-4 flex items-center space-x-1 shadow-lg"
      >
        <XMarkIcon class="h-4 w-4" />
        <span class="text-xs font-bold font-mono">Exit Stream [ESC]</span>
      </Button>

      <!-- Watermark Overlay -->
      <div class="absolute top-6 right-6 bg-slate-900 bg-opacity-75 border border-slate-800 px-3 py-1.5 rounded-md text-xs font-mono text-slate-400 uppercase tracking-widest flex items-center space-x-1.5 shadow-lg">
        <span class="w-2 h-2 bg-red-500 rounded-full animate-ping"></span>
        <span class="font-bold">Live Stream Cast Active</span>
      </div>

      <div v-if="hardwareStore.currentMenuContent" class="h-full flex flex-col justify-between max-w-6xl mx-auto w-full pt-10">
        <!-- TV Header -->
        <div class="flex justify-between items-center border-b border-slate-850 pb-6">
          <div class="flex items-center space-x-4">
            <div class="bg-emerald-600 p-2.5 rounded-xl shadow-lg shadow-emerald-950">
              <SparklesIcon class="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 class="text-4xl font-black tracking-tight text-white uppercase font-serif">Judy's Cafe</h1>
              <p class="text-sm text-slate-400 font-bold tracking-widest uppercase">Artisanal Board Stream • Live & Synced</p>
            </div>
          </div>
          <div class="text-right">
            <div class="text-xs text-slate-500 font-mono tracking-widest uppercase">Stream Source</div>
            <span class="text-base font-extrabold text-amber-400">{{ activeBoard?.name }}</span>
          </div>
        </div>

        <!-- Dynamic Category Loop -->
        <div class="flex-1 my-10 flex flex-col justify-center overflow-hidden">
          <div v-for="(category, cIdx) in visibleCategories" :key="category.id" class="w-full">
            <div v-if="cIdx === activeStreamCategoryIndex" class="space-y-6 animate-fade-in">
              <div class="flex items-center space-x-4 mb-4">
                <h2 class="text-3xl font-black text-amber-400 tracking-wider uppercase border-l-6 border-amber-500 pl-4">
                  {{ category.name }}
                </h2>
                <span class="text-sm text-slate-500 font-mono font-bold uppercase tracking-widest">Page {{ cIdx + 1 }} of {{ visibleCategories.length }}</span>
              </div>
              
              <div class="grid grid-cols-2 gap-x-16 gap-y-6">
                <div 
                  v-for="item in category.items.slice(0, 8)" 
                  :key="item.id" 
                  :class="['flex justify-between items-start border-b border-dashed border-slate-800 pb-4', !item.isAvailable ? 'opacity-30' : '']"
                >
                  <div class="flex-1 pr-6">
                    <div class="flex items-center space-x-2.5">
                      <span class="font-extrabold text-xl text-slate-100 tracking-tight">{{ item.name }}</span>
                      <span v-if="item.isPopular" class="px-2 py-0.5 bg-amber-500 text-black text-[10px] font-black rounded-full uppercase tracking-wider">Popular</span>
                      <span v-if="item.isNew" class="px-2 py-0.5 bg-blue-500 text-white text-[10px] font-black rounded-full uppercase tracking-wider">New</span>
                    </div>
                    <p v-if="hardwareStore.currentMenuContent.displaySettings.showDescriptions" class="text-sm text-slate-400 mt-1.5 line-clamp-1">
                      {{ item.description }}
                    </p>
                    <div class="flex items-center space-x-2.5 mt-2 text-xs text-slate-500 font-bold">
                      <span v-if="hardwareStore.currentMenuContent.displaySettings.showNutrition && item.calories">{{ item.calories }} calories</span>
                      <span v-if="item.dietary && item.dietary.length > 0">• {{ item.dietary.join(', ') }}</span>
                    </div>
                  </div>
                  
                  <div class="text-right">
                    <div v-if="hardwareStore.currentMenuContent.displaySettings.showPrices" class="font-mono text-2xl font-black text-emerald-400">
                      {{ formatCurrency(item.price) }}
                    </div>
                    <div v-if="item.originalPrice && item.originalPrice > item.price" class="font-mono text-xs text-slate-500 line-through">
                      {{ formatCurrency(item.originalPrice) }}
                    </div>
                    <span v-if="!item.isAvailable && hardwareStore.currentMenuContent.displaySettings.showAvailability" class="text-[10px] font-black bg-rose-950 text-rose-400 px-2 py-0.5 rounded uppercase mt-1 inline-block">
                      Sold Out
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Scrolling Banner Promotions -->
        <div class="border-t border-slate-850 pt-4 flex items-center bg-black -mx-12 -mb-12 px-12 py-5 rounded-b-xl overflow-hidden relative h-16 shadow-[0_-8px_24px_rgba(0,0,0,0.8)]">
          <div class="bg-amber-500 text-black text-sm font-black px-4 py-2 rounded-r absolute left-0 top-0 bottom-0 flex items-center uppercase tracking-widest z-20 shadow-lg shadow-black">
            Judy's Promos
          </div>
          <div class="w-full pl-36 overflow-hidden relative">
            <div class="whitespace-nowrap inline-block animate-marquee text-slate-200 text-base font-bold tracking-wide">
              <span v-for="promo in hardwareStore.currentMenuContent.promotions" :key="promo.id" class="mx-16 inline-flex items-center space-x-3">
                <span class="w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse"></span>
                <span class="text-amber-400 uppercase font-extrabold">[{{ promo.type }}]</span>
                <span>{{ promo.title }}: {{ promo.description }}</span>
                <span v-if="promo.value" class="text-emerald-400 font-mono">
                  ({{ promo.type === 'discount' ? `${promo.value}% OFF` : `$${promo.value} value` }})
                </span>
              </span>
              <span v-if="hardwareStore.currentMenuContent.promotions.length === 0" class="mx-16">
                Fresh organic coffee • Handcrafted pastries • Sandwiches made daily. Welcome to Judy's Cafe.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
