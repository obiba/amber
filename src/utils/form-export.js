/* eslint-disable no-unused-vars */
const { BadRequest } = require('@feathersjs/errors');

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

      schema.items.forEach(item => {
        const vars = this.makeVariables(item, {
          entityType: entityType,
          i18n: schema.i18n,
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
        formRevision: formRevision,
        variables: variables
      };
    }

    const exportResult = await this.extractExportData(exportData, form, revision, data, multipleOptions.multiple, multipleOptions.groupId);

    const fields = exportData.exportResults[key].fields.concat(exportResult.fields);
    // unique field names
    exportData.exportResults[key].fields = fields.filter((item, pos) => fields.indexOf(item) === pos);
    exportData.exportResults[key].data.push(exportResult.data);
  }

  async extractExportData(exportData, form, revision, data, multiple, groupId) {
    const flattenData = await this.flattenData(exportData, form, revision, data, multiple, groupId);
    return { 
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
    const flattenData = this.flattenByItems(formRevision.schema.items, data);
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
        if (item.items) {
          const npath = path ? [...path] : [];
          npath.push(item.name);
          const rval2 = this.flattenByItems(item.items, data[item.name], npath);
          const prefix = npath.join('.') + '.';
          Object.entries(rval2).forEach(([key, value]) => {
            if (key.startsWith(prefix)) {
              // case of a sub group, items have already been flattened
              rval[key] = value;
            } else {
              rval[prefix + key] = value;
            }
          });
        } else {
          rval[item.name] = this.marshallValue(data[item.name]);
        }
      });
    }
    return rval;
  }

  marshallValue (value) {
    if(typeof(value) === 'object') {
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
      item.items.filter(it => it.type !== 'section').forEach(it => {
        const vars = this.makeVariables(it, {
          entityType: options.entityType,
          i18n: options.i18n,
          repeated: options.repeated,
          prefix: prefix + item.name
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
  }
};