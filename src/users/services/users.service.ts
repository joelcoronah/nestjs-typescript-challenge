import { HttpException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../../auth/controllers/dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Roles } from '../../auth/enum/roles.enum';

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repository: Repository<User>) {}

  async findOneByEmail(email: string): Promise<User | undefined> {
    return this.repository.findOne({
      where: {
        email,
      },
    });
  }

  async findOneById(id: number): Promise<User | undefined> {
    return this.repository.findOne({
      where: {
        id,
      },
    });
  }

  async addRoleToUser(userId: number, role: Roles): Promise<User> {
    try {
      const user = await this.repository.findOneBy({ id: userId });

      if (!user) {
        throw new Error('User not found');
      }

      const roles = user._roles?.split(',') ?? [];

      if (!roles.includes(role)) {
        roles.push(role);
        user._roles = roles.join(',');
        await this.repository.save(user);
      }

      return user;
    } catch (error) {
      console.log({ error });
      const message = error.message?.includes('User not found')
        ? 'USER_NOT_FOUND'
        : 'INTERNAL_SERVER_ERROR';

      const code = error.message?.includes('User not found') ? 404 : 500;
      throw new HttpException(message, code);
    }
  }

  async removeRoleFromUser(userId: number, role: Roles): Promise<User> {
    const user = await this.repository.findOneBy({ id: userId });

    if (!user) {
      throw new Error('User not found');
    }

    const roles = user._roles?.split(',') ?? [];

    const index = roles.indexOf(role); // have the role
    if (index !== -1) {
      roles.splice(index, 1);
      user._roles = roles.join(',');
      await this.repository.save(user);
    }

    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    createUserDto.password = await this.encryptPassword(createUserDto.password);
    const user: User = await this.repository.create(createUserDto);
    return await this.repository.save(user);
  }

  async encryptPassword(password: string) {
    return await bcrypt.hash(password, 10);
  }

  async comparePassword(password: string, hash: string) {
    return await bcrypt.compare(password, hash);
  }
}
