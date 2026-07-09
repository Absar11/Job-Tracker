import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { User } from "../models/User.js";
import { Job } from "../models/Job.js";

const DB_FOLDER = path.join(process.cwd(), "data");
const DB_FILE = path.join(DB_FOLDER, "db.json");

class DbService {
  constructor() {
    this.useMongo = false;
    this.localDb = { users: [], jobs: [] };
    // NOTE: ensureLocalDbExists() is intentionally NOT called here.
    // The local data/ folder is only created when MongoDB is unavailable (see initialize()).
  }

  // Ensure local DB folder and file exist
  ensureLocalDbExists() {
    try {
      if (!fs.existsSync(DB_FOLDER)) {
        fs.mkdirSync(DB_FOLDER, { recursive: true });
      }
      if (!fs.existsSync(DB_FILE)) {
        fs.writeFileSync(DB_FILE, JSON.stringify(this.localDb, null, 2), "utf8");
      } else {
        const fileContent = fs.readFileSync(DB_FILE, "utf8");
        this.localDb = JSON.parse(fileContent);
      }
    } catch (error) {
      console.error("Local database initialized with warning:", error);
    }
  }

  // Read data from local DB
  readLocal() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, "utf8");
        this.localDb = JSON.parse(fileContent);
      }
    } catch (e) {
      console.error("Error reading local db", e);
    }
    return this.localDb;
  }

  // Write data to local DB
  writeLocal(data) {
    try {
      this.localDb = data;
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
    } catch (e) {
      console.error("Error writing local db", e);
    }
  }

  // Initialize Connection
  async initialize() {
    const mongoUri = process.env.MONGODB_URI;
    if (mongoUri && !mongoUri.includes("<username>")) {
      try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(mongoUri);
        this.useMongo = true;
        console.log("MongoDB connected successfully. Local file storage disabled.");
        return; // MongoDB is ready — skip local file setup entirely
      } catch (error) {
        console.error("MongoDB connection failed, falling back to local Storage:", error);
        this.useMongo = false;
      }
    } else {
      console.log("No valid MONGODB_URI found. Running in Hybrid File Fallback Mode (data/db.json).");
      this.useMongo = false;
    }
    // Only reach here if MongoDB is unavailable — create local data folder now
    this.ensureLocalDbExists();
  }

  // User Actions
  async findUserByEmail(email) {
    if (this.useMongo) {
      return await User.findOne({ email: email.toLowerCase() });
    } else {
      const db = this.readLocal();
      const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      return user ? { ...user, id: user._id } : null;
    }
  }

  async findUserById(id) {
    if (this.useMongo) {
      return await User.findById(id);
    } else {
      const db = this.readLocal();
      const user = db.users.find((u) => u._id === id);
      return user ? { ...user, id: user._id } : null;
    }
  }

  async createUser(userData) {
    if (this.useMongo) {
      const user = new User(userData);
      return await user.save();
    } else {
      const db = this.readLocal();
      const _id = "u_" + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      const newUser = {
        _id,
        ...userData,
        createdAt: now,
        updatedAt: now,
      };
      db.users.push(newUser);
      this.writeLocal(db);
      return { ...newUser, id: _id };
    }
  }



  // Job Actions
  async createJob(jobData) {
    if (this.useMongo) {
      const job = new Job(jobData);
      return await job.save();
    } else {
      const db = this.readLocal();
      const _id = "j_" + Math.random().toString(36).substr(2, 9);
      const now = new Date().toISOString();
      const newJob = {
        _id,
        ...jobData,
        applicationDate: jobData.applicationDate instanceof Date ? jobData.applicationDate.toISOString() : jobData.applicationDate || now,
        createdAt: now,
        updatedAt: now,
      };
      db.jobs.push(newJob);
      this.writeLocal(db);
      return { ...newJob, id: _id };
    }
  }

  async updateJob(id, userId, jobData) {
    if (this.useMongo) {
      return await Job.findOneAndUpdate({ _id: id, userId }, jobData, { new: true });
    } else {
      const db = this.readLocal();
      const jobIdx = db.jobs.findIndex((j) => j._id === id && j.userId === userId);
      if (jobIdx === -1) return null;

      const existing = db.jobs[jobIdx];
      const updated = {
        ...existing,
        ...jobData,
        updatedAt: new Date().toISOString(),
      };
      db.jobs[jobIdx] = updated;
      this.writeLocal(db);
      return updated;
    }
  }

  async deleteJob(id, userId) {
    if (this.useMongo) {
      return await Job.findOneAndDelete({ _id: id, userId });
    } else {
      const db = this.readLocal();
      const initialLength = db.jobs.length;
      db.jobs = db.jobs.filter((j) => !(j._id === id && j.userId === userId));
      const deleted = db.jobs.length < initialLength;
      this.writeLocal(db);
      return deleted ? { _id: id } : null;
    }
  }

  async findJobById(id) {
    if (this.useMongo) {
      return await Job.findById(id);
    } else {
      const db = this.readLocal();
      return db.jobs.find((j) => j._id === id) || null;
    }
  }

  async findJobs(userId, filters) {
    const page = filters.page && filters.page > 0 ? filters.page : 1;
    const limit = filters.limit && filters.limit > 0 ? filters.limit : 10;
    const skip = (page - 1) * limit;

    if (this.useMongo) {
      const query = { userId };
      if (filters.status) query.status = filters.status;
      if (filters.company) query.company = { $regex: filters.company, $options: "i" };
      if (filters.search) {
        query.$or = [
          { company: { $regex: filters.search, $options: "i" } },
          { role: { $regex: filters.search, $options: "i" } },
          { location: { $regex: filters.search, $options: "i" } },
        ];
      }

      let sortOption = { applicationDate: -1 };
      if (filters.sort === "oldest") sortOption = { applicationDate: 1 };
      else if (filters.sort === "company_asc") sortOption = { company: 1 };
      else if (filters.sort === "company_desc") sortOption = { company: -1 };

      const items = await Job.find(query).sort(sortOption).skip(skip).limit(limit);
      const totalItems = await Job.countDocuments(query);

      return {
        jobs: items,
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          limit,
        },
      };
    } else {
      const db = this.readLocal();
      let userJobs = db.jobs.filter((j) => j.userId === userId);

      // Apply filtering
      if (filters.status) {
        userJobs = userJobs.filter((j) => j.status === filters.status);
      }
      if (filters.company) {
        userJobs = userJobs.filter((j) =>
          j.company.toLowerCase().includes(filters.company.toLowerCase())
        );
      }
      if (filters.search) {
        const term = filters.search.toLowerCase();
        userJobs = userJobs.filter(
          (j) =>
            j.company.toLowerCase().includes(term) ||
            j.role.toLowerCase().includes(term) ||
            (j.location && j.location.toLowerCase().includes(term))
        );
      }

      // Sort
      userJobs.sort((a, b) => {
        const dateA = new Date(a.applicationDate).getTime();
        const dateB = new Date(b.applicationDate).getTime();
        if (filters.sort === "oldest") return dateA - dateB;
        if (filters.sort === "company_asc") return a.company.localeCompare(b.company);
        if (filters.sort === "company_desc") return b.company.localeCompare(a.company);
        return dateB - dateA; // default: newest applicationDate
      });

      // Pagination
      const totalItems = userJobs.length;
      const paginatedJobs = userJobs.slice(skip, skip + limit);

      return {
        jobs: paginatedJobs.map((j) => ({ ...j, id: j._id })),
        pagination: {
          totalItems,
          totalPages: Math.ceil(totalItems / limit),
          currentPage: page,
          limit,
        },
      };
    }
  }

  // Dashboard Aggregation Analytics
  async getDashboardAnalytics(userId) {
    if (this.useMongo) {
      // 1. Cards overview counts
      const counts = await Job.aggregate([
        { $match: { userId: { $in: [userId, new mongoose.Types.ObjectId(userId)] } } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
      ]);

      const countsMap = {
        Total: 0,
        Applied: 0,
        "Online Assessment": 0,
        "Interview Scheduled": 0,
        Rejected: 0,
        "Offer Received": 0,
        Selected: 0,
      };

      let total = 0;
      counts.forEach((item) => {
        countsMap[item._id] = item.count;
        total += item.count;
      });
      countsMap["Total"] = total;

      // 2. Monthly applications (grouped by Year-Month)
      const monthlyData = await Job.aggregate([
        { $match: { userId: { $in: [userId, new mongoose.Types.ObjectId(userId)] } } },
        {
          $group: {
            _id: {
              year: { $year: "$applicationDate" },
              month: { $month: "$applicationDate" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
        { $limit: 12 },
      ]);

      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      const formattedMonthly = monthlyData.map((item) => {
        const label = `${monthNames[item._id.month - 1]} ${item._id.year}`;
        return { label, count: item.count };
      });

      // Ensure at least some monthly structure if not enough database items are present
      return {
        counts: countsMap,
        monthly: formattedMonthly,
      };
    } else {
      const db = this.readLocal();
      const userJobs = db.jobs.filter((j) => j.userId === userId);

      const countsMap = {
        Total: userJobs.length,
        Applied: 0,
        "Online Assessment": 0,
        "Interview Scheduled": 0,
        Rejected: 0,
        "Offer Received": 0,
        Selected: 0,
      };

      userJobs.forEach((job) => {
        if (countsMap[job.status] !== undefined) {
          countsMap[job.status]++;
        }
      });

      // Group monthly (Local)
      const monthlyGroups = {};
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

      userJobs.forEach((job) => {
        const date = new Date(job.applicationDate);
        const label = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        monthlyGroups[label] = (monthlyGroups[label] || 0) + 1;
      });

      const formattedMonthly = Object.keys(monthlyGroups).map((label) => ({
        label,
        count: monthlyGroups[label],
      })).sort((a, b) => {
        // Simple sorting helper
        const parseDate = (lbl) => {
          const parts = lbl.split(" ");
          const mIdx = monthNames.indexOf(parts[0]);
          return new Date(parseInt(parts[1]), mIdx, 1).getTime();
        };
        return parseDate(a.label) - parseDate(b.label);
      });

      return {
        counts: countsMap,
        monthly: formattedMonthly,
      };
    }
  }


}

export const dbService = new DbService();
