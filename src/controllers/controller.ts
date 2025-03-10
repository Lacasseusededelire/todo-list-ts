import Database from '../services/database'; 
import GeminiAPI from '../services/gemini-api'; 
import { Task, Project, Status } from '../models/models'; 

/**
 *
 *
 * @export
 * @class TaskController
 */
export default class TaskController {
  private db: Database;
  private gemini: GeminiAPI;
  private timers: Map<number, number>;

  /**
   * Creates an instance of TaskController.
   * @memberof TaskController
   */
  constructor() {
    this.db = new Database();
    this.gemini = new GeminiAPI();
    this.timers = new Map<number, number>();
  }

  
  /**
   *
   *
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  async initialize(): Promise<void> {
    await this.db.initialize();
  }

  /**
   *
   *
   * @param {string} description
   * @param {Date} plannedEndDate
   * @param {string} projectId
   * @return {*}  {Promise<number>}
   * @memberof TaskController
   */
  async createTask(description: string, plannedEndDate: Date, projectId: string): Promise<number> {
    const task = new Task(
      0, 
      description,
      null, 
      plannedEndDate,
      null, 
      null, 
      Status.New,
      projectId
    );
    const taskId = await this.db.add("tasks", task); 
    if (typeof taskId !== 'number') {
      throw new Error('Expected a number ID for task, but received a different type');
    }
    return taskId;
  }


/**
 *
 *
 * @param {string} name
 * @return {*}  {Promise<string>}
 * @memberof TaskController
 */
async addProject(name: string): Promise<string> {
  const project = new Project(crypto.randomUUID(), name);
  const projectData = { id: project.id, name: project.name }; // Objet brut
  const projectId = await this.db.add("projects", projectData);
  if (typeof projectId !== 'string') {
    throw new Error('Expected a string ID for project, but received a different type');
  }
  return projectId;
}

  /**
   *
   *
   * @return {*}  {Promise<Project[]>}
   * @memberof TaskController
   */
  async getAllProjects(): Promise<Project[]> {
    return this.db.getAll<Project>("projects");
  }

  /**
   *
   *
   * @param {Status} [status]
   * @param {string} [projectId]
   * @return {*}  {Promise<Task[]>}
   * @memberof TaskController
   */
  async getTasksByStatusAndProject(status?: Status, projectId?: string): Promise<Task[]> {
    const tasks = await this.db.getAll<Task>("tasks");
    return tasks.filter(task =>
      (!status || task.status === status) &&
      (!projectId || task.projectId === projectId)
    );
  }

  /**
   *
   *
   * @param {number} id
   * @return {*}  {Promise<Task>}
   * @memberof TaskController
   */
  async getTaskById(id: number): Promise<Task> {
    const task = await this.db.getById<Task>("tasks", id);
    if (!task) throw new Error(`Task with ID ${id} not found`);
    return task;
  }

  /**
   *
   *
   * @param {number} id
   * @return {*}  {Promise<string>}
   * @memberof TaskController
   */
  async startTask(id: number): Promise<string> {
    const task = await this.getTaskById(id);
    if (task.status === Status.New) {
      task.status = Status.InProgress;
      task.startDate = new Date();
      this.timers.set(id, Date.now());
      await this.db.update("tasks", task);
      return this.gemini.getResourcesForTask(task.description);
    }
    throw new Error(`Task ${id} cannot be started: current status is ${task.status}`);
  }


  /**
   *
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  async completeTask(id: number): Promise<void> {
    const task = await this.getTaskById(id);
    if (task.status === Status.InProgress) {
      task.status = Status.Completed;
      task.actualEndDate = new Date();
      const startTime = this.timers.get(id);
      if (startTime) {
        task.actualDuration = (Date.now() - startTime) / 1000;
        this.timers.delete(id);
      } else {
        task.actualDuration = task.calculateDuration();
      }
      await this.db.update("tasks", task);
    } else {
      throw new Error(`Task ${id} cannot be completed: current status is ${task.status}`);
    }
  }


  /**
   *
   *
   * @param {Task} task
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  async updateTask(task: Task): Promise<void> {
    await this.db.update("tasks", task);
  }


  /**
   *
   *
   * @param {number} id
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  async deleteTask(id: number): Promise<void> {
    this.timers.delete(id);
    await this.db.delete("tasks", id);
  }

  /**
   *
   *
   * @param {string} id
   * @return {*}  {Promise<void>}
   * @memberof TaskController
   */
  async deleteProject(id: string): Promise<void> {
    const tasks = await this.getTasksByStatusAndProject(undefined, id);
    for (const task of tasks) {
      this.timers.delete(task.id);
      await this.deleteTask(task.id);
    }
    await this.db.delete("projects", id);
  }

 
  /**
   *
   *
   * @return {*}  {Promise<string>}
   * @memberof TaskController
   */
  async generatePlanning(): Promise<string> {
    const tasks = await this.db.getAll<Task>("tasks");
    return this.gemini.generatePlanning(tasks);
  }

 
  /**
   *
   *
   * @param {string} description
   * @return {*}  {Promise<string>}
   * @memberof TaskController
   */
  async getResourcesForTask(description: string): Promise<string> {
    return this.gemini.getResourcesForTask(description);
  }


  /**
   *
   *
   * @param {string} projectId
   * @return {*}  {(Promise<Project | undefined>)}
   * @memberof TaskController
   */
  async getProjectById(projectId: string): Promise<Project | undefined> {
    return this.db.getById<Project>("projects", projectId);
  }
}