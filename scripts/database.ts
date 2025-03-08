import {Task, Statu_tache, project} from './models'

export default class Database {
    private dbName: string =  'TodoApp';
    private version : number = 1; 
    private db: IDBDatabase | null = null;

    async init(): Promise<void> {
        return  new Promise((resolve, reject) =>{
            const request = indexedDB.open(this.dbName, this.version);

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                db.createObjectStore('taskts', {keyPath: 'id'});
                db.createObjectStore('projects', {keyPath: 'id'});
            };
            request.onsuccess = (event) =>{
                this.db = (event.target as IDBOpenDBRequest).result;
                resolve();
            }; 

            request.onerror = () => reject(request.error);
        });
    }

    async addTask(task: Task): Promise<number> {
        return new Promise((resolve, reject) => {
          if (!this.db) throw new Error('Database not initialized');
          
          const transaction = this.db.transaction(['tasks'], 'readwrite');
          const store = transaction.objectStore('tasks');
          const request = store.put(task);
    
          request.onsuccess = () => resolve(request.result as number);
          request.onerror = () => reject(request.error);
        });
      }

    async deleteTask(id: number): Promise<boolean> {
        return new Promise((resolve, reject) =>{
            if (!this.db) throw new Error('La base de donné n est pas initialisé');

            const transaction = this.db.transaction(['tasks'], 'readwrite');

            const store = transaction.objectStore('tasks');

            const request = store.delete(id);

            request.onsuccess = () => resolve(true);
            request.onerror = () => reject(request.error);
        });
    }
    async updateTask(task: Task): Promise<number> {
        return new Promise((resolve, reject) => {
          if (!this.db) throw new Error('Database not initialized');
          
          const transaction = this.db.transaction(['tasks'], 'readwrite');
          const store = transaction.objectStore('tasks');
          const request = store.put(task); // put remplace l'entrée existante avec le même id
    
          request.onsuccess = () => resolve(request.result as number);
          request.onerror = () => reject(request.error);
        });
      }
    
    
      async getTaskById(id: number): Promise<Task | undefined> {
        return new Promise((resolve, reject) => {
          if (!this.db) throw new Error('Database not initialized');
          
          const transaction = this.db.transaction(['tasks'], 'readonly');
          const store = transaction.objectStore('tasks');
          const request = store.get(id);
    
          request.onsuccess = () => resolve(request.result as Task);
          request.onerror = () => reject(request.error);
        });
      }

    async getTasksByStatusAndProject(status?: Statu_tache, projectId?: string): Promise<Task[]> {
        return new Promise((resolve, reject) =>{
            if (!this.db) throw new Error('La base de donné n est pas initialisé');

            const transaction = this.db.transaction(['tasks'], 'readonly'); 

            const store = transaction.objectStore('tasks');

            const tasks: Task[] = []; 

            store.openCursor().onsuccess = (event) => {
                const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
                if (cursor) {
                  const task = cursor.value as Task;
                  if ((!status || task.status === status) && 
                      (!projectId || task.projectId === projectId)) {
                    tasks.push(task);
                  }
                  cursor.continue();
                } else {
                  resolve(tasks);
                }
            };
        });
    }
}