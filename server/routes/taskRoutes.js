import express from "express";
import { createTask, deleteTask, updateTask } from "../controllers/taskController.js";
import { addTaskLink, addTaskFile, deleteTaskAttachment } from "../controllers/taskAttachmentController.js";
import { taskFileUpload } from "../middlewares/taskUpload.js";

const taskRouter = express.Router();

taskRouter.post("/delete", deleteTask);
taskRouter.post("/:taskId/attachments/link", addTaskLink);
taskRouter.post("/:taskId/attachments/file", taskFileUpload.single("file"), addTaskFile);
taskRouter.delete("/:taskId/attachments/:attachmentId", deleteTaskAttachment);
taskRouter.post("/", createTask);
taskRouter.put("/:id", updateTask);

export default taskRouter;
