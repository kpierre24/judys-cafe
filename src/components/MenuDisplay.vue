<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useHardwareStore } from '@/stores/hardware'
import { useBranchesStore } from '@/stores/branches'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const hardwareStore = useHardwareStore()
const branchesStore = useBranchesStore()

// State
const searchQuery = ref('')
const selectedCategory = ref('all')
const sortBy = ref('default') // default, price-asc, price-desc, name-asc
const showOnlyAvailable = ref(false)
const showOnlyDietary = ref('all') // all, vegetarian, vegan, gluten-free
const isLoading = ref(true)

// Simulate data fetching with a beautiful loading animation
function simulateFetch() {
  isLoading.value = true
  setTimeout(() => {
    isLoading.value = false
  }, 400)
}

// Re-fetch on mount and whenever branch changes
onMounted(() => {
  simulateFetch()
})

watch(() => branchesStore.selectedBranchId, () => {
  simulateFetch()
  selectedCategory.value = 'all'
  searchQuery.value = ''
})

// Categories list computed from hardware store
const categories = computed(() => {
  return hardwareStore.currentMenuContent?.categories || []
})

// Filter and Sort Items
const filteredItems = computed(() => {
  if (!hardwareStore.currentMenuContent) return []

  let list: Array<any> = []

  // Gather all items from visible categories (or all categories)
  const cats = categories.value
  cats.forEach((category) => {
    // Respect category visibility setting
    if (category.isVisible !== false) {
      category.items.forEach((item) => {
        list.push({
          ...item,
          categoryName: category.name,
          categoryId: category.id,
        })
      })
    }
  })

  // 1. Search Query Filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim()
    list = list.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
    )
  }

  // 2. Category Filter
  if (selectedCategory.value !== 'all') {
    list = list.filter((item) => item.categoryId === selectedCategory.value)
  }

  // 3. Availability Filter
  if (showOnlyAvailable.value) {
    list = list.filter((item) => item.isAvailable)
  }

  // 4. Dietary Filter
  if (showOnlyDietary.value !== 'all') {
    list = list.filter((item) => {
      if (!item.dietary || !Array.isArray(item.dietary)) return false
      return item.dietary.some((d: string) => d.toLowerCase() === showOnlyDietary.value)
    })
  }

  // 5. Sorting
  if (sortBy.value === 'price-asc') {
    list.sort((a, b) => a.price - b.price)
  } else if (sortBy.value === 'price-desc') {
    list.sort((a, b) => b.price - a.price)
  } else if (sortBy.value === 'name-asc') {
    list.sort((a, b) => a.name.localeCompare(b.name))
  }

  return list
})

// Reset all filters
function resetFilters() {
  searchQuery.value = ''
  selectedCategory.value = 'all'
  sortBy.value = 'default'
  showOnlyAvailable.value = false
  showOnlyDietary.value = 'all'
}

// Category Icon Generator (returns lovely SVG paths or emojis)
function getCategoryEmoji(catId: string): string {
  const lowercaseId = catId.toLowerCase()
  if (lowercaseId.includes('beverage') || lowercaseId.includes('coffee') || lowercaseId.includes('drink')) {
    return '☕'
  }
  if (lowercaseId.includes('food') || lowercaseId.includes('lunch') || lowercaseId.includes('dinner')) {
    return '🍔'
  }
  if (lowercaseId.includes('pastry') || lowercaseId.includes('bakery') || lowercaseId.includes('dessert')) {
    return '🥐'
  }
  return '🍽️'
}

function getDietaryBadgeClass(diet: string): string {
  switch (diet.toLowerCase()) {
    case 'vegan':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'vegetarian':
      return 'bg-green-50 text-green-700 border-green-200'
    case 'gluten-free':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200'
  }
}
</script>

