export enum Status {
    New = 'new',
    InProgress = 'in-progress',
    Completed = 'completed',
    Cancelled = 'cancelled'
  }
  
  export interface Task {
    id: number;
    description: string;
    startDate: Date;
    plannedEndDate: Date;
    actualEndDate: Date | null;
    actualDuration: number | null;
    status: Status;
    projectId: string;
  }
  
  export interface Project {
    id: string;
    name: string;
  }
  