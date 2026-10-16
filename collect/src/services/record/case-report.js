import { feathersClient } from '../../boot/feathersClient'

export async function saveCaseReport (caseReport) {
  return feathersClient.service('case-report').create(caseReport)
}
