const pop_options = require("./options/populate_options");
/* Local */
const CollisionQuery = require("../components/api/NYCollisionAPIq");
const Transform = require("../components/Data/Transform.js").Transform;
const DbInsert = require("../components/api/ResultSet/DbInsert.js").DbInsert;
const CollisionDb = require("../components/api/CollisionDb");
const log = require("../env/logger").logger;

const command = pop_options.argv._[0];

const getUniqueKeySQL = `SELECT unique_key FROM collision ORDER BY unique_key`;

const getUniqueKeyYearSQL = `SELECT unique_key 
                            FROM collision 
                            WHERE strftime('%Y',date) = ?
                            ORDER BY unique_key`;

let addValToUniqueObjFun = (uniqueObj, keyValElem) => {
    const key = Object.keys(keyValElem)[0];
    uniqueObj[keyValElem[key]] = keyValElem[key];
    return uniqueObj;
};

if (command === "populate") {
    let allData = [];
    let apiParam = {
        offset: pop_options.argv.offset,
        limit: pop_options.argv.max_per_page,
        maxRecords: pop_options.argv.max_records,
        year: pop_options.argv.collision_year + ""
    };

    if (pop_options.argv.log_level !== log.level) {
        log.level = pop_options.argv.log_level;
        console.log(`Log level: ${log.level}`);
    }

    log.info(`API param: ${toStr(apiParam)}`);
    log.info(`You picked collision Year, ${apiParam.year}`);

    const db = new CollisionDb();
    const getUniqueAttr = {
        getUniqueSQL: apiParam.year ? getUniqueKeyYearSQL : getUniqueKeySQL,
        getUniqueParam: apiParam.year ? [apiParam.year] : [],
        db
    };

    let existingUniqueKey = {};

    let funcObj = {
        addValToUniqueObjFun,
        dbInsert: new DbInsert(db),
        transform: new Transform()
    };

    (async () => {
        if (!pop_options.argv.no_cache)
            existingUniqueKey = await getExistingUniqueKeys(getUniqueAttr, funcObj);
        log.debug(`Got existing U.Key Ct: ${Object.keys(existingUniqueKey).length}`);

        let cQ = new CollisionQuery();
        if (apiParam.maxRecords === null) {
            log.warn(`No 'maxRecords' specified, get max available records!`);
            try {
                let apiRes = await cQ.rowCount(apiParam.year);
                apiParam.maxRecords = apiRes[0].count;
            } catch (e) {
                log.error(`Error getting rowCount ${toStr(e)}`);
                logExit(funcObj, 77);
            }
        }

        log.error(`Max collision records ct: ${toStr(apiParam.maxRecords)}`);
        if (apiParam.limit > apiParam.maxRecords) apiParam.limit = apiParam.maxRecords;
        let offsetPlusLimit = apiParam.offset + apiParam.limit;

        if (offsetPlusLimit > apiParam.maxRecords)
            apiParam.limit = apiParam.maxRecords - apiParam.offset;
        let [apiCallCt, recCt, totalFetchedCt] = [0, 0, 0];

        log.debug(`API param modified: ${toStr(apiParam)}`);

        while (apiParam.offset < apiParam.maxRecords && apiParam.limit > 0) {
            try {
                // Call the NYC API
                apiCallCt++;
                allData = await cQ.allYearData(apiParam);
                log.info(`Fetched ${allData.length} records in API call # ${apiCallCt}`);
                totalFetchedCt += allData.length;
                log.info(`Fetched a total of ${totalFetchedCt} records after call # ${apiCallCt}`);
            } catch (e) {
                Object.keys(e).forEach(key => log.error(`API error Key: ${key}`));
                log.error(`Error calling NYC API at call # ${apiCallCt}: ${toStr(e.response)}`);
                logExit(funcObj, 99);
            }

            if (allData.length) {
                await addCollisionsToDb(allData, funcObj, existingUniqueKey);
                recCt = Object.keys(existingUniqueKey).length;
            } else {
                log.debug("Got nothing from the API. Finish up.");
                break;
            }

            apiParam.offset += apiParam.limit;
            offsetPlusLimit = apiParam.offset + apiParam.limit;

            if (offsetPlusLimit > apiParam.maxRecords)
                apiParam.limit = apiParam.maxRecords - apiParam.offset;
        }

        log.error(`Final Unique Collision Rec Ct: ${recCt} after call # ${apiCallCt}`);
        log.info(`Total API records fetched ${totalFetchedCt} after call # ${apiCallCt}`);
        logExit(funcObj, 9999);
    })();

} else if (command) {
    console.log("Unknown command: " + command);
} else {
    console.log("You must give a command");
}

