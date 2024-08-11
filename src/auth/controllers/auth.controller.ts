import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from './../guards/local-auth.guard';
import { AuthService } from './../services/auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Roles as RolesEnum } from '../enum/roles.enum';
import { UsersService } from '../../users/services/users.service';
import { RolesGuard } from '../guards/roles-auth.guard';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { Roles } from '../decorators/roles.decorator';

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
  ) {}

  @Post('register')
  @HttpCode(201)
  @ApiResponse({
    status: 201,
    description: 'Register a new user',
    schema: {
      example: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5IiwiZW1haWwiOiJlbWFpbEBkZW1vLmNvbSIsImlhdCI6MTY1MjA0NzQzNSwiZXhwIjoxNjUyMTMzODM1fQ.ikFigJQn1ttuPAV06Yjr4PL6lKvm_HMygcTU8N1P__0',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User already registered',
    schema: {
      example: {
        statusCode: 409,
        message: 'USER_ALREADY_REGISTERED',
      },
    },
  })
  async register(@Body() createUserDto: CreateUserDto): Promise<any> {
    const user = await this.authService.userExists(createUserDto.email);
    if (user) {
      throw new HttpException('USER_ALREADY_REGISTERED', HttpStatus.CONFLICT);
    }
    return await this.authService.createUser(createUserDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @ApiBody({
    schema: {
      example: {
        email: 'email@demo.com',
        password: 'password',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Get a new access token with the credentials',
    schema: {
      example: {
        access_token:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI5IiwiZW1haWwiOiJlbWFpbEBkZW1vLmNvbSIsImlhdCI6MTY1MjA0NzQzNSwiZXhwIjoxNjUyMTMzODM1fQ.ikFigJQn1ttuPAV06Yjr4PL6lKvm_HMygcTU8N1P__0',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
    schema: {
      example: {
        statusCode: 401,
        message: 'Unauthorized',
      },
    },
  })
  async login(@Req() req) {
    return this.authService.login(req.user);
  }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('roles/:userId')
  async assignRoleToUser(
    @Param('userId') userId: number,
    @Body('role') role: RolesEnum,
  ) {
    return this.userService.addRoleToUser(userId, role);
  }

  @Roles(RolesEnum.ADMIN)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete('roles/:userId/remove/:role')
  async removeRoleToUser(
    @Param('userId') userId: number,
    @Param('role') role: RolesEnum,
  ) {
    return this.userService.removeRoleFromUser(userId, role);
  }
}
