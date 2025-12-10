import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
    imports: [ConfigModule, CredentialsModule],
    controllers: [AuthController],
    providers: [AuthService],
})
export class AuthModule { }
