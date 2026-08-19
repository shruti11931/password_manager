# 🔐 Secure Password Manager

<div align="center">

<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=28&duration=3000&pause=1000&color=4F46E5&center=true&vCenter=true&width=700&lines=Secure+Password+Manager;Save+Passwords+Automatically;One-Click+Autofill;Your+Passwords%2C+Your+Vault+%F0%9F%94%90" alt="Typing Animation"/>

<br>
<br>

<img src="https://img.shields.io/badge/Python-3.x-3776AB?style=for-the-badge&logo=python&logoColor=white"/>
<img src="https://img.shields.io/badge/Flask-Backend-000000?style=for-the-badge&logo=flask&logoColor=white"/>
<img src="https://img.shields.io/badge/Chrome-Extension-4285F4?style=for-the-badge&logo=googlechrome&logoColor=white"/>
<img src="https://img.shields.io/badge/JavaScript-ES6-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black"/>
<img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white"/>
<img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white"/>

<br><br>

**A secure browser-based password manager with automatic credential detection, password saving, session protection, and one-click autofill.**

</div>

---

## ✨ Overview

**Secure Password Manager** is a Chrome extension designed to make password management simple, secure, and convenient.

Instead of manually opening a password manager and copying credentials every time you log in, the extension can detect login forms, offer to save credentials, and provide **one-click autofill** when you return to a website.

### 🔄 Complete Flow

```text
        🌐 Visit Website
              │
              ▼
      🔎 Detect Login Form
              │
              ▼
      🔐 Enter Credentials
              │
              ▼
       💾 Save Credential
              │
              ▼
       🔓 Unlock Vault
              │
              ▼
       📋 View Dashboard
              │
              ▼
      🔎 Detect Login Page
              │
              ▼
       ⚡ Autofill Banner
              │
              ▼
       🖱️ One-Click Autofill
```

---

## 🚀 Key Features

<table>
<tr>
<td width="50%">

### 🔐 Secure Vault

* Master password protection
* Protected credential storage
* Server-side session management
* Automatic session timeout

</td>
<td width="50%">

### 💾 Automatic Saving

* Detects login credentials
* Offers to save credentials
* Stores website information
* Avoids unnecessary manual entry

</td>
</tr>

<tr>
<td>

### ⚡ One-Click Autofill

* Detects supported login forms
* Displays autofill option
* Automatically fills username/email
* Automatically fills password

</td>
<td>

### 📊 Dashboard

* View saved credentials
* Organized credential cards
* Website information
* Easy vault management

</td>
</tr>
</table>

---

## 🎯 Project Workflow

### 1️⃣ Detect

The content script monitors webpages for login forms and identifies relevant username/email and password fields.

```text
Website
   ↓
Login Form Detected
   ↓
Username + Password Fields
```

### 2️⃣ Save

When credentials are entered, the extension can offer the user an option to save them to the password vault.

```text
User enters credentials
          ↓
Credential detected
          ↓
Save prompt appears
          ↓
Credential stored
```

### 3️⃣ Unlock

The password vault is protected by a master password.

```text
Extension opened
      ↓
Unlock screen
      ↓
Master Password
      ↓
Authenticated Session
      ↓
Dashboard
```

### 4️⃣ Autofill

When returning to a saved website, the extension detects the login page and provides an autofill option.

```text
Saved Website
      ↓
Login form detected
      ↓
Saved credential found
      ↓
Autofill banner
      ↓
Click Autofill
      ↓
Email + Password filled
```

---

## 🧩 Architecture

```text
┌──────────────────────────────────────────┐
│                Chrome Browser            │
│                                          │
│  ┌──────────────┐      ┌──────────────┐ │
│  │  Popup UI    │      │ Content.js   │ │
│  │              │      │              │ │
│  │ Dashboard    │      │ Form Detect  │ │
│  │ Unlock       │      │ Save Prompt  │ │
│  │ Credentials  │      │ Autofill     │ │
│  └──────┬───────┘      └──────┬───────┘ │
│         │                       │         │
│         └──────────┬────────────┘         │
│                    │                      │
│              Extension Logic              │
└────────────────────┼─────────────────────┘
                     │
                     │ HTTP Requests
                     ▼
          ┌─────────────────────┐
          │     Flask API       │
          │                     │
          │ Authentication      │
          │ Vault Management    │
          │ Credential APIs     │
          │ Session Handling    │
          └──────────┬──────────┘
                     │
                     ▼
          ┌─────────────────────┐
          │   Password Vault    │
          │                     │
          │ Saved Credentials   │
          │ Master Password     │
          │ Session Information  │
          └─────────────────────┘
```

---

## 📁 Project Structure

```text
secure-password-manager/
│
├── backend/
│   ├── app.py
│   └── ...
│
├── extension/
│   ├── manifest.json
│   ├── popup.html
│   ├── popup.js
│   ├── popup.css
│   ├── content.js
│   ├── background.js
│   └── ...
│
├── README.md
└── ...
```

---

## 🛠️ Technologies Used

| Technology                     | Purpose                 |
| ------------------------------ | ----------------------- |
| 🐍 **Python**                  | Backend development     |
| 🌶️ **Flask**                  | REST API / server       |
| 🌐 **JavaScript**              | Extension functionality |
| 🎨 **HTML & CSS**              | Extension interface     |
| 🌍 **Chrome Extension API**    | Browser integration     |
| 🔐 **Password Authentication** | Vault protection        |
| 💾 **Database/Storage**        | Credential persistence  |

