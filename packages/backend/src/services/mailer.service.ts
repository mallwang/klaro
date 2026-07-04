import nodemailer, { type Transporter, type SentMessageInfo } from 'nodemailer';
import type { SummaryEmailData, SupportedEmailLanguage } from '@pcm/shared';
import { SUPPORTED_EMAIL_LANGUAGES } from '@pcm/shared';
import {
  testEmailStrings,
  welcomeEmailStrings,
  passwordChangeEmailStrings,
  emailChangeConfirmationStrings,
  emailVerificationStrings,
  invitationEmailStrings,
  passwordResetEmailStrings,
  summaryEmailStrings,
  signupVerificationEmailStrings,
  adminSignupNotificationEmailStrings,
  signupRejectionEmailStrings,
} from './mailer.strings.js';

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
    const port = Number.parseInt(process.env['SMTP_PORT'] ?? '587', 10);
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
   * Resolves a locale string to a supported email language, falling back to 'en' with a
   * warning when the stored value is no longer in the supported set (e.g. after a downgrade).
   *
   * @param locale - The locale code to resolve
   * @returns A guaranteed-valid SupportedEmailLanguage
   */
  private resolveLocale(locale: string): SupportedEmailLanguage {
    if ((SUPPORTED_EMAIL_LANGUAGES as readonly string[]).includes(locale)) {
      return locale as SupportedEmailLanguage;
    }
    console.warn(`[mailer] Unknown email locale "${locale}", falling back to "en"`);
    return 'en';
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
    const { subject, text, html } = testEmailStrings['en']({ to });
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends an account-activation confirmation email with a sign-in link.
   *
   * @param to - The recipient email address
   * @param link - The URL the user should visit to sign in
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendWelcomeEmail(to: string, link: string, locale: string = 'en'): Promise<void> {
    const { subject, text, html } = welcomeEmailStrings[this.resolveLocale(locale)]({ link });
    await this.send({ to, subject, text, html });
  }

  /**
   * Notifies the user that their password was changed and provides a sign-in link.
   *
   * @param to - The recipient email address
   * @param link - The URL the user should visit to sign in
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendPasswordChangeEmail(to: string, link: string, locale: string = 'en'): Promise<void> {
    const { subject, text, html } = passwordChangeEmailStrings[this.resolveLocale(locale)]({
      link,
    });
    await this.send({ to, subject, text, html });
  }

  /**
   * Notifies the old email address that the account email was successfully updated.
   *
   * @param to - The old (previous) email address to notify
   * @param changedAt - ISO timestamp of when the change was confirmed
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendEmailChangeConfirmationEmail(
    to: string,
    changedAt: string,
    locale: string = 'en',
  ): Promise<void> {
    const { subject, text, html } = emailChangeConfirmationStrings[this.resolveLocale(locale)]({
      changedAt,
    });
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends the email-change verification link to the new email address.
   *
   * @param to - The new email address that must be verified
   * @param link - The one-time verification URL
   * @param expiresAt - ISO timestamp after which the verification link is no longer valid
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendEmailVerificationEmail(
    to: string,
    link: string,
    expiresAt: string,
    locale: string = 'en',
  ): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const { subject, text, html } = emailVerificationStrings[this.resolveLocale(locale)]({
      link,
      expiryDate,
    });
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends an invitation email with a one-time account setup link.
   *
   * @param to - The invited email address
   * @param link - The one-time invitation URL
   * @param expiresAt - ISO timestamp after which the invitation link is no longer valid
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendInvitationEmail(
    to: string,
    link: string,
    expiresAt: string,
    locale: string = 'en',
  ): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const { subject, text, html } = invitationEmailStrings[this.resolveLocale(locale)]({
      link,
      expiryDate,
    });
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends a periodic contract summary email to the given user.
   *
   * @param data - The summary payload assembled for this user including spending totals,
   *   contract rows, upcoming renewals, CTA state, and the dashboard URL
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendSummaryEmail(data: SummaryEmailData, locale: string = 'en'): Promise<void> {
    const resolvedLocale = this.resolveLocale(locale);
    const { userEmail, ...rest } = data;
    const { subject, text, html } = summaryEmailStrings[resolvedLocale]({
      ...rest,
      locale: resolvedLocale,
    });
    await this.send({ to: userEmail, subject, text, html });
  }

  /**
   * Sends a password reset link to the user's email address.
   *
   * @param to - The recipient email address
   * @param link - The one-time password reset URL
   * @param expiresAt - ISO timestamp after which the reset link is no longer valid
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendPasswordResetEmail(
    to: string,
    link: string,
    expiresAt: string,
    locale: string = 'en',
  ): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const { subject, text, html } = passwordResetEmailStrings[this.resolveLocale(locale)]({
      link,
      expiryDate,
    });
    await this.send({ to, subject, text, html });
  }

  /**
   * Sends the sign-up verification link to a newly submitted address.
   *
   * @param to - The submitted email address that must be verified
   * @param link - The one-time verification URL
   * @param expiresAt - ISO timestamp after which the verification link is no longer valid
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendSignupVerificationEmail(
    to: string,
    link: string,
    expiresAt: string,
    locale: string = 'en',
  ): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const { subject, text, html } = signupVerificationEmailStrings[this.resolveLocale(locale)]({
      link,
      expiryDate,
    });
    await this.send({ to, subject, text, html });
  }

  /**
   * Notifies an administrator that a new sign-up request is awaiting review.
   *
   * @param to - The administrator's email address
   * @param signupEmail - The email address of the visitor requesting an account
   * @param link - The URL to the admin accounts page
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendAdminSignupNotificationEmail(
    to: string,
    signupEmail: string,
    link: string,
    locale: string = 'en',
  ): Promise<void> {
    const { subject, text, html } = adminSignupNotificationEmailStrings[this.resolveLocale(locale)](
      { signupEmail, link },
    );
    await this.send({ to, subject, text, html });
  }

  /**
   * Notifies a requester that their sign-up request was rejected, stating the reason or that
   * none was given.
   *
   * @param to - The requester's email address
   * @param reason - The rejecting admin's free-text reason, if any
   * @param locale - The locale to use for the email content; defaults to 'en'
   */
  async sendSignupRejectionEmail(
    to: string,
    reason: string | undefined,
    locale: string = 'en',
  ): Promise<void> {
    const { subject, text, html } = signupRejectionEmailStrings[this.resolveLocale(locale)]({
      reason,
    });
    await this.send({ to, subject, text, html });
  }
}
