var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export default class Database {
    constructor() {
        this.dbName = 'TodoApp';
        this.version = 1;
        this.db = null;
    }
    init() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.version);
                request.onupgradeneeded = (evt) => {
                    const db = evt.target.result;
                    if (!db.objectStoreNames.contains('taskts')) {
                        db.createObjectStore('taskts', { keyPath: 'id', autoIncrement: true });
                    }
                    if (!db.objectStoreNames.contains('projects')) {
                        db.createObjectStore('projects', { keyPath: 'id' });
                    }
                };
                request.onsuccess = (evt) => {
                    this.db = evt.target.result;
                    resolve();
                };
                request.onerror = () => reject(request.error);
            });
        });
    }
    addTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['taskts'], 'readwrite');
                const store = transaction.objectStore('taskts');
                const request = store.add(task);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    }
    deleteTask(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['taskts'], 'readwrite');
                const store = transaction.objectStore('taskts');
                const request = store.delete(id);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }
    updateTask(task) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['taskts'], 'readwrite');
                const store = transaction.objectStore('taskts');
                const request = store.put(task);
                request.onsuccess = () => resolve();
                request.onerror = () => reject(request.error);
            });
        });
    }
    getTaskById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['taskts'], 'readonly');
                const store = transaction.objectStore('taskts');
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        });
    }
    getTasksByStatusAndProject(status, projectId) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['taskts'], 'readonly');
                const store = transaction.objectStore('taskts');
                const tasks = [];
                store.openCursor().onsuccess = (evt) => {
                    const cursor = evt.target.result;
                    if (cursor) {
                        const task = cursor.value;
                        if ((!status || task.status === status) && (!projectId || task.projectId === projectId)) {
                            tasks.push(task);
                        }
                        cursor.continue();
                    }
                    else {
                        resolve(tasks);
                    }
                };
                store.openCursor().onerror = (evt) => reject(evt.target.error);
            });
        });
    }
    addProject(project) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['projects'], 'readwrite');
                const store = transaction.objectStore('projects');
                const request = store.add(project);
                request.onsuccess = () => resolve();
                request.onerror = (evt) => reject(evt.target.error);
            });
        });
    }
    deleteProject(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['projects', 'taskts'], 'readwrite');
                const projectStore = transaction.objectStore('projects');
                const taskStore = transaction.objectStore('taskts');
                // Supprimer le projet
                const deleteProjectRequest = projectStore.delete(id);
                // Parcourir toutes les tâches et supprimer celles avec le projectId correspondant
                const cursorRequest = taskStore.openCursor();
                cursorRequest.onsuccess = (event) => {
                    const cursor = event.target.result;
                    if (cursor) {
                        const task = cursor.value;
                        if (task.projectId === id) {
                            cursor.delete();
                        }
                        cursor.continue();
                    }
                };
                deleteProjectRequest.onsuccess = () => {
                    // Attendre que la transaction soit complète, puis recharger la page
                    transaction.oncomplete = () => {
                        resolve();
                        window.location.reload(); // Recharge le navigateur après la suppression
                    };
                };
                deleteProjectRequest.onerror = (evt) => reject(evt.target.error);
                cursorRequest.onerror = (evt) => reject(evt.target.error);
            });
        });
    }
    getProjectById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['projects'], 'readonly');
                const store = transaction.objectStore('projects');
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = (evt) => reject(evt.target.error);
            });
        });
    }
    getAllProjects() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                if (!this.db)
                    throw new Error('Database not initialized');
                const transaction = this.db.transaction(['projects'], 'readonly');
                const store = transaction.objectStore('projects');
                const projects = [];
                store.openCursor().onsuccess = (evt) => {
                    const cursor = evt.target.result;
                    if (cursor) {
                        projects.push(cursor.value);
                        cursor.continue();
                    }
                    else {
                        resolve(projects);
                    }
                };
                store.openCursor().onerror = (evt) => reject(evt.target.error);
            });
        });
    }
}
