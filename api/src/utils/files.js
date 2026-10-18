const crypto = require('crypto');
const { Transform, pipeline } = require('stream');
const { pipeline: pipelineAsync } = require('stream/promises');
const { GridFSBucket, ObjectId } = require('mongodb');
const { BadRequest, NotFound } = require('@feathersjs/errors');

const BUCKET = 'files';

const getBucket = async (app) => new GridFSBucket(await app.get('mongodbClient'), { bucketName: BUCKET });

const getCollection = async (app) => (await app.get('mongodbClient')).collection(`${BUCKET}.files`);

const toObjectId = (id) => {
  // a local id (not uploaded yet) or anything else is not a file id
  if (!/^[0-9a-f]{24}$/i.test(String(id))) {
    throw new BadRequest(`Not a valid file id: ${id}`);
  }
  return new ObjectId(String(id));
};

const isAccepted = (accept, type) => !accept || accept.length === 0 ||
  accept.some(a => a === type || (a.endsWith('/*') && type.startsWith(a.slice(0, -1))));

/**
 * Store a file, in the pending state.
 * @param {Object} app
 * @param {Object} file The { stream, fileName, contentType } of the file
 * @param {ObjectId} uploadedBy The user or participant id
 * @returns the file reference { id, fileName, size, contentType }
 */
const uploadFile = async (app, { stream, fileName, contentType }, uploadedBy) => {
  const { maxSize, accept } = app.get('files');
  contentType = contentType || 'application/octet-stream';
  if (!fileName) {
    throw new BadRequest('The file name is missing');
  }
  if (!isAccepted(accept, contentType)) {
    throw new BadRequest(`File type is not accepted: ${contentType}`);
  }
  const metadata = { contentType, uploadedBy, uploadedAt: new Date(), state: 'pending' };
  let size = 0;
  const steps = [
    stream,
    new Transform({
      transform(chunk, encoding, callback) {
        size += chunk.length;
        callback(size > maxSize ? new BadRequest(`File size exceeds ${maxSize} bytes`) : null, chunk);
      }
    })
  ];
  if (app.get('encrypt_data')) {
    const iv = crypto.randomBytes(16);
    metadata.iv = iv.toString('hex');
    steps.push(app.get('crypto').cipher(iv));
  }
  const upload = (await getBucket(app)).openUploadStream(fileName, { metadata });
  try {
    await pipelineAsync(...steps, upload);
  } catch (err) {
    await upload.abort().catch(() => {});
    throw err;
  }
  return { id: upload.id.toString(), fileName, size, contentType };
};

const getFile = async (app, id) => {
  const file = await (await getCollection(app)).findOne({ _id: toObjectId(id) });
  if (!file) {
    throw new NotFound(`No file with id ${id}`);
  }
  return file;
};

/**
 * The content of a file, decrypted.
 * @param {Object} app
 * @param {Object} file The GridFS file document
 * @returns a readable stream
 */
const openFile = async (app, file) => {
  const stream = (await getBucket(app)).openDownloadStream(file._id);
  if (!file.metadata.iv) return stream;
  return pipeline(stream, app.get('crypto').decipher(Buffer.from(file.metadata.iv, 'hex')), () => {});
};

const deleteFiles = async (app, query) => {
  const bucket = await getBucket(app);
  const files = await bucket.find(query, { projection: { _id: 1 } }).toArray();
  for (const file of files) {
    // ignore a concurrent removal
    await bucket.delete(file._id).catch(() => {});
  }
  return files.length;
};

const recordQuery = (service, ids) => ({
  'metadata.record.service': service,
  'metadata.record.id': { $in: [].concat(ids) }
});

/** delete the files of the removed record(s) */
const deleteRecordFiles = async (app, service, records) => {
  const ids = [].concat(records).filter(r => r && r._id).map(r => r._id);
  if (ids.length > 0) {
    await deleteFiles(app, recordQuery(service, ids));
  }
};

/** delete the pending files older than the configured delay */
const deletePendingFiles = async (app) => {
  const { pendingDays } = app.get('files');
  return deleteFiles(app, {
    'metadata.state': 'pending',
    'metadata.uploadedAt': { $lt: new Date(Date.now() - pendingDays * 24 * 3600 * 1000) }
  });
};

const FILE_FORMATS = ['file', 'files', 'obibaFiles'];

/** the options of the UI schema controls, by scope */
const controlOptions = (element, rval = {}) => {
  if (element && typeof element === 'object') {
    if (typeof element.scope === 'string') rval[element.scope] = element.options || {};
    (element.elements || []).forEach(child => controlOptions(child, rval));
  }
  return rval;
};

/** the file control format of a property, from its schema or its UI options */
const fileFormat = (prop, opts = {}) => [prop.format, opts.format].find(f => FILE_FORMATS.includes(f));

/** the property of an object value that holds the list of file references */
const fileItemsKey = (format, opts = {}) => opts.itemsKey || (format === 'obibaFiles' ? 'obibaFiles' : 'files');

/**
 * The ids of a file control value, as stored by the file upload renderer: a file id,
 * a list of file references, or an object holding this list in its `itemsKey` property.
 */
