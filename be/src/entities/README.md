# Database Entities

This directory contains all TypeORM entities used in the application. Each entity represents a database table and defines the structure, relationships, and business logic for that table.

## Available Entities

### User Entity (`user.entity.ts`)
Represents application users with authentication and authorization features.

**Fields:**
- `id`: UUID primary key
- `email`: Unique email address (indexed)
- `password`: Bcrypt hashed password
- `name`: User's full name
- `role`: User role (super-admin, admin)
- `status`: Account status (active, inactive, suspended)
- `lastLoginAt`: Last login timestamp
- `lastLoginIp`: Last login IP address
- `loginAttempts`: Failed login counter
- `lockedUntil`: Account lock timestamp
- `createdAt`/`updatedAt`: Audit timestamps

**Features:**
- Account lockout after 5 failed attempts (2-hour lock)
- Automatic login attempt reset on success
- Password exclusion from JSON serialization
- Helper methods for lock status and attempt management

### Log Entity (`log.entity.ts`)
Stores comprehensive logging information for both requests and application events.

**Fields:**
- `id`: UUID primary key
- `level`: Log level (info, warn, error, debug, verbose)
- `type`: Log type (request, application)
- `message`: Log message
- `context`: JSONB additional context data
- `userId`: Associated user ID
- `sessionId`: Session identifier
- `ipAddress`: Request IP address
- `userAgent`: Request user agent
- `method`: HTTP method
- `url`: Request URL
- `statusCode`: HTTP status code
- `responseTime`: Response time in milliseconds
- `stack`: Error stack trace
- `createdAt`: Log timestamp

**Indexes:**
- `(level, createdAt)` - For filtering logs by level and time
- `(type, createdAt)` - For filtering logs by type and time
- `email` (unique) on users table

## Usage

### Importing Entities
```typescript
import { User, Log } from '../entities';

// Or import specific entities
import { User } from '../entities/user.entity';
import { Log } from '../entities/log.entity';
```

### In Modules
```typescript
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, Log } from '../entities';

@Module({
  imports: [TypeOrmModule.forFeature([User, Log])],
  // ...
})
export class SomeModule {}
```

## Database Schema

The entities are automatically synchronized with the database when `synchronize: true` is set in the TypeORM configuration (development mode). In production, use migrations for schema changes.

## Relationships

Currently, entities are standalone with no direct relationships defined. The `userId` field in logs provides a reference to users for audit purposes.

## Future Extensions

This directory is designed to grow as the application expands. New entities should:
- Follow the same naming convention (`*.entity.ts`)
- Include proper TypeORM decorators
- Have appropriate indexes for performance
- Include audit timestamps where applicable
- Be added to the `index.ts` exports