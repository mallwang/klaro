import type { BillingInterval, SupportedEmailLanguage, SummaryEmailData } from '@pcm/shared';

/**
 * Locale-keyed string maps for every email type sent by the application.
 * Each map uses Record<SupportedEmailLanguage, ...> so TypeScript reports a compile error
 * when a newly added locale is missing from any map.
 */

type EmailContent = { subject: string; text: string; html: string };

function fmtDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(iso));
}

function fmtCurrency(amount: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
}

const billingIntervalLabels: Record<SupportedEmailLanguage, Record<BillingInterval, string>> = {
  en: {
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
    QUARTERLY: 'Quarterly',
    YEARLY: 'Yearly',
    LIFETIME: 'Lifetime',
  },
  de: {
    WEEKLY: 'Wöchentlich',
    MONTHLY: 'Monatlich',
    QUARTERLY: 'Vierteljährlich',
    YEARLY: 'Jährlich',
    LIFETIME: 'Einmalig',
  },
};

function fmtBillingInterval(interval: BillingInterval, locale: SupportedEmailLanguage): string {
  return billingIntervalLabels[locale]?.[interval] ?? interval;
}

// ─── Test email ──────────────────────────────────────────────────────────────

export const testEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { to: string }) => EmailContent
> = {
  en: () => ({
    subject: 'Test email — SMTP configuration check',
    text: 'This is a test email sent from your Klaro app.\n\nIf you received this, your SMTP configuration is working correctly.',
    html: '<p>This is a test email sent from your Klaro app.</p><p>If you received this, your SMTP configuration is working correctly.</p>',
  }),
  de: () => ({
    subject: 'Test-E-Mail — SMTP-Konfigurationsprüfung',
    text: 'Dies ist eine Test-E-Mail aus Ihrer Klaro App.\n\nWenn Sie diese E-Mail erhalten haben, ist Ihre SMTP-Konfiguration korrekt.',
    html: '<p>Dies ist eine Test-E-Mail aus Ihrer Klaro App.</p><p>Wenn Sie diese E-Mail erhalten haben, ist Ihre SMTP-Konfiguration korrekt.</p>',
  }),
};

// ─── Welcome email ────────────────────────────────────────────────────────────

export const welcomeEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { link: string }) => EmailContent
> = {
  en: ({ link }) => ({
    subject: 'Welcome — your account is ready',
    text: `Your account has been activated.\n\nClick the link below to sign in:\n\n${link}\n\nWelcome aboard!`,
    html: `<p>Your account has been activated.</p><p>Click the link below to sign in:</p><p><a href="${link}">${link}</a></p><p>Welcome aboard!</p>`,
  }),
  de: ({ link }) => ({
    subject: 'Willkommen — Ihr Konto ist bereit',
    text: `Ihr Konto wurde aktiviert.\n\nKlicken Sie auf den Link unten, um sich anzumelden:\n\n${link}\n\nWillkommen!`,
    html: `<p>Ihr Konto wurde aktiviert.</p><p>Klicken Sie auf den Link unten, um sich anzumelden:</p><p><a href="${link}">${link}</a></p><p>Willkommen!</p>`,
  }),
};

// ─── Password change email ────────────────────────────────────────────────────

export const passwordChangeEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { link: string }) => EmailContent
> = {
  en: ({ link }) => ({
    subject: 'Your password has been changed',
    text: `Your password was successfully changed.\n\nIf you did not make this change, please contact your administrator immediately.\n\nClick the link below to sign in:\n\n${link}`,
    html: `<p>Your password was successfully changed.</p><p>If you did not make this change, please contact your administrator immediately.</p><p>Click the link below to sign in:</p><p><a href="${link}">${link}</a></p>`,
  }),
  de: ({ link }) => ({
    subject: 'Ihr Passwort wurde geändert',
    text: `Ihr Passwort wurde erfolgreich geändert.\n\nFalls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte sofort Ihren Administrator.\n\nKlicken Sie auf den Link unten, um sich anzumelden:\n\n${link}`,
    html: `<p>Ihr Passwort wurde erfolgreich geändert.</p><p>Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte sofort Ihren Administrator.</p><p>Klicken Sie auf den Link unten, um sich anzumelden:</p><p><a href="${link}">${link}</a></p>`,
  }),
};

