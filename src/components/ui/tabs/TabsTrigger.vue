<script setup lang="ts">
import { inject, computed, type HTMLAttributes, type Ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const activeTab = inject<Ref<string>>('activeTab')
const setActiveTab = inject<(value: string) => void>('setActiveTab')

const isActive = computed(() => activeTab?.value === props.value)

function handleClick() {
  if (!props.disabled && setActiveTab) {
    setActiveTab(props.value)
  }
}
</script>

<template>
  <button
    :class="
      cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        isActive
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        props.class,
      )
    "
    :disabled="props.disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>
