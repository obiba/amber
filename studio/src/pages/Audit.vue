<template>
  <q-page>
    <div class="q-pa-md" :class="settings.theme.header2">
      <q-breadcrumbs>
        <q-breadcrumbs-el icon="home" to="/" />
        <q-breadcrumbs-el :label="t('audit.title')" />
      </q-breadcrumbs>
    </div>
    <q-separator/>

    <div class="q-pa-md">
      <div class="text-h5 q-mb-sm">{{t('audit.title')}}</div>
      <div class="text-body2 text-secondary q-mb-md">
        {{t('audit.hint')}}
      </div>
      <q-table
          flat
          :rows='audits'
          :columns='columns'
          row-key='_id'
          v-model:pagination='paginationOpts'
          @request='getTableAudits'
        >
        <template v-slot:top>
          <q-select
            v-model="filters.service"
            :options="serviceOptions"
            :label="t('audit.service')"
            emit-value
            map-options
            clearable
            dense
            style="min-width: 200px"
            class="q-mr-md"
            @update:model-value="refresh" />
          <q-select
            v-model="filters.apiKey"
            :options="apiKeyOptions"
            :label="t('audit.api_key')"
            emit-value
            map-options
            clearable
            dense
            style="min-width: 200px"
            class="q-mr-md"
            @update:model-value="refresh" />
          <q-input
            v-for="key in ['from', 'to']"
            :key="key"
            v-model="filters[key]"
            :label="t(key)"
            mask="####-##-##"
            clearable
            dense
            style="max-width: 160px"
            class="q-mr-md"
            @update:model-value="refresh">
            <template v-slot:prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="filters[key]" mask="YYYY-MM-DD" @update:model-value="refresh">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup :label="t('close')" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </template>
        <template v-slot:body-cell-accessedBy='props'>
          <q-td :props='props'>
            <q-badge v-if="props.row.apiKey" color="accent" :title="t('audit.api_key')">
              <q-icon name="key" class="q-mr-xs"/>{{ props.row.apiKey.name }}
            </q-badge>
            <span v-else-if="accessor(props.row).participant">
              <q-icon name="person" class="q-mr-xs" :title="t('audit.participant')"/>{{ accessor(props.row).name }}
            </span>
            <span v-else>{{ accessor(props.row).name }}</span>
          </q-td>
        </template>
        <template v-slot:body-cell-details='props'>
          <q-td :props='props'>
            <div v-if="props.row.service === 'files' && props.row.data">
              {{ props.row.data.fileName }}
              <span v-if="props.row.data.record" class="text-grey-7">({{ props.row.data.record.service }})</span>
            </div>
            <code v-else class="text-caption" style="white-space: normal">{{ queryLabel(props.row.query) }}</code>
          </q-td>
        </template>
      </q-table>
    </div>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { date } from 'quasar'
import { settings } from '../boot/settings'
import { auditService, apiKeyService } from '../services/group'
import userService from '../services/user'
import { errorHandler } from '../boot/errors'

const { t } = useI18n()
const route = useRoute()

const audits = ref([])
const users = ref({})
const participants = ref({})
const apiKeys = ref([])
const filters = ref({ apiKey: route.query.apiKey || null })
const paginationOpts = ref({
  sortBy: 'createdAt',
  descending: true,
  page: 1,
  rowsPerPage: 20,
  rowsNumber: 0
})

const columns = [
  { name: 'createdAt', label: t('audit.date'), align: 'left', field: 'createdAt', format: val => date.formatDate(val, 'YYYY-MM-DD HH:mm:ss'), sortable: true },
  { name: 'accessedBy', label: t('audit.accessed_by'), align: 'left', field: 'accessedBy' },
  { name: 'service', label: t('audit.service'), align: 'left', field: 'service', format: val => t(`audit.services.${val}`), sortable: true },
  { name: 'details', label: t('audit.details'), align: 'left', field: 'query' }
]

const serviceOptions = ['case-report-export', 'interview-export', 'files']
  .map(value => ({ value, label: t(`audit.services.${value}`) }))
const apiKeyOptions = computed(() => apiKeys.value.map(k => ({ value: k._id, label: k.name })))

// the name recorded in the entry, or of the existing user or participant (older entries)
function accessor (row) {
  const id = row.accessedBy
  if (row.accessedByName) return { name: row.accessedByName, participant: row.accessedByType === 'participant' }
  if (users.value[id]) return { name: users.value[id].email }
  if (participants.value[id]) return { name: participants.value[id].code, participant: true }
  return { name: id }
}

// the export criteria, without the paging
function queryLabel (query) {
  try {
    const { $limit, $skip, ...criteria } = JSON.parse(query || '{}')
    return Object.keys(criteria).length > 0 ? JSON.stringify(criteria) : ''
  } catch {
    return query
  }
}

async function getTableAudits (requestProp) {
  if (requestProp) {
    paginationOpts.value = requestProp.pagination
  }
  try {
    const result = await auditService.getAudits(paginationOpts.value, {
      ...filters.value,
      // local days, the whole day of the upper bound
      from: filters.value.from ? `${filters.value.from}T00:00:00` : null,
      to: filters.value.to ? `${filters.value.to}T23:59:59.999` : null
    })
    audits.value = result.data || []
    paginationOpts.value.rowsNumber = result.total || 0
    const unknown = () => [...new Set(audits.value
      .filter(a => !a.accessedByName && a.accessedBy && !users.value[a.accessedBy] && !participants.value[a.accessedBy])
      .map(a => a.accessedBy))]
    let ids = unknown()
    if (ids.length > 0) {
      const found = await userService.getUsersByIds(ids)
      found.data.forEach(user => { users.value[user._id] = user })
      ids = unknown()
    }
    if (ids.length > 0) {
      const found = await auditService.getParticipantsByIds(ids)
      found.data.forEach(participant => { participants.value[participant._id] = participant })
    }
  } catch (err) {
    errorHandler.onError(err, t('error.get_audits'))
    audits.value = []
  }
}

function refresh () {
  paginationOpts.value.page = 1
  getTableAudits()
}

onMounted(async () => {
  getTableAudits()
  apiKeys.value = (await apiKeyService.getApiKeys({ page: 1, rowsPerPage: 0 })).data
})
</script>
