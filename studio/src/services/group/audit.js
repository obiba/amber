import { feathersClient } from '../../boot/feathersClient'

export async function getAudits (opts, filters) {
  const query = {
    // qtable pagination's 'All' sets limit to 0
    $limit: opts.rowsPerPage === 0 ? 1000 : opts.rowsPerPage,
    $skip: (opts.page - 1) * opts.rowsPerPage,
    $sort: { [opts.sortBy || 'createdAt']: opts.descending ? -1 : 1 }
  }
  if (filters.service) query.service = filters.service
  if (filters.apiKey) query['apiKey._id'] = filters.apiKey
  if (filters.from || filters.to) {
    query.createdAt = {}
    if (filters.from) query.createdAt.$gte = new Date(filters.from)
    if (filters.to) query.createdAt.$lte = new Date(filters.to)
  }
  return feathersClient.service('audit').find({ query })
}

// the codes of the participants who accessed, for the entries without a name
export async function getParticipantsByIds (ids) {
  return feathersClient.service('participant').find({
    query: { _id: { $in: ids }, $select: ['_id', 'code'], $limit: ids.length }
  })
}
