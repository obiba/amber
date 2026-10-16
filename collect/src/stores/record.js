import { defineStore } from 'pinia'
import { ref } from 'vue'
import { secureStorage } from './index'
import caseReportService from '../services/record'
import { t } from '../boot/i18n'
import { Notify } from 'quasar'

export const useRecordStore = defineStore('record', () => {
  // State
  const user = ref(null)
  const caseReports = ref([])
  const caseReportsInProcess = ref({})
  const caseReportsInError = ref({})

  // Actions
  function getCaseReportById (userParam, id) {
    return caseReports.value.filter(rec => rec.id === id && userParam && rec.actions[0].user === userParam.email).pop()
  }

  function getCaseReportsCount (userParam) {
    return caseReports.value.filter(rec => userParam && rec.actions[0].user === userParam.email).length
  }

  function getCaseReports (userParam) {
    return caseReports.value.filter(rec => userParam && rec.actions[0].user === userParam.email)
  }

  async function initUser (payload) {
    user.value = payload
  }

  async function initCaseReport (payload) {
    const recordId = caseReports.value.map(cr => cr.id).reduce((a, b) => Math.max(a, b), 0) + 1 + ''
    const record = {
      id: recordId,
      crfId: payload.crf._id,
      state: 'in_progress',
      data: payload.data ? payload.data : {},
      actions: [{
        timestamp: Date.now(),
        user: payload.user,
        type: 'init'
      }]
    }
    addCaseReport(record)
    return recordId
  }

  function addCaseReport (payload) {
    // add case report if not already done
    const record = caseReports.value.filter(rec => rec.id === payload.id).pop()
    if (!record) {
      if (!payload.actions) {
        payload.actions = [{
          timestamp: Date.now(),
          type: 'init'
        }]
      }
      caseReports.value.push(payload)
    }
  }

  async function deleteCaseReport (payload) {
    caseReports.value = caseReports.value.filter(rec => rec.id !== payload.id)
    delete caseReportsInProcess.value[payload.id]
    delete caseReportsInError.value[payload.id]
  }

  function lockCaseReport (payload) {
    if (payload.lock) {
      caseReportsInProcess.value[payload.id] = true
    } else {
      delete caseReportsInProcess.value[payload.id]
    }
  }

  function markCaseReportInError (payload) {
    if (payload.error) {
      caseReportsInError.value[payload.id] = true
    } else {
      delete caseReportsInError.value[payload.id]
    }
  }

  async function setCaseReportData (payload) {
    const record = caseReports.value.filter(rec => rec.id === payload.id).pop()
    if (record) {
      record.data = payload.data
    } else {
      console.error('Record could not be found: ' + payload.id)
    }
  }

  async function mergeCaseReportData (payload) {
    const record = caseReports.value.filter(rec => rec.id === payload.id).pop()
    if (record) {
      if (record.data) {
        for (const key in payload.data) {
          record.data[key] = payload.data[key]
        }
      } else {
        record.data = payload.data
      }
    } else {
      console.error('Record could not be found: ' + payload.id)
    }
  }

  function addCaseReportAction (payload) {
    const record = caseReports.value.filter(rec => rec.id === payload.id).pop()
    if (record) {
      if (!record.actions) {
        record.actions = []
      }
      record.actions.push(payload.action)
      if (payload.action.type === 'complete') {
        record.state = 'completed'
      } else if (payload.action.type === 'save') {
        record.state = 'saved'
        record.data = { _id: record.data._id }
      }
      if (payload.revision) {
        record.revision = payload.revision
      }
    } else {
      console.error('Record could not be found: ' + payload.id)
    }
  }

  async function pauseCaseReport (payload) {
    addCaseReportAction({
      id: payload.id,
      action: {
        timestamp: Date.now(),
        user: payload.user,
        type: 'pause'
      }
    })
  }

  async function completeCaseReport (payload) {
    addCaseReportAction({
      id: payload.id,
      revision: payload.revision,
      action: {
        timestamp: Date.now(),
        user: payload.user,
        type: 'complete'
      }
    })
  }

  async function saveCaseReport (payload) {
    if (caseReportsInProcess.value[payload.id]) {
      console.log(`CR #${payload.id} is already being processed`)
      return
    }
    if (caseReportsInError.value[payload.id] && !payload.force) {
      console.log(`CR #${payload.id} is in error`)
      return
    }

    lockCaseReport({
      id: payload.id,
      lock: true
    })

    const caseReport = caseReports.value.filter(rec => rec.id === payload.id).pop()
    const result = await caseReportService
      .saveCaseReport(caseReport)
      .catch(err => {
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
                message: t('error.save_case_report'),
                color: 'negative'
              })
              markCaseReportInError({
                id: payload.id,
                error: true
              })
            }
          } else if (!err.status) {
            Notify.create({
              message: t('error.save_case_report_error'),
              color: 'warning'
            })
            markCaseReportInError({
              id: payload.id,
              error: true
            })
          }
        }
        lockCaseReport({
          id: payload.id,
          lock: false
        })
      })

    if (result) {
      lockCaseReport({
        id: payload.id,
        lock: false
      })

      addCaseReportAction({
        id: payload.id,
        revision: payload.revision,
        action: {
          timestamp: Date.now(),
          user: payload.user,
          type: 'save'
        }
      })

      if (payload.silent !== true) {
        Notify.create({
          message: t('success.save_case_report'),
          color: 'positive',
          icon: 'fas fa-check'
        })
      }
    }
  }

  return {
    // State
    user,
    caseReports,
    caseReportsInProcess,
    caseReportsInError,
    // Actions
    getCaseReportById,
    getCaseReportsCount,
    getCaseReports,
    initUser,
    initCaseReport,
    addCaseReport,
    deleteCaseReport,
    lockCaseReport,
    markCaseReportInError,
    setCaseReportData,
    mergeCaseReportData,
    addCaseReportAction,
    pauseCaseReport,
    completeCaseReport,
    saveCaseReport
  }
}, {
  persist: {
    key: 'record',
    storage: secureStorage
  }
})
