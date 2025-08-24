<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
  type?: string
  placeholder?: string
  modelValue?: string | number
  min?: string | number
  max?: string | number
  step?: string | number
}

defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string | number): void
}>()

function handleInput(event: Event) {
  const target = event.target as HTMLInputElement
  const value = target.value

  // If it's a number input, emit as number, otherwise as string
  if (target.type === 'number' && value !== '') {
    emit('update:modelValue', Number(value))
  } else {
    emit('update:modelValue', value)
  }
}
</script>

<template>
  <input
    :class="
      cn(
        'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        $props.class,
      )
    "
    :type="type || 'text'"
    :placeholder="placeholder"
    :value="modelValue"
    :min="min"
    :max="max"
    :step="step"
    @input="handleInput"
  />
</template>
