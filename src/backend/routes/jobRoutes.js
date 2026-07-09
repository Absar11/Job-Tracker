import { Router } from "express";
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  getDashboardAnalytics,
  sendInterviewReminder,
} from "../controllers/jobController.js";
import { authenticateJWT } from "../middleware/authMiddleware.js";

const router = Router();

// Apply auth middleware to all job routes
router.use(authenticateJWT);

router.get("/analytics", getDashboardAnalytics);
router.post("/", createJob);
router.get("/", getJobs);
router.get("/:id", getJobById);
router.put("/:id", updateJob);
router.delete("/:id", deleteJob);
router.post("/:id/send-reminder", sendInterviewReminder);

export default router;
