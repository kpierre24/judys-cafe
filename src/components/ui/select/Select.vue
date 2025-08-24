<script setup lang="ts">
import { provide, ref, watch, type Ref } from 'vue'

interface Props {
  modelValue?: string
  defaultValue?: string
  disabled?: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const selectedValue: Ref<string> = ref(props.defaultValue || props.modelValue || '')
const isOpen = ref(false)

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined) {
      selectedValue.value = newValue
    }
  },
  { immediate: true },
)

function selectValue(value: string) {
  selectedValue.value = value
  isOpen.value = false
  emit('update:modelValue', value)
}

function toggleOpen() {
  if (!props.disabled) {
    isOpen.value = !isOpen.value
  }
}

provide('selectedValue', selectedValue)
provide('isOpen', isOpen)
provide('selectValue', selectValue)
provide('toggleOpen', toggleOpen)
</script>

<template>
  <div class="relative">
    <slot />
  </div>
</template>
