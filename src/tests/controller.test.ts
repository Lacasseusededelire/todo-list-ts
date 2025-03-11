import TaskController from '../controllers/controller';
import { Task, Status } from '../models/models';
import Database from '../services/database';
import GeminiAPI from '../services/gemini-api';

// Mock de Database avec toutes les méthodes utilisées dans TaskController
jest.mock('../services/database', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      add: jest.fn(),
      getAll: jest.fn(),
      getById: jest.fn(),
      update: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock de GeminiAPI avec toutes les méthodes utilisées dans TaskController
jest.mock('../services/gemini-api', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      getResourcesForTask: jest.fn().mockResolvedValue('mocked resources'),
      generatePlanning: jest.fn().mockResolvedValue('mocked planning'),
    })),
  };
});

describe('TaskController', () => {
  let controller: TaskController;

  beforeEach(() => {
    controller = new TaskController();
    // Nettoyer les mocks avant chaque test
    (Database.prototype.initialize as jest.Mock).mockClear();
    (Database.prototype.add as jest.Mock).mockClear();
    (Database.prototype.getAll as jest.Mock).mockClear();
    (Database.prototype.getById as jest.Mock).mockClear();
    (Database.prototype.update as jest.Mock).mockClear();
    (Database.prototype.delete as jest.Mock).mockClear();
    (GeminiAPI.prototype.getResourcesForTask as jest.Mock).mockClear();
    (GeminiAPI.prototype.generatePlanning as jest.Mock).mockClear();
  });

  it('should create a new task and return its ID', async () => {
    // Arrange
    const description = 'Test Task';
    const plannedEndDate = new Date('2025-03-15');
    const projectId = 'project-123';
    const mockTaskId = 1;
    (Database.prototype.add as jest.Mock).mockResolvedValue(mockTaskId);

    // Act
    const taskId = await controller.createTask(description, plannedEndDate, projectId);

    // Assert
    expect(taskId).toBe(mockTaskId);
    expect(Database.prototype.add).toHaveBeenCalledWith('tasks', expect.objectContaining({
      description,
      plannedEndDate,
      projectId,
      status: Status.New,
      id: 0,
    }));
  });

  it('should throw an error if the returned ID is not a number', async () => {
    // Arrange
    (Database.prototype.add as jest.Mock).mockResolvedValue('invalid-id');

    // Act & Assert
    await expect(controller.createTask('Test', new Date(), 'project-123')).rejects.toThrow(
      'Expected a number ID for task, but received a different type'
    );
  });

  describe('getTasksByStatusAndProject', () => {
    it('should return tasks filtered by status and projectId', async () => {
      // Arrange
      const mockTasks = [
        new Task(1, 'Task 1', null, new Date(), null, null, Status.New, 'proj1'),
        new Task(2, 'Task 2', null, new Date(), null, null, Status.InProgress, 'proj1'),
        new Task(3, 'Task 3', null, new Date(), null, null, Status.New, 'proj2'),
      ];
      (Database.prototype.getAll as jest.Mock).mockResolvedValue(mockTasks);

      // Act
      const result = await controller.getTasksByStatusAndProject(Status.New, 'proj1');

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockTasks[0]);
    });

    it('should return all tasks if no filters are provided', async () => {
      // Arrange
      const mockTasks = [
        new Task(1, 'Task 1', null, new Date(), null, null, Status.New, 'proj1'),
        new Task(2, 'Task 2', null, new Date(), null, null, Status.Completed, 'proj2'),
      ];
      (Database.prototype.getAll as jest.Mock).mockResolvedValue(mockTasks);

      // Act
      const result = await controller.getTasksByStatusAndProject(undefined, undefined);

      // Assert
      expect(result).toHaveLength(2);
      expect(result).toEqual(mockTasks);
    });
  });

  // Test supplémentaire pour initialize
  it('should initialize the database', async () => {
    // Act
    await controller.initialize();

    // Assert
    expect(Database.prototype.initialize).toHaveBeenCalled();
  });

  // Test pour startTask
  it('should start a task and return resources', async () => {
    // Arrange
    const mockTask = new Task(1, 'Test Task', null, new Date(), null, null, Status.New, 'proj1');
    (Database.prototype.getById as jest.Mock).mockResolvedValue(mockTask);
    (Database.prototype.update as jest.Mock).mockResolvedValue(undefined);
    (GeminiAPI.prototype.getResourcesForTask as jest.Mock).mockResolvedValue('mocked resources');

    // Act
    const resources = await controller.startTask(1);

    // Assert
    expect(resources).toBe('mocked resources');
    expect(Database.prototype.update).toHaveBeenCalledWith('tasks', expect.objectContaining({
      status: Status.InProgress,
      startDate: expect.any(Date),
    }));
    expect(GeminiAPI.prototype.getResourcesForTask).toHaveBeenCalledWith('Test Task');
  });

  // Test pour completeTask
  it('should complete a task and calculate duration', async () => {
    // Arrange
    const startTime = Date.now() - 10000; // 10 secondes avant
    const mockTask = new Task(1, 'Test Task', new Date(startTime), new Date(), null, null, Status.InProgress, 'proj1');
    (Database.prototype.getById as jest.Mock).mockResolvedValue(mockTask);
    (Database.prototype.update as jest.Mock).mockResolvedValue(undefined);
    jest.spyOn(controller['timers'], 'get').mockReturnValue(startTime);
    jest.spyOn(controller['timers'], 'delete');

    // Act
    await controller.completeTask(1);

    // Assert
    expect(Database.prototype.update).toHaveBeenCalledWith('tasks', expect.objectContaining({
      status: Status.Completed,
      actualEndDate: expect.any(Date),
      actualDuration: expect.any(Number), // Durée calculée en secondes
    }));
    expect(controller['timers'].delete).toHaveBeenCalledWith(1);
  });
});