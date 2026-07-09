import { sendMail } from "../services/emailService.js";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js"; // ✅ Static import (dynamic import was unreliable)

/**
 * Automatic Interview Reminder Scheduler
 *
 * Runs every 5 minutes and checks all upcoming interviews.
 * Sends an email:
 *   - 24 hours before the interview (if not already sent)
 *   - 1 hour before the interview (if not already sent)
 *
 * Only sends reminders for jobs where reminderEnabled === true.
 */

const buildEmailHtml = (userName, job, timeLabel) => `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
      <h2 style="color: #4f46e5; margin: 0; font-weight: 800; font-size: 20px;">⏰ Interview Reminder</h2>
      <span style="background-color: #f5f3ff; color: #6d28d9; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
        ${timeLabel}
      </span>
    </div>
    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />

    <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${userName}</strong>,</p>
    <p style="color: #334155; font-size: 14px; line-height: 1.6;">
      Your interview is coming up in <strong style="color: #e11d48;">${timeLabel}</strong>! Here are the details:
    </p>

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; margin: 20px 0;">
      <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
        <tr>
          <td style="padding: 6px 0; font-weight: 700; width: 130px; color: #1e293b;">Company:</td>
          <td style="padding: 6px 0; font-weight: 800; color: #4f46e5;">${job.company}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Role:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${job.role}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Format:</td>
          <td style="padding: 6px 0;">${job.interviewType || "Not Specified"}</td>
        </tr>
        <tr>
          <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Date &amp; Time:</td>
          <td style="padding: 6px 0; font-weight: 600; color: #e11d48;">${new Date(job.interviewDate).toLocaleString()}</td>
        </tr>
        ${job.location ? `
        <tr>
          <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Location/Link:</td>
          <td style="padding: 6px 0; color: #2563eb; font-family: monospace;">${job.location}</td>
        </tr>` : ""}
      </table>
    </div>

    ${job.notes ? `
    <div style="margin: 20px 0;">
      <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Preparation Notes:</h4>
      <blockquote style="margin: 0; background-color: #fefcf0; border-left: 4px solid #eab308; padding: 12px; font-size: 13px; color: #713f12; border-radius: 0 8px 8px 0; font-style: italic; white-space: pre-wrap;">${job.notes}</blockquote>
    </div>` : ""}

    <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-top: 25px;">Good luck! You've got this. 💪</p>

    <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 25px; margin-bottom: 15px;" />
    <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4;">
      Automated reminder by Job Tracker Pro &bull; Do not reply to this email.<br />
      &copy; 2026 Job Tracker Pro. All Rights Reserved.
    </p>
  </div>
`;

const checkAndSendReminders = async () => {
  try {
    const now = new Date();

    const windows = [
      {
        label: "24 Hours",
        start: 23 * 60 * 60 * 1000, // 23h from now
        end:   25 * 60 * 60 * 1000, // 25h from now
        sentField: "reminder24hSent",
      },
      {
        label: "1 Hour",
        start: 45 * 60 * 1000,      // 45 min from now
        end:   75 * 60 * 1000,      // 75 min from now
        sentField: "reminder1hSent",
      },
    ];

    for (const win of windows) {
      const windowStart = new Date(now.getTime() + win.start);
      const windowEnd   = new Date(now.getTime() + win.end);

      console.log(`[Reminder Scheduler] Checking ${win.label} window: ${windowStart.toISOString()} → ${windowEnd.toISOString()}`);

      const jobs = await Job.find({
        interviewDate: { $gte: windowStart, $lte: windowEnd },
        reminderEnabled: true,
        [win.sentField]: { $ne: true },
      });

      console.log(`[Reminder Scheduler] ${win.label}: found ${jobs.length} job(s) needing reminder.`);

      for (const job of jobs) {
        try {
          // userId is stored as a String — query by string directly
          const user = await User.findOne({ _id: job.userId }).catch(() => null);
          if (!user || !user.email) {
            console.warn(`[Reminder Scheduler] ⚠️  No user found for job ${job._id} (userId: ${job.userId})`);
            continue;
          }

          const subject = `⏰ INTERVIEW REMINDER (${win.label}): ${job.role} at ${job.company}`;
          const html = buildEmailHtml(user.name || "there", job, win.label);
          const text = `Hello ${user.name},\n\nYour interview with ${job.company} for ${job.role} is in ${win.label}.\nScheduled: ${new Date(job.interviewDate).toLocaleString()}\n\nGood luck!\n\n— Job Tracker Pro`;

          await sendMail({ to: user.email, subject, text, html });

          // Mark as sent — prevent duplicate emails
          await Job.findByIdAndUpdate(job._id, { [win.sentField]: true });

          console.log(`[Reminder Scheduler] ✅ ${win.label} reminder sent → ${user.email} | ${job.company} – ${job.role}`);
        } catch (jobErr) {
          console.error(`[Reminder Scheduler] ❌ Failed for job ${job._id}:`, jobErr.message);
        }
      }
    }
  } catch (err) {
    console.error("[Reminder Scheduler] Unexpected error:", err.message);
  }
};

/**
 * Start the automatic reminder scheduler.
 * Checks every 5 minutes. Only runs when MongoDB is connected.
 */
export const startReminderScheduler = (useMongo) => {
  if (!useMongo) {
    console.log("[Reminder Scheduler] Skipped — MongoDB not connected (local mode).");
    return;
  }

  const INTERVAL_MS = 5 * 60 * 1000; // every 5 minutes
  console.log("[Reminder Scheduler] ✅ Started — checking every 5 minutes for upcoming interviews.");

  // Run once immediately on startup, then on interval
  checkAndSendReminders();
  setInterval(checkAndSendReminders, INTERVAL_MS);
};
