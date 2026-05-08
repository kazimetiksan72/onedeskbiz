import type { Employee } from '../../employees/types/employee.types';

export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';

export interface TaskItem {
  _id: string;
  title: string;
  description?: string;
  assignedUserId: Pick<Employee, '_id' | 'firstName' | 'lastName' | 'workEmail' | 'department' | 'title'>;
  createdByUserId?: {
    _id: string;
    firstName?: string;
    lastName?: string;
    workEmail?: string;
  };
  dueDate?: string | null;
  status: TaskStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPayload {
  title?: string;
  description?: string;
  assignedUserId?: string;
  dueDate?: string | null;
  status?: TaskStatus;
  notes?: string;
}
