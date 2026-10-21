import { feathersClient } from '../../boot/feathersClient'

export async function getApiKeys (opts) {
  const formData = { query: { $sort: {} } }
  // qtable pagination's 'All' sets limit to 0
  formData.query.$limit = opts.rowsPerPage === 0 ? 1000 : opts.rowsPerPage
  formData.query.$skip = (opts.page - 1) * opts.rowsPerPage
  if (opts.sortBy) {
    formData.query.$sort[opts.sortBy] = opts.descending ? -1 : 1
  }
  return feathersClient.service('api-key').find(formData)
}

export async function createApiKey (apiKey) {
  return feathersClient.service('api-key').create(apiKey)
}

export async function updateApiKey (apiKey, id) {
  return feathersClient.service('api-key').patch(id, apiKey)
}

export async function deleteApiKey (id) {
  return feathersClient.service('api-key').remove(id)
}
