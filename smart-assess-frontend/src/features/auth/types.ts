export interface AuthResponse {
  token: string;
  type: string;
  id: number;
  user: User;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  bio?: string;
  linkedin?: string;
  github?: string;
}