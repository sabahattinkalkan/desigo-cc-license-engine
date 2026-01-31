# Licensing Specification

Based on **Desigo CC Technical Knowledge Pack**.

## 1. Feature Sets

### Compact
*   **Target:** Small/Medium single-discipline sites.
*   **Limitations:** No advanced scripting, no distributed systems.
*   **Variants:**
    *   *Compact BA:* Includes 500 BA points.
    *   *Compact Fire:* Includes 500 Fire points.

### Standard
*   **Target:** Enterprise / Multi-discipline.
*   **Trigger:** Automatically required if >1 discipline is used OR advanced features are enabled.
*   **Base:** 0 embedded points. All capacity must be purchased via packages.

## 2. Disciplines & Units

| Discipline | Unit | Standard Packages |
| :--- | :--- | :--- |
| **Building Automation** | Points | 500, 1000, 5000, 10000 |
| **Fire Safety** | Points | 100, 500, 1000, 5000, 10000 |
| **Electrical** | I/O Points | 100, 500 |
| **SCADA** | Tags | 50, 100 |

## 3. Calculation Rules

1.  **Aggregation:** All points (physical, virtual, calculated) count towards the limit.
2.  **Rounding:** Requirements are strictly rounded UP to the next available package combination. 
    *   *Example:* Requirement 600 BA. Packages [500, 1000]. Result: 1x 500 + 1x 100 (if 100 exists) OR 1x 1000.
3.  **Subscription:** Licenses are perpetual. Updates require active SUR/SUS.

## 4. Constraint Enforcement
The engine enforces limits strictly.
*   `IF (ActiveDisciplines >= 2) -> REQUIRE Standard`
*   `IF (Features HAS "Distributed") -> REQUIRE Standard`
