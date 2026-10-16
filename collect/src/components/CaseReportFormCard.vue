<template>
  <q-card-section>
    <q-item class="q-pa-none">
      <q-item-section avatar>
        <div class="bg-amber-soft rounded-borders q-pa-sm">
          <q-icon color="primary" name="list_alt" size="md" />
        </div>
      </q-item-section>
      <q-item-section>
        <q-item-label>
          <span class="text-bold text-h3">{{ tr(form.name ? form.name : form.schema.label) }}</span>
          <q-badge v-if="form.revision &&!$q.screen.lt.sm" :label="'v' + form.revision" color="amber-soft" class="text-primary q-ml-sm"/>
        </q-item-label>
        <q-item-label class="text-body2 text-grey-6">
          <div v-html="md(truncate(tr(form.description ? form.description : form.schema.description)))"/>
        </q-item-label>
      </q-item-section>
      <q-item-section v-if="!$q.screen.lt.sm" side top>
        <q-btn
          :label="$t('start')"
          :icon-right="$q.lang.rtl ? 'chevron_left' : 'chevron_right'"
          color="primary"
          no-caps
          class="q-mt-sm q-mb-sm"
          @click="onStart"/>
      </q-item-section>
    </q-item>
    <q-item v-if="$q.screen.lt.sm" class="q-pa-none">
      <q-item-section avatar>
        <q-badge v-if="form.revision" :label="'v' + form.revision" color="amber-soft" class="text-primary"/>
      </q-item-section>
      <q-item-section>
      </q-item-section>
      <q-item-section side>
        <q-btn
          :label="$t('start')"
          :icon-right="$q.lang.rtl ? 'chevron_left' : 'chevron_right'"
          color="primary"
          no-caps
          @click="onStart"/>
      </q-item-section>
    </q-item>
  </q-card-section>

  <q-dialog v-model='showCaseReportFormDetails' full-width position="bottom">
    <q-card>
      <q-card-section>
        <q-item-label>
          <span class="text-bold">{{ tr(form.name ? form.name : form.schema.label) }}</span>
        </q-item-label>
        <q-item-label caption>{{ 'v' + form.revision }}</q-item-label>
      </q-card-section>
      <q-separator/>
      <q-card-section>
        <q-item-label caption>
          <div v-html="md(tr(form.description ? form.description : form.schema.description))"/>
        </q-item-label>
      </q-card-section>
      <q-card-section>
      </q-card-section>
    </q-card>
  </q-dialog>

  <q-dialog v-model='showCreateCaseReportRecord' persistent>
    <q-card>
      <q-card-section>
        <div>
          <AmberForm
            ref="idForm"
            :key="remountCounter"
            :schema="idSchema"
            v-model="formData"
            :locale="currentLocale" />
        </div>
      </q-card-section>
      <q-card-actions align='right'>
        <q-btn :label="$t('cancel')" flat v-close-popup />
        <q-btn
          @click='startRecord'
          :label="$t('start')"
          type='submit'
          color='positive'
          v-close-popup
        >
          <template v-slot:loading>
            <q-spinner-facebook />
          </template>
        </q-btn>
      </q-card-actions>
    </q-card>
  </q-dialog>

</template>

<script setup>
import { ref, computed, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { storeToRefs } from 'pinia'
import { marked } from 'marked'
import { AmberForm, makeSchemaFormTr } from '@obiba/quasar-ui-amber'
import { useRecordStore } from '../stores/record'

const props = defineProps({
  form: {
    type: Object,
    required: true
  }
})

const $q = useQuasar()
const router = useRouter()
const recordStore = useRecordStore()
const { user } = storeToRefs(recordStore)

const showCaseReportFormDetails = ref(false)
const showCreateCaseReportRecord = ref(false)
const remountCounter = ref(0)
const formData = ref({})
const idSchema = ref({ items: [] })
const idForm = ref(null)

const instance = getCurrentInstance()
const currentLocale = computed(() => instance?.proxy?.$root?.$i18n?.locale)

const tr = (key) => {
  return makeSchemaFormTr(props.form.schema, { locale: currentLocale.value })(key)
}

const truncate = (text) => {
  if (!text) return text
  const sentences = text.split('.')
  return sentences[0] + (sentences.length > 1 && sentences[1] !== '' ? '...' : '.')
}

const md = (text) => {
  return text ? marked.parse(tr(text), { headerIds: false, mangle: false }) : text
}

const onStart = () => {
  idSchema.value = {
    items: [{
      name: '_id',
      type: 'text',
      label: props.form.schema.idLabel ? props.form.schema.idLabel : 'ID',
      description: props.form.schema.idDescription,
      mask: props.form.schema.idMask,
      validation: props.form.schema.idValidation,
      validationMessage: props.form.schema.idValidationMessage,
      required: true
    }],
    i18n: props.form.schema.i18n || props.form.schema.translations
  }
  formData.value = {}
  remountCounter.value++
  showCreateCaseReportRecord.value = true
}

const startRecord = () => {
  if (idForm.value.validate().length === 0) {
    recordStore.initCaseReport({
      crf: props.form,
      data: formData.value,
      user: user.value.email
    }).then((recordId) => {
      router.push('/case-report/' + recordId)
    })
  }
}
</script>
