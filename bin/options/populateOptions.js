/* 'yargs' options */
const yargs = require("yargs");
const config = require("../env/config");
const { ApiParam } = require("../env/nycConfig");

/* Database Populate  Options */

const collision_year = {
    describe: `Get records for given year only: (default ${ApiParam.endYear})`,
    describe: "Populate the database with collisions from given year",
    demand: false,
    alias: "year",
    type: "number",
    choices: ApiParam.validCollisionYears,
    default: ApiParam.endYear,
};

const start_year = {
    describe: `Get records starting from year: (default ${ApiParam.startYear})`,
    demand: false,
    alias: "start",
    type: "number",
    choices: ApiParam.validCollisionYears,
    default: ApiParam.startYear,
};

const end_year = {
    describe: `Get records from ${ApiParam.startYear} to end_year: (default ${ApiParam.endYear})`,
    demand: false,
    alias: "end",
    type: "number",
    choices: ApiParam.validCollisionYears,
    default: ApiParam.endYear,
};

const nycPagingDesc =
    "This api allows for paging through the NYC results.\n" +
    ` Their default value is ${ApiParam.maxRecordsPerPage} results for one query.\n` +
    ` Their maximum number of records for one query is ${
        ApiParam.maxRecords || ApiParam.maxPerPage
    }.\n` +
    ` This script will page through the NYC API starting at an offset of ${ApiParam.offset}.\n` +
    " It will continue to page through the API until there are no more records," +
    " or the 'maximum_records' is hit, whichever comes first.";

const max_per_page = {
    describe: nycPagingDesc,
    demand: false,
    alias: "mpp",
    type: "number",
    default: ApiParam.maxRecordsPerPage,
};

const max_records = {
    describe: `The default 'max_records' is ${ApiParam.maxRecords}. Null === get all records.`,
    demand: false,
    alias: "max",
    type: "number",
    default: ApiParam.maxRecords,
};

const offset = {
    describe: `The default 'offset' is ${ApiParam.offset}`,
    demand: false,
    alias: "o",
    type: "number",
    default: ApiParam.offset,
};

const log_level = {
    describe: `Specify a log level: (default ${config.env.logLevel})`,
    alias: "ll",
    choices: config.env.logLevels,
    type: "string",
    default: config.env.logLevel,
};

const no_cache = {
    describe: "Don't exclude the existing 'Collision Unique Keys' from the database.",
    alias: "nc",
    demand: false,
    alias: "nc",
    type: "boolean",
    default: false,
};

const argv = yargs
    .command("populate", "Populate the local collisions db", {
        collision_year,
        start_year,
        end_year,
        log_level,
        max_per_page,
        max_records,
        no_cache,
        offset,
    })
    .help()
    .alias("help", "h").argv;

module.exports = {
    argv,
};