const fileRefIds = (value, itemsKey) => {
  const list = value && typeof value === 'object' && !Array.isArray(value) && !value.id ? value[itemsKey] : value;
  return [].concat(list || []).map(f => f && typeof f === 'object' ? f.id : f).filter(id => id).map(String);
};

const collectIds = (prop, value, ids, scope, options) => {
  if (!prop || value === undefined || value === null) return ids;
  const opts = options[scope] || {};
  const format = fileFormat(prop, opts);
  if (format) {
    ids.push(...fileRefIds(value, fileItemsKey(format, opts)));
  } else if (Array.isArray(value)) {
    value.forEach(item => collectIds(prop.items, item, ids, undefined, options));
  } else if (typeof value === 'object' && prop.properties) {
    Object.entries(prop.properties).forEach(([name, p]) => collectIds(p, value[name], ids, `${scope}/properties/${name}`, options));
  }
  return ids;
};

/**
 * The ids of the files referenced by the data, found with the file controls
 * (`format: file|files|obibaFiles`, in the schema or the UI options) of a JSON Forms form schema.
 */
const fileIds = (schema, data) => schema && schema.uischema
  ? collectIds(schema.schema, data, [], '#', controlOptions(schema.uischema))
  : [];

/** the schema of a form revision, or of the form when not found */
const getFormSchema = async (app, form, revision) => {
  const query = { $limit: 1, $sort: { revision: -1 }, form };
  if (revision) {
    query.revision = revision;
  }
  const result = await app.service('form-revision').find({ query });
  return result.total > 0 ? result.data[0].schema : (await app.service('form').get(form)).schema;
};

const isSameRecord = (r1, r2) => r1 && r2 && r1.service === r2.service &&
  String(r1.id) === String(r2.id) && (r1.step || null) === (r2.step || null);

/**
 * Check that the files can be attached to the record: either pending and uploaded by the owner,
 * or already attached to this record.
 * @param {Object} app
 * @param {Array} ids The file ids
 * @param {ObjectId} owner The user or participant id
 * @param {Object} record The { service, id, step } of the record, if it exists
 */
const checkFiles = async (app, ids, owner, record) => {
  if (ids.length === 0) return;
  const files = await (await getCollection(app)).find({ _id: { $in: ids.map(toObjectId) } }).toArray();
  ids.forEach(id => {
    const file = files.find(f => f._id.toString() === id);
    const valid = file && (file.metadata.state === 'pending'
      ? String(file.metadata.uploadedBy) === String(owner)
      : isSameRecord(file.metadata.record, record));
    if (!valid) {
      throw new BadRequest(`Not a valid file: ${id}`);
    }
  });
};

/** mark the pending files as attached to the record */
const attachFiles = async (app, ids, record) => {
  if (ids.length === 0) return;
  await (await getCollection(app)).updateMany(
    { _id: { $in: ids.map(toObjectId) }, 'metadata.state': 'pending' },
    { $set: { 'metadata.state': 'attached', 'metadata.record': record } }
  );
};

/**
 * Check the files of the interview steps, before they are saved.
 * @returns the file ids, by step name
 */
const checkStepsFiles = async (app, interview, steps, owner) => {
  const stepsIds = {};
  for (const step of steps.filter(s => s.data && s.form)) {
    const ids = fileIds(await getFormSchema(app, step.form, step.revision), step.data);
    await checkFiles(app, ids, owner, { service: 'interview', id: interview._id, step: step.name });
    stepsIds[step.name] = ids;
  }
  return stepsIds;
};

/**
 * Attach the files of the saved interview steps, and delete the ones that are no longer referenced.
 * @param {Object} app
 * @param {Object} interview The saved interview
 * @param {Object} stepsIds The file ids, by step name
 */
const syncStepsFiles = async (app, interview, stepsIds) => {
  const query = recordQuery('interview', interview._id);
  for (const [step, ids] of Object.entries(stepsIds)) {
    await attachFiles(app, ids, { service: 'interview', id: interview._id, step, campaign: interview.campaign });
    await deleteFiles(app, { ...query, 'metadata.record.step': step, _id: { $nin: ids.map(toObjectId) } });
  }
  // the files of the removed steps
  await deleteFiles(app, { ...query, 'metadata.record.step': { $nin: (interview.steps || []).map(s => s.name) } });
};

/** the files of the data export values, with their names */
const getFiles = async (app, ids) => {
  const valid = ids.filter(id => /^[0-9a-f]{24}$/i.test(String(id)));
  if (valid.length === 0) return [];
  return (await getCollection(app)).find({ _id: { $in: valid.map(toObjectId) } }).toArray();
};

/** add the files of a table to a zip archive, under `<table>/files/<id>/<fileName>` */
const appendFiles = async (app, archive, tableName, files) => {
  for (const file of files || []) {
    archive.append(await openFile(app, file), { name: `${tableName}/files/${file._id}/${file.filename}` });
  }
};

module.exports = {
  uploadFile,
  getFile,
  openFile,
  deleteFiles,
  deleteRecordFiles,
  deletePendingFiles,
  controlOptions,
  fileFormat,
  fileItemsKey,
  fileRefIds,
  fileIds,
  getFormSchema,
  checkFiles,
  attachFiles,
  checkStepsFiles,
  syncStepsFiles,
  getFiles,
  appendFiles
};
