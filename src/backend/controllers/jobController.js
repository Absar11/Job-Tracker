import { dbService } from "../services/dbService.js";
import { JobStatus, JobType } from "../models/Job.js";
import { sendMail, explainSmtpError } from "../services/emailService.js";

// Create Job
export const createJob = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Unauthorized login required." });
  }

  const { company, role, salary, location, status, notes, applicationDate, jobUrl, jobType, interviewDate, interviewType, reminderEnabled, reminderSent } = req.body;

  if (!company || !role) {
    return res.status(400).json({ success: false, message: "Company name and role are required." });
  }

  // Validate status
  if (status && !Object.values(JobStatus).includes(status)) {
    return res.status(400).json({ success: false, message: `Invalid status option. Must be one of: ${Object.values(JobStatus).join(", ")}` });
  }

  // Validate Job Type
  if (jobType && !Object.values(JobType).includes(jobType)) {
    return res.status(400).json({ success: false, message: `Invalid job type option. Must be one of: ${Object.values(JobType).join(", ")}` });
  }

  try {
    const job = await dbService.createJob({
      userId: req.user.id,
      company,
      role,
      salary: salary || "",
      location: location || "",
      status: status || JobStatus.APPLIED,
      notes: notes || "",
      applicationDate: applicationDate ? new Date(applicationDate) : new Date(),
      jobUrl: jobUrl || "",
      jobType: jobType || JobType.FULL_TIME,
      interviewDate: interviewDate ? new Date(interviewDate) : undefined,
      interviewType: interviewType || "",
      reminderEnabled: reminderEnabled === true || reminderEnabled === "true",
      reminderSent: reminderSent === true || reminderSent === "true",
    });

    return res.status(201).json({
      success: true,
      message: "Job application added successfully.",
      job,
    });
  } catch (error) {
    console.error("Create job failure:", error);
    return res.status(500).json({ success: false, message: "Error adding job application." });
  }
};

// Get List of Jobs with Filters, Search, and Pagination
export const getJobs = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const { search, status, company, sort, page, limit } = req.query;

  try {
    const results = await dbService.findJobs(req.user.id, {
      search: search ? String(search) : undefined,
      status: status ? String(status) : undefined,
      company: company ? String(company) : undefined,
      sort: sort ? String(sort) : undefined,
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
    });

    return res.status(200).json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error("Get jobs failure:", error);
    return res.status(500).json({ success: false, message: "Error fetching job applications." });
  }
};

// View Individual Job Details
export const getJobById = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const { id } = req.params;

  try {
    const job = await dbService.findJobById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job application not found." });
    }

    if (String(job.userId) !== req.user.id) {
      return res.status(403).json({ success: false, message: "You are not authorized to view this application." });
    }

    return res.status(200).json({
      success: true,
      job,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error retrieving job details." });
  }
};

// Edit Job Application
export const updateJob = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const { id } = req.params;
  const { company, role, salary, location, status, notes, applicationDate, jobUrl, jobType, interviewDate, interviewType, reminderEnabled, reminderSent } = req.body;

  try {
    const job = await dbService.findJobById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job application not found" });
    }

    if (String(job.userId) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized modification attempt." });
    }

    // Validate Status
    if (status && !Object.values(JobStatus).includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value provided" });
    }

    const updatedFields = {};
    if (company) updatedFields.company = company;
    if (role) updatedFields.role = role;
    if (salary !== undefined) updatedFields.salary = salary;
    if (location !== undefined) updatedFields.location = location;
    if (status) updatedFields.status = status;
    if (notes !== undefined) updatedFields.notes = notes;
    if (applicationDate) updatedFields.applicationDate = new Date(applicationDate);
    if (jobUrl !== undefined) updatedFields.jobUrl = jobUrl;
    if (jobType) updatedFields.jobType = jobType;
    if (interviewDate !== undefined) updatedFields.interviewDate = interviewDate ? new Date(interviewDate) : null;
    if (interviewType !== undefined) updatedFields.interviewType = interviewType;
    if (reminderEnabled !== undefined) updatedFields.reminderEnabled = reminderEnabled;
    if (reminderSent !== undefined) updatedFields.reminderSent = reminderSent;

    const updatedJob = await dbService.updateJob(id, req.user.id, updatedFields);

    return res.status(200).json({
      success: true,
      message: "Job details updated successfully.",
      job: updatedJob,
    });
  } catch (error) {
    console.error("Update job failure:", error);
    return res.status(500).json({ success: false, message: "Error updating job application" });
  }
};

// Delete Job Application
export const deleteJob = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const { id } = req.params;

  try {
    const job = await dbService.findJobById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job application not found" });
    }

    if (String(job.userId) !== req.user.id) {
      return res.status(403).json({ success: false, message: "Unauthorized deletion attempt" });
    }

    await dbService.deleteJob(id, req.user.id);

    return res.status(200).json({
      success: true,
      message: "Job application deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Error deleting job application" });
  }
};

