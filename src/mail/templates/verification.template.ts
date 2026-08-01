import { renderEmailLayout } from './email-layout';

export type VerificationEmailOptions = {
  email: string;
  code: string;
  name?: string;
};

export function renderVerificationEmail(options: VerificationEmailOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = options.name ? `Hello ${options.name},` : 'Hello,';
  const subject = 'CodeSpace — Verify your email address';

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-align: center;">Verify your email address</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #94a3b8;">
      ${greeting} Welcome to CodeSpace! Use the verification code below to confirm your account and complete registration.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background-color: #0b0f19; border: 1px solid #334155; border-radius: 12px; padding: 20px 36px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #64748b; display: block; margin-bottom: 8px;">Verification Code</span>
        <span style="letter-spacing: 8px; font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; color: #38bdf8;">${options.code}</span>
      </div>
    </div>

    <!-- ALERT NOTICE BOX -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #0f172a; border-left: 4px solid #6366f1; border-radius: 6px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; line-height: 20px; color: #94a3b8;">
            <strong style="color: #cbd5e1;">⏱️ Expiration Notice:</strong> This code will expire in <strong style="color: #f8fafc;">15 minutes</strong>. If you did not sign up for a CodeSpace account, you can safely ignore this email.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b;">
      Need help? Reach out to our team at <a href="mailto:support@codespace.dev" style="color: #818cf8; text-decoration: underline;">support@codespace.dev</a>.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    previewText: `Your verification code is ${options.code}`,
    content,
  });

  const text = `${greeting}\n\nYour CodeSpace email verification code is: ${options.code}\n\nThis code expires in 15 minutes. If you did not create a CodeSpace account, you can safely ignore this email.\n\n— CodeSpace Team`;

  return { subject, html, text };
}
