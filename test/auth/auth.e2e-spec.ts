import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';
import { UsersModule } from '../../src/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '../../src/auth/auth.module';
import { JwtService } from '@nestjs/jwt';
import { User } from '../../src/users/models/user.entity';
import { Roles as RolesEnum } from '../../src/auth/enum/roles.enum';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let jwtService: JwtService;

  const userId = 1;
  const role = RolesEnum.ADMIN;

  const mockUser = new User();
  mockUser.id = userId;
  mockUser.firstName = 'John';
  mockUser.lastName = 'Doe';
  mockUser.email = 'email2@demo.com';
  mockUser.password =
    '$2a$10$j77ljbkDKFxtLCswbnHEcu8HdFz80klrvx6xbcb6ETS4pNiFA7f1W';
  mockUser.deletedAt = null;
  mockUser.roles = [role];
  mockUser._roles = role;

  const mockUserRepository = {
    findOne: jest.fn().mockImplementation(({ where: { email } }) => {
      if (email === mockUser.email) {
        return Promise.resolve(mockUser);
      }
      return Promise.resolve(undefined);
    }),
    save: jest.fn().mockImplementation((user) => Promise.resolve(user)),
    findOneBy: jest
      .fn()
      .mockImplementation((id) => Promise.resolve({ ...mockUser, id })),
    create: jest.fn().mockImplementation((user) => Promise.resolve(user)),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        AuthModule,
        UsersModule,
      ],
    })
      .overrideProvider(getRepositoryToken(User))
      .useValue(mockUserRepository)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        stopAtFirstError: true,
      }),
    );
    await app.init();

    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/auth/register (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'email36@demo.com',
        password: 'password',
        firstName: 'Joel',
        lastName: 'Corona',
      })
      .expect(201);

    expect(response.body).toEqual({
      access_token: expect.any(String),
    });
  });

  it('/api/auth/login (POST)', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'email2@demo.com',
        password: 'password',
      })
      .expect(200);

    expect(response.body).toEqual({
      access_token: expect.any(String),
    });
  });

  it('/api/auth/roles/:userId (POST)', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'email2@demo.com',
        password: 'password',
      })
      .expect(200);

    const token = loginResponse.body.access_token;

    const addRoleResponse = await request(app.getHttpServer())
      .post(`/api/auth/roles/${mockUser.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({
        role: RolesEnum.AGENT,
      })
      .expect(201);

    const response = {
      ...mockUser,
      id: addRoleResponse.body.id,
      _roles: addRoleResponse.body._roles,
    };

    expect(addRoleResponse.body).toEqual(response);
  });
});
