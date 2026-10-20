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
              color="white"
              track-color="secondary"
              class="q-ma-xl"
            />
          </div>
          <div class="row full-width">
            <div class="col-lg-12 col-md-12 cl-sm-12 col-xs-12">
              <div>
                <div class="text-h3 text-center">
                  {{$t('loading.title')}}
                </div>
                <div class="text-h6 text-center">
                  {{$t('loading.caption')}}
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
import { useRoute, useRouter } from 'vue-router'
import { LocalStorage } from 'quasar'
import { settings } from '../boot/settings'
import { feathersClient } from '../boot/feathersClient'
import { useAuthStore } from '../stores/auth'
import { useRecordStore } from '../stores/record'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const recordStore = useRecordStore()

// Token could be not expired but also still not valid, then reauth.
// Done here (not in the router guard) so that landing directly on /loading
// (page refresh, history back) does not leave the app stuck.
onMounted(() => {
  feathersClient.reAuthenticate().then((response) => {
    authStore.responseHandler(response)
    // update user identity associated to records
    recordStore.initUser(response.user)
    router.replace(route.query.redirect || '/')
  }).catch((err) => {
    console.error(err)
    if (err.response) {
      // remove expired/unusable token
      LocalStorage.remove('feathers-jwt')
    }
    router.replace('/login')
  })
})
</script>

<style>
[v-cloak] {
  display: none !important;
}
</style>
