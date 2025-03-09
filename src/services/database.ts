import { Task, Project, Status } from '../models/models';

export default class Database {
  private dbName: string = 'TodoApp';
  private version: number = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onupgradeneeded = (evt) => {
        const db = (evt.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('taskts')) {
          db.createObjectStore('taskts', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('projects')) {
          db.createObjectStore('projects', { keyPath: 'id' });
        }
      };

      request.onsuccess = (evt) => {
        this.db = (evt.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  async addTask(task: Task): Promise<number> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction(['taskts'], 'readwrite');
      const store = transaction.objectStore('taskts');
      const request = store.add(task);

      request.onsuccess = () => resolve(request.result as number);
      request.onerror = () => reject(request.error);
    });
  }

  async deleteTask(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction(['taskts'], 'readwrite');
      const store = transaction.objectStore('taskts');
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async updateTask(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction(['taskts'], 'readwrite');
      const store = transaction.objectStore('taskts');
      const request = store.put(task);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');

      const transaction = this.db.transaction(['taskts'], 'readonly');
      const store = transaction.objectStore('taskts');
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as Task);
      request.onerror = () => reject(request.error);
    });
  }

  async getTasksByStatusAndProject(status?: Status, projectId?: string): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
  
      const transaction = this.db.transaction(['taskts'], 'readonly');
      const store = transaction.objectStore('taskts');
      const tasks: Task[] = [];
  
      store.openCursor().onsuccess = (evt: Event) => {
        const cursor = (evt.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const task = cursor.value as Task;
          if ((!status || task.status === status) && (!projectId || task.projectId === projectId)) {
            tasks.push(task);
          }
          cursor.continue();
        } else {
          resolve(tasks);
        }
      };
  
      store.openCursor().onerror = (evt: Event) => reject((evt.target as IDBRequest).error);
    });
  }
  
  async addProject(project: Project): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
  
      const transaction = this.db.transaction(['projects'], 'readwrite');
      const store = transaction.objectStore('projects');
      const request = store.add(project);
  
      request.onsuccess = () => resolve();
      request.onerror = (evt: Event) => reject((evt.target as IDBRequest).error);
    });
  }
  
  async deleteProject(id: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
  
      const transaction = this.db.transaction(['projects', 'taskts'], 'readwrite');
      const projectStore = transaction.objectStore('projects');
      const taskStore = transaction.objectStore('taskts');
  
      // Supprimer le projet
      const deleteProjectRequest = projectStore.delete(id);
      
      // Parcourir toutes les tâches et supprimer celles avec le projectId correspondant
      const cursorRequest = taskStore.openCursor();
  
      cursorRequest.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const task = cursor.value as Task;
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
  
      deleteProjectRequest.onerror = (evt: Event) => reject((evt.target as IDBRequest).error);
      cursorRequest.onerror = (evt: Event) => reject((evt.target as IDBRequest).error);
    });
  }
  
  async getProjectById(id: string): Promise<Project | undefined> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
  
      const transaction = this.db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const request = store.get(id);
  
      request.onsuccess = () => resolve(request.result as Project);
      request.onerror = (evt: Event) => reject((evt.target as IDBRequest).error);
    });
  }
  
  async getAllProjects(): Promise<Project[]> {
    return new Promise((resolve, reject) => {
      if (!this.db) throw new Error('Database not initialized');
  
      const transaction = this.db.transaction(['projects'], 'readonly');
      const store = transaction.objectStore('projects');
      const projects: Project[] = [];
  
      store.openCursor().onsuccess = (evt: Event) => {
        const cursor = (evt.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          projects.push(cursor.value as Project);
          cursor.continue();
        } else {
          resolve(projects);
        }
      };
  
      store.openCursor().onerror = (evt: Event) => reject((evt.target as IDBRequest).error);
    });
  }
}