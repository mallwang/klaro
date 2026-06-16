# Data Model: Admin Account Page Overhaul

No data model changes are required for this feature.

This overhaul is a frontend layout refactor only. The `Account` and `Invitation` types
defined in `@pcm/shared` are unchanged. All hooks (`useAccounts`, `useInvitations`,
`useSendInvitation`, etc.) retain their existing signatures. No new API endpoints, request
types, or response types are introduced.

The only code changes are JSX restructuring and local component state movement within
`AccountsAdmin.tsx`.
