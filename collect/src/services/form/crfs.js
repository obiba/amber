import { feathersClient } from '../../boot/feathersClient'

export async function getCaseReportForms (filter) {
  const formData = {
    query: {
      $limit: 100
    }
  }
  return feathersClient.service('crfs').find(formData)
}