<template>
  <div class="space-y-6" id="menu-display-container">
    <!-- Header Controls & Search Panel -->
    <div class="bg-white rounded-xl border border-slate-100 p-6 shadow-xs">
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        <!-- Search -->
        <div class="relative lg:col-span-5">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search cafe items (e.g. Latte, Croissant...)"
            class="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-950 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            id="menu-search-input"
          />
        </div>

        <!-- Sort By -->
        <div class="lg:col-span-3">
          <select
            v-model="sortBy"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            id="menu-sort-select"
          >
            <option value="default">Default Sort Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="name-asc">Name: A to Z</option>
          </select>
        </div>

        <!-- Dietary Filters -->
        <div class="lg:col-span-2">
          <select
            v-model="showOnlyDietary"
            class="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            id="menu-dietary-select"
          >
            <option value="all">All Dietary Types</option>
            <option value="vegetarian">Vegetarian</option>
            <option value="vegan">Vegan</option>
            <option value="gluten-free">Gluten Free</option>
          </select>
        </div>

        <!-- Quick Toggles -->
        <div class="lg:col-span-2 flex items-center justify-end">
          <label class="flex items-center space-x-2 cursor-pointer select-none">
            <input
              type="checkbox"
              v-model="showOnlyAvailable"
              class="rounded text-indigo-600 focus:ring-indigo-500 h-4 w-4"
              id="menu-available-toggle"
            />
            <span class="text-sm font-medium text-slate-700">In Stock Only</span>
          </label>
        </div>
      </div>

      <!-- Category Filter Tabs (Pills) -->
      <div class="mt-6 pt-5 border-t border-slate-100 flex flex-wrap gap-2">
        <button
          @click="selectedCategory = 'all'"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-150',
            selectedCategory === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          ]"
          id="cat-tab-all"
        >
          All Items
        </button>
        <button
          v-for="cat in categories"
          :key="cat.id"
          @click="selectedCategory = cat.id"
          :class="[
            'px-4 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-150 flex items-center space-x-1.5',
            selectedCategory === cat.id
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
          ]"
          :id="`cat-tab-${cat.id}`"
        >
          <span>{{ getCategoryEmoji(cat.id) }}</span>
          <span>{{ cat.name }}</span>
        </button>
      </div>
    </div>

    <!-- Loading Skeletons -->
    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      <div v-for="n in 8" :key="n" class="bg-white border rounded-xl p-4 space-y-4 animate-pulse">
        <div class="w-full h-40 bg-slate-100 rounded-lg"></div>
        <div class="h-4 bg-slate-200 rounded-sm w-2/3"></div>
        <div class="h-3 bg-slate-100 rounded-sm w-5/6"></div>
        <div class="flex justify-between items-center pt-2">
          <div class="h-5 bg-slate-200 rounded-sm w-1/4"></div>
          <div class="h-6 bg-slate-100 rounded-lg w-1/3"></div>
        </div>
      </div>
    </div>

    <!-- No Items Found State -->
    <div v-else-if="filteredItems.length === 0" class="text-center py-16 bg-white border border-slate-100 rounded-xl">
      <div class="text-5xl mb-4">🔍</div>
      <h3 class="text-lg font-bold text-slate-800">No Cafe Items Found</h3>
      <p class="text-sm text-slate-500 mt-1 max-w-md mx-auto">
        We couldn't find any cafe items matching your current filters. Try relaxing your filters or search term.
      </p>
      <Button @click="resetFilters" class="mt-5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-5 py-2.5">
        Reset All Filters
      </Button>
    </div>

    <!-- Items Grid Display -->
    <div v-else class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6" id="menu-items-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="group relative bg-white border border-slate-150 rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 flex flex-col"
        :id="`menu-item-card-${item.id}`"
      >
        <!-- Product Visual Header -->
        <div class="relative h-44 bg-slate-50 flex items-center justify-center overflow-hidden">
          <img
            v-if="item.imageUrl"
            :src="item.imageUrl"
            :alt="item.name"
            class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <!-- Decorative SVG Placeholder with Coffee/Pastry Themes -->
          <div v-else class="w-full h-full bg-gradient-to-br from-indigo-50/75 via-sky-50/50 to-slate-100 flex flex-col items-center justify-center relative p-4">
            <span class="text-5xl group-hover:scale-110 transition-transform duration-300">{{ getCategoryEmoji(item.categoryId) }}</span>
            <span class="text-[10px] text-indigo-600 font-bold tracking-widest uppercase mt-3 bg-indigo-50 px-2 py-0.5 rounded-full">
              {{ item.categoryName }}
            </span>
          </div>

          <!-- Top Badge Bar -->
          <div class="absolute top-3 left-3 right-3 flex flex-wrap gap-1">
            <span v-if="item.isPopular" class="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-xs">
              🔥 Best Seller
            </span>
            <span v-if="item.isNew" class="bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-xs">
              ⭐ New
            </span>
            <span v-if="item.originalPrice" class="bg-rose-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-xs">
              % Sale
            </span>
          </div>

          <!-- Out of stock badge/overlay -->
          <div v-if="!item.isAvailable" class="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
            <span class="bg-rose-600 text-white text-[10px] font-extrabold uppercase tracking-widest px-3 py-1.5 rounded-lg shadow-md border border-rose-500">
              🚫 Out of Stock
            </span>
          </div>
        </div>

        <!-- Body Content -->
        <div class="p-5 flex-1 flex flex-col justify-between">
          <div class="space-y-2">
            <!-- Dietary Tags -->
            <div class="flex flex-wrap gap-1">
              <span
                v-for="diet in item.dietary || []"
                :key="diet"
                :class="['text-[9px] font-semibold tracking-wide uppercase px-2 py-0.5 border rounded-full', getDietaryBadgeClass(diet)]"
              >
                {{ diet }}
              </span>
            </div>

            <!-- Item Name -->
            <h4 class="text-base font-bold text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors">
              {{ item.name }}
            </h4>

            <!-- Description -->
            <p class="text-xs text-slate-500 line-clamp-2 min-h-[2rem]">
              {{ item.description || 'Our special house recipe, hand-crafted using locally sourced, premium cafe ingredients.' }}
            </p>

            <!-- Metrics: Calories & PrepTime -->
            <div class="flex items-center space-x-3 text-[11px] font-medium text-slate-400 pt-1">
              <span v-if="item.calories" class="flex items-center">
                <span class="mr-1">🔥</span> {{ item.calories }} kcal
              </span>
              <span v-if="item.prepTime" class="flex items-center">
                <span class="mr-1">⏱️</span> {{ item.prepTime }} min
              </span>
            </div>
          </div>

          <!-- Footer Price and Status -->
          <div class="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between">
            <div class="flex items-baseline space-x-1.5">
              <span class="text-lg font-black text-indigo-600">${{ item.price.toFixed(2) }}</span>
              <span v-if="item.originalPrice" class="text-xs font-medium text-slate-400 line-through">
                ${{ item.originalPrice.toFixed(2) }}
              </span>
            </div>
            
            <div class="flex items-center">
              <span v-if="item.isAvailable" class="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span> Available
              </span>
              <span v-else class="text-[10px] font-bold text-rose-500 bg-rose-50 border border-rose-100 px-2 py-1 rounded-md">
                Unavailable
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
