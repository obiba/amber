/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');
const { getFiles, controlOptions, fileFormat, fileItemsKey, fileRefIds } = require('./files');

const MATRIX_FORMATS = ['radio-matrix', 'radioGroupCollection'];

/** the rows or the columns of a matrix: a list of `{ key, label }` (or `value`/`const`, `title`/`name`/`caption`), or an object of labels by key */
const matrixEntries = (input) => {
  if (Array.isArray(input)) {
    return input.map(e => (e && typeof e === 'object'
      ? { key: e.key ?? e.value ?? e.const, label: e.label ?? e.title ?? e.name ?? e.caption }
      : { key: e })).filter(e => e.key !== undefined && e.key !== null);
  }
  if (input && typeof input === 'object') return Object.entries(input).map(([key, label]) => ({ key, label }));
  return [];
};

/**
 * A matrix is a group of one variable per row: a choice among the columns (radio),
 * or a boolean (checkbox mode).
 */
const toMatrixItem = (item, prop, opts) => {
  const checkbox = opts.checkboxMode === true;
  const values = matrixEntries(opts.values ?? prop.values).map(v => ({ value: String(v.key), label: v.label }));
  item.matrix = checkbox ? 'checkbox' : 'radio';
  item.items = matrixEntries(opts.items ?? prop.items).map(row => (checkbox
    ? { name: String(row.key), label: row.label, type: 'toggle' }
    : { name: String(row.key), label: row.label, type: 'text', options: values }));
  return item;
};

/** a JSON schema property as a legacy Amber item, for the data dictionary */
const toItem = (name, property, scope, options) => {
  const many = property.type === 'array' && property.items && typeof property.items === 'object';
  const prop = many ? property.items : property;
  const item = { name, label: property.title, description: property.description };
  const format = fileFormat(property, options[scope]);
  if (format) {
    // a file reference (or a list of them)
    const opts = options[scope] || {};
    const accept = opts.accept || opts.acceptedFileTypes;
    item.type = 'file';
    item.itemsKey = fileItemsKey(format, opts);
    if (format !== 'file') item.multiple = true;
    if (accept) item.accept = [].concat(accept).join(',');
    return item;
  }
  if (MATRIX_FORMATS.includes(prop.format)) {
    return toMatrixItem(item, prop, options[scope] || {});
  }
  if (prop.type === 'object' && prop.properties && prop.format !== 'geo') {
    item.items = toItems(prop, scope, options);
    // a list of objects: each object is an occurrence of the group
    if (many) item.repeated = true;
    return item;
  }
  if (many) item.multiple = true;
  const choices = prop.oneOf || prop.anyOf;
  if (Array.isArray(choices) && choices.every(c => c && c.const !== undefined)) {
    item.options = choices.map(c => ({ value: c.const, label: c.title }));
  } else if (Array.isArray(prop.enum)) {
    item.options = prop.enum.map(value => ({ value }));
  } else if (options[scope] && Array.isArray(options[scope].values)) {
    // typeahead
    item.options = options[scope].values.map(v => (v && typeof v === 'object' ? v : { value: v }));
  }
  if (prop.format === 'geo') {
    const opts = options[scope] || {};
    const geometries = (many && opts.items && opts.items.options ? opts.items.options : opts).geometries;
    item.type = 'map';
    if (Array.isArray(geometries) && geometries.length === 1) item.geometryType = geometries[0];
  } else if (prop.type === 'boolean') {
    item.type = 'toggle';
  } else if (prop.type === 'number' || prop.type === 'integer') {
    // as the legacy number, slider and rating items
    item.type = 'number';
    if (prop.type === 'integer') item.integer = true;
  } else if (prop.format === 'date') {
    item.type = 'date';
  } else if (prop.format === 'date-time') {
    item.type = 'datetime';
  } else {
    item.type = 'text';
  }
  return item;
};

const toItems = (schema, scope, options) => Object.entries(schema.properties || {})
  .map(([name, property]) => toItem(name, property || {}, `${scope}/properties/${name}`, options));

