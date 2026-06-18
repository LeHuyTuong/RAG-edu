import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { getAppConfig } from './config/app.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const { appPort, corsOrigins } = getAppConfig();

  // Enable API Versioning (URI versioning: /api/v1, /api/v2, etc.)
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // Cookie Parser Middleware
  app.use(cookieParser());

  // Global Filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global Interceptors
  app.useGlobalInterceptors(new ResponseInterceptor());

  // Global Pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // CORS enables
  // corsOrigins is either:
  // - true (development: allow all origins)
  // - string[] (production: specific allowed origins)
  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await app.listen(appPort ?? 8080);
}
void bootstrap();
