var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
/**
 *
 *
 * @class Database
 */
class Database {
    constructor() {
        this.dbName = "TodoDB";
        this.dbVersion = 2;
        this.db = null;
    }
    /**
     *
     *
     * @return {*}  {Promise<void>}
     * @memberof Database
     */
    initialize() {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const request = indexedDB.open(this.dbName, this.dbVersion);
                request.onupgradeneeded = (event) => {
                    const db = event.target.result;
                    db.createObjectStore("tasks", { keyPath: "id", autoIncrement: true });
                    db.createObjectStore("projects", { keyPath: "id" });
                };
                request.onsuccess = (event) => {
                    this.db = event.target.result;
                    resolve();
                };
                request.onerror = () => reject("Erreur lors de l'ouverture de la base de données");
            });
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
    getStore(storeName, mode) {
        if (!this.db)
            throw new Error("Base de données non initialisée");
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
    add(storeName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const store = this.getStore(storeName, "readwrite");
                const request = store.add(data);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject("Erreur lors de l'ajout");
            });
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
    getAll(storeName) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const store = this.getStore(storeName, "readonly");
                const request = store.getAll();
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject("Erreur lors de la récupération");
            });
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
    getById(storeName, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const store = this.getStore(storeName, "readonly");
                const request = store.get(id);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject("Erreur lors de la récupération par ID");
            });
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
    update(storeName, data) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const store = this.getStore(storeName, "readwrite");
                const request = store.put(data);
                request.onsuccess = () => resolve();
                request.onerror = () => reject("Erreur lors de la mise à jour");
            });
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
    delete(storeName, id) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const store = this.getStore(storeName, "readwrite");
                const request = store.delete(id); // Suppression directe par ID
                request.onsuccess = () => resolve();
                request.onerror = () => reject("Erreur lors de la suppression");
            });
        });
    }
}
export default Database;
