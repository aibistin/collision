/*
   Insert to Collision Db. 
*/
"use strict";
const log = require("../../../env/logger").moduleLogger;
const logL = "[DbInsert] ";

const dbInserts = {
    street: {
        insertSQL: `INSERT INTO street ( name, borough_code, zip_code) VALUES ( ?, ?, ?) `,
        selectSQL: `SELECT id, name, borough_code, zip_code FROM street WHERE name=? AND borough_code=? AND zip_code=? `,
        insertCols: ["name", "borough_code", "zip_code"],
        selectCols: ["name", "borough_code", "zip_code"]
    },
    vehicle: {
        insertSQL: `INSERT INTO vehicle (type_code) VALUES (?)`,
        selectSQL: `SELECT id, type_code FROM vehicle WHERE type_code = ?`,
        insertCols: ["type_code"],
        selectCols: ["type_code"]
    },
    coordinate: {
        insertSQL: `INSERT INTO coordinate ( latitude, longitude) VALUES (?, ?)`,
        insertCols: ["latitude", "longitude"],
        selectSQL: `SELECT id, latitude, longitude FROM coordinate WHERE latitude=? AND longitude=?`,
        selectCols: ["latitude", "longitude"]
    },
    contributing_factor: {
        insertSQL: `INSERT INTO contributing_factor (factor) VALUES (?)`,
        insertCols: ["factor"],
        selectSQL: `SELECT id, factor FROM contributing_factor WHERE factor = ? `,
        selectCols: ["factor"]
    },
    collision: {
        insertSQL: ` 
                      INSERT INTO collision (
                          unique_key,
                          date,
                          number_of_persons_injured,
                          number_of_persons_killed,
                          number_of_pedestrians_injured,
                          number_of_pedestrians_killed,
                          number_of_cyclists_injured,
                          number_of_cyclists_killed,
                          number_of_motorists_injured,
                          number_of_motorists_killed,
                          cross_street_id,
                          off_street_id,
                          on_street_id,
                          coordinate_id
                      )
                      VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        insertCols: [
            "unique_key",
            "date",
            "number_of_persons_injured",
            "number_of_persons_killed",
            "number_of_pedestrians_injured",
            "number_of_pedestrians_killed",
            "number_of_cyclists_injured",
            "number_of_cyclists_killed",
            "number_of_motorists_injured",
            "number_of_motorists_killed",
            "cross_street_id",
            "off_street_id",
            "on_street_id",
            "coordinate_id"
        ],
        selectSQL: ` SELECT
         unique_key, 
         date, 
         number_of_persons_injured,
         number_of_persons_killed,
         number_of_pedestrians_injured,
         number_of_pedestrians_killed,
         number_of_cyclists_injured,
         number_of_cyclists_killed,
         number_of_motorists_injured,
         number_of_motorists_killed,
         cross_street_id,
         off_street_id,
         on_street_id,
         coordinate_id
        FROM collision WHERE
            unique_key = ?
            AND date       = ?
            AND number_of_persons_injured     = ?
            AND number_of_persons_killed      = ?
            AND number_of_pedestrians_injured = ?
            AND number_of_pedestrians_killed  = ?
            AND number_of_cyclists_injured    = ?
            AND number_of_cyclists_killed     = ?
            AND number_of_motorists_injured   = ?
            AND number_of_motorists_killed    = ? `,
        selectCols: [
            "unique_key",
            "date",
            "number_of_persons_injured",
            "number_of_persons_killed",
            "number_of_pedestrians_injured",
            "number_of_pedestrians_killed",
            "number_of_cyclists_injured",
            "number_of_cyclists_killed",
            "number_of_motorists_injured",
            "number_of_motorists_killed"
        ]
    },
    collision_vehicle: {
        insertSQL: `INSERT INTO collision_vehicle (
                        collision_unique_key,
                        vehicle_id,
                        collision_vehicle_index
                    )
                    VALUES (?, ?, ?)`,
        insertCols: ["collision_unique_key", "vehicle_id", "collision_vehicle_index"],
        selectSQL: `SELECT collision_unique_key, vehicle_id, collision_vehicle_index  FROM collision_vehicle
                      WHERE  collision_unique_key = ?
                      AND    vehicle_id = ?
                      AND    collision_vehicle_index = ?`,
        selectCols: ["collision_unique_key", "vehicle_id", "collision_vehicle_index"]
    },
    collision_contributing_factor: {
        insertSQL: `INSERT INTO collision_contributing_factor (
                      collision_unique_key,
                      contributing_factor_id,
                      collision_contributing_vehicle_index) VALUES (?, ?, ?) `,
        insertCols: [
            "collision_unique_key",
            "contributing_factor_id",
            "collision_contributing_vehicle_index"
        ],
        selectSQL: `SELECT collision_unique_key,contributing_factor_id ,collision_contributing_vehicle_index  FROM collision_contributing_factor
                      WHERE  collision_unique_key = ?
                      AND    contributing_factor_id = ?
                      AND    collision_contributing_vehicle_index = ? `,
        selectCols: [
            "collision_unique_key",
            "contributing_factor_id",
            "collision_contributing_vehicle_index"
        ]
    }
};

/***************************************************************************
 *    DB Insert Functions
 ***************************************************************************/
const DbInsert = class DBInsert {
    constructor(db) {
        this.tables = [
            "collision",
            "street",
            "vehicle",
            "coordinate",
            "contributing_factor",
            "collision_vehicle",
            "collision_contributing_factor"
        ];
        /* Cache some db tables */
        this.streetInDb = {}; // name : 'id'
        this.vehicleInDb = {}; // type_code : 'id'
        this.contribFactorInDb = {}; // factor : 'id'
        this.coordinateInDb = {}; // factor : 'id'

        this.count = {
            badStreets: 0,
            collisionInsertAttempts: 0,
            contribFactorInsertAttempts: 0,
            coOrdinateInsertAttempts: 0,
            streetInsertAttempts: 0,
            vehicleInsertAttempts: 0,
            collisionVehicleInsertAttempts: 0,
            collisionContribFactorInsertAttempts: 0,
            newInserts: {},
            existsAlready: {},
            error: {}
        };

        this.tables.forEach(table => {
            this.count.newInserts[table] = 0;
            this.count.existsAlready[table] = 0;
            this.count.error[table] = 0;
        });

        this.db = db;
    }

    /*
        streetRec = {
           table: {
               name: "34-24 This St.",
               borough_code: 'bx',
               zip_code:  '11334',
           },
           streetIdType: "on_street_id"
        };
        streetType: ["on_street_name", "off_street_name", "cross_street_name"] 
    */

    async insertCollision(collisionRec) {
        let result;
        for (const streetRec of collisionRec.streets) {
            if (!streetRec || !streetRec.table.name) {
                log.error(`${logL}Street has no name: `, streetRec);
                this.count.badStreets++;
                throw new Error(`${logL}Street has no name: `, streetRec);
            }

            dbInserts.street.table = {
                ...streetRec.table
            };

            const name = dbInserts.street.table.name;
            if (this.streetInDb[name]) {
                collisionRec.collision[streetRec.streetIdType] = this.streetInDb[name];
                log.trace(`Street: '${name}' already in db: '${this.streetInDb[name]}'`);
                this.count.existsAlready.street++;
            } else {
                try {
                    result = await this.insertSingleRow(dbInserts.street, "street");
                    log.trace(`${logL}Result from street insert ${this._toStr(result)}`);
                    this.count.streetInsertAttempts++;
                    /* ["on_street_name", "off_street_name", "cross_street_name"] */
                    if (result && result.id)
                        this.streetInDb[name] = collisionRec.collision[streetRec.streetIdType] =
                            result.id;
                } catch (e) {
                    log.error(`${logL}Error from street insert, ${this._toStr(e)}`);
                }
            }
        }

        let vIdx = 0;
        for (const vehicleRec of collisionRec.vehicles) {
            log.trace(`${logL}About to insert vehicle: `, vehicleRec);
            dbInserts.vehicle.table = {
                ...vehicleRec
            };
            const type_code = dbInserts.vehicle.table.type_code;

            if (this.vehicleInDb[type_code]) {
                log.trace(
                    `Vehicle: '${type_code}' already in db: '${this.vehicleInDb[type_code]}'`
                );
                collisionRec.collisionVehicles[vIdx++].vehicle_id = this.vehicleInDb[type_code];
                this.count.existsAlready.vehicle++;
            } else {
                try {
                    result = await this.insertSingleRow(dbInserts.vehicle, "vehicle");
                    log.trace(`${logL}Result from vehicle insert ${this._toStr(result)}`);
                    this.count.vehicleInsertAttempts++;
                    if (result && result.id)
                        this.vehicleInDb[type_code] = collisionRec.collisionVehicles[
                            vIdx++
                        ].vehicle_id = result.id;
                } catch (e) {
                    log.error(`${logL}Error from vehicle insert, ${this._toStr(e)}`);
                }
            }
        }

        let cIdx = 0;
        for (const contribFactorRec of collisionRec.contribFactors) {
            dbInserts.contributing_factor.table = {
                ...contribFactorRec
            };
            const factor = dbInserts.contributing_factor.table.factor;

            if (this.contribFactorInDb[factor]) {
                log.trace(
                    `C-factor: '${factor}' already in db: '${this.contribFactorInDb[factor]}'`
                );
                collisionRec.collisionContribFactors[
                    cIdx++
                ].contributing_factor_id = this.contribFactorInDb[factor];
                this.count.existsAlready.contributing_factor++;
            } else {
                try {
                    result = await this.insertSingleRow(
                        dbInserts.contributing_factor,
                        "contributing_factor"
                    );
                    log.trace(
                        `${logL}Result from contributing_factor insert ${this._toStr(result)}`
                    );
                    this.count.contribFactorInsertAttempts++;
                    if (result && result.id) {
                        collisionRec.collisionContribFactors[cIdx++].contributing_factor_id =
                            result.id;
                        this.contribFactorInDb[factor] = result.id;
                    }
                } catch (e) {
                    log.error(`${logL}Error from contributing_factor insert, ${this._toStr(e)}`);
                }
            }
        }

        if (collisionRec.coordinates.latitude) {
            dbInserts.coordinate.table = collisionRec.coordinates;
            const longLat =
                dbInserts.coordinate.table.longitude + "_" + dbInserts.coordinate.table.latitude;
            if (this.coordinateInDb[longLat]) {
                log.trace(
                    `Longitude _ Latitude: '${longLat}' already in db: '${this.coordinateInDb[longLat]}'`
                );
                collisionRec.collision.coordinate_id = this.coordinateInDb[longLat];
                this.count.existsAlready.coordinate++;
            } else {
                try {
                    result = await this.insertSingleRow(dbInserts.coordinate, "coordinate");
                    log.trace(`${logL}Result from coordinate insert ${this._toStr(result)}`);
                    this.count.coOrdinateInsertAttempts++;
                    if (result && result.id)
                        this.coordinateInDb[longLat] = collisionRec.collision.coordinate_id =
                            result.id;
                } catch (e) {
                    log.error(`${logL}Error from coordinate insert, ${this._toStr(e)}`);
                }
            }
        }

        dbInserts.collision.table = collisionRec.collision;
        /*TODO Need a transaction for collision, collision_vehicle, collision_contributing_factor */
        try {
            result = await this.insertSingleRow(dbInserts.collision, "collision");
            log.trace(`${logL}Result from collision insert ` + this._toStr(result));
            this.count.collisionInsertAttempts++;
            if (result && result.unique_key)
                log.trace(`${logL}Inserted collision U: ${result.unique_key}`);
        } catch (e) {
            log.error(`${logL}Error from collision insert, ${this._toStr(e)}`);
        }

        /*
            collision_vehicle_index: vehicleIdx.charAt(vehicleIdx.length - 1),
            collision_unique_key   : collisionTableRec.unique_key
            vehicle_id             : result.id;
        */
        for (const collisionVehRec of collisionRec.collisionVehicles) {
            log.trace(
                `${logL}About to insert U:${collisionVehRec.collision_unique_key}, Vidx: ${collisionVehRec.collision_vehicle_index}, Vid: ${collisionVehRec.vehicle_id} into collision_contributing_factor`
            );

            dbInserts.collision_vehicle.table = collisionVehRec;

            try {
                result = await this.insertSingleRow(
                    dbInserts.collision_vehicle,
                    "collision_vehicle"
                );
                log.trace(`${logL}Result from collision_vehicle insert ${this._toStr(result)}`);
                this.count.collisionVehicleInsertAttempts++;
            } catch (e) {
                log.error(`${logL}Error from collision_vehicle insert, ${this._toStr(e)}`);
            }
        }

        /* 
           {   collision_contributing_vehicle_index: factorIdx.charAt(factorIdx.length - 1),
               collision_unique_key                : collisionTableRec.unique_key
               contributing_factor_id              : result.id;
           }
        */
        for (const collisionCfRec of collisionRec.collisionContribFactors) {
            log.trace(
                `${logL}About to insert U:${collisionCfRec.collision_unique_key}, Fid: ${collisionCfRec.contributing_factor_id}, Fidx: ${collisionCfRec.collision_contributing_vehicle_index} into collision_contributing_factor`
            );

            dbInserts.collision_contributing_factor.table = collisionCfRec;
            try {
                result = await this.insertSingleRow(
                    dbInserts.collision_contributing_factor,
                    "collision_contributing_factor"
                );
                log.trace(
                    `${logL}Result from collision_contributing_factor insert ${this._toStr(result)}`
                );
                this.count.collisionContribFactorInsertAttempts++;
            } catch (e) {
                log.error(
                    `${logL}Error from collision_contributing_factor insert, ${this._toStr(e)}`
                );
            }
        }
    }

    /*   InsertSingleRow */
    async insertSingleRow(dbInstructions, tableName) {
        let insertParam = dbInstructions.insertCols.map(col => dbInstructions.table[col]);
        let selectParam = dbInstructions.selectCols.map(col => dbInstructions.table[col]);
        let { insertSQL, selectSQL } = dbInstructions;
        let param = {
            insertSQL,
            selectSQL,
            insertParam,
            selectParam
        };
        let result;
        /*
            badStreets: 0,
            collisionInserts: 0,
            contribFactorInserts: 0,
            coOrdinateInserts: 0,
            streetInserts: 0,
            vehicleInserts: 0
            */
        try {
            result = await this.db.insertIfNotExists(param, status => {
                if (status.newInsert) {
                    this.count.newInserts[tableName]++;
                } else if (status.existsAlready) {
                    this.count.existsAlready[tableName]++;
                } else if (status.error) {
                    this.count.error[tableName]++;
                }
            });
        } catch (e) {
            log.error(`${logL}insertIfNotExists Error: `, e);
            throw new Error(`${logL}insertIfNotExists Error: `, e);
        }
        return result;
    }

    async deleteRecords(table) {
        let result;
        let sql = `DELETE FROM ${table.tableName} WHERE ${table.col.name} = ?`;
        try {
            result = await this.db.delete(sql, [table.col.val]);
        } catch (e) {
            log.error(`${logL}FAIL DELETE SQL = ${sql}: ${table.col.val}: `, e);
        }
        return result;
    }

    /* Utility Method */

    showLogCounterTotals(currentStage = "Current", headingStr = "") {
        log.info(`${headingStr}`);
        for (const counter in this.count) {
            if (typeof this.count[counter] === "object") {
                log.info(`${logL}          ${counter}`);
                log.info(`${logL}          ==========`);
                for (const subCounter in this.count[counter]) {
                    log.info(
                        `${logL}          ${subCounter} ct = ${this.count[counter][subCounter]}`
                    );
                }
            } else {
                log.info(`${logL}${currentStage} ${counter} ct = ${this.count[counter]}`);
            }
        }
    }

    _toStr(obj = {}) {
        return JSON.stringify(obj, null, 2);
    }
};

module.exports = {
    DbInsert
};
