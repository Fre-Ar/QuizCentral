import nodemailer from 'nodemailer';

  /**
   * Creates and configures a Nodemailer SMTP transporter from environment variables.
   *
   * Uses the following environment variables:
   * - SMTP_HOST: SMTP server host.
   * - SMTP_PORT: SMTP server port (defaults to 587 if not set).
   * - SMTP_SECURE: 'true' to enable implicit TLS/SSL (typically port 465); otherwise treated as false.
   * - SMTP_USER: SMTP authentication username.
   * - SMTP_PASS: SMTP authentication password.
   *
   * The returned transporter is intended to be reused across the application to send emails
   * (reusing the connection pool where supported by the transport).
   *
   * @remarks
   * - The port is parsed with parseInt and falls back to 587 when missing or invalid.
   * - SMTP_SECURE is compared against the literal string 'true' to determine a boolean value.
   * - For STARTTLS (explicit TLS) use secure=false with port 587; for implicit SSL use secure=true with port 465.
   * - Store SMTP credentials securely (environment variables, secret manager) and do not commit them to source control.
   *
   * @example
   * // Send an email with the configured transporter
   * await transporter.sendMail({
   *   from: '"Example App" <no-reply@example.com>',
   *   to: 'user@example.com',
   *   subject: 'Welcome',
   *   text: 'Hello and welcome!'
   * });
   *
   * @constant
   * @type {import('nodemailer').Transporter}
   */
export const sendEmail = async (to: string, subject: string, text: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const info = await transporter.sendMail({
    from: `"Quiz App" <${process.env.SMTP_USER}>`, // sender address
    to, // list of receivers
    subject, // Subject line
    text, // plain text body
    html, // html body
  });

  console.log('Message sent: %s', info.messageId);
};
