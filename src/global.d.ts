declare global {
    /**
     *
     *
     * @interface Window
     */
    interface Window {
      startTask: (taskId: number) => Promise<void>;
      completeTask: (taskId: number) => Promise<void>;
      editTask: (taskId: number) => Promise<void>;
      deleteTask: (taskId: number) => Promise<void>;
      getResources: (taskId: number) => Promise<void>;
      deleteProject: (projectId: string) => Promise<void>;
      generatePlanning: () => Promise<void>;
      searchTasksProjects: () => void;
      filterTasks: () => void;
      resetSearch: () => void;
    }
  }
  
  export {};
  