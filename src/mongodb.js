const { MongoClient } = require('mongodb');
const logger = require('./logger');

module.exports = function (app) {
  const connection = process.env.MONGODB_URL || app.get('mongodb');
  const database = new URL(connection).pathname.substring(1);
  
  const mongoClient = MongoClient.connect(connection)
    .then(client => {
      const db = client.db(database);
      // Store the resolved db for synchronous access
      app.set('mongoDb', db);
      return db;
    })
    .catch(err => {
      logger.error(err);
      process.exit(1);
    });

  app.set('mongodbClient', mongoClient);
};
