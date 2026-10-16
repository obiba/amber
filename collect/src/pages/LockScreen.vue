<template>
  <q-layout :class="settings.theme.front.bg" v-cloak>
    <q-page-container>
      <q-page class="flex flex-center">
        <q-card class="bg-transparent no-border no-shadow">
          <q-card-section class="q-pb-none">
            <div class="text-white" :class="$q.screen.lt.sm ? 'text-h6 text-center' : 'text-weight-bold'">{{userName}}</div>
          </q-card-section>

          <q-card-section v-if="isNewPwd && isFirstPwd" class="q-pt-none text-center">
            <q-input
              readonly
              dark
              v-model.number="password1"
              color="white"
              :type="isPwd ? 'password' : 'number'"
              mask="####"
              autocomplete="off"
              :hint="$t('lock.new_code_placeholder')"
              class="no-spinner">
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>
            <lock-pad v-model="password1" class="q-mt-lg"/>
          </q-card-section>

          <q-card-section v-if="isNewPwd && !isFirstPwd" class="q-pt-none text-center">
            <q-input
              readonly
              dark
              v-model.number="password2"
              color="white"
              :type="isPwd ? 'password' : 'number'"
              mask="####"
              autocomplete="off"
              :hint="$t('lock.repeat_code_placeholder')"
              class="no-spinner">
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>
            <lock-pad v-model="password2" class="q-mt-lg"/>
          </q-card-section>

          <q-card-section v-if="isNewPwd" class="q-pt-none text-center">
            <div
              @click="onCancel"
              class="cursor-pointer text-bold">
              {{$t('cancel')}}
            </div>
          </q-card-section>

          <q-card-section v-if="!isNewPwd" class="q-pt-none text-center">
            <q-input
              readonly
              dark
              v-model.number="password"
              color="white"
              :type="isPwd ? 'password' : 'number'"
              mask="####"
              autocomplete="off"
              :placeholder="$t('lock.code_placeholder')"
              class="no-spinner">
              <template v-slot:append>
                <q-icon
                  :name="isPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="isPwd = !isPwd"
                />
              </template>
            </q-input>
            <lock-pad v-model="password" class="q-mt-lg"/>
          </q-card-section>

          <q-card-section v-if="!isNewPwd" class="q-pt-none text-center">
            <div
              @click="onLogout"
              class="cursor-pointer text-bold">
              {{$t('main.logout')}}
            </div>
          </q-card-section>

        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Notify } from 'quasar'
import { storeToRefs } from 'pinia'
import { settings } from '../boot/settings'
import { useAuthStore } from '../stores/auth'
import { useRecordStore } from '../stores/record'
import { useLockStore } from '../stores/lock'
import LockPad from '../components/LockPad.vue'

const passwordLength = 4

// Router and i18n
const router = useRouter()
const { t } = useI18n()

// Stores
const authStore = useAuthStore()
const recordStore = useRecordStore()
const lockStore = useLockStore()

// Store state
const { user } = storeToRefs(recordStore)

// LockMixin functionality inlined - use state refs directly
const { password: lockPassword } = storeToRefs(lockStore)

// Inlined LockMixin methods
const triggerLock = (payload) => {
  lockStore.triggerLock(payload)
}

const updatePassword = (payload) => {
  lockStore.updatePassword(payload)
}

const clearPassword = (payload) => {
  lockStore.clearPassword(payload)
}

const clearLock = (userId) => {
  clearPassword({
    id: userId
  })
  triggerLock({
    status: false
  })
}

// Local state
const isPwd = ref('password')
const password1 = ref('')
const password2 = ref('')
const password = ref('')

// Computed properties
const userName = computed(() => {
  if (user.value) {
    const fullname = user.value.firstname + ' ' + user.value.lastname
    return fullname.trim().length === 0 ? user.value.email : fullname
  } else {
    return ''
  }
})

const isNewPwd = computed(() => {
  return !lockPassword.value || lockPassword.value.length === 0
})

const isFirstPwd = computed(() => {
  return ('' + password1.value).length < 4
})

// Watchers
watch(password2, (newValue) => {
  const newStr = newValue + ''
  if (newStr.length === passwordLength) {
    if (newStr === (password1.value + '')) {
      updatePassword({
        id: user.value._id,
        password: newStr
      })
      triggerLock({
        status: true
      })
    } else {
      Notify.create({
        message: t('lock.not_matching_codes'),
        color: 'negative'
      })
    }
  }
})

watch(password, (newValue) => {
  // verify code and remove lock wall
  const newStr = newValue + ''
  if (newStr.length === passwordLength) {
    if (lockPassword.value && newStr === lockPassword.value) {
      triggerLock({
        status: false
      })
      router.push('/')
    } else {
      Notify.create({
        message: t('lock.incorrect_unclock'),
        color: 'negative'
      })
    }
  }
})

// Methods
const onCancel = () => {
  router.push('/')
}

const onLogout = () => {
  if (user.value) {
    clearLock(user.value._id)
    authStore.logout()
  } else {
    triggerLock({ status: false })
    router.push('/login')
  }
}

// Lifecycle hook
onMounted(() => {
  if (user.value) {
    if (!isNewPwd.value) {
      triggerLock({
        status: true
      })
    }
  } else {
    router.push('/')
  }
})
</script>

<style>
[v-cloak] {
  display: none !important;
}
</style>
