<template>
    <div>
        <div class="col text-center q-mb-md">
            <img :src="settings.theme.logo || amberMark" :class="settings.theme.logo ? '' : 'banner-mark'" alt="" />
        </div>
        <div class="col text-center q-mb-lg">
            <div class="text-h1">
                {{$t('main.brand')}}
            </div>
            <div v-if="$t('main.brand_caption')" class="text-subtitle1">
                {{$t('main.brand_caption')}}
            </div>
        </div>
    </div>
</template>

<script>
import { settings } from '../boot/settings'
import { defineComponent } from 'vue'
import amberMark from '../assets/amber-mark-negative.svg'

export default defineComponent({
  name: 'AppBanner',
  setup () {
    return {
      settings,
      amberMark
    }
  }
})
</script>
