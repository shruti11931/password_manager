/**
 * extension/content.js
 *
 * Detects login/signup form submissions on the current page.
 * IMPORTANT: does NOT read passwords continuously or log them anywhere.
 * It only captures the values from the specific form the user just
 * submitted, and only to pass to the extension's own confirmation UI —
 * nothing is sent anywhere until the user clicks "Save Password".
 */

function findPasswordField(form) {
  return form.querySelector('input[type="password"]');
}

function findUsernameField(form, passwordField) {
  // Look for a text/email input that appears before the password field
  const inputs = Array.from(form.querySelectorAll('input[type="text"], input[type="email"]'));
  return inputs.length > 0 ? inputs[0] : null;
}

document.addEventListener(
  "submit",
  (event) => {
    
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;

    const passwordField = findPasswordField(form);
    if (!passwordField || !passwordField.value) return; // no password submitted, nothing to offer // no password submitted, nothing to offer

    const usernameField = findUsernameField(form, passwordField);
    const username = usernameField ? usernameField.value : "";
    const password = passwordField.value; // only read at the moment of submit, held in memory only

    const payload = {
      website: window.location.hostname || window.location.href,
      username,
      password,
    };

    // Send to the background script — held in memory there only until
    // the user responds to the confirmation popup. Never written to
    // disk or sent to the backend at this point.
    chrome.runtime.sendMessage({ type: "FORM_SUBMITTED", payload });
  },
  true // capture phase, so we see the submit before any page JS can prevent it
);
/**
 * Autofill: checks if a saved credential exists for this domain,
 * and if so, shows a small non-intrusive banner with an Autofill button.
 * Nothing is filled until the user clicks it.
 */

function findLoginForm() {
  const forms = Array.from(document.forms).filter((f) =>
    f.querySelector('input[type="password"]')
  );
  if (forms.length === 0) return null;
  if (forms.length === 1) return forms[0];

  // Multiple candidates (e.g. a signup form + a login form on the same page).
  // Prefer one whose id/action/class hints at "login" over "register"/"signup".
  const loginHint = forms.find((f) => {
    const text = (f.id + " " + f.action + " " + f.className).toLowerCase();
    return text.includes("login") || text.includes("signin");
  });
  if (loginHint) return loginHint;

  // Fallback: the form with the fewest input fields is usually the simpler login form.
  return forms.reduce((a, b) =>
    a.querySelectorAll("input").length <= b.querySelectorAll("input").length ? a : b
  );
}

function createAutofillBanner(website) {
  if (document.getElementById("spm-autofill-banner")) return; // already shown

  const banner = document.createElement("div");
  banner.id = "spm-autofill-banner";
  banner.style.cssText = `
    position: fixed;
    top: 12px;
    right: 12px;
    z-index: 999999;
    background: #1e1e2e;
    color: #fff;
    padding: 10px 14px;
    border-radius: 10px;
    font-family: sans-serif;
    font-size: 13px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    gap: 10px;
  `;
  banner.innerHTML = `
    <span>Credential available for ${website}</span>
    <button id="spm-autofill-btn" style="background:#4f6bfe;color:#fff;border:none;border-radius:14px;padding:5px 10px;cursor:pointer;">Autofill</button>
    <button id="spm-autofill-dismiss" style="background:transparent;color:#aaa;border:none;cursor:pointer;">✕</button>
  `;
  document.body.appendChild(banner);

  document.getElementById("spm-autofill-dismiss").addEventListener("click", () => banner.remove());

  document.getElementById("spm-autofill-btn").addEventListener("click", () => {
    chrome.runtime.sendMessage({ type: "GET_CREDENTIAL_FOR_AUTOFILL", website }, (res) => {
      if (res && res.credential) {
        const form = findLoginForm();
        if (form) {
          const passwordField = findPasswordField(form);
          const usernameField = findUsernameField(form, passwordField);
          if (usernameField) usernameField.value = res.credential.username;
          if (passwordField) passwordField.value = res.credential.password;
        }
      }
      banner.remove();
    });
  });
}

// Only offer autofill if a login form exists on this page.
// Only offer autofill if a login form exists on this page.
// Runs immediately if the page already finished loading (common when the
// content script injects late), otherwise waits for the load event.
function checkAndOfferAutofill() {
  const form = findLoginForm();
  if (!form) return;

  const website = window.location.hostname;
  if (!website) return;

  chrome.runtime.sendMessage({ type: "CHECK_CREDENTIAL_EXISTS", website }, (res) => {
    if (res && res.exists) {
      createAutofillBanner(website);
    }
  });
}

console.log("Autofill check state:", document.readyState);
if (document.readyState === "complete") {
  console.log("Running checkAndOfferAutofill immediately");
  checkAndOfferAutofill();
} else {
  console.log("Waiting for load event");
  window.addEventListener("load", () => {
    console.log("Load event fired, running checkAndOfferAutofill");
    checkAndOfferAutofill();
  });
}