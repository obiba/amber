import { LocalStorage } from 'quasar'
import { api } from '../../boot/axios'

const save = (blob, fileName) => {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName || 'file')
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => window.URL.revokeObjectURL(url), 1000)
}

/** the file name of a Content-Disposition header */
const dispositionName = (header) => {
  if (!header) return undefined
  const encoded = /filename\*=UTF-8''([^;]+)/i.exec(header)
  if (encoded) return decodeURIComponent(encoded[1])
  const plain = /filename="?([^";]+)"?/i.exec(header)
  return plain ? plain[1] : undefined
}

/**
 * Download a stored file (a file item, or the id of a single file control) with the user token,
 * a link cannot carry the Authorization header.
 */
export async function downloadFile (item) {
  const id = typeof item === 'string' ? item : (item.id || item.path)
  const response = await api.get(`/files/${id}`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${LocalStorage.getItem('feathers-jwt')}` }
  })
  save(response.data, (typeof item === 'object' && item.fileName !== id && item.fileName) || dispositionName(response.headers['content-disposition']) || id)
}

/**
 * The file upload hooks of the form previews: the files are not uploaded, they are kept in the
 * browser as object URLs.
 */
export const previewFileUpload = {
  upload: async (file, context) => {
    const ref = { id: window.URL.createObjectURL(file), fileName: file.name, size: file.size, contentType: file.type }
    return context && context.schema && context.schema.type === 'string' ? ref.id : ref
  },
  remove: (item) => {
    const id = item.id || item.path
    if (id && id.startsWith('blob:')) window.URL.revokeObjectURL(id)
  },
  download: async (item) => {
    const id = item.id || item.path
    if (id && id.startsWith('blob:')) {
      const link = document.createElement('a')
      link.href = id
      link.setAttribute('download', item.fileName !== id ? item.fileName : 'file')
      link.click()
    }
  }
}

const collectRefs = (prop, value, path, refs) => {
  if (!prop || value === undefined || value === null) return refs
  if (prop.format === 'file') {
    if (typeof value === 'string') refs.push({ id: value, path })
  } else if (prop.format === 'files') {
    const items = Array.isArray(value) ? value : (value && typeof value === 'object' ? Object.values(value).find(Array.isArray) : undefined)
    ;(items || []).forEach(item => item && item.id && refs.push({ ...item, path }))
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collectRefs(prop.items, item, `${path}[${i}]`, refs))
  } else if (typeof value === 'object' && prop.properties) {
    Object.entries(prop.properties).forEach(([name, p]) => collectRefs(p, value[name], path ? `${path}.${name}` : name, refs))
  }
  return refs
}

/**
 * The files referenced by the data, found with the file controls of a JSON Forms form schema,
 * as `[{ id, fileName, path }]` (no `fileName` for a single file control).
 */
export function fileRefs (schema, data) {
  return schema && schema.uischema ? collectRefs(schema.schema, data, '', []) : []
}
