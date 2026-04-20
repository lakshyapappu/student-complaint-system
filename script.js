const API_BASE = "https://student-complaint-system-49er.onrender.com/api";
const page = document.body.dataset.page;

document.addEventListener("DOMContentLoaded", () => {
  initializePage();
});

function initializePage() {
  if (page === "login") {
    handleLoginPage();
  }

  if (page === "signup") {
    handleSignupPage();
  }

  if (page === "student-dashboard") {
    if (!requireRole("student")) {
      return;
    }
    renderStudentDashboard();
  }

  if (page === "register-complaint") {
    if (!requireRole("student")) {
      return;
    }
    handleComplaintRegistration();
  }

  if (page === "all-complaints") {
    if (!requireRole("student")) {
      return;
    }
    renderAllComplaints();
  }

  if (page === "history") {
    if (!requireRole("student")) {
      return;
    }
    renderComplaintHistory();
  }

  if (page === "admin-dashboard") {
    if (!requireRole("admin")) {
      return;
    }
    renderAdminDashboard();
  }

  if (page === "admin-complaints") {
    if (!requireRole("admin")) {
      return;
    }
    renderAdminComplaintsTable();
  }
}

function handleLoginPage() {
  const form = document.getElementById("loginForm");
  const message = document.getElementById("loginMessage");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("loginUsername").value.trim();
    const password = document.getElementById("loginPassword").value.trim();

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      localStorage.setItem("scmsUser", JSON.stringify(data.user));
      message.textContent = "Login successful. Redirecting...";

      if (data.user.role === "admin") {
        window.location.href = "admin-dashboard.html";
      } else {
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      message.textContent = error.message;
      message.style.color = "#b91c1c";
    }
  });
}

