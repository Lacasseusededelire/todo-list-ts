import Database from './database';
import { Task, Statu_tache } from './models';
import GeminiAPI from './gemini-api';

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
      starDate: new Date(),
      plannedEndDate,
      actualEndDate: null,
      actualDuration: null,
      status: Statu_tache.New,
      projectId
    };
    await this.db.addTask(task);
    return task;
  }

  async startTask(taskId: number): Promise<string> {
    const tasks = await this.db.getTasksByStatusAndProject();
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    task.status = Statu_tache.IN_PROGRESS;
    task.starDate = new Date();
    
    this.timers.set(taskId, Date.now());
    await this.db.addTask(task);
    
    return this.gemini.getResourcesForTask(task.description);
  }

  async completeTask(taskId: number): Promise<void> {
    const tasks = await this.db.getTasksByStatusAndProject();
    const task = tasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    task.status = Statu_tache.COMPLETED;
    task.actualEndDate = new Date();
    const startTime = this.timers.get(taskId);
    if (startTime) {
      task.actualDuration = (Date.now() - startTime) / 1000;
      this.timers.delete(taskId);
    }
    await this.db.addTask(task);
  }

  async generatePlanning(): Promise<string> {
    const tasks = await this.db.getTasksByStatusAndProject(Statu_tache.New);
    return this.gemini.generatePlanning(tasks);
  }
}