import prisma from "../configs/prisma.js";

// Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try {

        const { userId } = await req.auth();
        const workspaces = await prisma.workspace.findMany({
            where: {
                members: { some: { userId: userId } }
            },
            include: {
                members: { include: { user: true } },
                projects: {
                    include: {
                        tasks: {
                            include: {
                                assignee: true,
                                comments: { include: { user: true } },
                                attachments: { include: { uploadedBy: true } },
                                subTasks: { include: { assignee: true } },
                            },
                        },
                        members: { include: { user: true } }
                    }
                },
                owner: true
            }
        });
        res.json({ workspaces });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.code || error.message });
    }
};