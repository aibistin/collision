

DROP trigger IF EXISTS tr_update_cf_update_date;
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