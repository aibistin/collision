DROP TRIGGER IF EXISTS tr_update_cn_update_date;

CREATE TRIGGER tr_update_cn_update_date           
      AFTER UPDATE                             
            ON collision                          
      FOR EACH ROW  WHEN 
			NEW.date != OLD.date  
			OR                      
			NEW.number_of_persons_injured      != OLD.number_of_persons_injured
			OR
			NEW.number_of_persons_killed       != OLD.number_of_persons_killed
			OR
			NEW.number_of_pedestrians_injured  != OLD.number_of_pedestrians_injured
			OR
			NEW.number_of_pedestrians_killed   != OLD.number_of_pedestrians_killed
			OR
			NEW.number_of_cyclists_injured     != OLD.number_of_cyclists_injured
			OR
			NEW.number_of_cyclists_killed      != OLD.number_of_cyclists_killed
			OR
			NEW.number_of_motorists_injured    != OLD.number_of_motorists_injured
			OR
			NEW.number_of_motorists_killed     != OLD.number_of_motorists_killed
			OR
			NEW.cross_street_id                != OLD.cross_street_id
			OR
			NEW.off_street_id                  != OLD.off_street_id
			OR
			NEW.on_street_id                   != OLD.on_street_id
			OR
			NEW.zip_code                       != OLD.zip_code                              
          
BEGIN                                             
    UPDATE collision                              
       SET update_date = CURRENT_TIMESTAMP        
     WHERE unique_key = NEW.unique_key;           
END;                                   

           