// ─── Email change confirmation ────────────────────────────────────────────────

export const emailChangeConfirmationStrings: Record<
  SupportedEmailLanguage,
  (args: { changedAt: string }) => EmailContent
> = {
  en: ({ changedAt }) => {
    const changedDate = fmtDate(changedAt, 'en');
    return {
      subject: 'Your email address has been updated',
      text: `Your email address was successfully changed on ${changedDate}.\n\nIf you did not make this change, please contact your administrator immediately.`,
      html: `<p>Your email address was successfully changed on <strong>${changedDate}</strong>.</p><p>If you did not make this change, please contact your administrator immediately.</p>`,
    };
  },
  de: ({ changedAt }) => {
    const changedDate = fmtDate(changedAt, 'de');
    return {
      subject: 'Ihre E-Mail-Adresse wurde aktualisiert',
      text: `Ihre E-Mail-Adresse wurde am ${changedDate} erfolgreich geändert.\n\nFalls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte sofort Ihren Administrator.`,
      html: `<p>Ihre E-Mail-Adresse wurde am <strong>${changedDate}</strong> erfolgreich geändert.</p><p>Falls Sie diese Änderung nicht vorgenommen haben, kontaktieren Sie bitte sofort Ihren Administrator.</p>`,
    };
  },
};

// ─── Email verification ───────────────────────────────────────────────────────

export const emailVerificationStrings: Record<
  SupportedEmailLanguage,
  (args: { link: string; expiryDate: string }) => EmailContent
> = {
  en: ({ link, expiryDate }) => ({
    subject: 'Verify your new email address',
    text: `You requested an email address change.\n\nClick the link below to confirm your new email address:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not request this change, you can ignore this email.`,
    html: `<p>You requested an email address change.</p><p>Click the link below to confirm your new email address:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not request this change, you can ignore this email.</p>`,
  }),
  de: ({ link, expiryDate }) => ({
    subject: 'Bestätigen Sie Ihre neue E-Mail-Adresse',
    text: `Sie haben eine Änderung Ihrer E-Mail-Adresse angefordert.\n\nKlicken Sie auf den Link unten, um Ihre neue E-Mail-Adresse zu bestätigen:\n\n${link}\n\nDieser Link läuft am ${expiryDate} ab. Er kann nur einmal verwendet werden.\n\nFalls Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail ignorieren.`,
    html: `<p>Sie haben eine Änderung Ihrer E-Mail-Adresse angefordert.</p><p>Klicken Sie auf den Link unten, um Ihre neue E-Mail-Adresse zu bestätigen:</p><p><a href="${link}">${link}</a></p><p>Dieser Link läuft am <strong>${expiryDate}</strong> ab. Er kann nur einmal verwendet werden.</p><p>Falls Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>`,
  }),
};

// ─── Invitation email ─────────────────────────────────────────────────────────

export const invitationEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { link: string; expiryDate: string }) => EmailContent
> = {
  en: ({ link, expiryDate }) => ({
    subject: "You've been invited",
    text: `You've been invited to join the app.\n\nClick the link below to set up your account:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not expect this invitation, you can ignore this email.`,
    html: `<p>You've been invited to join the app.</p><p>Click the link below to set up your account:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not expect this invitation, you can ignore this email.</p>`,
  }),
  de: ({ link, expiryDate }) => ({
    subject: 'Sie wurden eingeladen',
    text: `Sie wurden eingeladen, der App beizutreten.\n\nKlicken Sie auf den Link unten, um Ihr Konto einzurichten:\n\n${link}\n\nDieser Link läuft am ${expiryDate} ab. Er kann nur einmal verwendet werden.\n\nFalls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.`,
    html: `<p>Sie wurden eingeladen, der App beizutreten.</p><p>Klicken Sie auf den Link unten, um Ihr Konto einzurichten:</p><p><a href="${link}">${link}</a></p><p>Dieser Link läuft am <strong>${expiryDate}</strong> ab. Er kann nur einmal verwendet werden.</p><p>Falls Sie diese Einladung nicht erwartet haben, können Sie diese E-Mail ignorieren.</p>`,
  }),
};

