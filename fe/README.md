# CallPilot Frontend

Modern, responsive frontend for the CallPilot AI calling platform built with Next.js 16 and React 19.

## Features

- 🎨 **Modern UI**: Sleek design with Tailwind CSS 4
- ♾️ **Infinite Scroll**: Efficient pagination with TanStack React Query
- 🔄 **Real-time Updates**: 5-second polling for call status changes
- 📱 **Responsive**: Mobile-first design that works on all devices
- 🎯 **Type-safe**: Full TypeScript coverage
- 🚀 **Optimized**: Built with Next.js for optimal performance
- 🎭 **Interactive**: Modals, toasts, and smooth transitions
- 🔐 **Secure**: JWT-based authentication with protected routes

## Tech Stack

- **Next.js 16** - React framework with App Router
- **React 19** - UI library
- **TypeScript** - Type safety
- **TanStack React Query** - Data fetching and caching
- **Axios** - HTTP client
- **Tailwind CSS 4** - Utility-first CSS
- **Lucide React** - Icon library
- **React Hot Toast** - Toast notifications

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Backend API running on `http://localhost:3000`

### Installation

```bash
# Install dependencies
pnpm install

# Create environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:3000" > .env.local

# Start development server
pnpm run dev
```

The app will be available at `http://localhost:3001`

### Building for Production

```bash
# Build the app
pnpm run build

# Start production server
pnpm run start
```

## Environment Variables

Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

Note: `.env.local` is gitignored by default.

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── auth/              # Authentication page
│   ├── contacts/          # Contacts management
│   ├── calls/             # Calls management
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home/redirect page
├── components/            # React components
│   ├── ui/                # Reusable UI components
│   └── layout/            # Layout components
├── contexts/              # React contexts
├── api/                   # API client functions
├── lib/                   # Utilities
└── types/                 # TypeScript types
```

## Key Features

### Infinite Scroll
Uses `useInfiniteQuery` from React Query with Intersection Observer for seamless pagination.

### Real-time Updates
Calls page polls the API every 5 seconds to keep call statuses up-to-date.

### Form Validation
All forms include client-side validation with clear error messages.

### Responsive Design
Mobile-first approach with hamburger menu on mobile devices.

## Development

```bash
# Run development server
pnpm run dev

# Build for production
pnpm run build

# Lint code
pnpm run lint
```

## License

Proprietary - All rights reserved
