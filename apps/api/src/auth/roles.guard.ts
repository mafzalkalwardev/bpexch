import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasPermission } from '@bpexch/shared';
import { ROLES_KEY } from './roles.decorator';
import { PERMISSION_KEY } from './permission.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    const permission = this.reflector.getAllAndOverride<string>(PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles && !permission) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    if (permission && !hasPermission(user.role as UserRole, permission as keyof typeof import('@bpexch/shared').PERMISSIONS)) {
      throw new ForbiddenException('Insufficient permissions');
    }

    if (requiredRoles && !requiredRoles.includes(user.role as UserRole)) {
      throw new ForbiddenException('Insufficient role');
    }

    return true;
  }
}
