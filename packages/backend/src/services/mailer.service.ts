import nodemailer, { type Transporter, type SentMessageInfo } from 'nodemailer';
import type { SummaryEmailData } from '@pcm/shared';

/**
 * Email delivery service wrapping a Nodemailer transporter with typed, purpose-specific
 * send methods.
 */

export class MailerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MailerError';
  }
}

export interface MailerOptions {
  transport: Transporter<SentMessageInfo>;
  from: string;
}

export class MailerService {
  private readonly transport: Transporter<SentMessageInfo>;
  private readonly from: string;

  constructor(opts: MailerOptions) {
    if (!opts.transport || !opts.from) {
      throw new MailerError('SMTP configuration is missing (SMTP_HOST, SMTP_FROM required)');
    }
    this.transport = opts.transport;
    this.from = opts.from;
  }

  /**
   * Constructs a MailerService from SMTP environment variables.
   *
   * @returns A configured MailerService instance
   * @throws {MailerError} If SMTP_HOST or SMTP_FROM are not set
   */
  static fromEnv(): MailerService {
    const host = process.env['SMTP_HOST'];
    const port = parseInt(process.env['SMTP_PORT'] ?? '587');
    const user = process.env['SMTP_USER'];
    const pass = process.env['SMTP_PASSWORD'];
    const fromAddress = process.env['SMTP_FROM'] ?? '';
    const fromName = process.env['SMTP_FROM_NAME'];
    const from = fromName ? `"${fromName}" <${fromAddress}>` : fromAddress;

    if (!host || !from) {
      throw new MailerError('SMTP configuration is missing (SMTP_HOST, SMTP_FROM required)');
    }

    const transport = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: user && pass ? { user, pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 15_000,
    });

