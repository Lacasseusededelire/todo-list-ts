var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
    /**
     * Creates an instance of TaskController.
     * @memberof TaskController
     */
    constructor() {
        this.db = new Database();
        this.gemini = new GeminiAPI();
        this.timers = new Map();
    }
    /**
     *
     *
     * @return {*}  {Promise<void>}
     * @memberof TaskController
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.initialize();
        });
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
    createTask(description, plannedEndDate, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = new Task(0, description, null, plannedEndDate, null, null, Status.New, projectId);
            const taskId = yield this.db.add("tasks", task);
            if (typeof taskId !== 'number') {
                throw new Error('Expected a number ID for task, but received a different type');
            }
            return taskId;
        });
    }
    /**
     *
     *
     * @param {string} name
     * @return {*}  {Promise<string>}
     * @memberof TaskController
     */
    addProject(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = new Project(crypto.randomUUID(), name);
            const projectData = { id: project.id, name: project.name }; // Objet brut
            const projectId = yield this.db.add("projects", projectData);
            if (typeof projectId !== 'string') {
                throw new Error('Expected a string ID for project, but received a different type');
            }
            return projectId;
        });
    }
    /**
     *
     *
     * @return {*}  {Promise<Project[]>}
     * @memberof TaskController
     */
    getAllProjects() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.getAll("projects");
        });
    }
    /**
     *
     *
     * @param {Status} [status]
     * @param {string} [projectId]
     * @return {*}  {Promise<Task[]>}
     * @memberof TaskController
     */
    getTasksByStatusAndProject(status, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this.db.getAll("tasks");
            return tasks.filter(task => (!status || task.status === status) &&
                (!projectId || task.projectId === projectId));
        });
    }
    /**
     *
     *
     * @param {number} id
     * @return {*}  {Promise<Task>}
     * @memberof TaskController
     */
    getTaskById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield this.db.getById("tasks", id);
            if (!task)
                throw new Error(`Task with ID ${id} not found`);
            return task;
        });
    }
    /**
     *
     *
     * @param {number} id
     * @return {*}  {Promise<string>}
     * @memberof TaskController
     */
    startTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield this.getTaskById(id);
            if (task.status === Status.New) {
                task.status = Status.InProgress;
                task.startDate = new Date();
                this.timers.set(id, Date.now());
                yield this.db.update("tasks", task);
                return this.gemini.getResourcesForTask(task.description);
            }
            throw new Error(`Task ${id} cannot be started: current status is ${task.status}`);
        });
    }
    /**
     *
     *
     * @param {number} id
     * @return {*}  {Promise<void>}
     * @memberof TaskController
     */
    completeTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield this.getTaskById(id);
            if (task.status === Status.InProgress) {
                task.status = Status.Completed;
                task.actualEndDate = new Date();
                const startTime = this.timers.get(id);
                if (startTime) {
                    task.actualDuration = (Date.now() - startTime) / 1000;
                    this.timers.delete(id);
                }
                else {
                    task.actualDuration = task.calculateDuration();
                }
                yield this.db.update("tasks", task);
            }
            else {
                throw new Error(`Task ${id} cannot be completed: current status is ${task.status}`);
            }
        });
    }
    /**
     *
     *
     * @param {Task} task
     * @return {*}  {Promise<void>}
     * @memberof TaskController
     */
    updateTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.update("tasks", task);
        });
    }
    /**
     *
     *
     * @param {number} id
     * @return {*}  {Promise<void>}
     * @memberof TaskController
     */
    deleteTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            this.timers.delete(id);
            yield this.db.delete("tasks", id);
        });
    }
    /**
     *
     *
     * @param {string} id
     * @return {*}  {Promise<void>}
     * @memberof TaskController
     */
    deleteProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this.getTasksByStatusAndProject(undefined, id);
            for (const task of tasks) {
                this.timers.delete(task.id);
                yield this.deleteTask(task.id);
            }
            yield this.db.delete("projects", id);
        });
    }
    /**
     *
     *
     * @return {*}  {Promise<string>}
     * @memberof TaskController
     */
    generatePlanning() {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this.db.getAll("tasks");
            return this.gemini.generatePlanning(tasks);
        });
    }
    /**
     *
     *
     * @param {string} description
     * @return {*}  {Promise<string>}
     * @memberof TaskController
     */
    getResourcesForTask(description) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.gemini.getResourcesForTask(description);
        });
    }
    /**
     *
     *
     * @param {string} projectId
     * @return {*}  {(Promise<Project | undefined>)}
     * @memberof TaskController
     */
    getProjectById(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.getById("projects", projectId);
        });
    }
}
