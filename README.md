## Project Management Platform

Modern full‑stack project management web app with workspaces, projects, tasks, teams, analytics, and calendar views. The app is built with a **React + Vite + Tailwind** client and an **Express + Prisma + Neon/Postgres** API, with **Clerk** for authentication and **Inngest** for background workflows.

---

## Tech Stack

- **Frontend**
  - React (Vite)
  - React Router
  - Redux Toolkit
  - Tailwind CSS
  - Lucide React icons
  - React Hot Toast
  - Recharts (analytics & charts)

- **Backend**
  - Node.js + Express
  - Prisma ORM
  - Neon (Postgres) via `@neondatabase/serverless` and `@prisma/adapter-neon`
  - Clerk (auth via `@clerk/express`)
  - Inngest (background workflows, webhooks)
  - Nodemailer + Brevo (email)
  - Multer (file uploads)
  - WebSocket (`ws`) for real‑time capabilities

- **Dev & Tooling**
  - Vite
  - ESLint
  - Nodemon

---

## Features

- **Authentication & Workspaces**
  - Secure authentication and user management powered by **Clerk**
  - Organization / workspace support so teams can collaborate in separate spaces
  - Role‑based access (e.g. workspace admins can manage projects)

- **Projects**
  - Create, update, and manage projects within a workspace
  - Project metadata: name, description, **status** (Planning, Active, On Hold, Completed, Cancelled), **priority**, progress, start/end dates
  - Assign a **team lead** and invite members (email‑based)
  - Filter and search projects by name, description, status, and priority

- **Tasks**
  - Create tasks under a project with assignees and comments
  - Track task status (e.g. Todo, In Progress, Done)
  - View **project task summary** (total, completed, in progress)
  - Detailed task view page for focused work

- **Dashboard & Analytics**
  - Personalized dashboard welcoming the signed‑in user
  - High‑level **stats grid** for quick project and task insight
  - Project overview and **recent activity** widgets
  - Analytics view per project, powered by Recharts

- **Calendar & Scheduling**
  - Project calendar view with tasks visualized over time
  - Start and end dates for projects to support planning

- **Team & Collaboration**
  - Team page for viewing members in the current workspace
  - Invite members to projects (project lead–only operation)
  - Role‑based permissions enforced on the backend

- **UX / UI**
  - Modern responsive layout with sidebar navigation
  - Dark mode support via theme slice
  - Toast notifications for important actions

- **Operational**
  - Email notifications and workflows via **Brevo** and **Inngest**
  - Designed for deployment of **server** and **client** on Vercel

---

## Project Structure

High‑level structure:

- `client/` – React + Vite frontend
  - `src/pages/` – main pages (`Dashboard`, `Projects`, `ProjectDetails`, `TaskDetails`, `Team`, `Settings`, `Layout`)
  - `src/components/` – reusable UI (sidebar, navbar, cards, dialogs, analytics, calendar, etc.)
  - `src/features/` – Redux Toolkit slices (`themeSlice`, `workspaceSlice`)
  - `src/app/store.js` – Redux store
  - `src/configs/api.js` – API base configuration
- `server/` – Express + Prisma backend
  - `server.js` – app bootstrap
  - `routes/` – route modules (`projectRoutes`, `taskRoutes`, `workspaceRoutes`, `commentRoutes`)
  - `controllers/` – business logic (projects, tasks, workspaces, comments)
  - `configs/prisma.js` – Prisma client setup
  - `configs/nodemailer.js` – email configuration
  - `middlewares/authMiddleware.js` – auth middleware using Clerk
  - `prisma/schema.prisma` – database schema
  - `inngest/` – Inngest workflows and handlers



## Security & Permissions

- Workspace and project operations enforce **role‑based access control** in the backend.
- Certain actions (like creating projects or adding project members) are restricted to admins or project leads.
- All authenticated routes rely on Clerk middleware to resolve the current user.

---

## Future Improvements (Ideas)

- Add notifications center and real‑time updates for task changes
- Add file attachments per task and project
- More detailed reporting (burn‑down charts, velocity, etc.)
- Integration with external tools (e.g. Slack, calendar sync)

---

## License

This project is provided for learning and practical use. Add your preferred license here (e.g. MIT, ISC) if you plan to open‑source it.
"# project-management" 
