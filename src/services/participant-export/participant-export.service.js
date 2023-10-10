// Initializes the `participant-export` service on path `/participant-export`
const { Parser } = require('@json2csv/plainjs');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { ParticipantExport } = require('./participant-export.class');
const hooks = require('./participant-export.hooks');
const { GeneralError } = require('@feathersjs/errors');

const mkTmpDir = () => {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'amber-'));
};

const toRows = (res) => {
  const rval = {
    header: ['code', 'identifier', 'validFrom', 'validUntil', 'activated'],
    rows: [],
  };
  const data = res.data;
  if (data) {
    const keys = data
      .filter(participant => participant.data)
      .flatMap(participant => Object.keys(participant.data))
      .filter((value, index, array) => array.indexOf(value) === index);
    rval.header.push(keys);
    rval.header = rval.header.flat();
    rval.rows = data.map(datum => {
      const value = { ...datum, ...datum.data };
      delete value.data;
      return value;
    });
  }
  return rval;
};

const doCsvResponse = (res) => {
  res.attachment('participants-export.csv');
  res.type('csv');
  const parsed = toRows(res);
  res.write(new Parser({ fields: parsed.header, delimiter: ';' }).parse(parsed.rows));
  res.end();
};

const doExcelResponse = (res) => {
  const tmpDir = mkTmpDir();
  const workbook = xlsx.utils.book_new();
  const parsed = toRows(res);
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(parsed.rows), res.data.name);
  
  // dump to a tmp file
  const fname = 'participants-export.xlsx';
  const fpath = path.join(tmpDir, fname);
  xlsx.writeFileXLSX(workbook, fpath);
  // stream the tmp file
  const xlsxStream = fs.createReadStream(fpath);
  xlsxStream.on('error', (err) => {
    fs.rmSync(tmpDir, { recursive: true });
    throw new GeneralError(err.message);
  });
  //on stream closed we can end the request
  xlsxStream.on('end', function() {
    fs.rmSync(tmpDir, { recursive: true });
  });
  // pipe will end the response stream
  res.attachment(fname);
  res.type('application/vnd.ms-excel');
  xlsxStream.pipe(res);
};

const doJsonResponse = (res) => {
  res.attachment('participants-export.json');
  res.type('application/json');
  res.json(res.data);
};

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/participant-export', new ParticipantExport(options, app), (req, res) => {
    // this is an export
    const accept = req.get('Accept');
    if (accept === 'text/csv' || accept === 'text/plain') {
      doCsvResponse(res);
    } else if (accept === 'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet' || accept === 'application/vnd.ms-excel') {
      doExcelResponse(res);
    } else {
      doJsonResponse(res);
    }
  });

  // Get our initialized service so that we can register hooks
  const service = app.service('participant-export');

  service.hooks(hooks);
};
