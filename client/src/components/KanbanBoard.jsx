import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useDispatch } from "react-redux";
import { updateTask } from "../features/workspaceSlice";
import { useAuth } from "@clerk/clerk-react";
import api from "../configs/api";
import toast from "react-hot-toast";
import { Bug, CalendarIcon, GitCommit, MessageSquare, Square, Zap, MoreVertical } from "lucide-react";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";

const typeIcons = {
  BUG: { icon: Bug, color: "text-red-600 dark:text-red-400" },
  FEATURE: { icon: Zap, color: "text-blue-600 dark:text-blue-400" },
  TASK: { icon: Square, color: "text-green-600 dark:text-green-400" },
  IMPROVEMENT: { icon: GitCommit, color: "text-purple-600 dark:text-purple-400" },
  OTHER: { icon: MessageSquare, color: "text-amber-600 dark:text-amber-400" },
};

const priorityColors = {
  LOW: "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400",
  MEDIUM: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400",
  HIGH: "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400",
};

const COLUMNS = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "DONE", title: "Done" },
];

export default function KanbanBoard({ tasks }) {
  const dispatch = useDispatch();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const taskId = draggableId;
    const newStatus = destination.droppableId;

    try {
      const token = await getToken();
      const task = tasks.find(t => t.id === taskId);

      // Optimistic Update
      const updatedTask = { ...task, status: newStatus };
      dispatch(updateTask(updatedTask));

      await api.put(`/api/tasks/${taskId}`, { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`Task moved to ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      toast.error("Failed to update task status");
      // Revert on error if necessary (though current slice might need work for that)
    }
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-col md:flex-row gap-6 h-full min-h-[600px] overflow-x-auto pb-6">
        {COLUMNS.map((column) => (
          <div key={column.id} className="flex-1 min-w-[300px] flex flex-col">
            <div className="mb-4 flex items-center justify-between px-2">
              <h3 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 uppercase tracking-wider flex items-center gap-2">
                {column.title}
                <span className="text-xs bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full font-normal">
                  {tasks.filter(t => t.status === column.id).length}
                </span>
              </h3>
              <button className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded">
                <MoreVertical className="size-4 text-zinc-500" />
              </button>
            </div>

            <Droppable droppableId={column.id}>
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`flex-1 rounded-xl p-2 transition-colors flex flex-col gap-3 min-h-[200px] ${snapshot.isDraggingOver ? "bg-zinc-100/50 dark:bg-zinc-800/30" : "bg-transparent"
                    }`}
                >
                  {tasks
                    .filter((task) => task.status === column.id)
                    .map((task, index) => (
                      <Draggable key={task.id} draggableId={task.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            onClick={() => navigate(`/taskDetails?projectId=${task.projectId}&taskId=${task.id}`)}
                            className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-lg shadow-sm hover:shadow-md transition-all group ${snapshot.isDragging ? "shadow-xl ring-2 ring-blue-500/50 scale-[1.02]" : ""
                              }`}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                {typeIcons[task.type] && (
                                  <div className={`${typeIcons[task.type].color}`}>
                                    {(() => {
                                      const Icon = typeIcons[task.type].icon;
                                      return <Icon className="size-3.5" />;
                                    })()}
                                  </div>
                                )}
                                <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-tighter">
                                  {task.type}
                                </span>
                              </div>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-medium ${priorityColors[task.priority]}`}>
                                {task.priority}
                              </span>
                            </div>

                            <h4 className="text-sm font-semibold mb-2 group-hover:text-blue-500 transition-colors line-clamp-2">
                              {task.title}
                            </h4>

                            {task.description && (
                              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 line-clamp-3 leading-relaxed">
                                {task.description}
                              </p>
                            )}

                            <div className="flex items-center justify-between mt-auto">
                              <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                                <CalendarIcon className="size-3" />
                                {format(new Date(task.due_date), "MMM d")}
                              </div>

                              <div className="flex items-center gap-2">
                                {task.storyPoints && (
                                  <span className="text-[10px] bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">
                                    {task.storyPoints}
                                  </span>
                                )}
                                <img
                                  src={task.assignee?.image || "https://ui-avatars.com/api/?name=" + (task.assignee?.name || "U")}
                                  className="size-6 rounded-full border border-zinc-200 dark:border-zinc-800"
                                  alt="assignee"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
}
