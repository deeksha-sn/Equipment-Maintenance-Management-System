const express = require("express");
const pool = require("../config/db");
const { requireLogin } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
  try {
    const [[equipmentCount]] = await pool.query("SELECT COUNT(*) AS total FROM equipment");
    const [[pendingCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM maintenance_schedules WHERE status = 'Pending'"
    );
    const [[underMaintenanceCount]] = await pool.query(
      "SELECT COUNT(*) AS total FROM equipment WHERE status = 'Under Maintenance'"
    );
    const [activities] = await pool.query(
      "SELECT activity_id, message, created_at FROM recent_activities ORDER BY created_at DESC LIMIT 8"
    );
    const [reminders] = await pool.query(
      `SELECT sr.reminder_id, e.equipment_name, sr.reminder_date, sr.type, sr.status
       FROM service_reminders sr
       JOIN equipment e ON e.equipment_id = sr.equipment_id
       WHERE sr.status IN ('Upcoming', 'Overdue')
       ORDER BY sr.reminder_date ASC
       LIMIT 8`
    );

    res.json({
      totalEquipment: equipmentCount.total,
      pendingMaintenance: pendingCount.total,
      underMaintenance: underMaintenanceCount.total,
      recentActivities: activities,
      reminders
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to load dashboard", error: error.message });
  }
});

module.exports = router;
