import { Category } from "./category";
import { Progress } from "./progress";
import { Person } from "./person";

export interface Task {
  _id: string;
  date: string;
  categoryId: string;
  content?: string;
  link?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskWithDetails extends Task {
  category: Category | null;
  progress: (Progress & { person: Person | null })[];
}
