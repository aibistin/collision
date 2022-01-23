/* 
   data_cleaning_tests.js -- Test cleaning and filtering of input data
   TODO Split into two test scripts: 
       1. Test Valid.js
       2. Test ValidNYC.js
*/
/* Local */
const chai = require("chai");
const expect = chai.expect;
const ValidNYC = require("../Data/Validation/ValidNYC");
const { Limit, NameFix } = require("../env/nycConfig"); // ApiParam, Limit, NameFix,

/* Fixtures */
const okLongStr = "x".repeat(Limit.maxStrLen);
const tooLongStr = "x".repeat(Limit.maxStrLen + 1);

const goodStrings = ["o", "12345", okLongStr];
const badStrings = [
    undefined,
    25,
    "",
    [],
    {
        one: "two",
    },
    tooLongStr,
];

const goodInts = [1, -1, Limit.maxInt];
const goodPosInts = [1, Limit.maxInt];
const badInts = [
    undefined,
    "25",
    "",
    [],
    {
        one: "two",
    },
    tooLongStr,
    Limit.maxInt + 1,
    -Limit.maxInt - 1,
];
const badPosInts = [badInts, -1];

const validNYC = new ValidNYC();

describe("Validation", () => {
    describe("Good Validation Constructor", () => {
        it("Has correct default objects", () => {
            expect(validNYC.boroughCodeToName).to.deep.equal(NameFix.boroughCodeToName);
            expect(validNYC.streetCodeType1ToName).to.deep.equal(
                NameFix.streetCodeType1ToName
            );
            expect(validNYC.streetRename).to.deep.equal(NameFix.streetRename);
            expect(validNYC.nameFix).to.deep.equal(NameFix.nameFix);
        });

        it("Has correct default valyas", () => {
            /* maxStrLen = 256, maxInt = 10000 */
            expect(validNYC.maxStrLen).to.equal(Limit.maxStrLen);
            expect(validNYC.maxInt).to.equal(maxInt);
        });
    });

    describe("Validation Checks", () => {
        describe("String Validation Checks", () => {
            it("'isStrOk' accepts good strings", () => {
                goodStrings.forEach((goodStr) => {
                    expect(validNYC.isStrOk(goodStr)).to.be.true;
                });
            });

            it("'isStrOk' rejects bad strings", () => {
                badStrings.forEach((badStr) => {
                    expect(validNYC.isStrOk(badStr), `Why is this good?`, badStr).to.be.false;
                });
            });
        });

        describe("Integer Validation Checks", () => {
            it("'isIntOk' validates good ints", () => {
                goodInts.forEach((goodInt) => {
                    expect(validNYC.isIntOk(goodInt)).to.be.true;
                });
            });

            it("'isIntOk' rejects bad ints", () => {
                badInts.forEach((badInt) => {
                    expect(validNYC.isIntOk(badInt)).to.be.false;
                });
            });

            it("'isPositiveIntOk' validates good positive ints", () => {
                goodPosInts.forEach((goodPosInt) => {
                    expect(validNYC.isPositiveIntOk(goodPosInt)).to.be.true;
                });
            });

            it("'isPositiveIntOk' rejects bad or negative ints", () => {
                badPosInts.forEach((badPosInt) => {
                    expect(validNYC.isPositiveIntOk(badPosInt)).to.be.false;
                });
            });
        });
    });
});

console.log(`OK long str len: ${okLongStr.length}`);

describe("String trasform checks", () => {
    it("'trimLc' trims and lower cases strings", () => {
        const testStr = "    tHis STR NeedS TrimminG    ";
        const goodStr = "this str needs trimming";
        expect(validNYC.trimLc(testStr), `Needs trimming ${testStr}`).to.equal(goodStr);
    });

    it("'trimLcAndRemoveDoubleSpaces' trims, lc and remove double spaces in strings", () => {
        const testStr = "    tHis     STR     NeedS   TrimminG    ";
        const goodStr = "this str needs trimming";
        let gotStr = validNYC.trimLcAndRemoveDoubleSpaces(testStr);
        expect(gotStr, `Got ${gotStr}`).to.equal(goodStr);
    });
});

describe("Street name trasform checks", () => {
    it("'checkAndCleanStreetName' Cleans up street names", () => {
        const streetTests = {
            "49Street": "49 st",
            "Court sq square": "court sq",
            "McStreet Street st": "mcstreet st",
            "Meadow Court ct": "meadow ct",
            "Mugger ct Court": "mugger ct",
            "long island expressway": "lie",
            "brooklyn qns exp": "bqe",
            "brooklyn qns exp exp": "bqe",
        };

        for (let badStreet in streetTests) {
            let gotStr = validNYC.checkAndCleanStreetName(badStreet);
            expect(gotStr, `Got: ${gotStr}`).to.equal(streetTests[badStreet]);
        }
    });
});

describe("Zip code transforms", () => {
    it("'checkAndCleanZip' Converts + verifies zips", () => {
        const zipTests = {
            11111: "11111",
            NY22022: "22022",
            Ny22022: "22022",
            111111: null,
            "11111-234": "11111",
        };

        for (let zip in zipTests) {
            const z = validNYC.checkAndCleanZip(zip);
            expect(z).to.equal(zipTests[zip]);
        }
    });
});

describe("Borough code transforms", () => {
    it("'toBoroughCode' Converts borough to borough code", () => {
        const boroughTests = {
            bronx: "bx",
            brooklyn: "bn",
            Brooklyn: "bn",
            queens: "q",
            "staten island": "s",
            maNhattan: "m",
        };

        for (let boro in boroughTests) {
            const bc = validNYC.toBoroughCode(boro);
            expect(bc).to.equal(boroughTests[boro]);
        }
    });

    it("'toBoroughCode' Converts non borough to undefined", () => {
        let bc = validNYC.toBoroughCode("belgium");
        expect(bc, "Got: 'belgium'").to.equal("u");
    });

    it("'from_borough_code' Converts borough code to borough", () => {
        for (let bc in NameFix.boroughCodeToName) {
            let boro = validNYC.fromBoroughCode(bc);
            expect(boro, `Got: ${boro}`).to.equal(NameFix.boroughCodeToName[bc]);
        }
    });

    it("'fromBoroughCode' Converts Non borough to undefined", () => {
        let boro = validNYC.fromBoroughCode("uxy");
        expect(boro, `Got: ${boro}`).to.be.undefined;
    });
});

describe("Date Conversion", () => {
    const dateTests = [
        {
            dateStr: "09/14/2012",
            timeStr: "21:45",
            expect: "2012-09-14T21:45:00",
        },
        {
            dateStr: "7-12-2013",
            timeStr: "1:30",
            expect: "2013-07-12T01:30:00",
        },
        {
            dateStr: "12/2/2019",
            timeStr: "02:3",
            expect: "2019-12-02T02:30:00",
        },
        {
            dateStr: "07-31/1977",
            timeStr: ":35",
            expect: "1977-07-31T00:35:00",
        },
    ];

    it("Converts 'mm/dd/yyyto', 'hh:mm' to ISO date string", () => {
        for (test of dateTests) {
            let dateIsoStr = validNYC.convertDateAndTimeStrToIso(test.dateStr, test.timeStr);
            // let dateIsoStr = validNYC.convertDateAndTimeStrToDT(test.dateStr,test.timeStr);
            expect(dateIsoStr).to.equal(test.expect);
        }
    });
});
