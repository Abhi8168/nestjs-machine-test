import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  const options = new DocumentBuilder()
    .setTitle('Nest Machine Test API')
    .setDescription('API documentation for Nest Machine Test')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter Jwt Token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document);

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
  });
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🈸 Application is running on: http://localhost:${port}`);
  console.log(`🚀 Swagger is running on: http://localhost:${port}/api`);
}

bootstrap();
