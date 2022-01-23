/*
   CollisionDb.js
   collision.db interface
   This version uses callbacks instead of promises.
*/
const sqlite3 = require("sqlite3").verbose();
const logL = "[CollisionDb]: ";
const log = require("../../env/logger").moduleLogger;
const config = require("../../env/config");

class CollisionDb {
    constructor(collisionDb = config.env.collisionDb){ 
        const pathToDb = collisionDb.dbStorage;
        this.db = new sqlite3.cached.Database(pathToDb, (error) => {
            if (error) {
                log.error(`${logL}Failed connecting to ${pathToDb}`, error);
                throw new Error(error);
            }
            console.count(`${logL}Connected to ${collisionDb.dbName}`);
        });
        this.db.exec("PRAGMA foreign_keys = ON");
        this.uniqueConstraintRx = /UNIQUE constraint failed/;
    }

    /* Run */
    run(sql, params = [], _callback) {
        this.db.run(sql, params, function (error) {
            if (error) throw new Error(error);
            /* 
               this.lastID:  has a value, only after a successful insert.
               this.changes: has a value, only after a successful update.
            */
            return _callback({
                id: this.lastID,
                changes: this.changes,
            });
        });
    }

    /* Exec */
    exec(sqlTransaction, _callback) {
        this.db.exec(sqlTransaction, (error) => {
            if (error) throw new Error(error);
            _callback();
        });
    }

    /* Get - one row */
    get(sql, params = [], dealWithRow) {
        this.db.get(sql, params, (error, row) => {
            if (error) throw new Error(error);
            dealWithRow(row);
        });
    }

    /* 
        All - get all matching rows
        Pass: sql
        Optional:
        [colNames],
        {callback: callbackFunc,keyName: 'unique_key_to_find'}
    */
    all(sql, params = [], cbParam = {}) {
        return new Promise((resolve, reject) => {
            this.db.all(sql, params, (error, rows) => {
                if (error) {
                    reject(error);
                } else if (cbParam.callback) {
                    resolve(cbParam.callback(rows, cbParam.keyName));
                }
            });
        });
    }

    each(sql, params = [], process_results, process_completion) {
        this.db.each(
            sql,
            params,
            (error, row) => {
                if (error) throw new Error(error);
                return process_results(row);
            },
            (error, completion) => {
                if (error) throw new Error(error);
                return process_completion(completion);
            }
        );
    }

    // sqlite3 way for converting Asynchronous to Synchronous.
    serialize(sqlFunction, processTransactions) {
        this.db.serialize(sqlFunction, (error, result) => {
            if (error) throw new Error(error);
            processTransactions(result);
        });
    }

    /* Statements */
    prepare(sql, params = [], _callback) {
        this.db.prepare(sql, params, (error, statement) => {
            if (error) {
                log.error(`${logL}Prepare Error! SQL: ${sql}`, error);
                throw new Error(error);
            }
            return _callback(statement);
        });
    }

    close() {
        this.db.close((error) => {
            if (error) {
                log.error(`${logL}Error in close!`);
                throw new Error(error);
            }
            log.error(`${logL}Database is closed!`);
        });
    }

    /*   
       callback: 
       Sets these status properties
       { error: false, existsAlready: false, newInsert: false };
    */
    insertIfNotExists(param, callback) {
        let { selectSQL, insertSQL, selectParam, insertParam } = param;
        let result = {};
        let status = {
            error: false,
            existsAlready: false,
            newInsert: false,
        };
        return new Promise(async (resolve, reject) => {
            try {
                result = await this.insert(insertSQL, insertParam);
            } catch (e) {
                const msg = `${logL}Insert Error: ${insertSQL} ${insertParam}: ${e.message}`;

                if (this.uniqueConstraintRx.test(e.message)) {
                    log.trace(`${msg}: Exists already`);
                    status.existsAlready = true;
                } else {
                    status.error = true;
                    log.error(`${msg}`);
                    throw new Error(`${msg}`);
                }
            }
            if (!status.existsAlready) status.newInsert = true;
            try {
                result = await this.select(selectSQL, selectParam);
            } catch (e) {
                reject(new Error(`${logL}: ${selectSQL}: ${selectParam}: ${this._toStr(e)}`));
            }
            callback(status);
            resolve(result);
        });
    }

    getEachStreetNameLike(param, dealWithRow) {
        let getEach = () => {
            return new Promise((resolve, reject) => {
                let allRows = [];
                try {
                    this.db.each(
                        "SELECT * FROM street WHERE name like ?",
                        param,
                        (error, row) => {
                            if (error) reject(error);
                            dealWithRow(row);
                        },
                        (error, finalRes) => {
                            if (error) reject(error);
                            resolve(finalRes);
                        }
                    );
                } catch (e) {
                    log.error(`${logL}GetEach Error! `, e);
                }
            });
        };
        let result;
        (async () => {
            try {
                result = await getEach();
            } catch (e) {
                log.error(`${logL}Error in getStreeNamesLike: `, e);
            }
        })();
        return result;
    }

    /* ----------------------------------------------------------*/
    /* SELECT                                                    */
    /* ----------------------------------------------------------*/
    select(selectSQL, params = []) {
        return new Promise((resolve, reject) => {
            this.db.get(selectSQL, params, (error, row) => {
                if (error) reject(error);
                if (row) resolve(row);
                resolve();
            });
        });
    }

    /* ----------------------------------------------------------*/
    /* INSERT                                                    */
    /* ----------------------------------------------------------*/
    insert(insertSQL, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(insertSQL, params, function (error) {
                if (error) reject(error);
                /* 
                  'this' contains only 2 properties after a successful run.
                   this.lastID has a value, only after a successful insert.
                   this.changes has a value, only after a successful update.
                */
                resolve({
                    id: this.lastID,
                    changes: this.changes,
                });
            });
        });
    }
    /* ----------------------------------------------------------*/
    /* PREPARE                                                    */
    /* ----------------------------------------------------------*/

    update(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (error) {
                if (error) reject(error);
                resolve(params);
            });
        });
    }

    /* ----------------------------------------------------------*/
    /* DELETE                                                    */
    /* ----------------------------------------------------------*/

    delete(sql, params = []) {
        return new Promise((resolve, reject) => {
            this.db.run(sql, params, function (error) {
                if (error) reject(error);
                resolve(params);
            });
        });
    }

    /* TODO Static method somewhere else */
    _toStr(obj = {}) {
        return JSON.stringify(obj, null, 2);
    }
}

module.exports = CollisionDb;
