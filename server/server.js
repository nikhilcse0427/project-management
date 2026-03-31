import 'dotenv/config';
import './dns-config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import workspaceRouter from "./routes/workspaceRoutes.js";
import projectRouter from "./routes/projectRoutes.js";
import taskRouter from "./routes/taskRoutes.js";
import commentRouter from "./routes/commentRoutes.js";
import { protect } from './middlewares/authMiddleware.js';
import { clerkMiddleware } from '@clerk/express';
import { inngest, functions } from './inngest/index.js';
import { serve } from "inngest/express";

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json());
app.use(cors({
  origin: ["http://localhost:5173", "https://project-management-nqi6.vercel.app"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use(clerkMiddleware());

app.get('/', (req, res) => res.send('Server is live!'));

// Webhooks
app.use("/api/inngest", serve({ client: inngest, functions }));

// Routes
app.use("/api/workspaces", protect, workspaceRouter);
app.use("/api/projects", protect, projectRouter);
app.use("/api/tasks", protect, taskRouter);
app.use("/api/comments", protect, commentRouter);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));