/**
 * The items of a form schema: the legacy ones, or the JSON Forms ones (the
 * schema `uischema` is set) made from the JSON schema properties.
 */
const formItems = (schema) => {
  if (!schema || !schema.uischema) return (schema && schema.items) || [];
  return toItems(schema.schema || {}, '#', controlOptions(schema.uischema));
};



/**
 * A row of the data.csv of a zip export, with the lists as Opal value sequences:
 * comma separated, the strings in double quotes.
 */
const toOpalRow = (row) => {
  const toValue = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'string') return '"' + v.replace(/"/g, '""') + '"';
    if (typeof v === 'object') return '"' + JSON.stringify(v).replace(/"/g, '""') + '"';
    return String(v);
  };
  return Object.fromEntries(Object.entries(row).map(([key, value]) => [key, Array.isArray(value) ? value.map(toValue).join(',') : value]));
};

exports.toOpalRow = toOpalRow;

exports.FormDataExport = class FormDataExport {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
    this.exportSettings = app.get('export');
  }

  /**
   * Initiate the data collection export.
   * @returns an export data object
   */
  formItems(schema) {
    return formItems(schema);
  }

  initExport() {
    return {
      exportResults: {},
      forms: {},
      formRevisions: {}
    };
  }

  /**
   * Append a row of export data.
   * @param {Object} exportData The current export data 
   * @param {string} key The export key (ex. a string that uniquely identifies a case report form + its form revision)
   * @param {string} form The form identifier
   * @param {string} revision The form revision number
   * @param {Object} data The collected data
   * @param {Object} multipleOptions Whether to transfer row id to the group id
   */
  async appendExportData(exportData, key, form, revision, data, multipleOptions) {
    if (!exportData.exportResults[key]) {
      const formRevision = await this.getFormRevision(exportData, form, revision);
      const schema = formRevision.schema;
      const variables = [];
      const entityType = multipleOptions.multiple ? multipleOptions.entityType : this.exportSettings.entity_type;

      // when multiple context, id is a variable of the patient/participant identifier
      if (multipleOptions.multiple) {
        variables.push({
          name: 'id',
          entityType: multipleOptions.entityType,
          valueType: 'text',
          isRepeatable: true,
          referencedEntityType: this.exportSettings.entity_type
        });
      }

      this.formItems(schema).forEach(item => {
        const vars = this.makeVariables(item, {
          entityType: entityType,
          i18n: schema.i18n || schema.translations,
          repeated: multipleOptions.multiple
        });
        if (Array.isArray(vars)) {
          vars.forEach(variable => variables.push(variable));
        } else {
          variables.push(vars);
        }
      });

      exportData.exportResults[key] = { 
        data: [], 
        fields: [],
        files: [],
        formRevision: formRevision,
        variables: variables
      };
    }

    const exportResult = await this.extractExportData(exportData, form, revision, data, multipleOptions.multiple, multipleOptions.groupId);

    const fields = exportData.exportResults[key].fields.concat(exportResult.fields);
    // unique field names
    exportData.exportResults[key].fields = fields.filter((item, pos) => fields.indexOf(item) === pos);
    exportData.exportResults[key].data.push(exportResult.data);
    exportData.exportResults[key].files.push(...exportResult.files);
  }

  async extractExportData(exportData, form, revision, data, multiple, groupId) {
    const flattenData = await this.flattenData(exportData, form, revision, data, multiple, groupId);
    const files = await this.resolveFiles(flattenData);
    return { 
      files: files,
      data: flattenData, 
      fields: Object.keys(flattenData),
      formRevision: await this.getFormRevision(exportData, form, revision)
    };
  }

  /**
   * Get the form object (with specific revision) that was used to collect data.
   * @param {Object} exportData The current export data
   * @param {string} form 
   * @param {string} revision 
   * @returns 
   */
  async getFormRevision(exportData, form, revision) {
    const key = `${form}-${revision}`;
    if (!exportData.formRevisions[key]) {
      const formRevisionService = this.app.service('form-revision');
      const result = await formRevisionService.find({
        query: {
          $limit: 1,
          form: form,
          revision: revision
        }
      });
      if (result.total === 1) {
        exportData.formRevisions[key] = result.data.pop();
      } else {
        // form revision not found, fallback to current form
        exportData.formRevisions[key] = await this.getForm(exportData, form);
      }
    }
    return exportData.formRevisions[key];
  }

  /**
   * Get a form from its id.
   * @param {Object} exportData The current export data
   * @param {string} id 
   * @returns 
   */
  async getForm(exportData, id) {
    if (!exportData.forms[id]) {
      const formService = this.app.service('form');
      exportData.forms[id] = await formService.get(id);
    }
    return exportData.forms[id];
  }

  /**
   * Flatten collected data (makes a row).
   * @param {Object} exportData The current export data
   * @param {string} form The form identifier
   * @param {string} revision The form revision number
   * @param {Object} data The collected data
   * @param {boolean} multiple Whether to transfer row id to the group id
   * @param {string} groupId When multiple, the id to group by 
   * @returns 
   */
  async flattenData (exportData, form, revision, data, multiple, groupId) {
    const formRevision = await this.getFormRevision(exportData, form, revision);
    const flattenData = this.flattenByItems(this.formItems(formRevision.schema), data);
    if (multiple) {
      flattenData[this.exportSettings.identifier_variable] = flattenData['_id'];
      flattenData['_id'] = groupId;
    }
    return flattenData;
  }

  parseInteger (value) {
    if (typeof value === 'string') {
      const chars = value.toLowerCase().split('e');
      if (chars.length>1) {
        const op1 = parseFloat(chars[0]);
        const op2 = parseInt(chars[1]);
        if (isNaN(op1) || isNaN(op2))
          return NaN;
        return parseInt(op1 * Math.pow(10, op2));
      } else {
        return parseInt(value);
      }
    }
    return parseInt(value);
  }

  flattenByItems (items, data, path) {
    const rval = data && data._id ? {
      _id: data._id
    } : {};
    if (data) {
      items.forEach(item => {
        if (item.type === 'section') {
          // skip sections as they have no data value
          return;
        }
        if (item.items) {
          const npath = path ? [...path] : [];
          npath.push(item.name);
          let value = data[item.name];
          if (item.matrix === 'checkbox' && value && typeof value === 'object') {
            // an answered checkbox matrix: the rows not checked are false
            value = Object.fromEntries(item.items.map(it => [it.name, value[it.name] === true]));
          }
          const rval2 = item.repeated
            ? this.flattenOccurrences(item.items, value, npath)
            : this.flattenByItems(item.items, value, npath);
          const prefix = npath.join('.') + '.';
          Object.entries(rval2).forEach(([key, value]) => {
            if (key.startsWith(prefix)) {
              // case of a sub group, items have already been flattened
              rval[key] = value;
            } else {
              rval[prefix + key] = value;
            }
          });
        } else if (item.type === 'file') {
          rval[item.name] = {
            __files: fileRefIds(data[item.name], item.itemsKey),
            multiple: item.multiple === true
          };
        } else {
          rval[item.name] = this.marshallValue(data[item.name]);
        }
      });
    }
    return rval;
  }

  /**
   * Flatten the objects of a list (a repeated group): each variable gets the list of its values, one per object.
   * A list value inside an object (e.g. multiple choices) is a JSON string, as there are no nested sequences.
   */
  flattenOccurrences (items, list, path) {
    const rows = (Array.isArray(list) ? list : []).map(obj => this.flattenByItems(items, obj, path));
    const keys = [...new Set(rows.flatMap(row => Object.keys(row)))].filter(key => key !== '_id');
    const rval = {};
    keys.forEach(key => {
      rval[key] = rows.map(row => {
        const value = row[key];
        if (value === undefined) return null;
        if (Array.isArray(value)) return JSON.stringify(value);
        return value;
      });
    });
    return rval;
  }

  /**
   * Replace the file references of a row by `files/<id>/<fileName>`, the path of the file relative to
   * the `data.csv` file of its table in a zip export (as Opal imports it).
   * @param {Object} row The flattened data
   * @returns the GridFS files of the row
   */
  async resolveFiles (row) {
    const isRef = (value) => value && value.__files;
    const refs = Object.entries(row).filter(([, value]) => isRef(value) || (Array.isArray(value) && value.some(isRef)));
    if (refs.length === 0) return [];
    const ids = refs.flatMap(([, value]) => [value].flat().filter(isRef).flatMap(ref => ref.__files));
    const files = await getFiles(this.app, ids);
    const toPaths = (ref) => {
      const paths = ref.__files.map(id => {
        const file = files.find(f => f._id.toString() === String(id));
        return file ? `files/${id}/${file.filename}` : String(id);
      });
      return ref.multiple ? paths : paths[0];
    };
    refs.forEach(([key, value]) => {
      if (Array.isArray(value)) {
        // occurrences of a repeated group: one path, or a JSON list of paths, per occurrence
        row[key] = value.map(v => {
          if (!isRef(v)) return v;
          return v.multiple ? JSON.stringify(toPaths(v)) : (toPaths(v) || null);
        });
      } else {
        row[key] = toPaths(value);
      }
    });
    return files;
  }

  marshallValue (value) {
    if (value && typeof value === 'object') {
      // simplify geojson value to its coordinates, the type of feature will be in the data dictionary
      if (value.type && value.type === 'Feature' && value.geometry && value.geometry.coordinates) {
        return JSON.stringify(value.geometry.coordinates);
      }
      if (Array.isArray(value)) {
        return value.map(val => this.marshallValue(val));
      }
    }
    return value;
  }

  makeVariables (item, options) {
    const prefix = options.prefix ? options.prefix + '.' : '';
    if (item.items) {
      const variables = [];
      const childOptions = {
        entityType: options.entityType,
        i18n: options.i18n,
        repeated: options.repeated,
        occurrenceGroup: options.occurrenceGroup,
        nested: options.nested,
        prefix: prefix + item.name
      };
      if (item.repeated) {
        // a group inside a repeated group has its values as JSON strings
        if (options.occurrenceGroup) childOptions.nested = true;
        else childOptions.occurrenceGroup = prefix + item.name;
      }
      item.items.filter(it => it.type !== 'section').forEach(it => {
        const vars = this.makeVariables(it, childOptions);
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
      } else if (item.type === 'number') {
        // a number can be integer or decimal
        variable.valueType = item.integer ? 'integer' : 'decimal';
      } else if (['slider', 'rating'].includes(item.type)) {
        variable.valueType = 'integer';
      } else if (['date'].includes(item.type)) {
        variable.valueType = 'date';
      } else if (['datetime'].includes(item.type)) {
        variable.valueType = 'datetime';
      } else if (['toggle'].includes(item.type)) {
        variable.valueType = 'boolean';
      } else if (['map'].includes(item.type)) {
        variable.valueType = item.geometryType ? item.geometryType.toLowerCase() : 'point';
      } else if (item.type === 'file') {
        variable.valueType = 'binary';
        // a single media type only, as the accepted file types can be extensions or wildcards
        variable.mimeType = item.accept && /^[\w.+-]+\/[\w.+-]+$/.test(item.accept) ? item.accept : 'application/octet-stream';
      }
      const multiple = item.multiple || item.type === 'checkboxgroup';
      if (options.occurrenceGroup) {
        variable.isRepeatable = true;
        variable.occurrenceGroup = options.occurrenceGroup;
        if (multiple || options.nested) {
          // ponytail: no nested sequences, the value of an occurrence is a JSON list (of paths, for files)
          variable.valueType = 'text';
          delete variable.mimeType;
        }
      } else if (multiple) {
        variable.isRepeatable = true;
      }
      variable.attributes = [];
      ['label', 'description'].forEach(key => {
        if (item[key]) {
          this.makeAttributes(item[key], options.i18n).forEach(attr => {
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
            category.attributes = this.makeAttributes(opt.label, options.i18n).map(attr => { 
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
  }

  makeAttributes (key, i18n) {
    if (i18n && Object.keys(i18n).length > 0) {
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
  }
};
