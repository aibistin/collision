/*
 *  Api/Database Queries Relating to the Collision ContributingFactor 
 *  Tables
 */

/* Local */
const CollisionQuery = require('../CollisionQuery');
const CollisionDb = require('../CollisionDb_Old_Oct_2019.js');
const ContributingFactor = require('../Tables/ContributingFactor.js');

class ContribFactorRs {
    constructor(db) {
        this.db = db ? db : new CollisionDb();
        this.collQ = null;
    }

    /* pass:
       {
            maxPerPage: 50000,  // Default is 50k
            maxRecords: 200000, // Default is all records
            offset:     0       // Default is 0
        }
    */

    async insertContribFactorFromNYCApi(param) {
        let maxPerPage = param.maxPerPage ? param.maxPerPage : 50000;
        let maxRecords = param.maxRecords ? param.maxRecords : 0;
        let offset = param.offset ? param.offset : 0;
        this.collQ = new CollisionQuery();

        let resSet = await this.collQ.rowCount();
        let rowCt = resSet ? resSet[0].count : 0;
        console.log(`Count: ${rowCt}`);

        return new Promise(async (resolve, reject) => {
            if (maxRecords <= 0) maxRecords = rowCt;
            let promiseFunctions = [];
            let limit = maxPerPage;
            let cFactorTable = new ContributingFactor(this.db);
            if (rowCt <= 0) {
                console.log("No factor records found");
                reject(false);
            }

            do {
                if (limit > maxRecords) limit = maxRecords;
                let factorsData = await this.collQ.allFactors({
                    offset,
                    limit
                });
                /* {
                       "contributing_factor_vehicle_1": "Failure to Yield Right-of-Way"
                   },
                   {
                       "contributing_factor_vehicle_1": "Passing or Lane Usage Improper",
                       "contributing_factor_vehicle_2": "Unspecified"
                   },
                */
                //console.log("Factor Data: " + JSON.stringify(factorsData, null, 4));
                let factObj = {};
                factorsData.forEach((factor) => {
                    [1, 2, 3, 4, 5].forEach((i) => {
                        let factor_idx = "contributing_factor_vehicle_" + 1;
                        if (factor[factor_idx]) {
                            if (!factObj[factor[factor_idx]]) {
                                factObj[factor[factor_idx]] = 1;
                            } else {
                                factObj[factor[factor_idx]]++;
                            }
                        }
                    });
                });

                console.log("Factor Obj: " + JSON.stringify(factObj, null, 4));

                this.db.serialize(() => {
                    for (let f in factObj){
                        console.log("Insert: ", f);
                        cFactorTable.insert(f).catch(f);
                    }
                });

                offset += maxPerPage;
                limit = offset + maxPerPage;
            } while (offset < maxRecords);

            resolve(true);
        });

    }

    factorError(error) {
        console.log("            ++++++++++ START ContribFactorRs ERROR +++++++++");
        console.log(error);
        console.log("            ++++++++++ END ContribFactorRs ERROR +++++++++");
    }
}

module.exports = ContribFactorRs;
