/*
 *  Populate our collision database with City Collision data
 *  Params: 
 *     startDate, endDate
 *     tableName
 * 
 */
const dateFns = require('date-fns');
/* Local */
const CollisionDb = require('../CollisionDb.js');
const VehicleRs = require('../ResultSet/VehicleRs.js');
const LocationRs = require('../ResultSet/LocationRs.js');
const ContribFactorRs = require('../ResultSet/ContribFactorRs.js');
const AllRs = require('../ResultSet/AllRs.js');
/* 

 Obsolete


 */


class Populate {
    constructor(pageOptions = {}) {
        this.db = new CollisionDb();
        this.pageOptions = {
            maxPerPage: pageOptions.maxPerPage ? pageOptions.maxPerPage : 50000,
            /* undefined === all records */
            maxRecords: pageOptions.maxRecords ? pageOptions.maxRecords : pageOptions.maxRecords === 0 ? 0 : null,
            offset: pageOptions.offset != undefined ? pageOptions.offset : 0
        };
    }

    popError(error) {
        console.log("            ++++++++++ START Pop ERROR +++++++++");
        console.log(error);
        console.log("            ++++++++++ END  Pop ERROR +++++++++");
    }

    /*
     *   Fix this up for pop vehicle table
     */

    populateVehicleTable() {
        console.log("Typeof VRS: " + typeof(VehicleRs));
        let vRs = new VehicleRs(this.db);
        vRs.insertVehiclesFromNYCApi(this.pageOptions);
    }
    populateLocTable() {
        let loc = new LocationRs(this.db);
        loc.insertLocationsFromNYCApi(this.pageOptions);
    }
    populateContribFactorTable() {
        let cf = new ContribFactorRs(this.db);
        cf.insertContribFactorFromNYCApi(this.pageOptions);
    }
    populateAllTables() {
        let allRs = new AllRs(this.db);
        allRs.insertAllFromNYCAp(this.pageOptions);
    }
}
module.exports = Populate;