/* Functions */
async function addCollisionsToDb(allData, funcObj, existingUniqueKey) {
    for (let rec of allData) {
        if (existingUniqueKey[rec.unique_key]) {
            log.trace(`Seen this Key: ${rec.unique_key} already`);
            continue;
        }
        let newRec, res;
        log.trace(`In Rec: ${toStr(rec)}`);
        newRec = funcObj.transform.collisionData(rec);
        existingUniqueKey[newRec.collision.unique_key] = newRec.collision.unique_key;

        log.trace(`Transformed Rec: ${toStr(newRec)}`);
        try {
            res = await funcObj.dbInsert.insertCollision(newRec);
            if (res && Object.keys(res).length) log.trace(`Inserted rec got return: ${toStr(res)}`);
            //res = await funcObj.dbInsert.updateCollision(newRec);
            //if (res && Object.keys(res).length) log.trace(`Updated collision got return: ${toStr(res)}`);
        } catch (e) {
            console.log(`***********    Error insert: `, e);
            log.on("finish", error => {
                if (error) log.error(`Final logger with error ${toStr(error)}`);
                log.error(`Error inserting rec: ${toStr(e)}`);
                log.error(`Error: ${toStr(e)}`);
                log.error(`Offending Rec: ${toStr(newRec)}`);
            });
            log.end();
            logExit(funcObj, 22);
        }
    }
    funcObj.transform.showLogCounterTotals("Current", "    Transform Counters");
    funcObj.dbInsert.showLogCounterTotals("Current", "    DB Insert Counters");
}

async function getExistingUniqueKeys(param, funcObj) {
    let { db, getUniqueSQL, getUniqueParam } = param;
    let existingUniqueKey = {};
    try {
        existingUniqueKey = await db.all(getUniqueSQL, getUniqueParam, {
            callback: rows => rows.reduce(funcObj.addValToUniqueObjFun, {}),
            keyName: "unique_key"
        });
    } catch (e) {
        log.error(`Select unique_key's failed! : ${toStr(e)}`);
        logExit(funcObj, 88);
    }
    log.info(`Existing keyCt: ${Object.keys(existingUniqueKey).length}`);
    return existingUniqueKey;
}

function logExit(funcObj, exitCode = 0) {
    let { dbInsert, transform } = funcObj;
    log.on("finish", info => {
        transform.showLogCounterTotals("Finish", "    Final Transform Status");
        const uniqueKeyCt = Object.keys(existingUniqueKey).length;
        console.log(`Unique Key Ct: ${uniqueKeyCt}`);
    });

    log.on("error", error => {
        if (error && Object.keys(error).length) {
            Object.keys(error).forEach(key => {
                if (error.hasOwnProperty(key) && typeof key != "object")
                    log.error(`Final error ${key} => ${error.key}`);
            });
        }
    });

    dbInsert.showLogCounterTotals("Finish", "    Final Db Insert Status");
    log.info(`Bye`);
    log.end();
    // process.exit(exitCode);
    process.exitCode = exitCode;
    process.kill(process.pid);
}
/* Utility Function */

function toStr(obj = {}) {
    return JSON.stringify(obj, null, 2);
}
