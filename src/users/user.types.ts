export type UserRole = 'patient' | 'doctor';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}
