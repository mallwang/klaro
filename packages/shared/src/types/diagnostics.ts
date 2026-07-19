/**
 * TypeScript types for the admin diagnostics report: version info and live system checks.
 */

export type CheckStatus = 'ok' | 'warning' | 'failed' | 'timed-out';

export interface CheckResult {
  status: CheckStatus;
  detail: string;
}

export interface VersionsGroup {
  appVersion: string;
  dbVersion: CheckResult;
  runtimeVersion: string;
}

export interface SystemChecksGroup {
  platform: string;
  architecture: string;
  containerized: CheckResult;
  reverseProxyDetected: CheckResult;
  internetAccess: CheckResult;
  dnsResolution: CheckResult;
  websocketSupport: CheckResult;
  serverTime: { utc: string; local: string };
  clockDrift: CheckResult;
  domainMatch: CheckResult;
  https: CheckResult;
}

export interface EnvironmentVariablesGroup {
  smtpHost: CheckResult;
  smtpPort: CheckResult;
  smtpFrom: CheckResult;
  smtpFromName: CheckResult;
  logoDevConfigured: CheckResult;
}

export interface DiagnosticsReport {
  generatedAt: string;
  versions: VersionsGroup;
  systemChecks: SystemChecksGroup;
  environmentVariables: EnvironmentVariablesGroup;
}
