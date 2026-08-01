export type EmailLayoutOptions = {
  title: string;
  previewText?: string;
  content: string;
};

/**
 * Base responsive HTML email template for CodeSpace.
 * Designed with a modern, dark-mode aesthetic, vibrant accent gradients,
 * high-contrast typography, and broad email client compatibility.
 */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const currentYear = new Date().getFullYear();
  const preview = options.previewText ? options.previewText : options.title;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>${options.title}</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:AllowPNG/>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style type="text/css">
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      height: 100% !important;
      width: 100% !important;
      background-color: #0b0f19;
      color: #f8fafc;
      font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    * {
      -ms-text-size-adjust: 100%;
      -webkit-text-size-adjust: 100%;
    }
    div[style*="margin: 16px 0"] {
      margin: 0 !important;
    }
    table, td {
      mso-table-lspace: 0pt !important;
      mso-table-rspace: 0pt !important;
    }
    table {
      border-spacing: 0 !important;
      border-collapse: collapse !important;
      table-layout: fixed !important;
      margin: 0 auto !important;
    }
    a {
      text-decoration: none;
      color: #818cf8;
    }
    .button-link {
      background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
      color: #ffffff !important;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      display: inline-block;
      text-align: center;
      box-shadow: 0 4px 14px 0 rgba(99, 102, 241, 0.39);
    }
    .otp-code {
      letter-spacing: 6px;
      font-family: 'JetBrains Mono', 'Fira Code', Consolas, Monaco, monospace;
      font-size: 32px;
      font-weight: 700;
      color: #38bdf8;
      background-color: #0f172a;
      border: 1px solid #1e293b;
      border-radius: 8px;
      padding: 16px 24px;
      display: inline-block;
      text-align: center;
    }
  </style>
</head>
<body width="100%" style="margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #0b0f19;">
  <!-- Hidden Preview Text -->
  <div style="display: none; font-size: 1px; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;">
    ${preview}
  </div>

  <center style="width: 100%; background-color: #0b0f19; padding: 40px 0;">
    <!--[if mso | IE]>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center" style="width:600px;">
    <tr>
    <td style="line-height:0px;font-size:0px;mso-line-height-rule:exactly;">
    <![endif]-->
    <div style="max-width: 600px; margin: 0 auto;" class="email-container">
      
      <!-- HEADER WITH BRAND LOGO -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 20px 0 30px 0; text-align: center;">
            <a href="https://codespace.dev" target="_blank" style="display: inline-block;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="vertical-align: middle; text-align: center;">
                    <img src="cid:logo@codespace.dev" alt="CodeSpace Logo" width="42" height="42" style="display: block; width: 42px; height: 42px; border-radius: 10px; object-fit: contain; border: 0;" />
                  </td>
                  <td style="padding-left: 12px; vertical-align: middle; text-align: left;">
                    <span style="font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">Code<span style="color: #818cf8;">Space</span></span>
                  </td>
                </tr>
              </table>
            </a>
          </td>
        </tr>
      </table>

      <!-- MAIN CARD CONTAINER -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #151c2c; border-radius: 16px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);">
        <!-- ACCENT GRADIENT TOP BAR -->
        <tr>
          <td style="height: 4px; background: linear-gradient(90deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);"></td>
        </tr>
        <tr>
          <td style="padding: 40px 32px;">
            ${options.content}
          </td>
        </tr>
      </table>

      <!-- FOOTER -->
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 32px 20px; text-align: center; color: #64748b; font-size: 13px; line-height: 20px;">
            <p style="margin: 0 0 8px 0;">This is an automated system email from CodeSpace. Please do not reply to this message.</p>
            <p style="margin: 0 0 16px 0;">CodeSpace Desktop — Multi-Terminal Developer Workspace</p>
            <p style="margin: 0;">
              &copy; ${currentYear} CodeSpace. All rights reserved. &bull; 
              <a href="https://codespace.dev/privacy" style="color: #64748b; text-decoration: underline;">Privacy Policy</a> &bull; 
              <a href="https://codespace.dev/support" style="color: #64748b; text-decoration: underline;">Support</a>
            </p>
          </td>
        </tr>
      </table>

    </div>
    <!--[if mso | IE]>
    </td>
    </tr>
    </table>
    <![endif]-->
  </center>
</body>
</html>`;
}
