const popOptions = require("./options/populateOptions");
/* Local */
const CollisionQuery = require("../components/api/NYCollisionAPIq");
const Transform = require("../Data/Transform.js").Transform;
const DbInsert = require("../components/api/ResultSet/DbInsert.js").DbInsert;
const CollisionDb = require("../components/api/CollisionDb");
const { ApiParam } = require("../env/nycConfig");
const log = require("../env/logger").logger;

const command = popOptions.argv._[0];
const logL = "[app.js] ";

const getUniqueKeySQL = `SELECT unique_key FROM collision ORDER BY unique_key`;
let existingUniqueKeyCache = {};
let callbackFunctions = {};

const getUniqueKeyForSelectedYearSQL = `SELECT unique_key 
                            FROM collision 
                            WHERE strftime('%Y',date) = ?
                            ORDER BY unique_key`;

if (command === "populate") {
    populateTheDatabaseWithNYCollisionData(popOptions).catch((e) => {
        log.error(`${logL}'populateTheDatabaseWithNYCollisionData': Failed with error: `, e);
        logExit(callbackFunctions, 9999);
    });
} else if (command) {
    console.log(`${logL}Unknown command: ` + command);
} else {
    console.log(`${logL}You must give a command`);
}

/* Functions */
async function populateTheDatabaseWithNYCollisionData(popOptions) {
    let collisionRecords = [];
    let nycCollisionApiParam = {
        offset: popOptions.argv.offset,
        max_per_page: popOptions.argv.max_per_page,
        maxRecords: popOptions.argv.max_records,
        year: popOptions.argv.collision_year + "",
        limit: popOptions.argv.max_per_page,
    };

    if (popOptions.argv.log_level !== log.level) log.level = popOptions.argv.log_level;

    console.log(`${logL}Log level: ${log.level}`);
    log.info(`${logL}API param: ${toStr(nycCollisionApiParam)}`);
    log.info(`${logL}You picked collision Year, ${nycCollisionApiParam.year}`);

    const db = new CollisionDb();
    const getUniqueAttr = {
        getUniqueSQL: nycCollisionApiParam.year ? getUniqueKeyForSelectedYearSQL : getUniqueKeySQL,
        getUniqueParam: nycCollisionApiParam.year ? [nycCollisionApiParam.year] : [],
        db,
    };

    callbackFunctions = {
        addEntryToUniqueCache,
        dbInsert: new DbInsert(db),
        transform: new Transform(),
    };

    if (!popOptions.argv.no_cache)
        existingUniqueKeyCache = await getExistingUniqueKeys(getUniqueAttr, callbackFunctions);
    log.debug(`${logL}Got existing U.Key Ct: ${Object.keys(existingUniqueKeyCache).length}`);

    let collisionQuery = new CollisionQuery(ApiParam);

    if (nycCollisionApiParam.maxRecords === null)
        nycCollisionApiParam.maxRecords = getExistingRowCount(nycCollisionApiParam.year);

    log.error(`${logL}Max collision records ct: ${toStr(nycCollisionApiParam.maxRecords)}`);

    /* Sanity Check the calling parameters */
    if (nycCollisionApiParam.max_per_page > nycCollisionApiParam.maxRecords) {
        nycCollisionApiParam.max_per_page = nycCollisionApiParam.maxRecords;
        nycCollisionApiParam.limit = nycCollisionApiParam.maxRecords;
    }

    let offsetPlusLimit = nycCollisionApiParam.offset + nycCollisionApiParam.max_per_page;

    if (offsetPlusLimit > nycCollisionApiParam.maxRecords) {
        nycCollisionApiParam.max_per_page =
            nycCollisionApiParam.maxRecords - nycCollisionApiParam.offset;
        nycCollisionApiParam.limit = nycCollisionApiParam.max_per_page;
    }

    let [collisionApiCallCt, collisionRecordCt, totalFetchedCt] = [0, 0, 0];

    log.debug(`${logL}API param modified: ${toStr(nycCollisionApiParam)}`);

    while (
        nycCollisionApiParam.offset < nycCollisionApiParam.maxRecords &&
        nycCollisionApiParam.max_per_page > 0
    ) {
        try {
            // Call the NYC API
            collisionApiCallCt++;
            collisionRecords = await collisionQuery.allYearData(nycCollisionApiParam);
            log.info(
                `${logL}Fetched records = ${collisionRecords.length} in API call #${collisionApiCallCt}`
            );
            totalFetchedCt += collisionRecords.length;
            log.info(
                `${logL}Fetched record total = ${totalFetchedCt}; after call #${collisionApiCallCt}`
            );
        } catch (e) {
            try {
                log.error(`${logL}Error calling NYC API, call #: ${collisionApiCallCt}`);
                Object.keys(e).forEach((key) => {
                    log.error(
                        `${logL}API error Key: ${key}: ${
                            typeof e[key] === "object" ? toStr(e[key]) : e[key]
                        }`
                    );
                });
            } catch (e) {
                log.error(`${logL}Error printing errors: `, e);
            }
            // Object.keys(e.response).forEach((key) => log.error(`Response Key: ${key}: ${e[key]}`));
            // log.error( `Error calling NYC API at call # ${collisionApiCallCt}: `, e.response);
            logExit(callbackFunctions, 99);
        }

        if (collisionRecords.length) {

            await addCollisionsToDb(collisionRecords, callbackFunctions, existingUniqueKeyCache);
            collisionRecordCt = Object.keys(existingUniqueKeyCache).length;
        } else {
            log.debug(`${logL}Got nothing from the API. Finish up.`);
            break;
        }

        nycCollisionApiParam.offset += nycCollisionApiParam.max_per_page;
        offsetPlusLimit = nycCollisionApiParam.offset + nycCollisionApiParam.max_per_page;

        if (offsetPlusLimit > nycCollisionApiParam.maxRecords)
            nycCollisionApiParam.max_per_page =
                nycCollisionApiParam.maxRecords - nycCollisionApiParam.offset;
    }

    log.error(
        `${logL}Final Unique Collision Rec Ct: ${collisionRecordCt} after call # ${collisionApiCallCt}`
    );
    log.info(`${logL}Total API records fetched ${totalFetchedCt} after call # ${collisionApiCallCt}`);
}





