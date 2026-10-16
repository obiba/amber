<template>
  <q-layout v-cloak view="hHh lpR fFf">

    <q-header :class="settings.theme.header" v-touch-swipe.mouse.left.right="handleSwipe">
      <q-toolbar>
        <q-toolbar-title>
          {{ $t('case_report') }}
        </q-toolbar-title>
        <q-toolbar-title>
          <span class="text-subtitle2 float-right">{{ tr(crf.schema.label) }}
            <q-btn v-if="crf.schema.description || crf.schema.copyright || crf.schema.license" size="12px" flat dense
              round icon='info' @click='onShowFormDescription'>
            </q-btn></span>
        </q-toolbar-title>
      </q-toolbar>
      <q-toolbar v-if="hasIdLabel()" class="bg-amber-soft q-pt-sm q-pb-sm text-primary text-bold" style="min-height: 20px">
        <div>{{ idLabel }}: {{ formData._id }}</div>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <q-page class="bg-page">
        <div v-if="isMulti()">
          <q-linear-progress :value="progress" animation-speed="100" />
        </div>
        <div class="q-pa-md">
          <div class="row">
            <div v-if="!$q.screen.lt.sm" class="col-md-4 col-sm-2"
              :class="(canPrevious() && isMulti()) ? 'text-grey-5 text-center q-mt-xl cursor-pointer' : ''"
              @click="previousStep">
              <q-icon v-if="canPrevious()" :name="$q.lang.rtl ? 'arrow_forward' : 'arrow_back'" size="xl" color="white" class="bg-primary rounded-borders fixed" />
            </div>
            <div class="col-md-4 col-sm-8 col-xs-12 q-mt-sm q-mb-sm">
              <div>
                <AmberForm ref="form" :key="remountCounter" :schema="crf.schema" v-model="formData" :locale="currentLocale"
                  :page="isMulti() ? formData.__step : undefined" :lang="lang" apply-defaults @update:model-value="onFormDataUpdated" />
              </div>
              <!--div class="bg-black text-white q-mt-lg q-pa-md">
                <pre>{{ JSON.stringify(formData, null, '  ') }}</pre>
              </div-->
            </div>
            <div v-if="!$q.screen.lt.sm" class="col-md-4 col-sm-2"
              :class="(canNext() && isMulti()) ? 'text-grey-5 text-center q-mt-xl cursor-pointer' : ''"
              @click="nextStep">
              <q-icon v-if="canNext()" :name="$q.lang.rtl ? 'arrow_back' : 'arrow_forward'" size="xl" color="white" class="bg-primary rounded-borders fixed" />
            </div>
          </div>
        </div>
      </q-page>
    </q-page-container>

    <q-footer :class="settings.theme.footer" v-touch-swipe.mouse.left.right="handleSwipe">
      <q-toolbar>
        <q-btn v-if="mode === 'single'" stretch flat icon="dynamic_feed" @click="toggleMode('multi')"
          :title="$t('multi_steps')" />
        <q-btn v-if="mode === 'multi'" stretch flat icon="grading" @click="toggleMode('single')"
          :title="$t('single_page')" />
        <q-separator dark vertical v-if="mode === 'single'" />
        <q-btn-dropdown v-if="mode === 'single' && toc.length > 1" stretch flat icon="toc"
          :label="$q.screen.lt.sm ? '' : $t('go_to')">
          <q-list>
            <q-item-label v-for="entry in toc" :key="entry.id" header clickable v-close-popup
              @click="onScroll(entry.id)">
              {{ entry.label }}
            </q-item-label>
          </q-list>
        </q-btn-dropdown>
        <q-space />

        <q-separator dark vertical v-if="isMulti()" />
        <q-btn v-if="isMulti()" stretch flat :icon="$q.lang.rtl ? 'chevron_right' : 'chevron_left'"
          @click="previousStep" :label="$q.screen.lt.sm ? '' : $t('previous')" :disabled="!canPrevious()" />
        <q-separator dark vertical v-if="isMulti()" />
        <q-btn v-if="isMulti() && !isFinalStep" stretch flat :icon="$q.lang.rtl ? 'chevron_left' : 'chevron_right'"
          @click="nextStep" :label="$q.screen.lt.sm ? '' : $t('next')" :disabled="!canNext()" />
        <q-separator dark vertical v-if="mode === 'single'" />
        <q-btn v-if="mode === 'single' || isFinalStep" stretch flat class="bg-primary" :title="$t('validate_save')"
          :label="$t('save')" icon="cloud_upload" @click="onComplete" />
        <q-separator dark vertical />
        <q-btn stretch flat :label="$q.screen.lt.sm ? '' : $t('pause')" icon="pause" @click="onPause" />
      </q-toolbar>
    </q-footer>

    <q-dialog v-model="showFormDescription">
      <q-card style="min-width: 300px">
        <q-card-section>
          <div v-if="crf.schema.description" v-html="md(tr(crf.schema.description))" />
        </q-card-section>
        <q-card-section>
          <div v-if="crf.schema.copyright" v-html="'&#169; ' + md(tr(crf.schema.copyright))" />
          <div v-if="caseReportLicense" class="q-mt-sm" v-html="md($t(caseReportLicense))" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="OK" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

  </q-layout>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import { AmberForm, makeSchemaFormTr, getPageCount, getToc, getTocElement } from '@obiba/quasar-ui-amber'
