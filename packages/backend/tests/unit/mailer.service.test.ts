import { describe, it, expect } from 'vitest';
import type { Transporter, SentMessageInfo } from 'nodemailer';
import { MailerService, MailerError } from '../../src/services/mailer.service.js';

/**
 * Shared test helpers for MailerService.
 */

function makeStubTransport(failWith?: Error): Transporter<SentMessageInfo> {
  return {
    sendMail: failWith
      ? (_opts: unknown, cb: (err: Error | null, info: SentMessageInfo | null) => void) => {
          cb(failWith, null);
        }
      : (_opts: unknown, cb: (err: Error | null, info: SentMessageInfo) => void) => {
          cb(null, {
            messageId: 'stub-id',
            envelope: { from: '', to: [] },
            accepted: [],
            rejected: [],
            pending: [],
            response: '',
          });
        },
  } as unknown as Transporter<SentMessageInfo>;
}

function makeCapturingTransport(): {
  transport: Transporter<SentMessageInfo>;
  captured: unknown[];
} {
  const captured: unknown[] = [];
  const transport = {
    sendMail: (opts: unknown, cb: (err: null, info: SentMessageInfo) => void) => {
      captured.push(opts);
      cb(null, {
        messageId: 'x',
        envelope: { from: '', to: [] },
        accepted: [],
        rejected: [],
        pending: [],
        response: '',
      });
    },
  } as unknown as Transporter<SentMessageInfo>;
  return { transport, captured };
}

/**
 * Asserts that exactly one email was captured, sent to the expected recipient, has a non-empty
 * subject, and contains the given string in both plain-text and HTML bodies.
 *
 * @param captured - Array of captured sendMail options collected by makeCapturingTransport
 * @param to - Expected recipient address
 * @param contains - String that must appear in both text and html body fields
 * @returns The captured message object for further assertions
 */
function assertCapturedEmail(
  captured: unknown[],
  to: string,
  contains: string,
): { to: string; subject: string; text: string; html: string } {
  expect(captured).toHaveLength(1);
  const msg = captured[0] as { to: string; subject: string; text: string; html: string };
  expect(msg.to).toBe(to);
  expect(msg.subject).toBeTruthy();
  expect(msg.text).toContain(contains);
  expect(msg.html).toContain(contains);
  return msg;
}

describe('MailerService.sendTestEmail', () => {
  const from = 'noreply@example.test';
  const to = 'admin@example.test';

  it('sends to the correct recipient with a recognizable subject', async () => {
    const { transport, captured } = makeCapturingTransport();

    const mailer = new MailerService({ transport, from });
    await mailer.sendTestEmail(to);

    expect(captured).toHaveLength(1);
    const msg = captured[0] as { to: string; subject: string; text: string };
    expect(msg.to).toBe(to);
    expect(msg.subject).toBeTruthy();
    expect(msg.text).toBeTruthy();
  });

  it('throws a typed MailerError when the transport reports a send failure', async () => {
    const transport = makeStubTransport(new Error('SMTP connection refused'));
    const mailer = new MailerService({ transport, from });

    await expect(mailer.sendTestEmail(to)).rejects.toBeInstanceOf(MailerError);
  });
});

describe('MailerService.sendEmailChangeConfirmationEmail', () => {
  const from = 'noreply@example.test';
  const to = 'newaddress@example.test';
  const changedAt = new Date('2026-06-14T10:00:00.000Z').toISOString();

  it('sends to the correct recipient with the change date in the body', async () => {
    const { transport, captured } = makeCapturingTransport();

    const mailer = new MailerService({ transport, from });
    await mailer.sendEmailChangeConfirmationEmail(to, changedAt);

    assertCapturedEmail(captured, to, '2026-06-14');
  });

  it('throws a typed MailerError when the transport reports a send failure', async () => {
    const transport = makeStubTransport(new Error('SMTP connection refused'));
    const mailer = new MailerService({ transport, from });

    await expect(mailer.sendEmailChangeConfirmationEmail(to, changedAt)).rejects.toBeInstanceOf(
      MailerError,
    );
  });
});

