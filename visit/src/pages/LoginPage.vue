<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center" :class="settings.theme.front.bg">
        <div class="column" :style="$q.screen.lt.sm
          ? { width: '80%' }
          : $q.screen.lt.md
            ? { width: '50%' }
            : { width: '30%' }
          ">
          <div class="col">
            <app-banner />
          </div>
          <div v-if="!showForm" class="col text-center q-mt-md">
            <q-spinner color="primary" size="4em" :thickness="10" />
          </div>
          <div v-show="showForm" class="col">
            <q-card :class="settings.theme.front.card">
              <q-card-section v-if="strategy === 'local'" class="q-pa-none">
                <q-card-section v-show="!withToken">
                  <div class="text-center q-pt-sm">
                    <div class="col text-subtitle">
                      {{ $t("login.user_title") }}
                    </div>
                  </div>
                  <q-form @submit="onSubmit" class="q-gutter-md">
                    <q-input autofocus :dark="settings.theme.dark" :color="settings.theme.dark ? 'white' : 'grey-10'"
                      v-model="email" :label="$t('email')" lazy-rules>
                      <template v-slot:prepend>
                        <q-icon name="fas fa-envelope" size="xs" />
                      </template>
                    </q-input>

                    <q-input :type="showPassword ? 'text' : 'password'" :dark="settings.theme.dark"
                      :color="settings.theme.dark ? 'white' : 'grey-10'" v-model="password" :label="$t('password')"
                      lazy-rules>
                      <template v-slot:prepend>
                        <q-icon name="fas fa-lock" size="xs" />
                      </template>
                      <template v-slot:append>
                        <q-btn round dense flat :icon="showPassword ? 'visibility_off' : 'visibility'"
                          @click="showPassword = !showPassword" />
                      </template>
                    </q-input>

                    <div>
                      <q-btn :label="$t('login.submit')" type="submit" color="secondary" :disable="disableSubmit" />
                      <q-btn v-if="settings.register_enabled" :label="$t('login.register')" flat to="/register" stretch
                        class="text-bold q-ml-md" />
                    </div>
                  </q-form>
                </q-card-section>
                <q-card-section v-show="secret">
                  <div class="col text-subtitle">
                    {{ $t("login.totp") }}
                  </div>
                  <div class="text-center q-mt-md">
                    <img :src="qr" />
                  </div>
                  <div class="col text-subtitle q-mt-md">
                    {{ $t("login.totp_secret") }}
                  </div>
                  <q-input :dark="settings.theme.dark" dense :color="settings.theme.dark ? 'white' : 'grey-10'"
                    v-model="secret" readonly>
                    <template v-slot:after>
                      <q-btn round dense flat icon="content_copy" @click="onCopySecret" />
                    </template>
                  </q-input>
                  <div class="col text-subtitle q-mt-md">
                    {{ $t("login.email_otp") }}
                  </div>
                  <div class="q-mt-md">
                    <q-btn :label="$t('login.send_email_token')" @click="onEmailToken" color="info" stretch
                      class="text-bold" />
                  </div>
                </q-card-section>
                <q-card-section v-if="withToken">
                  <q-form @submit="onSubmit" class="q-gutter-md">
                    <q-input autofocus type="number" :dark="settings.theme.dark"
                      :color="settings.theme.dark ? 'white' : 'grey-10'" v-model="token" :label="$t('login.token')"
                      lazy-rules class="no-spinner">
                      <template v-slot:prepend>
                        <q-icon name="fas fa-mobile" size="xs" />
                      </template>
                    </q-input>
                    <div>
                      <q-btn :label="$t('login.validate')" type="submit" color="secondary" :disable="disableValidate" />
                      <q-btn :label="$t('cancel')" @click="onCancelToken" flat stretch class="text-bold q-ml-md" />
                    </div>
                  </q-form>
                </q-card-section>
                <q-card-section v-if="!withToken" class="q-pt-none q-pb-none">
                  <q-btn flat to="/forgot-password" dense no-caps class="text-bold">
                    {{ $t("login.forgot_password") }}
                  </q-btn>
                </q-card-section>
                <q-card-section v-if="!withToken && authProviders.length > 0" class="text-center q-pt-none">
                  <div class="text-subtitle q-mb-md">{{ $t('login.continue_with') }}</div>
                  <template v-for="provider in authProviders" :key="provider">
                    <q-btn :label="$t(provider)" no-caps :href="`${baseURL}/oauth/${provider}?redirect=/login`" color="primary" class="q-mr-md">
                    </q-btn>
                  </template>
                </q-card-section>
              </q-card-section>
              <q-card-section v-if="strategy !== 'local'">
                <div class="text-center q-pt-sm">
                  <div class="col text-subtitle">
                    {{ $t("login.participant_title") }}
                  </div>
                </div>
                <q-form @submit="onSubmit" class="q-gutter-md" autocomplete="off">
                  <div v-if="!withPassword">
                    <q-input autofocus autocomplete="new-password" :dark="settings.theme.dark"
                      :color="settings.theme.dark ? 'white' : 'grey-10'" v-model="code" :label="$t('login.code')"
                      mask="XXXXXX">
                      <template v-slot:prepend>
                        <q-icon name="fas fa-mobile" size="xs" />
                      </template>
                    </q-input>
                  </div>
                  <div v-else class="q-mb-xl">
                    <q-input :autofocus="withPassword" :type="showPassword ? 'text' : 'password'"
                      autocomplete="new-password" :dark="settings.theme.dark"
                      :color="settings.theme.dark ? 'white' : 'grey-10'" v-model="password"
                      :label="$t('login.participant_password')" :hint="$t('login.participant_password_hint')">
                      <template v-slot:prepend>
                        <q-icon name="fas fa-key" size="xs" />
                      </template>
                      <template v-slot:append>
                        <q-btn round dense flat :icon="showPassword ? 'visibility_off' : 'visibility'"
                          @click="showPassword = !showPassword" />
                      </template>
                    </q-input>
                  </div>
                  <div>
                    <q-btn :label="$t('login.enter')" type="submit" color="secondary" :disable="disableEnter" />
                  </div>
                </q-form>
              </q-card-section>
              <q-card-section>
                <q-btn v-if="strategy !== 'local'" flat dense no-caps class="text-bold" @click="toStrategy('local')">
                  {{ $t("login.as_user") }}
                </q-btn>
                <q-btn v-if="strategy === 'local'" flat dense no-caps class="text-bold"
                  @click="toStrategy('participant')">
                  {{ $t("login.as_participant") }}
                </q-btn>
                <q-btn-dropdown v-show="hasLocales" flat :label="$t('locales.' + locale)" class="float-right">
                  <q-list>
                    <q-item clickable v-close-popup @click="onLocaleSelection(localeOpt)"
                      v-for="localeOpt in localeOptions" :key="localeOpt.value">
                      <q-item-section>
                        <q-item-label>{{ localeOpt.label }}</q-item-label>
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

