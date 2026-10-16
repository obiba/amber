import { defineStore } from 'pinia'
import { ref } from 'vue'
import { secureStorage } from './index'
import crfsService from '../services/form'
import { t } from '../boot/i18n'
import { Notify } from 'quasar'

export const useFormStore = defineStore('form', () => {
  // State
  const crfs = ref([])
  const data = ref({})

  // Actions
  async function getCaseReportForms (payload = {}) {
    const result = await crfsService.getCaseReportForms(payload.filter).catch(err => {
      const errorCode = err.code
      if (!payload.silent) {
        if (errorCode) {
          console.error(err)
          if (errorCode === 401) {
            Notify.create({
              message: t('error.reauthenticate'),
              color: 'negative'
            })
          } else {
            Notify.create({
              message: t('error.get_case_report_forms'),
              color: 'negative'
            })
          }
        } else if (!err.status) {
          window.location.reload()
        }
      }
    })

    if (result) {
      crfs.value = [...result.data]
    }
  }

  function clearCaseReportForms () {
    crfs.value = []
  }

  function setCaseReportFormData (payload) {
    if (!data.value[payload.user]) {
      data.value[payload.user] = {}
    }
    data.value[payload.user][payload.form] = payload.data
  }

  return {
    // State
    crfs,
    data,
    // Actions
    getCaseReportForms,
    clearCaseReportForms,
    setCaseReportFormData
  }
}, {
  persist: {
    key: 'form',
    storage: secureStorage
  }
})
