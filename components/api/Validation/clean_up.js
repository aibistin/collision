/*  Exports Cleaning and Validating Functions */
const maxStrlen = 256;
const maxInt = 10000;
let boroughCodes = ["bn", "bx", "m", "q", "s", "u"];

const boroughCode = {
    bx: "Bronx",
    bn: "Brooklyn",
    m: "Manhattan",
    q: "Queens",
    s: "Staten Island",
    u: "Not Provided"
};

const streetCodeType1 = {
    blvd: "boulevard",
    bvd: "boulevard",
    bvd: "boulevard",
    dr: "drive",
    ct: "court",
    expy: "expressway",
    hwy: "highway",
    la: "lane",
    pky: "parkway",
    pk: "park",
    st: "street",
    sq: "square",
    rd: "road"
};

const streetRename = {
    "brooklyn queens e": "bqe",
    "brooklyn qns e": "bqe",
    "grand central p": "gcp",
    "jackie robinson p": "jrp",
    "long island e": "lie"
};

const streetNameFix = {
    bklyn: "brooklyn",
    bx: "bronx",
    qns: "queens"
};

/* Strings */
function is_str_ok(str) {
    try {
        return typeof str === "string" && str.length > 0 && str.length <= maxStrLen;
    } catch (e) {
        return false;
    }
}

/* Integers Validation And Cleaning */
function is_int_ok(int) {
    try {
        return int != undefined && Number.isInteger(int) && int <= maxInt && int >= -maxInt;
    } catch (e) {
        return false;
    }
}

function is_pos_int_ok(int) {
    return is_int_ok(int) && int >= 0;
}

/* Sring Transforms  */
function trim_str(str) {
    if (str !== undefined) {
        /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim */
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
    }
}

function remove_all_spaces(str) {
    if (str !== undefined) {
        /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim */
        return str.replace(/[\s\uFEFF\xA0]+/g, "");
    }
}

function trim_lc(str) {
    if (str !== undefined) {
        /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim */
        return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "").toLowerCase();
    }
}

function trim_lc_and_remove_double_spaces(str) {
    str = str.replace(/\s+/g, " ");
    return trim_lc(str);
}

/* Table Specific Validation and cleaning */

function check_and_clean_street_name(name) {
    name = trim_lc_and_remove_double_spaces(name);
    if (name) {
        /* Some street names start with 'p/l', 'f/o', 'i/o' ... */
        /* 'n/o','s/o','e/o','w/o' */

        // Keep for now
        // name = name.replace(/p\/l\s*/g, "");
        // name = name.replace(/[nsewfi]\/o\s*/g, "");

        /* 
          49sreet => 49 street 
          McStreet st Street => mcstreet st
          McStreet Avenue ave => mcstreet ave
        */
        const rxNameNo = /(\d+)([a-z])/;
        name = name.replace(rxNameNo, "$1 $2");
        for (let badName in streetNameFix) {
            let badRx = new RegExp(`\b(${badName})\\b`);
            if (name.match(badRx)) {
                name.replace(badRx, streetNameFix[$1]);
            }
        }

        /* Replace 'long island expressway' with 'lie' */
        for (let sName in streetRename) {
            const rxStreetType = new RegExp(`${sName}`);
            if (name.match(rxStreetType)) {
                name = streetRename[sName];
                break;
            }
        }

        /* Replace 'st street' with 'st' */
        for (let sCode in streetCodeType1) {
            const rxRepeat = new RegExp(` ${sCode}\\s+(?:${streetCodeType1[sCode]}|${sCode})\$`);
            const rxStreetType = new RegExp(` ${streetCodeType1[sCode]}\\b`);
            if (name.match(rxStreetType)) {
                name = name.replace(rxStreetType, " " + sCode);
                name = name.replace(rxRepeat, " " + sCode);
                break;
            }
            if (name.match(rxRepeat)) {
                name = name.replace(rxRepeat, " " + sCode);
                break;
            }
        }
    }

    return name;
}

/* 
  NY11102 => 11102
  Bad one to null
  This is for New York Zips only
*/
function check_and_clean_zip(zip_code) {
    /* Dont expect NYPD to enter full Zip codes
       Eg: 11022-xxx, but hey, you never know
    */
    console.log(`TESTING ZIP: ${zip_code}`);
    let zipRx1 = /^[nN][yY]\d{5}$/;
    let zipRx2 = /^[nN][yY]\d{5}\s?-\s?\d{4}$/;
    let zipRx3 = /^\d{5}$/;
    if (zip_code.length > 1) {
        if (zip_code.match(zipRx1)) {
            zip_code = zip_code.substring(2, 8);
        } else if (zip_code.match.xipRx2) {
            zip_code = remove_all_spaces(zip_code);
            zip_code = zip_code.substring(2, 13);
        } else if (!zip_code.match(zipRx3)) {
            zip_code = null;
        }
    }
    return zip_code;
}

/* Keep adding as I find more variations */
function to_borough_code(borough) {
    if (!borough) return undefined;
    borough = borough.toLowerCase();
    if (borough.startsWith("m")) {
        return "m";
    } else if (borough.startsWith("q")) {
        return "q";
    } else if (borough.startsWith("broo") || borough.startsWith("bn")) {
        return "bn";
    } else if (borough.startsWith("bron") || borough.startsWith("bx")) {
        return "bx";
    } else if (borough.startsWith("s")) {
        return "s";
    } else if (borough.startsWith("u")) {
        return "u";
    }
}

function from_borough_code(code) {
    return boroughCode[code.toLowerCase()];
}

// "date": "2012-07-01T00:00:00.000", // "time": "0:05",
function convertDateAndTimeStrToIso(dateStr, timeStr) {
    const dateRe = /\s*\/|\-\s*/;
    const timeRe = /\s*:\s*/;
    let [month, day, year] = dateStr.split(dateRe).map(val => (val = val ? val : "00"));
    let [hour, min] = timeStr.split(timeRe).map(val => (val = val ? val : "00"));
    hour = hour.length < 2 ? "0" + hour : hour;
    month = month.length < 2 ? "0" + month : month;
    day = day.length < 2 ? "0" + day : day;
    /* Im presuming that "02:3" means "02:30" and not "02:03" */
    min = min.length < 2 ? min + "0" : min;
    return `${year}-${month}-${day}T${hour}:${min}`;
    let d = new Date(dateIso);
    return d;
}

module.exports = {
    maxStrlen,
    maxInt,
    boroughCodes,
    boroughCode,
    convertDateAndTimeStrToIso,
    streetCodeType1,
    streetRename,
    streetNameFix,
    is_str_ok,
    is_int_ok,
    is_pos_int_ok,
    remove_all_spaces,
    trim_lc,
    trim_str,
    trim_lc_and_remove_double_spaces,
    check_and_clean_street_name,
    check_and_clean_zip,
    to_borough_code,
    from_borough_code
};
