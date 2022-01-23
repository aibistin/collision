/* Validation Methods For NYC */
const { ApiParam, NameFix } = require("../../env/nycConfig"); // ApiParam, Limit, NameFix
const Valid = require("./Valid");

class ValidNYC extends Valid {
    constructor(nameFix = NameFix) {
        super();
        this.boroughCodeToName = nameFix.boroughCodeToName;
        this.streetCodeType1ToName = nameFix.streetCodeType1ToName;
        this.streetRename = nameFix.streetRename;
        this.nameFix = nameFix.nameFix;
    }

    /* Table Specific Validation and cleaning */
    checkAndCleanStreetName(name) {
        name = this.trimLcAndRemoveDoubleSpaces(name);
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
            for (let badName in this.nameFix) {
                let badRx = new RegExp(`\b(${badName})\\b`);
                if (name.match(badRx)) {
                    name.replace(badRx, this.nameFix[$1]);
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
            for (let sCode in this.streetCodeType1ToName) {
                const rxRepeat = new RegExp(
                    ` ${sCode}\\s+(?:${this.streetCodeType1ToName[sCode]}|${sCode})\$`
                );
                const rxStreetType = new RegExp(` ${this.streetCodeType1ToName[sCode]}\\b`);
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
    checkAndCleanZip(zipCode) {
        /* Dont expect NYPD to enter full Zip codes
           Eg: 11022-xxx
        */
        console.log(`'checkAndCleanZip' Zip: ${zipCode}`);
        let zipRx1 = /^[nN][yY]\d{5}$/;
        let zipRx2 = /^\d{5}$/;
        let zipRx3 = /^\d{5}(-\d+)?$/;
        zipCode = this.unQuote(this.trimLc(zipCode));
        if (!zipCode || zipCode.length < 5) return null;
        if (zipCode.match(zipRx1)) {
            zipCode = zipCode.substring(2, 8);
        } else if (zipCode.match(zipRx3)) {
            zipCode = zipCode.substring(0, 5);
        } else if (!zipCode.match(zipRx2)) {
            zipCode = null;
        }
        return zipCode;
    }

    toBoroughCode(borough) {
        if (!borough) return "u"; //  u === Unknown
        borough = borough.toLowerCase();
        if (borough.startsWith("m")) {
            return "m";
        } else if (borough.startsWith("q")) {
            return "q";
        } else if (
            borough.startsWith("broo") ||
            borough.startsWith("bn") ||
            borough.startsWith("bk")
        ) {
            return "bn";
        } else if (borough.startsWith("bron") || borough.startsWith("bx")) {
            return "bx";
        } else if (borough.startsWith("s")) {
            return "s";
        } else if (borough.startsWith("u")) {
            return "u";
        }
        return "u";
    }

    fromBoroughCode(code) {
        return this.boroughCodeToName[code.toLowerCase()];
    }

    static isYearGood(year) {
        /* Could also use ApiParam.validCollisionYears Array */
        return year && year >= ApiParam.startYear && year <= ApiParam.endYear;
    }
}

module.exports = ValidNYC;
