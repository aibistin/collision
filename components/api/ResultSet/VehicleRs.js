/*
 *  Api/Database Queries Relating to the Collision Vehicle Table
 */

const dateFns = require('date-fns');
/* Local */
const CollisionQuery = require('../CollisionQuery');
const CollisionDb = require('../CollisionDb_Old_Oct_2019.js');
const Vehicle = require('../Tables/Vehicle.js');

class VehicleRs {
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

    insertVehiclesFromNYCApi(pageOptions) {
        this.collQ = new CollisionQuery();

        this.createVehicleTotalsObj(pageOptions).then((vehTotalsObj) => {
            let vehicleTable = new Vehicle(this.db);
            let ct = 0;
            this.db.serialize(() => {
                for (let vehicleType in vehTotalsObj) {
                    ct++;
                    vehicleTable.insert(vehicleType).catch(this.vehError);
                }

            });
            console.log(`Insert ${ct} vehicles`);
        });
    }

    /* TODO: Do Db call if no vehicleQueryResultObj */
    /* 
        Given a vehicle obj like this;
        {
            vehicle_type_code_1 : "Sedan",
            vehicle_type_code_2 : "PASSENGER VEHICLE",
            vehicle_type_code_3 : "BUS",
            vehicle_type_code_4 : "SMALL COM VEH(4 TIRES) ",
            vehicle_type_code_5 : "SPORT UTILITY / STATION WAGON" 
        }
        Return: 
          [ "Sedan", "PASSENGER VEHICLE", "BUS", "SMALL COM VEH(4 TIRES) ", "SPORT UTILITY / STATION WAGON"] 
    */
    getTypes(vehicleQueryResultObj) {
        let types = [];
        for (let typeKey in vehicleQueryResultObj) {
            if (vehicleQueryResultObj.hasOwnProperty(typeKey)) {
                types.push(vehicleQueryResultObj[typeKey]);
            }
        }
        return types;
    }

    /* 
        Get A Count Of Vehicles By Type 
        Input is each query result obj
    */
    vehicleTypePageCt(vehicleTotal, vehicleQueryResultObj) {
        for (let typeKey in vehicleQueryResultObj) {
            if (vehicleQueryResultObj.hasOwnProperty(typeKey)) {
                let vehicleType = vehicleQueryResultObj[typeKey].toLowerCase();
                if (vehicleType && vehicleType.length) {
                    if (!vehicleTotal[vehicleType]) {
                        vehicleTotal[vehicleType] = 1;
                    } else {
                        vehicleTotal[vehicleType]++;
                    }
                }
            }
        }
        return vehicleTotal;
    }

    /* 
        Get A Count Of Vehicles By Type 
        Combines Vehicle type count objects
        to get a grand total
    */
    vehicleTotCt(vehicleTotal, subTotObj) {
        for (let vehicleType in subTotObj) {
            if (vehicleTotal[vehicleType] === undefined) {
                vehicleTotal[vehicleType] = subTotObj[vehicleType];
            } else {
                vehicleTotal[vehicleType] += subTotObj[vehicleType];
            }
        }
        return vehicleTotal;
    }

    /* Pass: ([vehicleType,ct],[vehicleType,ct]) */
    compareCtRev(b, a) {
        if (a[1] > b[1]) return 1;
        if (a[1] < b[1]) return -1;
        /* Then by vehicle type a - z*/
        if (b[0] > a[0]) return 1;
        if (b[0] < a[0]) return -1;
        return 0;
    }

    getArrayOfHighToLowCounts(vehTotObj) {
        let ctOrder = [];
        for (let vehType in vehTotObj) {
            ctOrder.push([vehType, vehTotObj[vehType]]);
        }
        ctOrder.sort(this.compareCtRev);
        return ctOrder;
    }

    /* 
    passenger vehicle: 165576522
    sport utility / station wagon: 75991151
    sedan: 24217957
    station wagon/sport utility vehicle: 19430760
    taxi: 14374416
    unknown: 10585570
    pick-up truck: 8041739
    van: 5972203
    other: 5487770
     */
    printInOrderOfMostCommon(vehTotObj) {
        this.getArrayOfHighToLowCounts(vehTotObj).forEach((vehicleAndCt) => {
            console.log(`Vehicle: ${vehicleAndCt[0]} Ct: ${vehicleAndCt[1]}`);
        });
    }

    /* pass:
       {
            maxPerPage: 50000,  // Default is 50k
            maxRecords: 200000, // Default is all records
            offset:     0       // Default is 0
        }
    */
    async createVehicleTotalsObj(pageOptions) {
        let maxPerPage = pageOptions.maxPerPage ? pageOptions.maxPerPage : 0;
        let maxRecords = pageOptions.maxRecords;
        let offset = pageOptions.offset ? pageOptions.offset : 0;
        let rowCt = 0;
        console.log(`max per page: ${maxPerPage}`);
        console.log(`max records:  ${maxRecords}`);
        console.log(`Offset:  ${offset}`);
        /* Count will return all the rows in the NYC dataset */
        if (maxRecords === null) {
            let resSet = await this.collQ.rowCount();
            maxRecords = resSet ? resSet[0].count : 0;
        }

        return new Promise(async (resolve, reject) => {
            /* Must be createVehicleTotalsObj call beforehand */
            if (maxRecords) {
                console.log(`Count: ${maxRecords}`);
                console.log("Promise Calls: " + (maxRecords / maxPerPage));
                let promiseFunctions = [];
                let limit = maxPerPage;

                do {
                    if (limit > maxRecords) limit = maxRecords;
                    promiseFunctions.push(this.collQ.allVehicles({
                        offset,
                        limit
                    }));

                    offset += maxPerPage;
                    limit = offset + maxPerPage;

                } while (offset < maxRecords);

                console.log("Promise Function Ct: " + promiseFunctions.length);

                Promise.all(promiseFunctions).then(results => {
                    let initV = {};
                    let allResults = [];

                    //Totals for each vehicles page
                    results.forEach((result, idx) => {
                        let pageTotals = result.reduce(this.vehicleTypePageCt, initV);
                        allResults.push(JSON.parse(JSON.stringify(pageTotals)));
                    });

                    let grandTotals = allResults.reduce(this.vehicleTotCt, {});
                    resolve(grandTotals);

                }).catch((error) => {
                    console.log("            ++++++++++ START Vehicle Q ERROR +++++++++");
                    console.log(error);
                    console.log("            ++++++++++ END Vehicle Q ERROR +++++++++");
                }); //promise all
            }

        });
    }

    vehError(error) {
        console.log("            ++++++++++ START VehicleRs ERROR +++++++++");
        console.log(error);
        console.log("            ++++++++++ END VehicleRs ERROR +++++++++");
    }
}

module.exports = VehicleRs;
