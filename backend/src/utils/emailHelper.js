import nodemailer from "nodemailer";
import pool from "../config/db.js";

/**
 * Wraps plain text email content in a styled HTML card layout using brand settings.
 */
function wrapInHtmlTemplate({ bodyText, siteName, emailLogo, emailSignature, emailCopyright }) {
  // Replace newlines with <br/> in bodyText and emailSignature
  const formattedBody = bodyText ? bodyText.replace(/\n/g, "<br/>") : "";
  const formattedSignature = emailSignature ? emailSignature.replace(/\n/g, "<br/>") : "";

  // Set default copyright if not provided
  const year = new Date().getFullYear();
  const copyright = emailCopyright 
    ? emailCopyright.replace(/{{site_name}}/g, siteName).replace(/{{year}}/g, year)
    : `&copy; ${year} ${siteName}. All rights reserved.`;

  const logoHtml = emailLogo 
    ? `<img src="${emailLogo}" alt="${siteName}" style="max-height: 48px; width: auto; display: block; margin: 0 auto 20px auto;" />`
    : `<h1 style="margin: 0 0 20px 0; color: #0f766e; font-size: 24px; font-weight: 800; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">${siteName}</h1>`;

  const signatureHtml = formattedSignature 
    ? `<p style="margin: 24px 0 0 0; font-size: 14px; color: #475569; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6;">${formattedSignature}</p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${siteName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; -webkit-text-size-adjust: none; text-size-adjust: none;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px 40px 20px 40px; text-align: center;">
              ${logoHtml}
            </td>
          </tr>
          <!-- Content Body -->
          <tr>
            <td style="padding: 0 40px 30px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; color: #1e293b; line-height: 1.6;">
              <div style="font-family: inherit; font-size: inherit; color: inherit; line-height: inherit;">
                ${formattedBody}
              </div>
              ${signatureHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 40px; background-color: #f1f5f9; border-top: 1px solid #e2e8f0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 12px; color: #64748b; line-height: 1.5;">
              <p style="margin: 0;">${copyright}</p>
              <p style="margin: 4px 0 0 0; font-size: 11px; color: #94a3b8;">This is an automated notification. Please do not reply directly to this email.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * Sends an email using SMTP settings stored in the database.
 * Falls back to logging if SMTP parameters are invalid or fail.
 */
export async function sendEmail({ to, subject, text, html }) {
  let emailSettings = {};
  let siteSettings = {};
  let siteName = "Buy2Lancer";
  let resolvedLogoUrl = "";
  let htmlToSend = "";
  let smtpHost = "smtp";

  try {
    // 1. Fetch settings from DB
    const emailSettingsRes = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'email_settings'"
    );
    const siteSettingsRes = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'site_settings'"
    );

    emailSettings = emailSettingsRes.rows[0]?.setting_value || {};
    siteSettings = siteSettingsRes.rows[0]?.setting_value || {};

    if (typeof emailSettings === "string") {
      try {
        emailSettings = JSON.parse(emailSettings);
      } catch (e) {
        console.error("Failed to parse emailSettings:", e);
      }
    }

    if (typeof siteSettings === "string") {
      try {
        siteSettings = JSON.parse(siteSettings);
      } catch (e) {
        console.error("Failed to parse siteSettings:", e);
      }
    }

    smtpHost = emailSettings.smtp_host || "smtp";
    const smtpPort = parseInt(emailSettings.smtp_port || 2525);
    const smtpUser = emailSettings.smtp_user || "";
    const smtpPass = emailSettings.smtp_pass || "";
    const fromEmail = emailSettings.email_id || "noreply@buy2lancer.com";
    siteName = siteSettings.site_name || "Buy2Lancer";

    // Resolve logo URL - handles absolute and relative paths
    resolvedLogoUrl = emailSettings.email_logo || siteSettings.site_logo || "";
    if (resolvedLogoUrl && !resolvedLogoUrl.startsWith("http://") && !resolvedLogoUrl.startsWith("https://") && !resolvedLogoUrl.startsWith("data:")) {
      const backendBaseUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;
      resolvedLogoUrl = `${backendBaseUrl}${resolvedLogoUrl.startsWith("/") ? "" : "/"}${resolvedLogoUrl}`;
    }

    console.log(`✉️ Preparing email to ${to} (Subject: "${subject}") via ${smtpHost}...`);

    // 2. Initialize Nodemailer Transporter
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: smtpUser && smtpPass ? {
        user: smtpUser,
        pass: smtpPass
      } : undefined
    });

    htmlToSend = html || wrapInHtmlTemplate({
      bodyText: text,
      siteName,
      emailLogo: resolvedLogoUrl,
      emailSignature: emailSettings.email_signature,
      emailCopyright: emailSettings.email_copyright
    });

    // 3. Send mail
    const info = await transporter.sendMail({
      from: `"${siteName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html: htmlToSend
    });

    console.log(`✅ Email sent successfully: messageId=${info.messageId}`);
    return info;
  } catch (error) {
    const fallbackHtml = htmlToSend || html || wrapInHtmlTemplate({
      bodyText: text,
      siteName,
      emailLogo: resolvedLogoUrl,
      emailSignature: emailSettings.email_signature,
      emailCopyright: emailSettings.email_copyright
    });

    console.error("⚠️ Failed to send email via SMTP, logging contents instead:");
    console.log(`--------------------------------------------------`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:\n${text}`);
    console.log(`HTML BODY:\n${fallbackHtml}`);
    console.log(`--------------------------------------------------`);
    return null;
  }
}

