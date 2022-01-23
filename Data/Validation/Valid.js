/* Validation Methods */
const Config = require("../../env/config");
const NYCConfig = require("../../env/nycConfig");

    // boroughCodes,
    // removeAllSpaces,

    // checkAndCleanStreetName,
    // checkAndCleanZip,
    // toBoroughCode,
    // fromBoroughCode,
    // trimLcAndRemoveDoubleSpaces,

class Valid {
    /* TODO Split Up Valid and Clean */
    constructor(maxStrLen = NYCConfig.Limit.maxStrlen, maxInt = NYCConfig.Limit.maxInt) {
        this.maxStrLen = maxStrLen;
        this.maxInt = maxInt;
        this.maxLargeInt = maxInt;

        this.boroughCodeToName = NYCConfig.NameFix.boroughCodeToName;
        this.streetCodeType1ToName = NYCConfig.NameFix.streetCodeType1ToName;
        this.streetRename = NYCConfig.NameFix.streetRename;
        this.nameFix = NYCConfig.NameFix.nameFix;
    }

    /* Strings */
    isStrOk(str) {
        try {
            return typeof str === "string" && str.length > 0 && str.length <= this.maxStrLen;
        } catch (e) {
            return false;
        }
    }

    /* Integers */
    isIntOk(int) {
        let isOk = false;
        try {
            isOk = (int != undefined) &&
                Number.isInteger(int) &&
                (int <= this.maxInt) &&
                (int >= -this.maxInt);
        }
        finally {
            return isOk;
        }
    }

    isNumericStrOk(numericStr) {
        const re = /^\d+$/;
        return re.test(numericStr) ? true : false;
    }

    /* CoOrdinates */
    isFloatOk(float) {
        let isOk = false;
        try {
            isOk = Number.isNaN(Number.parseFloat(float)) ? false : true;
        } catch (e) {
            log.error(`Failed 'isFloatOk', ${float}, `, e);
        }
        return isOk;
    }

    isPositiveIntOk(int) {
        return this.isIntOk(int) && int >= 0;
    }

    /* String Transform  */
    trim(str) {
        if (str !== undefined) {
            /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim */
            return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "");
        }
    }

    trimLc(str) {
        if (str !== undefined) {
            /* https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim */
            return str.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, "").toLowerCase();
        }
    }

    trimLcAndRemoveDoubleSpaces(str) {
        str = str.replace(/\s+/g, " ");
        return this.trimLc(str);
    }

    unQuote(str) {
        if (str !== undefined) {
            return str.replace(/^['"]|['"]$/g, "");
        }
    }

    /* Date And Time Methods */
    /*TODO Test this */
    convertDateAndTimeStrToDT(dateStr, timeStr) {
        let isoStr = this.convertDateAndTimeStrToIso(dateStr, timeStr);
        let d = new Date(isoStr);
        return d;
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
            [month, day, year] = dateStr.split(dateRe).map((val) => (val = val ? val : "00"));
            month = month.length < 2 ? "0" + month : month;
            day = day.length < 2 ? "0" + day : day;
            dateFormatted = `${year}-${month}-${day}`;
        }
        let [hour, min] = timeStr.split(timeRe).map((val) => (val = val ? val : "00"));
        hour = hour.length < 2 ? "0" + hour : hour;
        /* Im presuming that "02:3" mean "02:30" and not "02:03" */
        min = min.length < 2 ? min + "0" : min;
        return dateFormatted + `T${hour}:${min}:00`;
        let d = new Date(dateIso);
        return d;
    }

    /* Static Date And Time Stuff */
    /*TODO Test this */
    static convertDateToLocalDate(dateObj) {
        let newD = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60 * 1000);
        return newD;
    }

}

module.exports = Valid;
