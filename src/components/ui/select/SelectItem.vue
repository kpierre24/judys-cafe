<script setup lang="ts">
import { inject, type HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  value: string
  disabled?: boolean
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const selectValue = inject<(value: string) => void>('selectValue')

function handleClick() {
  if (!props.disabled && selectValue) {
    selectValue(props.value)
  }
}
</script>

<template>
  <div
    :class="
      cn(
        'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        props.disabled
          ? 'pointer-events-none opacity-50'
          : 'hover:bg-accent hover:text-accent-foreground',
        props.class,
      )
    "
    @click="handleClick"
  >
    <slot />
  </div>
</template>
