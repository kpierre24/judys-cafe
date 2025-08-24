<script setup lang="ts">
import { inject, type HTMLAttributes, type Ref } from 'vue'
import { cn } from '@/lib/utils'

interface Props {
  class?: HTMLAttributes['class']
}

const props = defineProps<Props>()

const isOpen = inject<Ref<boolean>>('isOpen')
const closeDialog = inject<() => void>('closeDialog')

function handleBackdropClick() {
  if (closeDialog) {
    closeDialog()
  }
}

function handleContentClick(event: MouseEvent) {
  event.stopPropagation()
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen?.value"
      class="fixed inset-0 z-50 flex items-center justify-center"
      @click="handleBackdropClick"
    >
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-black/50" />

      <!-- Dialog Content -->
      <div
        :class="
          cn(
            'relative z-50 grid w-full max-w-lg gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg',
            props.class,
          )
        "
        @click="handleContentClick"
      >
        <slot />
      </div>
    </div>
  </Teleport>
</template>
