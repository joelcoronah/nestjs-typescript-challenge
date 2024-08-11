import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Roles } from '../enum/roles.enum';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    console.log({ context });
    const requiredRoles = this.reflector.get<Roles[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const validRole = requiredRoles.some((role) => user.roles.includes(role));

    if (!validRole) {
      throw new UnauthorizedException(`User not allowed to access this route`);
    }
    return validRole;
  }
}
