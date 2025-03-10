/**
 *
 *
 * @enum {number}
 */
var Status;
(function (Status) {
    Status["New"] = "New";
    Status["InProgress"] = "InProgress";
    Status["Completed"] = "Completed";
    Status["Cancelled"] = "Cancelled";
})(Status || (Status = {}));
/**
 *
 *
 * @abstract
 * @class Entity
 * @template T
 */
class Entity {
    constructor(_id) {
        this._id = _id;
    }
    get id() { return this._id; }
}
/**
 *
 *
 * @class Task
 * @extends {Entity<number>}
 * @implements {ITask}
 */
class Task extends Entity {
    constructor(id, description, startDate, plannedEndDate, actualEndDate, actualDuration, status, projectId) {
        super(id);
        this.description = description;
        this.startDate = startDate;
        this.plannedEndDate = plannedEndDate;
        this.actualEndDate = actualEndDate;
        this.actualDuration = actualDuration;
        this.status = status;
        this.projectId = projectId;
    }
    /**
     *
     *
     * @return {*}  {(number | null)}
     * @memberof Task
     */
    calculateDuration() {
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
class Project extends Entity {
    constructor(id, name) {
        super(id);
        this.name = name;
    }
}
export { Status, Task, Project };
