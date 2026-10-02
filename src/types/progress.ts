export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "DONE" | "REVISED";

export interface Progress {
  _id: string;
  taskId: string;
  personId: string;
  status: ProgressStatus;
  remark?: string;
  completedAt?: string;
  updatedAt: string;
}
