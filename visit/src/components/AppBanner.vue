<template>
  <div>
    <div class="col text-center q-mb-md">
      <img :src="settings.theme.logo || amberMark" :class="settings.theme.logo ? '' : 'banner-mark'" alt="" />
    </div>
    <div class="col text-center q-mb-lg">
      <div v-if="$t('login.brand')" class="text-h6">
        {{ $t("login.brand") }}
      </div>
      <div v-if="$t('login.brand_caption')" class="text-subtitle1">
        {{ $t("login.brand_caption") }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { settings as _settings } from '../boot/settings'
const settings = _settings as Record<string, any>
import amberMark from '../assets/amber-mark-negative.svg'
</script>
