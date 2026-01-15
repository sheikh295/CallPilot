# CallPilot Backend

A NestJS-based backend API for CallPilot - an outbound voice AI platform that enables creating, launching, and tracking AI-powered calls to contacts.

## Features

- ✅ **Authentication**: JWT-based authentication system
- ✅ **Contact Management**: CRUD operations for contacts with search and bulk import
- ✅ **Call Management**: Create, launch, and track outbound calls
- ✅ **Vapi Integration**: Webhook handling for call lifecycle events
- ✅ **Database**: PostgreSQL with TypeORM
- ✅ **API Documentation**: Swagger/OpenAPI with Bearer token support
- ✅ **Validation**: Comprehensive input validation with class-validator
- ✅ **Logging**: Structured logging with Winston

## Tech Stack

- **Framework**: NestJS 11.x
- **Language**: TypeScript
- **Database**: PostgreSQL (Supabase)
- **ORM**: TypeORM
- **Authentication**: JWT with Passport
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Voice AI**: Vapi integration ready

## Quick Start

### Prerequisites
- Node.js 24+
- pnpm
- PostgreSQL database (Supabase recommended)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment file
cp example.env .env

# Update .env with your database URL and JWT secret
```

### Environment Variables

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/callpilot
JWT_SECRET=your-super-secret-jwt-key
```

### Database Setup

```bash
# Run database migrations/seeding
pnpm run seed
```

### Development

```bash
# Start development server
pnpm run start:dev

# Build for production
pnpm run build

# Start production server
pnpm run start:prod
```

## API Documentation

### Development Environment
When running locally, Swagger UI is available at:
```
http://localhost:3000/api
```

### Production Environment (Vercel/Serverless)
In production environments, Swagger UI is disabled for performance reasons. Instead, the OpenAPI JSON specification is available at:
```
https://your-app.vercel.app/api-json
```

You can import this JSON into tools like:
- Postman
- Insomnia
- Swagger Editor
- Other OpenAPI-compatible tools

## API Endpoints

### Authentication
- `POST /v1/auth/signin` - User authentication

### Contacts
- `POST /v1/contacts` - Create contact
- `GET /v1/contacts` - List contacts (with search & pagination)
- `POST /v1/contacts/bulk` - Bulk import contacts (CSV)
- `GET /v1/contacts/:id` - Get contact details
- `PATCH /v1/contacts/:id` - Update contact
- `DELETE /v1/contacts/:id` - Delete contact

### Calls
- `POST /v1/calls` - Create call configuration
- `GET /v1/calls` - List calls (with search & pagination)
- `GET /v1/calls/:id` - Get call details
- `POST /v1/calls/:id/launch` - Launch call

### Webhooks
- `POST /webhooks/vapi` - Vapi webhook handler

## Project Structure

```
src/
├── entities/           # Database entities
│   ├── user.entity.ts
│   ├── contact.entity.ts
│   ├── call.entity.ts
│   └── log.entity.ts
├── features/           # Feature modules
│   ├── auth/          # Authentication
│   ├── contacts/      # Contact management
│   └── calls/         # Call management
├── services/          # Shared services
│   ├── logger/        # Logging service
│   └── vapi/          # Vapi integration (future)
├── guards/            # Authentication guards
├── interceptors/      # Request interceptors
└── main.ts           # Application entry point
```

## Deployment

### Vercel (Serverless)
The application is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push

**Important**: Swagger UI is disabled in production for performance. Use `/api-json` endpoint instead.

### Environment Variables for Production
```env
NODE_ENV=production
DATABASE_URL=your-supabase-connection-string
JWT_SECRET=your-production-jwt-secret
```

## Development Guidelines

### Code Style
- ESLint configuration included
- Prettier for code formatting
- TypeScript strict mode enabled

### Testing
```bash
# Run tests
pnpm run test

# Run e2e tests
pnpm run test:e2e

# Test coverage
pnpm run test:cov
```

### Database Migrations
Currently using TypeORM synchronization. For production, consider using proper migrations:

```bash
# Generate migration
npm run typeorm:generate-migration -- --name=YourMigrationName

# Run migrations
npm run typeorm:run-migrations
```

## Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Ensure all tests pass

## License

This project is part of the CallPilot assessment.