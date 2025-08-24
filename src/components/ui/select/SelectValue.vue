<script setup lang="ts">
import { inject, computed, type HTMLAttributes, type Ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  placeholder?: string
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const selectedValue = inject<Ref<string>>('selectedValue')

const displayValue = computed(() => {
  return selectedValue?.value || props.placeholder || 'Select...'
})
</script>

<template>
  <span :class="cn('block truncate', props.class)">
    <slot :value="selectedValue">{{ displayValue }}</slot>
  </span>
</template>
