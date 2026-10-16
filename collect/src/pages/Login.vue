<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center" :class="settings.theme.front.bg">
        <div class="column"
          :style="$q.screen.lt.sm ? { 'width': '80%' } : $q.screen.lt.md ? { 'width': '50%' } : { 'width': '30%' }">
          <div class="col">
            <banner />
          </div>
          <div class="col">
            <q-card :class="settings.theme.front.card">
              <q-card-section>
                <div class="text-center q-pt-sm">
                  <div class="col text-subtitle">
                    {{ $t('login.title') }}
                  </div>
                </div>
              </q-card-section>
              <q-card-section v-if="!withToken">
                <q-form @submit="onSubmit" class="q-gutter-md">
                  <q-input autofocus v-model="email" :label="$t('email')" lazy-rules>
                    <template v-slot:prepend>
                      <q-icon name="fas fa-envelope" size="xs" />
                    </template>
                  </q-input>

                  <q-input :type="showPassword ? 'text' : 'password'" v-model="password"
                    :label="$t('password')" lazy-rules>
                    <template v-slot:prepend>
                      <q-icon name="fas fa-lock" size="xs" />
                    </template>
                    <template v-slot:append>
                      <q-btn round dense flat :icon="showPassword ? 'visibility_off' : 'visibility'"
                        @click="showPassword = !showPassword" />
                    </template>
                  </q-input>

                  <div>
                    <q-btn :label="$t('login.submit')" type="submit" color="primary" :disable="disableSubmit" />
                    <q-btn v-if="settings.register_enabled" :label="$t('login.register')" flat to="/register" stretch
                      class="text-bold q-ml-md" />
                  </div>
                </q-form>
              </q-card-section>
              <q-card-section v-if="secret">
                <div class="col text-subtitle">
                  {{ $t('login.totp') }}
                </div>
                <div class="text-center q-mt-md">
                  <img :src="qr" />
                </div>
                <div class="col text-subtitle q-mt-md">
                  {{ $t('login.totp_secret') }}
                </div>
                <q-input dense v-model="secret" readonly>
                  <template v-slot:after>
                    <q-btn round dense flat icon="content_copy" @click="onCopySecret" />
                  </template>
                </q-input>
                <div class="col text-subtitle q-mt-md">
                  {{ $t('login.email_otp') }}
                </div>
                <div class="q-mt-md">
                  <q-btn :label="$t('login.send_email_token')" @click="onEmailToken" color="info" stretch
                    class="text-bold" />
                </div>
              </q-card-section>
              <q-card-section v-if="withToken">
                <q-form @submit="onSubmit" class="q-gutter-md">
                  <q-input autofocus type="number" v-model="token" :label="$t('login.token')"
                    lazy-rules class="no-spinner">
                    <template v-slot:prepend>
                      <q-icon name="fas fa-mobile" size="xs" />
                    </template>
                  </q-input>
                  <div>
                    <q-btn :label="$t('login.validate')" type="submit" color="primary" :disable="disableValidate" />
                    <q-btn :label="$t('cancel')" @click="onCancelToken" flat stretch class="text-bold q-ml-md" />
                  </div>
                </q-form>
              </q-card-section>
              <q-card-section v-if="authProviders.length > 0" class="text-center q-pt-none">
                <div class="text-subtitle q-mb-md">{{ t('login.continue_with') }}</div>
                <template v-for="provider in authProviders" :key="provider">
                  <q-btn :label="t(provider)" no-caps :href="`${baseURL}/oauth/${provider}?redirect=/login`" color="dark" class="q-mr-md">
                  </q-btn>
                </template>
              </q-card-section>
              <q-card-section>
                <q-btn flat to="/forgot-password" dense no-caps class="text-bold">
                  {{ $t('login.forgot_password') }}
                </q-btn>
                <q-btn-dropdown v-show="hasLocales" flat :label="locale.toUpperCase()" :title="$t('locales.' + locale)" class="float-right">
                  <q-list>
                    <q-item clickable v-close-popup @click="onLocaleSelection(localeOpt)"
                      v-for="localeOpt in localeOptions" :key="localeOpt.value">
                      <q-item-section>
                        <q-item-label :title="localeOpt.label" class="text-bold text-uppercase">{{ localeOpt.value }}</q-item-label>
                      </q-item-section>
                      <q-item-section avatar v-if="locale === localeOpt.value">
                        <q-icon color="primary" name="check" />
                      </q-item-section>
                    </q-item>
                  </q-list>
                </q-btn-dropdown>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { ref, watch, computed, onMounted } from 'vue'
