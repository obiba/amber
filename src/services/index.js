const user = require('./user/user.service.js');
const study = require('./study/study.service.js');
const email = require('./email/email.service.js');
const authManagement = require('./auth-management/auth-management.service.js');
const account = require('./account/account.service.js');
const group = require('./group/group.service.js');
const form = require('./form/form.service.js');
const metrics = require('./metrics/metrics.service.js');
const formRevision = require('./form-revision/form-revision.service.js');
const caseReportForm = require('./case-report-form/case-report-form.service.js');
const formRevisionDigest = require('./form-revision-digest/form-revision-digest.service.js');
const crfs = require('./crfs/crfs.service.js');
const caseReport = require('./case-report/case-report.service.js');
const caseReportExport = require('./case-report-export/case-report-export.service.js');
const subjects = require('./subjects/subjects.service.js');
const audit = require('./audit/audit.service.js');
const participant = require('./participant/participant.service.js');
const campaign = require('./campaign/campaign.service.js');
const formI18n = require('./form-i18n/form-i18n.service.js');
const interviewDesign = require('./interview-design/interview-design.service.js');
const interview = require('./interview/interview.service.js');
const participantExport = require('./participant-export/participant-export.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(user);
  app.configure(study);
  app.configure(email);
  app.configure(authManagement);
  app.configure(account);
  app.configure(group);
  app.configure(form);
  app.configure(metrics);
  app.configure(formRevision);
  app.configure(caseReportForm);
  app.configure(formRevisionDigest);
  app.configure(crfs);
  app.configure(caseReport);
  app.configure(caseReportExport);
  app.configure(subjects);
  app.configure(audit);
  app.configure(participant);
  app.configure(campaign);
  app.configure(formI18n);
  app.configure(interviewDesign);
  app.configure(interview);
  app.configure(participantExport);
};
