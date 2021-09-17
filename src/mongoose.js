const mongoose = require('mongoose');
const logger = require('./logger');

module.exports = function (app) {
  mongoose.connect(
    process.env.MONGODB_URL || app.get('mongodb'),
    { useCreateIndex: true, useNewUrlParser: true, useUnifiedTopology: true }
  ).catch(err => {
    logger.error(err);
    process.exit(1);
  });

  app.set('mongooseClient', mongoose);
};