import { Notify, scroll } from 'quasar'
import { t } from '../boot/i18n'
import { settings } from '../boot/settings'
import { useRecordStore } from '../stores/record'
import { useFormStore } from '../stores/form'

const { getScrollTarget, setVerticalScrollPosition } = scroll

// Router and i18n
const router = useRouter()
const route = useRoute()
const { locale } = useI18n({ useScope: 'global' })

// Stores
const recordStore = useRecordStore()
const formStore = useFormStore()

const { crfs } = storeToRefs(formStore)
const { user } = storeToRefs(recordStore)

// Constants
const ccLicenses = [
  {
    value: 'cc-by-40',
    label: 'license.cc_by_40'
  },
  {
    value: 'cc-by-sa-40',
    label: 'license.cc_by_sa_40'
  },
  {
    value: 'cc-by-nc-40',
    label: 'license.cc_by_nc_40'
  },
  {
    value: 'cc-by-nc-sa-40',
    label: 'license.cc_by_nc_sa_40'
  },
  {
    value: 'cc-by_nd-40',
    label: 'license.cc_by_nd_40'
  },
  {
    value: 'cc-by-nc-nd-40',
    label: 'license.cc_by_nc_nd_40'
  },
  {
    value: 'cc-cc0-10',
    label: 'license.cc_cc0_10'
  }
]

// Reactive state
const form = ref(null)
const remountCounter = ref(0)
const progress = ref(0)
const formData = ref({})
const crf = ref({ schema: { items: [] } })
const showFormDescription = ref(false)
const mode = ref('multi')
const lastAutoSave = ref(null)
const autoSavePending = ref(false)
const errorsRemain = ref(false)
const errors = ref([])
const lang = ref({})

// Computed properties
const currentLocale = computed(() => locale.value)

const caseReportId = computed(() => route.params.id)

const caseReportLicense = computed(() => {
  const license = crf.value.schema.license
  let found = ccLicenses.filter(lic => lic.value === license).pop()
  if (!found && settings.licenses) {
    found = settings.licenses.filter(lic => lic.value === license).pop()
  }
  if (found) {
    return found.label ? found.label : found.value
  }
  return license
})

const toc = computed(() => getToc(crf.value.schema, { locale: currentLocale.value }))

const idLabel = computed(() => {
  return crf.value.schema.idLabel ? tr(crf.value.schema.idLabel) : 'ID'
})

const isFinalStep = computed(() => {
  return isMulti() && formData.value.__step === getPageCount(crf.value.schema) - 1
})

// Methods
const hasIdLabel = () => {
  return crf.value.schema.idLabel
}

const onShowFormDescription = () => {
  showFormDescription.value = true
}

const onScroll = (id) => {
  const ele = getTocElement(id)
  if (ele) {
    const target = getScrollTarget(ele)
    const offset = ele.offsetTop
    const duration = 200
    setVerticalScrollPosition(target, offset, duration)
  }
}

const updateProgress = () => {
  progress.value = formData.value.__step / Math.max(1, getPageCount(crf.value.schema) - 1)
}

const isMulti = () => {
  return mode.value === 'multi'
}

