const state = {
  equipment: [],
  schedules: [],
  technicians: []
};

const pageTitles = {
  dashboard: "Dashboard",
  equipment: "Equipment Management",
  schedule: "Maintenance Schedule",
  history: "Maintenance History",
  reports: "Reports"
};

document.addEventListener("DOMContentLoaded", () => {
  bindAuth();
  bindNavigation();

  const user = getCurrentUser();
  if (user) {
    showApp(user);
  }
});

function bindAuth() {
  document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = document.getElementById("loginMessage");
    message.textContent = "";

    try {
      const data = await apiRequest("/auth/login", {
        method: "POST",
        body: JSON.stringify({
          username: document.getElementById("loginUsername").value,
          password: document.getElementById("loginPassword").value
        })
      });

      localStorage.setItem("emms_user", JSON.stringify(data.user));
      showApp(data.user);
    } catch (error) {
      message.textContent = error.message;
    }
  });

  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("emms_user");
    document.getElementById("loginPage").classList.remove("hidden");
    document.getElementById("appPage").classList.add("hidden");
  });
}

function bindNavigation() {
  document.querySelectorAll(".nav-link").forEach((button) => {
    button.addEventListener("click", () => {
      const page = button.dataset.page;
      document.querySelectorAll(".nav-link").forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      document.querySelectorAll(".page").forEach((item) => item.classList.remove("active"));
      document.getElementById(page).classList.add("active");
      document.getElementById("pageTitle").textContent = pageTitles[page];
      renderPage(page);
    });
  });
}

function showApp(user) {
  document.getElementById("loginPage").classList.add("hidden");
  document.getElementById("appPage").classList.remove("hidden");
  document.getElementById("roleBadge").textContent = user.role;
  document.getElementById("userChip").textContent = `${user.full_name} (${user.role})`;
  renderPage("dashboard");
}

async function renderPage(page) {
  if (page === "dashboard") await renderDashboard();
  if (page === "equipment") await renderEquipment();
  if (page === "schedule") await renderSchedule();
  if (page === "history") await renderHistory();
  if (page === "reports") await renderReports();
}

function badge(value) {
  const firstClass = String(value).split(" ")[0];
  return `<span class="badge ${firstClass}">${value}</span>`;
}

function formatDate(value) {
  return value ? String(value).slice(0, 10) : "-";
}

function canManageEquipment() {
  const role = getCurrentUser()?.role;
  return role === "Admin" || role === "Supervisor";
}

async function loadBaseData() {
  const [equipment, technicians, schedules] = await Promise.all([
    apiRequest("/equipment"),
    apiRequest("/auth/technicians"),
    apiRequest("/maintenance/schedules")
  ]);

  state.equipment = equipment;
  state.technicians = technicians;
  state.schedules = schedules;
}

async function renderDashboard() {
  const page = document.getElementById("dashboard");
  page.innerHTML = "<p>Loading dashboard...</p>";

  try {
    const data = await apiRequest("/dashboard");
    page.innerHTML = `
      <div class="stats-grid">
        <article class="card">
          <p class="eyebrow">Total Equipment</p>
          <p class="stat-value">${data.totalEquipment}</p>
        </article>
        <article class="card">
          <p class="eyebrow">Pending Maintenance</p>
          <p class="stat-value">${data.pendingMaintenance}</p>
        </article>
        <article class="card">
          <p class="eyebrow">Under Maintenance</p>
          <p class="stat-value">${data.underMaintenance}</p>
        </article>
      </div>
      <div class="grid-2">
        <article class="card">
          <h3 class="section-title">Recent Activities</h3>
          <ul class="list">
            ${data.recentActivities.map((item) => `<li>${item.message}<br><small>${formatDate(item.created_at)}</small></li>`).join("") || "<li>No activities found.</li>"}
          </ul>
        </article>
        <article class="card">
          <h3 class="section-title">Service Alerts</h3>
          <ul class="list">
            ${data.reminders.map((item) => `<li><strong>${item.equipment_name}</strong> ${badge(item.status)}<br><small>${formatDate(item.reminder_date)}</small></li>`).join("") || "<li>No reminders found.</li>"}
          </ul>
        </article>
      </div>
    `;
  } catch (error) {
    page.innerHTML = `<p class="message">${error.message}</p>`;
  }
}

