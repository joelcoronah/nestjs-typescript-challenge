import { SetMetadata } from '@nestjs/common';
import { Roles as RolesEnum } from '../enum/roles.enum';

export const Roles = (...roles: RolesEnum[]) => SetMetadata('roles', roles);
