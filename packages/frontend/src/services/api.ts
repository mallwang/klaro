import { useQuery } from '@tanstack/react-query';
import { DashboardResponseSchema, type DashboardResponse } from '@pcm/shared';

/**
 * TanStack Query hook for fetching dashboard aggregation data from the backend.
 */

/**
 * Fetches the dashboard payload from the API and validates it against the shared schema.
 *
 * @returns The parsed DashboardResponse
 */
async function fetchDashboard(): Promise<DashboardResponse> {
  const res = await fetch('/api/dashboard');
  if (!res.ok) throw new Error('Failed to fetch dashboard data');
  const json: unknown = await res.json();
  return DashboardResponseSchema.parse(json);
}

/**
 * Returns a TanStack Query result for the dashboard aggregations, refreshed every 30 s.
 */
export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 30_000,
  });
}
