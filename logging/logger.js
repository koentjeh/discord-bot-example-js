const fs = require('fs');

// We could define an interface as Logger and rename this class as FileLogger
export class Logger {

    /**
     * Set filename once.
     * @param fileName
     */
    constructor(fileName = 'log/log.txt') {
        this.file = fileName;
    }

    /**
     * Log the message to file.
     * @param message
     */
    log(message) {
        // append datetime
        message = `${new Date().toLocaleString()} - ${message}\n\n`;

        fs.appendFile(this.file, message, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    /**
     * Prepend Success and log message to file.
     * @param message
     */
    success(message) {
        this.log('SUCCESS: ' + message);
    }

    /**
     * Prepend Success and log message to file.
     * @param message
     */
    warn(message) {
        this.log('WARN: ' + message);
    }

    /**
     * Prepend Success and log message to file.
     * @param message
     */
    error(message) {
        this.log('ERROR: ' + message);
    }
}
