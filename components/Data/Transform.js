/*
 *
 * Name: Transform
 * Transforms data from the NYC Collision API
 * to to data that will be inserted into the Collision Database.
 *
 */

// const dateFns = require("date-fns");
const Valid = require("../../components/api/Validation/Valid.js");
const log = require("../../env/logger").moduleLogger;

const logL = "[Transform] ";

const Transform = class {
    constructor() {
        this.count = {
            badBoroughCodes: 0,
            badLatitudes: 0,
            badConvertedLatitues: 0,
            goodLatitudes: 0,
            badLongitudes: 0,
            badLongitudes: 0,
            badUniqueKeys: 0,
            badConvertedLongitudes: 0,
            goodLongitudes: 0,
            badStreetNames: 0
        };

        this.nycStreetTypes = ["on_street_name", "off_street_name", "cross_street_name"];
        this.injuryStatsCols = [
            "number_of_persons_injured",
            "number_of_persons_killed",
            "number_of_pedestrians_injured",
            "number_of_pedestrians_killed",
            "number_of_cyclists_injured",
            "number_of_cyclists_killed",
            "number_of_motorists_injured",
            "number_of_motorists_killed"
        ];

        this.streetTypeToId = {
            on_street_name: "on_street_id",
            off_street_name: "off_street_id",
            cross_street_name: "cross_street_id"
        };
    }

    collisionData(collisionRecIn) {
        const val = new Valid();
        const collisionRecOut = {
            collision: null,
            contribFactors: [],
            collisionContribFactors: [],
            streets: [],
            vehicles: [],
            collisionVehicles: [],
            coordinates: []
        };

        const collisionTableRec = {};

        let { borough, date, time, zip_code, latitude, longitude, unique_key } = collisionRecIn;

        // "date": "2012-07-01T00:00:00.000", // "time": "0:05",
        collisionTableRec.date = val.convertDateAndTimeStrToIso(date, time);

        if (val.is_numeric_str_ok(unique_key)) {
            collisionTableRec.unique_key = unique_key;
        } else {
            this.count.badUniqueKeys++;
            throw new Error(`Invalid or no unique key, <${unique_key}>`);
        }

        collisionRecOut.coordinates = {
            longitude: null,
            latitude: null
        };
        log.trace(`${logL}Checking latitude ${latitude}`);
        log.trace(`${logL}Checking longitude ${longitude}`);
        collisionRecOut.coordinates.latitude = val.is_float_ok(latitude) ? latitude : null;
        collisionRecOut.coordinates.longitude = val.is_float_ok(longitude) ? longitude : null;

        if (latitude && longitude) {
            if (!collisionRecOut.coordinates.latitude || !collisionRecOut.coordinates.longitude) {
                log.error(`${logL}CoOrdinate cannot be null!`);
                log.error(`${logL}Latitude: <${latitude}>`);
                log.error(`${logL}Longitude: <${longitude}>`);
                if (!latitude) this.count.badConvertedLatitudes++;
                if (!longitude) this.count.badConvertedLongitudes++;
                throw new Error(
                    `${logL}CoOrdinate cannot be null!: ${this._toStr(collisionRecIn)}`
                );
            }
            this.count.goodLatitudes++;
            this.count.goodLongitudes++;
        } else {
            if (!latitude) this.count.badLatitudes++;
            if (!longitude) this.count.badLongitudes++;
        }

        /* Populate streetTableRec */
        const borough_code = val.to_borough_code(val.trim(borough));
        if (!borough_code) {
            log.error(`Borough:<${borough}> didn't convert to borough code!`);
            this.count.badBoroughCodes++;
            throw new Error(`Borough:<${borough}> didn't convert to borough code!`);
        }

        zip_code = val.check_and_clean_zip(zip_code);
        /* Yes, redundant data. But it is easier than doing complex union/joins */
        // collisionRecOut.collision.borough_code = borough_code;
        // collisionRecOut.collision.zip_code = zip_code;

        collisionRecOut.streets = this.nycStreetTypes.reduce((newStreetRecs, streetType) => {
            /*Valid streetType:  ["on_street_name", "off_street_name", "cross_street_name"] */
            /* on_street_name -> on_street_id */

            /* on_street_id, cross_street_id */
            const streetIdType = this.streetTypeToId[streetType];

            if (streetType in collisionRecIn) {
                let streetRec = {
                    table: {
                        name: null,
                        borough_code,
                        zip_code
                    },
                    streetIdType
                };

                streetRec.table.name =
                    val.check_and_clean_street_name(collisionRecIn[streetType]) || null;

                if (streetRec.table.name) {
                    newStreetRecs.push(streetRec);
                } else {
                    const errorMsg = `${logL}: Street has no name '${
                        collisionRecIn[streetType]
                    }': ${this._toStr(streetRec)}`;
                    log.error(errorMsg);
                    log.error(`Input Record: ${this._toStr(collisionRecIn)}`);
                    this.count.badStreetNames++;
                }
            }
            return newStreetRecs;
        }, []);

        /* Populate contribFactor Recs and Vehicle Recs */
        [1, 2, 3, 4, 5].forEach(i => {
            /* contributing_factor && vehicle indii */
            const factorIdx = "contributing_factor_vehicle_" + i;
            const vehicleIdx = "vehicle_type_code_" + i;
            if (factorIdx in collisionRecIn) {
                const factor = val.trim_lc_and_remove_double_spaces(collisionRecIn[factorIdx]);
                collisionRecOut.contribFactors.push({ factor });
                collisionRecOut.collisionContribFactors.push({
                    collision_contributing_vehicle_index: factorIdx.charAt(factorIdx.length - 1),
                    collision_unique_key: collisionTableRec.unique_key
                });
            }

            if (vehicleIdx in collisionRecIn) {
                const type_code = val.trim_lc_and_remove_double_spaces(collisionRecIn[vehicleIdx]);
                collisionRecOut.vehicles.push({ type_code });
                collisionRecOut.collisionVehicles.push({
                    collision_vehicle_index: vehicleIdx.charAt(vehicleIdx.length - 1),
                    collision_unique_key: collisionTableRec.unique_key
                });
            }
        });

        /* Collision Table */
        this.injuryStatsCols.forEach(col => {
            if (col in collisionRecIn) {
                if (val.is_pos_int_ok(Number(collisionRecIn[col]))) {
                    collisionTableRec[col] = collisionRecIn[col];
                }
            }
        });

        collisionRecOut.collision = collisionTableRec;

        return collisionRecOut;
    }

    showLogCounterTotals(currentStage = "Current", headingStr = "") {
        log.info(`${logL}${headingStr}`);
        for (const counter in this.count) {
            log.info(`${logL}${currentStage} ${counter} total = ${this.count[counter]}`);
        }
    }

    _toStr(obj) {
        return JSON.stringify(obj, null, 2);
    }
};

module.exports = {
    Transform
};
