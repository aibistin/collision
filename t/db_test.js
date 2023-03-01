/*
   Test the database interface for the collision database. 
*/
const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);
const expect = chai.expect;
const faker = require("faker");
/* Local */
const env = require("../env/config").env;
const { NameFix } = require("../env/nycConfig"); // ApiParam, Limit, NameFix,
const CollisionDb = require("../components/api/CollisionDb");

/* Tables */
const ValidNYC = require("../Data/Validation/ValidNYC");

/* Fixtures */
const logL = "[db_test] ";
const testDb = env.collisionDbTest;
// console.log("[db_test] ENV: ", env);
console.log("TEST-DB: ", testDb);
const validNYC = new ValidNYC();
/*  Test Fixtures   */
let dbTest = {
    streetTest: {
        testLabel: "TEST 1: Street Test: ",
        tableName: "street",
        table: {
            name: validNYC.checkAndCleanStreetName(
                faker.address.streetName() + " " + faker.address.streetSuffix()
            ),
            borough_code:
                NameFix.boroughCodeToName[
                    Math.floor(Math.random() * NameFix.boroughCodeToName.length)
                ],
            // zip_code: validNYC.checkAndCleanZip(faker.address.zipCode()),
            zip_code: faker.address.zipCode(),
        },
        /* Street */
        insertSQL: `INSERT INTO street ( name, borough_code, zip_code) VALUES ( ?, ?, ?) `,
        insertCols: ["name", "borough_code", "zip_code"],
        selectCols: ["name", "borough_code", "zip_code"],
        expectCols: ["id", "name", "borough_code", "zip_code"],
        selectSQL: `SELECT id, name, borough_code, zip_code FROM street WHERE name=? AND borough_code=? AND zip_code=? `,
    },
    vehicleTest: {
        testLabel: "TEST 2: Vehicle Test: ",
        tableName: "vehicle",
        table: {
            type_code: validNYC.trimLcAndRemoveDoubleSpaces(faker.random.objectElement()),
        },
        insertSQL: `INSERT INTO vehicle (type_code) VALUES (?)`,
        insertCols: ["type_code"],
        selectCols: ["type_code"],
        expectCols: ["id", "type_code"],
        selectSQL: `SELECT id, type_code FROM vehicle WHERE type_code = ?`,
    },
    coOrdinateTest: {
        testLabel: "TEST 3: CoOrdinate Test: ",
        tableName: "coordinate",
        table: {
            latitude: Number(faker.address.latitude()),
            longitude: Number(faker.address.longitude()),
        },
        insertSQL: `INSERT INTO coordinate ( latitude, longitude) VALUES (?, ?)`,
        insertCols: ["latitude", "longitude"],
        selectCols: ["latitude", "longitude"],
        expectCols: ["id", "latitude", "longitude"],
        selectSQL: `SELECT id, latitude, longitude FROM coordinate WHERE latitude=? AND longitude=?`,
    },
    contributingFactorTest: {
        testLabel: "TEST 4: ContributingFactor Test: ",
        tableName: "contributing_factor",
        table: {
            factor: faker.company.bs(),
        },
        insertSQL: `INSERT INTO contributing_factor (factor) VALUES (?)`,
        insertCols: ["factor"],
        selectCols: ["factor"],
        expectCols: ["id", "factor"],
        selectSQL: `SELECT id, factor FROM contributing_factor WHERE factor = ? `,
    },
    collisionTest: {
        testLabel: "TEST 5: Collision Test: ",
        tableName: "collision",
        table: {
            // unique_key: faker.random.number(),
            unique_key: faker.datatype.number(),
            date: faker.date.past(),
            number_of_persons_injured: faker.datatype.number(),
            number_of_persons_killed: faker.datatype.number(),
            number_of_pedestrians_injured: faker.datatype.number(),
            number_of_pedestrians_killed: faker.datatype.number(),
            number_of_cyclists_injured: faker.datatype.number(),
            number_of_cyclists_killed: faker.datatype.number(),
            number_of_motorists_injured: faker.datatype.number(),
            number_of_motorists_killed: faker.datatype.number(),
        },
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
            "coordinate_id",
        ],
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
            "number_of_motorists_killed",
        ],
        expectCols: [
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
            "coordinate_id",
        ],
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
    },
    collisionVehicleTest: {
        testLabel: "TEST 6: Collision-Vehicle Test: ",
        tableName: "collision_vehicle",
        table: {},
        insertCols: ["collision_unique_key", "vehicle_id", "collision_vehicle_index"],
        selectCols: ["collision_unique_key", "vehicle_id", "collision_vehicle_index"],
        expectCols: ["collision_unique_key", "vehicle_id", "collision_vehicle_index"],
        insertSQL: `
                      INSERT INTO collision_vehicle (
                          collision_unique_key,
                          vehicle_id,
                          collision_vehicle_index
                      )
                      VALUES (?, ?, ?)`,

        selectSQL: `
                      SELECT collision_unique_key, vehicle_id, collision_vehicle_index  FROM collision_vehicle
                          WHERE  collision_unique_key = ?
                          AND    vehicle_id = ?
                          AND    collision_vehicle_index = ?`,
    },
    collisionContributingFactorTest: {
        testLabel: "TEST 7: Collision-ContributingFactor Test: ",
        tableName: "collision_contributing_factor",
        table: {},
        insertCols: [
            "collision_unique_key",
            "contributing_factor_id",
            "collision_contributing_vehicle_index",
        ],
        selectCols: [
            "collision_unique_key",
            "contributing_factor_id",
            "collision_contributing_vehicle_index",
        ],
        expectCols: [
            "collision_unique_key",
            "contributing_factor_id",
            "collision_contributing_vehicle_index",
        ],
        insertSQL: ` INSERT INTO collision_contributing_factor (
                      collision_unique_key,
                      contributing_factor_id,
                      collision_contributing_vehicle_index) VALUES (?, ?, ?) `,
        selectSQL: `SELECT collision_unique_key,contributing_factor_id ,collision_contributing_vehicle_index  FROM collision_contributing_factor
                      WHERE  collision_unique_key = ?
                      AND    contributing_factor_id = ?
                      AND    collision_contributing_vehicle_index = ? `,
    },
};

