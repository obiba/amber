const user = require('./user/user.service.js');
const study = require('./study/study.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(user);
  app.configure(study);
};