function handleSignupPage() {
  const form = document.getElementById("signupForm");
  const message = document.getElementById("signupMessage");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const username = document.getElementById("signupUsername").value.trim();
    const password = document.getElementById("signupPassword").value.trim();
    const role = document.getElementById("signupRole").value;

    try {
      const response = await fetch(`${API_BASE}/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      message.textContent = "Account created successfully. Please login.";
      message.style.color = "#15803d";
      form.reset();
    } catch (error) {
      message.textContent = error.message;
      message.style.color = "#b91c1c";
    }
  });
}

function handleComplaintRegistration() {
  const form = document.getElementById("complaintForm");
  const message = document.getElementById("complaintMessage");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const user = getCurrentUser();
    const category = document.getElementById("complaintCategory").value;
    const description = document.getElementById("complaintDescription").value.trim();

    try {
      const response = await fetch(`${API_BASE}/complaints`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          description,
          userId: user._id
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message);
      }

      message.textContent = data.message;
      message.style.color = "#15803d";
      form.reset();
    } catch (error) {
      message.textContent = error.message;
      message.style.color = "#b91c1c";
    }
  });
}

async function renderStudentDashboard() {
  const user = getCurrentUser();
  document.getElementById("studentGreeting").textContent = `Welcome, ${user.username}`;

  try {
    const complaints = await fetchUserComplaints(user._id);
    const pending = complaints.filter((item) => item.status === "Pending").length;
    const resolved = complaints.filter((item) => item.status === "Resolved").length;

    document.getElementById("studentTotalComplaints").textContent = complaints.length;
    document.getElementById("studentPendingComplaints").textContent = pending;
    document.getElementById("studentResolvedComplaints").textContent = resolved;

    const recentContainer = document.getElementById("studentRecentComplaints");
    if (!complaints.length) {
      recentContainer.innerHTML = `<div class="empty-state">No complaints submitted yet.</div>`;
      return;
    }

    recentContainer.innerHTML = complaints
      .slice(0, 3)
      .map((complaint) => createHistoryCard(complaint, false))
      .join("");
  } catch (error) {
    showSimpleError("studentRecentComplaints", error.message);
  }
}

async function renderAllComplaints() {
  const container = document.getElementById("complaintsList");

  try {
    const response = await fetch(`${API_BASE}/complaints`);
    const complaints = await response.json();
    if (!response.ok) {
      throw new Error(complaints.message || "Could not load complaints.");
    }

    if (!complaints.length) {
      container.innerHTML = `<div class="empty-state">No complaints available right now.</div>`;
      return;
    }

    container.innerHTML = complaints.map((complaint) => createComplaintCard(complaint)).join("");
  } catch (error) {
    showSimpleError("complaintsList", error.message);
  }
}

async function renderComplaintHistory() {
  const user = getCurrentUser();
  const container = document.getElementById("historyList");

  try {
    const complaints = await fetchUserComplaints(user._id);
    if (!complaints.length) {
      container.innerHTML = `<div class="empty-state">Your complaint history is empty.</div>`;
      return;
    }

    container.innerHTML = complaints
      .map((complaint) => createHistoryCard(complaint, true))
      .join("");
  } catch (error) {
    showSimpleError("historyList", error.message);
  }
}

async function renderAdminDashboard() {
  const user = getCurrentUser();
  document.getElementById("adminGreeting").textContent = `Welcome, ${user.username}`;

  try {
    const response = await fetch(`${API_BASE}/complaints`);
    const complaints = await response.json();
    if (!response.ok) {
      throw new Error(complaints.message || "Could not load complaints.");
    }

    document.getElementById("adminTotalComplaints").textContent = complaints.length;
    document.getElementById("adminPendingComplaints").textContent = complaints.filter(
      (item) => item.status === "Pending"
    ).length;
    document.getElementById("adminProcessingComplaints").textContent = complaints.filter(
      (item) => item.status === "Processing"
    ).length;
    document.getElementById("adminResolvedComplaints").textContent = complaints.filter(
      (item) => item.status === "Resolved"
    ).length;
  } catch (error) {
    console.error(error.message);
  }
}

async function renderAdminComplaintsTable() {
  const tableBody = document.getElementById("adminComplaintsTable");

  try {
    const response = await fetch(`${API_BASE}/complaints`);
    const complaints = await response.json();
    if (!response.ok) {
      throw new Error(complaints.message || "Could not load complaints.");
    }

    if (!complaints.length) {
      tableBody.innerHTML = `<tr><td colspan="7">No complaints found.</td></tr>`;
      return;
    }

    tableBody.innerHTML = complaints
      .map(
        (complaint) => `
          <tr>
            <td>${complaint._id}</td>
            <td><span class="pill">${getCategoryIcon(complaint.category)} ${escapeHtml(complaint.category)}</span></td>
            <td>${escapeHtml(complaint.description)}</td>
            <td>${complaint.votes}</td>
            <td>
              <select id="status-${complaint._id}">
                ${["Pending", "Processing", "Resolved", "Rejected"]
                  .map(
                    (status) =>
                      `<option value="${status}" ${complaint.status === status ? "selected" : ""}>${status}</option>`
                  )
                  .join("")}
              </select>
            </td>
            <td>
              <input
                id="remarks-${complaint._id}"
                class="remarks-input"
                type="text"
                placeholder="Add remarks"
                value="${escapeAttribute(complaint.remarks || "")}"
              />
            </td>
            <td>
              <button class="btn btn-primary btn-small" onclick="updateComplaintStatus('${complaint._id}')">
                Update
              </button>
            </td>
          </tr>
        `
      )
      .join("");
  } catch (error) {
    tableBody.innerHTML = `<tr><td colspan="7">${error.message}</td></tr>`;
  }
}

async function voteComplaint(complaintId, value) {
  try {
    const response = await fetch(`${API_BASE}/complaints/${complaintId}/vote`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    renderAllComplaints();
  } catch (error) {
    alert(error.message);
  }
}

async function updateComplaintStatus(complaintId) {
  const status = document.getElementById(`status-${complaintId}`).value;
  const remarks = document.getElementById(`remarks-${complaintId}`).value.trim();

  try {
    const response = await fetch(`${API_BASE}/complaints/${complaintId}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, remarks })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    alert("Complaint updated successfully.");
    renderAdminComplaintsTable();
  } catch (error) {
    alert(error.message);
  }
}