describe('MailerService.sendWelcomeEmail', () => {
  const from = 'noreply@example.test';
  const to = 'newmember@example.test';
  const link = 'http://localhost:5173/sign-in';

  it('sends to the correct recipient with the sign-in link in the body', async () => {
    const { transport, captured } = makeCapturingTransport();

    const mailer = new MailerService({ transport, from });
    await mailer.sendWelcomeEmail(to, link);

    assertCapturedEmail(captured, to, link);
  });

  it('throws a typed MailerError when the transport reports a send failure', async () => {
    const transport = makeStubTransport(new Error('SMTP connection refused'));
    const mailer = new MailerService({ transport, from });

    await expect(mailer.sendWelcomeEmail(to, link)).rejects.toBeInstanceOf(MailerError);
  });
});

describe('MailerService.sendPasswordChangeEmail', () => {
  const from = 'noreply@example.test';
  const to = 'user@example.test';
  const link = 'http://localhost:5173/sign-in';

  it('sends to the correct recipient with the sign-in link in the body', async () => {
    const { transport, captured } = makeCapturingTransport();

    const mailer = new MailerService({ transport, from });
    await mailer.sendPasswordChangeEmail(to, link);

    assertCapturedEmail(captured, to, link);
  });

  it('throws a typed MailerError when the transport reports a send failure', async () => {
    const transport = makeStubTransport(new Error('SMTP connection refused'));
    const mailer = new MailerService({ transport, from });

    await expect(mailer.sendPasswordChangeEmail(to, link)).rejects.toBeInstanceOf(MailerError);
  });
});

describe('MailerService.sendInvitationEmail', () => {
  const from = 'noreply@example.test';
  const to = 'invitee@example.test';
  const link = 'https://app.example.test/invitations/abc123';
  const expiresAt = new Date('2026-06-20T12:00:00.000Z').toISOString();

  it('sends to the correct recipient with the link and expiry in the body', async () => {
    const { transport, captured } = makeCapturingTransport();

    const mailer = new MailerService({ transport, from });
    await mailer.sendInvitationEmail(to, link, expiresAt);

    const msg = assertCapturedEmail(captured, to, link);
    expect(msg.text).toContain('2026-06-20');
    expect(msg.html).toContain('2026-06-20');
  });

  it('throws a typed MailerError when the transport reports a send failure', async () => {
    const transport = makeStubTransport(new Error('SMTP connection refused'));
    const mailer = new MailerService({ transport, from });

    await expect(mailer.sendInvitationEmail(to, link, expiresAt)).rejects.toBeInstanceOf(
      MailerError,
    );
  });

  it('throws MailerError when SMTP config is missing', async () => {
    expect(
      () => new MailerService({ transport: null as Transporter<SentMessageInfo>, from: '' }),
    ).toThrow(MailerError);
  });
});

