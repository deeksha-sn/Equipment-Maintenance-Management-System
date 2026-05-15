CREATE DATABASE IF NOT EXISTS emms_db;
USE emms_db;

DROP TRIGGER IF EXISTS trg_schedule_sets_equipment_under_maintenance;
DROP PROCEDURE IF EXISTS GenerateMonthlyMaintenanceReport;

DROP TABLE IF EXISTS equipment_downtime;
DROP TABLE IF EXISTS maintenance_costs;
DROP TABLE IF EXISTS equipment_parts;
DROP TABLE IF EXISTS service_reminders;
DROP TABLE IF EXISTS maintenance_history;
DROP TABLE IF EXISTS maintenance_schedules;
DROP TABLE IF EXISTS recent_activities;
DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS users;

CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  full_name VARCHAR(100) NOT NULL,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  role ENUM('Admin', 'Technician', 'Supervisor') NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  phone VARCHAR(20),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE equipment (
  equipment_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_name VARCHAR(120) NOT NULL,
  category VARCHAR(80) NOT NULL,
  serial_number VARCHAR(80) NOT NULL UNIQUE,
  location VARCHAR(120) NOT NULL,
  purchase_date DATE NOT NULL,
  status ENUM('Active', 'Under Maintenance', 'Retired') NOT NULL DEFAULT 'Active',
  service_interval_days INT NOT NULL DEFAULT 90 CHECK (service_interval_days > 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE maintenance_schedules (
  schedule_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  technician_id INT,
  scheduled_date DATE NOT NULL,
  next_service_date DATE NOT NULL,
  maintenance_type VARCHAR(80) NOT NULL,
  interval_days INT NOT NULL CHECK (interval_days > 0),
  priority ENUM('Low', 'Medium', 'High') NOT NULL DEFAULT 'Medium',
  status ENUM('Pending', 'In Progress', 'Completed', 'Cancelled') NOT NULL DEFAULT 'Pending',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_schedule_equipment FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  CONSTRAINT fk_schedule_technician FOREIGN KEY (technician_id)
    REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE maintenance_history (
  history_id INT AUTO_INCREMENT PRIMARY KEY,
  schedule_id INT,
  equipment_id INT NOT NULL,
  technician_id INT,
  completed_date DATE NOT NULL,
  maintenance_type VARCHAR(80) NOT NULL,
  notes TEXT,
  cost DECIMAL(10, 2) NOT NULL DEFAULT 0 CHECK (cost >= 0),
  downtime_hours DECIMAL(8, 2) NOT NULL DEFAULT 0 CHECK (downtime_hours >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_history_schedule FOREIGN KEY (schedule_id)
    REFERENCES maintenance_schedules(schedule_id) ON DELETE SET NULL,
  CONSTRAINT fk_history_equipment FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  CONSTRAINT fk_history_technician FOREIGN KEY (technician_id)
    REFERENCES users(user_id) ON DELETE SET NULL
);

CREATE TABLE service_reminders (
  reminder_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  schedule_id INT,
  reminder_date DATE NOT NULL,
  type ENUM('Upcoming', 'Overdue') NOT NULL DEFAULT 'Upcoming',
  status ENUM('Upcoming', 'Overdue', 'Completed') NOT NULL DEFAULT 'Upcoming',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_reminder_equipment FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  CONSTRAINT fk_reminder_schedule FOREIGN KEY (schedule_id)
    REFERENCES maintenance_schedules(schedule_id) ON DELETE CASCADE
);

CREATE TABLE equipment_parts (
  part_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  part_name VARCHAR(100) NOT NULL,
  part_number VARCHAR(80) NOT NULL,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity >= 0),
  supplier VARCHAR(100),
  CONSTRAINT fk_part_equipment FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id) ON DELETE CASCADE
);

CREATE TABLE maintenance_costs (
  cost_id INT AUTO_INCREMENT PRIMARY KEY,
  history_id INT,
  equipment_id INT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  cost_date DATE NOT NULL,
  description VARCHAR(255),
  CONSTRAINT fk_cost_history FOREIGN KEY (history_id)
    REFERENCES maintenance_history(history_id) ON DELETE SET NULL,
  CONSTRAINT fk_cost_equipment FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id) ON DELETE CASCADE
);

CREATE TABLE equipment_downtime (
  downtime_id INT AUTO_INCREMENT PRIMARY KEY,
  equipment_id INT NOT NULL,
  history_id INT,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  total_hours DECIMAL(8, 2) NOT NULL CHECK (total_hours >= 0),
  reason VARCHAR(255),
  CONSTRAINT fk_downtime_equipment FOREIGN KEY (equipment_id)
    REFERENCES equipment(equipment_id) ON DELETE CASCADE,
  CONSTRAINT fk_downtime_history FOREIGN KEY (history_id)
    REFERENCES maintenance_history(history_id) ON DELETE SET NULL,
  CONSTRAINT chk_downtime_time CHECK (end_time >= start_time)
);

CREATE TABLE recent_activities (
  activity_id INT AUTO_INCREMENT PRIMARY KEY,
  message VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
