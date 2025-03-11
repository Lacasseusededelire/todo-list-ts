import { Task, Status } from '../models/models';
describe('Task', () => {
    describe('calculateDuration', () => {
        it('should calculate duration in seconds between startDate and actualEndDate', () => {
            // Arrange
            const startDate = new Date('2025-03-11T10:00:00');
            const actualEndDate = new Date('2025-03-11T10:00:10');
            const task = new Task(1, 'Test', startDate, new Date(), actualEndDate, null, Status.Completed, 'proj1');
            // Act
            const duration = task.calculateDuration();
            // Assert
            expect(duration).toBe(10); // 10 secondes
        });
        it('should return null if startDate or actualEndDate is missing', () => {
            // Arrange
            const taskNoStart = new Task(1, 'Test', null, new Date(), new Date(), null, Status.Completed, 'proj1');
            const taskNoEnd = new Task(2, 'Test', new Date(), new Date(), null, null, Status.InProgress, 'proj1');
            // Act & Assert
            expect(taskNoStart.calculateDuration()).toBeNull();
            expect(taskNoEnd.calculateDuration()).toBeNull();
        });
    });
});
