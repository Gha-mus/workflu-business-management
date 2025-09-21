/**
 * User Migration Script: Migrate existing users to Supabase Auth
 * 
 * This script:
 * 1. Updates existing users' auth provider information
 * 2. Maps users by email to Supabase accounts
 * 3. Populates auth_provider_user_id for existing users
 */

import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

interface MigrationResult {
  totalUsers: number;
  migratedUsers: number;
  errors: Array<{ email: string; error: string }>;
}

export async function migrateUsersToSupabase(): Promise<MigrationResult> {
  console.log('🔄 Starting user migration to Supabase...');
  
  const result: MigrationResult = {
    totalUsers: 0,
    migratedUsers: 0,
    errors: []
  };

  try {
    // Get all existing users
    const existingUsers = await db.select().from(users);
    result.totalUsers = existingUsers.length;
    
    console.log(`📊 Found ${existingUsers.length} users to migrate`);

    for (const user of existingUsers) {
      if (!user.email) {
        result.errors.push({ email: user.id, error: 'No email address' });
        continue;
      }

      try {
        console.log(`🔄 Migrating user: ${user.email}`);

        // Check if user already exists in Supabase
        const { data: existingSupabaseUser } = await supabaseAdmin.auth.admin.getUserByEmail(user.email);
        
        let supabaseUserId: string;
        
        if (existingSupabaseUser.user) {
          // User already exists in Supabase
          supabaseUserId = existingSupabaseUser.user.id;
          console.log(`✅ User ${user.email} already exists in Supabase with ID: ${supabaseUserId}`);
        } else {
          // Create user in Supabase
          const { data: newSupabaseUser, error } = await supabaseAdmin.auth.admin.createUser({
            email: user.email,
            password: generateTemporaryPassword(),
            email_confirm: true,
            user_metadata: {
              first_name: user.firstName,
              last_name: user.lastName,
              role: user.role,
              migrated_from_replit: true
            }
          });

          if (error || !newSupabaseUser.user) {
            result.errors.push({ email: user.email, error: error?.message || 'Failed to create Supabase user' });
            continue;
          }

          supabaseUserId = newSupabaseUser.user.id;
          console.log(`✅ Created Supabase user for ${user.email} with ID: ${supabaseUserId}`);
        }

        // Update user record with auth provider information
        await db.update(users)
          .set({
            authProvider: 'supabase',
            authProviderUserId: supabaseUserId,
            updatedAt: new Date()
          })
          .where(eq(users.id, user.id));

        result.migratedUsers++;
        console.log(`✅ Updated user ${user.email} with Supabase auth info`);

      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error);
        result.errors.push({ 
          email: user.email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    console.log(`🎉 Migration completed: ${result.migratedUsers}/${result.totalUsers} users migrated`);
    
    if (result.errors.length > 0) {
      console.log('❌ Errors during migration:');
      result.errors.forEach(err => console.log(`  - ${err.email}: ${err.error}`));
    }

    return result;

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

function generateTemporaryPassword(): string {
  // Generate a secure temporary password
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// Run migration if called directly
if (require.main === module) {
  migrateUsersToSupabase()
    .then(result => {
      console.log('Migration result:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}