async function renderEquipment(search = "") {
  const page = document.getElementById("equipment");
  page.innerHTML = "<p>Loading equipment...</p>";

  try {
    state.equipment = await apiRequest(`/equipment?search=${encodeURIComponent(search)}`);
    const disabled = canManageEquipment() ? "" : "disabled";

    page.innerHTML = `
      <div class="grid-2">
        <article class="card">
          <h3 class="section-title">Add or Edit Equipment</h3>
          <form id="equipmentForm" class="form">
            <input type="hidden" id="equipmentId">
            <label>Equipment Name<input id="equipmentName" required></label>
            <div class="grid-2">
              <label>Category<input id="equipmentCategory" required></label>
              <label>Serial Number<input id="serialNumber" required></label>
            </div>
            <label>Location<input id="location" required></label>
            <div class="grid-2">
              <label>Purchase Date<input id="purchaseDate" type="date" required></label>
              <label>Status
                <select id="equipmentStatus">
                  <option>Active</option>
                  <option>Under Maintenance</option>
                  <option>Retired</option>
                </select>
              </label>
            </div>
            <label>Service Interval Days<input id="serviceInterval" type="number" min="1" value="90" required></label>
            <button ${disabled} type="submit">${canManageEquipment() ? "Save Equipment" : "Only Admin/Supervisor Can Save"}</button>
          </form>
        </article>
        <article class="card">
          <div class="toolbar">
            <h3 class="section-title">Search Equipment</h3>
            <input id="equipmentSearch" value="${search}" placeholder="Search by name, category, serial number">
          </div>
        </article>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr>
              <th>Name</th><th>Category</th><th>Serial</th><th>Location</th><th>Status</th><th>Interval</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${state.equipment.map((item) => `
              <tr>
                <td>${item.equipment_name}</td>
                <td>${item.category}</td>
                <td>${item.serial_number}</td>
                <td>${item.location}</td>
                <td>${badge(item.status)}</td>
                <td>${item.service_interval_days} days</td>
                <td>
                  <div class="action-row">
                    <button class="small-button" onclick="editEquipment(${item.equipment_id})">Edit</button>
                    <button class="small-button danger-button" onclick="deleteEquipment(${item.equipment_id})">Delete</button>
                  </div>
                </td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("equipmentSearch").addEventListener("input", (event) => {
      renderEquipment(event.target.value);
    });
    document.getElementById("equipmentForm").addEventListener("submit", saveEquipment);
  } catch (error) {
    page.innerHTML = `<p class="message">${error.message}</p>`;
  }
}

window.editEquipment = function editEquipment(id) {
  const item = state.equipment.find((equipment) => equipment.equipment_id === id);
  if (!item) return;

  document.getElementById("equipmentId").value = item.equipment_id;
  document.getElementById("equipmentName").value = item.equipment_name;
  document.getElementById("equipmentCategory").value = item.category;
  document.getElementById("serialNumber").value = item.serial_number;
  document.getElementById("location").value = item.location;
  document.getElementById("purchaseDate").value = formatDate(item.purchase_date);
  document.getElementById("equipmentStatus").value = item.status;
  document.getElementById("serviceInterval").value = item.service_interval_days;
};

async function saveEquipment(event) {
  event.preventDefault();
  const id = document.getElementById("equipmentId").value;
  const payload = {
    equipment_name: document.getElementById("equipmentName").value,
    category: document.getElementById("equipmentCategory").value,
    serial_number: document.getElementById("serialNumber").value,
    location: document.getElementById("location").value,
    purchase_date: document.getElementById("purchaseDate").value,
    status: document.getElementById("equipmentStatus").value,
    service_interval_days: Number(document.getElementById("serviceInterval").value)
  };

  await apiRequest(id ? `/equipment/${id}` : "/equipment", {
    method: id ? "PUT" : "POST",
    body: JSON.stringify(payload)
  });

  renderEquipment();
}

window.deleteEquipment = async function deleteEquipment(id) {
  if (!confirm("Delete this equipment?")) return;
  await apiRequest(`/equipment/${id}`, { method: "DELETE" });
  renderEquipment();
};

