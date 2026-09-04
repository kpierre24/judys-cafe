<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import BranchSelector from '@/components/auth/BranchSelector.vue'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const error = ref('')
const isLoading = ref(false)
const showBranchSelector = ref(false)

async function handleLogin() {
  if (!username.value || !password.value) {
    error.value = 'Please enter both username and password'
    return
  }

  isLoading.value = true
  error.value = ''

  try {
    const result = authStore.login({
      username: username.value,
      password: password.value,
    })

    if (result.success) {
      if (authStore.requiresBranchSelection) {
        showBranchSelector.value = true
      } else {
        router.push('/')
      }
    } else {
      error.value = result.error || 'Login failed'
    }
  } catch {
    error.value = 'An error occurred during login'
  } finally {
    isLoading.value = false
  }
}

function handleBranchSelection() {
  showBranchSelector.value = false
  router.push('/')
}

function fillCredentials(u: string, p: string) {
  username.value = u
  password.value = p
  handleLogin()
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-stone-100 relative overflow-hidden font-sans p-4">
    <!-- Ambient Coffee Roastery Backdrop -->
    <div class="absolute inset-0 bg-radial from-amber-200/30 via-stone-100/60 to-stone-200 pointer-events-none"></div>

    <div class="max-w-md w-full space-y-6 z-10">
      <!-- Branding Crest -->
      <div class="text-center space-y-2">
        <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-stone-900 text-white text-2xl shadow-xl shadow-stone-900/10 border border-stone-800">
          ☕
        </div>
        <h1 class="text-3xl font-black tracking-tight text-stone-900 font-serif">
          Judy's Cafe
        </h1>
        <p class="text-xs font-semibold text-amber-800 uppercase tracking-widest">
          Artisanal POS & Operations Suite
        </p>
      </div>

      <!-- Login Card -->
      <div class="bg-white p-7 rounded-2xl shadow-xl shadow-stone-200/70 border border-stone-200/80">
        <form @submit.prevent="handleLogin" class="space-y-4">
          <div class="space-y-3">
            <div>
              <label for="username" class="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Staff ID or Username
              </label>
              <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="e.g. admin, manager, cashier"
                class="mt-1 bg-stone-50 border-stone-200 focus:bg-white text-sm"
                required
              />
            </div>

            <div>
              <label for="password" class="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                Passcode / PIN
              </label>
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="••••••••"
                class="mt-1 bg-stone-50 border-stone-200 focus:bg-white text-sm font-mono"
                required
              />
            </div>
          </div>

          <div v-if="error" class="text-rose-600 text-xs font-semibold text-center bg-rose-50 p-2 rounded-lg border border-rose-200">
            {{ error }}
          </div>

          <Button type="submit" class="w-full bg-amber-700 hover:bg-amber-800 text-white font-semibold py-2.5 rounded-xl transition-all shadow-xs" :disabled="isLoading">
            {{ isLoading ? 'Authenticating Staff...' : 'Sign In to Register' }}
          </Button>
        </form>

        <!-- Fast 1-Click Role Switchers -->
        <div class="mt-6 pt-5 border-t border-stone-100">
          <p class="text-center text-xs font-bold text-stone-500 uppercase tracking-wider mb-2.5">
            Quick 1-Click Demo Profiles
          </p>
          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="fillCredentials('admin', 'admin123')"
              class="p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/80 hover:bg-amber-50 text-left transition-all cursor-pointer group"
            >
              <span class="block text-sm">👑</span>
              <p class="text-[11px] font-bold text-stone-800 group-hover:text-amber-900 mt-0.5">Admin</p>
              <span class="text-[9px] text-stone-400">All access</span>
            </button>

            <button
              type="button"
              @click="fillCredentials('manager', 'manager123')"
              class="p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/80 hover:bg-amber-50 text-left transition-all cursor-pointer group"
            >
              <span class="block text-sm">🏪</span>
              <p class="text-[11px] font-bold text-stone-800 group-hover:text-amber-900 mt-0.5">Manager</p>
              <span class="text-[9px] text-stone-400">Store ops</span>
            </button>

            <button
              type="button"
              @click="fillCredentials('cashier', 'cashier123')"
              class="p-2.5 rounded-xl border border-stone-200 hover:border-amber-400 bg-stone-50/80 hover:bg-amber-50 text-left transition-all cursor-pointer group"
            >
              <span class="block text-sm">☕</span>
              <p class="text-[11px] font-bold text-stone-800 group-hover:text-amber-900 mt-0.5">Barista</p>
              <span class="text-[9px] text-stone-400">POS & KDS</span>
            </button>
          </div>
        </div>
      </div>

      <div class="text-center text-stone-400 text-xs">
        <p>Judy's Cafe & Roastery • System v3.2.0 • Cloud Sync Active</p>
      </div>
    </div>

    <!-- Branch Selector Modal -->
    <BranchSelector
      v-if="showBranchSelector"
      :is-initial-selection="true"
      @confirm="handleBranchSelection"
    />
  </div>
</template>
