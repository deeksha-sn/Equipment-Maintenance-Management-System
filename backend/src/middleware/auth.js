// Simple role-check middleware for DBMS mini-project demos.
// The frontend sends x-user-id and x-user-role after login.
function requireLogin(req, res, next) {
  const userId = req.headers["x-user-id"];
  const role = req.headers["x-user-role"];

  if (!userId || !role) {
    return res.status(401).json({ message: "Login required" });
  }

  req.user = {
    userId: Number(userId),
    role
  };

  next();
}

function allowRoles(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied for this role" });
    }

    next();
  };
}

module.exports = { requireLogin, allowRoles };
