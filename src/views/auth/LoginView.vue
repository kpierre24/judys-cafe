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
      // Check if branch selection is needed
      if (authStore.requiresBranchSelection) {
        showBranchSelector.value = true
      } else {
        // User has only one branch or branch already selected
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
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">Judy's Cafe</h2>
        <p class="mt-2 text-center text-sm text-gray-600">Sign in to your account</p>
      </div>

      <div class="mt-8 space-y-6 bg-white p-8 rounded-lg shadow">
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div class="space-y-4">
            <div>
              <label for="username" class="block text-sm font-medium text-gray-700">
                Username
              </label>
              <Input
                id="username"
                v-model="username"
                type="text"
                placeholder="Enter your username"
                class="mt-1"
                required
              />
            </div>

            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <Input
                id="password"
                v-model="password"
                type="password"
                placeholder="Enter your password"
                class="mt-1"
                required
              />
            </div>
          </div>

          <div v-if="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>

          <Button type="submit" class="w-full" :disabled="isLoading">
            {{ isLoading ? 'Signing in...' : 'Sign in' }}
          </Button>
        </form>

        <div class="mt-6 text-sm text-gray-600">
          <p class="text-center font-medium">Demo Credentials:</p>
          <div class="mt-2 space-y-1 text-xs">
            <p><strong>Admin:</strong> admin / admin123 (Access to all branches)</p>
            <p><strong>Manager:</strong> manager / manager123 (Multiple branches)</p>
            <p><strong>Cashier:</strong> cashier / cashier123 (Single branch)</p>
          </div>
        </div>
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
