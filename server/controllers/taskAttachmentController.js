import fs from "fs/promises";
import path from "path";
import prisma from "../configs/prisma.js";

async function assertTaskProjectMember(taskId, userId) {
    const task = await prisma.task.findUnique({ where: { id: taskId } });
    if (!task) {
        return { error: { status: 404, message: "Task not found" } };
    }
    const project = await prisma.project.findUnique({
        where: { id: task.projectId },
        include: { members: true },
    });
    if (!project) {
        return { error: { status: 404, message: "Project not found" } };
    }
    const member = project.members.find((m) => m.userId === userId);
    if (!member) {
        return { error: { status: 403, message: "You are not a member of this project" } };
    }
    return { task, project };
}

function linkTitleFromUrl(urlString) {
    try {
        return new URL(urlString).hostname.replace(/^www\./, "");
    } catch {
        return urlString;
    }
}

export const addTaskLink = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        let { url, title } = req.body || {};

        if (!url || typeof url !== "string" || !url.trim()) {
            return res.status(400).json({ message: "url is required" });
        }
        url = url.trim();
        let parsed;
        try {
            parsed = new URL(url.includes("://") ? url : `https://${url}`);
        } catch {
            return res.status(400).json({ message: "Invalid URL" });
        }
        const href = parsed.toString();
        const label = (title && String(title).trim()) || linkTitleFromUrl(href);

        const gate = await assertTaskProjectMember(taskId, userId);
        if (gate.error) {
            return res.status(gate.error.status).json({ message: gate.error.message });
        }

        const attachment = await prisma.taskAttachment.create({
            data: {
                taskId,
                kind: "LINK",
                title: label,
                url: href,
                uploadedById: userId,
            },
            include: { uploadedBy: true },
        });

        res.json({ attachment });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};

export const addTaskFile = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId } = req.params;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const gate = await assertTaskProjectMember(taskId, userId);
        if (gate.error) {
            await fs.unlink(file.path).catch(() => {});
            return res.status(gate.error.status).json({ message: gate.error.message });
        }

        const publicPath = `/uploads/tasks/${file.filename}`;

        const attachment = await prisma.taskAttachment.create({
            data: {
                taskId,
                kind: "FILE",
                title: file.originalname || file.filename,
                url: publicPath,
                storedName: file.filename,
                mimeType: file.mimetype || null,
                size: file.size ?? null,
                uploadedById: userId,
            },
            include: { uploadedBy: true },
        });

        res.json({ attachment });
    } catch (error) {
        console.log(error);
        if (req.file?.path) {
            await fs.unlink(req.file.path).catch(() => {});
        }
        res.status(500).json({ message: error.code || error.message });
    }
};

export const deleteTaskAttachment = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const { taskId, attachmentId } = req.params;

        const attachment = await prisma.taskAttachment.findFirst({
            where: { id: attachmentId, taskId },
        });

        if (!attachment) {
            return res.status(404).json({ message: "Attachment not found" });
        }

        const gate = await assertTaskProjectMember(taskId, userId);
        if (gate.error) {
            return res.status(gate.error.status).json({ message: gate.error.message });
        }

        const isLead = gate.project.team_lead === userId;
        if (!isLead && attachment.uploadedById !== userId) {
            return res.status(403).json({ message: "Only the uploader or project lead can remove this attachment" });
        }

        if (attachment.kind === "FILE" && attachment.storedName) {
            const fp = path.join(process.cwd(), "uploads", "tasks", attachment.storedName);
            await fs.unlink(fp).catch(() => {});
        }

        await prisma.taskAttachment.delete({ where: { id: attachmentId } });

        res.json({ message: "Attachment removed", id: attachmentId });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};
