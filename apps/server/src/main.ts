// Updated apps/server/src/main.ts with security hardening

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ─── Security: HTTP headers ────────────────────
  // Helmet sets various HTTP headers to protect against common attacks
  // like clickjacking, XSS, MIME sniffing, etc.
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(helmet());

  // ─── Cookie Parser ─────────────────────────────
  app.use(cookieParser());

  // ─── CORS ──────────────────────────────────────
  // In production, replace with your actual frontend domain
  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // ─── Global Validation Pipe ────────────────────
  // Automatically validates and transforms incoming DTOs
  // whitelist: strips properties not in the DTO
  // forbidNonWhitelisted: throws error on unknown properties
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 Server running on port ${port}`);
}
bootstrap();
