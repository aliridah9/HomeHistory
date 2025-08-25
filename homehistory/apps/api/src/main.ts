import { NestFactory } from '@nestjs/core';
import { RequestMethod } from '@nestjs/common';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { getConfig, logConfig } from './config';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

async function bootstrap() {
  const config = getConfig();
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // Global prefix, excluding OAuth endpoints to match external callback URLs without /api
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'auth/google', method: RequestMethod.GET },
      { path: 'auth/google/callback', method: RequestMethod.GET },
      { path: 'auth/facebook', method: RequestMethod.GET },
      { path: 'auth/facebook/callback', method: RequestMethod.GET },
    ],
  });

  // Cookie parser middleware
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin: config.server.corsOrigin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      exceptionFactory: (errors) => {
        const messages = errors.map(error => 
          Object.values(error.constraints || {}).join(', ')
        );
        return new Error(`Validation failed: ${messages.join('; ')}`);
      },
    }),
  );

  // Swagger documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle('HomeHistory API')
    .setDescription(`
      HomeHistory - Comprehensive Property Management Platform
      
      ## Features
      - 🏠 Property Management with full CRUD operations
      - 🔧 Maintenance tracking and scheduling
      - 📄 Document management with OCR and processing
      - 📊 AI-powered property reports and insights
      - 🔍 Advanced search with natural language processing
      - 📈 Property scoring and market analysis
      - 🔔 Real-time notifications and alerts
      - 👥 User management with role-based access control
      - 🔄 Automated data ingestion from multiple sources
      - ✅ Document validation and approval workflows
      
      ## Authentication
      All endpoints except registration and login require Bearer token authentication.
      
      ## Rate Limiting
      API requests are limited to 100 requests per 15-minute window per user.
      
      ## Error Handling
      All errors follow consistent format with proper HTTP status codes.
    `)
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('auth', 'Authentication and authorization')
    .addTag('users', 'User management and profiles')
    .addTag('properties', 'Property CRUD operations')
    .addTag('maintenance', 'Property maintenance tracking')
    .addTag('documents', 'Document upload and management')
    .addTag('notifications', 'Notification system')
    .addTag('ingestion', 'Data ingestion from external sources')
    .addTag('parsing', 'Document parsing and text extraction')
    .addTag('validation', 'Document validation and approval')
               .addTag('reports', 'AI-powered report generation')
           .addTag('search', 'Traditional and AI-powered search')
           .addTag('ai', 'AI services and natural language processing')
           .addTag('scoring', 'HomeHistory Score™ - The "Carfax for Homes"')
           .addTag('recommendations', 'Similar Properties - AI-powered recommendations')
           .addTag('admin-ai', 'AI Administration - Performance monitoring and management')
           .addTag('health', 'System health checks and monitoring')
    .addServer('http://localhost:3001', 'Development server')
    .addServer('https://api.homehistory.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    customSiteTitle: 'HomeHistory API Documentation',
    customCss: `
      .topbar-wrapper img { content: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAiIGhlaWdodD0iMzAiIHZpZXdCb3g9IjAgMCAzMCAzMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTE1IDNMMjUgMTBWMjVIMjBWMTVIMTBWMjVINVYxMEwxNSAzWiIgZmlsbD0iIzMzNzNkYyIvPgo8L3N2Zz4K'); width: 30px; height: 30px; }
      .swagger-ui .topbar { background-color: #1f2937; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  // Health check endpoint
  app.getHttpAdapter().get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: config.server.nodeEnv,
    });
  });

  // Log configuration in development
  if (config.server.nodeEnv === 'development') {
    logConfig();
  }

  await app.listen(config.server.port);
  
  console.log(`🚀 HomeHistory API is running on: http://localhost:${config.server.port}/api`);
  console.log(`📚 API Documentation: http://localhost:${config.server.port}/api/docs`);
  console.log(`❤️  Health Check: http://localhost:${config.server.port}/health`);
  console.log(`🌍 Environment: ${config.server.nodeEnv}`);
}

bootstrap().catch((error) => {
  console.error('❌ Failed to start application:', error);
  process.exit(1);
});
