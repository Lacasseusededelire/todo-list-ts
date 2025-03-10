/**
 *
 *
 * @enum {number}
 */
enum Status {
  New = "New",
  InProgress = "InProgress",
  Completed = "Completed",
  Cancelled = "Cancelled"
}


/**
 *
 *
 * @interface ITask
 */
interface ITask {
  id: number;
  description: string;
  startDate: Date | null;
  plannedEndDate: Date;
  actualEndDate: Date | null;
  actualDuration: number | null;
  status: Status;
  projectId: string;
}


/**
 *
 *
 * @interface IProject
 */
interface IProject {
  id: string;
  name: string;
}

/**
 *
 *
 * @abstract
 * @class Entity
 * @template T
 */
abstract class Entity<T> {
  constructor(protected _id: T) {}
  get id(): T { return this._id; }
}


/**
 *
 *
 * @class Task
 * @extends {Entity<number>}
 * @implements {ITask}
 */
class Task extends Entity<number> implements ITask {
  constructor(
    id: number,
    public description: string,
    public startDate: Date | null,
    public plannedEndDate: Date,
    public actualEndDate: Date | null,
    public actualDuration: number | null,
    public status: Status,
    public projectId: string
  ) {
    super(id);
  }
  /**
   *
   *
   * @return {*}  {(number | null)}
   * @memberof Task
   */
  calculateDuration(): number | null {
    if (this.startDate && this.actualEndDate) {
      return (this.actualEndDate.getTime() - this.startDate.getTime()) / 1000; // en secondes
    }
    return null;
  }
}


/**
 *
 *
 * @class Project
 * @extends {Entity<string>}
 * @implements {IProject}
 */
class Project extends Entity<string> implements IProject {
  constructor(id: string, public name: string) {
    super(id);
  }
}

export { Status, ITask, IProject, Task, Project };