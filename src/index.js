/* eslint-disable no-console */
require('dotenv').config();
const os = require('os');
const cluster = require('cluster');
const logger = require('./logger');

const start = async () => {

  const app = require('./app');
  const port = app.get('port');
  const server = app.listen(port);
  
  // in case there is no administrator user and seeding env variables are provided
  // seed an administrator user
  if (process.env.ADMINISTRATOR_EMAIL && process.env.ADMINISTRATOR_PWD) {
    const userInfo = {
      email: process.env.ADMINISTRATOR_EMAIL,
      password: process.env.ADMINISTRATOR_PWD,
      firstname: 'Seed',
      lastname: 'Vicious',
      permissions: ['administrator']
    };
    app.service('user').find({
      query: {
        $limit: 0,
        permissions: {
          $in: 'administrator' 
        }
      }
    })
      .then(users => {
        if (users.total === 0) {
          logger.debug('Seeding with: %s', userInfo);
          try {
            app.service('user').create(userInfo);
          } catch (error) {
            // ignore
          }
        }
      });
  }
  
  process.on('unhandledRejection', (reason, p) =>
    logger.error('Unhandled Rejection at: Promise ', p, reason)
  );
  
  server.on('listening', () =>
    logger.info('Feathers application started on http://%s:%d', app.get('host'), port)
  );
  
};

const clusterWorkerSize = process.env.CLUSTER_COUNT || os.cpus().length;

if (clusterWorkerSize > 1) {
  if (cluster.isMaster) {
    for (let i=0; i < clusterWorkerSize; i++) {
      cluster.fork();
    }

    cluster.on('exit', function(worker) {
      console.log('Worker', worker.id, ' has exited.');
    });
  } else {
    start();
  }
} else {
  start();
}