<script setup lang="ts">
import { provide, ref, watch, type Ref } from 'vue'

interface Props {
  open?: boolean
  defaultOpen?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const isOpen: Ref<boolean> = ref(props.defaultOpen || props.open || false)

// Watch for external changes to open prop
watch(
  () => props.open,
  (newValue) => {
    if (newValue !== undefined) {
      isOpen.value = newValue
    }
  },
  { immediate: true },
)

function closeDialog() {
  isOpen.value = false
  emit('update:open', false)
}

function openDialog() {
  isOpen.value = true
  emit('update:open', true)
}

provide('isOpen', isOpen)
provide('closeDialog', closeDialog)
provide('openDialog', openDialog)
</script>

<template>
  <div>
    <slot />
  </div>
</template>
