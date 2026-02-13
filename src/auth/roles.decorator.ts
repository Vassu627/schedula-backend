import { SetMetadata } from '@nestjs/common';
import { Role } from '../users/user.entity';

export const ROLE_KEY = 'role';
export const RequireRole = (role: Role) => SetMetadata(ROLE_KEY, role);
