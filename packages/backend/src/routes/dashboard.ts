import type { FastifyInstance } from 'fastify';
import { DashboardService } from '../services/dashboard.js';

/**
 * Fastify route plugin for the dashboard data endpoint.
 */

/**
 * Registers the dashboard route under /api/dashboard on the Fastify instance.
 *
 * @param fastify - The Fastify instance to register routes on
 */
export async function dashboardRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/dashboard', async (request, reply) => {
    const service = new DashboardService(fastify.db);
    const data = service.getDashboardData(request.user!.id);
    return reply.send(data);
  });
}
