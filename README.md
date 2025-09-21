# WorkFlu Business Management System

WorkFlu is a comprehensive business management system designed for import/export trading operations. The application manages complete business workflows from working capital and purchasing through warehouse operations, shipping, sales, and revenue management with advanced AI integration and automated approval workflows.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ with npm
- **PostgreSQL** database (Neon recommended)
- **Supabase** account for authentication

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database"
PGHOST="your-neon-host"
PGPORT="5432"
PGDATABASE="your-database"
PGUSER="your-username"
PGPASSWORD="your-password"

# Authentication (Supabase)
AUTH_PROVIDER="supabase"
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Application Security
SESSION_SECRET="your-secure-session-secret-32-chars-minimum"

# AI Integration (Required for business insights)
OPENAI_API_KEY="your-openai-api-key"

# Email Notifications
SMTP_HOST="smtp.ethereal.email"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASS="your-email-password"
```

### Installation

1. **Clone and install dependencies:**
```bash
git clone <repository-url>
cd <repo-folder>
npm install
```

2. **Set up Supabase authentication:**
   - Create a new Supabase project at [supabase.com](https://supabase.com)
   - Copy your project URL and anon key to environment variables
   - Generate a service role key (Settings → API → Service Role Key)

3. **Initialize database:**
```bash
npm run db:push
```

4. **Start the application:**
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## 🔧 Authentication Setup

### Supabase Configuration

1. **Create Supabase Project:**
   - Go to [supabase.com](https://supabase.com) and create a new project
   - Wait for database setup to complete

2. **Configure Authentication:**
   - Navigate to Authentication → Settings
   - **For Development Only**: Temporarily disable "Enable email confirmations" for faster setup
   - **For Production**: Keep email confirmations enabled for security
   - Set "Site URL" to `http://localhost:5000` (or your domain)

3. **Environment Variables:**
   - Copy Project URL → `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - Copy anon/public key → `VITE_SUPABASE_ANON_KEY`
   - Copy service_role key → `SUPABASE_SERVICE_ROLE_KEY`

### Email Authentication

Users authenticate via email/password through Supabase. The system uses JWT tokens for secure, stateless authentication.

## 👤 Admin User Management

### First Admin Setup

To create the first admin user:
1. Register through the application  
2. Elevate to admin role via Users page or database update
3. Alternatively, use the migration script to import existing users

### Creating Additional Users (Admin Only)

Admins can create users through the admin panel:

1. **Access Admin Panel:**
   - Login as admin
   - Navigate to Users section

2. **Create User:**
   - Click "Add User"
   - Enter email, first name, last name
   - Select role (admin, finance, purchasing, warehouse, sales, worker)
   - Create user in Supabase dashboard and send password reset/invite email

3. **User Roles:**
   - **Admin**: Full system access including user management
   - **Finance**: Capital, financial settings, approvals
   - **Purchasing**: Purchase orders, supplier management
   - **Warehouse**: Inventory, stock management
   - **Sales**: Sales orders, customer management
   - **Worker**: Basic operational access

### Password Management

- **Recommended**: Use Supabase password reset emails for new users
- Users can change passwords in their profile
- Admins can trigger password resets through Supabase dashboard

### Deactivating Users

1. Navigate to Users section
2. Find user and click "Deactivate"
3. Deactivated users cannot login but data is preserved

## 🔄 Rollback Procedures

### Authentication Rollback

If issues arise with Supabase authentication, you can temporarily rollback:

⚠️ **Important**: The Replit OIDC code has been permanently removed. Rollback requires restoring from backup.

#### Quick Rollback Steps:

1. **Emergency Database Restore:**
```bash
# If you have a database backup before migration
psql $DATABASE_URL < backup-before-migration.sql
```

2. **Alternative: Create Admin via Supabase + Migration Script:**
```bash
# 1. Create user in Supabase dashboard first
# 2. Use migration script to sync to app database
tsx scripts/migrate-users-to-supabase.ts
# 3. Manually update role if needed:
psql $DATABASE_URL -c "UPDATE users SET role='admin' WHERE email='admin@company.com';"
```

3. **Restart Application:**
```bash
npm run dev
```

### Data Recovery

All business data (purchases, capital, warehouse, etc.) is preserved during authentication migration:

- **Capital entries**: Fully preserved
- **Purchase orders**: Intact with supplier relationships
- **Warehouse stock**: All inventory data maintained
- **Financial records**: Complete transaction history
- **Approval workflows**: All approvals and chains preserved

### System Health Check

After any rollback, verify system integrity:

1. **Check Database Connection:**
```bash
npm run check
```

2. **Verify Business Systems:**
   - Login as admin
   - Check each module (Capital, Purchases, Warehouse, etc.)
   - Verify FX rates are configured
   - Test approval workflows

3. **Monitor Logs:**
```bash
# Check for any system errors
npm run dev
# Monitor console for errors
```

## 🛠️ Troubleshooting

### Common Issues

**"Cannot find module" errors:**
- Run `npm install` to ensure dependencies are installed
- Check that all required environment variables are set

**Database connection errors:**
- Verify `DATABASE_URL` is correct
- Ensure database is accessible
- Run `npm run db:push` to sync schema (or `npm run db:push --force` if needed)

**Authentication failures:**
- Check Supabase configuration in dashboard
- Verify environment variables match your Supabase project
- Ensure `AUTH_PROVIDER=supabase` is set
- Check `OPENAI_API_KEY` is set (required for system operation)

**Permission denied errors:**
- Check user roles are correctly assigned
- Verify approval workflows are configured
- Ensure at least one admin user exists

### Getting Help

1. **Check Logs:**
   - Server logs show authentication and business logic errors
   - Browser console shows frontend issues

2. **Database Debugging:**
```bash
# Connect to database for investigation
psql $DATABASE_URL
\dt  # List tables
SELECT * FROM users LIMIT 5;  # Check user data
```

3. **Reset to Clean State:**
```bash
# WARNING: This deletes all data
npm run db:push --force
# Then create first admin user through Supabase registration
```

## 📋 System Requirements

- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 12.0 or higher  
- **Memory**: 2GB RAM minimum (4GB recommended)
- **Storage**: 1GB available space
- **Network**: Internet connection for Supabase and AI features

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication via Supabase
- **Role-Based Access Control**: Granular permissions per user role
- **Audit Logging**: Immutable logs for all business operations
- **Database Security**: Triggers and constraints prevent data tampering
- **Approval Workflows**: Multi-level approvals for sensitive operations
- **Period Guards**: Financial period controls with closing/reopening

## 📖 Additional Documentation

- **System Architecture**: See `replit.md` for detailed technical architecture
- **Implementation Strategy**: See `docs/IMPLEMENTATION-STRATEGY.md` for business requirements
- **Migration Scripts**: See `scripts/` directory for user migration utilities

---

For technical support or questions about WorkFlu, please refer to the system logs and documentation files in the `docs/` directory.