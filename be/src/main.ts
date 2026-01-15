import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { VersioningType } from '@nestjs/common';
import type { Request, Response } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for all origins
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: false,
    allowedHeaders: '*',
  });

  // Enable global validation pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Swagger configuration - only in development
  const config = new DocumentBuilder()
    .setTitle('CallPilot API')
    .setDescription('API documentation for CallPilot backend')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name here is important for matching up with @ApiBearerAuth() decorators
    )
    .addTag('auth', 'Authentication endpoints')
    .addTag('contacts', 'Contact management endpoints')
    .addTag('calls', 'Call management endpoints')
    .addTag('webhooks', 'Webhook endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  if (process.env.NODE_ENV !== 'production') {
    SwaggerModule.setup('api', app, document);
  } else {
    // In production, serve OpenAPI JSON at /api-json
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('/api-json', (req: Request, res: Response) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(document);
    });
  }

  await app.listen(process.env.PORT ?? 3000);
  console.log(`Application is running on: http://localhost:${process.env.PORT ?? 3000}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`Swagger documentation available at: http://localhost:${process.env.PORT ?? 3000}/api`);
  }
}
bootstrap();
