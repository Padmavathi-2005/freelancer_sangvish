import nodemailer from "nodemailer";
import pool from "../config/db.js";

/**
 * Sends an email using SMTP settings stored in the database.
 * Falls back to logging if SMTP parameters are invalid or fail.
 */
export async function sendEmail({ to, subject, text, html }) {
  try {
    // 1. Fetch settings from DB
    const emailSettingsRes = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'email_settings'"
    );
    const siteSettingsRes = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'site_settings'"
    );

    let emailSettings = emailSettingsRes.rows[0]?.setting_value || {};
    let siteSettings = siteSettingsRes.rows[0]?.setting_value || {};

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

    const smtpHost = emailSettings.smtp_host || "smtp";
    const smtpPort = parseInt(emailSettings.smtp_port || 2525);
    const smtpUser = emailSettings.smtp_user || "";
    const smtpPass = emailSettings.smtp_pass || "";
    const fromEmail = emailSettings.email_id || "noreply@buy2lancer.com";
    const siteName = siteSettings.site_name || "Buy2Lancer";

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

    // 3. Send mail
    const info = await transporter.sendMail({
      from: `"${siteName}" <${fromEmail}>`,
      to,
      subject,
      text,
      html: html || text.replace(/\n/g, "<br/>")
    });

    console.log(`✅ Email sent successfully: messageId=${info.messageId}`);
    return info;
  } catch (error) {
    console.error("⚠️ Failed to send email via SMTP, logging contents instead:");
    console.log(`--------------------------------------------------`);
    console.log(`TO: ${to}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`BODY:\n${text}`);
    console.log(`--------------------------------------------------`);
    return null;
  }
}
