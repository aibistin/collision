/*
 *  Api/Database Queries Relating to the All Collision Tables
 */

const dateFns = require("date-fns");
/* Local */
const CollisionQuery = require("../NYCollisionAPIq");
const CollisionDb = require("../CollisionDb_Old_Oct_2019.js/index.js");
/* Tables */
const ContributingFactor = require("../Tables/ContributingFactor.js");
const CoOrdinate = require("../Tables/CoOrdinate.js");
const Street = require("../Tables/Street.js");
const Vehicle = require("../Tables/Vehicle.js");
const CollisionVehicle = require("../Tables/CollisionVehicle.js");
const CollisionContributingFactor = require("../Tables/CollisionContributingFactor.js");
const Collision = require("../Tables/Collision.js");

class AllRs {
    constructor(db) {
        this.db = db ? db : new CollisionDb();
        this.collQ = null;
    }

    /* pass:
       {
            maxPerPage: 50000,  // Default is 50k
            maxRecords: 200000, // Default is all records
            offset:     0       // Default is 0
            year:       2017    // Default is 2013
        }
    */
    async insertAllFromNYCApi(param, year) {
        let maxPerPage = param.maxPerPage ? param.maxPerPage : 50000;
        let maxRecords = param.maxRecords ? param.maxRecords : 0;
        let offset = param.offset ? param.offset : 0;
        this.collQ = new CollisionQuery();
        // const year = 2019;

        //TODO rowCt per year
        let resSet = await this.collQ.rowCount(year);
        let rowCt = resSet ? resSet[0].count : 0;
        console.log(`All count for year ${year}, ${rowCt}`);

        return new Promise(async (resolve, reject) => {
            if (maxRecords <= 0) maxRecords = rowCt;
            let promiseFunctions = [];
            let limit = maxPerPage;
            if (rowCt <= 0) {
                console.log("No data found");
                reject(false);
            }

            let coOrdTable = new CoOrdinate(this.db);
            let streetTable = new Street(this.db);
            let vehicleTable = new Vehicle(this.db);
            let cFactorTable = new ContributingFactor(this.db);
            /* Need to set up these tables */
            let cVehicleTable = new CollisionVehicle(this.db);
            let cContributingFactorTable = new CollisionContributingFactor(this.db);
            let cCollisionTable = new Collision(this.db);

            do {
                if (limit > maxRecords) limit = maxRecords;
                let allData = await this.collQ.allYearData(year, {
                    offset,
                    limit
                });

                /*
                   {
                       "contributing_factor_vehicle_1": "Passing or Lane Usage Improper",
                       "contributing_factor_vehicle_2": "Unspecified"
                   },
                */

                // console.log("All Data: " + JSON.stringify(allData, null, 4));

                let collisionRec = {};
                /* Insert for Location, Vehicle Contributing factor Etc */
                let streetTypes = ["on_street_name", "off_street_name", "cross_street_name"];
                allData.forEach(async rec => {
                    /* Location */
                    let coOrdId;
                    if (rec.latitude && rec.longitude) {
                        coOrdId = await coOrdTable.insert(rec.latitude, rec.longitude).catch(e => {
                            console.log("Failed inserting coordinate, " + JSON.stringify(rec));
                            console.log("Error: ", e);
                        });

                        //console.log("CoOrd id: " , coOrdId);
                        //console.log(` Lat: ${rec.latitude},Long: ${rec.longitude}`);
                        this.db.serialize(() => {
                            streetTypes.forEach( async street_type => {
                                if (rec[street_type]) {
                                    const streetId = await streetTable
                                        .insertIfNotExists(
                                            rec[street_type],
                                            rec.borough,
                                            rec.zip_code
                                        )
                                        .catch(e => {
                                            console.log(
                                                "Failed insert street, " + JSON.stringify(rec)
                                            );
                                            console.log("Error: ", e);
                                        });
                                    console.log(
                                        ` Street type: ${rec[street_type]},Boro: ${
                                            rec.borough
                                        } Zip: ${rec.zip_code}`
                                    );
                                    console.log("Street id: ", streetId);
                                }
                            });
                        });
                    }

                    /* Contributing Factor */
                    [1, 2, 3, 4, 5].forEach(async i => {
                        let factor_idx = "contributing_factor_vehicle_" + i;
                        if (rec[factor_idx]) {
                            if (!collisionRec[rec[factor_idx]]) {
                                collisionRec[rec[factor_idx]] = 1;
                            } else {
                                collisionRec[rec[factor_idx]]++;
                            }
                        }
                    });
                });

                // console.log("all Obj: " + JSON.stringify(collisionRec, null, 4));

                this.db.serialize(() => {
                    for (let f in collisionRec) {
                        //     console.log("Would insert: ", f);
                        const cFactorId = cFactorTable.insert(f).catch(f);
                        //console.log(`Inserted cFactorId: ${cFactorId}`);
                        //console.log("C Factor id: " , cFactorId);
                    }
                });

                offset += maxPerPage;
                limit = offset + maxPerPage;
            } while (offset < maxRecords);

            resolve(true);
        });
    }

    vehError(error) {
        console.log("            ++++++++++ START AllRs ERROR +++++++++");
        console.log(error);
        console.log("            ++++++++++ END AllRs ERROR +++++++++");
    }
}

module.exports = AllRs;
