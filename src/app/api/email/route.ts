import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';


/**
 * Handle POST requests to send an email via SMTP using nodemailer.
 *
 * Expects the incoming NextRequest to contain a JSON body with the following shape:
 * {
 *   to: string,        // recipient email address (or comma-separated list)
 *   subject: string,   // email subject
 *   text?: string,     // plain-text body (optional if html provided)
 *   html?: string      // HTML body (optional if text provided)
 * }
 *
 * The function:
 * - Creates a nodemailer transporter using SMTP configuration read from environment variables:
 *   - SMTP_HOST: hostname of the SMTP server
 *   - SMTP_PORT: port number (defaults to 587 if not provided)
 *   - SMTP_SECURE: 'true' to enable secure connection (typically port 465), otherwise false
 *   - SMTP_USER: SMTP username (used as the "from" address)
 *   - SMTP_PASS: SMTP password
 * - Sends the email using transporter.sendMail with "Quiz Central" as the display name for the sender.
 * - Logs the sent messageId on success and returns a JSON response with a success message.
 * - Catches errors, logs the error, and returns a 500 JSON response with a failure message.
 *
 * Notes:
 * - The request Content-Type should be application/json.
 * - The function returns a NextResponse containing a JSON object; on success the status is 200 (default),
 *   on failure it returns status 500 with { message: 'Failed to send email' }.
 *
 * @param req - The NextRequest containing the JSON payload described above.
 * @returns A Promise that resolves to a NextResponse with a JSON body indicating success or failure.
 *
 * @example
 * // curl example
 * curl -X POST /api/email \
 *   -H "Content-Type: application/json" \
 *   -d '{"to":"user@example.com","subject":"Hello","text":"Hi there","html":"<p>Hi there</p>"}'
 *
 * @remarks
 * - Ensure the required SMTP environment variables are set before calling this endpoint.
 * - If both text and html are omitted, some SMTP servers or mail clients may treat the message as empty.
 */
export async function POST(req: NextRequest) {
  const { to, subject, text, html } = await req.json();

  try {
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
      from: `"Quiz Central" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return NextResponse.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed to send email' }, { status: 500 });
  }
}
