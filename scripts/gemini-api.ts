import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task } from './models';

// Récupère la clé API depuis les variables d’environnement de Vite
const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string;
if (!apiKey) {
  throw new Error('VITE_GEMINI_API_KEY n’est pas défini dans .env.local');
}

const genAI = new GoogleGenerativeAI(apiKey);

export default class GeminiAPI {
  private model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  async generatePlanning(tasks: Task[]): Promise<string> {
    const prompt = `Génère un planning basé sur ces tâches : ${JSON.stringify(tasks)}`;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }

  async getResourcesForTask(description: string): Promise<string> {
    const prompt = `Quelles ressources sont nécessaires pour : ${description}`;
    const result = await this.model.generateContent(prompt);
    return result.response.text();
  }
}