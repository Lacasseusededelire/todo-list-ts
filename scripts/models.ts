export enum Statu_tache {
    New = 'new', 
    IN_PROGRESS = 'in_progress',
    COMPLETED = 'completed',
    CANCELLED = 'cancelled'
} 

export interface Task {
    id: number;
    description: string;
    starDate: Date; 
    plannedEndDate: Date;
    actualEndDate: Date | null;
    actualDuration: number | null;
    status: Statu_tache;
    projectId: string; 
}

export interface project {
    id: string;
    name: string;
}