// Dashboard stats endpoints
export const getDashboardAnalytics = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  try {
    const analytics = await dbService.getDashboardAnalytics(req.user.id);
    return res.status(200).json({
      success: true,
      analytics,
    });
  } catch (error) {
    console.error("Failed loading dashboard metrics:", error);
    return res.status(500).json({ success: false, message: "Server error compiling dashboard analytics" });
  }
};

// Send simulated/real interview reminder email
export const sendInterviewReminder = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: "Authentication required" });
  }

  const { id } = req.params;

  try {
    const job = await dbService.findJobById(id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job application not found." });
    }

    if (String(job.userId) !== req.user.id) {
      return res.status(403).json({ success: false, message: "You are not authorized to perform this action." });
    }

    // Mark reminder as sent in DB
    const updatedJob = await dbService.updateJob(id, req.user.id, { reminderSent: true });

    // Simulated email dispatch log details
    const recipientEmail = req.user.email;
    const interviewDateTime = job.interviewDate ? new Date(job.interviewDate).toLocaleString() : "TBD";
    const emailSubject = `⏰ INTERVIEW REMINDER: ${job.role} at ${job.company}`;
    
    const emailBody = `Hello ${req.user.name},\n\nThis is an automated notification from Job Tracker Pro.\n\nYou have an upcoming interview scheduled with ${job.company}!\nPosition: ${job.role}\nType/Format: ${job.interviewType || "Not Specified"}\nScheduled Time: ${interviewDateTime}\nLocation/Link: ${job.location || "Check company invite"}\n\nPreparation Notes:\n${job.notes || "No notes captured yet."}\n\nGood luck with your interview preparation! Keep tracking your progress.\n\nBest regards,\nThe Job Tracker Pro Team`;

    const emailHtml = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
          <h2 style="color: #4f46e5; margin: 0; font-weight: 800; font-size: 20px;">⏰ Interview Reminder</h2>
          <span style="background-color: #f5f3ff; color: #6d28d9; font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 9999px; text-transform: uppercase;">
            ${job.interviewType || "Scheduled"}
          </span>
        </div>
        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-bottom: 20px;" />
        
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">Hello <strong>${req.user.name}</strong>,</p>
        <p style="color: #334155; font-size: 14px; line-height: 1.6;">You have an upcoming interview scheduled. Here are the core pipeline details for your records:</p>
        
        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 12px; margin: 20px 0;">
          <table style="width: 100%; font-size: 13px; color: #475569; border-collapse: collapse;">
            <tr>
              <td style="padding: 6px 0; font-weight: 700; width: 120px; color: #1e293b;">Company:</td>
              <td style="padding: 6px 0; font-weight: 800; color: #4f46e5;">${job.company}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Role/Position:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #0f172a;">${job.role}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Format:</td>
              <td style="padding: 6px 0;">${job.interviewType || "Not Specified"}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Time & Date:</td>
              <td style="padding: 6px 0; font-weight: 600; color: #e11d48;">${interviewDateTime}</td>
            </tr>
            ${job.location ? `
            <tr>
              <td style="padding: 6px 0; font-weight: 700; color: #1e293b;">Location/Link:</td>
              <td style="padding: 6px 0; color: #2563eb; font-family: monospace;">${job.location}</td>
            </tr>` : ''}
          </table>
        </div>

        ${job.notes ? `
        <div style="margin: 20px 0;">
          <h4 style="margin: 0 0 8px 0; color: #334155; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">Preparation & Workspace Notes:</h4>
          <blockquote style="margin: 0; background-color: #fefcf0; border-left: 4px solid #eab308; padding: 12px; font-size: 13px; color: #713f12; border-radius: 0 8px 8px 0; font-style: italic; white-space: pre-wrap;">${job.notes}</blockquote>
        </div>` : ''}

        <p style="color: #334155; font-size: 14px; line-height: 1.6; margin-top: 25px;">Good luck with your interview preparation! Keep tracking your progress inside your Job Tracker Pro dashboard.</p>

        <hr style="border: 0; border-top: 1px solid #f1f5f9; margin-top: 25px; margin-bottom: 15px;" />
        <p style="color: #94a3b8; font-size: 11px; text-align: center; line-height: 1.4;">
          This is an automated system notification. Please do not reply directly to this email.<br />
          &copy; 2026 Job Tracker Pro. All Rights Reserved.
        </p>
      </div>
    `;

    // Dispatch real email via SMTP
    try {
      await sendMail({
        to: recipientEmail,
        subject: emailSubject,
        text: emailBody,
        html: emailHtml,
      });
    } catch (smtpErr) {
      console.error("SMTP send failed for interview reminder:", smtpErr);
      const userMessage = explainSmtpError(smtpErr);
      return res.status(400).json({
        success: false,
        message: userMessage
      });
    }

    return res.status(200).json({
      success: true,
      message: `Interview reminder email sent successfully to ${recipientEmail}!`,
      job: updatedJob,
    });
  } catch (error) {
    console.error("Error sending reminder:", error);
    return res.status(500).json({ success: false, message: "Error sending simulated email notification." });
  }
};
