import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

const ALLOWED_STORY_POINTS = [1, 2, 3, 5, 8, 13];

// Create task
export const createTask = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const { projectId, title, description, type, status, priority, assigneeId, due_date, storyPoints } = req.body;
        const origin = req.get('origin');

        // Check if user has admin role for project
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        }
        else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }
        else if (assigneeId && !project.members.find((member) => member.user.id === assigneeId) && project.team_lead !== assigneeId) {
            return res.status(403).json({ message: "assignee is not a member of the project / workspace" });
        }

        const parsedStoryPoints =
            storyPoints === undefined || storyPoints === null || storyPoints === ""
                ? null
                : Number(storyPoints);

        if (
            parsedStoryPoints !== null &&
            (!Number.isInteger(parsedStoryPoints) || !ALLOWED_STORY_POINTS.includes(parsedStoryPoints))
        ) {
            return res.status(400).json({ message: "storyPoints must be one of 1, 2, 3, 5, 8, 13" });
        }

        const task = await prisma.task.create({
            data: {
                projectId,
                title,
                description,
                storyPoints: parsedStoryPoints,
                type,
                priority,
                assigneeId: assigneeId || null,
                status,
                due_date: new Date(due_date),
            }
        });

        const taskWithAssignee = await prisma.task.findUnique({
            where: { id: task.id },
            include: { assignee: true, attachments: { include: { uploadedBy: true } } },
        });

        await inngest.send({
            name: "app/task.assigned",
            data: {
                taskId: task.id, origin
            }
        })

        res.json({ task: taskWithAssignee, message: "Task created successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};


// Update task
export const updateTask = async (req, res) => {
    try {

        const task = await prisma.task.findUnique({
            where: { id: req.params.id },
        });

        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const { userId } = await req.auth();

        const project = await prisma.project.findUnique({
            where: { id: task.projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }

        const updatePayload = { ...req.body };

        if (Object.prototype.hasOwnProperty.call(updatePayload, "storyPoints")) {
            const parsedStoryPoints =
                updatePayload.storyPoints === undefined ||
                    updatePayload.storyPoints === null ||
                    updatePayload.storyPoints === ""
                    ? null
                    : Number(updatePayload.storyPoints);

            if (
                parsedStoryPoints !== null &&
                (!Number.isInteger(parsedStoryPoints) || !ALLOWED_STORY_POINTS.includes(parsedStoryPoints))
            ) {
                return res.status(400).json({ message: "storyPoints must be one of 1, 2, 3, 5, 8, 13" });
            }
            updatePayload.storyPoints = parsedStoryPoints;
        }

        const updatedTask = await prisma.task.update({
            where: { id: req.params.id },
            data: {
                ...updatePayload,
                assigneeId: updatePayload.assigneeId || null,
            },
        });

        res.json({ message: "Task updated successfully", task: updatedTask });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

// Delete task
export const deleteTask = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const { tasksIds } = req.body;

        const tasks = await prisma.task.findMany({
            where: { id: { in: tasksIds } },
        });

        if (tasks.length === 0) {
            return res.status(404).json({ message: "Task not found" });
        }

        const project = await prisma.project.findUnique({
            where: { id: tasks[0].projectId },
            include: { members: { include: { user: true } } },
        });

        if (!project) {
            return res.status(404).json({ message: "Project not found" });
        } else if (project.team_lead !== userId) {
            return res.status(403).json({ message: "You don't have admin privileges for this project" });
        }

        await prisma.task.deleteMany({
            where: { id: { in: tasksIds } },
        });

        res.json({ message: "Task deleted successfully" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};