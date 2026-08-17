/**
 * extension/popup.js
 *
 * Popup UI logic. Talks only to the local Flask backend.
 * Session token is kept in chrome.storage.local (not the master password itself).
 */

const API_BASE = "http://127.0.0.1:5000/api";

const screens = {
  setup: document.getElementById("setupScreen"),
  unlock: document.getElementById("unlockScreen"),
  savePrompt: document.getElementById("savePromptScreen"),
  dashboard: document.getElementById("dashboardScreen"),
  add: document.getElementById("addScreen"),
};

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.add("hidden"));
  screens[name].classList.remove("hidden");
}

async function getToken() {
  const data = await chrome.storage.local.get("sessionToken");
  return data.sessionToken || null;
}

async function setToken(token) {
  await chrome.storage.local.set({ sessionToken: token });
}

async function clearToken() {
  await chrome.storage.local.remove("sessionToken");
}

async function apiFetch(path, options = {}) {
  const token = await getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["X-Session-Token"] = token;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

let pendingCredential = null;

async function checkPendingCredential() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_PENDING_CREDENTIAL" }, (res) => {
      resolve(res ? res.pending : null);
    });
  });
}

async function init() {
  const health = await apiFetch("/health");
  if (!health.ok) {
    document.body.innerHTML = "<p class='error'>Backend not running. Start app.py first.</p>";
    return;
  }

  const pending = await checkPendingCredential();
  if (pending) {
    pendingCredential = pending;
    document.getElementById("promptWebsite").textContent = pending.website;
    document.getElementById("promptUsername").textContent = pending.username;
    showScreen("savePrompt");
    return;
  }

  const token = await getToken();
  if (token) {
    const check = await apiFetch("/verify-session", { method: "POST" });
    if (check.ok) {
      showScreen("dashboard");
      loadCredentials();
      return;
    }
    await clearToken();
  }

  const status = await apiFetch("/setup-status");
  if (status.ok && !status.data.setup_complete) {
    showScreen("setup");
  } else {
    showScreen("unlock");
  }
}

document.getElementById("savePasswordBtn").addEventListener("click", async () => {
  const errEl = document.getElementById("saveError");
  errEl.textContent = "";

  if (!pendingCredential) return;

  const token = await getToken();
  if (!token) {
    errEl.textContent = "Unlock the vault first, then try saving again.";
    return;
  }

  const res = await apiFetch("/credentials", {
    method: "POST",
    body: JSON.stringify(pendingCredential),
  });

  if (!res.ok) {
    errEl.textContent = res.data.error || "Failed to save.";
    return;
  }

  chrome.runtime.sendMessage({ type: "CLEAR_PENDING_CREDENTIAL" });
  pendingCredential = null;
  showScreen("dashboard");
  loadCredentials();
});

document.getElementById("addBtn").addEventListener("click", () => {
  document.getElementById("addWebsite").value = "";
  document.getElementById("addUsername").value = "";
  document.getElementById("addPassword").value = "";
  document.getElementById("addError").textContent = "";
  showScreen("add");
});

document.getElementById("cancelAddBtn").addEventListener("click", () => {
  showScreen("dashboard");
  loadCredentials();
});

document.getElementById("saveNewBtn").addEventListener("click", async () => {
  const website = document.getElementById("addWebsite").value.trim();
  const username = document.getElementById("addUsername").value.trim();
  const password = document.getElementById("addPassword").value;
  const errEl = document.getElementById("addError");
  errEl.textContent = "";

  if (!website || !username || !password) {
    errEl.textContent = "All fields are required.";
    return;
  }

  const res = await apiFetch("/credentials", {
    method: "POST",
    body: JSON.stringify({ website, username, password }),
  });

  if (!res.ok) {
    errEl.textContent = res.data.error || "Failed to save.";
    return;
  }

  showScreen("dashboard");
  loadCredentials();
});

document.getElementById("dontSaveBtn").addEventListener("click", () => {
  chrome.runtime.sendMessage({ type: "CLEAR_PENDING_CREDENTIAL" });
  pendingCredential = null;
  init();
});
// --- Setup ---
document.getElementById("setupBtn").addEventListener("click", async () => {
  const password = document.getElementById("setupPassword").value;
  const errEl = document.getElementById("setupError");
  errEl.textContent = "";

  const res = await apiFetch("/setup", { method: "POST", body: JSON.stringify({ password }) });
  if (!res.ok) {
    errEl.textContent = res.data.error || "Setup failed.";
    return;
  }
  showScreen("unlock");
});

// --- Unlock ---
document.getElementById("unlockBtn").addEventListener("click", async () => {
  const password = document.getElementById("unlockPassword").value;
  const errEl = document.getElementById("unlockError");
  errEl.textContent = "";

  const res = await apiFetch("/unlock", { method: "POST", body: JSON.stringify({ password }) });
  if (!res.ok) {
    errEl.textContent = res.data.error || "Unlock failed.";
    return;
  }
  await setToken(res.data.session_token);
  showScreen("dashboard");
  loadCredentials();
});

// --- Lock ---
document.getElementById("lockBtn").addEventListener("click", async () => {
  await apiFetch("/lock", { method: "POST" });
  await clearToken();
  document.getElementById("unlockPassword").value = "";
  showScreen("unlock");
});

// --- Generate password ---
document.getElementById("generateBtn").addEventListener("click", async () => {
  const res = await apiFetch("/generate-password", {
    method: "POST",
    body: JSON.stringify({ length: 16 }),
  });
  if (res.ok) {
    await navigator.clipboard.writeText(res.data.password);
    alert(`Generated password copied to clipboard:\n${res.data.password}`);
  }
});

// --- Search ---
document.getElementById("searchInput").addEventListener("input", async (e) => {
  loadCredentials(e.target.value);
});

// --- Load + render credential list ---
async function loadCredentials(query = "") {
  const path = query ? `/credentials?q=${encodeURIComponent(query)}` : "/credentials";
  const res = await apiFetch(path);
  const listEl = document.getElementById("credentialList");
  listEl.innerHTML = "";

  if (!res.ok) {
    if (res.status === 401) showScreen("unlock");
    return;
  }

  res.data.forEach((cred) => {
    const card = document.createElement("div");
    card.className = "credential-card";
    card.innerHTML = `
      <div class="site">🌐 ${cred.website}</div>
      <div class="user">${cred.username}</div>
      <div class="credential-actions">
        <button data-id="${cred.id}" class="copyBtn">📋 Copy</button>
        <button data-id="${cred.id}" class="deleteBtn">🗑 Delete</button>
      </div>
    `;
    listEl.appendChild(card);
  });

  listEl.querySelectorAll(".copyBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      const res = await apiFetch(`/credentials/${id}?reveal=true`);
      if (res.ok) {
        await navigator.clipboard.writeText(res.data.password);
        alert("Password copied to clipboard.");
      }
    });
  });

  listEl.querySelectorAll(".deleteBtn").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (!confirm("Delete this credential?")) return;
      await apiFetch(`/credentials/${id}`, { method: "DELETE" });
      loadCredentials();
    });
  });
}

init();