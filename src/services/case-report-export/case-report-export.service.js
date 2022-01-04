// Initializes the `case-report-export` service on path `/case-report-export`
const { CaseReportExport } = require('./case-report-export.class');
const hooks = require('./case-report-export.hooks');
const { parse } = require('json2csv');
const fs = require('fs');
const os = require('os');
const path = require('path');
var archiver = require('archiver');
const { GeneralError } = require('@feathersjs/errors');

const toCSV = (data, fields) => {
  // _id is first column
  const sortedFields = fields.sort((a, b) => {
    if (a === '_id' || a < b) {
      return -1;
    }
    if (b === '_id' || a > b) {
      return 1;
    }
  
    // names must be equal
    return 0;
  });
  return parse(data, { fields: sortedFields });
};

const mkTmpDir = () => {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'amber-'));
};

const doCsvResponse = (res) => {
  // extract only one form-version
  const key = Object.keys(res.data).pop();
  const tableName = res.data[key].formRevision.name + '-' + res.data[key].formRevision.revision;
  const csv = toCSV(res.data[key].data, res.data[key].fields);
  res.attachment(`${tableName}.csv`);
  res.type('csv');
  res.end(csv);
};

const doZipResponse = (res) => {
  const tmpDir = mkTmpDir();
  // write data
  for (const key in res.data) {
    const csv = toCSV(res.data[key].data, res.data[key].fields);
    const tableName = res.data[key].formRevision.name + '-' + res.data[key].formRevision.revision;
    if (!fs.existsSync(path.join(tmpDir, tableName))) {
      fs.mkdirSync(path.join(tmpDir, tableName));
    }
    fs.writeFileSync(path.join(tmpDir, tableName, 'data.csv'), csv); 
    // TODO write variables
  }
  const archive = archiver('zip');
  archive.on('error', (err) => {
    fs.rmSync(tmpDir, { recursive: true });
    throw new GeneralError(err.message);
  });
  //on stream closed we can end the request
  archive.on('end', function() {
    fs.rmSync(tmpDir, { recursive: true });
    console.log('Archive wrote %d bytes', archive.pointer());
  });
  //set the archive name
  res.attachment('archive-name.zip');
  //this is the streaming magic
  archive.pipe(res);
  archive.directory(tmpDir, '');
  archive.finalize();
};

const doJsonResponse = (res) => {
  res.attachment('case-report-export.json');
  res.json(res.data);
};

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/case-report-export', new CaseReportExport(options, app), (req, res) => {
    const accept = req.get('Accept');
    if (accept === 'text/csv' || accept === 'text/plain') {
      doCsvResponse(res);
    } else if (accept === 'application/zip' || accept === 'application/octet-stream') {
      doZipResponse(res);
    } else {
      doJsonResponse(res);
    }
  });

  // Get our initialized service so that we can register hooks
  const service = app.service('case-report-export');

  service.hooks(hooks);
};
