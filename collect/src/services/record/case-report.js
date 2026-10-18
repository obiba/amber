import { feathersClient } from '../../boot/feathersClient'
import { fileQueue } from './files'

export async function saveCaseReport (caseReport) {
  // the queued files are uploaded first, and referenced by their server ids
  const data = await fileQueue.flush(caseReport.data)
  const result = await feathersClient.service('case-report').create({ ...caseReport, data })
  await fileQueue.clear(data).catch(err => console.error(err))
  return result
}
