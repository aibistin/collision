/*
   Street.js
   Interface to the Street table
*/

/* Local */
const Valid = require("../Validation/Valid.js");

class Street {
    constructor(collisionDb) {
        this.db = collisionDb;
        this.valid = new Valid();
        this.defaultStreetName = "Not Provided";
        this.logL = "[Street] ";
    }

    /* Insert Methods. Note the "ON CONFLICT IGNORE" clause */
    insert(name, borough, zip_code) {
        let b_code;
        [name, b_code, zip_code] = this._clean_and_validate(name, borough, zip_code);
        const sql = `INSERT OR IGNORE INTO street (name,borough_code, zip_code) VALUES (?,?, ?)`;
        //console.log(`Inserting ${name}, ${b_code} , ${zip_code}`);
        return this.db.run(sql, [name.toLowerCase(), b_code, zip_code]);
    }

    /* Select Methods */
    findById(id) {
        if (!this.valid.is_pos_int_ok(id)) throw new Error(`${this.logL} findById needs an id!`);
        const sql = `SELECT id, name,borough_code, zip_code FROM street WHERE id = ?`;
        return this.db.get(sql, [id]);
    }

    findByNameBorough(name, borough) {
        [name, b_code] = this._clean_and_validate(name, borough);
        if (!this.valid.is_str_ok(name)) throw new Error(`${this.logL}findByName needs a name!`);
        if (!this.valid.is_str_ok(b_code))
            throw new Error(`${this.logL}findByName needs a valid borugh!`);
        const sql = `SELECT id, name, borough_code, zip_code FROM sreet WHERE name = ? and borough_code = ?`;
        return this.db.all(sql, [name, b_code]);
    }

    searchByName(name) {
        name = this.valid.trim_lc(name);
        if (!this.valid.is_str_ok(name)) throw new Error(`${this.logL}searchByName needs a name!`);
        const sql = `SELECT id, name, borough_code, zip_code FROM sreet WHERE name = ?`;
        return this.db.all(sql, [name]);
    }

    async insertIfNotExists(name, borough, zip_code) {
        let b_code,id;
        [name, b_code, zip_code] = this._clean_and_validate(name, borough, zip_code);
        const selectSql = `SELECT id FROM street 
                                  WHERE name = ? 
                                  AND borough_code = ?
                                  AND zip_code = ?`;
        const insertSql = `INSERT INTO street (name,borough_code,zip_code)
         VALUES (?,?,?);`;

        id = await this.db.get(selectSql, [name.toLowerCase(), b_code]);
        if (!id || !id.id) {
              id = await this.db.run(insertSql, [name.toLowerCase(), b_code, zip_code]);
              id = await this.db.get(selectSql, [name.toLowerCase(), b_code, zip_code]);
              console.log(`${this.logL} Id after insert `, id);
        }
        if (id) return new Promise(resolve => resolve(id));
        reject(id);
    }

    /* Delete Methods */
    deleteById() {
        if (!this.valid.is_pos_int_ok(id)) throw new Error(`${this.logL} deleteById needs an id!`);
        const sql = `DELETE FROM street WHERE id = ?`;
        return this.db.run(sql, [id]);
    }

    delete(name, borough) {
        [name, b_code] = this._clean_and_validate(name, borough);
        if (!name) throw new Error(`${this.logL}Delete needs a street name!`);
        if (!b_code) throw new Error(`${this.logL}Delete needs a borough!`);
        const sql = `DELETE FROM street WHERE name = ? and borough_code = ?`;
        return this.db.run(sql, [name, b_code]);
    }

    deleteALL() {
        const sql = `DELETE FROM street`;
        return this.db.run(sql);
    }


    _clean_and_validate(name, borough, zip_code) {
        name = this.valid.check_and_clean_street_name(name) || this.defaultStreetName;
        let b_code = null;
        if (borough) {
            borough = this.valid.trim_lc(borough).toLowerCase();
            b_code = this.valid.to_borough_code(borough);
            if (!b_code) throw new Error(`${this.logL}Insert Street got an incorrect borough!`);
        }

        if (!zip_code) {
            return [name, b_code];
        }

        zip_code = this.valid.trim_lc(zip_code);
        if (zip_code) zip_code = this.valid.check_and_clean_zip(zip_code);
        return [name, b_code, zip_code];
    }
}

module.exports = Street;
