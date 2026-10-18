import { makeFileQueue, makeIndexedDBStore } from '@obiba/quasar-ui-amber'
import { api } from '../../boot/axios'
import { feathersClient } from '../../boot/feathersClient'

const authHeaders = async () => ({ Authorization: `Bearer ${await feathersClient.authentication.getAccessToken()}` })

/** an HTTP error as the feathers client reports it (the code is the status), a network error as is */
const toError = (err) => err.response
  ? Object.assign(new Error((err.response.data && err.response.data.message) || err.message), { code: err.response.status })
  : err

const store = makeIndexedDBStore()

/** the files picked in the case report forms, queued in the browser and uploaded when the case report is saved */
export const fileQueue = makeFileQueue({
  store,
  upload: async (blob, { fileName, contentType }) => {
    const headers = { ...(await authHeaders()), 'Content-Type': contentType, 'X-File-Name': encodeURIComponent(fileName) }
    return api.post('/files', blob, { headers }).then(res => res.data).catch(err => { throw toError(err) })
  },
  download: async (item) => {
    const headers = await authHeaders()
    return api.get(`/files/${item.id || item.path}`, { headers, responseType: 'blob' }).then(res => res.data).catch(err => { throw toError(err) })
  }
})

/** forgets the server ids of the queued files of the data (local ids), so that they are uploaded again */
export async function resetUploads (data) {
  const json = JSON.stringify(data)
  for (const entry of await store.getAll()) {
    if (entry.serverId && json.includes(JSON.stringify(entry.id))) {
      delete entry.serverId
      await store.put(entry)
    }
  }
}