describe('MailerService.sendSummaryEmail', () => {
  const from = 'noreply@example.test';

  function makeSummaryData(
    overrides: Partial<import('@pcm/shared').SummaryEmailData> = {},
  ): import('@pcm/shared').SummaryEmailData {
    return {
      userEmail: 'user@example.test',
      displayName: 'Test User',
      frequency: 'WEEKLY',
      totalMonthlySpending: 42.5,
      contracts: [
        {
          name: 'Netflix',
          billingInterval: 'MONTHLY',
          monthlyCost: 12.99,
          anonymize: false,
        },
      ],
      upcomingRenewals: [],
      expiredContracts: [],
      ctaState: 'none',
      dashboardUrl: 'http://localhost:5173',
      ...overrides,
    };
  }

  it('subject contains "weekly" for WEEKLY frequency', async () => {
    const { transport, captured } = makeCapturingTransport();
    const mailer = new MailerService({ transport, from });
    await mailer.sendSummaryEmail(makeSummaryData({ frequency: 'WEEKLY' }));
    const msg = captured[0] as { subject: string };
    expect(msg.subject.toLowerCase()).toContain('weekly');
  });

  it('subject contains "monthly" for MONTHLY frequency', async () => {
    const { transport, captured } = makeCapturingTransport();
    const mailer = new MailerService({ transport, from });
    await mailer.sendSummaryEmail(makeSummaryData({ frequency: 'MONTHLY' }));
    const msg = captured[0] as { subject: string };
    expect(msg.subject.toLowerCase()).toContain('monthly');
  });

  it('HTML contains the total spending value', async () => {
    const { transport, captured } = makeCapturingTransport();
    const mailer = new MailerService({ transport, from });
    await mailer.sendSummaryEmail(makeSummaryData({ totalMonthlySpending: 42.5 }));
    const msg = captured[0] as { html: string };
    expect(msg.html).toContain('42.50');
  });

  it('HTML contains the dashboard URL', async () => {
    const { transport, captured } = makeCapturingTransport();
    const mailer = new MailerService({ transport, from });
    await mailer.sendSummaryEmail(makeSummaryData({ dashboardUrl: 'http://localhost:5173' }));
    const msg = captured[0] as { html: string };
    expect(msg.html).toContain('http://localhost:5173');
  });

  it('HTML contains a no-contracts CTA when ctaState is no-contracts', async () => {
    const { transport, captured } = makeCapturingTransport();
    const mailer = new MailerService({ transport, from });
    await mailer.sendSummaryEmail(
      makeSummaryData({ ctaState: 'no-contracts', contracts: [], totalMonthlySpending: 0 }),
    );
    const msg = captured[0] as { html: string };
    expect(msg.html.toLowerCase()).toMatch(/add.*contract|first contract|get started/i);
  });

  it('HTML contains a cancellation-due CTA when ctaState is cancellation-due', async () => {
    const { transport, captured } = makeCapturingTransport();
    const mailer = new MailerService({ transport, from });
    await mailer.sendSummaryEmail(
      makeSummaryData({
        ctaState: 'cancellation-due',
        upcomingRenewals: [
          {
            name: 'Gym',
            endDate: '2026-06-30',
            cancellationDeadline: '2026-06-20',
            daysUntilDeadline: 5,
            anonymize: false,
          },
        ],
      }),
    );
    const msg = captured[0] as { html: string };
    expect(msg.html.toLowerCase()).toMatch(/cancel|deadline|review/i);
  });

  it('HTML does not contain anonymized contract name', async () => {
    const { transport, captured } = makeCapturingTransport();
    const mailer = new MailerService({ transport, from });
    await mailer.sendSummaryEmail(
      makeSummaryData({
        contracts: [
          {
            name: '––––',
            billingInterval: 'MONTHLY',
            monthlyCost: 9.99,
            anonymize: true,
          },
        ],
      }),
    );
    const msg = captured[0] as { html: string };
    expect(msg.html).not.toContain('Secret');
    expect(msg.html).toContain('––––');
  });
});

describe('MailerService.sendPasswordResetEmail', () => {
  const from = 'noreply@example.test';
  const to = 'user@example.test';
  const link = 'https://example.test/reset-password/abc123';
  const expiresAt = '2026-06-14T19:00:00.000Z';

  it('sends to the correct recipient with the link and expiry in the body', async () => {
    const { transport, captured } = makeCapturingTransport();

    const mailer = new MailerService({ transport, from });
    await mailer.sendPasswordResetEmail(to, link, expiresAt);

    const msg = assertCapturedEmail(captured, to, link);
    expect(msg.text).toContain('2026-06-14');
    expect(msg.html).toContain('2026-06-14');
  });

  it('throws a typed MailerError when the transport reports a send failure', async () => {
    const transport = makeStubTransport(new Error('SMTP connection refused'));
    const mailer = new MailerService({ transport, from });

    await expect(mailer.sendPasswordResetEmail(to, link, expiresAt)).rejects.toBeInstanceOf(
      MailerError,
    );
  });
});
