import { ITask, IProject, Task, Project } from '../models/models';

/**
 *
 *
 * @class Database
 */
class Database {
  private dbName = "TodoDB";
  private dbVersion = 2;
  private db: IDBDatabase | null = null;

  /**
   *
   *
   * @return {*}  {Promise<void>}
   * @memberof Database
   */
  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
        db.createObjectStore("projects", { keyPath: "id" });
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        resolve();
      };

      request.onerror = () => reject("Erreur lors de l'ouverture de la base de données");
    });
  }

  /**
   *
   *
   * @private
   * @param {("tasks" | "projects")} storeName
   * @param {IDBTransactionMode} mode
   * @return {*} 
   * @memberof Database
   */
  private getStore(storeName: "tasks" | "projects", mode: IDBTransactionMode) {
    if (!this.db) throw new Error("Base de données non initialisée");
    const transaction = this.db.transaction([storeName], mode);
    return transaction.objectStore(storeName);
  }

  /**
   *
   *
   * @template T
   * @param {("tasks" | "projects")} storeName
   * @param {T} data
   * @return {*}  {(Promise<number | string>)}
   * @memberof Database
   */
  async add<T>(storeName: "tasks" | "projects", data: T): Promise<number | string> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.add(data);
      request.onsuccess = () => resolve(request.result as number | string);
      request.onerror = () => reject("Erreur lors de l'ajout");
    });
  }

  /**
   *
   *
   * @template T
   * @param {("tasks" | "projects")} storeName
   * @return {*}  {Promise<T[]>}
   * @memberof Database
   */
  async getAll<T>(storeName: "tasks" | "projects"): Promise<T[]> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readonly");
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject("Erreur lors de la récupération");
    });
  }

  /**
   *
   *
   * @template T
   * @param {("tasks" | "projects")} storeName
   * @param {(number | string)} id
   * @return {*}  {Promise<T>}
   * @memberof Database
   */
  async getById<T>(storeName: "tasks" | "projects", id: number | string): Promise<T> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readonly");
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject("Erreur lors de la récupération par ID");
    });
  }

  /**
   *
   *
   * @template T
   * @param {("tasks" | "projects")} storeName
   * @param {T} data
   * @return {*}  {Promise<void>}
   * @memberof Database
   */
  async update<T>(storeName: "tasks" | "projects", data: T): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject("Erreur lors de la mise à jour");
    });
  }

  /**
   *
   *
   * @param {("tasks" | "projects")} storeName
   * @param {(number | string)} id
   * @return {*}  {Promise<void>}
   * @memberof Database
   */
  async delete(storeName: "tasks" | "projects", id: number | string): Promise<void> {
    return new Promise((resolve, reject) => {
      const store = this.getStore(storeName, "readwrite");
      const request = store.delete(id); // Suppression directe par ID
      request.onsuccess = () => resolve();
      request.onerror = () => reject("Erreur lors de la suppression");
    });
  }
}

export default Database;