/*
   ContributingFactor.js
   Interface to the ContributingFactor table
*/
/* Local */
const Valid = require('../Validation/Valid.js');

class ContributingFactor {

    constructor(collisionDb) {
        this.db = collisionDb;
        this.valid = new Valid(256, 100000);
    }


    insert(factor) {
        factor = this.valid.trim_lc_and_remove_double_spaces(factor);
        if (!this.valid.is_str_ok(factor)) throw new Error("Insert contributing_factor needs an factor!");
        const sql = `INSERT OR IGNORE into contributing_factor (factor) VALUES (?)`;
        return this.db.run(sql, [factor]);
    }

    /* Select Methods */
    findByFactor(factor) {
        factor = this.valid.trim_lc(factor);
        if (!this.valid.is_str_ok(factor)) throw new Error("findByFactor needs a factor!");
        const sql = `SELECT id, factor FROM contributing_factor WHERE factor = ?`;
        return this.db.get(sql, [factor]);
    }

    findById(id) {
        if (!this.valid.is_pos_int_ok(id)) throw new Error("findById in contributing_factor needs an id!");
        const sql = `SELECT id, factor FROM contributing_factor WHERE id = ?`;
        return this.db.get(sql, [id]);
    }

    /* Delete Methods */
    deleteByFactor(factor) {
        factor = this.valid.trim_lc(factor);
        if (!this.valid.is_str_ok(factor)) throw new Error("Delete from contributing_factor needs an factor!");
        const sql = `DELETE FROM contributing_factor WHERE factor = ?`;
        return this.db.run(sql, [factor]);
    }

    deleteById(id) {
        if (!this.valid.is_pos_int_ok(id)) throw new Error("deleteById from contributing_factor needs an id!");
        const sql = `DELETE FROM contributing_factor WHERE id = ?`;
        return this.db.run(sql, [id]);
    }

    deleteALL() {
        const sql = `DELETE FROM contributing_factor`;
        return this.db.run(sql);
    }



}

module.exports = ContributingFactor;
