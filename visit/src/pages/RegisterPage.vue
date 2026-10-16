<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center" :class="settings.theme.front.bg">
        <div
          class="column"
          :style="
            $q.screen.lt.sm
              ? { width: '80%' }
              : $q.screen.lt.md
              ? { width: '50%' }
              : { width: '30%' }
          "
        >
          <div class="col">
            <app-banner />
          </div>
          <div class="col">
            <q-card :class="settings.theme.front.card">
              <q-card-section>
                <div class="text-center q-pt-sm">
                  <div class="col text-subtitle">
                    {{ $t("register.title") }}
                  </div>
                </div>
              </q-card-section>
              <q-card-section v-if="!registrationComplete">
                <q-form @submit="onSubmit" class="q-gutter-md">
                  <q-input
                    autofocus
                    :dark="settings.theme.dark"
                    :color="settings.theme.dark ? 'white' : 'grey-10'"
                    v-model="formData.email"
                    :label="$t('email')"
                    :hint="$t('email_hint')"
                    type="email"
                    @blur="v$.formData.email.$touch"
                    :error="v$.formData.email.$error"
                    lazy-rules
                  >
                    <template v-slot:prepend>
                      <q-icon name="fas fa-envelope" size="xs" />
                    </template>
                    <template v-slot:error>
                      <div
                        v-for="error in v$.formData.email.$errors"
                        :key="error.$uid"
                      >
                        {{ error.$message }}
                      </div>
                    </template>
                  </q-input>

                  <q-input
                    :dark="settings.theme.dark"
                    :color="settings.theme.dark ? 'white' : 'grey-10'"
                    v-model="formData.password"
                    :label="$t('password')"
                    :hint="$t('password_hint')"
                    type="password"
                    lazy-rules
                    @blur="v$.formData.password.$touch"
                    :error="v$.formData.password.$error"
                  >
                    <template v-slot:prepend>
                      <q-icon name="fas fa-lock" size="xs" />
                    </template>
                    <template v-slot:error>
                      <div
                        v-for="error in v$.formData.password.$errors"
                        :key="error.$uid"
                      >
                        {{ error.$message }}
                      </div>
                    </template>
                  </q-input>

                  <q-input
                    :dark="settings.theme.dark"
                    :color="settings.theme.dark ? 'white' : 'grey-10'"
                    v-model="formData.firstname"
                    :label="$t('firstname')"
                    :hint="$t('required')"
                    @blur="v$.formData.firstname.$touch"
                    :error="v$.formData.firstname.$error"
                    lazy-rules
                  >
                    <template v-slot:prepend>
                      <q-icon name="fas fa-user" size="xs" />
                    </template>
                    <template v-slot:error>
                      <div
                        v-for="error in v$.formData.firstname.$errors"
                        :key="error.$uid"
                      >
                        {{ error.$message }}
                      </div>
                    </template>
                  </q-input>

                  <q-input
                    :dark="settings.theme.dark"
                    :color="settings.theme.dark ? 'white' : 'grey-10'"
                    v-model="formData.lastname"
                    :label="$t('lastname')"
                    :hint="$t('required')"
                    @blur="v$.formData.lastname.$touch"
                    :error="v$.formData.lastname.$error"
                    lazy-rules
                  >
                    <template v-slot:prepend>
                      <q-icon name="fas fa-user" size="xs" />
                    </template>
                    <template v-slot:error>
                      <div
                        v-for="error in v$.formData.lastname.$errors"
                        :key="error.$uid"
                      >
                        {{ error.$message }}
                      </div>
                    </template>
                  </q-input>

                  <q-select
                    :dark="settings.theme.dark"
                    :color="settings.theme.dark ? 'white' : 'grey-10'"
                    v-show="hasLocales"
                    v-model="locale"
                    :options="localeOptions"
                    :label="$t('preferred_language')"
                    emit-value
                    map-options
                    options-dense
                    style="min-width: 150px"
                  >
                    <template v-slot:prepend>
                      <q-icon name="fas fa-language" size="xs" />
                    </template>
                  </q-select>
                  <div>
                    <q-btn
                      :label="$t('register.submit')"
                      type="submit"
                      color="secondary"
                      :disable="disableSubmit"
                    />
                    <q-btn
                      :label="$t('register.login')"
                      flat
                      to="/login"
                      stretch
                      class="text-bold q-ml-md"
                    />
                  </div>
                </q-form>
              </q-card-section>
              <q-card-section v-if="!registrationComplete">
                <span
                  class="text-caption"
                  v-html="$t('register.google_policy')"
                >
                </span>
              </q-card-section>
              <q-card-section v-if="registrationComplete">
                <div class="text-center q-pt-lg">
                  <div class="col text-h6 ellipsis">
                    {{ $t("register.success") }}
                  </div>
                </div>
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
import { Notify } from 'quasar'
import useVuelidate from '@vuelidate/core'
import { useReCaptcha } from 'vue-recaptcha-v3'
import { required, minLength, maxLength, email, strongPassword } from '../boot/vuelidate'
import { locales } from '../boot/i18n'
import { settings as _settings } from '../boot/settings'

const settings = _settings as Record<string, any>
const { client } = useFeathers()
const userService = client.service('user')
const { locale, t } = useI18n({ useScope: 'global' })
const { executeRecaptcha, recaptchaLoaded } = useReCaptcha()!
const router = useRouter()

const registrationComplete = ref(false)
const formData = reactive({
  firstname: '',
  lastname: '',
  language: '',
  email: '',
  password: '',
})
const v$ = useVuelidate(
  {
    formData: {
      firstname: { required, minLength: minLength(2) },
      lastname: { required, minLength: minLength(2) },
      email: { required, email },
      password: { required, minLength: minLength(8), maxLength: maxLength(64), strongPassword },
    },
  },
  { formData }
)

const disableSubmit = computed(() => v$.value.formData.$invalid)
const localeOptions = computed(() =>
  locales.map((loc) => ({ value: loc, label: t('locales.' + loc) }))
)
const hasLocales = computed(() => locales.length > 1)

onMounted(() => {
  if (!settings.register_enabled) {
    router.push('/')
  }
})

async function recaptcha() {
  await recaptchaLoaded()
  return executeRecaptcha('login')
}

function onSubmit() {
  recaptcha().then((token) => {
    const data = { ...formData, language: locale.value, token, clientId: 'amber_visit' }
    userService
      .create(data)
      .then(() => router.push('/login'))
      .catch((err: { message: string }) => {
        console.error(err)
        Notify.create({ message: t(err.message), color: 'negative' })
      })
  })
}
</script>
