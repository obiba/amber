const assert = require('assert');
const axios = require('axios');
const { Readable } = require('stream');
const { ObjectId } = require('mongodb');
const appPromise = require('../../src/app');
const { getFile, openFile, deletePendingFiles, fileIds } = require('../../src/utils/files');
let app;

const readAll = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString();
};

describe('\'files\' service', () => {
  const emails = ['filesadmin@test.com', 'filesitw1@test.com', 'filesitw2@test.com'];
  const auth = {};
  const users = {};
  let study, form, crf, campaign, participant1, participant2, interview;

  const schema = {
    schema: {
      type: 'object',
      properties: {
        doc: { type: 'string', format: 'file' },
        photos: { type: 'array', format: 'files', items: { type: 'object' } },
        group: { type: 'object', properties: { scan: { type: 'string', format: 'file' } } },
        note: { type: 'string' }
      }
    },
    uischema: {
      type: 'VerticalLayout',
      elements: [
        { type: 'Control', scope: '#/properties/doc' },
        { type: 'Control', scope: '#/properties/photos' },
        { type: 'Control', scope: '#/properties/group/properties/scan' },
        { type: 'Control', scope: '#/properties/note' }
      ]
    }
  };

  const as = (email) => ({ headers: {}, authentication: { strategy: 'jwt', accessToken: auth[email] } });
  const asParticipant = (participant) => ({ headers: {}, participant });

  const upload = (params, content = 'hello', fileName = 'hello.txt') => app.service('files').create({}, {
    ...params,
    file: { stream: Readable.from([Buffer.from(content)]), fileName, contentType: 'text/plain' }
  });

  const exists = async (id) => {
    try {
      await getFile(app, id);
      return true;
    } catch {
      return false;
    }
  };

  const createCaseReport = (email, data) => app.service('case-report').create({
    crfId: crf._id.toString(),
    revision: 1,
    data: { _id: 'CR-' + new ObjectId().toString(), ...data }
  }, as(email));

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
        firstname: 'Files',
        lastname: 'Test',
        language: 'en',
        role: email === emails[0] ? 'administrator' : 'interviewer',
        with2fa: false
      });
      auth[email] = (await app.service('authentication').create({ strategy: 'local', email, password: 'Password1#' })).accessToken;
    }
    const admin = as(emails[0]);
    study = await app.service('study').create({ name: 'Files Test Study' }, admin);
    form = await app.service('form').create({ name: 'files-test-form', study: study._id, schema }, admin);
    await app.service('form-revision').create({ study: study._id, form: form._id, comment: 'files' }, admin);
    crf = await app.service('case-report-form').create({ name: 'Files CRF', study: study._id, form: form._id, state: 'active' }, admin);

    // internal calls - bypass hooks
    campaign = await app.service('campaign')._create({ name: 'files', investigators: [users[emails[1]]._id], supporters: [] });
    participant1 = await app.service('participant')._create({ code: 'FILES001', campaign: campaign._id, activated: true });
    participant2 = await app.service('participant')._create({ code: 'FILES002', campaign: campaign._id, activated: true });
    interview = await app.service('interview')._create({
      code: participant1.code, participant: participant1._id, campaign: campaign._id, study: study._id, state: 'in_progress', steps: []
    });
  });

  after(async () => {
    await app.service('interview')._remove(interview._id).catch(() => {});
    for (const p of [participant1, participant2]) await app.service('participant')._remove(p._id).catch(() => {});
    await app.service('campaign')._remove(campaign._id).catch(() => {});
    const admin = as(emails[0]);
    await app.service('case-report').remove(null, { ...admin, query: { caseReportForm: crf._id } }).catch(() => {});
    await app.service('case-report-form').remove(crf._id, admin).catch(() => {});
    await app.service('form').remove(form._id, admin).catch(() => {});
    await app.service('study').remove(study._id, admin).catch(() => {});
    for (const email of emails) await app.service('user').remove(users[email]._id).catch(() => {});
  });

  it('finds the file ids in the data with the form schema', () => {
    const ids = fileIds(schema, { doc: 'a', photos: [{ id: 'b' }, { id: 'c' }], group: { scan: 'd' }, note: 'e' });
    assert.deepStrictEqual(ids, ['a', 'b', 'c', 'd']);
    assert.deepStrictEqual(fileIds({ items: [] }, { doc: 'a' }), []);
  });

  describe('upload', () => {
    it('stores a pending file, accessible by the uploader only', async () => {
      const ref = await upload(as(emails[1]));
      assert.strictEqual(ref.fileName, 'hello.txt');
      assert.strictEqual(ref.size, 5);
      const file = await app.service('files').get(ref.id, as(emails[1]));
      assert.strictEqual(file.metadata.state, 'pending');
      assert.strictEqual(await readAll(await openFile(app, file)), 'hello');
      await assert.rejects(app.service('files').get(ref.id, as(emails[0])), { name: 'Forbidden' });
      await assert.rejects(app.service('files').remove(ref.id, as(emails[2])), { name: 'Forbidden' });
      await app.service('files').remove(ref.id, as(emails[1]));
      assert.strictEqual(await exists(ref.id), false);
    });

    it('rejects a file too large or of a type not accepted', async () => {
      const config = app.get('files');
      app.set('files', { ...config, maxSize: 3, accept: ['image/*'] });
      try {
        await assert.rejects(upload(as(emails[1])), { name: 'BadRequest', message: /type/ });
        app.set('files', { ...config, maxSize: 3 });
        await assert.rejects(upload(as(emails[1])), { name: 'BadRequest', message: /size/ });
      } finally {
        app.set('files', config);
      }
    });

    it('encrypts the content with a random iv per file', async () => {
      app.set('encrypt_data', true);
      try {
        const ref1 = await upload(as(emails[1]), 'secret');
        const ref2 = await upload(as(emails[1]), 'secret');
        const file1 = await getFile(app, ref1.id);
        const file2 = await getFile(app, ref2.id);
        assert.notStrictEqual(file1.metadata.iv, file2.metadata.iv);
        const db = await app.get('mongodbClient');
        const chunk = await db.collection('files.chunks').findOne({ files_id: file1._id });
        assert.notStrictEqual(chunk.data.buffer.toString(), 'secret');
        assert.strictEqual(await readAll(await openFile(app, file1)), 'secret');
        await app.service('files').remove(ref1.id, as(emails[1]));
        await app.service('files').remove(ref2.id, as(emails[1]));
      } finally {
        app.set('encrypt_data', false);
      }
    });
  });

  describe('case report', () => {
    it('attaches the files, then deletes them with the case report', async () => {
      const doc = await upload(as(emails[1]));
      const photo = await upload(as(emails[1]), 'photo', 'photo.png');
      const cr = await createCaseReport(emails[1], { doc: doc.id, photos: [photo] });
      const file = await app.service('files').get(doc.id, as(emails[2]));
      assert.strictEqual(file.metadata.state, 'attached');
      assert.strictEqual(file.metadata.record.service, 'case-report');
      assert.strictEqual(String(file.metadata.record.id), String(cr._id));
      assert.strictEqual((await getFile(app, photo.id)).metadata.state, 'attached');
      // an attached file cannot be removed directly
      await assert.rejects(app.service('files').remove(doc.id, as(emails[1])), { name: 'Forbidden' });

      await app.service('case-report').remove(cr._id, as(emails[0]));
      assert.strictEqual(await exists(doc.id), false);
      assert.strictEqual(await exists(photo.id), false);
    });

    it('rejects foreign, attached or local file ids', async () => {
      const doc = await upload(as(emails[1]));
      await assert.rejects(createCaseReport(emails[2], { doc: doc.id }), { name: 'BadRequest' });
      await assert.rejects(createCaseReport(emails[1], { doc: 'local:1234' }), { name: 'BadRequest' });
      const cr = await createCaseReport(emails[1], { doc: doc.id });
      await assert.rejects(createCaseReport(emails[1], { doc: doc.id }), { name: 'BadRequest' });
      await app.service('case-report').remove(cr._id, as(emails[0]));
    });
  });

  it('exports the files as their id and name', async () => {
    const doc = await upload(as(emails[1]));
    const photo = await upload(as(emails[1]), 'photo', 'photo.png');
    const cr = await createCaseReport(emails[1], { doc: doc.id, photos: [photo] });
    const result = await app.service('case-report-export').find({ ...as(emails[0]), query: { $limit: 10, caseReportForm: crf._id.toString() } });
    const table = Object.values(result.export)[0];
    const row = table.data.find(r => r._id === cr._id.toString() || r.doc === `${doc.id}/hello.txt`);
    assert.strictEqual(row.doc, `${doc.id}/hello.txt`);
    assert.deepStrictEqual(row.photos, [`${photo.id}/photo.png`]);
    assert.strictEqual(table.files.length, 2);
    const variable = table.variables.find(v => v.name === 'photos');
    assert.strictEqual(variable.mimeType, 'application/octet-stream');
    assert.strictEqual(variable.isRepeatable, true);
    await app.service('case-report').remove(cr._id, as(emails[0]));
  });

  describe('interview', () => {
    const step = (data) => ({ name: 'step1', form: form._id.toString(), revision: 1, state: 'in_progress', data });

    it('attaches the files to the step, with the permissions of the interview', async () => {
      const doc = await upload(as(emails[0]));
      await app.service('interview').patch(interview._id, { steps: [step({ doc: doc.id })] }, as(emails[0]));
      const file = await getFile(app, doc.id);
      assert.strictEqual(file.metadata.state, 'attached');
      assert.strictEqual(file.metadata.record.step, 'step1');

      await app.service('files').get(doc.id, asParticipant(participant1));
      await app.service('files').get(doc.id, as(emails[1]));
      await assert.rejects(app.service('files').get(doc.id, asParticipant(participant2)), { name: 'Forbidden' });
      // not an investigator of the campaign
      await assert.rejects(app.service('files').get(doc.id, as(emails[2])), { name: 'Forbidden' });

      // the step data is saved again, the file is kept
      await app.service('interview').patch(interview._id, { steps: [step({ doc: doc.id, note: 'again' })] }, as(emails[0]));
      assert.strictEqual(await exists(doc.id), true);
    });

    it('deletes the files no longer referenced, or of a removed step', async () => {
      const doc1 = await upload(as(emails[0]));
      const doc2 = await upload(as(emails[0]));
      await app.service('interview').patch(interview._id, { steps: [step({ doc: doc1.id })] }, as(emails[0]));
      await app.service('interview').patch(interview._id, { steps: [step({ doc: doc2.id })] }, as(emails[0]));
      assert.strictEqual(await exists(doc1.id), false);
      assert.strictEqual(await exists(doc2.id), true);
      await app.service('interview').patch(interview._id, { steps: [] }, as(emails[0]));
      assert.strictEqual(await exists(doc2.id), false);
    });

    it('rejects a file uploaded by another participant', async () => {
      const doc = await upload(asParticipant(participant2));
      await assert.rejects(app.service('interview').patch(interview._id, { steps: [step({ doc: doc.id })] }, as(emails[0])), { name: 'BadRequest' });
      await app.service('files').remove(doc.id, asParticipant(participant2));
    });

    it('deletes the files with the interview', async () => {
      const doc = await upload(as(emails[0]));
      const itw = await app.service('interview')._create({
        code: participant2.code, participant: participant2._id, campaign: campaign._id, study: study._id, state: 'in_progress', steps: []
      });
      await app.service('interview').patch(itw._id, { steps: [step({ doc: doc.id })] }, as(emails[0]));
      await app.service('interview').remove(itw._id, as(emails[0]));
      assert.strictEqual(await exists(doc.id), false);
    });
  });

  it('deletes the old pending files', async () => {
    const recent = await upload(as(emails[1]));
    const old = await upload(as(emails[1]));
    const db = await app.get('mongodbClient');
    await db.collection('files.files').updateOne({ _id: new ObjectId(old.id) }, { $set: { 'metadata.uploadedAt': new Date(Date.now() - 8 * 24 * 3600 * 1000) } });
    await deletePendingFiles(app);
    assert.strictEqual(await exists(old.id), false);
    assert.strictEqual(await exists(recent.id), true);
    await app.service('files').remove(recent.id, as(emails[1]));
  });

  describe('REST', () => {
    let server, url;

    before(async () => {
      server = await app.listen(8996);
      url = 'http://localhost:8996/files';
    });

    after(async () => {
      await server.close();
    });

    it('uploads, downloads and removes a file', async () => {
      const headers = { Authorization: `Bearer ${auth[emails[1]]}` };
      const { data: ref } = await axios.post(url, 'some content', {
        headers: { ...headers, 'Content-Type': 'text/plain', 'X-File-Name': encodeURIComponent('été.txt') }
      });
      assert.strictEqual(ref.fileName, 'été.txt');
      const res = await axios.get(`${url}/${ref.id}`, { headers, responseType: 'text' });
      assert.strictEqual(res.data, 'some content');
      assert.match(res.headers['content-disposition'], /attachment/);
      await assert.rejects(axios.get(`${url}/${ref.id}`, { headers: { Authorization: `Bearer ${auth[emails[2]]}` } }), (err) => err.response.status === 403);
      await axios.delete(`${url}/${ref.id}`, { headers });
      await assert.rejects(axios.get(`${url}/${ref.id}`, { headers }), (err) => err.response.status === 404);
    });

    it('requires authentication', async () => {
      await assert.rejects(axios.post(url, 'x', { headers: { 'Content-Type': 'text/plain', 'X-File-Name': 'x.txt' } }), (err) => err.response.status === 401);
    });

    it('rejects a body larger than the maximum size', async () => {
      const config = app.get('files');
      app.set('files', { ...config, maxSize: 3 });
      try {
        await assert.rejects(axios.post(url, 'some content', {
          headers: { Authorization: `Bearer ${auth[emails[1]]}`, 'Content-Type': 'application/json', 'X-File-Name': 'x.json' }
        }), (err) => err.response.status === 400);
      } finally {
        app.set('files', config);
      }
    });
  });
});
