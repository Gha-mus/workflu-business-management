/**
 * Script to create admin user in Supabase for ghassan.ahmed711@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

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

async function createAdminUser() {
  const email = 'ghassan.ahmed711@gmail.com';
  const tempPassword = 'WorkFlu2024Admin!';  // Secure temporary password
  
  console.log('🔐 Creating Supabase admin account for:', email);
  
  try {
    // Check if user already exists in Supabase
    const { data: { users: existingUsers } } = await supabaseAdmin.auth.admin.listUsers();
    
    const existingSupabaseUser = existingUsers?.find(u => u.email === email);
    let supabaseUserId: string;
    
    if (existingSupabaseUser) {
      // User already exists in Supabase
      supabaseUserId = existingSupabaseUser.id;
      console.log('✅ User already exists in Supabase with ID:', supabaseUserId);
      
      // Update the password
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUserId,
        { password: tempPassword }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
      } else {
        console.log('✅ Password updated successfully');
      }
    } else {
      // Create new user in Supabase
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email for immediate access
        user_metadata: {
          first_name: 'Ghassan',
          last_name: 'Ahmed',
          role: 'admin'
        }
      });
      
      if (createError || !newUser?.user) {
        throw new Error(`Failed to create Supabase user: ${createError?.message}`);
      }
      
      supabaseUserId = newUser.user.id;
      console.log('✅ New Supabase user created with ID:', supabaseUserId);
    }
    
    // Update the user record in our database
    const [updatedUser] = await db
      .update(users)
      .set({
        authProvider: 'supabase',
        authProviderUserId: supabaseUserId,
        updatedAt: new Date()
      })
      .where(eq(users.email, email))
      .returning();
    
    if (!updatedUser) {
      throw new Error('Failed to update user in database');
    }
    
    console.log('✅ User migrated to Supabase authentication');
    console.log('📧 Email:', email);
    console.log('🔑 Temporary Password:', tempPassword);
    console.log('👤 Role:', updatedUser.role);
    console.log('');
    console.log('🎉 Admin account setup complete!');
    console.log('');
    console.log('📋 Login Instructions:');
    console.log('1. Go to the application login page');
    console.log('2. Enter email:', email);
    console.log('3. Enter password:', tempPassword);
    console.log('4. You can change your password after logging in from your profile settings');
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the script
createAdminUser().then(() => process.exit(0));