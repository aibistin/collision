/*
   CoOrdinate.js
   Interface to the CoOrdinate table
*/
/* Local */
const Valid = require('../Validation/Valid.js');

class CoOrdinate {
    constructor(collisionDb) {
        this.db = collisionDb;
        this.valid = new Valid();
    }


    /* Insert Methods. Note the "ON CONFLICT IGNORE" clause */
    insert(latitude,longitude) {
        latitude = this.valid.trim_lc(latitude);
        longitude = this.valid.trim_lc(longitude);
        if (!latitude) throw new Error("Insert coordinate needs a latitude!");
        if (!longitude) throw new Error("Insert coordinate needs a longitude!");
        const sql = `INSERT OR IGNORE INTO coordinate (latitude,longitude) VALUES (?,?)`;
        // console.log(`Inserting ${latitude}, ${longitude}`);
        return this.db.run(sql, [latitude,longitude]);
    }

    /* Delete Methods */
    delete(longitude,latitude) {
        latitude = this.valid.trim_lc(latitude);
        longitude = this.valid.trim_lc(longitude);
        if (!latitude) throw new Error("Delete coordinate needs a latitude!");
        if (!longitude) throw new Error("Delete coordinate needs a longitude!");
        const sql = `DELETE FROM coordinate WHERE longitude = ? and latitude = ?`;
        return this.db.run(sql, [longitude,latitude]);
    }

    deleteALL() {
        const sql = `DELETE FROM coordinate`;
        return this.db.run(sql);
    }

    /* Select Methods */
    findById(id) {
        const sql = `SELECT id, longitude, latitude  FROM coordinate WHERE id = ?`;
        return this.db.get(sql, [id]);
    }
}

module.exports = CoOrdinate;