---

## 🔐 Security

Security is one of the main goals of this project.

The application includes:

* 🔑 Master password authentication
* 🔒 Protected vault access
* ⏱️ Automatic session timeout
* 🚪 Automatic locking after inactivity
* 🛡️ Backend authentication checks
* 🔐 Controlled access to stored credentials

### ⏱️ Session Timeout

The backend can automatically lock an inactive session.

```python
SESSION_TIMEOUT_SECONDS = 300
```

This represents a **5-minute inactivity timeout** in the normal configuration.

During testing, this value can temporarily be reduced to verify the locking mechanism.

---

## ⚡ Autofill System

The autofill functionality is one of the main features of this project.

The extension detects login forms using the content script and checks whether a saved credential exists for the current website.

```text
              Page Loaded
                   │
                   ▼
          Detect Login Form
                   │
                   ▼
       Check Current Website
                   │
                   ▼
        Saved Credential?
             /          \
           YES           NO
            │             │
            ▼             ▼
     Show Autofill      Nothing
        Banner
            │
            ▼
       User Clicks
        Autofill
            │
            ▼
    Fill Email/Username
            +
      Fill Password
```

---

## 💻 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
cd YOUR-REPOSITORY
```

### 2. Start the Backend

Navigate to the backend directory:

```bash
cd backend
```

Create a virtual environment:

```bash
python -m venv venv
```

Activate it on Windows:

```bash
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start Flask:

```bash
python app.py
```

The backend should now be running.

---

## 🌐 Load the Chrome Extension

1. Open Chrome.
2. Navigate to:

```text
chrome://extensions
```

3. Enable **Developer mode**.
4. Click **Load unpacked**.
5. Select the extension folder.
6. Pin the extension to the Chrome toolbar.

```text
Chrome
  ↓
chrome://extensions
  ↓
Developer Mode
  ↓
Load unpacked
  ↓
Select extension/
  ↓
Extension Installed ✅
```

---



### 🔑 Test Master Password

Open the extension and enter the configured master password.

Expected result:

```text
Unlock Screen
      ↓
Enter Master Password
      ↓
Unlock Vault
      ↓
Dashboard
```

---

### 💾 Test Credential Saving

1. Open a website containing a login form.
2. Enter username/email.
3. Enter password.
4. Submit the form.
5. The extension detects the credentials.
6. Save the credential.

Expected:

```text
Login detected
      ↓
Save credential
      ↓
Credential appears in vault
```

---

### ⚡ Test Autofill

1. Open a website for which a credential has already been saved.
2. Navigate to its login page.
3. The extension detects the login form.
4. The autofill option should appear.
5. Click **Autofill**.
6. Verify that username/email and password are populated.

Expected:

```text
Saved Credential
       ↓
Login Page Detected
       ↓
Autofill Banner
       ↓
Click Autofill
       ↓
Username + Password
       ↓
Fields Populated ✅
```

---

### ⏱️ Test Automatic Session Lock

For testing, temporarily change:

```python
SESSION_TIMEOUT_SECONDS = 300
```

to:

```python
SESSION_TIMEOUT_SECONDS = 15
```

Restart the backend:

```bash
python app.py
```

Then:

1. Unlock the extension.
2. Stay inactive for more than 15 seconds.
3. Close the popup.
4. Open the extension again.
5. The vault should require authentication again.

After testing, restore:

```python
SESSION_TIMEOUT_SECONDS = 300
```
---

## 🔄 Complete Feature Flow

<div align="center">

### 🌐 Detect → 💾 Save → 🔐 Protect → 📊 Manage → ⚡ Autofill

</div>

```text
┌─────────────┐
│    🌐       │
│   Website   │
└──────┬──────┘
       ↓
┌─────────────┐
│     🔎      │
│ Login Form  │
│  Detection  │
└──────┬──────┘
       ↓
┌─────────────┐
│     💾      │
│    Save     │
│ Credential  │
└──────┬──────┘
       ↓
┌─────────────┐
│     🔐      │
│    Vault    │
│ Protection  │
└──────┬──────┘
       ↓
┌─────────────┐
│     📊      │
│  Dashboard  │
└──────┬──────┘
       ↓
┌─────────────┐
│     ⚡      │
│  Autofill   │
└─────────────┘
```

---


## 🏆 Project Highlights

<div align="center">

### 🔐 Secure

Protected vault with authentication and session locking.

### ⚡ Fast

One-click credential autofill.

### 🤖 Automatic

Detects login forms and credentials.

### 🌐 Browser Integrated

Works directly inside Chrome webpages.

### 🧩 Full Stack

Chrome Extension + JavaScript + Flask Backend.

</div>

---

## 📌 Important Note

This project is developed for **educational and demonstration purposes**.

For production use, password managers require carefully reviewed cryptographic design, secure key management, encrypted storage, secure transport, and extensive security auditing.

---

## 👩‍💻 Author

<div align="center">

### **Shruti Jadhav**

💻 Computer Engineering Student
🔐 Password Manager Project
🚀 Learning • Building • Improving

</div>

---

## ⭐ Support

If you found this project interesting, consider giving the repository a ⭐ on GitHub!

<div align="center">

**Made with ❤️ and lots of code**

🔐 **Your Passwords. Your Vault. Your Control.**

</div>