// ─── Password reset email ─────────────────────────────────────────────────────

export const passwordResetEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { link: string; expiryDate: string }) => EmailContent
> = {
  en: ({ link, expiryDate }) => ({
    subject: 'Reset your password',
    text: `You requested a password reset.\n\nClick the link below to set a new password:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not request this change, you can ignore this email.`,
    html: `<p>You requested a password reset.</p><p>Click the link below to set a new password:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not request this change, you can ignore this email.</p>`,
  }),
  de: ({ link, expiryDate }) => ({
    subject: 'Passwort zurücksetzen',
    text: `Sie haben eine Passwortzurücksetzung angefordert.\n\nKlicken Sie auf den Link unten, um ein neues Passwort festzulegen:\n\n${link}\n\nDieser Link läuft am ${expiryDate} ab. Er kann nur einmal verwendet werden.\n\nFalls Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail ignorieren.`,
    html: `<p>Sie haben eine Passwortzurücksetzung angefordert.</p><p>Klicken Sie auf den Link unten, um ein neues Passwort festzulegen:</p><p><a href="${link}">${link}</a></p><p>Dieser Link läuft am <strong>${expiryDate}</strong> ab. Er kann nur einmal verwendet werden.</p><p>Falls Sie diese Änderung nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>`,
  }),
};

// ─── Summary email ────────────────────────────────────────────────────────────

type SummaryEmailArgs = Omit<SummaryEmailData, 'userEmail'> & { locale: string };

type SummaryStrings = {
  freqLabel: string;
  greeting: (name: string | undefined) => string;
  intro: (freq: string) => string;
  totalLabel: (amount: string) => string;
  contractHeader: string;
  billingHeader: string;
  monthlyHeader: string;
  noContracts: string;
  expiredTitle: string;
  expiredItem: (name: string, date: string, days: number) => string;
  renewalsTitle: string;
  renewalItem: (name: string, end: string, cancel: string, days: number) => string;
  noRenewals: string;
  ctaNoContracts: (url: string) => string;
  ctaCancellationDue: (url: string) => string;
  dashboardLink: string;
  dashboardFooter: (url: string) => string;
  perMonth: string;
  textExpiredLabel: string;
  textRenewalsLabel: string;
  textExpiredItem: (name: string, date: string) => string;
  textRenewalItem: (name: string, date: string) => string;
  textNoRenewals: string;
  textNoContracts: string;
  settingsFooter: (url: string) => string;
  subjectLine: (freq: string) => string;
};

