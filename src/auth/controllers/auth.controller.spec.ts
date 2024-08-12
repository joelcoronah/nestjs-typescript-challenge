import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from '../services/auth.service';
import { UsersService } from '../../users/services/users.service';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Roles as RolesEnum } from '../enum/roles.enum';
import { User } from '../../users/models/user.entity';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles-auth.guard';
import { Reflector } from '@nestjs/core';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;
  let usersService: UsersService;

  let jwtAuthGuard: JwtAuthGuard;
  let rolesGuard: RolesGuard;

  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            userExists: jest.fn(),
            createUser: jest.fn(),
            login: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            addRoleToUser: jest.fn(),
            removeRoleFromUser: jest.fn(),
          },
        },
        JwtAuthGuard,
        RolesGuard,
        {
          provide: Reflector,
          useClass: Reflector,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn().mockReturnValue(true) })
      .compile();

    authController = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtAuthGuard = module.get<JwtAuthGuard>(JwtAuthGuard);
    rolesGuard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const createUserDto = {
        email: 'email@demo.com',
        password: 'password',
        firstName: 'Joel',
        lastName: 'Corona',
      };

      jest
        .spyOn(authService, 'createUser')
        .mockResolvedValue({ access_token: 'valid_token' });

      const result = await authController.register(createUserDto);
      expect(result).toEqual({ access_token: 'valid_token' });
      expect(authService.userExists).toHaveBeenCalledWith('email@demo.com');
      expect(authService.createUser).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw an error if user already exists', async () => {
      const createUserDto = {
        email: 'email@demo.com',
        password: 'password',
        firstName: 'Joel',
        lastName: 'Corona',
      };

      const mockUser = new User();
      mockUser.id = 2;
      mockUser.firstName = 'John';
      mockUser.lastName = 'Doe';
      mockUser.email = 'email23@demo.com';
      mockUser.password =
        '$2a$10$j77ljbkDKFxtLCswbnHEcu8HdFz80klrvx6xbcb6ETS4pNiFA7f1W';
      mockUser.deletedAt = null;

      jest.spyOn(authService, 'userExists').mockResolvedValue(mockUser);

      await expect(authController.register(createUserDto)).rejects.toThrow(
        new HttpException('USER_ALREADY_REGISTERED', HttpStatus.CONFLICT),
      );
    });
  });

  describe('login', () => {
    it('should return a valid access token', async () => {
      const req = { user: { id: 1, email: 'email@demo.com' } };
      const token = { access_token: 'valid_token' };
      jest.spyOn(authService, 'login').mockResolvedValue(token);

      const result = await authController.login(req);
      expect(result).toEqual(token);
      expect(authService.login).toHaveBeenCalledWith(req.user);
    });
  });

  describe('assignRoleToUser', () => {
    it('should assign a role to a user', async () => {
      const role = RolesEnum.ADMIN;

      const mockUser = new User();
      mockUser.id = 2;
      mockUser.firstName = 'John';
      mockUser.lastName = 'Doe';
      mockUser.email = 'email23@demo.com';
      mockUser.password =
        '$2a$10$j77ljbkDKFxtLCswbnHEcu8HdFz80klrvx6xbcb6ETS4pNiFA7f1W';
      mockUser.deletedAt = null;

      jest.spyOn(usersService, 'addRoleToUser').mockResolvedValue(mockUser);

      const result = await authController.assignRoleToUser(mockUser.id, role);
      expect(result).toEqual(mockUser);
      expect(usersService.addRoleToUser).toHaveBeenCalledWith(
        mockUser.id,
        role,
      );
    });
  });

  describe('removeRoleToUser', () => {
    it('should remove a role from a user', async () => {
      const userId = 2;
      const role = RolesEnum.CUSTOMER;

      const mockUser = new User();
      mockUser.id = userId;
      mockUser.firstName = 'John';
      mockUser.lastName = 'Doe';
      mockUser.email = 'email23@demo.com';
      mockUser.password =
        '$2a$10$j77ljbkDKFxtLCswbnHEcu8HdFz80klrvx6xbcb6ETS4pNiFA7f1W';
      mockUser.deletedAt = null;

      jest
        .spyOn(usersService, 'removeRoleFromUser')
        .mockResolvedValue(mockUser);

      const result = await authController.removeRoleToUser(userId, role);
      expect(result).toEqual(mockUser);
      expect(usersService.removeRoleFromUser).toHaveBeenCalledWith(
        userId,
        role,
      );
    });
  });

  it('should allow access if user has the correct role', async () => {
    const userId = 1;
    const role = RolesEnum.ADMIN;

    const mockUser = new User();
    mockUser.id = userId;
    mockUser.firstName = 'John';
    mockUser.lastName = 'Doe';
    mockUser.email = 'email23@demo.com';
    mockUser.password =
      '$2a$10$j77ljbkDKFxtLCswbnHEcu8HdFz80klrvx6xbcb6ETS4pNiFA7f1W';
    mockUser.deletedAt = null;
    mockUser.roles = [role];

    const spy = jest
      .spyOn(usersService, 'addRoleToUser')
      .mockResolvedValue(undefined);

    jest
      .spyOn(reflector, 'get')
      .mockReturnValue([RolesEnum.ADMIN, RolesEnum.GUEST]);
    const response = await authController.assignRoleToUser(userId, role);
    expect(spy).toHaveBeenCalledWith(userId, role);
    expect(response).toBeUndefined();
  });
});
