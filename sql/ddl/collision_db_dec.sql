--
-- File generated with SQLiteStudio v3.2.1 on Sat Dec 28 15:40:06 2019
--
-- Text encoding used: System
--
PRAGMA foreign_keys = off;
BEGIN TRANSACTION;

-- Table: collision
DROP TABLE IF EXISTS collision;

CREATE TABLE collision (
    unique_key                    INTEGER   PRIMARY KEY,
    date                          TEXT      NOT NULL,
    number_of_persons_injured     INTEGER,
    number_of_persons_killed      INTEGER,
    number_of_pedestrians_injured INTEGER,
    number_of_pedestrians_killed  INTEGER,
    number_of_cyclists_injured    INTEGER,
    number_of_cyclists_killed     INTEGER,
    number_of_motorists_injured   INTEGER,
    number_of_motorists_killed    INTEGER,
    cross_street_id               INTEGER,
    off_street_id                 INTEGER,
    on_street_id                  INTEGER,
    zip_code                      TEXT,
    coordinate_id                 INTEGER,
    create_date                   TIMESTAMP NOT NULL
                                            DEFAULT (CURRENT_TIMESTAMP),
    update_date                   TIMESTAMP NOT NULL
                                            DEFAULT (CURRENT_TIMESTAMP),
    FOREIGN KEY (
        cross_street_id
    )
    REFERENCES street (id) ON DELETE CASCADE
                           ON UPDATE CASCADE,
    FOREIGN KEY (
        off_street_id
    )
    REFERENCES street (id) ON DELETE CASCADE
                           ON UPDATE CASCADE,
    FOREIGN KEY (
        on_street_id
    )
    REFERENCES street (id) ON DELETE CASCADE
                           ON UPDATE CASCADE,
    FOREIGN KEY (
        coordinate_id
    )
    REFERENCES coordinate (id) ON DELETE CASCADE
                               ON UPDATE CASCADE
);


-- Table: collision_contributing_factor
DROP TABLE IF EXISTS collision_contributing_factor;

CREATE TABLE collision_contributing_factor (
    collision_unique_key                 INTEGER NOT NULL,
    contributing_factor_id               INTEGER NOT NULL,
    collision_contributing_vehicle_index INTEGER NOT NULL,
    UNIQUE (
        collision_unique_key,
        contributing_factor_id,
        collision_contributing_vehicle_index
    )
    ON CONFLICT IGNORE,
    FOREIGN KEY (
        collision_unique_key
    )
    REFERENCES collision (unique_key) ON DELETE CASCADE
                                      ON UPDATE NO ACTION,
    FOREIGN KEY (
        contributing_factor_id
    )
    REFERENCES contributing_factor (id) ON DELETE CASCADE
                                        ON UPDATE CASCADE,
    CONSTRAINT collision_contrib_factor_vehicle_idx_ck CHECK ( (collision_contributing_vehicle_index >= 1 AND 
                                                                collision_contributing_vehicle_index <= 5) ) 
);


-- Table: collision_vehicle
DROP TABLE IF EXISTS collision_vehicle;

CREATE TABLE collision_vehicle (
    collision_unique_key    INTEGER NOT NULL,
    vehicle_id              INTEGER NOT NULL,
    collision_vehicle_index INTEGER NOT NULL
                                    CONSTRAINT collision_vehicle_ck_vehicle_idx CHECK (collision_vehicle_index >= 1 AND 
                                                                                       collision_vehicle_index <= 5),
    UNIQUE (
        collision_unique_key,
        vehicle_id,
        collision_vehicle_index
    )
    ON CONFLICT IGNORE,
    FOREIGN KEY (
        collision_unique_key
    )
    REFERENCES collision (unique_key) ON DELETE CASCADE
                                      ON UPDATE CASCADE,
    FOREIGN KEY (
        vehicle_id
    )
    REFERENCES vehicle (id) ON DELETE CASCADE
                            ON UPDATE CASCADE
);


-- Table: contributing_factor
DROP TABLE IF EXISTS contributing_factor;

CREATE TABLE contributing_factor (
    id          INTEGER   PRIMARY KEY,
    factor      TEXT      UNIQUE
                          NOT NULL ON CONFLICT IGNORE,
    create_date TIMESTAMP NOT NULL
                          DEFAULT (CURRENT_TIMESTAMP),
    update_date TIMESTAMP NOT NULL
                          DEFAULT (CURRENT_TIMESTAMP) 
);


-- Table: coordinate
DROP TABLE IF EXISTS coordinate;

CREATE TABLE coordinate (
    id        INTEGER PRIMARY KEY,
    latitude  INTEGER NOT NULL,
    longitude INTEGER NOT NULL,
    UNIQUE (
        latitude,
        longitude
    )
    ON CONFLICT IGNORE
);


