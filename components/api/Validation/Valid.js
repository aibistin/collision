/* Validation Methods */

class Valid {
    constructor(maxStrLen = 256, maxInt = 10000) {
        this.maxStrLen = maxStrLen;
        this.maxInt = maxInt;
        this.maxLargeInt = maxInt;

        this.boroughNameFromCode = {
            bx: "Bronx",
            bn: "Brooklyn",
            m: "Manhattan",
            q: "Queens",
            s: "Staten Island",
            u: "Not Provided"
        };

        this.streetCodeType1 = {
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

        this.streetRename = {
            "brooklyn queens e": "bqe",
            "brooklyn qns e": "bqe",
            "grand central p": "gcp",
            "jackie robinson p": "jrp",
            "long island e": "lie"
        };

        this.streetNameFix = {
            bklyn: "brooklyn",
            bx: "bronx",
            qns: "queens"
        };
    }

    /* Strings */
    is_str_ok(str) {
        try {
            return typeof str === "string" && str.length > 0 && str.length <= this.maxStrLen;
        } catch (e) {
            return false;
        }
    }

    /* Integers */
    is_int_ok(int) {
        try {
            return (
                int != undefined &&
                Number.isInteger(int) &&
                int <= this.maxInt &&
                int >= -this.maxInt
            );
        } catch (e) {
            return false;
        }
    }

    is_numeric_str_ok(numericStr) {
        const re = /^\d+$/;
        return re.test(numericStr) ? true : false;
    }

    /* CoOrdinates */
    is_float_ok(float) {
        try {
            return Number.isNaN(Number.parseFloat(float)) ? false : true;
        } catch (e) {
            log.error(`Failed 'is_float_ok', ${float}, `, e);
            return false;
        }
    }

    is_pos_int_ok(int) {
        return this.is_int_ok(int) && int >= 0;
    }

    /* String Transform  */
    trim(str) {
        if (str !== undefined) {
            /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim */
            return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
        }
    }

    trim_lc(str) {
        if (str !== undefined) {
            /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim */
            return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "").toLowerCase();
        }
    }

    trim_lc_and_remove_double_spaces(str) {
        str = str.replace(/\s+/g, " ");
        return this.trim_lc(str);
    }

    /* Table Specific Validation and cleaning */

    check_and_clean_street_name(name) {
        name = this.trim_lc_and_remove_double_spaces(name);
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
            for (let badName in this.streetNameFix) {
                let badRx = new RegExp(`\b(${badName})\\b`);
                if (name.match(badRx)) {
                    name.replace(badRx, this.streetNameFix[$1]);
                }
            }

            /* Replace 'long island expressway' with 'lie' */
            for (let sName in this.streetRename) {
                const rxStreetType = new RegExp(`${sName}`);
                if (name.match(rxStreetType)) {
                    name = this.streetRename[sName];
                    break;
                }
            }

            /* Replace 'st street' with 'st' */
            for (let sCode in this.streetCodeType1) {
                const rxRepeat = new RegExp(
                    ` ${sCode}\\s+(?:${this.streetCodeType1[sCode]}|${sCode})\$`
                );
                const rxStreetType = new RegExp(` ${this.streetCodeType1[sCode]}\\b`);
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
    */
    check_and_clean_zip(zip_code) {
        /* Dont expect NYPD to enter full Zip codes
           Eg: 11022-xxx
        */
        let zipRx1 = /^[nN][yY]\d{5}$/;
        let zipRx2 = /^\d{5}$/;
        zip_code = this.trim_lc(zip_code);
        if (!zip_code || zip_code.length < 5) return null;
        if (zip_code.match(zipRx1)) {
            zip_code = zip_code.substring(2, 8);
        } else if (!zip_code.match(zipRx2)) {
            zip_code = null;
        }
        return zip_code;
    }

    to_borough_code(borough) {
        if (!borough) return "u";
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

    from_borough_code(code) {
        return this.boroughNameFromCode[code.toLowerCase()];
    }

    convertDateAndTimeStrToIso(dateStr, timeStr) {
        const dateNTimeSplitRe = /T/;
        const dateRe = /\s*\/|\-\s*/;
        const timeRe = /\s*:\s*/;
        let dateFormatted, month, day, year;
        if (dateNTimeSplitRe.test(dateStr)) {
            /* "2019-01-01T00:00:00.000" */
            dateFormatted = dateStr.substring(0, 10);
        } else {
            /* "2019/07/31" */
            [month, day, year] = dateStr.split(dateRe).map(val => (val = val ? val : "00"));
            month = month.length < 2 ? "0" + month : month;
            day = day.length < 2 ? "0" + day : day;
            dateFormatted = `${year}-${month}-${day}`;
        }
        let [hour, min] = timeStr.split(timeRe).map(val => (val = val ? val : "00"));
        hour = hour.length < 2 ? "0" + hour : hour;
        /* Im presuming that "02:3" mean "02:30" and not "02:03" */
        min = min.length < 2 ? min + "0" : min;
        return dateFormatted + `T${hour}:${min}:00`;
        let d = new Date(dateIso);
        return d;
    }

    /*TODO Test this */
    convertDateAndTimeStrToDT(dateStr, timeStr) {
        let isoStr = this.convertDateAndTimeStrToIso(dateStr, timeStr);
        let d = new Date(isoStr);
        return d;
    }

    /*TODO Test this */
    convertDateToLocalDate(dateObj) {
        let newD = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60 * 1000);
        return newD;
    }
}

module.exports = Valid;