const summaryStrings: Record<string, SummaryStrings> = {
  en: {
    freqLabel: 'weekly',
    greeting: (name) => (name ? `Hi ${name},` : 'Hi,'),
    intro: (freq) => `Here is your ${freq} contract summary.`,
    totalLabel: (amt) => `Total Monthly Spending: ${amt}`,
    contractHeader: 'Contract',
    billingHeader: 'Billing',
    monthlyHeader: 'Monthly (€)',
    noContracts: 'You have no active contracts.',
    expiredTitle: 'Expired Contracts',
    expiredItem: (name, date, days) =>
      `${name} — expired ${date} (${days} day${days === 1 ? '' : 's'} overdue)`,
    renewalsTitle: 'Upcoming Renewals',
    renewalItem: (name, end, cancel, days) =>
      `${name} — ends ${end} / cancel by ${cancel} (${days} day${days === 1 ? '' : 's'} left)`,
    noRenewals: 'No upcoming renewals in the next 30 days.',
    ctaNoContracts: (url) =>
      `<p><strong>Get started:</strong> Add your first contract to start tracking your spending. <a href="${url}">Go to Dashboard</a></p>`,
    ctaCancellationDue: (url) =>
      `<p><strong>Action required:</strong> One or more contracts are approaching their cancellation deadline. <a href="${url}">Go to Dashboard</a></p>`,
    dashboardLink: 'Go to Dashboard',
    dashboardFooter: (url) =>
      `To change your email frequency or opt out, visit <a href="${url}/account">Account Settings</a>.`,
    perMonth: 'mo',
    textExpiredLabel: 'Expired contracts',
    textRenewalsLabel: 'Upcoming renewals',
    textExpiredItem: (name, date) => `${name} — expired ${date}`,
    textRenewalItem: (name, date) => `${name} — ends ${date}`,
    textNoRenewals: 'No upcoming renewals in the next 30 days.',
    textNoContracts: 'No active contracts.',
    settingsFooter: (url) =>
      `To change your email preferences, visit Account Settings: ${url}/account`,
    subjectLine: (freq) => `Your ${freq} contract summary`,
  },
  de: {
    freqLabel: 'wöchentliche',
    greeting: (name) => (name ? `Hallo ${name},` : 'Hallo,'),
    intro: (freq) => `Hier ist Ihre ${freq} Vertragszusammenfassung.`,
    totalLabel: (amt) => `Gesamte monatliche Ausgaben: ${amt}`,
    contractHeader: 'Vertrag',
    billingHeader: 'Abrechnungsintervall',
    monthlyHeader: 'Monatlich (€)',
    noContracts: 'Sie haben keine aktiven Verträge.',
    expiredTitle: 'Abgelaufene Verträge',
    expiredItem: (name, date, days) =>
      `${name} — abgelaufen am ${date} (${days} Tag${days === 1 ? '' : 'e'} überfällig)`,
    renewalsTitle: 'Bevorstehende Verlängerungen',
    renewalItem: (name, end, cancel, days) =>
      `${name} — endet ${end} / kündigen bis ${cancel} (noch ${days} Tag${days === 1 ? '' : 'e'})`,
    noRenewals: 'Keine bevorstehenden Verlängerungen in den nächsten 30 Tagen.',
    ctaNoContracts: (url) =>
      `<p><strong>Jetzt starten:</strong> Fügen Sie Ihren ersten Vertrag hinzu. <a href="${url}">Zum Dashboard</a></p>`,
    ctaCancellationDue: (url) =>
      `<p><strong>Handlungsbedarf:</strong> Ein oder mehrere Verträge nähern sich ihrem Kündigungstermin. <a href="${url}">Zum Dashboard</a></p>`,
    dashboardLink: 'Zum Dashboard',
    dashboardFooter: (url) =>
      `Um Ihre E-Mail-Einstellungen zu ändern, besuchen Sie <a href="${url}/account">Kontoeinstellungen</a>.`,
    perMonth: 'Monat',
    textExpiredLabel: 'Abgelaufene Verträge',
    textRenewalsLabel: 'Bevorstehende Verlängerungen',
    textExpiredItem: (name, date) => `${name} — abgelaufen am ${date}`,
    textRenewalItem: (name, date) => `${name} — endet ${date}`,
    textNoRenewals: 'Keine bevorstehenden Verlängerungen in den nächsten 30 Tagen.',
    textNoContracts: 'Keine aktiven Verträge.',
    settingsFooter: (url) =>
      `Um Ihre E-Mail-Einstellungen zu ändern, besuchen Sie die Kontoeinstellungen: ${url}/account`,
    subjectLine: (freq) => `Ihre ${freq} Vertragszusammenfassung`,
  },
};

