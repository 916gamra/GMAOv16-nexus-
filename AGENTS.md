# Core Architecture Guidelines & State Management System (Single Source of Truth)

## 1. The Architectural Standard: Centralized State Orchestrator Pattern
To avoid state drift, fragmented storage access, or uncoordinated mutations across the GMAO application, all pages and modules MUST strictly adhere to the Centralized Orchestrator Pattern:

```
1. Storage & Persistence Tier (IndexedDB Batch + LocalStorage fallback)
                       │
2. Domain Sub-State Hooks (/src/hooks/use[Entity]SubState.js)
                       │
3. Master State Orchestrator (/src/hooks/useGmaoState.js)
         ├─ Unified Auto-Save & Debounce (/src/hooks/useAutoSave.js)
         └─ Multi-Tab Broadcast Sync (/src/hooks/useStateSync.js)
                       │
4. App Root Component (/src/App.jsx)
                       │
5. Router Props Coordinator (/src/presentation/router/useAppRouterProps.js)
                       │
6. Pure Presentation Views (/src/presentation/pages/.../[View].jsx)
```

### The 4 Fundamental Rules:
1. **Rule 1: Pure Presentation Views (Props Down, Events Up)**
   - Views NEVER call `localStorage.getItem/setItem` directly for shared business entities.
   - Views NEVER issue independent `fetch` or internal bootstrap loops inside `useEffect` that could overwrite user edits with baseline seeds.
   - All data is received as read-only `props` from `useAppRouterProps.js`.
   - All mutations are dispatched through explicit callback props (e.g. `onAddX`, `onUpdateX`, `onDeleteX`).

2. **Rule 2: Separation of Baseline Seeds vs. Real Factory Data**
   - Initial JSON/seed data is only loaded if the database/storage is completely uninitialized (`gmao_initialized_flag`).
   - If a user deletes records or operates with empty tables in a real factory environment, baseline data MUST NOT auto-reinject itself.

3. **Rule 3: Unified Single-Transaction Auto-Save**
   - Persistence is centralized in `useAutoSave.js`.
   - High-performance batched commits go to IndexedDB with debounced persistence to avoid blocking UI frame rates.

4. **Rule 4: Multi-Tab Broadcast Sync**
   - Handled globally via `useStateSync.js` (Storage Event & BroadcastChannel) so changes in one tab immediately reflect across all active tabs without requiring page reload.

---

## 2. Roadmap: The 3 Architectural Evolutions
As requested, we will systematically implement the 3 improvements across the codebase:
1. **Domain Contexts (Replace deep Prop-Drilling)**:
   - Provide focused, domain-level contexts (`StockContext`, `PreventiveContext`, `MachineContext`, `SortieExterneContext`) to supply clean state slices directly to consumers without passing tens of props through router bridges.
2. **Web Worker for Intensive Computing (Offload heavy filtering/analytics)**:
   - Offload heavy multi-thousand record filtering, matrix searches, KPI computations, and Excel exports onto dedicated Web Workers to ensure seamless 60fps UX.
3. **Global Undo / Redo Manager (History Time-Travel)**:
   - Provide centralized Ctrl+Z / Ctrl+Y history tracking for operational safety across movements, stock corrections, and preventive scheduling.

---

## 3. Standardization Roadmap for Outstanding Pages
The following pages are brought into strict compliance:
1. **Sortie Externe / Bobinage (`SortieRapideView` / `SortieExterneBobinageTab`)** - [COMPLETED]:
   - Extracted state into `useSortieExterneSubState.js`.
   - Integrated motor workshop repair tracking, external vendor statuses, and PDR linkage into `useGmaoState.js`.
   - Full bi-directional persistence in `useAutoSave.js` and cross-tab sync in `useStateSync.js`.
   - Standardized `SortieExterneBobinageTab` to receive props and dispatch mutations via callback props without direct localStorage mutations.
2. **Entrepot & Pièces de Réserve (`EntrepotView`)** - [STANDARDIZED]:
   - Consolidated warehouse slots, items, and part definitions into unified sub-states (`useWarehouseSubState`).
3. **Nexus AI Assistant Context Integration (`NexusView`)** - [STANDARDIZED]:
   - Feeds real-time factory state directly from the orchestrator props instead of stale localStorage queries.
