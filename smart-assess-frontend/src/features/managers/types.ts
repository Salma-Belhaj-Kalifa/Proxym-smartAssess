export interface Manager {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'MANAGER';
  department?: string;
  createdAt: string;
}