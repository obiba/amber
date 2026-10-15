const assert = require('assert');
const { FormDataExport } = require('../../src/utils/form-export');
const legacy = require('../fixtures/demo-form.json');
const json = require('../fixtures/demo-form-json.json');

// the JSON Forms conversion of a form keeps its data dictionary and its data rows
describe('\'form-export\' utils', () => {
  const exporter = new FormDataExport({}, { get: () => ({ entity_type: 'Participant' }) });
  const variables = (schema) => exporter.formItems(schema)
    .map(item => exporter.makeVariables(item, { entityType: 'Participant', i18n: schema.i18n || schema.translations })).flat();

  it('makes the same variables', () => {
    assert.deepStrictEqual(variables(json), variables(legacy));
  });

  it('flattens the same data', () => {
    const data = {
      _id: 'x',
      GROUP1: { CHECKBOX: ['a'], GROUP2: { TEXT: 'b' } },
      MAP: { type: 'Feature', geometry: { type: 'Point', coordinates: [1, 2] }, properties: null }
    };
    assert.deepStrictEqual(exporter.flattenByItems(exporter.formItems(json), data), exporter.flattenByItems(exporter.formItems(legacy), data));
  });
});
