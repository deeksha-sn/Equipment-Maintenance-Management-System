const express = require("express");
const pool = require("../config/db");

const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const [users] = await pool.query(
      "SELECT user_id, full_name, username, role, email FROM users WHERE username = ? AND password = ?",
      [username, password]
    );

    if (users.length === 0) {
      return res.status(401).json({ message: "Invalid username or password" });
    }

    res.json({ message: "Login successful", user: users[0] });
  } catch (error) {
    res.status(500).json({ message: "Login failed", error: error.message });
  }
});

router.get("/technicians", async (req, res) => {
  try {
    const [technicians] = await pool.query(
      "SELECT user_id, full_name, email FROM users WHERE role = 'Technician' ORDER BY full_name"
    );
    res.json(technicians);
  } catch (error) {
    res.status(500).json({ message: "Unable to load technicians", error: error.message });
  }
});

module.exports = router;
