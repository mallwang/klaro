import { z } from 'zod';

/**
 * Zod schemas for the admin diagnostics report, mirroring the DiagnosticsReport TypeScript
 * shape in `types/diagnostics.ts`, used to validate the response on the frontend.
 */

const CheckStatusEnum = z.enum(['ok', 'warning', 'failed', 'timed-out']);

export const CheckResultSchema = z.object({
  status: CheckStatusEnum,
  detail: z.string(),
});

export const VersionsGroupSchema = z.object({
  appVersion: z.string(),
  dbVersion: CheckResultSchema,
  runtimeVersion: z.string(),
});

export const SystemChecksGroupSchema = z.object({
  platform: z.string(),
  architecture: z.string(),
  containerized: CheckResultSchema,
  reverseProxyDetected: CheckResultSchema,
  internetAccess: CheckResultSchema,
  dnsResolution: CheckResultSchema,
  websocketSupport: CheckResultSchema,
  serverTime: z.object({ utc: z.string(), local: z.string() }),
  clockDrift: CheckResultSchema,
  domainMatch: CheckResultSchema,
  https: CheckResultSchema,
});

export const EnvironmentVariablesGroupSchema = z.object({
  smtpHost: CheckResultSchema,
  smtpPort: CheckResultSchema,
  smtpFrom: CheckResultSchema,
  smtpFromName: CheckResultSchema,
  logoDevConfigured: CheckResultSchema,
});

export const DiagnosticsReportSchema = z.object({
  generatedAt: z.string(),
  versions: VersionsGroupSchema,
  systemChecks: SystemChecksGroupSchema,
  environmentVariables: EnvironmentVariablesGroupSchema,
});

export type CheckResultParsed = z.infer<typeof CheckResultSchema>;
export type DiagnosticsReportParsed = z.infer<typeof DiagnosticsReportSchema>;
