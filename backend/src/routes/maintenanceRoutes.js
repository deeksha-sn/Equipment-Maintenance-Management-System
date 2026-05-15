const express = require("express");
const pool = require("../config/db");
const { requireLogin, allowRoles } = require("../middleware/auth");

const router = express.Router();

function addDays(dateValue, days) {
  const date = new Date(dateValue);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

router.get("/schedules", requireLogin, async (req, res) => {
  try {
    const [schedules] = await pool.query(
      `SELECT ms.*, e.equipment_name, u.full_name AS technician_name
       FROM maintenance_schedules ms
       JOIN equipment e ON e.equipment_id = ms.equipment_id
       LEFT JOIN users u ON u.user_id = ms.technician_id
       ORDER BY ms.scheduled_date DESC`
    );
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: "Unable to load schedules", error: error.message });
  }
});

router.post("/schedules", requireLogin, allowRoles("Admin", "Supervisor"), async (req, res) => {
  try {
    const {
      equipment_id,
      technician_id,
      scheduled_date,
      maintenance_type,
      interval_days,
      priority,
      notes
    } = req.body;

    const next_service_date = addDays(scheduled_date, interval_days);

    const [result] = await pool.query(
      `INSERT INTO maintenance_schedules
       (equipment_id, technician_id, scheduled_date, next_service_date, maintenance_type,
        interval_days, priority, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending', ?)`,
      [
        equipment_id,
        technician_id || null,
        scheduled_date,
        next_service_date,
        maintenance_type,
        interval_days,
        priority || "Medium",
        notes || null
      ]
    );

    await pool.query("INSERT INTO service_reminders (equipment_id, schedule_id, reminder_date, type, status) VALUES (?, ?, ?, 'Upcoming', 'Upcoming')", [
      equipment_id,
      result.insertId,
      scheduled_date
    ]);
    await pool.query("INSERT INTO recent_activities (message) VALUES (?)", [
      `Maintenance scheduled for equipment ID ${equipment_id}`
    ]);

    res.status(201).json({
      message: "Maintenance schedule created",
      schedule_id: result.insertId,
      next_service_date
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to create schedule", error: error.message });
  }
});

router.put("/schedules/:id/status", requireLogin, allowRoles("Admin", "Supervisor", "Technician"), async (req, res) => {
  try {
    await pool.query("UPDATE maintenance_schedules SET status = ? WHERE schedule_id = ?", [
      req.body.status,
      req.params.id
    ]);

    res.json({ message: "Schedule status updated" });
  } catch (error) {
    res.status(500).json({ message: "Unable to update schedule", error: error.message });
  }
});

router.get("/history", requireLogin, async (req, res) => {
  try {
    const [history] = await pool.query(
      `SELECT mh.*, e.equipment_name, u.full_name AS technician_name
       FROM maintenance_history mh
       JOIN equipment e ON e.equipment_id = mh.equipment_id
       LEFT JOIN users u ON u.user_id = mh.technician_id
       ORDER BY mh.completed_date DESC`
    );
    res.json(history);
  } catch (error) {
    res.status(500).json({ message: "Unable to load history", error: error.message });
  }
});

router.post("/history", requireLogin, allowRoles("Admin", "Supervisor", "Technician"), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const {
      schedule_id,
      equipment_id,
      technician_id,
      completed_date,
      maintenance_type,
      notes,
      cost,
      downtime_hours
    } = req.body;

    await connection.beginTransaction();

    const [result] = await connection.query(
      `INSERT INTO maintenance_history
       (schedule_id, equipment_id, technician_id, completed_date, maintenance_type, notes, cost, downtime_hours)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        schedule_id || null,
        equipment_id,
        technician_id || req.user.userId,
        completed_date,
        maintenance_type,
        notes || null,
        cost || 0,
        downtime_hours || 0
      ]
    );

    if (schedule_id) {
      await connection.query("UPDATE maintenance_schedules SET status = 'Completed' WHERE schedule_id = ?", [
        schedule_id
      ]);
    }

    await connection.query(
      `INSERT INTO maintenance_costs (history_id, equipment_id, amount, cost_date, description)
       VALUES (?, ?, ?, ?, ?)`,
      [result.insertId, equipment_id, cost || 0, completed_date, notes || "Maintenance cost"]
    );

    await connection.query(
      `INSERT INTO equipment_downtime (equipment_id, history_id, start_time, end_time, total_hours, reason)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        equipment_id,
        result.insertId,
        `${completed_date} 09:00:00`,
        `${completed_date} 17:00:00`,
        downtime_hours || 0,
        notes || "Maintenance downtime"
      ]
    );

    await connection.query("UPDATE equipment SET status = 'Active' WHERE equipment_id = ?", [equipment_id]);
    await connection.query("INSERT INTO recent_activities (message) VALUES (?)", [
      `Maintenance completed for equipment ID ${equipment_id}`
    ]);

    await connection.commit();
    res.status(201).json({ message: "Maintenance history recorded", history_id: result.insertId });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ message: "Unable to record maintenance", error: error.message });
  } finally {
    connection.release();
  }
});

router.get("/reminders", requireLogin, async (req, res) => {
  try {
    await pool.query(
      `UPDATE service_reminders
       SET status = 'Overdue', type = 'Overdue'
       WHERE reminder_date < CURDATE() AND status <> 'Completed'`
    );

    const [reminders] = await pool.query(
      `SELECT sr.*, e.equipment_name
       FROM service_reminders sr
       JOIN equipment e ON e.equipment_id = sr.equipment_id
       ORDER BY sr.reminder_date ASC`
    );
    res.json(reminders);
  } catch (error) {
    res.status(500).json({ message: "Unable to load reminders", error: error.message });
  }
});

router.get("/costs", requireLogin, async (req, res) => {
  try {
    const [costs] = await pool.query(
      `SELECT mc.*, e.equipment_name
       FROM maintenance_costs mc
       JOIN equipment e ON e.equipment_id = mc.equipment_id
       ORDER BY mc.cost_date DESC`
    );
    res.json(costs);
  } catch (error) {
    res.status(500).json({ message: "Unable to load costs", error: error.message });
  }
});

router.get("/downtime", requireLogin, async (req, res) => {
  try {
    const [downtime] = await pool.query(
      `SELECT ed.*, e.equipment_name
       FROM equipment_downtime ed
       JOIN equipment e ON e.equipment_id = ed.equipment_id
       ORDER BY ed.start_time DESC`
    );
    res.json(downtime);
  } catch (error) {
    res.status(500).json({ message: "Unable to load downtime", error: error.message });
  }
});

module.exports = router;