async function withdrawComplaint(complaintId) {
  const confirmed = window.confirm("Do you want to withdraw this complaint?");
  if (!confirmed) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE}/complaints/${complaintId}`, {
      method: "DELETE"
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message);
    }

    renderComplaintHistory();
  } catch (error) {
    alert(error.message);
  }
}

async function fetchUserComplaints(userId) {
  const response = await fetch(`${API_BASE}/complaints/user/${userId}`);
  const complaints = await response.json();

  if (!response.ok) {
    throw new Error(complaints.message || "Could not fetch user complaints.");
  }

  return complaints;
}

function createComplaintCard(complaint) {
  return `
    <article class="complaint-item">
      <div class="complaint-card-head">
        <span class="category-icon">${getCategoryIcon(complaint.category)}</span>
        <span class="pill">${escapeHtml(complaint.category)}</span>
      </div>
      <h3>${escapeHtml(complaint.description)}</h3>
      <div class="meta-row">
        <span class="status-pill status-${complaint.status.toLowerCase()}">Status: ${complaint.status}</span>
        <span class="status-pill">Votes: ${complaint.votes}</span>
      </div>
      <p><strong>Remarks:</strong> ${escapeHtml(complaint.remarks || "No remarks yet.")}</p>
      <div class="vote-row">
        <button class="btn btn-primary btn-small" onclick="voteComplaint('${complaint._id}', 1)">&#128077; Upvote</button>
        <button class="btn btn-danger btn-small" onclick="voteComplaint('${complaint._id}', -1)">&#128078; Downvote</button>
      </div>
    </article>
  `;
}

function createHistoryCard(complaint, allowWithdraw) {
  return `
    <article class="list-item">
      <div class="complaint-card-head">
        <span class="category-icon">${getCategoryIcon(complaint.category)}</span>
        <span class="pill">${escapeHtml(complaint.category)}</span>
      </div>
      <h3>${escapeHtml(complaint.description)}</h3>
      <div class="meta-row">
        <span class="status-pill status-${complaint.status.toLowerCase()}">Status: ${complaint.status}</span>
        <span class="status-pill">Votes: ${complaint.votes}</span>
      </div>
      <p><strong>Remarks:</strong> ${escapeHtml(complaint.remarks || "No remarks yet.")}</p>
      ${
        allowWithdraw
          ? `<div class="action-row"><button class="btn btn-danger btn-small" onclick="withdrawComplaint('${complaint._id}')">Withdraw Complaint</button></div>`
          : ""
      }
    </article>
  `;
}

function getCategoryIcon(category) {
  const normalizedCategory = String(category || "").toLowerCase();

  if (normalizedCategory.includes("mess")) {
    return "&#127860;";
  }

  if (normalizedCategory.includes("hostel")) {
    return "&#127968;";
  }

  if (normalizedCategory.includes("academic")) {
    return "&#127891;";
  }

  if (normalizedCategory.includes("transport")) {
    return "&#128652;";
  }

  if (normalizedCategory.includes("infrastructure")) {
    return "&#127970;";
  }

  return "&#128172;";
}

function getCurrentUser() {
  const user = localStorage.getItem("scmsUser");
  return user ? JSON.parse(user) : null;
}

function requireRole(role) {
  const user = getCurrentUser();

  if (!user) {
    window.location.href = "/frontend/login.html";
    return false;
  }

  if (user.role !== role) {
    if (user.role === "admin") {
      window.location.href = "/frontend/admin-dashboard.html";
    } else {
      window.location.href = "/frontend/dashboard.html";
    }
    return false;
  }

  return true;
}

function logout() {
  localStorage.removeItem("scmsUser");
  window.location.href = "/frontend/login.html";
}

function showSimpleError(elementId, message) {
  const element = document.getElementById(elementId);
  element.innerHTML = `<div class="empty-state">${escapeHtml(message)}</div>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}
