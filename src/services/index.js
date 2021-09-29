const user = require('./user/user.service.js');
const study = require('./study/study.service.js');
const email = require('./email/email.service.js');
const authManagement = require('./auth-management/auth-management.service.js');
const account = require('./account/account.service.js');
const group = require('./group/group.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(user);
  app.configure(study);
  app.configure(email);
  app.configure(authManagement);
  app.configure(account);
  app.configure(group);
};
