# Installation Guide

This guide is intentionally minimal and engineer-friendly.

No backend, no database, no environment configuration is required.

---

## Requirements

- **Node.js 18 or newer**
- **npm** (included with Node.js)

Check your Node.js version:

```bash
node -v
```

If Node.js is not installed, download it from:
https://nodejs.org

---

## Clone the Repository

```bash
git clone https://github.com/sabahattinkalkan/desigo-cc-license-engine.git
cd desigo-cc-license-engine
```

---

## Install Dependencies

```bash
npm install
```

---

## Run the Application

```bash
npm run dev
```

You should see output similar to:

```
Local: http://localhost:5173/
```

---

## Open in Browser

Open the displayed local URL in your browser.

No login, no configuration, no backend connection is required.

---

## Verify Correct Operation

To verify that the engine works correctly:

- Enter **2000 BA points** → Compact remains valid
- Enter **2001 BA points** → Standard is selected automatically

If this behavior is observed, the license engine is operating correctly.

---

## Notes

- The application runs fully **offline**
- All calculations are performed client-side
- No project data is transmitted or stored externally
