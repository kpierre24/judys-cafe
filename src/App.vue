<script setup lang="ts">
import { onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useAuthStore } from './stores/auth'
import AppLayout from './components/layout/AppLayout.vue'

const route = useRoute()
const authStore = useAuthStore()

onMounted(() => {
  authStore.initFromStorage()
})
</script>

<template>
  <div id="app">
    <AppLayout v-if="authStore.isAuthenticated && route.path !== '/login'" />
    <router-view v-else />
  </div>
</template>

<style scoped>
#app {
  min-height: 100vh;
}
</style>
