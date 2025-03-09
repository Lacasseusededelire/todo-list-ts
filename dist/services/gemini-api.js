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
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY n’est pas défini dans .env.local');
}
const genAI = new GoogleGenerativeAI(apiKey);
export default class GeminiAPI {
    constructor() {
        this.model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }
    generatePlanning(tasks) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = `Génère un planning basé sur ces tâches : ${JSON.stringify(tasks)}`;
            const result = yield this.model.generateContent(prompt);
            return result.response.text();
        });
    }
    getResourcesForTask(description) {
        return __awaiter(this, void 0, void 0, function* () {
            const prompt = `Quelles ressources sont nécessaires pour : ${description}`;
            const result = yield this.model.generateContent(prompt);
            return result.response.text();
        });
    }
}
