const { createLogger, format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
const config = require('./config');

const myFormat = printf(info => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

const logger = createLogger({
  format: combine(
    label({ label: config.market }),
    timestamp(),
    myFormat
  ),
  transports: [
    new transports.File({ filename: 'combined.log' }),
    new transports.File({ filename: 'error.log', level: 'error' })
  ]
});

module.exports = logger;