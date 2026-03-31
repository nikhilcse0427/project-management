import multer from "multer";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const uploadsDir = path.join(process.cwd(), "uploads", "tasks");

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "") || "";
        cb(null, `${randomUUID()}${ext}`);
    },
});

export const taskFileUpload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
});
