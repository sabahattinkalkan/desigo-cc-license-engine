# Industrial License Manager - Architecture

## Core Philosophy
This system rejects hard-coded values. It is a "Configuration-First" architecture where business rules are injected into a generic Calculation Engine. This mirrors the Siemens Desigo CC approach where the software adapts to the license, rather than the license checking being a static if/else block.

## System Components

### 1. Configuration Layer (JSON / Database)
*   **Role:** The Single Source of Truth (SSOT).
*   **Content:** Defines what a "Discipline" is, what "Packages" exist, and the thresholds for "Standard" vs "Compact".
*   **Benefit:** Marketing can create a "Medium" feature set or a "Security" discipline without recompiling the backend code.

### 2. The Calculation Engine (`LicenseEngine`)
*   **Role:** Stateless processing unit.
*   **Input:** `User Requirements` + `Configuration`.
*   **Logic:**
    1.  **Normalization:** Reads requested inputs.
    2.  **Constraint Checking:** Checks multi-discipline rules and feature flags.
    3.  **Base Allocation:** Applies embedded points from Feature Sets.
    4.  **Gap Analysis:** Calculates `Deficit = Required - Embedded`.
    5.  **Bin Packing:** Selects appropriate SKU packages to fill the deficit (Round Up logic).
*   **Output:** `Bill of Materials` (Feature Set + List of Packages).

### 3. Persistence Layer (Prisma + Postgres)
*   Stores the *instantiated* licenses for specific sites.
*   Maps specific Package UUIDs to Sites.
*   Enforces referential integrity between what is sold and what exists in the catalog.

### 4. API Layer (NestJS - Conceptual)
*   Exposes `POST /calculate` for the frontend UI.
*   Exposes `GET /validate` for the actual software runtime to check if it's allowed to run.

## Data Flow

1.  **Boot:** Backend loads `license-packages.json` and `license-rules.json` into memory.
2.  **Request:** UI sends `{ BA: 1200, Features: ['scripting'] }`.
3.  **Process:** Engine detects 'scripting' -> Upgrades to STANDARD.
4.  **Calc:** Standard has 0 embedded. Deficit = 1200.
5.  **Optimization:** Engine finds packages. [1000, 100, 100] or [1000, 500] depending on available SKUs.
6.  **Response:** Returns result to UI.

## Extensibility
To add a new discipline (e.g., "HVAC Analytics"):
1.  Add entry to `license-packages.json`.
2.  Restart.
3.  No code changes required.
