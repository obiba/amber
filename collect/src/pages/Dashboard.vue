<template>
  <q-page v-cloak>

    <div class="q-py-md bg-white" style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding-left: 16px; padding-right: 16px;">
      <q-btn
        :label="$t('main.forms')"
        no-caps
        unelevated
        :color="tab === 'forms' ? 'amber-soft' : 'white'"
        :class="tab === 'forms' ? 'text-ink' : 'text-muted'"
        @click="tab = 'forms'" />
      <q-btn
        no-caps
        unelevated
        :color="tab === 'in_progress' ? 'amber-soft' : 'white'"
        :class="tab === 'in_progress' ? 'text-ink' : 'text-muted'"
        @click="tab = 'in_progress'">
        <div>
          <span>{{ $t('main.in_progress') }}</span>
          <q-badge v-if="notSavedCaseReports.length" :color="tab === 'in_progress' ? 'primary' : 'grey-5'" class="q-ml-sm">{{ notSavedCaseReports.length }}</q-badge>
        </div>
      </q-btn>
    </div>

    <q-separator />

    <q-tab-panels v-model="tab" class="bg-page">
      <q-tab-panel name="forms">
        <q-pull-to-refresh @refresh="onRefresh">
          <div class="row">
            <div class="col">
            </div>
            <div class="col-md-6 col-sm-8 col-xs-12">
              <div class="text-h3 text-bold q-mb-md">{{ $t('main.case_report_forms') }}</div>
              <div v-if="crfs.length>0">
                <q-list>
                  <q-item v-for="form in crfs" :key="form._id" class="q-px-none">
                    <q-item-section>
                      <q-card class="ac-card">
                        <case-report-form-card :form="form"/>
                      </q-card>
                    </q-item-section>
                  </q-item>
                </q-list>
              </div>
              <div v-else class="text-grey">
                {{ $t('main.no_case_report_forms') }}
              </div>
            </div>
            <div class="col">
            </div>
          </div>
        </q-pull-to-refresh>
      </q-tab-panel>

      <q-tab-panel name="in_progress">
        <div v-if="notSavedCaseReports.length" class="row">
          <div class="col">
          </div>
          <div class="col-md-6 col-sm-8 col-xs-12">
            <div class="text-h3 text-bold q-mb-md">{{ $t('main.case_reports_in_progress') }}</div>
            <q-list>
              <q-item v-for="cr in notSavedCaseReports" :key="cr.id" class="q-px-none">
                <q-item-section>
                  <q-card class="ac-card">
                    <q-card-section>
                      <q-item class="q-pa-none">
                        <q-item-section avatar>
                          <div class="bg-surface rounded-borders q-pa-sm">
                            <q-icon color="secondary" name="list_alt" size="md" />
                          </div>
                        </q-item-section>
                        <q-item-section>
                          <q-item-label>
                            <span class="text-grey q-mr-sm">#{{ cr.id }}</span>
                            <span class="text-h3 text-bold">{{ getCaseReportId(cr) }}</span>
                          </q-item-label>
                          <q-item-label>{{ getFormLabel(cr.crfId) }}</q-item-label>
                        </q-item-section>
                        <q-item-section v-if="!$q.screen.lt.sm" side top>
                          <q-btn
                            v-if="cr.state === 'in_progress'"
                            :label="$t('resume')"
                            :icon-right="$q.lang.rtl ? 'chevron_left' : 'chevron_right'"
                            class="text-capitalize q-mt-sm q-mb-sm"
                            color="secondary"
                            :to="'/case-report/' + cr.id"/>
                          <q-btn
                            v-if="cr.state === 'completed'"
                            :label="$t('save')"
                            icon-right="cloud_upload"
                            class="text-capitalize q-mt-sm q-mb-sm"
                            color="primary"
                            @click="onSave(cr)"/>
                          <q-item-label :title="getCaseReportLastUpdate(cr)" class="text-caption text-grey">{{ getCaseReportLastUpdateAgo(cr) }}</q-item-label>
                        </q-item-section>
                      </q-item>
                      <q-item v-if="$q.screen.lt.sm" class="q-pa-none">
                        <q-item-section>
                          <q-item-label :title="getCaseReportLastUpdate(cr)" class="text-caption text-grey">{{ getCaseReportLastUpdateAgo(cr) }}</q-item-label>
                        </q-item-section>
                        <q-item-section side>
                          <q-btn
                            v-if="cr.state === 'in_progress'"
                            :label="$t('resume')"
                            :icon-right="$q.lang.rtl ? 'chevron_left' : 'chevron_right'"
                            class="text-capitalize q-mt-sm q-mb-sm"
                            color="secondary"
                            :to="'/case-report/' + cr.id"/>
                          <q-btn
                            v-if="cr.state === 'completed'"
                            :label="$t('save')"
                            icon-right="cloud_upload"
                            class="text-capitalize q-mt-sm q-mb-sm"
                            color="primary"
                            @click="onSave(cr)"/>
                        </q-item-section>
                      </q-item>
                    </q-card-section>
                  </q-card>
                </q-item-section>
              </q-item>
            </q-list>
            <div class="text-center q-mt-md">
              <q-btn
                to="/case-reports"
                :label="$t('main.show_all_case_reports')"
                color="amber-soft"
                class="text-ink"
                no-caps
                unelevated />
            </div>
          </div>
          <div class="col">
          </div>
        </div>
        <div v-else class="text-grey">
          {{ $t('main.no_case_reports_in_progress') }}
        </div>
      </q-tab-panel>

    </q-tab-panels>

  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import { makeSchemaFormTr } from '@obiba/quasar-ui-amber'
