/* 
   test.js -- For testing stuff
*/
/* Local */
const chai = require("chai");
const expect = chai.expect;
const Valid = require("../components/api/Validation/Valid.js");

/* Fixtures */
const maxStrLen = 256;
const maxInt = 10000;
const okLongStr = "x".repeat(maxStrLen);
const tooLongStr = "x".repeat(maxStrLen + 1);

const goodStrings = ["o", "12345", okLongStr];
const badStrings = [undefined, 25, "", [], {
    one: "two"
}, tooLongStr];

const goodInts = [1, -1, maxInt];
const goodPosInts = [1, maxInt];
const badInts = [undefined, "25", "", [], {
    one: "two"
}, tooLongStr, maxInt + 1, -maxInt - 1];
const badPosInts = [badInts, -1];

const boroughNameFromCode = {
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
    sq: "square",
    st: "street",
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

const val = new Valid();

describe("Validation", () => {
    describe("Good Validation Constructor", () => {
        it("Has correct default objects", () => {
            expect(val.boroughNameFromCode).to.deep.equal(boroughNameFromCode);
            expect(val.streetCodeType1).to.deep.equal(streetCodeType1);
            expect(val.streetRename).to.deep.equal(streetRename);
            expect(val.streetNameFix).to.deep.equal(streetNameFix);
        });

        it("Has correct default valyas", () => {
            /* maxStrLen = 256, maxInt = 10000 */
            expect(val.maxStrLen).to.equal(maxStrLen);
            expect(val.maxInt).to.equal(maxInt);
        });
    });

    describe("Validation Checks", () => {
        describe("String Validation Checks", () => {
            it("'is_str_ok' accepts good strings", () => {
                goodStrings.forEach(goodStr => {
                    expect(val.is_str_ok(goodStr)).to.be.true;
                });
            });

            it("'is_str_ok' rejects bad strings", () => {
                badStrings.forEach(badStr => {
                    expect(val.is_str_ok(badStr), `Why is this good?`, badStr).to.be.false;
                });
            });
        });

        describe("Integer Validation Checks", () => {
            it("'is_int_ok' validates good ints", () => {
                goodInts.forEach(goodInt => {
                    expect(val.is_int_ok(goodInt)).to.be.true;
                });
            });

            it("'is_int_ok' rejects bad ints", () => {
                badInts.forEach(badInt => {
                    expect(val.is_int_ok(badInt)).to.be.false;
                });
            });

            it("'is_pos_int_ok' validates good positive ints", () => {
                goodPosInts.forEach(goodPosInt => {
                    expect(val.is_pos_int_ok(goodPosInt)).to.be.true;
                });
            });

            it("'is_pos_int_ok' rejects bad or negative ints", () => {
                badPosInts.forEach(badPosInt => {
                    expect(val.is_pos_int_ok(badPosInt)).to.be.false;
                });
            });
        });
    });
});

console.log(`OK long Str len: ${okLongStr.length}`);

describe("String trasform checks", () => {
    it("'trim_lc' trims and lower cases strings", () => {
        const testStr = "    tHis STR NeedS TrimminG    ";
        const goodStr = "this str needs trimming";
        expect(val.trim_lc(testStr), `Needs trimming ${testStr}`).to.equal(goodStr);
    });

    it("'trim_lc_and_remove_double_spaces' trims, lc and remove double spaces in strings", () => {
        const testStr = "    tHis     STR     NeedS   TrimminG    ";
        const goodStr = "this str needs trimming";
        let gotStr = val.trim_lc_and_remove_double_spaces(testStr);
        expect(gotStr, `Got ${gotStr}`).to.equal(goodStr);
    });
});

describe("Street name trasform checks", () => {
    it("'check_and_clean_street_name' Cleans up street names", () => {
        const streetTests = {
            "49Street": "49 st",
            "Court sq square": "court sq",
            "McStreet Street st": "mcstreet st",
            "Meadow Court ct": "meadow ct",
            "Mugger ct Court": "mugger ct",
            "long island expressway": "lie",
            "brooklyn qns exp": "bqe",
            "brooklyn qns exp exp": "bqe"
        };

        for (let badStreet in streetTests) {
            let gotStr = val.check_and_clean_street_name(badStreet);
            expect(gotStr, `Got: ${gotStr}`).to.equal(streetTests[badStreet]);
        }
    });
});

describe("Zip code transforms", () => {
    it("'check_and_clean_zip' Converts + verifies zips", () => {
        const zipTests = {
            11111: "11111",
            NY22022: "22022",
            Ny22022: "22022",
            111111: null,
            11111: null,
            "11111-234": "11111"
        };

        for (let zip in zipTests) {
            const z = val.to_borough_code(zip);
            expect(z).to.equal(zipTests[z]);
        }
    });
});

describe("Borough code transforms", () => {
    it("'to_borough_code' Converts borough to borough code", () => {
        const boroughTests = {
            bronx: "bx",
            brooklyn: "bn",
            Brooklyn: "bn",
            queens: "q",
            "staten island": "s",
            maNhattan: "m"
        };

        for (let boro in boroughTests) {
            const bc = val.to_borough_code(boro);
            expect(bc).to.equal(boroughTests[boro]);
        }
    });

    it("'to_borough_code' Converts Non borough to undefined", () => {
        let bc = val.to_borough_code("belgium");
        expect(bc, "Got: 'belgium'").to.be.undefined;
    });

    it("'from_borough_code' Converts borough code to borough", () => {
        for (let bc in boroughNameFromCode) {
            let boro = val.from_borough_code(bc);
            expect(boro, `Got: ${boro}`).to.equal(boroughNameFromCode[bc]);
        }
    });

    it("'from_borough_code' Converts Non borough to undefined", () => {
        let boro = val.from_borough_code("uxy");
        expect(boro, `Got: ${boro}`).to.be.undefined;
    });
});


describe("Date Conversion", () => {

    const dateTests = [
        {
           dateStr: "09/14/2012",
           timeStr: "21:45",
           expect : "2012-09-14T21:45",
        },
        {
           dateStr: "7-12-2013",
           timeStr: "1:30",
           expect : "2013-07-12T01:30",
        },
        {
           dateStr: "12/2/2019",
           timeStr: "02:3",
           expect : "2019-12-02T02:30",
        },
        {
           dateStr: "07-31/1977",
           timeStr: ":35",
           expect : "1977-07-31T00:35",
        },
    ];

    it("Converts 'mm/dd/yyyto', 'hh:mm' to ISO date string", () => {
        for (test of dateTests){

            let dateIsoStr = val.convertDateAndTimeStrToIso(test.dateStr,test.timeStr);
            // let dateIsoStr = val.convertDateAndTimeStrToDT(test.dateStr,test.timeStr);
            expect(dateIsoStr).to.equal(test.expect);
        }
    });
});



