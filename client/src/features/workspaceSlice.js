import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../configs/api";

// ✅ Fetch Workspaces
export const fetchWorkspaces = createAsyncThunk(
  "workspace/fetchWorkspaces",
  async ({ getToken }) => {
    try {
      const token = await getToken();

      const { data } = await api.get("/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return data.workspaces || [];
    } catch (error) {
      console.log(error?.response?.data?.message || error.message);
      return [];
    }
  }
);

const initialState = {
  workspaces: [],
  currentWorkspace: null,
  loading: false,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,

  reducers: {
    setWorkspaces: (state, action) => {
      state.workspaces = action.payload;
    },

    setCurrentWorkspace: (state, action) => {
      // store id as string and compare as strings to avoid type-mismatch
      localStorage.setItem("currentWorkspaceId", String(action.payload));
      state.currentWorkspace =
        state.workspaces.find((w) => String(w.id) === String(action.payload)) ||
        null;
    },

    addWorkspace: (state, action) => {
      state.workspaces.push(action.payload);
      state.currentWorkspace = action.payload;
    },

    updateWorkspace: (state, action) => {
      state.workspaces = state.workspaces.map((w) =>
        w.id === action.payload.id ? action.payload : w
      );

      if (state.currentWorkspace?.id === action.payload.id) {
        state.currentWorkspace = action.payload;
      }
    },

    deleteWorkspace: (state, action) => {
      state.workspaces = state.workspaces.filter(
        (w) => w.id !== action.payload
      );

      if (state.currentWorkspace?.id === action.payload) {
        state.currentWorkspace = state.workspaces[0] || null;
      }
    },

    addProject: (state, action) => {
      if (!state.currentWorkspace) return;

      state.currentWorkspace.projects.push(action.payload);

      const workspace = state.workspaces.find(
        (w) => w.id === state.currentWorkspace.id
      );

      if (workspace) {
        workspace.projects.push(action.payload);
      }
    },

    addTask: (state, action) => {
      if (!state.currentWorkspace) return;

      const { projectId } = action.payload;

      const project = state.currentWorkspace.projects.find(
        (p) => p.id === projectId
      );

      if (project) {
        project.tasks.push(action.payload);
      }

      const workspace = state.workspaces.find(
        (w) => w.id === state.currentWorkspace.id
      );

      if (workspace) {
        const p = workspace.projects.find((p) => p.id === projectId);
        if (p) p.tasks.push(action.payload);
      }
    },

    updateTask: (state, action) => {
      if (!state.currentWorkspace) return;

      const { projectId, id } = action.payload;

      const updateTaskInProjects = (projects) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        const index = project.tasks.findIndex((t) => t.id === id);
        if (index !== -1) {
          project.tasks[index] = action.payload;
        }
      };

      updateTaskInProjects(state.currentWorkspace.projects);

      const workspace = state.workspaces.find(
        (w) => w.id === state.currentWorkspace.id
      );

      if (workspace) {
        updateTaskInProjects(workspace.projects);
      }
    },

    deleteTask: (state, action) => {
      if (!state.currentWorkspace) return;

      const taskIds = action.payload;

      const removeTasks = (projects) => {
        projects.forEach((p) => {
          p.tasks = p.tasks.filter((t) => !taskIds.includes(t.id));
        });
      };

      removeTasks(state.currentWorkspace.projects);

      const workspace = state.workspaces.find(
        (w) => w.id === state.currentWorkspace.id
      );

      if (workspace) {
        removeTasks(workspace.projects);
      }
    },

    addTaskAttachment: (state, action) => {
      if (!state.currentWorkspace) return;

      const { projectId, taskId, attachment } = action.payload;

      const updateAttachments = (projects) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;

        task.attachments = [...(task.attachments || []), attachment];
      };

      updateAttachments(state.currentWorkspace.projects);

      const workspace = state.workspaces.find(
        (w) => w.id === state.currentWorkspace.id
      );

      if (workspace) {
        updateAttachments(workspace.projects);
      }
    },

    removeTaskAttachment: (state, action) => {
      if (!state.currentWorkspace) return;

      const { projectId, taskId, attachmentId } = action.payload;

      const removeAttachment = (projects) => {
        const project = projects.find((p) => p.id === projectId);
        if (!project) return;

        const task = project.tasks.find((t) => t.id === taskId);
        if (!task) return;

        task.attachments = (task.attachments || []).filter(
          (a) => a.id !== attachmentId
        );
      };

      removeAttachment(state.currentWorkspace.projects);

      const workspace = state.workspaces.find(
        (w) => w.id === state.currentWorkspace.id
      );

      if (workspace) {
        removeAttachment(workspace.projects);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkspaces.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchWorkspaces.fulfilled, (state, action) => {
        state.workspaces = action.payload;

        if (action.payload.length > 0) {
          const savedId = localStorage.getItem("currentWorkspaceId");

          // localStorage stores strings — compare using String(...) to avoid mismatches
          state.currentWorkspace =
            (savedId &&
              action.payload.find((w) => String(w.id) === String(savedId))) ||
            action.payload[0];
        } else {
          state.currentWorkspace = null;
        }

        state.loading = false;
      })

      .addCase(fetchWorkspaces.rejected, (state) => {
        state.loading = false;
      });
  },
});

export const {
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  updateWorkspace,
  deleteWorkspace,
  addProject,
  addTask,
  updateTask,
  deleteTask,
  addTaskAttachment,
  removeTaskAttachment,
} = workspaceSlice.actions;

export default workspaceSlice.reducer;