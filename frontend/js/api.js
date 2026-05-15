const API_BASE = "/api";

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("emms_user") || "null");
}

async function apiRequest(path, options = {}) {
  const user = getCurrentUser();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (user) {
    headers["x-user-id"] = user.user_id;
    headers["x-user-role"] = user.role;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}
