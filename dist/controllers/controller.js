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
import { Status } from '../models/models';
import GeminiAPI from '../services/gemini-api';
export default class TaskController {
    constructor() {
        this.db = new Database();
        this.gemini = new GeminiAPI();
        this.timers = new Map();
    }
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.init();
        });
    }
    createTask(description, plannedEndDate, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = {
                id: Date.now(),
                description,
                startDate: new Date(),
                plannedEndDate,
                actualEndDate: null,
                actualDuration: null,
                status: Status.New,
                projectId
            };
            yield this.db.addTask(task);
            return task;
        });
    }
    startTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield this.db.getTaskById(taskId);
            if (!task)
                throw new Error('Task not found');
            task.status = Status.InProgress;
            task.startDate = new Date();
            this.timers.set(taskId, Date.now());
            yield this.db.updateTask(task);
            return this.getResourcesForTask(task.description);
        });
    }
    completeTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            const task = yield this.db.getTaskById(taskId);
            if (!task)
                throw new Error('Task not found');
            task.status = Status.Completed;
            task.actualEndDate = new Date();
            const startTime = this.timers.get(taskId);
            if (startTime) {
                task.actualDuration = (Date.now() - startTime) / 1000;
                this.timers.delete(taskId);
            }
            yield this.db.updateTask(task);
        });
    }
    generatePlanning() {
        return __awaiter(this, void 0, void 0, function* () {
            const tasks = yield this.db.getTasksByStatusAndProject(Status.New);
            return this.generatePlanningWithGemini(tasks);
        });
    }
    addProject(name) {
        return __awaiter(this, void 0, void 0, function* () {
            const project = {
                id: crypto.randomUUID(),
                name
            };
            yield this.db.addProject(project);
            return project;
        });
    }
    deleteProject(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            // Supprimer les tâches associées au projet
            const tasks = yield this.db.getTasksByStatusAndProject(undefined, projectId);
            for (const task of tasks) {
                yield this.db.deleteTask(task.id);
            }
            // Supprimer le projet
            yield this.db.deleteProject(projectId);
        });
    }
    getProjectById(projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.getProjectById(projectId);
        });
    }
    getAllProjects() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.getAllProjects();
        });
    }
    getTasksByStatusAndProject(status, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.getTasksByStatusAndProject(status, projectId);
        });
    }
    getTaskById(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.db.getTaskById(taskId);
        });
    }
    deleteTask(taskId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.deleteTask(taskId);
        });
    }
    updateTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.db.updateTask(task);
        });
    }
    // Méthodes publiques pour accéder à Gemini
    getResourcesForTask(description) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.gemini.getResourcesForTask(description);
        });
    }
    generatePlanningWithGemini(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.gemini.generatePlanning(tasks);
        });
    }
}
