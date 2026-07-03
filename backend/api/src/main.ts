import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable CORS for mobile app development
  app.enableCors({
    origin: true, // Allow all origins in development
    credentials: true,
  });

  // Global validation pipe — validates DTOs automatically
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true, // Auto-transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global exception filter — consistent error responses
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global response interceptor — wraps all responses in { success, data } envelope
  app.useGlobalInterceptors(new TransformInterceptor());

  const port = process.env.API_PORT || 3000;
  await app.listen(port);
  console.log(`\n🚀 Community API running on http://localhost:${port}/api`);
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
}

bootstrap();
