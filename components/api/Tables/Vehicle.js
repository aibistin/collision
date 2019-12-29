/*
   Vehicle.js
   Interface to the Vehicle table
*/
/* Local */
const Valid = require('../Validation/Valid.js');

class Vehicle {

    constructor(collisionDb) {
        if (!collisionDb)
            throw new Error("The Vehicle constructor requires a 'db' object!");
        this.db = collisionDb;
        this.valid = new Valid();
    }


    /* Insert Methods. Note the "ON CONFLICT IGNORE" clause */
    insert(type_code) {
        type_code = this.valid.trim_lc_and_remove_double_spaces(type_code);
        if (!this.valid.is_str_ok(type_code)) throw new Error("Insert vehicle type_code needs a type_code!");
        const sql = `INSERT OR IGNORE INTO vehicle (type_code) VALUES (?)`;
        return this.db.run(sql, [type_code]);
    }

    /* Select Methods */
    findByType(type_code) {
        type_code = this.valid.trim_lc(type_code);
        if (!this.valid.is_str_ok(type_code)) throw new Error("findBytype needs a type_code!");
        const sql = `SELECT id, type_code FROM vehicle WHERE type_code = ?`;
        return this.db.get(sql, [type_code]);
    }

    findById(id) {
        if (!this.valid.is_pos_int_ok(id)) throw new Error("findById in Vehicle needs an id!");
        const sql = `SELECT id, type_code FROM vehicle WHERE id = ?`;
        return this.db.get(sql, [id]);
    }


    /* Delete Methods */
    deleteByType(type_code) {
        type_code = this.valid.trim_lc(type_code);
        if (!this.valid.is_str_ok(type_code)) throw new Error("Delete vehicle type_code needs an type_code!");
        const sql = `DELETE FROM vehicle WHERE type_code = ?`;
        return this.db.run(sql, [type_code.toLowerCase()]);
    }

    deleteById(id) {
        if (!this.valid.is_pos_int_ok(id)) throw new Error("deleteById from Vehicle needs an id!");
        const sql = `DELETE FROM vehicle WHERE id = ?`;
        return this.db.run(sql, [id]);
    }

    deleteALL() {
        const sql = `DELETE FROM vehicle`;
        return this.db.run(sql);
    }

}

module.exports = Vehicle;
