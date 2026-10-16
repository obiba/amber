<template>
  <q-layout view="lHh Lpr lFf">
    <q-header :class="settings.theme.header">
      <q-toolbar>
        <q-btn
          flat
          dense
          round
          icon="menu"
          aria-label="Menu"
          @click="toggleLeftDrawer"
        />

        <q-toolbar-title class="row items-center no-wrap">
          <img :src="amberMark" alt="" class="brand-mark q-mr-sm" />
          <span :style="$q.screen.lt.sm?{'font-size': 'smaller'}:{}">
            {{$t('main.brand')}}
          </span>
        </q-toolbar-title>

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn-dropdown
            v-show="hasLocales"
            flat
            :label="locale.toUpperCase()"
            :title="$t('locales.' + locale)">
            <q-list>
              <q-item clickable v-close-popup @click="onLocaleSelection(localeOpt)" v-for="localeOpt in localeOptions" :key="localeOpt.value">
                <q-item-section>
                  <q-item-label class="text-uppercase text-bold" :title="$t('locales.' + localeOpt.value)">
                    {{localeOpt.value}}
                  </q-item-label>
                </q-item-section>
                <q-item-section avatar v-if="locale === localeOpt.value">
                  <q-icon color="primary" name="check" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      bordered
    >
      <q-list>
        <q-item-label
          header
        >
          {{userName}}
        </q-item-label>

        <q-item
          clickable
          @click="onLogout"
        >
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{$t('main.logout')}}</q-item-label>
          </q-item-section>
        </q-item>

        <!-- q-item
          clickable
          @click="onLock"
           v-if="settings.lock.enabled"
        >
          <q-item-section avatar>
            <q-icon name="lock" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{$t('main.lock')}}</q-item-label>
          </q-item-section>
        </q-item -->

        <q-separator/>

        <q-item
          clickable
          @click="onUpdate"
        >
          <q-item-section avatar>
            <q-icon name="refresh" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{$t('main.refresh')}}</q-item-label>
            <q-item-label caption>
              {{ $t('main.refresh_hint') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item
          clickable
          @click="onShowAppInfo"
        >
          <q-item-section avatar>
            <q-icon name="info" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{$t('main.info')}}</q-item-label>
            <q-item-label caption>
              {{ $t('main.info_hint') }}
            </q-item-label>
          </q-item-section>
        </q-item>

        <q-item-label
          header
        >
          {{$t('main.essential_links')}}
        </q-item-label>

        <EssentialLink
          v-for="link in settings.links"
          :key="link.title"
          v-bind="link"
        />

        <q-item class="fixed-bottom text-caption">
          <div>
            {{$t('main.powered_by')}} <a class="text-weight-bold" href="https://www.obiba.org" target="_blank">OBiBa Amber</a>
          </div>
        </q-item>
      </q-list>
    </q-drawer>

    <q-footer bordered class="bg-white text-ink">
      <q-tabs no-caps dense>
        <q-route-tab to="/" icon="dashboard" :label="$t('main.dashboard')" />
        <q-route-tab to="/case-reports" icon="summarize" :label="$t('main.case_reports')">
          <q-badge floating>{{ caseReportsCount }}</q-badge>
        </q-route-tab>
      </q-tabs>
    </q-footer>

    <q-dialog v-model="showAppInfo">
      <q-card :style="$q.screen.lt.sm ? 'min-width: 200px' : 'min-width: 400px'">
        <q-card-section>
          <q-list>
            <q-item-label header class="text-uppercase">
              {{ $t("main.source_code") }}
            </q-item-label>
            <q-item>
              <q-item-section>
                <q-item-label>
                  <a href="https://github.com/obiba/amber-collect" target="_blank">OBiBa Amber Collect</a>
                </q-item-label>
                <q-item-label caption>
                  v{{ settings.version }}
                </q-item-label>
              </q-item-section>
            </q-item>
            <q-item-label header class="text-uppercase">
              {{ $t("main.contributors") }}
            </q-item-label>
            <q-item v-for="contrib in contributors" :key="contrib.name">
              <q-item-section>
                <q-item-label v-if="contrib.link">
                  <a :href="contrib.link" target="_blank">{{ contrib.name }}</a>
                </q-item-label>
                <q-item-label v-else>
                  {{ contrib.name }}
                </q-item-label>
              </q-item-section>
            </q-item>
          </q-list>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { locales } from '../boot/i18n'
import { settings } from '../boot/settings'
import { useAuthStore } from '../stores/auth'
import { useRecordStore } from '../stores/record'
import { useFormStore } from '../stores/form'
import { useLockStore } from '../stores/lock'

// Import Quasar language files statically
import langEnUS from 'quasar/lang/en-US'
import langFr from 'quasar/lang/fr'

import EssentialLink from '@/components/EssentialLink.vue'
import amberMark from '@/assets/amber-mark-negative.svg'

// Map locale codes to Quasar language objects
const quasarLangMap = {
  en: langEnUS,
  fr: langFr
}

const contributors = [
  {
    name: 'MUHC Centre for Global Surgery',
    link: 'https://www.cglobalsurgery.com/'
  },
  {
    name: 'Epigeny',
    link: 'https://www.epigeny.io/'
  }
]

// Composition API setup
const $q = useQuasar()
const { locale, t } = useI18n({ useScope: 'global' })
const router = useRouter()

// Reactive state
const leftDrawerOpen = ref(false)
const showAppInfo = ref(false)

// Initialize stores
const authStore = useAuthStore()
const recordStore = useRecordStore()
const formStore = useFormStore()
const lockStore = useLockStore()

// Extract reactive state from stores
const { id: lockId, status: lockStatus } = storeToRefs(lockStore)

const triggerLock = (payload) => {
  lockStore.triggerLock(payload)
}

const updatePassword = (payload) => {
  lockStore.updatePassword(payload)
}

const resetLock = (userId) => {
  updatePassword({
    id: userId
  })
  triggerLock({
    status: false
  })
}

// Computed properties
const caseReportsCount = computed(() => {
  return recordStore.getCaseReportsCount(user.value)
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

const user = computed(() => {
  return authStore.user
})

const userName = computed(() => {
  const fullname = user.value ? user.value.firstname + ' ' + user.value.lastname : ''
  return fullname.trim().length === 0 ? userEmail.value : fullname
})

const userEmail = computed(() => {
  if (user.value) {
    return user.value.email
  }
  return ''
})

// Methods
const toggleLeftDrawer = () => {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const onShowAppInfo = () => {
  showAppInfo.value = true
}

const onLocaleSelection = (opt) => {
  locale.value = opt.value
}

const onLogout = () => {
  formStore.clearCaseReportForms()
  authStore.logout()
    .then(() => {
      router.push('/login')
    })
  resetLock()
}

const onUpdate = () => {
  formStore.getCaseReportForms({})
}

// Watch locale changes
watch(locale, val => {
  // Set Quasar language based on locale
  const lang = quasarLangMap[val] || quasarLangMap.en
  $q.lang.set(lang)
})

// Lifecycle hook (replaces created)
onMounted(() => {
  if (settings.lock.enabled && user.value) {
    if (lockStatus.value) {
      router.push('/lock')
    }
    if (user.value._id !== lockId.value) {
      resetLock(user.value._id)
    }
  }
})
</script>
