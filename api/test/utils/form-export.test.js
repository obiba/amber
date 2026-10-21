const assert = require('assert');
const { FormDataExport, toOpalRow } = require('../../src/utils/form-export');
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

  describe('Opal import', () => {
    const schema = {
      uischema: { type: 'VerticalLayout', elements: [] },
      schema: {
        type: 'object',
        properties: {
          weight: { type: 'number' },
          age: { type: 'integer' },
          CONTACTS: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                phones: { type: 'array', items: { type: 'string' } },
                scan: { type: 'string', format: 'file' }
              }
            }
          }
        }
      }
    };
    const items = exporter.formItems(schema);
    const variables = items.flatMap(item => [exporter.makeVariables(item, { entityType: 'Participant' })].flat());
    const variable = (name) => variables.find(v => v.name === name);

    it('makes decimal and integer variables', () => {
      assert.strictEqual(variable('weight').valueType, 'decimal');
      assert.strictEqual(variable('age').valueType, 'integer');
    });

    it('makes the variables of a list of objects repeatable, in an occurrence group', () => {
      assert.deepStrictEqual(['CONTACTS.name', 'CONTACTS.phones', 'CONTACTS.scan'].map(name => [variable(name).isRepeatable, variable(name).occurrenceGroup]),
        [[true, 'CONTACTS'], [true, 'CONTACTS'], [true, 'CONTACTS']]);
      assert.strictEqual(variable('CONTACTS.name').valueType, 'text');
      // no nested sequences
      assert.strictEqual(variable('CONTACTS.phones').valueType, 'text');
      assert.strictEqual(variable('CONTACTS.scan').valueType, 'binary');
    });

    it('splits a matrix in one variable per row, categorical or boolean', () => {
      const matrixSchema = {
        schema: {
          type: 'object',
          properties: {
            MATRIX: { type: 'object', format: 'radio-matrix' },
            MATRIX_CHECK: { type: 'object', format: 'radio-matrix' }
          }
        },
        uischema: {
          type: 'VerticalLayout',
          elements: [
            {
              type: 'Control',
              scope: '#/properties/MATRIX',
              options: {
                items: [{ key: 'BLUE', label: 'Blue' }, { key: 'RED', label: 'Red' }],
                values: [{ key: '1', label: 'Dislike' }, { key: '2', label: 'Like' }]
              }
            },
            {
              type: 'Control',
              scope: '#/properties/MATRIX_CHECK',
              options: { checkboxMode: true, items: [{ key: 'BLUE', label: 'Blue' }, { key: 'RED', label: 'Red' }] }
            }
          ]
        }
      };
      const matrixItems = exporter.formItems(matrixSchema);
      const vars = matrixItems.flatMap(item => [exporter.makeVariables(item, { entityType: 'Participant' })].flat());
      assert.deepStrictEqual(vars.map(v => [v.name, v.valueType, (v.categories || []).map(c => c.name).join('|')]), [
        ['MATRIX.BLUE', 'text', '1|2'],
        ['MATRIX.RED', 'text', '1|2'],
        ['MATRIX_CHECK.BLUE', 'boolean', ''],
        ['MATRIX_CHECK.RED', 'boolean', '']
      ]);
      assert.strictEqual(vars[0].attributes[0].value, 'Blue');
      const row = exporter.flattenByItems(matrixItems, { _id: 'P1', MATRIX: { RED: '2' }, MATRIX_CHECK: { BLUE: true } });
      assert.deepStrictEqual(row, {
        _id: 'P1', 'MATRIX.BLUE': undefined, 'MATRIX.RED': '2', 'MATRIX_CHECK.BLUE': true, 'MATRIX_CHECK.RED': false
      });
      // not answered
      assert.strictEqual(exporter.flattenByItems(matrixItems, { _id: 'P2' })['MATRIX_CHECK.RED'], undefined);
    });

    it('flattens a list of objects as occurrences, with the file paths', async () => {
      const row = exporter.flattenByItems(items, {
        _id: 'P1',
        weight: 70.5,
        CONTACTS: [{ name: 'Al "Bo"', phones: ['1', '2'] }, { name: 'Cy' }]
      });
      assert.deepStrictEqual(row['CONTACTS.name'], ['Al "Bo"', 'Cy']);
      assert.deepStrictEqual(row['CONTACTS.phones'], ['["1","2"]', null]);
      await exporter.resolveFiles(row);
      assert.deepStrictEqual(row['CONTACTS.scan'], [null, null]);
      assert.deepStrictEqual(toOpalRow(row)['CONTACTS.name'], '"Al ""Bo""","Cy"');
      assert.deepStrictEqual(toOpalRow({ n: [1, null, 3] }).n, '1,,3');
    });
  });
});
