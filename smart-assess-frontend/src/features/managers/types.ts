export interface Manager {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'MANAGER';
  phone?: string;
  department?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  createdAt: string;
  updatedAt: string;
}