import { Notify, useQuasar, copyToClipboard } from 'quasar'
import { useRouter } from 'vue-router'
import { locales } from '../boot/i18n'
import { settings } from '../boot/settings'
import { baseURL } from '../boot/axios'
import { useAuthStore } from '../stores/auth'
import { useRecordStore } from '../stores/record'
import { storeToRefs } from 'pinia'

// Import Quasar language files statically
import langEnUS from 'quasar/lang/en-US'
import langFr from 'quasar/lang/fr'

import Banner from '@/components/Banner.vue'

// Map locale codes to Quasar language objects
const quasarLangMap = {
  en: langEnUS,
  fr: langFr
}

const $q = useQuasar()
const router = useRouter()
const { locale, t } = useI18n({ useScope: 'global' })
const authStore = useAuthStore()
const recordStore = useRecordStore()

const { user } = storeToRefs(authStore)

const email = ref('')
const password = ref('')
const token = ref('')
const secret = ref('')
const qr = ref('')
const withToken = ref(false)
const method = ref('')
const showPassword = ref(false)
const authProviders = ref([])

// Watch locale changes to update Quasar language
watch(locale, val => {
  // Set Quasar language based on locale
  const lang = quasarLangMap[val] || quasarLangMap.en
  $q.lang.set(lang)
})

// Watch user changes to redirect after login
watch(user, (newUser) => {
  if (newUser !== null) {
    router.push('/')
  }
  showPassword.value = false
})

// Computed properties
const disableSubmit = computed(() => {
  return email.value.length === 0 || password.value.length === 0
})

const disableValidate = computed(() => {
  return token.value.length < 6
})

const localeOptions = computed(() => {
  return locales.map(loc => {
    return {
      value: loc,
      label: t('locales.' + loc)
    }
  })
})

const hasLocales = computed(() => {
  return locales.length > 1
})

onMounted(async () => {
  const hash = new URLSearchParams(window.location.hash.substring(1))
  const oauthToken = hash.get('access_token')
  const oauthError = hash.get('error')

  if (oauthToken || oauthError) {
    window.history.replaceState(null, '', window.location.pathname)
  }

  if (oauthToken) {
    try {
      await authStore.authenticate({ strategy: 'jwt', accessToken: oauthToken })
      return // watcher on authStore.user will redirect to '/'
    } catch (err) {
      Notify.create({ message: t('login.failed'), color: 'negative' })
    }
  } else if (oauthError) {
    Notify.create({ message: t('login.failed'), color: 'negative' })
  }
  authStore.getOAuthProviders().then(resp => {
    authProviders.value = resp.providers || []
  })
})

// Methods
const onLocaleSelection = (opt) => {
  locale.value = opt.value
}

const makePayload = () => {
  const payload = {
    strategy: 'local',
    email: email.value,
    password: password.value,
    method: method.value || undefined
  }
  if (token.value) {
    payload.token = token.value
  }
  if (!method.value && secret.value) {
    payload.secret = secret.value
  }
  return payload
}

const onCopySecret = () => {
  copyToClipboard(secret.value).then(() => {
    Notify.create({
      message: t('login.secret_copied'),
      color: 'positive'
    })
  })
}

const onSubmit = () => {
  authStore
    .authenticate(makePayload())
    .then(response => {
      if (response.data && response.data.qr && response.data.secret) {
        // 2FA is enabled for that user
        qr.value = response.data.qr
        secret.value = response.data.secret
        withToken.value = true
      } else {
        recordStore.initUser(user.value)
      }
    })
    // Just use the returned error instead of mapping it from the store.
    .catch(err => {
      // Convert the error to a plain object and add a message.
      const type = err.className
      err = Object.assign({}, err)
      if (type === 'bad-request' && err.message === 'Token required.') {
        withToken.value = true
      } else if (type === 'bad-request' && err.message === 'Invalid token.') {
        Notify.create({
          message: t('login.failed_token'),
          color: 'negative'
        })
        token.value = ''
      } else {
        Notify.create({
          message: t('login.failed'),
          color: 'negative'
        })
      }
    })
}

const onEmailToken = () => {
  method.value = 'otp'
  onSubmit()
}

const onCancelToken = () => {
  secret.value = ''
  qr.value = ''
  withToken.value = ''
  token.value = ''
  password.value = ''
  method.value = ''
}
</script>