<script setup lang="ts">
import AppBanner from '@/components/AppBanner.vue'
import { locales } from '../boot/i18n'
import { settings as _settings } from '../boot/settings'
const settings = _settings as Record<string, any>
import { baseURL } from '../boot/axios'
import { Notify, copyToClipboard } from 'quasar'
import { useCookies } from 'vue3-cookies'

const authStore = useAuthStore()
const itwStore = useInterviewStore()
const { t, locale } = useI18n({ useScope: 'global' })
const { cookies } = useCookies()
const router = useRouter()
const route = useRoute()

const email = ref('')
const token = ref('')
const secret = ref('')
const password = ref('')
const qr = ref('')
const withToken = ref(false)
const method = ref('')
const strategy = ref('participant')
const code = ref('')
const withPassword = ref(false)
const showForm = ref(false)
const showPassword = ref(false)
const authProviders = ref<string[]>([])

const localeOptions = computed(() =>
  locales
    .map((loc) => ({ value: loc, label: t('locales.' + loc) }))
    .sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
)
const hasLocales = computed(() => locales.length > 1)
const disableEnter = computed(() => code.value.length !== 6 || (withPassword.value && password.value.length < 8))
const disableSubmit = computed(() => email.value.length === 0 || password.value.length === 0)
const disableValidate = computed(() => token.value.length < 6)

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
      router.push('/')
    } catch {
      Notify.create({ message: t('login.failed'), color: 'negative' })
    }
    return
  } else if (oauthError) {
    Notify.create({ message: t('login.failed'), color: 'negative' })
    return
  }

  if (authStore.isAuthenticated) {
    authStore.logout()
  }
  if (route.query.campaign) {
    strategy.value = 'campaign'
    onSubmit()
  } else if (route.params.code) {
    code.value = route.params.code as string
    strategy.value = 'participant'
    onSubmit()
  } else {
    showForm.value = true
  }
  showPassword.value = false
  authStore.getOAuthProviders().then((resp: { providers?: string[] }) => {
    authProviders.value = resp.providers || []
  })
})

