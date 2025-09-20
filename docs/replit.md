# Overview

WorkFlu is a comprehensive business management system designed for trading operations with a focus on working capital management, purchasing, inventory tracking, and financial reporting. The application provides a full-stack solution with AI-powered insights to help businesses optimize their operations, manage suppliers, track warehouse stock, and generate detailed reports. It features role-based access control, multi-currency support, and real-time analytics for business intelligence.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom CSS variables for theming support
- **State Management**: React Query (TanStack Query) for server state management and API caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful API with JSON responses
- **Authentication**: OpenID Connect integration with Replit Auth using Passport.js
- **Session Management**: Express sessions with PostgreSQL store
- **Validation**: Zod schemas for request/response validation
- **Error Handling**: Centralized error handling middleware

## Database Architecture
- **Database**: PostgreSQL with Neon serverless connection
- **ORM**: Drizzle ORM with type-safe queries and migrations
- **Schema Design**: Relational design with proper foreign key relationships
- **Tables**: Users, suppliers, orders, purchases, capital entries, warehouse stock, settings, AI insights cache, and conversations
- **Indexing**: Strategic indexes for performance optimization

## AI Integration
- **Provider**: OpenAI API with GPT-5 model integration
- **Features**: Executive summaries, anomaly detection, market timing insights, purchase recommendations, supplier analysis, and contextual help
- **Caching**: AI responses cached in PostgreSQL to optimize API usage
- **Service Pattern**: Singleton AI service class for centralized AI operations

## Authentication & Authorization
- **Authentication**: Replit OpenID Connect integration
- **Authorization**: Role-based access control (admin, finance, purchasing, warehouse, sales, worker)
- **Session Security**: HTTP-only cookies with secure settings
- **User Management**: Admin-only user role management capabilities

## Data Flow Architecture
- **Client-Server**: JSON API communication with credential-based authentication
- **Real-time Updates**: React Query for automatic cache invalidation and refetching
- **State Synchronization**: Server-side validation with client-side form state management
- **Error Propagation**: Structured error handling from database to UI

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Database URL**: Environment variable-based connection configuration

## AI Services
- **OpenAI API**: GPT-5 model for business intelligence and recommendations
- **API Key**: Environment variable-based authentication

## Authentication Services
- **Replit Auth**: OpenID Connect provider for user authentication
- **Session Storage**: PostgreSQL-based session management with connect-pg-simple

## Development Tools
- **Vite**: Frontend development server and build tool with React plugin
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Backend bundling for production builds
- **Drizzle Kit**: Database migration and schema management

## UI Libraries
- **Radix UI**: Headless UI primitives for accessibility
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Chart library for data visualization
- **Date-fns**: Date manipulation and formatting

## Utility Libraries
- **Decimal.js**: Precision decimal arithmetic for financial calculations
- **Class Variance Authority**: Type-safe CSS class variants
- **Clsx**: Conditional CSS class composition
- **Zod**: Runtime type validation and schema definition