<template>
  <q-page>
    <div class="q-pa-md" :class="settings.theme.header2">
      <q-breadcrumbs>
        <q-breadcrumbs-el icon="home" to="/" />
        <q-breadcrumbs-el :label="t('api_keys.title')" />
      </q-breadcrumbs>
    </div>
    <q-separator/>

    <div class="q-pa-md">
      <div class="text-h5 q-mb-sm">{{t('api_keys.title')}}</div>
      <div class="text-body2 text-secondary q-mb-md">
        {{t('api_keys.hint')}}
      </div>
      <q-table
          flat
          :rows='apiKeys'
          :columns='columns'
          row-key='_id'
          v-model:pagination='paginationOpts'
          @request='getTableApiKeys'
        >
        <template v-slot:top>
          <q-btn
            color="primary"
            icon="add"
            :title="t('api_keys.add_hint')"
            size="sm"
            @click="editApiKey()" />
        </template>
        <template v-slot:body-cell-prefix='props'>
          <q-td :props='props'>
            <code>{{ props.row.prefix }}…</code>
          </q-td>
        </template>
        <template v-slot:body-cell-studies='props'>
          <q-td :props='props'>
            <q-badge v-for="id in props.row.studies" :key="id" color="info" class="q-mr-xs">
              {{ studyName(id) }}
            </q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-active='props'>
          <q-td :props='props'>
            <q-toggle
              :model-value="props.row.active !== false"
              @update:model-value="val => save({ active: val }, props.row._id)" />
            <q-badge v-if="isExpired(props.row)" color="negative">{{ t('api_keys.expired') }}</q-badge>
          </q-td>
        </template>
        <template v-slot:body-cell-action='props'>
          <q-td :props='props'>
            <q-btn
              color="secondary"
              size="12px"
              flat
              dense
              round
              :title="t('api_keys.edit_hint')"
              icon='edit'
              @click='editApiKey(props.row)' />
            <q-btn
              color="secondary"
              size="12px"
              flat
              dense
              round
              :title="t('api_keys.audit_hint')"
              icon='policy'
              :to="'/audit?apiKey=' + props.row._id" />
            <q-btn
              color="secondary"
              size="12px"
              flat
              dense
              round
              :title="t('api_keys.regenerate_hint')"
              icon='autorenew'
              @click='confirm(props.row, "regenerate")' />
            <q-btn
              color="secondary"
              size="12px"
              flat
              dense
              round
              :title="t('api_keys.delete_hint')"
              icon='delete'
              @click='confirm(props.row, "delete")' />
          </q-td>
        </template>
      </q-table>
    </div>

    <q-dialog v-model='showEdit' persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <q-input
            v-model='apiKeyData.name'
            :label="t('name')"
            :hint="t('required')"
            class='q-mb-sm'
          />
          <q-input
            v-model='apiKeyData.description'
            :label="t('description')"
            autogrow
            class='q-mb-sm'
          />
          <q-select
            v-model='apiKeyData.studies'
            :options='studyOptions'
            :label="t('api_keys.studies')"
            :hint="t('api_keys.studies_hint')"
            multiple
            use-chips
            emit-value
            map-options
            class='q-mb-sm'
          />
          <q-input
            v-model='apiKeyData.expiresAt'
            mask="####-##-##"
            clearable
            :label="t('api_keys.expires_at')"
            :hint="t('api_keys.expires_at_hint')"
          >
            <template v-slot:prepend>
              <q-icon name="event" class="cursor-pointer">
                <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                  <q-date v-model="apiKeyData.expiresAt" mask="YYYY-MM-DD">
                    <div class="row items-center justify-end">
                      <q-btn v-close-popup :label="t('close')" color="primary" flat />
                    </div>
                  </q-date>
                </q-popup-proxy>
              </q-icon>
            </template>
          </q-input>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="bg-grey-3">
          <q-btn :label="t('cancel')" flat v-close-popup />
          <q-btn
            @click='saveEdit'
            :disable='!apiKeyData.name || !apiKeyData.studies || apiKeyData.studies.length === 0'
            :label="t(apiKeyData._id ? 'save' : 'add')"
            color='primary'
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model='showConfirm' persistent>
      <q-card>
        <q-card-section>
          <div>{{ t(`api_keys.${confirmAction}_confirm`) }}</div>
          <div class="text-weight-bold text-center q-mt-md">{{ selected.name }}</div>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="bg-grey-3">
          <q-btn :label="t('cancel')" flat v-close-popup />
          <q-btn
            @click='onConfirm'
            :label="t(confirmAction === 'delete' ? 'delete' : 'api_keys.regenerate')"
            color='primary'
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model='showKey' persistent>
      <q-card style="min-width: 400px">
        <q-card-section>
          <div class="text-h6">{{ newKey.name }}</div>
          <q-banner class="bg-warning q-my-md" dense>{{ t('api_keys.shown_once') }}</q-banner>
          <q-input :model-value="newKey.key" readonly outlined>
            <template v-slot:append>
              <q-btn flat round dense icon="content_copy" :title="t('api_keys.copy')" @click="copy" />
            </template>
          </q-input>
        </q-card-section>
        <q-separator />
        <q-card-actions align="right" class="bg-grey-3">
          <q-btn :label="t('close')" color="primary" v-close-popup @click="newKey = {}" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { copyToClipboard, date, Notify } from 'quasar'