async function addCollisionsToDb(collisionRecords, callbackFunctions, existingUniqueKeyCache) {
    for (let rec of collisionRecords) {
        if (existingUniqueKeyCache[rec.unique_key]) {
            log.trace(`${logL}Seen this Key: ${rec.unique_key} already`);
            continue;
        }
        let newRec, res;
        log.trace(`${logL}In Rec: ${toStr(rec)}`);

        newRec = callbackFunctions.transform.collisionData(rec);
        existingUniqueKeyCache[newRec.collision.unique_key] = newRec.collision.unique_key;

        log.trace(`${logL}Transformed Rec: ${toStr(newRec)}`);
        try {
            res = await callbackFunctions.dbInsert.insertCollision(newRec);
            if (res && Object.keys(res).length) log.trace(`${logL}Inserted rec got return: ${toStr(res)}`);
        } catch (e) {
            console.log(`${logL}***********    Error insert: `, e);
            log.on("finish", (error) => {
                if (error) log.error(`${logL}Final logger with error ${toStr(error)}`);
                log.error(`${logL}Error inserting rec: ${toStr(e)}`);
                log.error(`${logL}Offending Rec: ${toStr(newRec)}`);
            });
            log.end();
            logExit(callbackFunctions, 22);
        }
    }
    callbackFunctions.transform.showLogCounterTotals("Current", "    Transform Counters");
    callbackFunctions.dbInsert.showLogCounterTotals("Current", "    DB Insert Counters");
}

async function getExistingUniqueKeys(param, callbackFunctions) {
    let { db, getUniqueSQL, getUniqueParam } = param;

    try {
        existingUniqueKeyCache = await db.all(getUniqueSQL, getUniqueParam, {
            callback: (rows) => rows.reduce(callbackFunctions.addEntryToUniqueCache, {}),
            keyName: "unique_key",
        });
    } catch (e) {
        log.error(`Select unique_key's failed! : ${toStr(e)}`);
        logExit(callbackFunctions, 88);
    }
    log.info(`Existing keyCt: ${Object.keys(existingUniqueKeyCache).length}`);
    return existingUniqueKeyCache;
}

function logExit(callbackFunctions, exitCode = 0) {
    let { dbInsert, transform } = callbackFunctions;
    log.on("finish", (info) => {
        transform.showLogCounterTotals("Finish", "    Final Transform Status");
        const uniqueKeyCt = Object.keys(existingUniqueKeyCache).length;
        console.log(`${logL}Unique Key Ct: ${uniqueKeyCt}`);
    });

    log.on("error", (error) => {
        if (error && Object.keys(error).length) {
            Object.keys(error).forEach((key) => {
                if (error.hasOwnProperty(key) && typeof key != "object")
                    log.error(`${logL}Final error ${key} => ${error.key}`);
            });
        }
    });

    dbInsert.showLogCounterTotals("Finish", "    Final Db Insert Status");
    log.info(`Bye`);
    log.end();
    // process.exit(exitCode);
    /* Removed on July 14 2021 */
    // process.exitCode = exitCode;
    // process.kill(process.pid);
}

/* Utility Functions */
/*TODO, use a Map instead */
function addEntryToUniqueCache(uniqueCache, keyValElem) {
    const key = Object.keys(keyValElem)[0];
    uniqueCache[keyValElem[key]] = keyValElem[key];
    return uniqueCache;
}

async function getExistingRowCount(year) {
    log.warn(`${logL}No 'maxRecords' specified, get max available records for year ${year}!`);
    try {
        let apiRes = await collisionQuery.rowCount(year);
    } catch (e) {
        log.error(`${logL}Error getting rowCount ${toStr(e)}`);
        logExit(callbackFunctions, 77);
    }
    return apiRes[0].count;
}

function toStr(obj = {}) {
    return JSON.stringify(obj, null, 2);
}
