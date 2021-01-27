import { JwtModule } from './../jwt/jwt.module';
import { UsersModule } from './../users/users.module';
import { AuthGuard } from './auth.guard';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [UsersModule, JwtModule],
  providers: [{ provide: APP_GUARD, useClass: AuthGuard }],
})
export class AuthModule {}
