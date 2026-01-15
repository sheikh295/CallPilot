# CallPilot

AI-Powered Outbound Voice Calling Platform

## Overview

CallPilot is a full-stack application that enables AI-powered outbound calling. It consists of:
- **Backend (NestJS)**: RESTful API with PostgreSQL database, Vapi integration for voice AI
- **Frontend (Next.js)**: Modern, responsive UI with infinite scroll, real-time updates

## Features

### Backend
- ✅ Contact management (CRUD operations)
- ✅ Call configuration and management
- ✅ Vapi integration for AI voice calls
- ✅ Webhook handling for call status updates
- ✅ Authentication with JWT
- ✅ Swagger API documentation
- ✅ CSV bulk import for contacts

### Frontend
- ✅ Modern, sleek UI with Tailwind CSS
- ✅ Authentication with protected routes
- ✅ Contact management with infinite scroll
- ✅ CSV bulk upload for contacts
- ✅ Call creation with AI prompt generator
- ✅ Call monitoring with real-time status updates
- ✅ Call details view with transcripts and summaries
- ✅ Responsive design for mobile and desktop
- ✅ React Query for efficient data fetching and caching
- ✅ Toast notifications for user feedback

## Tech Stack

### Backend
- NestJS 11
- TypeScript
- PostgreSQL (Supabase)
- TypeORM
- JWT Authentication
- Vapi SDK
- Swagger/OpenAPI

### Frontend
- Next.js 16 (App Router)
- React 19
- TypeScript
- TanStack React Query (with Infinite Queries)
- Axios
- Tailwind CSS 4
- Lucide Icons
- React Hot Toast

## Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- PostgreSQL database (Supabase recommended)
- Vapi account (for voice AI)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd be
```

2. Install dependencies:
```bash
pnpm install
```

3. Copy the example environment file and configure:
```bash
cp example.env .env
```

4. Update the `.env` file with your credentials:
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
VAPI_API_KEY=your-vapi-key
VAPI_WEBHOOK_API_KEY=your-webhook-key
VAPI_ASSISTANT_ID=your-assistant-id
VAPI_PHONE_NUMBER_ID=your-phone-number-id
PORT=3000
```

5. Run database migrations (if applicable) or ensure your database is set up

6. Start the development server:
```bash
pnpm run start:dev
```

The backend will be available at `http://localhost:3000`
Swagger docs at `http://localhost:3000/api`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd fe
```

2. Install dependencies:
```bash
pnpm install
```

3. Create a `.env.local` file:
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local
```

4. Start the development server:
```bash
pnpm run dev
```

The frontend will be available at `http://localhost:3001`

### Authentication

The app uses JWT-based authentication. To sign in, use the credentials you created via the backend API or use demo credentials (if seeded).

**Note**: The auth page shows demo credentials. You'll need to create a user in the backend first or update the auth flow to use actual authentication endpoints.

## API Documentation

### Authentication
- `POST /v1/auth/signin` - Sign in with email and password

### Contacts
- `GET /v1/contacts` - List contacts (paginated, searchable)
- `GET /v1/contacts/:id` - Get contact by ID
- `POST /v1/contacts` - Create new contact
- `PATCH /v1/contacts/:id` - Update contact
- `DELETE /v1/contacts/:id` - Delete contact
- `POST /v1/contacts/bulk` - Bulk upload via CSV

### Calls
- `GET /v1/calls` - List calls (paginated, searchable)
- `GET /v1/calls/:id` - Get call by ID
- `POST /v1/calls` - Create new call
- `POST /v1/calls/:id/launch` - Launch/trigger call

### Webhooks
- `POST /webhooks/vapi` - Handle Vapi callbacks

Full API documentation is available at `http://localhost:3000/api` when running the backend in development mode.

## Project Structure

```
CallPilot/
├── be/                    # Backend (NestJS)
│   ├── src/
│   │   ├── features/     # Feature modules (auth, contacts, calls)
│   │   ├── entities/     # Database entities
│   │   ├── services/     # Shared services (Vapi, Logger)
│   │   ├── guards/       # Auth guards
│   │   └── interceptors/ # HTTP interceptors
│   └── test/             # E2E tests
├── fe/                    # Frontend (Next.js)
│   ├── src/
│   │   ├── app/          # App routes and pages
│   │   ├── components/   # Reusable components
│   │   ├── contexts/     # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── lib/          # Utilities
│   │   ├── api/          # API client
│   │   └── types/        # TypeScript types
│   └── public/           # Static assets
└── docs/                  # Documentation
```

## Key Features Explained

### Infinite Scroll
Both contacts and calls pages use TanStack React Query's `useInfiniteQuery` with Intersection Observer API for smooth infinite scrolling.

### Real-time Call Updates
The calls page polls the API every 5 seconds to fetch updated call statuses, ensuring users see the latest information.

### Agent Prompt Generator
The create call modal includes a template generator that provides a structured prompt for the AI agent with best practices.

### CSV Import
Users can bulk upload contacts via CSV files with the format: `Name,PhoneNumber`

## Development

### Building for Production

Backend:
```bash
cd be
pnpm run build
pnpm run start:prod
```

Frontend:
```bash
cd fe
pnpm run build
pnpm run start
```

### Linting

Backend:
```bash
cd be
pnpm run lint
```

Frontend:
```bash
cd fe
pnpm run lint
```

## Future Enhancements

- [ ] Real-time call status via WebSockets
- [ ] Advanced call analytics dashboard
- [ ] Call recording playback
- [ ] Scheduled calls
- [ ] Multi-language support
- [ ] User management and roles
- [ ] Call templates library
- [ ] A/B testing for prompts
- [ ] Integration with CRMs
- [ ] Mobile app

## Contributing

This is a private project. If you have access and want to contribute, please follow the standard PR process.

## License

Proprietary - All rights reserved
