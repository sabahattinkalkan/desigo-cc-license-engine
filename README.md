# Desigo CC Vendor-Grade License Engine

> Independent engineering tool for deterministic Desigo CC license calculation  
> **Not affiliated with Siemens AG**

---

## Purpose & Target Audience

This project is designed for **Siemens Desigo CC integrators, BMS engineers, and technical sales engineers**
who already understand Desigo CC licensing concepts and require a:

- Deterministic
- Rule-enforced
- Economically optimized

license calculation engine for real-world projects.

This tool intentionally avoids educational explanations and focuses on
**correct decisions, reproducible results, and professional outputs**.

---

## Core Philosophy

Desigo CC licensing decisions must be:

- Technically correct
- Policy-compliant
- Economically minimal
- Explainable

This engine enforces Siemens licensing rules strictly and produces
**auditable, vendor-grade decisions**.

There is no guesswork, heuristics, or manual tuning.

---

## Architecture Overview

The system follows a strict multi-layer architecture:

### Layer 0 — Catalog (Single Source of Truth)

- `LICENSE_CATALOG.json`
- Contains all license SKUs, capacities, limits, and constraints
- No logic, only data

### Layer 1 — Policy Validation (Hard Rule Enforcement)

- Validates Compact vs Standard limits
- Rejects invalid configurations
- Produces machine-readable error codes

### Layer 2 — BOM Optimization (Deterministic License Selection)

- Selects the minimal set of licenses required
- Uses deterministic tie-breaking rules
- No randomness, no pricing assumptions

### Layer 3 — Explanation Engine (Audit & Transparency)

- Produces a human-readable decision log
- Explains *why* a feature set was selected
- Explains *why* Compact was rejected (if applicable)

---

## Supported Scope

The engine currently supports license calculation for the **core BMS domains**:

- Building Automation (BA)
- Electrical
- Fire Detection
- SCADA
- Power & Energy (Meters)
- Clients
- Feature Set selection (Compact → Standard)

These domains represent the majority of real-world Desigo CC projects
encountered by system integrators.

---

## Explicitly Out of Scope

The following domains are **intentionally excluded**:

- Access Control
- Video Management
- Validation (Pharma / regulated environments)
- Security
- Migration scenarios (PSM / SSM)
- Subscription and commercial pricing

These areas require project-specific engineering decisions and are
not suitable for deterministic license calculation.

---

## User Interface

The UI is designed as an **engineering tool**, not a demo:

- Clean, distraction-free calculation screen
- Project save/load with scalable UX
- Live recalculation with strict rule feedback
- No backend, fully offline

---

## Output Philosophy

Each output channel has a distinct purpose:

- **UI**: Live calculation & transparency
- **Email**: Short, human-readable decision summary
- **Excel**: Formal Bill of Materials for offers & documentation
- **Decision Log**: Deterministic audit trail

This separation is a deliberate design choice.

---

## Usage

```bash
npm install
npm run dev
```

Open the application in your browser and enter project requirements.  
The engine will automatically select the correct feature set and licenses.

---

## Documentation

- [Installation Guide](INSTALLATION.md)

---

## Disclaimer

This is an independent engineering tool.

- Not affiliated with Siemens AG
- No commercial pricing included
- License data based on publicly available documentation and engineering practice

---

## Authorship

Designed & Engineered by **Sabahattin Kalkan**
