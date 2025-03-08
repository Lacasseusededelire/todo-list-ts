import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv'
import { Task } from './models';

// Charge les variables d’environnement depuis le fichier .env
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('GEMINI_API_KEY n’est pas défini dans le fichier .env');
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