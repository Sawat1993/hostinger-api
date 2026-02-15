import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors();

  const logger = new Logger('Bootstrap');

  // Read port from ConfigService (uses .env via ConfigModule)
  const configService = app.get(ConfigService);
  const rawPort = configService.get<string | number>('PORT');

  const port = Number(rawPort ?? 3000) || 3000;

  // Apply JWT guard globally (it will skip routes marked with @Public)
  const jwtGuard = app.get(JwtAuthGuard);
  app.useGlobalGuards(jwtGuard);

  await app.listen(port);
  logger.log(`Application is listening on port ${port}`);
}

bootstrap();
