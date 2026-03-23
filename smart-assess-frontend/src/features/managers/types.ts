export interface Manager {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'MANAGER' | 'HR';
  phone?: string;
  department?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  createdAt: string;
  updatedAt: string;
}
