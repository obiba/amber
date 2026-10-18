const assert = require('assert');
const { ObjectId } = require('mongodb');
const formCheckRemove = require('../../src/hooks/form-check-remove');
const formRevisionCheckRemove = require('../../src/hooks/form-revision-check-remove');

const formId = new ObjectId();

// an app whose services count the documents matching a query: `counts[service](query)`
const makeContext = (counts) => ({
  id: 'id1',
  params: {},
  app: {
    service: (name) => ({
      get: async () => name === 'form'
        ? { _id: formId, name: 'F1' }
        : { _id: new ObjectId(), form: formId, revision: 2 },
      find: async ({ query }) => ({ total: counts[name] ? counts[name](query) : 0 })
    })
  }
});

// the interviews of the form: steps.form is stored as an ObjectId
const interviewsOfForm = (query) => query['steps.form'] instanceof ObjectId && query['steps.form'].equals(formId) ? 1 : 0;

// the removal is rejected because of the documents of the given type
const rejectedFor = (type) => (error) => error.data.type === type;

describe('form remove checks', () => {
  it('rejects the removal of a form used by interviews', async () => {
    await assert.rejects(formCheckRemove()(makeContext({ interview: interviewsOfForm })), rejectedFor('interview'));
  });

  it('rejects the removal of a form used by interview designs', async () => {
    await assert.rejects(formCheckRemove()(makeContext({ 'interview-design': interviewsOfForm })), rejectedFor('interview-design'));
  });

  it('rejects the removal of a form revision used by interviews', async () => {
    const counts = { interview: (query) => interviewsOfForm(query) && query['steps.revision'] === 2 };
    await assert.rejects(formRevisionCheckRemove()(makeContext(counts)), rejectedFor('interview'));
  });

  it('rejects the removal of a form revision used by interview designs', async () => {
    await assert.rejects(formRevisionCheckRemove()(makeContext({ 'interview-design': interviewsOfForm })), rejectedFor('interview-design'));
  });

  it('accepts the removal of an unused form', async () => {
    const context = makeContext({});
    assert.strictEqual(await formCheckRemove()(context), context);
    assert.strictEqual(await formRevisionCheckRemove()(context), context);
  });
});
