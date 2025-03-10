var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { GoogleGenerativeAI } from '@google/generative-ai';
/**
 *
 *
 * @export
 * @class GeminiAPI
 */
export default class GeminiAPI {
    /**
     * Creates an instance of GeminiAPI.
     * @param {IGeminiConfig} [config={ modelName: 'gemini-1.5-flash', apiKey: import.meta.env.VITE_GEMINI_API_KEY as string }]
     * @memberof GeminiAPI
     */
    constructor(config = { modelName: 'gemini-1.5-flash', apiKey: import.meta.env.VITE_GEMINI_API_KEY }) {
        if (!config.apiKey) {
            throw new Error('VITE_GEMINI_API_KEY n’est pas défini dans .env.local');
        }
        this.apiKey = config.apiKey;
        this.generativeAI = new GoogleGenerativeAI(this.apiKey);
        this.model = this.generativeAI.getGenerativeModel({ model: config.modelName });
    }
    /**
     *
     *
     * @private
     * @param {string} prompt
     * @return {*}  {Promise<string>}
     * @memberof GeminiAPI
     */
    generateContent(prompt) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const result = yield this.model.generateContent(prompt);
                return result.response.text();
            }
            catch (error) {
                throw new Error(`Erreur lors de l'appel à l'API Gemini : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
            }
        });
    }
    /**
     *
     *
     * @param {Task[]} tasks
     * @return {*}  {Promise<string>}
     * @memberof GeminiAPI
     */
    generatePlanning(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = `Génère un planning basé sur ces tâches : ${JSON.stringify(tasks.map(task => {
                var _a, _b;
                return ({
                    id: task.id,
                    description: task.description,
                    startDate: (_a = task.startDate) === null || _a === void 0 ? void 0 : _a.toISOString(),
                    plannedEndDate: task.plannedEndDate.toISOString(),
                    actualEndDate: (_b = task.actualEndDate) === null || _b === void 0 ? void 0 : _b.toISOString(),
                    status: task.status,
                    projectId: task.projectId
                });
            }))}`;
            return this.generateContent(prompt);
        });
    }
    /**
     *
     *
     * @param {string} description
     * @return {*}  {Promise<string>}
     * @memberof GeminiAPI
     */
    getResourcesForTask(description) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = `Quelles ressources sont nécessaires pour réaliser la tâche suivante : "${description}" ?`;
            return this.generateContent(prompt);
        });
    }
}
