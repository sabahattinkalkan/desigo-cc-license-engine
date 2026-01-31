# PLAN-desigo-license-calc

## Context
- **User Request**: Project review and report generation.
- **Project Name**: Industrial License Manager (Desigo CC License Calculator).
- **Current State**: React + Vite application with client-side logic execution.
- **Mode**: PLANNING

## 🧐 Project Inspection Report

### 1. Architecture Overview
The project implements a "Configuration-First" license calculator.
- **Core Logic**: Located in `backend/licensing/licensing-engine.ts`. It is deeply decoupled from the UI, which is excellent.
- **Configuration**: Logic is driven by `license-packages.json` and `license-rules.json`, allowing business rule changes without code changes.
- **Frontend**: Single-file integration in `index.tsx`. It imports the "backend" engine directly into the browser bundle.
- **Persistence**: Currently uses a `ProjectService` mock class that saves to browser `localStorage`.

### 2. Codebase Quality
- **Strengths**:
  - Strong typing with TypeScript.
  - Clear separation of "Calculation Logic" vs "UI Presentation".
  - Flexible "Bin Packing" algorithm for package selection.
- **Areas for Improvement**:
  - Monolithic `index.tsx` (670 lines): Components should be split.
  - No real backend connectivity yet (despite `architecture.md` mentioning NestJS).
  - Prisma schema exists (`database/prisma.schema`) but is unused.

## 🚀 Proposed Roadmap (Next Steps)

This plan outlines the steps to move from the current "Prototype/Standalone" state to the "Production Architecture" described in `architecture.md`.

### Phase 1: Frontend Refactoring (Immediate)
- [ ] **Extract Components**: Split `index.tsx` into `Header`, `ProjectHistory`, `InputForm`, `ResultsView`.
- [ ] **Add Tests**: Add unit tests for `LicenseEngine` using Jest/Vitest.

### Phase 2: True Backend Implementation (Recommended)
- [ ] **Initialize NestJS**: Create a real backend server.
- [ ] **Migrate Logic**: Move `LicenseEngine` to a NestJS Service.
- [ ] **API Layer**: Create `POST /calculate` and `GET /config` endpoints.

### Phase 3: Persistence Layer
- [ ] **Database Setup**: Spin up PostgreSQL (Docker).
- [ ] **Prisma Integration**: Connect `prisma.schema` to the database.
- [ ] **Persist Projects**: Save user projects to DB instead of LocalStorage.

## 📋 Agent Assignments

| Agent | Responsibility |
|-------|----------------|
| **Frontend-Dev** | Refactor `index.tsx`, improve UI UX, implement API client. |
| **Backend-Dev** | Setup NestJS, migrate Engine logic, setup Prisma. |
| **QA-Engineer** | Write test cases for the Calculation Engine (critical path). |

## 🧪 Verification Plan

### Automated Tests
- [ ] Run `npm test` (needs setup).
- [ ] Verify `LicenseEngine` output against known scenarios (e.g. "Scripting feature forces Standard Set").

### Manual Verification
- [ ] Verify "New Project" flow.
- [ ] Verify "History" persistence (currently LocalStorage).
- [ ] Check "Compact" vs "Standard" switching logic in UI.