-- Table: street
DROP TABLE IF EXISTS street;

CREATE TABLE street (
    id           INTEGER     PRIMARY KEY,
    name         TEXT        NOT NULL,
    borough_code VARCHAR (2) NOT NULL,
    zip_code     VARCHAR (5),
    create_date  TIMESTAMP   NOT NULL
                             DEFAULT CURRENT_TIMESTAMP,
    update_date  TIMESTAMP   NOT NULL
                             DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (
        name,
        borough_code,
        zip_code
    )
    ON CONFLICT IGNORE
);


-- Table: vehicle
DROP TABLE IF EXISTS vehicle;

CREATE TABLE vehicle (
    id          INTEGER   PRIMARY KEY,
    type_code   TEXT      UNIQUE
                          NOT NULL ON CONFLICT IGNORE,
    create_date TIMESTAMP NOT NULL
                          DEFAULT (CURRENT_TIMESTAMP),
    update_date TIMESTAMP NOT NULL
                          DEFAULT (CURRENT_TIMESTAMP) 
);


-- Index: collision_cross_street_idx
DROP INDEX IF EXISTS collision_cross_street_idx;

CREATE INDEX collision_cross_street_idx ON collision (
    cross_street_id
);


-- Index: coordinate_id_idx
DROP INDEX IF EXISTS coordinate_id_idx;

CREATE INDEX coordinate_id_idx ON collision (
    coordinate_id
);


-- Index: off_street_id_idx
DROP INDEX IF EXISTS off_street_id_idx;

CREATE INDEX off_street_id_idx ON collision (
    off_street_id
);


-- Index: on_street_id_idx
DROP INDEX IF EXISTS on_street_id_idx;

CREATE INDEX on_street_id_idx ON collision (
    on_street_id
);


-- Index: street_name_borough_code_u
DROP INDEX IF EXISTS street_name_borough_code_u;

CREATE UNIQUE INDEX street_name_borough_code_u ON street (
    name,
    borough_code
);


-- Trigger: tr_update_cf_update_date
DROP TRIGGER IF EXISTS tr_update_cf_update_date;
CREATE TRIGGER tr_update_cf_update_date
         AFTER UPDATE
            ON contributing_factor
      FOR EACH ROW
          WHEN NEW.factor != OLD.factor
BEGIN
    UPDATE contributing_factor
       SET update_date = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;


-- Trigger: tr_update_cn_update_date
DROP TRIGGER IF EXISTS tr_update_cn_update_date;
CREATE TRIGGER tr_update_cn_update_date
         AFTER UPDATE
            ON collision
      FOR EACH ROW
          WHEN NEW.date != OLD.date OR 
               NEW.number_of_persons_injured != OLD.number_of_persons_injured OR 
               NEW.number_of_persons_killed != OLD.number_of_persons_killed OR 
               NEW.number_of_pedestrians_injured != OLD.number_of_pedestrians_injured OR 
               NEW.number_of_pedestrians_killed != OLD.number_of_pedestrians_killed OR 
               NEW.number_of_cyclists_injured != OLD.number_of_cyclists_injured OR 
               NEW.number_of_cyclists_killed != OLD.number_of_cyclists_killed OR 
               NEW.number_of_motorists_injured != OLD.number_of_motorists_injured OR 
               NEW.number_of_motorists_killed != OLD.number_of_motorists_killed OR 
               NEW.cross_street_id != OLD.cross_street_id OR 
               NEW.off_street_id != OLD.off_street_id OR 
               NEW.on_street_id != OLD.on_street_id OR 
               NEW.zip_code != OLD.zip_code
BEGIN
    UPDATE collision
       SET update_date = CURRENT_TIMESTAMP
     WHERE unique_key = NEW.unique_key;
END;


-- Trigger: tr_update_st_update_date
DROP TRIGGER IF EXISTS tr_update_st_update_date;
CREATE TRIGGER tr_update_st_update_date
         AFTER UPDATE
            ON street
      FOR EACH ROW
          WHEN NEW.name != OLD.name OR 
               NEW.borough_code != OLD.borough_code OR 
               NEW.zip_code != OLD.zip_code
BEGIN
    UPDATE street
       SET update_date = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;


-- Trigger: tr_update_v_update_date
DROP TRIGGER IF EXISTS tr_update_v_update_date;
CREATE TRIGGER tr_update_v_update_date
         AFTER UPDATE
            ON vehicle
      FOR EACH ROW
          WHEN NEW.type_code != OLD.type_code
BEGIN
    UPDATE vehicle
       SET update_date = CURRENT_TIMESTAMP
     WHERE id = NEW.id;
END;


COMMIT TRANSACTION;
PRAGMA foreign_keys = on;
