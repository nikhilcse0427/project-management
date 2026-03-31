import { useEffect, useState, useCallback, useMemo } from "react";
import { useAuth, useUser } from "@clerk/clerk-react";
import { useSearchParams } from "react-router-dom";
import { format } from "date-fns";
import toast from "react-hot-toast";
import api from "../configs/api";
import {
    CalendarIcon,
    Link2,
    MessageCircle,
    PenIcon,
    Paperclip,
    Trash2,
    Upload,
    ExternalLink,
} from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addTaskAttachment, removeTaskAttachment } from "../features/workspaceSlice";

const fileBaseUrl = import.meta.env.VITE_BASEURL || "";

const TaskDetails = () => {
    const [searchParams] = useSearchParams();
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

    const { getToken } = useAuth();
    const { user } = useUser();
    const dispatch = useDispatch();
    const { currentWorkspace } = useSelector((state) => state.workspace);

    const project = useMemo(
        () => currentWorkspace?.projects?.find((p) => p.id === projectId),
        [currentWorkspace, projectId]
    );
    const task = useMemo(
        () => project?.tasks?.find((t) => t.id === taskId),
        [project, taskId]
    );

    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [linkUrl, setLinkUrl] = useState("");
    const [linkTitle, setLinkTitle] = useState("");
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);

    const attachments = task?.attachments ?? [];

    const fetchComments = async () => {
        if (!taskId) return;
        try {
            const token = await getToken();
            const { data } = await api.get(`/api/comments/${taskId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setComments(data.comments || []);
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleAddComment = async () => {
        if (!newComment.trim() || !task?.id) return;

        try {
            toast.loading("Adding comment...");

            const token = await getToken();
            const { data } = await api.post(
                `/api/comments`,
                { taskId: task.id, content: newComment },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComments((prev) => [...prev, data.comment]);
            setNewComment("");
            toast.dismissAll();
            toast.success("Comment added.");
        } catch (error) {
            toast.dismissAll();
            toast.error(error?.response?.data?.message || error.message);
            console.error(error);
        }
    };

    const uploadFiles = async (files) => {
        if (!task?.id || !projectId || !files?.length) return;
        const token = await getToken();
        setUploading(true);
        try {
            for (const file of files) {
                const formData = new FormData();
                formData.append("file", file);
                const { data } = await api.post(`/api/tasks/${task.id}/attachments/file`, formData, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                dispatch(addTaskAttachment({ projectId, taskId: task.id, attachment: data.attachment }));
            }
            toast.success(files.length > 1 ? `${files.length} files uploaded` : "File uploaded");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAddLink = async (e) => {
        e.preventDefault();
        if (!linkUrl.trim() || !task?.id) return;
        try {
            const token = await getToken();
            const { data } = await api.post(
                `/api/tasks/${task.id}/attachments/link`,
                { url: linkUrl.trim(), title: linkTitle.trim() || undefined },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            dispatch(addTaskAttachment({ projectId, taskId: task.id, attachment: data.attachment }));
            setLinkUrl("");
            setLinkTitle("");
            toast.success("Link added");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const handleRemoveAttachment = async (attachment) => {
        if (!task?.id) return;
        try {
            const token = await getToken();
            await api.delete(`/api/tasks/${task.id}/attachments/${attachment.id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            dispatch(removeTaskAttachment({ projectId, taskId: task.id, attachmentId: attachment.id }));
            toast.success("Removed");
        } catch (error) {
            toast.error(error?.response?.data?.message || error.message);
        }
    };

    const onDrop = useCallback(
        (e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragOver(false);
            const files = Array.from(e.dataTransfer?.files || []);
            if (files.length) uploadFiles(files);
        },
        [task?.id, projectId]
    );

    useEffect(() => {
        if (taskId && task) {
            fetchComments();
            const interval = setInterval(() => {
                fetchComments();
            }, 10000);
            return () => clearInterval(interval);
        }
    }, [taskId, task?.id]);

    if (!currentWorkspace) {
        return <div className="text-gray-500 dark:text-zinc-400 px-4 py-6">Loading…</div>;
    }
    if (!projectId || !taskId) {
        return <div className="text-red-500 px-4 py-6">Missing project or task.</div>;
    }
    if (!task) {
        return <div className="text-red-500 px-4 py-6">Task not found.</div>;
    }

    const canRemoveAttachment = (att) =>
        user?.id === att.uploadedBy?.id || user?.id === project?.team_lead;

    return (
        <div className="flex flex-col-reverse lg:flex-row gap-6 sm:p-4 text-gray-900 dark:text-zinc-100 max-w-6xl mx-auto">
            <div className="w-full lg:w-2/3">
                <div className="p-5 rounded-md border border-gray-300 dark:border-zinc-800 flex flex-col lg:h-[80vh]">
                    <h2 className="text-base font-semibold flex items-center gap-2 mb-4 text-gray-900 dark:text-white">
                        <MessageCircle className="size-5" /> Task Discussion ({comments.length})
                    </h2>

                    <div className="flex-1 md:overflow-y-scroll no-scrollbar">
                        {comments.length > 0 ? (
                            <div className="flex flex-col gap-4 mb-6 mr-2">
                                {comments.map((comment) => (
                                    <div
                                        key={comment.id}
                                        className={`sm:max-w-4/5 dark:bg-gradient-to-br dark:from-zinc-800 dark:to-zinc-900 border border-gray-300 dark:border-zinc-700 p-3 rounded-md ${
                                            comment.user.id === user?.id ? "ml-auto" : "mr-auto"
                                        }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1 text-sm text-gray-500 dark:text-zinc-400">
                                            <img src={comment.user.image} alt="avatar" className="size-5 rounded-full" />
                                            <span className="font-medium text-gray-900 dark:text-white">
                                                {comment.user.name}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-zinc-600">
                                                • {format(new Date(comment.createdAt), "dd MMM yyyy, HH:mm")}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-900 dark:text-zinc-200">{comment.content}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-600 dark:text-zinc-500 mb-4 text-sm">
                                No comments yet. Be the first!
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-3">
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Write a comment..."
                            className="w-full dark:bg-zinc-800 border border-gray-300 dark:border-zinc-700 rounded-md p-2 text-sm text-gray-900 dark:text-zinc-200 resize-none focus:outline-none focus:ring-1 focus:ring-blue-600"
                            rows={3}
                        />
                        <button
                            onClick={handleAddComment}
                            className="bg-gradient-to-l from-blue-500 to-blue-600 transition-colors text-white text-sm px-5 py-2 rounded"
                        >
                            Post
                        </button>
                    </div>
                </div>
            </div>

            <div className="w-full lg:w-1/2 flex flex-col gap-6">
                <div className="p-5 rounded-md bg-white dark:bg-zinc-900 border border-gray-300 dark:border-zinc-800">
                    <div className="mb-3">
                        <h1 className="text-lg font-medium text-gray-900 dark:text-zinc-100">{task.title}</h1>
                        <div className="flex flex-wrap gap-2 mt-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-900 dark:text-zinc-300 text-xs">
                                {task.status}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-300 text-xs">
                                {task.type}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-green-200 dark:bg-emerald-900 text-green-900 dark:text-emerald-300 text-xs">
                                {task.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-200 dark:bg-indigo-900 text-indigo-900 dark:text-indigo-300 text-xs">
                                Story Points: {task.storyPoints || 0}
                            </span>
                        </div>
                    </div>

                    {task.description && (
                        <p className="text-sm text-gray-600 dark:text-zinc-400 leading-relaxed mb-4">
                            {task.description}
                        </p>
                    )}

                    <hr className="border-zinc-200 dark:border-zinc-700 my-3" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-700 dark:text-zinc-300 mb-6">
                        <div className="flex items-center gap-2">
                            <img src={task.assignee?.image} className="size-5 rounded-full" alt="avatar" />
                            {task.assignee?.name || "Unassigned"}
                        </div>
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="size-4 text-gray-500 dark:text-zinc-500" />
                            Due : {format(new Date(task.due_date), "dd MMM yyyy")}
                        </div>
                    </div>

                    <div className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4 bg-zinc-50/80 dark:bg-zinc-800/40">
                        <h3 className="text-sm font-semibold flex items-center gap-2 text-gray-900 dark:text-white mb-3">
                            <Paperclip className="size-4" />
                            Files & links
                        </h3>

                        <div
                            onDragEnter={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                setDragOver(true);
                            }}
                            onDragLeave={(e) => {
                                e.preventDefault();
                                if (e.currentTarget === e.target) setDragOver(false);
                            }}
                            onDrop={onDrop}
                            className={`rounded-md border-2 border-dashed px-4 py-8 text-center text-sm transition-colors mb-4 ${
                                dragOver
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                    : "border-gray-300 dark:border-zinc-600 text-gray-500 dark:text-zinc-400"
                            }`}
                        >
                            <Upload className="size-8 mx-auto mb-2 opacity-60" />
                            <p className="font-medium text-gray-700 dark:text-zinc-300">Drag & drop files here</p>
                            <p className="text-xs mt-1">or pick from your device (max 10 MB each)</p>
                            <label className="mt-3 inline-block cursor-pointer text-blue-600 dark:text-blue-400 text-sm font-medium">
                                Browse files
                                <input
                                    type="file"
                                    className="hidden"
                                    multiple
                                    disabled={uploading}
                                    onChange={(e) => uploadFiles(Array.from(e.target.files || []))}
                                />
                            </label>
                        </div>

                        <form onSubmit={handleAddLink} className="flex flex-col gap-2 mb-4">
                            <div className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-zinc-400">
                                <Link2 className="size-3.5" />
                                Add link
                            </div>
                            <input
                                type="text"
                                value={linkUrl}
                                onChange={(e) => setLinkUrl(e.target.value)}
                                placeholder="https://…"
                                className="w-full rounded-md dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 px-3 py-2 text-sm"
                            />
                            <input
                                type="text"
                                value={linkTitle}
                                onChange={(e) => setLinkTitle(e.target.value)}
                                placeholder="Label (optional)"
                                className="w-full rounded-md dark:bg-zinc-900 border border-gray-300 dark:border-zinc-600 px-3 py-2 text-sm"
                            />
                            <button
                                type="submit"
                                className="self-start text-sm px-4 py-1.5 rounded-md bg-zinc-200 dark:bg-zinc-700 text-gray-900 dark:text-zinc-100 hover:opacity-90"
                            >
                                Add link
                            </button>
                        </form>

                        {attachments.length === 0 ? (
                            <p className="text-xs text-gray-500 dark:text-zinc-500">No files or links yet.</p>
                        ) : (
                            <ul className="space-y-2">
                                {attachments.map((att) => (
                                    <li
                                        key={att.id}
                                        className="flex items-start justify-between gap-2 rounded-md border border-gray-200 dark:border-zinc-600 px-3 py-2 text-sm bg-white dark:bg-zinc-900"
                                    >
                                        <div className="min-w-0 flex-1">
                                            {att.kind === "LINK" ? (
                                                <a
                                                    href={att.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                                                >
                                                    {att.title}
                                                    <ExternalLink className="size-3 shrink-0" />
                                                </a>
                                            ) : (
                                                <a
                                                    href={`${fileBaseUrl}${att.url}`}
                                                    download
                                                    className="text-blue-600 dark:text-blue-400 hover:underline font-medium break-all"
                                                >
                                                    {att.title}
                                                </a>
                                            )}
                                            <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                                                {att.uploadedBy?.name}
                                                {att.size != null
                                                    ? ` · ${(att.size / 1024).toFixed(1)} KB`
                                                    : ""}
                                            </p>
                                        </div>
                                        {canRemoveAttachment(att) && (
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveAttachment(att)}
                                                className="p-1.5 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40"
                                                title="Remove"
                                            >
                                                <Trash2 className="size-4" />
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>

                {project && (
                    <div className="p-4 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 border border-gray-300 dark:border-zinc-800">
                        <p className="text-xl font-medium mb-4">Project Details</p>
                        <h2 className="text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                            <PenIcon className="size-4" /> {project.name}
                        </h2>
                        <p className="text-xs mt-3">
                            Project Start Date: {format(new Date(project.start_date), "dd MMM yyyy")}
                        </p>
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500 dark:text-zinc-400 mt-3">
                            <span>Status: {project.status}</span>
                            <span>Priority: {project.priority}</span>
                            <span>Progress: {project.progress}%</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskDetails;
