import { feathersClient } from '../../boot/feathersClient'
import { fileQueue, resetUploads } from './files'

/** the uploaded files were deleted (pending for too long) or attached by a create whose response was lost */
const isInvalidFile = (err) => err.code === 400 && /^Not a valid file:/.test(err.message)

const create = async (caseReport) => {
  // the queued files are uploaded first, and referenced by their server ids
  const data = await fileQueue.flush(caseReport.data)
  return { data, result: await feathersClient.service('case-report').create({ ...caseReport, data }) }
}

export async function saveCaseReport (caseReport) {
  const { data, result } = await create(caseReport).catch(async err => {
    if (!isInvalidFile(err)) throw err
    // upload the files again, once
    await resetUploads(caseReport.data)
    return create(caseReport)
  })
  await fileQueue.clear(data).catch(err => console.error(err))
  return result
}
