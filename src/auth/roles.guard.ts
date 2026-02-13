import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Role } from '../users/user.entity';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private requiredRole: Role) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return user && user.role === this.requiredRole;
  }
}
