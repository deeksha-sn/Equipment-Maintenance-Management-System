USE emms_db;

DELIMITER //

CREATE PROCEDURE GenerateMonthlyMaintenanceReport(
  IN report_year INT,
  IN report_month INT
)
BEGIN
  SELECT
    e.equipment_id,
    e.equipment_name,
    e.category,
    COUNT(mh.history_id) AS completed_jobs,
    IFNULL(SUM(mh.cost), 0) AS total_maintenance_cost,
    IFNULL(SUM(mh.downtime_hours), 0) AS total_downtime_hours
  FROM equipment e
  LEFT JOIN maintenance_history mh
    ON mh.equipment_id = e.equipment_id
   AND YEAR(mh.completed_date) = report_year
   AND MONTH(mh.completed_date) = report_month
  GROUP BY e.equipment_id, e.equipment_name, e.category
  ORDER BY total_maintenance_cost DESC;
END //

DELIMITER ;
