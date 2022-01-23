DROP TRIGGER IF EXISTS tr_update_v_update_date;
CREATE TRIGGER tr_update_v_update_date   
         AFTER UPDATE
            ON vehicle
        FOR EACH ROW
          WHEN NEW.type_code != OLD.type_code
BEGIN
    UPDATE vehicle SET update_date = CURRENT_TIMESTAMP
	WHERE id=NEW.id;
  
END;

update vehicle SET type_code='dirt-' WHERE id=613;

SELECT * from vehicle where id=613;
