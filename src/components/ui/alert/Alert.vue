<script setup lang="ts">
import { type HTMLAttributes } from 'vue'
import { type AlertVariants, alertVariants } from './index'
import { cn } from '@/lib/utils'

interface Props {
  variant?: AlertVariants['variant']
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
})
</script>

<template>
  <div :class="cn(alertVariants({ variant: props.variant }), props.class)">
    <slot />
  </div>
</template>
