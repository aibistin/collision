/* 
    NAME: NYCollisionAPIQ
    Gets Colliaion Data from the New York City Collision Db 
    Notes: 
    2012 : The earliest year of available data
    50,000 : Maximum results available from one query

Returns:
{                                                                 
    "contributing_factor_vehicle_1": "Failure to Yield Right-of-Way",   
    "date": "2017-03-20T00:00:00.000",                                  
    "latitude": "40.676548",                                            
    "location": {                                                       
        "type": "Point",                                                
        "coordinates": [                                                
            -73.76838,                                                  
            40.676548                                                   
        ]                                                               
    },                                                                  
    "longitude": "-73.76838",                                           
    "number_of_cyclists_injured": "0",                                   
    "number_of_cyclists_killed": "0",                                    
    "number_of_motorist_injured": "0",                                  
    "number_of_motorists_killed": "0",                                   
    "number_of_pedestrians_injured": "1",                               
    "number_of_pedestrians_killed": "0",                                
    "number_of_persons_injured": "1",                                   
    "number_of_persons_killed": "0",                                    
    "on_street_name": "133 AVENUE                      ",               
    "time": "6:00",                                                     
    "unique_key": "3635907"                                             
}                                                                       
*/
const axios = require("axios");
/* Local */
let config = require("../../env/config.js");
const log = require("../../env/logger").moduleLogger;

class CollisionQuery {
    constructor(minStartYear = "2012") {
        this.baseUrl = "https://data.cityofnewyork.us/resource/qiz3-axqb.json";
        this.url = "";
        this.minStartYear = minStartYear ? minStartYear : config.env.default.minStartYear;
        this.defaultPageParam = {
            offset: 0,
            limit: 50000
        };
    }

    apiKey() {
        return `&$$app_token=${config.env.NYC.apiKey}`;
    }

    /* This will get a count of all rows of data available from NYC */
    async rowCount(year) {
        this.url = "?$select=count(*)" + this.apiKey();
        if (year) this.url += "&$where=" + this.yearStartEnd(year);
        const res = await this.callCollisionApi();
        if (res.status !== 200) throw new Error(`Bad city api response, ${res.status}`);
        return res.data;
    }

    async allYearData(apiParam = this.defaultPageParam) {
        if (!apiParam.year || apiParam.year < this.minStartYear) {
            log.error(`'allYearData' says, You must specify the starting year, ${apiParam.year}`);
            throw new Error(
                `'allYearData' says, You must specify the starting year, ${apiParam.year}`
            );
        }

        this.url =
            "?$select=" +
            "collision_id AS unique_key," +
            "crash_date AS date," +
            "crash_time AS time," +
            "number_of_persons_injured,number_of_persons_killed," +
            "number_of_pedestrians_injured,number_of_pedestrians_killed," +
            "number_of_cyclist_injured AS number_of_cyclists_injured," +
            "number_of_cyclist_killed AS number_of_cyclists_killed," +
            "number_of_motorist_injured AS number_of_motorists_injured," +
            "number_of_motorist_killed AS number_of_motorists_killed," +
            "borough,zip_code," +
            "latitude,longitude,location," +
            "on_street_name,off_street_name,cross_street_name," +
            "contributing_factor_vehicle_1," +
            "contributing_factor_vehicle_2," +
            "contributing_factor_vehicle_3," +
            "contributing_factor_vehicle_4," +
            "contributing_factor_vehicle_5," +
            "vehicle_type_code1 AS  vehicle_type_code_1," +
            "vehicle_type_code2 AS  vehicle_type_code_2," +
            "vehicle_type_code_3 AS vehicle_type_code_3," +
            "vehicle_type_code_4 AS vehicle_type_code_4," +
            "vehicle_type_code_5 AS vehicle_type_code_5" +
            `&$offset=${apiParam.offset}&$limit=${apiParam.limit}&$order=crash_date,crash_time` +
            this.apiKey() +
            "&$where=" +
            this.yearStartEnd(apiParam.year);

        const res = await this.callCollisionApi();
        if (res.status !== 200) throw new Error(`Bad city api response, ${res.status}`);
        return res.data;
    }

    /* Also normalize the vehicle_type labeling */
    allVehicles(page = this.defaultPageParam) {
        this.url =
            "?$select=" +
            "vehicle_type_code1 AS  vehicle_type_code_1," +
            "vehicle_type_code2 AS  vehicle_type_code_2," +
            "vehicle_type_code_3 AS vehicle_type_code_3," +
            "vehicle_type_code_4 AS vehicle_type_code_4," +
            "vehicle_type_code_5 AS vehicle_type_code_5" +
            `&$offset=${page.offset}&$limit=${page.limit}&$order=date` +
            this.apiKey();
        return new Promise((resolve, reject) => {
            this.axiosCall(resolve, reject);
        });
    }

    /*
    {
          "latitude": "40.676548",
          "longitude": "-73.76838",
          "location": {
              "type": "Point",
              "coordinates": [
                  -73.76838,
                  40.676548
              ]
          }
      },
      {},
      */

    allLocations(page = this.defaultPageParam) {
        this.url =
            "?$select=" +
            "borough,zip_code," +
            "latitude,longitude,location," +
            "on_street_name,off_street_name,cross_street_name" +
            `&$offset=${page.offset}&$limit=${page.limit}&$order=date` +
            this.apiKey();

        return new Promise((resolve, reject) => {
            this.axiosCall(resolve, reject);
        });
    }

    allFactors(page = this.defaultPageParam) {
        this.url =
            "?$select=" +
            "contributing_factor_vehicle_1," +
            "contributing_factor_vehicle_2," +
            "contributing_factor_vehicle_3," +
            "contributing_factor_vehicle_4," +
            "contributing_factor_vehicle_5" +
            `&$offset=${page.offset}&$limit=${page.limit}&$order=date` +
            this.apiKey();

        return new Promise((resolve, reject) => {
            this.axiosCall(resolve, reject);
        });
    }

    axiosCall(resolve, reject) {
        axios({
            method: "get",
            baseURL: this.baseUrl,
            url: this.url
        })
            .then(function(response) {
                if (response.status !== 200) reject("Bad city response, " + response.status);
                let body = response.data;
                resolve(body);
            })
            .catch(error => {
                log.error("            ++++++++++ START AXIOS ERROR +++++++++");
                log.error(error);
                log.error("            ++++++++++ END AXIOS ERROR +++++++++");
            });
    }

    callCollisionApi() {
        return axios({
            method: "get",
            baseURL: this.baseUrl,
            url: this.url
        });
    }

    yearStartEnd(year) {
        /* Eg: "2019-02-05T00:00:00.000" */
        //const startDate = year + "-01-01T00:00:00.000";
        let prevYear = year - 1;
        const startDate = prevYear + "-12-31";
        const endDate = year + "-12-31T23:59:59.000";
        const filterByYear = `${startDate}`;
        /* Original API had 'date' = "2019-07-09T00:00:00.000" 
          -- return `date > '${startDate}'`;
        */
        /* Around  11/14/2019 the API date changed to 
           'accident_date' = "2019-07-09T00:00:00.000"  
           'accident_time'
        */
        /* Around  12/06/2019 the API date changed to 
            "crash_date":"2019-07-09T00:00:00.000", (NOTE: All 0's for the time)
            "crash_time":"18:00"
        */
        // return `accident_date > '${startDate}' AND accident_date <= '${endDate}'`;
        return `crash_date > '${startDate}' AND crash_date <= '${endDate}'`;
    }
        // return `accident_date > '${startDate}' AND accident_date <= '${endDate}'`;
}

module.exports = CollisionQuery;
