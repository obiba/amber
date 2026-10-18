// Initializes the `files` service on path `/files`
const { pipeline } = require('stream');
const { Files } = require('./files.class');
const hooks = require('./files.hooks');
const logger = require('../../logger');
const { openFile, deletePendingFiles } = require('../../utils/files');

const decode = (value) => {
  try {
    return value ? decodeURIComponent(value) : value;
  } catch {
    return value;
  }
};

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/files', (req, res, next) => {
    if (req.method === 'POST') {
      // the body is not parsed, it is streamed to the storage
      req.feathers.file = {
        stream: req,
        fileName: decode(req.get('x-file-name')),
        contentType: (req.get('content-type') || '').split(';')[0].trim(),
        size: parseInt(req.get('content-length'))
      };
    }
    next();
  }, new Files(options, app), async (req, res, next) => {
    if (req.method !== 'GET') return next();
    try {
      const file = res.data;
      const stream = await openFile(app, file);
      res.attachment(file.filename);
      res.type(file.metadata.contentType || 'application/octet-stream');
      pipeline(stream, res, (err) => err && logger.error(err));
    } catch (err) {
      next(err);
    }
  });

  // Get our initialized service so that we can register hooks
  const service = app.service('files');

  service.hooks(hooks);

  // ponytail: each cluster worker runs the cleanup, deletions are idempotent
  setInterval(() => deletePendingFiles(app).catch(err => logger.error(err)), 3600 * 1000).unref();
};
