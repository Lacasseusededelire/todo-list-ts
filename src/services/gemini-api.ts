import { GoogleGenerativeAI } from '@google/generative-ai';
import { Task } from '../models/models'; 

/**
 *
 *
 * @interface IGeminiConfig
 */
interface IGeminiConfig {
  modelName: string;
  apiKey: string;
}

/**
 *
 *
 * @export
 * @class GeminiAPI
 */
export default class GeminiAPI {
  private readonly apiKey: string;
  private readonly generativeAI: GoogleGenerativeAI; 
  private readonly model;

  
  /**
   * Creates an instance of GeminiAPI.
   * @param {IGeminiConfig} [config={ modelName: 'gemini-1.5-flash', apiKey: import.meta.env.VITE_GEMINI_API_KEY as string }]
   * @memberof GeminiAPI
   */
  constructor(config: IGeminiConfig = { modelName: 'gemini-1.5-flash', apiKey: import.meta.env.VITE_GEMINI_API_KEY as string }) {
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
  private async generateContent(prompt: string): Promise<string> {
    try {
      const result = await this.model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      throw new Error(`Erreur lors de l'appel à l'API Gemini : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  /**
   *
   *
   * @param {Task[]} tasks
   * @return {*}  {Promise<string>}
   * @memberof GeminiAPI
   */
  async generatePlanning(tasks: Task[]): Promise<string> {
    const prompt = `Génère un planning basé sur ces tâches en évaluant la priorité des tâches et en les classant par priorité : ${JSON.stringify(tasks.map(task => ({
      id: task.id,
      description: task.description,
      startDate: task.startDate?.toISOString(),
      plannedEndDate: task.plannedEndDate.toISOString(),
      actualEndDate: task.actualEndDate?.toISOString(),
      status: task.status,
      projectId: task.projectId
    })))}`;
    return this.generateContent(prompt);
  }


  /**
   *
   *
   * @param {string} description
   * @return {*}  {Promise<string>}
   * @memberof GeminiAPI
   */
  async getResourcesForTask(description: string): Promise<string> {
    const prompt = `Quelles ressources sont nécessaires pour réaliser la tâche suivante : "${description}" ?`;
    return this.generateContent(prompt);
  }
}