/* collision_db_sanity
   Sanity checks for the CollisionDbDb 
   The CollisionDbCb is the 'callback' version of the database interface.
   No Promises or async/awaits.
*/
/* Create a new sqlite3 database */
const sqlite3 = require("sqlite3").verbose();
const faker = require("faker/locale/en_US");
/* Local */
const CollisionDb = require("../components/api/CollisionDbCb.js");
const Collision = require("../components/api/Tables/Collision.js");
const CoOrdinate = require("../components/api/Tables/CoOrdinate.js");
const Street = require("../components/api/Tables/Street.js");
const Vehicle = require("../components/api/Tables/Vehicle.js");
const ContributingFactor = require("../components/api/Tables/ContributingFactor.js");
const CollisionContributingFactor = require("../components/api/Tables/CollisionContributingFactor.js");
const CollisionVehicle = require("../components/api/Tables/CollisionVehicle.js");

let testDb = "c:\\Users\\ak1\\Apps\\collision\\db\\collision_test_1.db";

let db = new CollisionDb(testDb);
console.log("Created new test db: ", db);
let boroughCodes = ["bn", "bx", "m", "q", "s", "u"];
/*******************    INSERT SQL ****************************/
let insertIntoCollisionSQL = `
INSERT INTO collision (
    unique_key,
    date,
    number_of_persons_injured,
    number_of_persons_killed,
    number_of_pedestrians_injured,
    number_of_pedestrians_killed,
    number_of_cyclists_injured,
    number_of_cyclists_killed,
    number_of_motorists_injured,
    number_of_motorists_killed,
    cross_street_id,
    off_street_id,
    on_street_id,
    coordinate_id
)
VALUES ( ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
`;

/* Need to select "AS id" to conform with the other selects */
let selectFromCollisionSQL = `
SELECT
    unique_key AS id
    FROM collision 
    WHERE unique_key = ?
`;

/* Vehicle */
let insertIntoVehicleSQL = `INSERT INTO vehicle ( type_code) VALUES (?)`;

let selectVehicleSQL = ` SELECT id FROM vehicle WHERE type_code = ?`;

let insertIntoCollisionVehicleSQL = `
INSERT INTO collision_vehicle (
    collision_unique_key,
    vehicle_id,
    collision_vehicle_index
)
VALUES (?, ?, ?)`;

let selectCollisionVehicleSQL = `
SELECT collision_unique_key, vehicle_id, collision_vehicle_index  FROM collision_vehicle
    WHERE  collision_unique_key = ?
    AND    vehicle_id = ?
    AND    collision_vehicle_index = ?
 `;

/* Contribution Factor */
let insertIntoContributingFactorSQL = `
INSERT INTO contributing_factor (factor) VALUES (?)`;

let selectContributingFactor = `SELECT id FROM contributing_factor WHERE factor = ? `;

let insertIntoCollisionContribFactorSQL = `
INSERT INTO collision_contributing_factor (
    collision_unique_key,
    contributing_factor_id,
    collision_contributing_vehicle_index
)
VALUES (?, ?, ?) `;

let selectCollisionContributingFactor = `
SELECT collision_unique_key,contributing_factor_id ,collision_contributing_vehicle_index  FROM collision_contributing_factor
 WHERE  collision_unique_key = ?
 AND    contributing_factor_id = ?
 AND    collision_contributing_vehicle_index = ?
 `;

/* Co - Ordinate */
let insertIntoCoOrdinateSQL = `
INSERT INTO coordinate (
    latitude,
    longitude
)
VALUES (?, ?)`;

let selectCoOrdinateSQL = `SELECT id FROM coordinate 
                     WHERE latitude=? 
                     AND longitude=?
                     `;

/* Street */
let selectStreetSQL = `SELECT id FROM street 
                     WHERE name=? 
                     AND borough_code=?
                     AND zip_code=?
                     `;

let insertIntoStreetSQL = `
INSERT INTO street (
    name,
    borough_code,
    zip_code
)
VALUES ( ?, ?, ?) `;

/******************* END INSERT  SQL ****************************/
/*******************    SELECT SQL ****************************/
/*******************  END   SELECT SQL ****************************/
/*******************  INPUT DATA  ****************************/
let street = {
    name: faker.address.streetName() + " " + faker.address.streetSuffix(),
    borough_code: boroughCodes[Math.floor(Math.random() * boroughCodes.length)],
    zip_code: faker.address.zipCode()
};
let streetValyas = [street.name, street.borough_code, street.zip_code];
//let streetValyas = ["one", "u", "11104"];

let vehicle = {
    type_code: faker.random.objectElement()
};
let vehicleValyas = [vehicle.type_code];

let contribFactor = {
    factor: faker.company.bs()
};

let contribFactorValyas = [contribFactor.factor];

let coOrdinate = {
    latitude: faker.address.latitude(),
    longitude: faker.address.longitude()
};

