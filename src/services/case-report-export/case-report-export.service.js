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

const makeTableName = (caseReportForm, formRevision) => {
  // handle case report form is not defined (not supposed to happen)
  const tableName = `${caseReportForm ? caseReportForm.name : formRevision.name}-${formRevision.revision}`;
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
    item.items.filter(it => it.type !== 'section').forEach(it => {
      const vars = makeVariables(it, {
        entityType: options.entityType,
        i18n: options.i18n,
        repeated: options.repeated,
        prefix: item.name
      });
      if (Array.isArray(vars)) {
        vars.forEach(v => variables.push(v));
      } else {
        variables.push(vars);
      }
    });
    return variables;
  } else if (item.type !== 'section') {
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
    } else if (['date'].includes(item.type)) {
      variable.valueType = 'date';
    } else if (['datetime'].includes(item.type)) {
      variable.valueType = 'datetime';
    } else if (['toggle'].includes(item.type)) {
      variable.valueType = 'boolean';
    } else if (['map'].includes(item.type)) {
      variable.valueType = item.geometryType ? item.geometryType.toLowerCase() : 'point';
    }
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
  } else {
    return [];
  }
};

const makeTable = (caseReportForm, formRevision, exportSettings) => {
  const schema = formRevision.schema;
  const table = {
    table: makeTableName(caseReportForm, formRevision),
    entityType: caseReportForm.repeatPolicy === 'multiple' ? 'CaseReport' : exportSettings.entity_type,
    variables: []
  };
  if (caseReportForm.repeatPolicy === 'multiple') {
    table.variables.push({
      name: 'id',
      entityType: table.entityType,
      valueType: 'text',
      isRepeatable: true,
      referencedEntityType: exportSettings.entity_type
    });
  }
  schema.items.forEach(item => {
    const variables = makeVariables(item, {
      entityType: table.entityType,
      i18n: schema.i18n,
      repeated: caseReportForm.repeatPolicy === 'multiple'
    });
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
  const key = Object.keys(res.data.export).pop();
  const tableName = makeTableName(res.data.export[key].caseReportForm, res.data.export[key].formRevision);
  const csv = toCSV(res.data.export[key].data, res.data.export[key].fields);
  res.attachment(`${tableName}.csv`);
  res.type('csv');
  res.end(csv);
};

const doZipResponse = (res, exportSettings) => {
  const tmpDir = mkTmpDir();
  // write data
  for (const key in res.data.export) {
    const tableName = makeTableName(res.data.export[key].caseReportForm, res.data.export[key].formRevision);
    if (!fs.existsSync(path.join(tmpDir, tableName))) {
      fs.mkdirSync(path.join(tmpDir, tableName));
    }
    // write data
    const csv = toCSV(res.data.export[key].data, res.data.export[key].fields);
    fs.writeFileSync(path.join(tmpDir, tableName, 'data.csv'), csv);
    // write variables
    const table = makeTable(res.data.export[key].caseReportForm, res.data.export[key].formRevision, exportSettings);
    const variables = [];
    const categories = [];
    let variableFields = [];
    let categoryFields = [];
    let index = 0;
    table.variables.forEach(variable => {
      const nvar = {
        name: variable.name,
        entityType: variable.entityType,
        valueType: variable.valueType,
        unit: variable.unit,
        referencedEntityType: variable.referencedEntityType,
        mimeType: variable.mimeType,
        repeatable: variable.isRepeatable === true,
        occurrenceGroup: variable.occurrenceGroup,
        index: index++
      };
      if (variable.attributes) {
        variable.attributes.forEach(attr => {
          const key = (attr.namespace ? attr.namespace + '::' : '') + attr.name + (attr.locale ? ':' + attr.locale : '');
          nvar[key] = attr.value;
        });
      }
      variables.push(nvar);
      const vFields = variableFields.concat(Object.keys(nvar));
      variableFields = vFields.filter((item, pos) => vFields.indexOf(item) === pos);
      if (variable.categories) {
        variable.categories.forEach(category => {
          const ncat = {
            variable: nvar.name,
            name: category.name,
            missing: false
          };
          if (category.attributes) {
            category.attributes.forEach(attr => {
              const key = (attr.namespace ? attr.namespace + '::' : '') + attr.name + (attr.locale ? ':' + attr.locale : '');
              ncat[key] = attr.value;
            });
          }
          categories.push(ncat);
          const cFields = categoryFields.concat(Object.keys(ncat));
          categoryFields = cFields.filter((item, pos) => cFields.indexOf(item) === pos);
        });
      }
    });
    fs.writeFileSync(path.join(tmpDir, tableName, 'variables.csv'), toCSV(variables, variableFields));
    fs.writeFileSync(path.join(tmpDir, tableName, 'categories.csv'), toCSV(categories, categoryFields));
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
  res.attachment('case-report-export.zip');
  //this is the streaming magic
  archive.pipe(res);
  archive.directory(tmpDir, '');
  archive.finalize();
};

const doJsonResponse = (res, exportSettings) => {
  res.attachment('case-report-export.json');
  const data = {};
  for (const key in res.data.export) {
    const tableName = makeTableName(res.data.export[key].caseReportForm, res.data.export[key].formRevision);
    data[tableName] = {
      data: res.data.export[key].data,
      variables: makeTable(res.data.export[key].caseReportForm, res.data.export[key].formRevision, exportSettings).variables
    };
  }
  res.json({
    total: res.data.total,
    found: res.data.found,
    skip: res.data.skip,
    limit: res.data.limit,
    data: data
  });
};

module.exports = function (app) {
  const options = {
    paginate: app.get('paginate')
  };

  // Initialize our service with any options it requires
  app.use('/case-report-export', new CaseReportExport(options, app), (req, res) => {
    const accept = req.get('Accept');
    const exportSettings = app.get('export');
    if (accept === 'text/csv' || accept === 'text/plain') {
      doCsvResponse(res);
    } else if (accept === 'application/zip' || accept === 'application/octet-stream') {
      doZipResponse(res, exportSettings);
    } else {
      doJsonResponse(res, exportSettings);
    }
  });

  // Get our initialized service so that we can register hooks
  const service = app.service('case-report-export');

  service.hooks(hooks);
};