import { settings } from '../boot/settings'
import { useAdminStore } from '@/stores/admin'
import { getStudies } from '@/services/study/study'

const { t } = useI18n()
const adminStore = useAdminStore()

const paginationOpts = ref({ ...adminStore.apiKeyPaginationOpts })
const studies = ref([])
const showEdit = ref(false)
const showConfirm = ref(false)
const showKey = ref(false)
const confirmAction = ref('delete')
const selected = ref({})
const apiKeyData = ref({})
const newKey = ref({})

const formatDate = (val) => val ? date.formatDate(val, 'YYYY-MM-DD HH:mm') : ''

const columns = [
  { name: 'name', required: true, label: t('name'), align: 'left', field: 'name', sortable: true },
  { name: 'prefix', label: t('api_keys.key'), align: 'left', field: 'prefix' },
  { name: 'studies', label: t('api_keys.studies'), align: 'left', field: 'studies' },
  { name: 'expiresAt', label: t('api_keys.expires_at'), align: 'left', field: 'expiresAt', format: formatDate, sortable: true },
  { name: 'lastUsedAt', label: t('api_keys.last_used_at'), align: 'left', field: 'lastUsedAt', format: formatDate, sortable: true },
  { name: 'active', label: t('api_keys.active'), align: 'left', field: 'active' },
  { name: 'action', label: t('action'), align: 'left' }
]

const apiKeys = computed(() => adminStore.apiKeys)
const studyOptions = computed(() => studies.value.map(s => ({ label: s.name, value: s._id })))

function studyName (id) {
  const study = studies.value.find(s => s._id === id)
  return study ? study.name : id
}

function isExpired (apiKey) {
  return apiKey.expiresAt && new Date(apiKey.expiresAt) < new Date()
}

async function getTableApiKeys (requestProp) {
  if (requestProp) {
    paginationOpts.value = requestProp.pagination
  }
  await adminStore.getApiKeys(paginationOpts.value)
  paginationOpts.value.rowsNumber = adminStore.apiKeyPaginationOpts.rowsNumber
}

async function save (data, id) {
  const result = await adminStore.saveApiKey(data, id, paginationOpts.value)
  if (result && result.key) {
    newKey.value = result
    showKey.value = true
  }
}

function editApiKey (apiKey) {
  apiKeyData.value = apiKey
    ? { ...apiKey, expiresAt: apiKey.expiresAt ? date.formatDate(apiKey.expiresAt, 'YYYY-MM-DD') : null }
    : { studies: [] }
  showEdit.value = true
}

function saveEdit () {
  const { _id, name, description, studies, expiresAt } = apiKeyData.value
  // the key stays valid until the end of the chosen day, in the local time zone
  const expiry = expiresAt ? date.endOfDate(date.extractDate(expiresAt, 'YYYY-MM-DD'), 'day') : null
  save({ name, description, studies, expiresAt: expiry }, _id)
}

function confirm (apiKey, action) {
  selected.value = apiKey
  confirmAction.value = action
  showConfirm.value = true
}

function onConfirm () {
  if (confirmAction.value === 'delete') {
    adminStore.deleteApiKey(selected.value._id, paginationOpts.value)
  } else {
    save({ regenerate: true }, selected.value._id)
  }
}

function copy () {
  copyToClipboard(newKey.value.key).then(() => {
    Notify.create({ message: t('api_keys.copied'), color: 'positive', icon: 'fas fa-check' })
  })
}

onMounted(async () => {
  getTableApiKeys()
  studies.value = (await getStudies({ page: 1, rowsPerPage: 0 })).data
})
</script>
