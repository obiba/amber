const assert = require('assert');
const axios = require('axios');
const { Readable } = require('stream');
const { ObjectId } = require('mongodb');
const appPromise = require('../../src/app');
let app;

describe('\'api-key\' service', () => {
  const emails = ['apikeyadmin@test.com', 'apikeyitw@test.com'];
  const auth = {};
  const users = {};
  const studies = [];
  const crfs = [];
  const forms = [];
  const files = [];
  let apiKey, server;
  const url = 'http://localhost:8995';

  const schema = {
    schema: {
      type: 'object',
      properties: {
        doc: { type: 'string', format: 'file' },
        note: { type: 'string' }
      }
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/doc' },
        { type: 'Control', scope: '#/properties/note' }
      ]
    }
  };

  const as = (email) => ({ headers: {}, authentication: { strategy: 'jwt', accessToken: auth[email] } });
  const withKey = (key) => ({ headers: { 'x-api-key': key } });
  const status = (code) => (err) => err.response && err.response.status === code;
  const exportTables = async (key, query = {}) => (await axios.get(`${url}/case-report-export`, {
    ...withKey(key), params: { $limit: 100, ...query }
  })).data.data;

  before(async function () {
    this.timeout(30000);
    app = await appPromise;
    await app.get('mongodbClient');
    for (const email of emails) {
      const found = await app.service('user').find({ query: { email } });
      for (const user of found.data) await app.service('user').remove(user._id);
      users[email] = await app.service('user').create({
        email,
        password: 'Password1#',
        firstname: 'ApiKey',
        lastname: 'Test',
        language: 'en',
        role: email === emails[0] ? 'administrator' : 'manager',
        with2fa: false
      });
      auth[email] = (await app.service('authentication').create({ strategy: 'local', email, password: 'Password1#' })).accessToken;
    }
    const admin = as(emails[0]);
    // two studies, each with a case report referring a file
    for (const name of ['ApiKey Study A', 'ApiKey Study B']) {
      const study = await app.service('study').create({ name }, admin);
      const form = await app.service('form').create({ name: `${name}-form`.replace(/ /g, '-'), study: study._id, schema }, admin);
      await app.service('form-revision').create({ study: study._id, form: form._id, comment: 'api key' }, admin);
      const crf = await app.service('case-report-form').create({ name: `${name} CRF`, study: study._id, form: form._id, state: 'active' }, admin);
      const file = await app.service('files').create({}, {
        ...admin,
        file: { stream: Readable.from([Buffer.from(name)]), fileName: 'doc.txt', contentType: 'text/plain' }
      });
      await app.service('case-report').create({
        crfId: crf._id.toString(),
        revision: 1,
        data: { _id: 'AK-' + new ObjectId().toString(), doc: file.id, note: name }
      }, admin);
      studies.push(study);
      forms.push(form);
      crfs.push(crf);
      files.push(file);
    }
    server = await app.listen(8995);
  });

  after(async () => {
    await server.close();
    const admin = as(emails[0]);
    // no multi remove on the service
    await (await app.service('api-key').getModel()).deleteMany({ name: { $regex: '^ApiKey Test' } });
    for (let i = 0; i < studies.length; i++) {
      await app.service('case-report').remove(null, { ...admin, query: { caseReportForm: crfs[i]._id } }).catch(() => {});
      await app.service('case-report-form').remove(crfs[i]._id, admin).catch(() => {});
      await app.service('form').remove(forms[i]._id, admin).catch(() => {});
      await app.service('study').remove(studies[i]._id, admin).catch(() => {});
    }
    for (const email of emails) await app.service('user').remove(users[email]._id).catch(() => {});
  });

  it('is managed by administrators, the key is shown once and the hash never', async () => {
    // the hash is protected from external clients
    const withJwt = { headers: { Authorization: `Bearer ${auth[emails[0]]}` } };
    apiKey = (await axios.post(`${url}/api-key`, { name: 'ApiKey Test', studies: [studies[0]._id.toString()], hash: 'forged' }, withJwt)).data;
    assert.match(apiKey.key, /^amb_/);
    assert.strictEqual(apiKey.prefix, apiKey.key.substring(0, 8));
    assert.strictEqual(apiKey.hash, undefined);
    const read = (await axios.get(`${url}/api-key/${apiKey._id}`, withJwt)).data;
    assert.strictEqual(read.key, undefined);
    assert.strictEqual(read.hash, undefined);
    await assert.rejects(app.service('api-key').find(as(emails[1])), { name: 'Forbidden' });
  });

  it('extracts the data of the studies in its scope only', async () => {
    const all = await exportTables(apiKey.key);
    // no duplicates when the limit is split in chunks, without $skip
    const { data: chunked } = await axios.get(`${url}/case-report-export`, { ...withKey(apiKey.key), params: { $limit: 1000 } });
    assert.strictEqual(chunked.found, chunked.total);
    assert.deepStrictEqual(Object.keys(all), [`${crfs[0].name}-1`]);
    assert.deepStrictEqual(await exportTables(apiKey.key, { study: studies[1]._id.toString() }), {});
    // date range on the records update, as sent in a REST query
    assert.deepStrictEqual(Object.keys(await exportTables(apiKey.key, { 'updatedAt[$gte]': new Date(Date.now() - 3600000).toISOString() })), [`${crfs[0].name}-1`]);
    assert.deepStrictEqual(await exportTables(apiKey.key, { 'updatedAt[$gte]': new Date(Date.now() + 3600000).toISOString() }), {});
    const { data: found } = await axios.get(`${url}/study`, withKey(apiKey.key));
    assert.deepStrictEqual(found.data.map(s => String(s._id)), [String(studies[0]._id)]);
    const { data: crfFound } = await axios.get(`${url}/case-report-form`, withKey(apiKey.key));
    assert.deepStrictEqual(crfFound.data.map(c => String(c._id)), [String(crfs[0]._id)]);
    const { data: interviews } = await axios.get(`${url}/interview-export`, { ...withKey(apiKey.key), params: { $limit: 100 } });
    assert.deepStrictEqual(interviews.data, {});
  });

  it('lists the campaign names of its studies, to filter the interviews', async () => {
    const design = await app.service('interview-design')._create({
      name: 'ApiKey Design', study: studies[0]._id, steps: [{ name: 'step1', form: forms[0]._id, revision: 1 }]
    });
    const campaigns = [];
    for (const [i, study] of [studies[0], studies[0], studies[1]].entries()) {
      campaigns.push(await app.service('campaign')._create({
        name: `ApiKey Campaign ${i}`, study: study._id, interviewDesign: design._id, investigators: [users[emails[1]]._id], withPassword: true
      }));
    }
    const interviews = [];
    for (const campaign of campaigns.slice(0, 2)) {
      interviews.push(await app.service('interview')._create({
        code: `AK-${campaign.name.slice(-1)}`, campaign: campaign._id, study: studies[0]._id, interviewDesign: design._id, state: 'completed',
        steps: [{ name: 'step1', form: forms[0]._id, revision: 1, state: 'completed', data: { note: campaign.name } }]
      }));
    }
    try {
      const { data: found } = await axios.get(`${url}/campaign`, { ...withKey(apiKey.key), params: { $sort: { name: 1 } } });
      assert.deepStrictEqual(found.data.map(c => c.name), ['ApiKey Campaign 0', 'ApiKey Campaign 1']);
      // no campaign settings
      assert.deepStrictEqual(Object.keys(found.data[0]).sort(), ['_id', 'interviewDesign', 'name', 'study']);
      await assert.rejects(axios.patch(`${url}/campaign/${campaigns[0]._id}`, { name: 'x' }, withKey(apiKey.key)), status(403));

      const { data: itw } = await axios.get(`${url}/interview-export`, { ...withKey(apiKey.key), params: { $limit: 100, campaign: campaigns[1]._id.toString() } });
      const rows = Object.values(itw.data).flatMap(t => t.data);
      assert.deepStrictEqual(rows.map(r => r.note), ['ApiKey Campaign 1']);
    } finally {
      for (const interview of interviews) await app.service('interview')._remove(interview._id);
      for (const campaign of campaigns) await app.service('campaign')._remove(campaign._id);
      await app.service('interview-design')._remove(design._id);
    }
  });

  it('downloads the files of the studies in its scope only', async () => {
    const res = await axios.get(`${url}/files/${files[0].id}`, { ...withKey(apiKey.key), responseType: 'text' });
    assert.strictEqual(res.data, 'ApiKey Study A');
    await assert.rejects(axios.get(`${url}/files/${files[1].id}`, withKey(apiKey.key)), status(403));
  });

  it('audits the extractions with the key name', async () => {
    await exportTables(apiKey.key);
    const audits = await app.service('audit')._find({ query: { 'apiKey._id': new ObjectId(apiKey._id), $sort: { createdAt: -1 }, $limit: 1 }, paginate: false });
    assert.strictEqual(audits[0].apiKey.name, 'ApiKey Test');
    const found = await app.service('audit').find({ ...as(emails[0]), query: {
      'apiKey._id': apiKey._id.toString(),
      createdAt: { $gte: new Date(Date.now() - 60000).toISOString() },
      $limit: 1
    } });
    assert.strictEqual(found.data[0].apiKey.name, 'ApiKey Test');
  });

  it('cannot write nor read other services', async () => {
    await assert.rejects(axios.post(`${url}/study`, { name: 'nope' }, withKey(apiKey.key)), status(403));
    await assert.rejects(axios.post(`${url}/files`, 'x', { headers: { ...withKey(apiKey.key).headers, 'Content-Type': 'text/plain', 'X-File-Name': 'x.txt' } }), status(403));
    // an existing name out of scope is not revealed by the uniqueness check
    await assert.rejects(axios.post(`${url}/case-report-form`, { name: crfs[1].name, study: studies[1]._id, form: forms[1]._id }, withKey(apiKey.key)), status(403));
    await assert.rejects(axios.get(`${url}/case-report`, withKey(apiKey.key)), status(401));
    await assert.rejects(axios.get(`${url}/participant`, withKey(apiKey.key)), status(401));
    await assert.rejects(axios.get(`${url}/api-key`, withKey(apiKey.key)), status(401));
  });

  it('loses the removed studies from its scope', async () => {
    const admin = as(emails[0]);
    const study = await app.service('study').create({ name: 'ApiKey Study C' }, admin);
    const key = await app.service('api-key').create({ name: 'ApiKey Test C', studies: [studies[0]._id, study._id] }, admin);
    await app.service('study').remove(study._id, admin);
    const read = await app.service('api-key').get(key._id, admin);
    assert.deepStrictEqual(read.studies.map(String), [String(studies[0]._id)]);
  });

  it('is rejected when unknown, deactivated, expired or regenerated', async () => {
    const admin = as(emails[0]);
    await assert.rejects(exportTables('amb_unknown'), status(401));
    await app.service('api-key').patch(apiKey._id, { active: false }, admin);
    await assert.rejects(exportTables(apiKey.key), status(401));
    await app.service('api-key').patch(apiKey._id, { active: true, expiresAt: new Date(Date.now() - 1000) }, admin);
    await assert.rejects(exportTables(apiKey.key), status(401));
    const regenerated = await app.service('api-key').patch(apiKey._id, { expiresAt: null, regenerate: true }, admin);
    assert.notStrictEqual(regenerated.key, apiKey.key);
    await assert.rejects(exportTables(apiKey.key), status(401));
    assert.ok(await exportTables(regenerated.key));
  });
});
