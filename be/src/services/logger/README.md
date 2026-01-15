# Logging System Documentation

## Overview
The CallPilot backend implements a comprehensive logging system that captures both request logs and application logs with different storage and output behaviors.

## Directory Structure
```
src/
├── services/
│   └── logger/          # Logger service module
│       ├── log.entity.ts
│       ├── logger.service.ts
│       ├── logs.module.ts
│       ├── index.ts
│       └── README.md
└── interceptors/        # Request interceptors
    └── request-logging.interceptor.ts
```

## Features

### Request Logging
- **Automatic**: All HTTP requests are automatically logged via interceptor
- **Console Output**: Request details are printed to console with Winston
- **Database Storage**: All request logs are saved to the `logs` table
- **Details Captured**:
  - HTTP method, URL, status code
  - Response time
  - IP address, User-Agent
  - User ID (when authenticated)
  - Session ID

### Application Logging
- **Levels**: `info`, `warn`, `error`, `debug`, `verbose`
- **Storage Only**: Application logs are saved to database only (no console output)
- **Context Support**: Rich context objects can be attached to logs
- **Error Handling**: Database failures are logged to console

## Usage

### Injecting Logger Service
```typescript
import { LoggerService } from '../services/logger';

@Injectable()
export class MyService {
  constructor(private readonly logger: LoggerService) {}

  async myMethod() {
    // Log application events (saved to DB only)
    await this.logger.info('User created', {
      userId: '123',
      email: 'user@example.com',
    });

    await this.logger.error('Database connection failed', {
      error: 'Connection timeout',
      stack: error.stack,
    });
  }
}
```

### Log Context Interface
```typescript
interface LogContext {
  userId?: string;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  responseTime?: number;
  stack?: string;
  [key: string]: any;
}
```

## Database Schema

### Logs Table
- `id`: UUID primary key
- `level`: Enum (info, warn, error, debug, verbose)
- `type`: Enum (request, application)
- `message`: Text message
- `context`: JSONB for additional data
- `userId`: Optional user identifier
- `sessionId`: Optional session identifier
- `ipAddress`: Request IP address
- `userAgent`: Request user agent
- `method`: HTTP method
- `url`: Request URL
- `statusCode`: HTTP status code
- `responseTime`: Response time in milliseconds
- `stack`: Error stack trace
- `createdAt`: Timestamp

## Configuration

### Environment Variables
```env
LOG_LEVEL=info  # Winston log level (error, warn, info, debug, verbose)
```

### TypeORM Configuration
The logging system uses the same database connection configured for the application. Logs are stored in the `logs` table with automatic synchronization in development mode.

## API Versioning

The application uses URI-based versioning:
- Default version: `v1`
- Example: `GET /v1/users`

## Swagger Documentation

API documentation is available at `/api` endpoint with versioning support.