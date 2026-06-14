import nodemailer, { type Transporter, type SentMessageInfo } from 'nodemailer';

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

  async sendTestEmail(to: string): Promise<void> {
    const subject = 'Test email — SMTP configuration check';
    const text = `This is a test email sent from your Personal Contract Management app.\n\nIf you received this, your SMTP configuration is working correctly.`;
    const html = `<p>This is a test email sent from your Personal Contract Management app.</p><p>If you received this, your SMTP configuration is working correctly.</p>`;

    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, to, subject, text, html }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }

  async sendWelcomeEmail(to: string, link: string): Promise<void> {
    const subject = 'Welcome — your account is ready';
    const text = `Your account has been activated.\n\nClick the link below to sign in:\n\n${link}\n\nWelcome aboard!`;
    const html = `<p>Your account has been activated.</p><p>Click the link below to sign in:</p><p><a href="${link}">${link}</a></p><p>Welcome aboard!</p>`;

    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, to, subject, text, html }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }

  async sendPasswordChangeEmail(to: string, link: string): Promise<void> {
    const subject = 'Your password has been changed';
    const text = `Your password was successfully changed.\n\nIf you did not make this change, please contact your administrator immediately.\n\nClick the link below to sign in:\n\n${link}`;
    const html = `<p>Your password was successfully changed.</p><p>If you did not make this change, please contact your administrator immediately.</p><p>Click the link below to sign in:</p><p><a href="${link}">${link}</a></p>`;

    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, to, subject, text, html }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }

  async sendEmailChangeConfirmationEmail(to: string, changedAt: string): Promise<void> {
    const changedDate = new Date(changedAt).toISOString().slice(0, 10);
    const subject = 'Your email address has been updated';
    const text = `Your email address was successfully changed on ${changedDate}.\n\nIf you did not make this change, please contact your administrator immediately.`;
    const html = `<p>Your email address was successfully changed on <strong>${changedDate}</strong>.</p><p>If you did not make this change, please contact your administrator immediately.</p>`;

    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, to, subject, text, html }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }

  async sendEmailVerificationEmail(to: string, link: string, expiresAt: string): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const subject = 'Verify your new email address';
    const text = `You requested an email address change.\n\nClick the link below to confirm your new email address:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not request this change, you can ignore this email.`;
    const html = `<p>You requested an email address change.</p><p>Click the link below to confirm your new email address:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not request this change, you can ignore this email.</p>`;

    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, to, subject, text, html }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }

  async sendInvitationEmail(to: string, link: string, expiresAt: string): Promise<void> {
    const expiryDate = new Date(expiresAt).toISOString().slice(0, 10);
    const subject = "You've been invited";
    const text = `You've been invited to join the app.\n\nClick the link below to set up your account:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not expect this invitation, you can ignore this email.`;
    const html = `<p>You've been invited to join the app.</p><p>Click the link below to set up your account:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not expect this invitation, you can ignore this email.</p>`;

    await new Promise<void>((resolve, reject) => {
      this.transport.sendMail({ from: this.from, to, subject, text, html }, (err) => {
        if (err) reject(new MailerError(err.message));
        else resolve();
      });
    });
  }
}
