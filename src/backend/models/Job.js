import mongoose from "mongoose";

export const JobStatus = {
  APPLIED: "Applied",
  ASSESSMENT: "Online Assessment",
  INTERVIEW_SCHEDULED: "Interview Scheduled",
  REJECTED: "Rejected",
  OFFER_RECEIVED: "Offer Received",
  SELECTED: "Selected",
};

export const JobType = {
  FULL_TIME: "Full Time",
  INTERNSHIP: "Internship",
  CONTRACT: "Contract",
};

const JobSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    company: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    salary: { type: String, default: "" },
    location: { type: String, default: "" },
    status: {
      type: String,
      enum: Object.values(JobStatus),
      default: JobStatus.APPLIED,
    },
    notes: { type: String, default: "" },
    applicationDate: { type: Date, required: true, default: Date.now },
    jobUrl: { type: String, default: "" },
    jobType: {
      type: String,
      enum: Object.values(JobType),
      default: JobType.FULL_TIME,
    },
    interviewDate: { type: Date },
    interviewType: { type: String, default: "" },
    reminderEnabled: { type: Boolean, default: false },
    reminderSent: { type: Boolean, default: false },
    reminder24hSent: { type: Boolean, default: false },
    reminder1hSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Compound indexes for optimization
JobSchema.index({ userId: 1, status: 1 });
JobSchema.index({ userId: 1, company: 1 });

export const Job = mongoose.models.Job || mongoose.model("Job", JobSchema);
