import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import type { DiagnosticsReport } from '@pcm/shared';
import { buildDiagnosticsReport } from '../services/diagnostics.service.js';

/**
 * Fastify route plugin for the admin-only diagnostics page: a JSON API endpoint and a
 * server-rendered no-JavaScript HTML fallback, both admin-gated and backed by the same
 * `buildDiagnosticsReport()` service function so the two views can never drift out of sync.
 */

/**
 * Sends a 401 Unauthorized response with a standard error body.
 *
 * @param reply - the Fastify reply object
 * @returns the reply after sending the 401 status
 */
function unauthorized(reply: FastifyReply) {
  return reply.status(401).send({
    statusCode: 401,
    error: 'Unauthorized',
    message: 'Authentication required',
  });
}

/**
 * Sends a 403 Forbidden response with a standard error body.
 *
 * @param reply - the Fastify reply object
 * @returns the reply after sending the 403 status
 */
function forbidden(reply: FastifyReply) {
  return reply.status(403).send({
    statusCode: 403,
    error: 'Forbidden',
    message: 'Administrator access required',
  });
}

/**
 * Escapes text for safe inclusion in the hand-written HTML diagnostics document.
 *
 * @param value - the raw string to escape
 * @returns the HTML-escaped string
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Renders a single labeled key/value row for the no-JS diagnostics HTML document.
 *
 * @param label - the human-readable field label
 * @param detail - the value to display
 * @param status - optional check status, rendered as a coloured badge
 * @returns an HTML `<tr>` string
 */
function renderRow(label: string, detail: string, status?: string): string {
  const statusCell = status
    ? `<td class="status status-${escapeHtml(status)}">${escapeHtml(status)}</td>`
    : '<td></td>';
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(detail)}</td>${statusCell}</tr>`;
}

/**
 * Renders the full no-JavaScript diagnostics HTML document from a DiagnosticsReport.
 *
 * @param report - the diagnostics report to render
 * @returns a complete, self-contained HTML document string
 */
function renderDiagnosticsHtml(report: DiagnosticsReport): string {
  const { versions, systemChecks, environmentVariables } = report;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Diagnostics</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem; color: #1a1a1a; }
  h1 { font-size: 1.4rem; }
  h2 { font-size: 1.1rem; margin-top: 2rem; }
  table { border-collapse: collapse; width: 100%; max-width: 720px; }
  th, td { text-align: left; padding: 0.4rem 0.75rem; border-bottom: 1px solid #ddd; }
  th { font-weight: 500; color: #555; width: 40%; }
  .status-ok { color: #1a7f37; }
  .status-warning { color: #9a6700; }
  .status-failed, .status-timed-out { color: #cf222e; }
</style>
</head>
<body>
<h1>Diagnostics</h1>
<p>Generated at ${escapeHtml(report.generatedAt)}</p>

<h2>Versions</h2>
<table>
${renderRow('Application version', versions.appVersion)}
${renderRow('Database version', versions.dbVersion.detail, versions.dbVersion.status)}
${renderRow('Runtime version', versions.runtimeVersion)}
</table>

<h2>System Checks</h2>
<table>
${renderRow('Platform', systemChecks.platform)}
${renderRow('Architecture', systemChecks.architecture)}
${renderRow('Containerized', systemChecks.containerized.detail, systemChecks.containerized.status)}
${renderRow('Reverse proxy detected', systemChecks.reverseProxyDetected.detail, systemChecks.reverseProxyDetected.status)}
${renderRow('Internet access', systemChecks.internetAccess.detail, systemChecks.internetAccess.status)}
${renderRow('DNS resolution', systemChecks.dnsResolution.detail, systemChecks.dnsResolution.status)}
${renderRow('WebSocket support', systemChecks.websocketSupport.detail, systemChecks.websocketSupport.status)}
${renderRow('Server time (UTC)', systemChecks.serverTime.utc)}
${renderRow('Server time (local)', systemChecks.serverTime.local)}
${renderRow('Clock drift', systemChecks.clockDrift.detail, systemChecks.clockDrift.status)}
${renderRow('Domain match', systemChecks.domainMatch.detail, systemChecks.domainMatch.status)}
${renderRow('HTTPS', systemChecks.https.detail, systemChecks.https.status)}
</table>

<h2>Environment Variables</h2>
<table>
${renderRow('SMTP host', environmentVariables.smtpHost.detail, environmentVariables.smtpHost.status)}
${renderRow('SMTP port', environmentVariables.smtpPort.detail, environmentVariables.smtpPort.status)}
${renderRow('SMTP from address', environmentVariables.smtpFrom.detail, environmentVariables.smtpFrom.status)}
${renderRow('SMTP from name', environmentVariables.smtpFromName.detail, environmentVariables.smtpFromName.status)}
${renderRow('Logo.dev configured', environmentVariables.logoDevConfigured.detail, environmentVariables.logoDevConfigured.status)}
</table>
</body>
</html>`;
}

/**
 * Registers the admin diagnostics routes: `GET /api/admin/diagnostics` (JSON) and
 * `GET /admin/diagnostics` (no-JS HTML fallback).
 *
 * @param fastify - the Fastify instance to register routes on
 */
export async function diagnosticsRoutes(fastify: FastifyInstance): Promise<void> {
  fastify.get('/api/admin/diagnostics', {
    onRequest: async (request: FastifyRequest, reply: FastifyReply) => {
      if (request.user?.role !== 'ADMIN') {
        return forbidden(reply);
      }
    },
    handler: async (request, reply) => {
      const report = await buildDiagnosticsReport(fastify.db, request);
      return reply.send(report);
    },
  });

  fastify.get('/admin/diagnostics', {
    onRequest: async (request: FastifyRequest, reply: FastifyReply) => {
      if (!request.user) {
        return unauthorized(reply);
      }
      if (request.user.role !== 'ADMIN') {
        return forbidden(reply);
      }
    },
    handler: async (request, reply) => {
      const report = await buildDiagnosticsReport(fastify.db, request);
      return reply.type('text/html').send(renderDiagnosticsHtml(report));
    },
  });
}
