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
  return parse(data, { fields: fields });
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

const makeAttributes = (key, i18n) => {
  return Object.keys(i18n).map(locale => { 
    return {
      value: i18n[locale][key] ? i18n[locale][key] : key,
      locale: locale
    };
  });
};

const makeVariables = (item, options) => {
  const prefix = options.prefix ? options.prefix + '.' : '';
  if (item.items) {
    const variables = [];
    item.items.forEach(it => {
      const vars = makeVariables(it, {
        entityType: options.entityType,
        i18n: options.i18n,
        prefix: item.name
      });
      if (Array.isArray(vars)) {
        vars.forEach(v => variables.push(v));
      } else {
        variables.push(vars);
      }
    });
    return variables;
  } else {
    const variable = {
      name: prefix + item.name,
      valueType: 'text',
      entityType: options.entityType
    };
    // TODO get valueType from schema
    if (item.type === 'toggle') {
      variable.valueType = 'boolean';
    } else if (['number', 'slider', 'rating'].includes(item.type)) {
      variable.valueType = 'integer';
    } // TODO date etc...
    if (item.multiple) {
      variable.isRepeatable = true;
    }
    variable.attributes = [];
    ['label', 'description'].forEach(key => {
      if (item[key]) {
        makeAttributes(item[key], options.i18n).forEach(attr => 
          variable.attributes.push({
            name: key,
            value: attr.value,
            locale: attr.locale
          }));
      }
    });
    if (item.options) {
      variable.categories = [];
      item.options.forEach(opt => {
        const category = {
          name: opt.value
        };
        if (opt.label) {
          category.attributes = makeAttributes(opt.label, options.i18n).map(attr => { 
            return {
              name: 'label',
              value: attr.value,
              locale: attr.locale
            };
          });
        }
        variable.categories.push(category);
      });
    }
    return variable;
  }
};

const doZipResponse = (res) => {
  const tmpDir = mkTmpDir();
  // write data
  for (const key in res.data) {
    const tableName = res.data[key].formRevision.name + '-' + res.data[key].formRevision.revision;
    if (!fs.existsSync(path.join(tmpDir, tableName))) {
      fs.mkdirSync(path.join(tmpDir, tableName));
    }
    // write data
    const csv = toCSV(res.data[key].data, res.data[key].fields);
    fs.writeFileSync(path.join(tmpDir, tableName, 'data.csv'), csv);
    // write variables
    const schema = res.data[key].formRevision.schema;
    const table = {
      table: tableName,
      entityType: 'Participant',
      datasourceName: '',
      variables: []
    };
    schema.items.forEach(item => {
      const variables = makeVariables(item, { entityType: table.entityType, i18n: schema.i18n });
      if (Array.isArray(variables)) {
        variables.forEach(variable => table.variables.push(variable));
      } else {
        table.variables.push(variables);
      }
    });
    fs.writeFileSync(path.join(tmpDir, tableName, 'table.json'), JSON.stringify(table));
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