function buildSummaryHtml(data: SummaryEmailArgs): { subject: string; text: string; html: string } {
  const locale = data.locale;
  const s = summaryStrings[locale] ?? summaryStrings['en'] ?? ({} as SummaryStrings);
  const monthlyLabel = locale === 'de' ? 'monatliche' : 'monthly';
  const freqLabel = data.frequency === 'WEEKLY' ? s.freqLabel : monthlyLabel;
  const totalFormatted = fmtCurrency(data.totalMonthlySpending, locale);

  const contractRows = data.contracts
    .map(
      (c) =>
        `<tr><td style="padding:8px 12px;">${c.name}</td><td style="padding:8px 12px;">${fmtBillingInterval(c.billingInterval, locale as SupportedEmailLanguage)}</td><td style="padding:8px 12px;text-align:center;">${fmtCurrency(c.monthlyCost, locale)}</td></tr>`,
    )
    .join('');

  const contractTable =
    data.contracts.length > 0
      ? `<table border="1" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
           <thead><tr>
             <th style="padding:8px 12px;">${s.contractHeader}</th>
             <th style="padding:8px 12px;">${s.billingHeader}</th>
             <th style="padding:8px 12px;text-align:center;">${s.monthlyHeader}</th>
           </tr></thead>
           <tbody>${contractRows}</tbody>
         </table>`
      : `<p>${s.noContracts}</p>`;

  const expiredSection =
    data.expiredContracts.length > 0
      ? `<h3 style="margin-top:1.5em">${s.expiredTitle}</h3><ul>${data.expiredContracts
          .map(
            (e) => `<li>${s.expiredItem(e.name, fmtDate(e.endDate, locale), e.daysOverdue)}</li>`,
          )
          .join('')}</ul>`
      : '';

  const renewalSection =
    data.upcomingRenewals.length > 0
      ? `<h3>${s.renewalsTitle}</h3><ul>${data.upcomingRenewals
          .map(
            (r) =>
              `<li>${s.renewalItem(r.name, fmtDate(r.endDate, locale), fmtDate(r.cancellationDeadline, locale), r.daysUntilDeadline)}</li>`,
          )
          .join('')}</ul>`
      : `<p>${s.noRenewals}</p>`;

  let ctaBlock = '';
  if (data.ctaState === 'no-contracts') {
    ctaBlock = s.ctaNoContracts(data.dashboardUrl);
  } else if (data.ctaState === 'cancellation-due') {
    ctaBlock = s.ctaCancellationDue(data.dashboardUrl);
  }

  const dashboardCta =
    data.ctaState === 'none' ? `<p><a href="${data.dashboardUrl}">${s.dashboardLink}</a></p>` : '';

  const html = `
    <h2>${s.greeting(data.displayName ?? undefined)}</h2>
    <p>${s.intro(freqLabel)}</p>
    <h3>${s.totalLabel(totalFormatted)}</h3>
    ${contractTable}
    ${expiredSection}
    ${renewalSection}
    ${ctaBlock}
    ${dashboardCta}
    <hr/>
    <p style="color:#888;font-size:12px;">${s.dashboardFooter(data.dashboardUrl)}</p>
  `;

  const contractText = data.contracts
    .map(
      (c) =>
        `  ${c.name} | ${fmtBillingInterval(c.billingInterval, locale as SupportedEmailLanguage)} | ${fmtCurrency(c.monthlyCost, locale)}/${s.perMonth}`,
    )
    .join('\n');

  const expiredText =
    data.expiredContracts.length > 0
      ? s.textExpiredLabel +
        ':\n' +
        data.expiredContracts
          .map((e) => `  ${s.textExpiredItem(e.name, fmtDate(e.endDate, locale))}`)
          .join('\n')
      : '';

  const renewalText =
    data.upcomingRenewals.length > 0
      ? s.textRenewalsLabel +
        ':\n' +
        data.upcomingRenewals
          .map((r) => `  ${s.textRenewalItem(r.name, fmtDate(r.endDate, locale))}`)
          .join('\n')
      : s.textNoRenewals;

  const text = [
    s.subjectLine(freqLabel),
    s.totalLabel(totalFormatted),
    contractText || s.textNoContracts,
    expiredText,
    renewalText,
    `Dashboard: ${data.dashboardUrl}`,
    s.settingsFooter(data.dashboardUrl),
  ]
    .filter(Boolean)
    .join('\n\n');

  return { subject: s.subjectLine(freqLabel), text, html };
}

export const summaryEmailStrings: Record<
  SupportedEmailLanguage,
  (args: SummaryEmailArgs) => EmailContent
