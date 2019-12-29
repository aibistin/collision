DROP trigger IF EXISTS tr_update_st_update_date;
CREATE TRIGGER tr_update_st_update_date
         AFTER UPDATE
            ON street
      FOR EACH ROW
          WHEN NEW.name != OLD.name
		  OR 
		  NEW.borough_code != OLD.borough_code
		  OR
		  NEW.zip_code != OLD.zip_code
BEGIN
    UPDATE street
       SET update_date = CURRENT_TIMESTAMP
    WHERE id = NEW.id ;
END;