    return new MailerService({ transport, from });
  }

  /**
   * Dispatches an email through the configured transport.
   *
   * @param opts - Recipient address, subject line, plain-text body, and HTML body
   */
  private async send(opts: {
    to: string;
    subject: string;
    text: string;
    html: string;
  }): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, ...opts }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }

  /**
   * Sends a test email to verify SMTP configuration is working.
   *
   * @param to - The recipient email address
   */
  async sendTestEmail(to: string): Promise<void> {
    const subject = 'Test email — SMTP configuration check';
    const text = `This is a test email sent from your Personal Contract Management app.\n\nIf you received this, your SMTP configuration is working correctly.`;
    const html = `<p>This is a test email sent from your Personal Contract Management app.</p><p>If you received this, your SMTP configuration is working correctly.</p>`;
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends an account-activation confirmation email with a sign-in link.
   *
   * @param to - The recipient email address
   * @param link - The URL the user should visit to sign in
   */
  async sendWelcomeEmail(to: string, link: string): Promise<void> {
    const subject = 'Welcome — your account is ready';
    const text = `Your account has been activated.\n\nClick the link below to sign in:\n\n${link}\n\nWelcome aboard!`;
    const html = `<p>Your account has been activated.</p><p>Click the link below to sign in:</p><p><a href="${link}">${link}</a></p><p>Welcome aboard!</p>`;
    await this.send({ to, subject, text, html });
  }

  /**
   * Notifies the user that their password was changed and provides a sign-in link.
   *
   * @param to - The recipient email address
   * @param link - The URL the user should visit to sign in
   */
  async sendPasswordChangeEmail(to: string, link: string): Promise<void> {
    const subject = 'Your password has been changed';
    const text = `Your password was successfully changed.\n\nIf you did not make this change, please contact your administrator immediately.\n\nClick the link below to sign in:\n\n${link}`;
    const html = `<p>Your password was successfully changed.</p><p>If you did not make this change, please contact your administrator immediately.</p><p>Click the link below to sign in:</p><p><a href="${link}">${link}</a></p>`;
    await this.send({ to, subject, text, html });
  }

  /**
   * Notifies the old email address that the account email was successfully updated.
   *
   * @param to - The old (previous) email address to notify
   * @param changedAt - ISO timestamp of when the change was confirmed
   */
  async sendEmailChangeConfirmationEmail(to: string, changedAt: string): Promise<void> {
    const changedDate = new Date(changedAt).toISOString().slice(0, 10);
    const subject = 'Your email address has been updated';
    const text = `Your email address was successfully changed on ${changedDate}.\n\nIf you did not make this change, please contact your administrator immediately.`;
    const html = `<p>Your email address was successfully changed on <strong>${changedDate}</strong>.</p><p>If you did not make this change, please contact your administrator immediately.</p>`;
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends the email-change verification link to the new email address.
   *
   * @param to - The new email address that must be verified
   * @param link - The one-time verification URL
   * @param expiresAt - ISO timestamp after which the verification link is no longer valid
   */
  async sendEmailVerificationEmail(to: string, link: string, expiresAt: string): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const subject = 'Verify your new email address';
    const text = `You requested an email address change.\n\nClick the link below to confirm your new email address:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not request this change, you can ignore this email.`;
    const html = `<p>You requested an email address change.</p><p>Click the link below to confirm your new email address:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not request this change, you can ignore this email.</p>`;
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends an invitation email with a one-time account setup link.
   *
   * @param to - The invited email address
   * @param link - The one-time invitation URL
   * @param expiresAt - ISO timestamp after which the invitation link is no longer valid
   */
  async sendInvitationEmail(to: string, link: string, expiresAt: string): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const subject = "You've been invited";
    const text = `You've been invited to join the app.\n\nClick the link below to set up your account:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not expect this invitation, you can ignore this email.`;
    const html = `<p>You've been invited to join the app.</p><p>Click the link below to set up your account:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not expect this invitation, you can ignore this email.</p>`;
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends a periodic contract summary email to the given user.
   *
   * @param data - The summary payload assembled for this user including spending totals,
   *   contract rows, upcoming renewals, CTA state, and the dashboard URL
   */
  async sendSummaryEmail(data: SummaryEmailData): Promise<void> {
    const freqLabel = data.frequency === 'WEEKLY' ? 'weekly' : 'monthly';
    const subject = `Your ${freqLabel} contract summary`;

    const totalFormatted = data.totalMonthlySpending.toFixed(2);

    const contractRows = data.contracts
      .map(
        (c) =>
          `<tr><td>${c.name}</td><td>${c.billingInterval}</td><td>${c.monthlyCost.toFixed(2)}</td></tr>`,
      )
      .join('');

    const contractTable =
      data.contracts.length > 0
        ? `<table border="1" cellpadding="4" cellspacing="0">
             <thead><tr><th>Contract</th><th>Billing</th><th>Monthly (€)</th></tr></thead>
             <tbody>${contractRows}</tbody>
           </table>`
        : '<p>You have no active contracts.</p>';

    const renewalSection =
      data.upcomingRenewals.length > 0
        ? `<h3>Upcoming Renewals</h3><ul>${data.upcomingRenewals
            .map(
              (r) => `<li>${r.name} — ends ${r.endDate} (deadline: ${r.cancellationDeadline})</li>`,
            )
            .join('')}</ul>`
        : '<p>No upcoming renewals in the next 30 days.</p>';

    const ctaBlock =
      data.ctaState === 'no-contracts'
        ? `<p><strong>Get started:</strong> Add your first contract to start tracking your spending. <a href="${data.dashboardUrl}">Go to Dashboard</a></p>`
        : data.ctaState === 'cancellation-due'
          ? `<p><strong>Action required:</strong> One or more contracts are approaching their cancellation deadline — review them before the deadline passes. <a href="${data.dashboardUrl}">Go to Dashboard</a></p>`
          : '';

    const html = `
      <h2>${data.displayName ? `Hi ${data.displayName},` : 'Hi,'}</h2>
      <p>Here is your ${freqLabel} contract summary.</p>
      <h3>Total Monthly Spending: ${totalFormatted}</h3>
      ${contractTable}
      ${renewalSection}
      ${ctaBlock}
      <p><a href="${data.dashboardUrl}">Go to Dashboard</a></p>
      <hr/>
      <p style="color:#888;font-size:12px;">To change your email frequency or opt out, visit Account Settings.</p>
    `;

    const contractText = data.contracts
      .map((c) => `  ${c.name} | ${c.billingInterval} | ${c.monthlyCost.toFixed(2)}/mo`)
      .join('\n');

    const renewalText =
      data.upcomingRenewals.length > 0
        ? `Upcoming renewals:\n${data.upcomingRenewals.map((r) => `  ${r.name} ends ${r.endDate}`).join('\n')}`
        : 'No upcoming renewals in the next 30 days.';

    const ctaText =
      data.ctaState === 'no-contracts'
        ? 'Get started: Add your first contract — ' + data.dashboardUrl
        : data.ctaState === 'cancellation-due'
          ? 'Action required: Review contracts approaching their cancellation deadline — ' +
            data.dashboardUrl
          : '';

    const text = [
      `Your ${freqLabel} contract summary`,
      `Total monthly spending: ${totalFormatted}`,
      contractText || 'No active contracts.',
      renewalText,
      ctaText,
      `Dashboard: ${data.dashboardUrl}`,
      'To change your email preferences, visit Account Settings.',
    ]
      .filter(Boolean)
      .join('\n\n');

    await this.send({ to: data.userEmail, subject, text, html });
  }

  /**
   * Sends a password reset link to the user's email address.
   *
   * @param to - The recipient email address
   * @param link - The one-time password reset URL
   * @param expiresAt - ISO timestamp after which the reset link is no longer valid
   */
  async sendPasswordResetEmail(to: string, link: string, expiresAt: string): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const subject = 'Reset your password';
    const text = `You requested a password reset.\n\nClick the link below to set a new password:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not request this change, you can ignore this email.`;
    const html = `<p>You requested a password reset.</p><p>Click the link below to set a new password:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not request this change, you can ignore this email.</p>`;
    await this.send({ to, subject, text, html });
  }
}
