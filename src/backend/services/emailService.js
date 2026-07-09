import nodemailer from "nodemailer";

let transporter = null;

/**
 * Lazy initialize the nodemailer transporter
 */
export const getTransporter = async () => {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "SMTP settings are not configured! Please open the AI Studio 'Settings' menu " +
      "and configure: SMTP_HOST (e.g. smtp.gmail.com), SMTP_PORT (e.g. 587), " +
      "SMTP_USER (your Gmail address), and SMTP_PASS (your 16-character Gmail App Password)."
    );
  }

  console.log(`Initializing real SMTP transporter using configured host: ${host}:${port}`);
  transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });

  return transporter;
};

/**
 * Send an email with a custom options block
 */
export const sendMail = async ({ to, subject, text, html }) => {
  try {
    const client = await getTransporter();
    const from = process.env.SMTP_FROM || process.env.SMTP_USER || "no-reply@jobtrackerpro.com";
    
    const info = await client.sendMail({
      from,
      to,
      subject,
      text,
      html,
    });

    console.log(`Email dispatched successfully. Message ID: ${info.messageId}`);
    
    // Check if it's an Ethereal URL preview
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log(`Email Preview URL: ${previewUrl}`);
      return { success: true, messageId: info.messageId, previewUrl };
    }

    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error encountered in SMTP email service:", error);
    // Reset transporter cache so that updated environment variables will be loaded next time
    transporter = null;
    throw error;
  }
};

/**
 * Parse and translate SMTP delivery/connection errors into clear, human-readable action steps.
 */
export const explainSmtpError = (error) => {
  const errMsg = error?.message || "";
  
  if (errMsg.includes("535") || errMsg.includes("Invalid login") || errMsg.includes("Username and Password not accepted")) {
    return (
      "SMTP login rejected (Error 535)! Your Gmail username or password was not accepted. " +
      "To resolve this with Gmail:\n" +
      "1. Enable '2-Step Verification' on your Google account.\n" +
      "2. Create a '16-character App Password' at: Security > 2-Step Verification > App passwords.\n" +
      "3. Open the AI Studio 'Settings' menu, click 'Environment Variables', and set SMTP_PASS to that 16-character code (without spaces).\n" +
      "4. Ensure SMTP_USER is configured with your full Gmail address."
    );
  }

  if (errMsg.includes("ETIMEDOUT") || errMsg.includes("connection timed out") || errMsg.includes("ENOTFOUND")) {
    return (
      "SMTP Connection Timeout! Could not connect to the mail server. " +
      "Please verify SMTP_HOST (e.g. smtp.gmail.com) and SMTP_PORT (e.g. 587) in the AI Studio Settings panel."
    );
  }

  return errMsg || "Email delivery failed due to an unknown SMTP service error.";
};

/**
 * Checks if email service is currently running in fallback/simulated mode.
 */
export const isUsingSimulatedEmail = () => {
  return false;
};

