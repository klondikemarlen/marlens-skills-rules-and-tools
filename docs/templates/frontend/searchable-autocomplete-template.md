# Searchable Autocomplete Template

Use this when a Vue 3 + Vuetify form or filter needs a remote reference lookup without loading an entire table into the browser.

## Placeholders

- `{ResourceName}` / `{ResourceNames}`: PascalCase singular/plural.
- `{resourceName}` / `{resourceNames}`: camelCase singular/plural.
- `{resource-names}`: kebab-case path segment.
- `{ResourceNamesApi}`: typed API object.
- `{ResourceNameAsReference}`: serializer-aligned reference type.
- `{labelField}`: display field, such as `name`.

## Template

```vue
<template>
  <v-autocomplete
    v-model="selectedValue"
    :items="items"
    :loading="isLoading"
    :search="searchQuery"
    item-title="{labelField}"
    item-value="id"
    label="Select {ResourceName}"
    clearable
    return-object
    :no-data-text="isLoading ? 'Loading...' : 'No {resourceNames} found'"
    @update:search="handleSearch"
    @update:model-value="handleSelection"
  />
</template>

<script setup lang="ts">
import { ref, watch } from "vue"
import { debounce } from "lodash"

import {ResourceNamesApi}, { type {ResourceNameAsReference} } from "@/api/{resource-names}-api"

const props = withDefaults(defineProps<{
  modelValue?: {ResourceNameAsReference} | null
  disabled?: boolean
}>(), {
  disabled: false,
})

const emit = defineEmits<{
  "update:modelValue": [{ResourceNameAsReference} | null]
  selection: [{ResourceNameAsReference} | null]
}>()

const items = ref<{ResourceNameAsReference}[]>([])
const isLoading = ref(false)
const searchQuery = ref("")
const selectedValue = ref<{ResourceNameAsReference} | null>(props.modelValue ?? null)

const debouncedSearch = debounce(async (query: string) => {
  if (!query.trim()) {
    items.value = []
    return
  }

  isLoading.value = true
  try {
    const response = await {ResourceNamesApi}.reference({ search: query, perPage: 50 })
    items.value = response.{resourceNames}
  } finally {
    isLoading.value = false
  }
}, 300)

function handleSearch(query: string) {
  searchQuery.value = query
  debouncedSearch(query)
}

function handleSelection(value: {ResourceNameAsReference} | null) {
  selectedValue.value = value
  emit("update:modelValue", value)
  emit("selection", value)
}

watch(() => props.modelValue, (value) => {
  selectedValue.value = value ?? null
})
</script>
```

## Verification Checklist

- [ ] Search is debounced and skips blank queries.
- [ ] Loading and no-data states are visible.
- [ ] The selected object emits both `update:modelValue` and a semantic `selection` event when the project uses one.
- [ ] Reference results use a backend reference serializer instead of full show payloads.
- [ ] Parent filters reset pagination or dependent state when the selection changes.
