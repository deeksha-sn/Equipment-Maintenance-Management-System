USE emms_db;

INSERT INTO users (full_name, username, password, role, email, phone) VALUES
('Aarav Sharma', 'admin', 'admin123', 'Admin', 'admin@emms.local', '9876543210'),
('Neha Rao', 'tech1', 'tech123', 'Technician', 'neha@emms.local', '9876543211'),
('Rahul Verma', 'tech2', 'tech123', 'Technician', 'rahul@emms.local', '9876543212'),
('Priya Nair', 'supervisor', 'super123', 'Supervisor', 'priya@emms.local', '9876543213');

INSERT INTO equipment (equipment_name, category, serial_number, location, purchase_date, status, service_interval_days) VALUES
('CNC Milling Machine', 'Manufacturing', 'CNC-MIL-2023-001', 'Workshop A', '2023-04-12', 'Active', 60),
('Air Compressor', 'Utilities', 'AIR-COMP-2022-014', 'Compressor Room', '2022-09-20', 'Under Maintenance', 45),
('Hydraulic Press', 'Manufacturing', 'HYD-PRESS-2021-007', 'Workshop B', '2021-06-18', 'Active', 90),
('Diesel Generator', 'Power Backup', 'DG-500-2020-021', 'Power House', '2020-11-02', 'Active', 30),
('Cooling Tower Pump', 'HVAC', 'CT-PUMP-2022-009', 'Utility Block', '2022-02-10', 'Retired', 120);

INSERT INTO maintenance_schedules
(equipment_id, technician_id, scheduled_date, next_service_date, maintenance_type, interval_days, priority, status, notes) VALUES
(1, 2, '2026-05-20', '2026-07-19', 'Preventive Service', 60, 'Medium', 'Pending', 'Inspect spindle and lubrication system'),
(2, 3, '2026-05-10', '2026-06-24', 'Leak Repair', 45, 'High', 'In Progress', 'Pressure drop observed'),
(3, 2, '2026-05-28', '2026-08-26', 'Hydraulic Oil Check', 90, 'Medium', 'Pending', 'Check cylinder seals'),
(4, 3, '2026-05-05', '2026-06-04', 'Battery Inspection', 30, 'High', 'Pending', 'Monthly generator inspection');

INSERT INTO maintenance_history
(schedule_id, equipment_id, technician_id, completed_date, maintenance_type, notes, cost, downtime_hours) VALUES
(NULL, 1, 2, '2026-04-15', 'Calibration', 'Axis alignment completed successfully', 4500.00, 3.50),
(NULL, 4, 3, '2026-04-30', 'Oil Replacement', 'Changed oil filter and coolant', 6200.00, 5.00);

INSERT INTO service_reminders (equipment_id, schedule_id, reminder_date, type, status) VALUES
(1, 1, '2026-05-20', 'Upcoming', 'Upcoming'),
(2, 2, '2026-05-10', 'Overdue', 'Overdue'),
(3, 3, '2026-05-28', 'Upcoming', 'Upcoming'),
(4, 4, '2026-05-05', 'Overdue', 'Overdue');

INSERT INTO equipment_parts (equipment_id, part_name, part_number, quantity, supplier) VALUES
(1, 'Spindle Belt', 'SB-CNC-44', 2, 'MechPro Supplies'),
(2, 'Pressure Valve', 'PV-AC-19', 4, 'AirTech Traders'),
(3, 'Hydraulic Seal Kit', 'HSK-HP-77', 3, 'Industrial Parts Co'),
(4, 'Fuel Filter', 'FF-DG-500', 5, 'PowerMax Services');

INSERT INTO maintenance_costs (history_id, equipment_id, amount, cost_date, description) VALUES
(1, 1, 4500.00, '2026-04-15', 'Calibration labor and consumables'),
(2, 4, 6200.00, '2026-04-30', 'Oil, coolant and filters');

INSERT INTO equipment_downtime (equipment_id, history_id, start_time, end_time, total_hours, reason) VALUES
(1, 1, '2026-04-15 10:00:00', '2026-04-15 13:30:00', 3.50, 'Calibration maintenance'),
(4, 2, '2026-04-30 09:00:00', '2026-04-30 14:00:00', 5.00, 'Oil replacement');

INSERT INTO recent_activities (message) VALUES
('System initialized with sample equipment'),
('Calibration completed for CNC Milling Machine'),
('Leak repair scheduled for Air Compressor'),
('Battery inspection reminder created for Diesel Generator');
