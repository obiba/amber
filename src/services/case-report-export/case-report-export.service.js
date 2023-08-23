// Initializes the `case-report-export` service on path `/case-report-export`
const { CaseReportExport } = require('./case-report-export.class');
const hooks = require('./case-report-export.hooks');
const { Parser } = require('@json2csv/plainjs');
const xlsx = require('xlsx');
const fs = require('fs');
const os = require('os');
const path = require('path');
var archiver = require('archiver');
const { GeneralError } = require('@feathersjs/errors');

const toCSV = (data, fields) => {
  const parser = new Parser();
  return parser.parse(data, { fields: fields });
};

const mkTmpDir = () => {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'amber-'));
};

const makeTableName = (caseReportForm, formRevision) => {
  // handle case report form is not defined (not supposed to happen)
  const tableName = `${caseReportForm ? caseReportForm.name : formRevision.name}-${formRevision.revision}`;
  return tableName;
};

const doCsvResponse = (res) => {
  res.attachment('case-report-export.csv');
  res.type('csv');
  for (const key in res.data.export) {
    const tableName = makeTableName(res.data.export[key].caseReportForm, res.data.export[key].formRevision);
    const tableCsv = toCSV(res.data.export[key].data, res.data.export[key].fields);
    res.write(`## ${tableName}\n${tableCsv}\n\n`);  
  }
  res.end();
};

const doExcelResponse = (res) => {
  const tmpDir = mkTmpDir();
  const workbook = xlsx.utils.book_new();
  const dataSheets = {};
  const variables = [];
  const categories = [];
  for (const key in res.data.export) {
    const tableName = makeTableName(res.data.export[key].caseReportForm, res.data.export[key].formRevision);
    
    let index = 0;
    res.data.export[key].variables.forEach(variable => {
      const nvar = {
        table: tableName,
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
      if (variable.categories) {
        variable.categories.forEach(category => {
          const ncat = {
            table: tableName,
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
        });
      }
      variables.push(nvar);
    });

    dataSheets[tableName] = xlsx.utils.json_to_sheet(res.data.export[key].data);
  }
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(variables), 'Variables');
  xlsx.utils.book_append_sheet(workbook, xlsx.utils.json_to_sheet(categories), 'Categories');
  for (const name in dataSheets) {
    xlsx.utils.book_append_sheet(workbook, dataSheets[name], name);
  }
  // dump to a tmp file
  const fname = 'case-report-export.xlsx';
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

const doZipResponse = (res) => {
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
    const variables = [];
    let variableFields = [];
    let index = 0;
    res.data.export[key].variables.forEach(variable => {
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
      if (variable.categories) {
        const categoriesLabels = {};
        variable.categories.forEach(category => {
          if (category.attributes) {
            category.attributes.forEach(attr => {
              if (attr.name === 'label') {
                const labelsKey = 'categories' + (attr.locale ? ':' + attr.locale : '');
                if (!categoriesLabels[labelsKey]) {
                  categoriesLabels[labelsKey] = [];
                }
                categoriesLabels[labelsKey].push(`${category.name}=${attr.value}`);
              }
            });
          }
        });
        for (const labelsKey in categoriesLabels) {
          nvar[labelsKey] = categoriesLabels[labelsKey].join(';');
        }
      }
      variables.push(nvar);
      const vFields = variableFields.concat(Object.keys(nvar));
      variableFields = vFields.filter((item, pos) => vFields.indexOf(item) === pos);
    });
    fs.writeFileSync(path.join(tmpDir, tableName, 'variables.csv'), toCSV(variables, variableFields));
    //fs.writeFileSync(path.join(tmpDir, tableName, 'categories.csv'), toCSV(categories, categoryFields));
  }
  const archive = archiver('zip');
  archive.on('error', (err) => {
    fs.rmSync(tmpDir, { recursive: true });
    throw new GeneralError(err.message);
  });
  //on stream closed we can end the request
  archive.on('end', function() {
    fs.rmSync(tmpDir, { recursive: true });
  });
  //set the archive name
  res.attachment('case-report-export.zip');
  //this is the streaming magic
  archive.pipe(res);
  archive.directory(tmpDir, '');
  archive.finalize();
};

const doJsonResponse = (res) => {
  res.attachment('case-report-export.json');
  const data = {};
  for (const key in res.data.export) {
    const tableName = makeTableName(res.data.export[key].caseReportForm, res.data.export[key].formRevision);
    data[tableName] = {
      data: res.data.export[key].data,
      variables: res.data.export[key].variables
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
  const service = app.service('case-report-export');

  service.hooks(hooks);
};
