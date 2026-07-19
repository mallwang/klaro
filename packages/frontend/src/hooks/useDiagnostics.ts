import { useQuery } from '@tanstack/react-query';
import type { DiagnosticsReport } from '@pcm/shared';
import { fetchDiagnostics } from '../services/diagnostics.js';

/**
 * TanStack Query hook for the admin diagnostics report.
 */

export const DIAGNOSTICS_QUERY_KEY = ['diagnostics'];

/**
 * Returns a TanStack Query result for the admin diagnostics report.
 */
export function useDiagnostics() {
  return useQuery<DiagnosticsReport>({
    queryKey: DIAGNOSTICS_QUERY_KEY,
    queryFn: fetchDiagnostics,
  });
}
