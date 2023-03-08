
import winston from "winston";

const logLevel = process.env.LOG_LEVEL || "info";
const logToConsole = process.env.LOG_TO_CONSOLE ? process.env.LOG_TO_CONSOLE == "true" : true;
const logToFile = process.env.LOG_TO_FILE ? process.env.LOG_TO_FILE == "true" : true;
const logFileName = process.env.LOG_FILE_PATH || "./SystemOut.log";

const consoleFormat = winston.format.printf(info => {
    if (typeof info.message == "object") info.message = JSON.stringify(info.message);
    if (info.stack) info.message = info.stack.replace("Error: ", "");
    return `${info.timestamp} [${info.level}] : ${info.message} ` 
});

const toConsole = new winston.transports.Console({
    level: logLevel,
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        consoleFormat
    )
});

const toFile = new winston.transports.File({
    filename: logFileName,
    level: logLevel,
    maxsize: 10 * 1048576,
    maxFiles: 6,
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json({space: 2})
    )
});

const transports = [];
if (logToConsole) transports.push(toConsole);
if (logToFile) transports.push(toFile);
const logger = winston.createLogger({transports});
logger.error = err => {
    if (err instanceof Error) logger.log({ level: 'error', message: err.message, stack: err.stack });
    else logger.log({ level: 'error', message: err });
}

export default logger;