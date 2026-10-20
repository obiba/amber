<template>
  <q-layout :class="settings.theme.front.bg" v-cloak>
    <q-page-container>
      <q-page class="flex flex-center">
        <q-card class="bg-transparent no-border no-shadow">
          <div class="row q-col-gutter-lg">
            <q-circular-progress
              indeterminate
              size="100px"
              :thickness="0.22"
              color="lime"
              track-color="grey"
              class="q-ma-xl"
            />
          </div>
          <div class="row full-width">
            <div class="col-lg-12 col-md-12 cl-sm-12 col-xs-12">
              <div>
                <div class="text-h3 text-center">
                  {{t('loading.title')}}
                </div>
                <div class="text-h6 text-center">
                  {{t('loading.caption')}}
                </div>
              </div>
            </div>
          </div>
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { LocalStorage } from 'quasar'
import { settings } from '../boot/settings'
import { useAuthStore } from '../stores/auth'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// Token could be not expired but also still not valid, then reauth.
// Done here (not in the router guard) so that landing directly on /loading
// (page refresh, history back) does not leave the app stuck.
onMounted(() => {
  authStore.reAuthenticate().then(() => {
    router.replace(route.query.redirect || '/')
  }).catch(() => {
    // Remove expired/unusable token
    LocalStorage.remove('feathers-jwt')
    router.replace('/login')
  })
})
</script>

<style>
[v-cloak] {
  display: none !important;
}
</style>
