<template>
  <q-layout>
    <q-page-container>
      <q-page class="flex flex-center" :class="settings.theme.front.bg">
        <div class="column" v-bind:style="$q.screen.lt.sm
          ? { width: '80%' }
          : $q.screen.lt.md
            ? { width: '50%' }
            : { width: '30%' }
          ">
          <div class="col">
            <app-banner />
          </div>
          <div class="col">
            <q-card :class="settings.theme.front.card">
              <q-card-section>
                <div class="text-center q-pt-sm">
                  <div class="col text-subtitle">
                    {{ $t("reset.title") }}
                  </div>
                </div>
              </q-card-section>
              <q-card-section>
                <q-form @submit="resetPassword" class="q-gutter-md">
                  <q-input :dark="settings.theme.dark" :color="settings.theme.dark ? 'white' : 'grey-10'"
                    :type="showPassword ? 'text' : 'password'" v-model="formData.password" :label="$t('password')"
                    lazy-rules :hint="$t('password_hint')" @blur="v$.formData.password.$touch"
                    :error="v$.formData.password.$error">
                    <template v-slot:prepend>
                      <q-icon name="fas fa-lock" size="xs" />
                    </template>
                    <template v-slot:append>
                      <q-btn round dense flat :icon="showPassword ? 'visibility_off' : 'visibility'"
                        @click="showPassword = !showPassword" />
                    </template>
                    <template v-slot:error>
                      <div v-for="error in v$.formData.password.$errors" :key="error.$uid">
                        {{ error.$message }}
                      </div>
                    </template>
                  </q-input>
                  <div class="q-pt-md">
                    <q-btn :label="$t('reset.submit')" type="submit" color="secondary" :disable="disableSubmit" />
                    <q-btn :label="$t('cancel')" flat to="/login" stretch class="text-bold q-ml-md" />
                  </div>
                </q-form>
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
import useVuelidate from '@vuelidate/core'
import { required, minLength, maxLength, strongPassword } from '../boot/vuelidate'
import { Notify } from 'quasar'
import { settings as _settings } from '../boot/settings'

const settings = _settings as Record<string, any>
const { client } = useFeathers()
const authManagementService = client.service('authManagement')
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

const showPassword = ref(false)
const formData = reactive({ password: '' })
const v$ = useVuelidate(
  { formData: { password: { required, minLength: minLength(8), maxLength: maxLength(64), strongPassword } } },
  { formData }
)

const disableSubmit = computed(() => v$.value.formData.$invalid)

async function resetPassword() {
  const token = route.query.token
  if (token) {
    authManagementService
      .create({ action: 'resetPwdLong', value: { token, password: formData.password } })
      .then(() => {
        Notify.create({ message: t('reset.success'), color: 'positive', icon: 'fas fa-check' })
        router.push('/login')
      })
      .catch(() => {
        Notify.create({ message: t('reset.failure'), color: 'negative', icon: 'fas fa-times' })
      })
  } else {
    Notify.create({ message: t('reset.bad_link'), color: 'negative', icon: 'fas fa-times' })
  }
}
</script>