let coOrdinateValyas = [coOrdinate.latitude, coOrdinate.longitude];
console.log("coOrdinate Valyas : " + JSON.stringify(coOrdinateValyas));
let collision = {
    unique_key: faker.random.number(),
    date: faker.date.past(),
    number_of_persons_injured: faker.random.number(),
    number_of_persons_killed: faker.random.number(),
    number_of_pedestrians_injured: faker.random.number(),
    number_of_pedestrians_killed: faker.random.number(),
    number_of_cyclists_injured: faker.random.number(),
    number_of_cyclists_killed: faker.random.number(),
    number_of_motorists_injured: faker.random.number(),
    number_of_motorists_killed: faker.random.number(),
    cross_street_id: null,
    off_street_id: null,
    on_street_id: null,
    coordinate_id: null
};
let collisionMissingValyas = {
    cross_street_id: null,
    off_street_id: null,
    on_street_id: null,
    coordinate_id: null
};

let collisionValyas = [
    collision.unique_key,
    collision.date,
    collision.number_of_persons_injured,
    collision.number_of_persons_killed,
    collision.number_of_pedestrians_injured,
    collision.number_of_pedestrians_killed,
    collision.number_of_cyclists_injured,
    collision.number_of_cyclists_killed,
    collision.number_of_motorists_injured,
    collision.number_of_motorists_killed
];
/*******************  END  INPUT DATA  ****************************/

db.serialize(async () => {
    let result = await db.insertIfNotExists(selectStreetSQL, insertIntoStreetSQL, streetValyas);
    if (result && result.id) {
        collisionMissingValyas.cross_street_id = result.id;
        collisionMissingValyas.off_street_id = result.id;
        collisionMissingValyas.on_street_id = result.id;
    }

    //Id of last insert : isUpdated { id: 27, changes: 1 }
    console.log(`Street result: `, result);
    result = await db.insertIfNotExists(
        selectCoOrdinateSQL,
        insertIntoCoOrdinateSQL,
        coOrdinateValyas
    );
    console.log(`CoOrdinate result: `, result);
    if (result && result.id) {
        collisionMissingValyas.coordinate_id = result.id;
    }

    /* Insert Collison */
    collisionValyas.push(collisionMissingValyas.cross_street_id);
    collisionValyas.push(collisionMissingValyas.off_street_id);
    collisionValyas.push(collisionMissingValyas.on_street_id);
    collisionValyas.push(collisionMissingValyas.coordinate_id);

    result = await db.insertIfNotExists(
        selectFromCollisionSQL,
        insertIntoCollisionSQL,
        collisionValyas,
        collisionValyas[0]
    );

    console.log(`*** Collision result: `, result);
    let collisionResultMissingValyas = {};
    if (result && result.id) { // SELECT AS id
        collisionResultMissingValyas.collision_unique_key = result.id;
    }

    /* END Insert Collison */

    /* Insert Vehicle */
    vehicleIndexArr = ["1", "2", "3", "4", "5"];
    let vehicleIndex = Math.floor(Math.random() * vehicleIndexArr.length);
    result = await db.insertIfNotExists(selectVehicleSQL, insertIntoVehicleSQL, vehicleValyas);
    console.log(`Vehicle result: `, result);
    if (result && result.id) {
        collisionResultMissingValyas.vehicle_id = result.id;
        collisionResultMissingValyas.collision_vehicle_index = vehicleIndexArr[vehicleIndex];
    }

    let collisonVehicleValyas = [
        collisionResultMissingValyas.collision_unique_key,
        collisionResultMissingValyas.vehicle_id,
        collisionResultMissingValyas.collision_vehicle_index
    ];

    // collision_unique_key,
    // vehicle_id,
    // collision_vehicle_index
    result = await db.insertIfNotExists(
        selectCollisionVehicleSQL,
        insertIntoCollisionVehicleSQL,
        collisonVehicleValyas
    );
    console.log(`Collision Vehicle result: `, result);

    /* END Insert Vehicle */
    /* Insert Contributing Factor */
    result = await db.insertIfNotExists(
        selectContributingFactor,
        insertIntoContributingFactorSQL,
        contribFactorValyas
    );

    console.log(`Cotributing factor result: `, result);
        let collisonContribFactorValyas = [];
    if (result) {
        let contribFactorId = result.id;
        collisonContribFactorValyas = [
            collisionResultMissingValyas.collision_unique_key,
            contribFactorId,
            collisionResultMissingValyas.collision_vehicle_index
        ];
    }

    result = await db.insertIfNotExists(
        selectCollisionContributingFactor,
        insertIntoCollisionContribFactorSQL,
        collisonContribFactorValyas
    );

    console.log(`Collision Cotributing factor result: `, result);

    // let processEachRow = row => {
    //     console.log("Result row : ", row);
    // };
    // let results = await db.getEachStreetNameLike("%lane%", processEachRow);
    // console.log(`Streetcursor: ${JSON.stringify(results, null, 4)}`);
    // results = await db.getEachStreetNameLike("%fake%", processEachRow);
    // console.log(`Streets like fake: ${JSON.stringify(results, null, 4)}`);

    let idx = 0;

    // db.serialize(() => {});
    db.close();
});
