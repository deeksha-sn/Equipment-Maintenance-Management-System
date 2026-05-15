const express = require("express");
const pool = require("../config/db");
const { requireLogin, allowRoles } = require("../middleware/auth");

const router = express.Router();

router.get("/", requireLogin, async (req, res) => {
  try {
    const search = `%${req.query.search || ""}%`;
    const [equipment] = await pool.query(
      `SELECT *
       FROM equipment
       WHERE equipment_name LIKE ?
          OR serial_number LIKE ?
          OR category LIKE ?
          OR location LIKE ?
       ORDER BY equipment_id DESC`,
      [search, search, search, search]
    );

    res.json(equipment);
  } catch (error) {
    res.status(500).json({ message: "Unable to load equipment", error: error.message });
  }
});

router.post("/", requireLogin, allowRoles("Admin", "Supervisor"), async (req, res) => {
  try {
    const {
      equipment_name,
      category,
      serial_number,
      location,
      purchase_date,
      status,
      service_interval_days
    } = req.body;

    const [result] = await pool.query(
      `INSERT INTO equipment
       (equipment_name, category, serial_number, location, purchase_date, status, service_interval_days)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        equipment_name,
        category,
        serial_number,
        location,
        purchase_date,
        status || "Active",
        service_interval_days || 90
      ]
    );

    await pool.query("INSERT INTO recent_activities (message) VALUES (?)", [
      `Equipment added: ${equipment_name}`
    ]);

    res.status(201).json({ message: "Equipment added", equipment_id: result.insertId });
  } catch (error) {
    res.status(500).json({ message: "Unable to add equipment", error: error.message });
  }
});

router.put("/:id", requireLogin, allowRoles("Admin", "Supervisor"), async (req, res) => {
  try {
    const {
      equipment_name,
      category,
      serial_number,
      location,
      purchase_date,
      status,
      service_interval_days
    } = req.body;

    await pool.query(
      `UPDATE equipment
       SET equipment_name = ?, category = ?, serial_number = ?, location = ?,
           purchase_date = ?, status = ?, service_interval_days = ?
       WHERE equipment_id = ?`,
      [
        equipment_name,
        category,
        serial_number,
        location,
        purchase_date,
        status,
        service_interval_days,
        req.params.id
      ]
    );

    await pool.query("INSERT INTO recent_activities (message) VALUES (?)", [
      `Equipment updated: ${equipment_name}`
    ]);

    res.json({ message: "Equipment updated" });
  } catch (error) {
    res.status(500).json({ message: "Unable to update equipment", error: error.message });
  }
});

router.delete("/:id", requireLogin, allowRoles("Admin"), async (req, res) => {
  try {
    await pool.query("DELETE FROM equipment WHERE equipment_id = ?", [req.params.id]);
    await pool.query("INSERT INTO recent_activities (message) VALUES (?)", [
      `Equipment deleted with ID ${req.params.id}`
    ]);

    res.json({ message: "Equipment deleted" });
  } catch (error) {
    res.status(500).json({ message: "Unable to delete equipment", error: error.message });
  }
});

router.get("/parts/list", requireLogin, async (req, res) => {
  try {
    const [parts] = await pool.query(
      `SELECT ep.*, e.equipment_name
       FROM equipment_parts ep
       JOIN equipment e ON e.equipment_id = ep.equipment_id
       ORDER BY ep.part_id DESC`
    );
    res.json(parts);
  } catch (error) {
    res.status(500).json({ message: "Unable to load parts", error: error.message });
  }
});

module.exports = router;