import CaseReportFormCard from '@/components/CaseReportFormCard.vue'
import { useFormStore } from '../stores/form'
import { useRecordStore } from '../stores/record'

const $q = useQuasar()
const formStore = useFormStore()
const recordStore = useRecordStore()
const { locale: currentLocale } = useI18n()

const { crfs } = storeToRefs(formStore)
const { user } = storeToRefs(recordStore)

const tab = ref('forms')

const caseReports = computed(() => {
  return recordStore.getCaseReports(user.value)
})

const getForm = (crfId) => {
  return crfs.value.filter(f => f._id === crfId).pop()
}

const notSavedCaseReports = computed(() => {
  return caseReports.value
    .filter(cr => ['in_progress', 'completed'].includes(cr.state) && getForm(cr.crfId))
    .sort((cr1, cr2) => {
      const action1 = cr1.actions[cr1.actions.length - 1]
      const action2 = cr2.actions[cr2.actions.length - 1]
      return action2.timestamp - action1.timestamp
    })
})

const tr = (schema, key) => {
  return schema ? makeSchemaFormTr(schema, { locale: currentLocale.value })(key) : '-'
}

const getFormLabel = (crfId) => {
  const form = getForm(crfId)
  return form ? tr(form.schema, form.name ? form.name : form.schema.label) : '?'
}

const getCaseReportId = (cr) => {
  return (cr.data && cr.data._id) ? cr.data._id : ''
}

const getCaseReportLastUpdate = (cr) => {
  const action = cr.actions[cr.actions.length - 1]
  return new Intl.DateTimeFormat(currentLocale.value, { dateStyle: 'full', timeStyle: 'short' }).format(action.timestamp)
}

const getCaseReportLastUpdateAgo = (cr) => {
  const action = cr.actions[cr.actions.length - 1]
  const rtf = new Intl.RelativeTimeFormat(currentLocale.value, { style: 'long' })
  const minutes = Math.ceil((action.timestamp - Date.now()) / 60000)
  if (minutes <= -1440) {
    return rtf.format(Math.ceil(minutes / 1440), 'day')
  }
  if (minutes <= -60) {
    return rtf.format(Math.ceil(minutes / 60), 'hour')
  }
  return rtf.format(minutes, 'minute')
}

const onRefresh = (done) => {
  formStore.getCaseReportForms({}).then(() => done())
}

const onSave = (caseReport) => {
  recordStore.saveCaseReport({ id: caseReport.id, force: true })
}

onMounted(() => {
  formStore.getCaseReportForms({ silent: true })
})
</script>
