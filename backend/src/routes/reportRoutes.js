const express = require("express");
const pool = require("../config/db");
const { requireLogin, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/monthly", requireLogin, allowRoles("Admin", "Supervisor"), async (req, res) => {
  try {
    const year = Number(req.query.year) || new Date().getFullYear();
    const month = Number(req.query.month) || new Date().getMonth() + 1;

    const [rows] = await pool.query("CALL GenerateMonthlyMaintenanceReport(?, ?)", [
      year,
      month
    ]);

    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ message: "Unable to generate report", error: error.message });
  }
});

module.exports = router;