let toDelete = {
    tableNames: [],
};

/***************************************************************************
 *    Tests
 ***************************************************************************/

main();
async function main() {
    /***************************************************************************
     *    Insert/Select Tests
     ***************************************************************************/
    await describe("Insert Street Tests\n", () => {
        let { testLabel } = dbTest.streetTest;
        it(`${testLabel} has a zip code before insert`, function (done) {
            let { zip_code } = dbTest.streetTest.table;
            console.log(`Street Test Table: `, dbTest.streetTest.table);
            expect(zip_code, "zip_code must have a length").to.have.lengthOf.above(4);
            done();
        });

        it(`${testLabel} valid street values after insert`, function (done) {
            (async () => {
                try {
                    const result = await insertSingleRowTest(testDb, dbTest.streetTest);
                    dbTest.collisionTest.table.cross_street_id = result.id;
                    dbTest.collisionTest.table.on_street_id = result.id;
                    dbTest.collisionTest.table.off_street_id = result.id;
                    toDelete.tableNames.push({
                        tableName: "street",
                        col: {
                            name: "id",
                            val: result.id,
                        },
                    });
                    printBigDoneGood(testLabel);
                    // done(done);
                } catch (e) {
                    printBigDoneBad(testLabel, e);
                    // done(done);
                }
            })();
            done(); // Good
        });
        done(); // Good
    });

    await describe("Insert Vehicle Tests\n", () => {
        let { testLabel } = dbTest.vehicleTest;
        it(`${testLabel} return valid data after inserting`, function (done) {
            (async () => {
                try {
                    const result = await insertSingleRowTest(testDb, dbTest.vehicleTest);
                    dbTest.vehicleTest.table.vehicle_id = result.id;
                    dbTest.collisionVehicleTest.table.vehicle_id = result.id;

                    toDelete.tableNames.push({
                        tableName: "vehicle",
                        col: {
                            name: "id",
                            val: result.id,
                        },
                    });
                    printBigDoneGood(testLabel);
                    done();
                } catch (e) {
                    printBigDoneBad(testLabel, e);
                    done(e);
                }
            })();
        });
    });

    await describe("Insert CoOrdinate Tests\n", () => {
        let { testLabel } = dbTest.coOrdinateTest;
        it(`${testLabel} returns valid data afer insert`, function (done) {
            (async () => {
                try {
                    const result = await insertSingleRowTest(testDb, dbTest.coOrdinateTest);
                    dbTest.collisionTest.table.coordinate_id = result.id;
                    toDelete.tableNames.push({
                        tableName: "coordinate",
                        col: {
                            name: "id",
                            val: result.id,
                        },
                    });
                    printBigDoneGood(testLabel);
                    done();
                } catch (e) {
                    printBigDoneBad(testLabel, e);
                    done(e);
                }
            })();
        });
    });

    await describe("Insert ContributingFactor Tests\n", () => {
        let { testLabel } = dbTest.contributingFactorTest;

        it(`${testLabel} returns correct data after insertin`, function (done) {
            (async () => {
                try {
                    const result = await insertSingleRowTest(testDb, dbTest.contributingFactorTest);
                    dbTest.collisionContributingFactorTest.table.contributing_factor_id = result.id;
                    toDelete.tableNames.push({
                        tableName: "contributing_factor",
                        col: {
                            name: "id",
                            val: result.id,
                        },
                    });
                    printBigDoneGood(testLabel);
                    done();
                } catch (e) {
                    printBigDoneBad(testLabel, e);
                    done(e);
                }
            })();
        });
    });

    await describe("Insert Collision Tests\n", () => {
        let { testLabel } = dbTest.collisionTest;
        it(`${testLabel} table has Street and CoOrdinate Ids before inserting`, function (done) {
            let { cross_street_id, coordinate_id } = dbTest.collisionTest.table;
            expect(cross_street_id, "cross_street_id must have a value").to.be.above(0);
            expect(coordinate_id, "cross_street_id must have a value").to.be.above(0);
            done();
        });

        it(`${testLabel} return valid data after inserting`, function (done) {
            (async () => {
                try {
                    let result = await insertSingleRowTest(testDb, dbTest.collisionTest);

                    toDelete.tableNames.push({
                        tableName: "collision",
                        col: {
                            name: "unique_key",
                            val: result.unique_key,
                        },
                    });

                    dbTest.collisionContributingFactorTest.table.collision_unique_key =
                        result.unique_key;
                    dbTest.collisionVehicleTest.table.collision_unique_key = result.unique_key;
                    printBigDoneGood(testLabel);
                    done();
                } catch (e) {
                    printBigDoneBad(testLabel, e);
                    done(e);
                }
            })();
        });
    });

    /*                             
           Collision-Vehicle
    */
    await describe("Insert Collision-Vehicle Tests\n", () => {
        let { testLabel } = dbTest.collisionVehicleTest;

        let vehicleIdxs = [0, 1, 2, 3, 4];
        let idx = vehicleIdxs[Math.floor(Math.random() * vehicleIdxs.length)];
        dbTest.collisionVehicleTest.table.collision_vehicle_index = idx;
        dbTest.collisionContributingFactorTest.table.collision_contributing_vehicle_index = idx;

        it(`${testLabel} needs data from Collision table`, function (done) {
            let { collision_unique_key, vehicle_id } = dbTest.collisionVehicleTest.table;
            expect(vehicle_id, `${testLabel} needs 'vehicle_id'`).to.be.above(0);
            expect(collision_unique_key, `${testLabel} needs 'collision_unique_key'`).to.be.above(
                0
            );
            done();
        });

        it(`${testLabel} return valid Values after inserting`, function (done) {
            (async () => {
                try {
                    const result = await insertSingleRowTest(testDb, dbTest.collisionVehicleTest);
                    toDelete.tableNames.push({
                        // OK to delete all for this collision
                        tableName: "collision_vehicle",
                        col: {
                            name: "collision_unique_key",
                            val: dbTest.collisionTest.table.unique_key,
                        },
                    });
                    printBigDoneGood(testLabel);
                    done();
                } catch (e) {
                    printBigDoneBad(testLabel, e);
                    done(e);
                }
            })();
        });
    });

    /*                             
        Collision-ContributingFactor
    */
    await describe("Insert Collision-ContributingFactor Tests\n", () => {
        let { testLabel } = dbTest.collisionContributingFactorTest;

        it(`${testLabel} Expects Values from Collision Table`, function (done) {
            let { collision_unique_key, contributing_factor_id } =
                dbTest.collisionContributingFactorTest.table;
            expect(collision_unique_key, `${testLabel} needs 'collision_unique_key'`).to.be.above(
                0
            );
            expect(contributing_factor_id, `${testLabel} 'contributing_factor_id'`).to.be.above(0);
            done();
        });

        it(`${testLabel} valid Values after inserting`, function (done) {
            let { testLabel } = dbTest.collisionContributingFactorTest;
            (async () => {
                try {
                    const result = await insertSingleRowTest(
                        testDb,
                        dbTest.collisionContributingFactorTest
                    );
                    toDelete.tableNames.push({
                        tableName: "collision_contributing_factor",
                        col: {
                            name: "collision_unique_key",
                            val: dbTest.collisionTest.table.unique_key,
                        },
                    });
                    printBigDoneGood(testLabel);
                    done();
                } catch (e) {
                    printBigDoneBad(testLabel, e);
                    done(e);
                }
            })();
        });
    });

    // describe("Delete What We Inserted\n", () => {
    //     it(`It should delete all we inserted`, function(done) {
    //         waitingAround(500);
    //         let results = [];
    //         let errors = [];

    //         (async () => {
    //             let ct = 0;
    //             for (let table of toDelete.tableNames.reverse()) {
    //                 try {
    //                     console.log(`ABOUT TO DELETE ${++ct}: ${table.tableName}`);
    //                     let result = await deleteRecords(testDb, table, e => {
    //                         if (e) errors.push(e);
    //                     });
    //                     console.log(`************************************************`);
    //                     console.log(`DELETE ${ct}: ${table.tableName} GOOD :)`);
    //                     console.log(`************************************************`);
    //                     results.push(result);
    //                 } catch (e) {
    //                     console.log(`************************************************`);
    //                     console.log(`DELETE ${ct}: ${table.tableName} BAD :(`);
    //                     console.log(toStr(e));
    //                     console.log(`************************************************`);
    //                 }
    //             }
    //         })();

    //         if (errors.length) {
    //             console.log(`Delete Errors: ` + toStr(errors));
    //             done(toStr(errors));
    //         }

    //         done();
    //     });
    // });
} /* END Main */

