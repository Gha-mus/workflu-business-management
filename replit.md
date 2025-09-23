# Overview

WorkFlu is a comprehensive business management system designed for import/export trading operations with a focus on coffee trading. The application manages the complete business workflow from working capital and purchasing through warehouse operations, shipping, sales, and revenue management. It features advanced AI integration for business insights, automated approval workflows, and comprehensive audit trails. The system is built around 10 core business stages that mirror real-world trading operations with strict compliance requirements.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for fast development and optimized builds
- **UI Components**: shadcn/ui component library built on Radix UI primitives for accessible, composable components
- **Styling**: Tailwind CSS with CSS variables for consistent theming and dark mode support
- **State Management**: TanStack Query (React Query) for server state management with automatic caching and synchronization
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **Mobile Responsiveness**: Mobile-first design approach with responsive breakpoints

## Backend Architecture
- **Framework**: Express.js with TypeScript for robust API development
- **API Design**: RESTful API architecture with JSON responses and structured error handling
- **Authentication**: Supabase Email/Password authentication with JWT tokens
- **Session Management**: JWT-based stateless authentication for scalability
- **Validation**: Zod schemas for request/response validation and type safety
- **Middleware**: Centralized approval workflows, period guards, and audit logging

## Database Architecture
- **Database**: PostgreSQL with Neon serverless connection pooling
- **ORM**: Drizzle ORM with type-safe queries and schema migrations
- **Schema Design**: Relational design with proper foreign key relationships across 10 business stages
- **Indexing**: Strategic indexes for performance optimization on frequently queried fields
- **Audit Trail**: Immutable audit logs for all business operations with comprehensive change tracking

## AI Integration
- **Provider**: OpenAI API with GPT-4 model for business intelligence
- **Features**: Executive summaries, anomaly detection, market timing insights, supplier analysis, and contextual help
- **Caching**: AI responses cached in PostgreSQL to optimize API usage and improve performance
- **Service Pattern**: Singleton AI service class for centralized AI operations and conversation management

## Authentication & Authorization
- **Authentication**: Supabase Email/Password authentication with secure JWT tokens
- **Authorization**: Role-based access control with granular permissions (admin, finance, purchasing, warehouse, sales, worker)
- **Session Security**: HTTP-only cookies with CSRF protection and secure transmission
- **User Management**: Admin-controlled user roles with approval workflows for sensitive changes

## Business Workflow Architecture
- **Stage-Based Design**: 10 core business stages with strict inter-stage dependencies and validation
- **Approval Workflows**: Multi-level approval chains with configurable thresholds and escalation
- **Period Management**: Financial period controls with period closing and reopening workflows
- **Capital Management**: Working capital tracking with automatic FX conversion and balance validation
- **Inventory Tracking**: Multi-stage inventory from purchases through warehouse filtering to final sales

## Financial Architecture
- **Multi-Currency Support**: USD/ETB with centralized exchange rate management and historical tracking
- **Exchange Rate Management**: Admin-only bypass endpoint for immediate updates without approval workflow, regular users go through standard approval
- **Cost Allocation**: Automatic cost redistribution through warehouse filtering and shipping stages
- **Revenue Management**: Dual balance tracking (accounting revenue vs withdrawable balance)
- **Expense Management**: Comprehensive operating expense tracking with supply inventory management

## Integration Architecture
- **Document Management**: File upload and management with versioning and compliance tracking
- **Notification System**: Multi-channel notifications (in-app, email, SMS) with configurable delivery preferences
- **Export Services**: Comprehensive data export capabilities with scheduled and on-demand generation
- **Monitoring & Alerts**: Proactive business monitoring with configurable alert thresholds

# External Dependencies

## Database Services
- **Neon PostgreSQL**: Serverless PostgreSQL database with connection pooling and automatic scaling
- **Drizzle Kit**: Database migration and schema management toolkit

## Authentication Services
- **Supabase Auth**: Email/Password authentication with secure JWT token management
- **JWT Verification**: Token-based authentication for stateless, scalable user sessions

## AI Services
- **OpenAI API**: GPT-4 model integration for business intelligence and automated insights
- **Document Processing**: AI-powered document analysis and workflow recommendations

## UI Component Libraries
- **Radix UI**: Unstyled, accessible UI primitives for React applications
- **shadcn/ui**: Pre-built component library with consistent design patterns
- **Lucide React**: Comprehensive icon library for consistent iconography

## File Processing
- **Multer**: File upload middleware for document management
- **Sharp**: Image processing for document thumbnails and optimization
- **Archiver**: File compression for bulk export operations

## Email & Notifications
- **Nodemailer**: Email sending capabilities for system notifications
- **Node-cron**: Scheduled task execution for automated monitoring and reports

## Development & Build Tools
- **Vite**: Fast build tool with hot module replacement for development
- **TypeScript**: Type safety across frontend and backend
- **ESBuild**: Fast JavaScript bundler for production builds
- **Tailwind CSS**: Utility-first CSS framework for consistent styling