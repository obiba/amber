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
  const quoted = /filename="((?:[^"\\]|\\.)*)"/i.exec(header)
  if (quoted) return quoted[1].replace(/\\(.)/g, '$1')
  const plain = /filename=([^;]+)/i.exec(header)
  return plain ? plain[1].trim() : undefined
}

/**
 * Download a stored file (a file item, or the id of a single file control) with the user token,
 * a link cannot carry the Authorization header.
 */
export async function downloadFile (item) {
  const id = typeof item === 'string' ? item : (item && (item.id || item.path))
  if (!id) throw new Error('The file is not stored')
  const response = await api.get(`/files/${id}`, {
    responseType: 'blob',
    headers: { Authorization: `Bearer ${LocalStorage.getItem('feathers-jwt')}` }
  })
  save(response.data, (typeof item === 'object' && item.fileName !== id && item.fileName) || dispositionName(response.headers['content-disposition']) || id)
}

/**
 * The file upload hooks of a form preview: the files are not uploaded, they are kept in the
 * browser as object URLs, until removed from the form or cleared with `clear()`.
 */
export function createPreviewFileUpload () {
  const urls = new Set()
  return {
    upload: async (file, context) => {
      const ref = { id: window.URL.createObjectURL(file), fileName: file.name, size: file.size, contentType: file.type }
      urls.add(ref.id)
      return context && context.schema && context.schema.type === 'string' ? ref.id : ref
    },
    remove: (item) => {
      const id = item.id || item.path
      if (urls.delete(id)) window.URL.revokeObjectURL(id)
    },
    download: async (item) => {
      const id = item.id || item.path
      if (!id || !id.startsWith('blob:')) return downloadFile(item)
      const link = document.createElement('a')
      link.href = id
      link.setAttribute('download', item.fileName !== id ? item.fileName : 'file')
      link.click()
    },
    clear: () => {
      urls.forEach(url => window.URL.revokeObjectURL(url))
      urls.clear()
    }
  }
}

// the file controls, as in api/src/utils/files.js
const FILE_FORMATS = ['file', 'files', 'obibaFiles']

/** the options of the UI schema controls, by scope */
const controlOptions = (element, rval = {}) => {
  if (element && typeof element === 'object') {
    if (typeof element.scope === 'string') rval[element.scope] = element.options || {}
    ;(element.elements || []).forEach(child => controlOptions(child, rval))
  }
  return rval
}

/** the file control format of a property, from its schema or its UI options */
const fileFormat = (prop, opts = {}) => [prop.format, opts.format].find(f => FILE_FORMATS.includes(f))

/** the property of an object value that holds the list of file references */
const fileItemsKey = (format, opts = {}) => opts.itemsKey || (format === 'obibaFiles' ? 'obibaFiles' : 'files')

/**
 * The references of a file control value, as stored by the file upload renderer: a file id,
 * a list of file references, or an object holding this list in its `itemsKey` property.
 */
const fileRefItems = (value, itemsKey) => {
  const list = value && typeof value === 'object' && !Array.isArray(value) && !value.id ? value[itemsKey] : value
  return [].concat(list || []).map(f => f && typeof f === 'object' ? f : { id: f }).filter(f => f.id)
}

const collectRefs = (prop, value, path, refs, scope, options) => {
  if (!prop || value === undefined || value === null) return refs
  const opts = options[scope] || {}
  const format = fileFormat(prop, opts)
  if (format) {
    refs.push(...fileRefItems(value, fileItemsKey(format, opts)).map(f => ({ ...f, path })))
  } else if (Array.isArray(value)) {
    value.forEach((item, i) => collectRefs(prop.items, item, `${path}[${i}]`, refs, undefined, options))
  } else if (typeof value === 'object' && prop.properties) {
    Object.entries(prop.properties).forEach(([name, p]) => collectRefs(p, value[name], path ? `${path}.${name}` : name, refs, `${scope}/properties/${name}`, options))
  }
  return refs
}

/**
 * The files referenced by the data, found with the file controls (`format: file|files|obibaFiles`,
 * in the schema or the UI options) of a JSON Forms form schema, as `[{ id, fileName, path }]`
 * (no `fileName` for a single file control).
 */
export function fileRefs (schema, data) {
  return schema && schema.uischema ? collectRefs(schema.schema, data, '', [], '#', controlOptions(schema.uischema)) : []
}