> = {
  en: (args) => buildSummaryHtml({ ...args, locale: 'en' }),
  de: (args) => buildSummaryHtml({ ...args, locale: 'de' }),
};

// ─── Sign-up verification email ───────────────────────────────────────────────

export const signupVerificationEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { link: string; expiryDate: string }) => EmailContent
> = {
  en: ({ link, expiryDate }) => ({
    subject: 'Confirm your sign-up',
    text: `Thanks for signing up.\n\nClick the link below to confirm your email address:\n\n${link}\n\nThis link expires on ${expiryDate}. It can only be used once.\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>Thanks for signing up.</p><p>Click the link below to confirm your email address:</p><p><a href="${link}">${link}</a></p><p>This link expires on <strong>${expiryDate}</strong>. It can only be used once.</p><p>If you did not request this, you can ignore this email.</p>`,
  }),
  de: ({ link, expiryDate }) => ({
    subject: 'Bestätigen Sie Ihre Anmeldung',
    text: `Vielen Dank für Ihre Anmeldung.\n\nKlicken Sie auf den Link unten, um Ihre E-Mail-Adresse zu bestätigen:\n\n${link}\n\nDieser Link läuft am ${expiryDate} ab. Er kann nur einmal verwendet werden.\n\nFalls Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren.`,
    html: `<p>Vielen Dank für Ihre Anmeldung.</p><p>Klicken Sie auf den Link unten, um Ihre E-Mail-Adresse zu bestätigen:</p><p><a href="${link}">${link}</a></p><p>Dieser Link läuft am <strong>${expiryDate}</strong> ab. Er kann nur einmal verwendet werden.</p><p>Falls Sie dies nicht angefordert haben, können Sie diese E-Mail ignorieren.</p>`,
  }),
};

// ─── Admin sign-up notification email ─────────────────────────────────────────

export const adminSignupNotificationEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { signupEmail: string; link: string }) => EmailContent
> = {
  en: ({ signupEmail, link }) => ({
    subject: 'New sign-up request awaiting approval',
    text: `A new visitor has requested an account: ${signupEmail}\n\nReview and approve or reject the request here:\n\n${link}`,
    html: `<p>A new visitor has requested an account: <strong>${signupEmail}</strong></p><p>Review and approve or reject the request here:</p><p><a href="${link}">${link}</a></p>`,
  }),
  de: ({ signupEmail, link }) => ({
    subject: 'Neue Anmeldeanfrage wartet auf Genehmigung',
    text: `Ein neuer Besucher hat ein Konto angefragt: ${signupEmail}\n\nÜberprüfen und genehmigen oder lehnen Sie die Anfrage hier ab:\n\n${link}`,
    html: `<p>Ein neuer Besucher hat ein Konto angefragt: <strong>${signupEmail}</strong></p><p>Überprüfen und genehmigen oder lehnen Sie die Anfrage hier ab:</p><p><a href="${link}">${link}</a></p>`,
  }),
};

// ─── Sign-up rejection email ───────────────────────────────────────────────────

export const signupRejectionEmailStrings: Record<
  SupportedEmailLanguage,
  (args: { reason: string | undefined }) => EmailContent
> = {
  en: ({ reason }) => {
    const reasonLine = reason ? `The reason given was: ${reason}` : 'No reason was given.';
    return {
      subject: 'Your sign-up request was not approved',
      text: `Your request to create an account was not approved.\n\n${reasonLine}`,
      html: `<p>Your request to create an account was not approved.</p><p>${reasonLine}</p>`,
    };
  },
  de: ({ reason }) => {
    const reasonLine = reason
      ? `Der angegebene Grund war: ${reason}`
      : 'Es wurde kein Grund angegeben.';
    return {
      subject: 'Ihre Anmeldeanfrage wurde nicht genehmigt',
      text: `Ihre Anfrage zur Kontoerstellung wurde nicht genehmigt.\n\n${reasonLine}`,
      html: `<p>Ihre Anfrage zur Kontoerstellung wurde nicht genehmigt.</p><p>${reasonLine}</p>`,
    };
  },
};
