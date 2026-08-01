import { renderEmailLayout } from './email-layout';

export type WelcomeEmailOptions = {
  email: string;
  name: string;
};

export function renderWelcomeEmail(options: WelcomeEmailOptions): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'Welcome to CodeSpace — Your Multi-Terminal Workspace!';

  const content = `
    <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; text-align: center;">Welcome to CodeSpace, ${options.name}! 🚀</h1>
    <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #94a3b8;">
      We're thrilled to have you on board! CodeSpace is built to streamline your developer workflow with high-performance multi-terminal management, seamless SSH profiles, and desktop workspace control.
    </p>

    <!-- FEATURE GRID -->
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom: 32px;">
      <tr>
        <td style="padding: 16px; background-color: #0f172a; border-radius: 10px; border: 1px solid #1e293b; margin-bottom: 12px; display: block;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="40" style="vertical-align: top;">
                <span style="font-size: 22px;">⚡</span>
              </td>
              <td>
                <strong style="color: #f8fafc; font-size: 15px; display: block; margin-bottom: 4px;">Multi-Terminal Grid</strong>
                <span style="color: #94a3b8; font-size: 13px; line-height: 18px;">Split, organize, and control multiple local shell sessions in one unified window.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="height: 10px;"></td>
      </tr>
      <tr>
        <td style="padding: 16px; background-color: #0f172a; border-radius: 10px; border: 1px solid #1e293b; margin-bottom: 12px; display: block;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="40" style="vertical-align: top;">
                <span style="font-size: 22px;">🔑</span>
              </td>
              <td>
                <strong style="color: #f8fafc; font-size: 15px; display: block; margin-bottom: 4px;">Remote SSH Connections</strong>
                <span style="color: #94a3b8; font-size: 13px; line-height: 18px;">Manage servers, keys, and remote environments with instant single-click connection.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="height: 10px;"></td>
      </tr>
      <tr>
        <td style="padding: 16px; background-color: #0f172a; border-radius: 10px; border: 1px solid #1e293b; display: block;">
          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
            <tr>
              <td width="40" style="vertical-align: top;">
                <span style="font-size: 22px;">🎨</span>
              </td>
              <td>
                <strong style="color: #f8fafc; font-size: 15px; display: block; margin-bottom: 4px;">Custom Themes & Layouts</strong>
                <span style="color: #94a3b8; font-size: 13px; line-height: 18px;">Tailor color palettes, hotkeys, and prompt behaviors to suit your preferences.</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <div style="text-align: center; margin: 36px 0 24px 0;">
      <a href="https://codespace.dev/dashboard" class="button-link" target="_blank" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%); color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: 600; text-decoration: none; display: inline-block;">
        Launch CodeSpace Workspace
      </a>
    </div>

    <p style="margin: 0; font-size: 14px; line-height: 22px; color: #64748b; text-align: center;">
      Have questions? Check out our <a href="https://codespace.dev/docs" style="color: #818cf8; text-decoration: underline;">documentation</a> or reach out anytime.
    </p>
  `;

  const html = renderEmailLayout({
    title: subject,
    previewText: `Welcome to CodeSpace, ${options.name}! Launch your multi-terminal workspace today.`,
    content,
  });

  const text = `Welcome to CodeSpace, ${options.name}!\n\nWe're thrilled to have you on board! CodeSpace is built to streamline your developer workflow with high-performance multi-terminal management, seamless SSH profiles, and desktop workspace control.\n\nLaunch CodeSpace: https://codespace.dev/dashboard\n\n— CodeSpace Team`;

  return { subject, html, text };
}
