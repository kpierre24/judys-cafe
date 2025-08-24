<script setup lang="ts">
import { inject, type HTMLAttributes, type Ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  placeholder?: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const selectedValue = inject<Ref<string>>('selectedValue')
const toggleOpen = inject<() => void>('toggleOpen')

function handleClick() {
  if (!props.disabled && toggleOpen) {
    toggleOpen()
  }
}
</script>

<template>
  <button
    type="button"
    :disabled="props.disabled"
    :class="
      cn(
        'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        props.class,
      )
    "
    @click="handleClick"
  >
    <span v-if="selectedValue" class="block truncate">
      <slot name="value" :value="selectedValue">{{ selectedValue }}</slot>
    </span>
    <span v-else class="text-muted-foreground">{{ props.placeholder || 'Select...' }}</span>
    <svg
      class="h-4 w-4 opacity-50"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      stroke-width="1.5"
      stroke="currentColor"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
      />
    </svg>
  </button>
</template>
