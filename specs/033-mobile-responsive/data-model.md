# Data Model: Mobile-Responsive Web App

**Feature**: 033-mobile-responsive | **Date**: 2026-06-17

## Overview

This feature is a pure presentation-layer change. No new data entities, database fields, or API contracts are introduced. `ContractData`, `Account`, and all other shared types from `@pcm/shared` are unchanged. This document instead records the UI component model: which existing components are affected, what changes at the phone breakpoint, and which components were audited and found to already be compliant.

## Affected Components

| Component | File | Mobile change |
|-----------|------|----------------|
| `ContractTable` | `packages/frontend/src/components/ContractTable.tsx` | Hide Category and Status columns below `sm`; verify action button touch target size |
| `AccountsAdmin` (members table) | `packages/frontend/src/pages/admin/AccountsAdmin.tsx` | Hide Email and Role columns below `sm` |
| `AccountsAdmin` (invitations table) | `packages/frontend/src/pages/admin/AccountsAdmin.tsx` | Hide "Sent at" and "Date" columns below `sm` |
| `AccountsAdmin` (diagnostics section) | `packages/frontend/src/pages/admin/AccountsAdmin.tsx` | `SimpleGrid cols={2}` → `SimpleGrid cols={{ base: 1, sm: 2 }}` (currently does not collapse — confirmed gap) |
| `DeleteAccountModal` | `packages/frontend/src/components/DeleteAccountModal.tsx` | `fullScreen` on phone-sized viewports via `useMediaQuery` |
| `ColumnMappingTable` (used by `ContractImport`) | `packages/frontend/src/components/ColumnMappingTable.tsx` | Audit for overflow; wrap in `Table.ScrollContainer` if needed |
| `NavbarSegmented` / `TopHeader` / `AppShell` | `packages/frontend/src/components/AppShell/*` | Audit only — mobile burger menu and collapsing navbar already implemented (feature 016) |
| `Dashboard`, `SpendingOverview`, `UpcomingRenewals`, `ExpiredContracts` | `packages/frontend/src/{pages,components}/*` | Audit only — already single-column on mobile |
| `ContractForm` | `packages/frontend/src/components/ContractForm.tsx` | Audit only — already collapses via existing `@media (max-width: 48em)` rule |
| `AccountSettings` | `packages/frontend/src/pages/AccountSettings.tsx` | Audit only — already uses `SimpleGrid cols={{ base: 1, sm: 2 }}` |
| `SignIn`, `ForgotPassword`, `ResetPassword`, `AcceptInvitation`, `AuthCard` | `packages/frontend/src/pages/*`, `packages/frontend/src/components/AuthCard.tsx` | Audit only — single centered card layout, expected to already be phone-friendly |
| `Faq` | `packages/frontend/src/pages/Faq.tsx` | Audit only — built with responsive `SimpleGrid` (feature 032) |

## Breakpoint Reference

No new breakpoints are introduced. All work uses Mantine's default theme breakpoints (unmodified in `packages/frontend/src/main.tsx`):

| Token | Width | Role in this feature |
|-------|-------|------------------------|
| `base` | 0px+ | Phone-first default styles |
| `xs` | 576px+ | Secondary phone-range refinement (e.g. `SpendingOverview`'s 3-column stat grid) |
| `sm` | 768px+ | Phone/desktop boundary — column-hiding and form-collapsing threshold used throughout |

## State Flow

No new client or server state is introduced. Existing component state (sort/pagination in `ContractTable`, modal open/close state, form values) is unchanged; only the rendered markup/CSS varies by viewport width via Mantine's `visibleFrom`/`hiddenFrom` props, `SimpleGrid`'s responsive `cols`, and CSS media queries.

## No New Persistent Data

- No new API endpoints
- No new database fields
- No new localStorage keys
- No new shared types in `@pcm/shared`
