const mysql = require('mysql');

export class Database {

    /**
     * Set database configuration once.
     * @param {object} config
     */
    constructor(config) {
        this.config = config;
    }

    /**
     * Open connection to Mysql Database
     * @returns {Connection}
     */
    connect() {
        return mysql.createConnection(this.config);
    }

    /**
     * Instead of calling query() method we can define a create user function once.
     */
    createUser(username, password) {

        // TODO: add sql query to create user with given arguments.

        // return mysql.createQuery();
    }
}
