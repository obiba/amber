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

const makeTableName = (formRevision) => {
  const tableName = formRevision.name + '-' + formRevision.revision;
  return tableName;
};

const makeAttributes = (key, i18n) => {
  if (i18n) {
    return Object.keys(i18n).map(locale => { 
      return {
        value: i18n[locale][key] ? i18n[locale][key] : key,
        locale: locale
      };
    });
  } else {
    return [
      {
        value: key
      }
    ];
  }
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
        makeAttributes(item[key], options.i18n).forEach(attr => {
          const attribute = {
            name: key,
            value: attr.value
          };
          if (attr.locale) {
            attribute.locale = attr.locale;
          }
          variable.attributes.push(attribute);
        });
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
            const attribute = {
              name: 'label',
              value: attr.value
            };
            if (attr.locale) {
              attribute.locale = attr.locale;
            }
            return attribute;
          });
        }
        variable.categories.push(category);
      });
    }
    return variable;
  }
};

const makeTable = (formRevision) => {
  const schema = formRevision.schema;
  const table = {
    table: makeTableName(formRevision),
    entityType: 'Participant',
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
  return table;
};

const doCsvResponse = (res) => {
  // extract only one form-version
  const key = Object.keys(res.data).pop();
  const tableName = makeTableName(res.data[key].formRevision);
  const csv = toCSV(res.data[key].data, res.data[key].fields);
  res.attachment(`${tableName}.csv`);
  res.type('csv');
  res.end(csv);
};

const doZipResponse = (res) => {
  const tmpDir = mkTmpDir();
  // write data
  for (const key in res.data) {
    const tableName = makeTableName(res.data[key].formRevision);
    if (!fs.existsSync(path.join(tmpDir, tableName))) {
      fs.mkdirSync(path.join(tmpDir, tableName));
    }
    // write data
    const csv = toCSV(res.data[key].data, res.data[key].fields);
    fs.writeFileSync(path.join(tmpDir, tableName, 'data.csv'), csv);
    // write variables
    const table = makeTable(res.data[key].formRevision);
    fs.writeFileSync(path.join(tmpDir, tableName, 'variables.json'), JSON.stringify(table.variables));
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
  const data = {};
  for (const key in res.data) {
    const tableName = makeTableName(res.data[key].formRevision);
    data[tableName] = {
      data: res.data[key].data,
      variables: makeTable(res.data[key].formRevision).variables
    };
  }
  res.json(data);
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
