<script setup lang="ts">
import { provide, ref, watch, type Ref } from 'vue'

interface Props {
  defaultValue?: string
  modelValue?: string
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const activeTab: Ref<string> = ref(props.defaultValue || props.modelValue || '')

// Watch for external changes to modelValue
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue !== undefined) {
      activeTab.value = newValue
    }
  },
  { immediate: true },
)

function setActiveTab(value: string) {
  activeTab.value = value
  emit('update:modelValue', value)
}

provide('activeTab', activeTab)
provide('setActiveTab', setActiveTab)
</script>

<template>
  <div class="tabs">
    <slot />
  </div>
</template>