/* Test Helper Functions */
async function insertSingleRowTest(testDb, theTest) {
    let testLabel = `${logL}:'${theTest.testLabel}' insertIfNotExists: `;
    let insertParam = theTest.insertCols.map((col) => theTest.table[col]);
    let selectParam = theTest.selectCols.map((col) => theTest.table[col]);
    let { insertSQL, selectSQL } = theTest;
    let param = {
        insertSQL,
        selectSQL,
        insertParam,
        selectParam,
    };

    const db = new CollisionDb(testDb);
    const result = await db.insertIfNotExists(param);
    expect(result, `${testLabel} result should be an object`).to.be.a("object");
    console.log(`${logL}${testLabel} result: ` + JSON.stringify(result, null, 2));

    for (col in theTest.table) {
        expect(result[col], `${testLabel} ${col}: ${result[col]} === ${theTest.table[col]}`).to.not
            .be.null;
        const expectValue = col === "date" ? Number(theTest.table[col]) : theTest.table[col];
        const gotValue = col === "date" ? Number(result[col]) : result[col];
        expect(gotValue, `${col} === ${expectValue}`).to.equal(expectValue);
    }
    return result;
}

async function deleteRecords(testDb, table, errorCollectorFunc) {
    let error, result, selectResult;
    let testLabel = `${logL}:'Delete entry from ${table.tableName}' : `;
    const db = new CollisionDb(testDb);

    let sql = `DELETE FROM ${table.tableName} WHERE ${table.col.name} = ?`;
    let foreignKeyFail = false;
    try {
        result = await db.delete(sql, [table.col.val]);
    } catch (e) {
        let errStr = toStr(e);
        console.log(`FAIL DELETE SQL = ${sql}: ${table.col.val}`);
        if (errStr.match(/SQLITE_CONSTRAINT/)) {
            console.log(`${testLabel} CONSTRAINT ERROR: ${errStr}`);
            foreignKeyFail = true;
        } else {
            console.log(`${testLabel} DELETE ERROR: ${errStr}`);
        }
        errorCollectorFunc(e);
    }

    try {
        if (!foreignKeyFail) expect(error, `${testLabel}no error `).to.be.undefined;
        let selectSQL = `SELECT ${table.col.name} FROM ${table.tableName} WHERE ${table.col.name} = ?`;
        selectResult = await db.select(selectSQL, table.col.val);
    } catch (e) {
        console.log(`${testLabel}SELECT ERROR: <${toStr(e)}>`);
        // throw new Error(e);
        errorCollectorFunc(e);
    }

    let testName = `${testLabel} ${table.col.name} != ${table.col.name}`;
    if (foreignKeyFail) {
        expect(selectResult, testName).to.have.property(table.col.name);
    } else {
        expect(selectResult, testName).to.be.undefined;
    }
    return result;
}

/* Utility Function */

function toStr(obj = {}) {
    return JSON.stringify(obj, null, 2);
}

function waitingAround(howMany = 100) {
    let startT = Date.now();
    let tot = 0;
    do {
        tot++;
    } while (startT + howMany > Date.now());
    let nowT = Date.now();
    console.log(`WAITED for ${nowT - startT}`);
}

function printBigDoneGood(testLabel) {
    console.log(`++++++++++++++++++++++++++++++++++++++++++++++++`);
    console.log(`${testLabel} DONE GOOD :) `);
    console.log(`++++++++++++++++++++++++++++++++++++++++++++++++`);
}
function printBigDoneBad(testLabel, error) {
    console.log(`************************************************`);
    console.log(`${testLabel} DONE BAD :( ` + toStr(error));
    console.log(`************************************************`);
}
