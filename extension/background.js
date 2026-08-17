/**
 * extension/background.js
 *
 * Receives form-submit events from content.js, holds the credential
 * in memory only (never written to disk here), and opens the
 * confirmation popup for the user to approve or reject saving it.
 */

let pendingCredential = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FORM_SUBMITTED") {
    pendingCredential = message.payload;

    // Badge on the extension icon as a visual cue a prompt is waiting.
    chrome.action.setBadgeText({ text: "1" });
    chrome.action.setBadgeBackgroundColor({ color: "#4f6bfe" });

    // Open the extension popup itself acting as the confirmation UI.
    // (Chrome doesn't allow programmatically opening the popup from a
    // content script context, so we rely on the badge + the user
    // clicking the icon; popup.js checks for a pending credential on open.)
  }

  if (message.type === "GET_PENDING_CREDENTIAL") {
    sendResponse({ pending: pendingCredential });
  }

  if (message.type === "CLEAR_PENDING_CREDENTIAL") {
    pendingCredential = null;
    chrome.action.setBadgeText({ text: "" });
  }

  if (message.type === "CHECK_CREDENTIAL_EXISTS") {
    checkCredentialExists(message.website).then((exists) => sendResponse({ exists }));
    return true; // async response
  }

  if (message.type === "GET_CREDENTIAL_FOR_AUTOFILL") {
    getCredentialForAutofill(message.website).then((credential) => sendResponse({ credential }));
    return true; // async response
  }

  return true; // keep the message channel open for async sendResponse
});

const API_BASE = "http://127.0.0.1:5000/api";

async function getSessionToken() {
  const data = await chrome.storage.local.get("sessionToken");
  return data.sessionToken || null;
}

async function checkCredentialExists(website) {
  const token = await getSessionToken();
  if (!token) return false;

  try {
    const res = await fetch(`${API_BASE}/credentials?q=${encodeURIComponent(website)}`, {
      headers: { "X-Session-Token": token },
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data) && data.some((c) => c.website === website);
  } catch {
    return false;
  }
}

async function getCredentialForAutofill(website) {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    const listRes = await fetch(`${API_BASE}/credentials?q=${encodeURIComponent(website)}`, {
      headers: { "X-Session-Token": token },
    });
    if (!listRes.ok) return null;
    const list = await listRes.json();
    const match = list.find((c) => c.website === website);
    if (!match) return null;

    const detailRes = await fetch(`${API_BASE}/credentials/${match.id}?reveal=true`, {
      headers: { "X-Session-Token": token },
    });
    if (!detailRes.ok) return null;
    const detail = await detailRes.json();
    return { username: detail.username, password: detail.password };
  } catch {
    return null;
  }
}