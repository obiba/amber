<template>
  <q-layout v-if="itwStore.isAuthenticated" view="lHh Lpr lFf">
    <q-header bordered :class="settings.theme.header">
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
          {{ $t("main.brand") }}
        </q-toolbar-title>

        <div class="q-gutter-sm row items-center no-wrap">
          <q-btn-dropdown
            v-show="hasLocales"
            flat
            :label="getLocaleLabel(locale)"
          >
            <q-list>
              <q-item
                clickable
                v-close-popup
                @click="onLocaleSelection(localeOpt)"
                v-for="localeOpt in localeOptions"
                :key="localeOpt.value"
              >
                <q-item-section>
                  <q-item-label>{{ localeOpt.label }}</q-item-label>
                </q-item-section>
                <q-item-section avatar v-if="locale === localeOpt.value">
                  <q-icon color="primary" name="check" />
                </q-item-section>
              </q-item>
            </q-list>
          </q-btn-dropdown>
        </div>
      </q-toolbar>
      <q-toolbar
        v-if="itwStore.pending"
        class="bg-warning text-dark q-pt-sm q-pb-sm"
        style="min-height: 20px"
      >
        <div>{{ $t("main.pending_save") }}</div>
        <q-btn flat dense no-caps class="q-ml-lg" @click="onSaveNow">{{
          $t("main.save_now")
        }}</q-btn>
      </q-toolbar>
      <q-toolbar
        v-if="itwStore.completed"
        class="bg-info q-pt-sm q-pb-sm"
        style="min-height: 20px"
      >
        <div>{{ $t("main.interview_completed") }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :class="settings.theme.drawer"
    >
      <q-list>
        <q-item-label header>
          <q-chip
            v-if="authStore.isAuthenticated"
            color="secondary"
            text-color="white"
            class="q-ma-none"
            >{{ itwUser?.email }}</q-chip
          >
          <q-chip
            v-else
            color="secondary"
            text-color="white"
            class="q-ma-none"
            >{{ itwStore?.participant?.code }}</q-chip
          >
        </q-item-label>

        <q-item clickable @click="onLogout">
          <q-item-section avatar>
            <q-icon name="logout" />
          </q-item-section>
          <q-item-section>
            <q-item-label>{{ $t("main.logout") }}</q-item-label>
          </q-item-section>
        </q-item>

        <EssentialLink
          v-for="link in settings.links"
          :key="link.title"
          v-bind="link"
        />
        <q-item class="fixed-bottom text-caption">
          <div>
            {{ $t("main.powered_by") }}
            <a
              class="text-weight-bold"
              href="https://www.obiba.org/pages/products/amber"
              target="_blank"
              >OBiBa Amber</a
            >
          </div>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container :class="settings.theme.page">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import EssentialLink from '@/components/EssentialLink.vue'
import amberMark from '@/assets/amber-mark-negative.svg'
import { locales } from '../boot/i18n'
import { settings as _settings } from '../boot/settings'
import { useCookies } from 'vue3-cookies'
import { useQuasar } from 'quasar'

const settings = _settings as Record<string, any>
const authStore = useAuthStore()
const itwStore = useInterviewStore()
const { locale, t } = useI18n({ useScope: 'global' })
const { cookies } = useCookies()
const q = useQuasar()
const router = useRouter()

const leftDrawerOpen = ref(false)
const itwUser = computed(() => itwStore.user as any)

const localeOptions = computed(() => {
  let commonLocales: string[] = []
  const design = itwStore.design as any
  if (design?.i18n) {
    commonLocales = Object.keys(design.i18n).filter((loc: string) => locales.includes(loc))
  }
  return commonLocales
    .map((loc) => ({ value: loc, label: getLocaleLabel(loc) }))
    .sort((a, b) => (a.label > b.label ? 1 : a.label < b.label ? -1 : 0))
})

const hasLocales = computed(() => locales.length > 1 && localeOptions.value.length > 1)

onMounted(() => {
  if (!itwStore.isAuthenticated) {
    onLogout()
  } else if (!itwStore.user) {
    authStore.reAuthenticate().then((response: Record<string, any>) => {
      if (response) itwStore.setUser(response.user)
    })
  }
})

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

function getLocaleLabel(loc: string) {
  const key = `locales.${loc}`
  const label = t(key)
  return label === key ? loc.toUpperCase() : label
}

function onLocaleSelection(opt: { value: string }) {
  locale.value = opt.value
  q.lang.set(opt.value as any)
  cookies.set('locale', opt.value)
}

function onLogout() {
  itwStore.reset(true)
  if (authStore.isAuthenticated) {
    authStore.logout().then(() => router.push('login'))
  } else {
    router.push('login')
  }
}

function onSaveNow() {
  itwStore.savePendingRecords()
}
</script>
