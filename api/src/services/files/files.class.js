const { BadRequest, Forbidden } = require('@feathersjs/errors');
const { uploadFile, getFile, deleteFiles } = require('../../utils/files');
const caseReportAbilities = require('../case-report/case-report.abilities');
const interviewAbilities = require('../interview/interview.abilities');
const { inScope } = require('../../utils/data-api-key');

/** the user or the participant who makes the request */
const ownerOf = (params) => params.user ? params.user._id : (params.participant ? params.participant._id : undefined);

const toReference = (file) => ({
  id: file._id.toString(),
  fileName: file.filename,
  size: file.length,
  contentType: file.metadata.contentType
});

/**
 * Upload, download and removal of the files referenced by the case reports and interviews data.
 */
exports.Files = class Files {
  constructor (options, app) {
    this.options = options || {};
    this.app = app;
  }

  /**
   * Store the file in `params.file` ({ stream, fileName, contentType, size }), in the pending state.
   */
  async create (data, params) {
    const file = params.file;
    if (!file || !file.stream) {
      throw new BadRequest('The file is missing');
    }
    const { maxSize } = this.app.get('files');
    if (file.size > maxSize) {
      throw new BadRequest(`File size exceeds ${maxSize} bytes`);
    }
    if (params.dataApiKey || (params.user && !['interviewer', 'manager', 'administrator'].includes(params.user.role))) {
      throw new Forbidden('You are not allowed to upload files');
    }
    return uploadFile(this.app, file, ownerOf(params));
  }

  /**
   * The GridFS file document, the content is streamed by the service middleware.
   */
  async get (id, params) {
    const file = await getFile(this.app, id);
    await this.checkAccess(file, params);
    return file;
  }

  async remove (id, params) {
    const file = await getFile(this.app, id);
    if (params.dataApiKey || file.metadata.state !== 'pending' || String(file.metadata.uploadedBy) !== String(ownerOf(params))) {
      throw new Forbidden('Only a pending file can be removed, by the one who uploaded it');
    }
    await deleteFiles(this.app, { _id: file._id });
    return toReference(file);
  }

  /**
   * A pending file is accessible by the one who uploaded it only, an attached file follows its record.
   */
  async checkAccess (file, params) {
    const { state, uploadedBy, record } = file.metadata;
    const forbidden = new Forbidden('You are not allowed to access this file');
    if (state === 'pending') {
      if (String(uploadedBy) !== String(ownerOf(params))) throw forbidden;
      return;
    }
    const user = params.user;
    if (params.dataApiKey && record.service === 'case-report') {
      if (!inScope(params.dataApiKey, record.study)) throw forbidden;
      return;
    }
    if (record.service === 'case-report') {
      if (!user || !caseReportAbilities.defineAbilitiesFor(user).can('read', 'case-report')) throw forbidden;
      return;
    }
    // internal call - bypass authorization hooks
    const interview = await this.app.service('interview')._get(record.id);
    if (params.dataApiKey) {
      if (!inScope(params.dataApiKey, interview.study)) throw forbidden;
    } else if (user) {
      if (!interviewAbilities.defineAbilitiesFor(user).can('read', 'interview')) throw forbidden;
      if (user.role === 'interviewer') {
        const campaign = await this.app.service('campaign').get(interview.campaign);
        const members = [...(campaign.investigators || []), ...(campaign.supporters || [])].map(String);
        if (!members.includes(String(user._id))) throw forbidden;
      }
    } else if (!params.participant || String(interview.participant) !== String(params.participant._id)) {
      throw forbidden;
    }
  }
};

