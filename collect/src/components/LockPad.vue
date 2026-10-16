<template>
  <div>
    <div class="row q-mb-lg">
      <div class="col" v-for="num in nums1" :key="num">
        <q-btn
          class="q-ml-xs"
          round
          dense
          color="primary"
          size="lg"
          :label="num"
          @click="onAppend(num)"
        />
      </div>
    </div>
    <div class="row q-mb-lg">
      <div class="col" v-for="num in nums2" :key="num">
        <q-btn
          class="q-ml-xs"
          round
          dense
          color="primary"
          size="lg"
          :label="num"
          @click="onAppend(num)"
        />
      </div>
    </div>
    <div class="row q-mb-lg">
      <div class="col" v-for="num in nums3" :key="num">
        <q-btn
          class="q-ml-xs"
          round
          dense
          color="primary"
          size="lg"
          :label="num"
          @click="onAppend(num)"
        />
      </div>
    </div>
    <div class="row q-mb-lg">
      <div class="col">
        <q-btn
          class="q-ml-xs bg-secondary"
          round
          dense
          color="primary"
          size="lg"
          icon="clear"
          @click="onClear"
        />
      </div>
      <div class="col" v-for="num in nums4" :key="num">
        <q-btn
          class="q-ml-xs"
          round
          dense
          color="primary"
          size="lg"
          :label="num"
          @click="onAppend(num)"
        />
      </div>
      <div class="col">
        <q-btn
          class="q-ml-xs bg-blue-5"
          round
          dense
          color="primary"
          size="lg"
          icon="chevron_left"
          @click="onErase"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { settings } from '../boot/settings'

const props = defineProps({
  modelValue: {
    type: [String, Number],
    default: ''
  }
})

const emit = defineEmits(['update:modelValue'])

function shuffleArray (arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const numArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
const nums = settings.lock && settings.lock.shuffle ? shuffleArray(numArray) : numArray

const nums1 = nums.slice(0, 3)
const nums2 = nums.slice(3, 6)
const nums3 = nums.slice(6, 9)
const nums4 = nums.slice(9, 10)

const value = computed({
  get () {
    return props.modelValue
  },
  set (val) {
    emit('update:modelValue', val)
  }
})

function onAppend (val) {
  const nval = value.value ? value.value + '' + val : val + ''
  value.value = nval
}

function onErase () {
  if (value.value && (value.value + '').length > 0) {
    value.value = (value.value + '').substring(0, (value.value + '').length - 1)
  }
}

function onClear () {
  value.value = ''
}
</script>