function onLocaleSelection(opt: { value: string }) {
  locale.value = opt.value
  cookies.set('locale', opt.value)
}

function toStrategy(s: string) {
  strategy.value = s
  withPassword.value = false
  withToken.value = false
  code.value = ''
  password.value = ''
  email.value = ''
  secret.value = ''
  token.value = ''
}

function makePayload() {
  const payload: Record<string, string> = {
    strategy: 'local',
    email: email.value,
    password: password.value,
  }
  if (method.value) payload.method = method.value
  if (token.value) payload.token = token.value
  if (!method.value && secret.value) payload.secret = secret.value
  return payload
}

function onCopySecret() {
  copyToClipboard(secret.value).then(() => {
    Notify.create({ message: t('login.secret_copied'), color: 'positive' })
  })
}

function onEmailToken() {
  method.value = 'otp'
  onSubmit()
}

function onCancelToken() {
  withToken.value = false
  token.value = ''
  password.value = ''
  secret.value = ''
  method.value = 'otp'
}

function redirect() {
  const redirectTo = authStore.loginRedirect || '..'
  authStore.loginRedirect = null
  router.push(redirectTo)
}

function onSubmit() {
  if (strategy.value === 'campaign') {
    itwStore
      .initByWalkInParticipant(route.query)
      .then(() => redirect())
      .catch((err: { className: string; message: string }) => {
        showForm.value = true
        const type = err.className
        if (type === 'not-authenticated' && err.message.startsWith('A participant password is required')) {
          withPassword.value = true
        } else if (type === 'bad-request') {
          Notify.create({ message: t(err.message), color: 'negative' })
        } else {
          console.error(err)
          Notify.create({ message: t('login.participant_failed'), color: 'negative' })
        }
      })
  } else if (strategy.value === 'local') {
    const payload = makePayload()
    authStore.clearError()
    authStore
      .authenticate(payload as any)
      .then((response: Record<string, any>) => {
        if (response.data?.qr && response.data?.secret) {
          qr.value = response.data.qr
          secret.value = response.data.secret
          withToken.value = true
        } else {
          itwStore.setUser(response.user)
          redirect()
        }
      })
      .catch((err: { className: string; message: string }) => {
        showForm.value = true
        const type = err.className
        if (type === 'bad-request' && err.message.startsWith('Token required')) {
          withToken.value = true
        } else if (type === 'bad-request' && err.message.startsWith('Invalid token')) {
          Notify.create({ message: t('login.failed_token'), color: 'negative' })
          token.value = ''
        } else {
          Notify.create({ message: t('login.failed'), color: 'negative' })
        }
      })
  } else if (strategy.value === 'participant') {
    itwStore
      .initByParticipant(code.value, withPassword.value ? password.value : undefined)
      .then(() => redirect())
      .catch((err: { className: string; message: string }) => {
        showForm.value = true
        const type = err.className
        if (type === 'not-authenticated' && err.message.startsWith('A participant password is required')) {
          withPassword.value = true
        } else if (type === 'bad-request') {
          Notify.create({ message: t(err.message), color: 'negative' })
        } else {
          console.error(err)
          Notify.create({ message: t('login.participant_failed'), color: 'negative' })
        }
      })
  }
}
</script>