async function renderSchedule() {
  const page = document.getElementById("schedule");
  page.innerHTML = "<p>Loading schedules...</p>";

  try {
    await loadBaseData();
    page.innerHTML = `
      <div class="grid-2">
        <article class="card">
          <h3 class="section-title">Create Maintenance Schedule</h3>
          <form id="scheduleForm" class="form">
            <label>Equipment
              <select id="scheduleEquipment" required>${state.equipment.map((item) => `<option value="${item.equipment_id}">${item.equipment_name}</option>`).join("")}</select>
            </label>
            <label>Technician
              <select id="scheduleTechnician">${state.technicians.map((item) => `<option value="${item.user_id}">${item.full_name}</option>`).join("")}</select>
            </label>
            <div class="grid-2">
              <label>Scheduled Date<input id="scheduledDate" type="date" required></label>
              <label>Interval Days<input id="intervalDays" type="number" min="1" value="60" required></label>
            </div>
            <div class="grid-2">
              <label>Type<input id="maintenanceType" value="Preventive Service" required></label>
              <label>Priority
                <select id="priority"><option>Low</option><option selected>Medium</option><option>High</option></select>
              </label>
            </div>
            <label>Notes<textarea id="scheduleNotes"></textarea></label>
            <button type="submit">Create Schedule</button>
          </form>
        </article>
        <article class="card">
          <h3 class="section-title">Service Reminders</h3>
          <ul id="reminderList" class="list"></ul>
        </article>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr><th>Equipment</th><th>Technician</th><th>Date</th><th>Next Service</th><th>Type</th><th>Priority</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${state.schedules.map((item) => `
              <tr>
                <td>${item.equipment_name}</td>
                <td>${item.technician_name || "-"}</td>
                <td>${formatDate(item.scheduled_date)}</td>
                <td>${formatDate(item.next_service_date)}</td>
                <td>${item.maintenance_type}</td>
                <td>${badge(item.priority)}</td>
                <td>${badge(item.status)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;

    document.getElementById("scheduleForm").addEventListener("submit", saveSchedule);
    renderReminders();
  } catch (error) {
    page.innerHTML = `<p class="message">${error.message}</p>`;
  }
}

async function saveSchedule(event) {
  event.preventDefault();
  await apiRequest("/maintenance/schedules", {
    method: "POST",
    body: JSON.stringify({
      equipment_id: Number(document.getElementById("scheduleEquipment").value),
      technician_id: Number(document.getElementById("scheduleTechnician").value),
      scheduled_date: document.getElementById("scheduledDate").value,
      maintenance_type: document.getElementById("maintenanceType").value,
      interval_days: Number(document.getElementById("intervalDays").value),
      priority: document.getElementById("priority").value,
      notes: document.getElementById("scheduleNotes").value
    })
  });

  renderSchedule();
}

async function renderReminders() {
  const reminders = await apiRequest("/maintenance/reminders");
  document.getElementById("reminderList").innerHTML = reminders
    .map((item) => `<li><strong>${item.equipment_name}</strong> ${badge(item.status)}<br><small>${formatDate(item.reminder_date)}</small></li>`)
    .join("") || "<li>No service reminders found.</li>";
}

async function renderHistory() {
  const page = document.getElementById("history");
  page.innerHTML = "<p>Loading history...</p>";

  try {
    await loadBaseData();
    const [history, costs, downtime] = await Promise.all([
      apiRequest("/maintenance/history"),
      apiRequest("/maintenance/costs"),
      apiRequest("/maintenance/downtime")
    ]);

    page.innerHTML = `
      <div class="grid-2">
        <article class="card">
          <h3 class="section-title">Record Completed Maintenance</h3>
          <form id="historyForm" class="form">
            <label>Schedule
              <select id="historySchedule">
                <option value="">No schedule</option>
                ${state.schedules.map((item) => `<option value="${item.schedule_id}" data-equipment="${item.equipment_id}" data-type="${item.maintenance_type}">${item.equipment_name} - ${formatDate(item.scheduled_date)}</option>`).join("")}
              </select>
            </label>
            <label>Equipment
              <select id="historyEquipment" required>${state.equipment.map((item) => `<option value="${item.equipment_id}">${item.equipment_name}</option>`).join("")}</select>
            </label>
            <label>Technician
              <select id="historyTechnician">${state.technicians.map((item) => `<option value="${item.user_id}">${item.full_name}</option>`).join("")}</select>
            </label>
            <div class="grid-3">
              <label>Completed Date<input id="completedDate" type="date" required></label>
              <label>Cost<input id="maintenanceCost" type="number" min="0" step="0.01" value="0"></label>
              <label>Downtime Hours<input id="downtimeHours" type="number" min="0" step="0.25" value="0"></label>
            </div>
            <label>Type<input id="historyType" value="Preventive Service" required></label>
            <label>Notes<textarea id="historyNotes"></textarea></label>
            <button type="submit">Record Maintenance</button>
          </form>
        </article>
        <article class="card">
          <h3 class="section-title">Cost Tracking</h3>
          <ul class="list">
            ${costs.map((item) => `<li><strong>${item.equipment_name}</strong><br>Rs. ${Number(item.amount).toFixed(2)} on ${formatDate(item.cost_date)}</li>`).join("") || "<li>No costs recorded.</li>"}
          </ul>
        </article>
      </div>
      <div class="table-card">
        <table>
          <thead>
            <tr><th>Equipment</th><th>Technician</th><th>Date</th><th>Type</th><th>Notes</th><th>Cost</th><th>Downtime</th></tr>
          </thead>
          <tbody>
            ${history.map((item) => `
              <tr>
                <td>${item.equipment_name}</td>
                <td>${item.technician_name || "-"}</td>
                <td>${formatDate(item.completed_date)}</td>
                <td>${item.maintenance_type}</td>
                <td>${item.notes || "-"}</td>
                <td>Rs. ${Number(item.cost).toFixed(2)}</td>
                <td>${item.downtime_hours} hrs</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
      <article class="card">
        <h3 class="section-title">Downtime Tracking</h3>
        <ul class="list">
          ${downtime.map((item) => `<li><strong>${item.equipment_name}</strong>: ${item.total_hours} hrs, ${item.reason || "Maintenance"} (${String(item.start_time).slice(0, 16)})</li>`).join("") || "<li>No downtime records.</li>"}
        </ul>
      </article>
    `;

    document.getElementById("historySchedule").addEventListener("change", fillScheduleDetails);
    document.getElementById("historyForm").addEventListener("submit", saveHistory);
  } catch (error) {
    page.innerHTML = `<p class="message">${error.message}</p>`;
  }
}

function fillScheduleDetails(event) {
  const selected = event.target.selectedOptions[0];
  if (!selected || !selected.value) return;

  document.getElementById("historyEquipment").value = selected.dataset.equipment;
  document.getElementById("historyType").value = selected.dataset.type;
}

async function saveHistory(event) {
  event.preventDefault();
  await apiRequest("/maintenance/history", {
    method: "POST",
    body: JSON.stringify({
      schedule_id: document.getElementById("historySchedule").value || null,
      equipment_id: Number(document.getElementById("historyEquipment").value),
      technician_id: Number(document.getElementById("historyTechnician").value),
      completed_date: document.getElementById("completedDate").value,
      maintenance_type: document.getElementById("historyType").value,
      notes: document.getElementById("historyNotes").value,
      cost: Number(document.getElementById("maintenanceCost").value),
      downtime_hours: Number(document.getElementById("downtimeHours").value)
    })
  });

  renderHistory();
}

async function renderReports() {
  const page = document.getElementById("reports");
  const today = new Date();

  page.innerHTML = `
    <article class="card">
      <h3 class="section-title">Monthly Maintenance Report</h3>
      <form id="reportForm" class="form">
        <div class="grid-3">
          <label>Year<input id="reportYear" type="number" value="${today.getFullYear()}"></label>
          <label>Month<input id="reportMonth" type="number" min="1" max="12" value="${today.getMonth() + 1}"></label>
          <label>&nbsp;<button type="submit">Generate Report</button></label>
        </div>
      </form>
    </article>
    <div id="reportResult"></div>
  `;

  document.getElementById("reportForm").addEventListener("submit", generateReport);
}

async function generateReport(event) {
  event.preventDefault();
  const year = document.getElementById("reportYear").value;
  const month = document.getElementById("reportMonth").value;
  const result = document.getElementById("reportResult");
  result.innerHTML = "<p>Generating report...</p>";

  try {
    const rows = await apiRequest(`/reports/monthly?year=${year}&month=${month}`);
    result.innerHTML = `
      <div class="table-card">
        <table>
          <thead>
            <tr><th>Equipment</th><th>Category</th><th>Completed Jobs</th><th>Total Cost</th><th>Total Downtime</th></tr>
          </thead>
          <tbody>
            ${rows.map((item) => `
              <tr>
                <td>${item.equipment_name}</td>
                <td>${item.category}</td>
                <td>${item.completed_jobs}</td>
                <td>Rs. ${Number(item.total_maintenance_cost).toFixed(2)}</td>
                <td>${Number(item.total_downtime_hours).toFixed(2)} hrs</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
  } catch (error) {
    result.innerHTML = `<p class="message">${error.message}</p>`;
  }
}
