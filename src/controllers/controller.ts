import Database from '../services/database';
import { Task, Project, Status } from '../models/models';
import GeminiAPI from '../services/gemini-api';

export default class TaskController {
  private db: Database;
  private gemini: GeminiAPI;
  private timers: Map<number, number>;

  constructor() {
    this.db = new Database();
    this.gemini = new GeminiAPI();
    this.timers = new Map();
  }

  async initialize(): Promise<void> {
    await this.db.init();
  }

  async createTask(description: string, plannedEndDate: Date, projectId: string): Promise<Task> {
    const task: Task = {
      id: Date.now(),
      description,
      startDate: new Date(),
      plannedEndDate,
      actualEndDate: null,
      actualDuration: null,
      status: Status.New,
      projectId
    };
    await this.db.addTask(task);
    return task;
  }

  async startTask(taskId: number): Promise<string> {
    const task = await this.db.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    task.status = Status.InProgress;
    task.startDate = new Date();

    this.timers.set(taskId, Date.now());
    await this.db.updateTask(task);

    return this.getResourcesForTask(task.description);
  }

  async completeTask(taskId: number): Promise<void> {
    const task = await this.db.getTaskById(taskId);
    if (!task) throw new Error('Task not found');

    task.status = Status.Completed;
    task.actualEndDate = new Date();
    const startTime = this.timers.get(taskId);
    if (startTime) {
      task.actualDuration = (Date.now() - startTime) / 1000;
      this.timers.delete(taskId);
    }
    await this.db.updateTask(task);
  }

  async generatePlanning(): Promise<string> {
    const tasks = await this.db.getTasksByStatusAndProject(Status.New);
    return this.generatePlanningWithGemini(tasks);
  }

  async addProject(name: string): Promise<Project> {
    const project: Project = {
      id: crypto.randomUUID(),
      name
    };
    await this.db.addProject(project);
    return project;
  }

  async deleteProject(projectId: string): Promise<void> {
    // Supprimer les tâches associées au projet
    const tasks = await this.db.getTasksByStatusAndProject(undefined, projectId);
    for (const task of tasks) {
      await this.db.deleteTask(task.id);
    }

    // Supprimer le projet
    await this.db.deleteProject(projectId);
  }

  async getProjectById(projectId: string): Promise<Project | undefined> {
    return this.db.getProjectById(projectId);
  }

  async getAllProjects(): Promise<Project[]> {
    return this.db.getAllProjects();
  }

  async getTasksByStatusAndProject(status?: Status, projectId?: string): Promise<Task[]> {
    return this.db.getTasksByStatusAndProject(status, projectId);
  }

  async getTaskById(taskId: number): Promise<Task | undefined> {
    return this.db.getTaskById(taskId);
  }

  async deleteTask(taskId: number): Promise<void> {
    await this.db.deleteTask(taskId);
  }

  async updateTask(task: Task): Promise<void> {
    await this.db.updateTask(task);
  }

  // Méthodes publiques pour accéder à Gemini
  async getResourcesForTask(description: string): Promise<string> {
    return this.gemini.getResourcesForTask(description);
  }

  async generatePlanningWithGemini(tasks: Task[]): Promise<string> {
    return this.gemini.generatePlanning(tasks);
  }
}
