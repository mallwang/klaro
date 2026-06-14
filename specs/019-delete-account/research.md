# Research: Delete Account

**Branch**: `019-delete-account` | **Date**: 2026-06-14

## Findings

### Decision 1: Where does `deleteSelf` live?

**Decision**: New method `deleteSelf(userId)` on `ProfileService` (not `UserService`).

**Rationale**: `ProfileService` owns all self-service mutations (display name, email change,
password via auth service). `UserService.delete()` is an admin operation that requires the
target to be `ARCHIVED` first — that contract doesn't fit self-deletion. Adding a dedicated
method to `ProfileService` keeps the admin/self-service split clean and avoids coupling.

**Alternatives considered**:
- Reuse `UserService.delete()` — rejected because it requires ARCHIVED status and is
  semantically an admin operation, not self-service.
- Compose `ProfileService` with `UserService` — rejected per Principle III (YAGNI); inlining
  the admin count SQL query is simpler and there are no other callers.

---

### Decision 2: How does the frontend fetch contracts for the export in the dialog?

**Decision**: Pass contracts into `DeleteAccountModal` as a prop from `AccountSettings.tsx`,
which already has access to the React Query cache via `useContracts()`.

**Rationale**: `AccountSettings.tsx` will need to call `useContracts()` to drive the modal
(to show the export button and pass data). Fetching inside the modal would be a second
query with a flash of loading state. Props are simpler.

**Alternatives considered**:
- Fetch contracts inside the modal — rejected; creates a second query and the parent already
  has the data available in the query cache.

---

### Decision 3: Modal flow — one modal with two steps or two separate modals?

**Decision**: Single modal with two logical sections rendered sequentially: (1) export advisory
+ download/skip choice; (2) final confirmation button. No step indicator needed given only
two steps.

**Rationale**: The UX intent is a guided flow, not a wizard. Two sections in one modal is
simpler than two modals with state passing between them. Mantine `Modal` supports this with
local state.

**Alternatives considered**:
- Two separate modals — rejected; over-engineering for a two-step flow.
- Single modal with both sections always visible — rejected; the export step should be
  acknowledged before the destructive button appears.

---

### Decision 4: Session cleanup after self-deletion

**Decision**: The `DELETE /api/profile` handler clears the session cookie in the response
(same pattern as `POST /api/auth/sign-out`). The frontend observes the 204 and navigates
to `/sign-in`, clearing the React Query cache via `queryClient.clear()`.

**Rationale**: The session row is removed by the SQLite `ON DELETE CASCADE` when the user
row is deleted. The cookie must also be explicitly cleared client-side so the browser does
not re-send it. This mirrors the existing `signOut` flow.

---

### Decision 5: Sole-admin guard atomicity

**Decision**: `deleteSelf` checks `activeAdminCount()` inline and performs the DELETE in a
single SQLite transaction. No race condition is possible because SQLite serialises writes.

**Rationale**: SQLite's serialised write model means the count check and DELETE are
effectively atomic. No additional locking needed.