const handleSwipe = ({ evt, ...newInfo }) => {
  if (isMulti()) {
    if (newInfo.direction === 'left') {
      nextStep()
    } else if (newInfo.direction === 'right') {
      previousStep()
    }
  }
}

const formatErrorMessages = () => {
  const errorMessages = errors.value.map(err => {
    let errMessage = err.message === 'Field is required' ? t('required_field') : err.message
    errMessage = errMessage.charAt(0).toLowerCase() + errMessage.slice(1)
    return `<li>${err.label}: ${errMessage}</li>`
  }).join('')
  return `<ul>${errorMessages}</ul>`
}

const canPrevious = () => {
  return isMulti() && formData.value.__step > 0
}

const toggleMode = (value) => {
  mode.value = value
}

const previousStep = () => {
  if (!canPrevious()) return

  updateFormData()
  recordStore.mergeCaseReportData({
    id: caseReportId.value,
    data: { __step: formData.value.__step - 1 }
  })
  updateProgress()
  errorsRemain.value = false
  errors.value = undefined
  window.scrollTo(0, 0)
}

const canNext = () => {
  return isMulti() && formData.value.__step < getPageCount(crf.value.schema) - 1
}

const nextStep = () => {
  if (!canNext()) return

  updateFormData()
  onValidate()
  // if no error in the step, continue
  if (errorsRemain.value) {
    Notify.create({
      message: t('validation_errors', { errors: formatErrorMessages() }),
      html: true,
      color: 'negative'
    })
  } else {
    recordStore.mergeCaseReportData({
      id: caseReportId.value,
      data: { __step: formData.value.__step + 1 }
    })
    updateProgress()
    window.scrollTo(0, 0)
  }
}

const updateFormData = () => {
  recordStore.setCaseReportData({
    id: caseReportId.value,
    data: formData.value
  })
}

const onValidate = () => {
  errors.value = form.value.validate()
  errorsRemain.value = errors.value.length > 0
}

const onComplete = () => {
  updateFormData()
  onValidate()
  if (errorsRemain.value) {
    Notify.create({
      message: t('validation_errors', { errors: formatErrorMessages() }),
      html: true,
      color: 'negative'
    })
  } else {
    recordStore.completeCaseReport({
      id: caseReportId.value,
      user: user.value.email,
      revision: crf.value.revision
    }).then(() => {
      recordStore.saveCaseReport({
        id: caseReportId.value,
        user: user.value.email
      })
    }).then(() => {
      router.push('/')
    })
  }
}

const onPause = () => {
  updateFormData()
  recordStore.pauseCaseReport({
    id: caseReportId.value,
    user: user.value.email
  }).then(() => {
    router.push('/')
  })
}

const tr = (key) => {
  return makeSchemaFormTr(crf.value.schema, { locale: currentLocale.value })(key)
}

const md = (text) => {
  return text ? marked.parse(tr(text), { headerIds: false, mangle: false }) : text
}

const onFormDataUpdated = () => {
  if (autoSavePending.value) return
  // save locally changed form data automatically after at least 5 seconds
  if (lastAutoSave.value === null || Date.now() - lastAutoSave.value > 5000) {
    autoSavePending.value = true
    updateFormData()
    lastAutoSave.value = Date.now()
    console.debug('Form data auto saved locally')
    autoSavePending.value = false
  }
}

// Watchers
watch(mode, (newValue, oldValue) => {
  updateFormData()
  updateProgress()
})

// Lifecycle hooks
onMounted(() => {
  const caseReport = recordStore.getCaseReportById(user.value, caseReportId.value)
  if (caseReport) {
    crf.value = crfs.value ? crfs.value.filter(f => f._id === caseReport.crfId).pop() : { schema: { items: [] } }
    if (crf.value.schema.layout) {
      mode.value = crf.value.schema.layout
    }
    if (!caseReport.data || !caseReport.data.__step) {
      recordStore.mergeCaseReportData({
        id: caseReportId.value,
        data: { __step: 0 }
      })
    }
    lang.value = {
      requiredField: t('required_field')
    }
    formData.value = caseReport.data
    updateProgress()
    remountCounter.value++
  } else {
    console.error('No such record with id: ' + caseReportId.value)
    router.push('/')
  }
})
</script>
