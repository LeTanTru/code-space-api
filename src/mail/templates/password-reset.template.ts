import { renderEmailLayout } from './email-layout';

export type PasswordResetEmailOptions = {
  email: string;
  code: string;
  name?: string;
};

export function renderPasswordResetEmail(options: PasswordResetEmailOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const greeting = options.name ? `Hello ${options.name},` : 'Hello,';
  const subject = 'CodeSpace — Password reset request';

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px; text-align: center;">Password Reset Request</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #94a3b8;">
      ${greeting} We received a request to reset the password for your CodeSpace account associated with <strong style="color: #f1f5f9;">${options.email}</strong>.
    </p>

    <div style="text-align: center; margin: 32px 0;">
      <div style="display: inline-block; background-color: #0b0f19; border: 1px solid #334155; border-radius: 12px; padding: 20px 36px; box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);">
        <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #64748b; display: block; margin-bottom: 8px;">Reset Passcode</span>
        <span style="letter-spacing: 8px; font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace; font-size: 34px; font-weight: 800; color: #f43f5e;">${options.code}</span>
      </div>
    </div>

    <!-- ALERT WARNING BOX -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #1e1b4b; border-left: 4px solid #f43f5e; border-radius: 6px; margin-bottom: 24px;">
      <tr>
        <td style="padding: 16px;">
          <p style="margin: 0; font-size: 13px; line-height: 20px; color: #cbd5e1;">
            <strong style="color: #f43f5e;">🔒 Security Warning:</strong> This passcode expires in <strong style="color: #ffffff;">15 minutes</strong>. Never share this code with anyone. CodeSpace support will never ask for your reset code.
          </p>
        </td>
      </tr>
    </table>

    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b;">
      If you did not request a password reset, you can safely disregard this email. Your password will remain unchanged.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    previewText: `Your password reset code is ${options.code}`,
    content,
  });

  const text = `${greeting}\n\nYour CodeSpace password reset code is: ${options.code}\n\nThis code expires in 15 minutes. If you did not request a password reset, you can safely ignore this email.\n\n— CodeSpace Team`;

  return { subject, html, text };
}