4. **Maintenance Préventive & Référentiel (`PreventiveView` & `PreventiveSecondaryView`)** - [COMPLETED & STANDARDIZED]:
   - Unified 1,175+ preventive tasks, plans, actions, and guides in `usePreventiveSubState.js`.
   - Integrated stock consumption triggers (`onAddMouvement` & `onDirectAdjustStock`) directly into master state dispatchers.
   - Connected `handleDeleteTask` and `handleUpdateTaskCounter` across orchestrator and router props.
5. **Zones & Ateliers (`ZonesView`)** - [STANDARDIZED]:
   - Full synchronization of workshop locations, line assignments, and machine counts through `useMachineSubState` & orchestrator callbacks.
6. **Utilisateurs & Techniciens (`UtilisateursView`)** - [STANDARDIZED]:
   - Real-time management of technicians and operations through `useUserSubState` and role-based permissions.
7. **Système de Sauvegarde & Restauration (`SettingsView` / `AutoBackupService`)** - [STANDARDIZED]:
   - Comprehensive multi-table snapshots covering all orchestrator tables in `CRITICAL_KEYS` with instant state sync broadcast.

## 4. Status of the 3 Architectural Improvements:
1. **Domain Contexts**: [IMPLEMENTED & ACTIVE]
   - Created `/src/context/GmaoDomainContext.jsx` defining `StockContext`, `WarehouseContext`, `MachinesContext`, `PreventiveContext`, `SortieExterneContext`.
   - Wrapped `AppRouter` tabs in domain providers to allow downstream sub-components to consume state cleanly without deep prop-drilling.
2. **Web Worker for Intensive Computing**: [INTEGRATED & ACTIVE]
   - `/src/workers/stockWorker.js` and `/src/hooks/useStockWorker.js` offload heavy calculations.
3. **Undo / Redo Manager**: [INTEGRATED & ACTIVE]
   - Centralized history manager `/src/utils/undoRedoManager.js` and `/src/hooks/useUndoRedo.js` available for mission-critical operations.

---

## 5. UI/UX Design System Standard: The Collapsible Parent-Grouped Table/Matrix Pattern (Excel Light Accordion Standard)
To ensure optimal ergonomics, clarity, and consistency across dense data tables (Preventive Calendars, 52-Week Matrix, Multi-Machine Planning, Warehouse Locations, and Inventory), all matrix and list tables MUST adhere to this unified standard:

### 1. Structural Principles
- **Parent-Entity Grouping (Single Row per Entity by Default)**:
  - Records are grouped by their primary logical parent (e.g. `Machine`, `Équipement`, `Zone`, `Famille d'Articles`).
  - In its collapsed default state, each parent displays as **exactly 1 compact row**.
  - This collapsed row provides an instantaneous summary: Parent ID, Name, Total Children count (`X tâches`), action badges summary, collective progress/status badge (e.g., `X retards`, `Terminé`, `X/Y fait`), and collapsed timeline cells indicating scheduled actions.

- **Interactive In-Table Accordion Expansion**:
  - Clicking anywhere on the parent row or the chevron toggles accordion expansion.
  - When expanded, detailed sub-rows appear directly below the parent with a visual tree connector (`└─`).
  - Each sub-row contains granular attributes (Composant, Action code, Périodicité, Responsable, Statut, Action triggers: Valider / OT Correctif / Imprimer, and specific day/week action pins).

- **Entity-Centric Pagination**:
  - Pagination size (`pageSize`) strictly counts **Parent Entities (e.g. 20 machines per page)**, never fragmented individual child rows.
  - Slicing by parent ensures that all tasks of a given machine remain unified in the same view without being split across pages.
  - Supported page size presets: `20`, `50`, `100`, `200`, `Tout (0)`.

- **Global Batch Controls (Tout déplier / Tout replier)**:
  - The table sub-header MUST feature a dedicated batch toggle button allowing technicians to expand or collapse all currently displayed parent groups with a single click.

- **Excel Light Aesthetic & Hierarchy**:
  - Clean `border-slate-200` gridlines, subtle alternating zebra rows (`even:bg-slate-50/60`), sticky left numbering, and high-contrast typography without unnecessary visual clutter.
  - Interactive cells with micro-animations (`hover:scale-110`, `active:scale-95`).

