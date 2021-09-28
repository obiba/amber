const { createLogger, format, transports } = require('winston');

const level = process.env.LOG_LEVEL ? process.env.LOG_LEVEL : 'info';
const trans = [
  new transports.Console()
];

if (process.env.LOG_FILE) {
  trans.push(
    new transports.File({
      filename: process.env.LOG_FILE,
      level: process.env.LOG_FILE_LEVEL ? process.env.LOG_FILE_LEVEL : level
    }));
}

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = createLogger({
  // To see more detailed errors, change this to 'debug' or 'silly'
  level: level,
  format: format.combine(
    format.splat(),
    format.simple(),
    format.timestamp(),
    //format.prettyPrint()
  ),
  transports: trans,
});

module.exports = logger;
