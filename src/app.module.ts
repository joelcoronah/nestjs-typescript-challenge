import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SalesModule } from './sales/sales.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { dataSourceOptions } from './config/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    SalesModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
