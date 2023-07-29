// Initializes the `form-i18n` service on path `/form-i18n`
const { FormI18nExport } = require('./form-i18n.class');
const { parse } = require('json2csv');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const path = require('path');
const hooks = require('./form-i18n.hooks');
const { GeneralError } = require('@feathersjs/errors');

const mkTmpDir = () => {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'amber-'));
};

const toRows = (res) => {
  const rval = {
    header: [],
    rows: [],
  };
  const i18n = res.data.schema.i18n;
  if (i18n) {
    const locales = Object.keys(i18n);
    if (locales.length > 0) {
      rval.header = ['key', ...locales];
      const keys = locales.map(locale => Object.keys(i18n[locale])).flat().filter((value, index, array) => array.indexOf(value) === index);
      const rows = [];
      keys.forEach(key => {
        const row = {
          key: key
        };
        locales.forEach(locale => row[locale] = i18n[locale][key]);
        rows.push(row);
      });
      rval.rows = rows;
    }
  }
  return rval;
};

const doCsvResponse = (res) => {
  res.attachment(`${res.data.name}-i18n-export.csv`);
  res.type('csv');
  const parsed = toRows(res);
  res.write(parse(parsed.rows, { fields: parsed.header }));
  res.end();
};

const doExcelResponse = (res) => {
  const tmpDir = mkTmpDir();
  const workbook = xlsx.utils.book_new();
  const parsed = toRows(res);
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(parsed.rows), res.data.name);
  
  // dump to a tmp file
  const fname = `${res.data.name}-i18n-export.xlsx`;
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
  res.attachment(`${res.data.name}-i18n-export.json`);
  res.type('application/vnd.ms-excel');
  res.json(res.data.schema.i18n);
};

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/form-i18n', new FormI18nExport(options, app), (req, res) => {
    if (req.method === 'GET') {
      // this is an export
      const accept = req.get('Accept');
      if (accept === 'text/csv' || accept === 'text/plain') {
        doCsvResponse(res);
      } else if (accept === 'application/vnd.openxmlformatsofficedocument.spreadsheetml.sheet' || accept === 'application/vnd.ms-excel') {
        doExcelResponse(res);
      } else {
        doJsonResponse(res);
      }
    }
  });

  // Get our initialized service so that we can register hooks
  const service = app.service('form-i18n');

  service.hooks(hooks);
};
