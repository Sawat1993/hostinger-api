import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { AIModule } from './ai/ai.module';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const uri = configService.get<string>('MONGO_URI');
        if (!uri) {
          throw new Error(
            'MONGO_URI environment variable is required to connect to MongoDB',
          );
        }
        if (
          !uri.startsWith('mongodb://') &&
          !uri.startsWith('mongodb+srv://')
        ) {
          throw new Error(
            'MONGO_URI must start with "mongodb://" or "mongodb+srv://"',
          );
        }
        return { uri } as any;
      },
    }),
    UsersModule,
    AIModule,
  ],
  controllers: [AppController],
  providers: [AppService, JwtAuthGuard],
})
export class AppModule {}
