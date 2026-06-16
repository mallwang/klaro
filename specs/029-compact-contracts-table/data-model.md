# Data Model: Compact Contracts Table

**Branch**: `029-compact-contracts-table` | **Date**: 2026-06-16

## Overview

This feature is purely presentational. No data model changes are required. The existing `ContractData` type from `@pcm/shared` is unchanged. No new entities, fields, or state transitions are introduced.

## Affected Component Props

`ContractTable` props are unchanged:

| Prop | Type | Description |
|------|------|-------------|
| `contracts` | `ContractData[]` | Array of contracts to display — unchanged |
| `onDelete` | `(id: string) => void` | Delete callback — unchanged |
| `isAnonymized` | `boolean` (optional) | Global anonymization toggle — unchanged |
| `getDisplayName` | `(c: ContractData) => string` (optional) | Fantasy name resolver — unchanged |

## Visual State Machine (unchanged)

Each row has two states:

```
DEFAULT ──(click Delete)──▶ PENDING_DELETE
PENDING_DELETE ──(click Cancel)──▶ DEFAULT
PENDING_DELETE ──(click Confirm)──▶ [calls onDelete, row removed]
```

The state variable (`pendingDeleteId`) and transitions are unchanged. Only the button visual styles change.
