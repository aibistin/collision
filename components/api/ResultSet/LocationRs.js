/*
 *  Api/Database Queries Relating to the Collision CoOrdinate and Street
 *  Tables
 */

/* Local */
const CollisionQuery = require("../CollisionQuery");
const CollisionDb = require("../CollisionDb_Old_Oct_2019.js");
const CoOrdinate = require("../Tables/CoOrdinate.js");
const Street = require("../Tables/Street.js");

class LocationRs {
    constructor() {
        this.db = new CollisionDb();
        this.collQ = null;
    }

    /* pass:
       {
            maxPerPage: 50000,  // Default is 50k
            maxRecords: 200000, // Default is all records
            offset:     0       // Default is 0
        }
        Record format from NYPD:
        {
            "latitude": "40.676548",
            "location": { "type": "Point", "coordinates": [ -73.76838, 40.676548 ] },
            "longitude": "-73.76838",
            "on_street_name": "133 AVENUE                      "
        },
    */

    async insertLocationsFromNYCApi(param) {
        let maxPerPage = param.maxPerPage ? param.maxPerPage : 50000;
        let maxRecords = param.maxRecords ? param.maxRecords : 0;
        let offset = param.offset ? param.offset : 0;
        this.collQ = new CollisionQuery();

        let resSet = await this.collQ.rowCount();
        let rowCt = resSet ? resSet[0].count : 0;
        console.log(`Location Count: ${rowCt}`);

        return new Promise(async (resolve, reject) => {
            if (maxRecords <= 0) maxRecords = rowCt;
            let limit = maxPerPage > maxRecords ? maxRecords : maxPerPage;
            let coOrdTable = new CoOrdinate(this.db);
            let streetTable = new Street(this.db);
            let gotCt = 0;
            let locations;
            let tryCt = 0;

            do {
                try {
                    locations = await this.collQ.allLocations({
                        offset,
                        limit
                    });
                } catch (e) {
                    console.log("Got an error looking for locatons: ", e);
                    locations = await this.collQ.allLocations({
                        offset,
                        limit
                    });
                }

                gotCt += locations.length;
                console.log(`Got ${gotCt} so far`);
                console.log(`About to insert ${locations.length} locations starting at ${offset}`);

                let streetTypes = ["on_street_name", "off_street_name", "cross_street_name"];
                locations.forEach(l => {
                    if (l.latitude && l.longitude) {
                        coOrdTable.insert(l.latitude, l.longitude).catch(e => {
                            console.log("Failed inserting coordinate, " + JSON.stringify(l));
                            console.log("Error: ", e);
                        });
                        streetTypes.forEach(street_type => {
                            if (l[street_type]) {
                                streetTable
                                    .insert(l[street_type], l.borough, l.zip_code)
                                    .catch(e => {
                                        console.log(
                                            "Failed inserting street, " + JSON.stringify(l)
                                        );
                                        console.log("Error: ", e);
                                    });
                            }
                        });
                    }
                });

                offset += maxPerPage;
                limit = gotCt + limit <= maxRecords ? limit : maxRecords - gotCt;
            } while (gotCt < maxRecords);
            resolve(true);
        });
    }

}

module.exports = LocationRs;
