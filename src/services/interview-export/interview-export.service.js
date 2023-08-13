// Initializes the `interview-export` service on path `/interview-export`
const { InterviewExport } = require('./interview-export.class');
const hooks = require('./interview-export.hooks');

const doCsvResponse = (res) => {
};

const doExcelResponse = (res) => {
};

const doZipResponse = (res) => {
};

const doJsonResponse = (res) => {
};

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/interview-export', new InterviewExport(options, app), (req, res) => {
    const accept = req.get('Accept');
    if (accept === 'text/csv' || accept === 'text/plain') {
      doCsvResponse(res);
    } else if (accept === 'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet' || accept === 'application/vnd.ms-excel') {
      doExcelResponse(res);
    } else if (accept === 'application/zip' || accept === 'application/octet-stream') {
      doZipResponse(res);
    } else {
      doJsonResponse(res);
    }
  });
  // Get our initialized service so that we can register hooks
  const service = app.service('interview-export');

  service.hooks(hooks);
};
