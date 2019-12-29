/* 'yargs' options */
const yargs = require("yargs");

/* Database Pop Options */
const valid_years = [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023];
const logLevels = ["error", "warn", "info", "verbose", "debug", "trace"];
let default_max_per_page = 50000;
let default_max_records = null;
let default_offset = 0;

const collision_year = {
    describe: "Populate the database with collisions from this year",
    demand: false,
    alias: "year",
    type: "number",
    choices: valid_years,
    default: 2019
};

const start_year = {
    describe: "Get records for this year only",
    demand: false,
    alias: "start",
    type: "string",
    choices: valid_years,
    default: 2012
};

const end_year = {
    describe: "Get records ending and including this year",
    demand: false,
    alias: "end",
    type: "string",
    choices: valid_years,
    default: 2020
};

const nycPagingDesc =
    "This api allows for paging through the NYC results.\n" +
    " Their default value is 1000 results for one query.\n" +
    " Their maximum number of records for one query is 50000.\n" +
    " This script will page through the NYC API starting at an offset of 0.\n" +
    " It will continue to page through the API until there are no more records," +
    " or the 'maximum_records' is hit.";

const max_per_page = {
    describe: nycPagingDesc,
    demand: false,
    alias: "mpp",
    type: "number",
    default: default_max_per_page
};

const max_records = {
    describe: `The default 'max_records' is ${default_max_records}. Null === get all records.`,
    demand: false,
    alias: "max",
    type: "number",
    default: default_max_records
};

const offset = {
    describe: `The default 'offset' is ${default_offset}`,
    demand: false,
    alias: "o",
    type: "number",
    default: default_offset
};

const log_level = {
    describe: `Specify a log level`,
    alias: "ll",
    choices: logLevels,
    type: "string",
    default: "info"
};

const no_cache = {
    describe: "Don't exclude the existing 'Collision Unique Keys' from the database.",
    alias: "nc",
    demand: false,
    alias: "nc",
    type: "boolean",
    default: false
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
        offset
    })
    .help()
    .alias("help", "h").argv;

module.exports = {
    argv
};
