USE emms_db;

DELIMITER //

CREATE TRIGGER trg_schedule_sets_equipment_under_maintenance
AFTER INSERT ON maintenance_schedules
FOR EACH ROW
BEGIN
  IF NEW.status IN ('Pending', 'In Progress') THEN
    UPDATE equipment
    SET status = 'Under Maintenance'
    WHERE equipment_id = NEW.equipment_id;
  END IF;
END //

DELIMITER ;
