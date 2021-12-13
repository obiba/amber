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
};
