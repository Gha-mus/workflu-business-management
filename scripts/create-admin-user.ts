import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool } from '@neondatabase/serverless';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';
import { createClient } from '@supabase/supabase-js';

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAdminUser() {
  const adminEmail = 'ghassan.ahmed711@gmail.com';
  const adminPassword = 'WorkFlu2024Admin!';
  const adminData = {
    email: adminEmail,
    firstName: 'Ghassan',
    lastName: 'Ahmed',
    role: 'admin' as const,
  };

  console.log('🔐 Creating admin user in Supabase...');

  try {
    // Check if user already exists in Supabase by listing users
    const { data: { users: allUsers }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('Error listing users:', listError);
      throw listError;
    }
    
    const existingUser = allUsers?.find(u => u.email === adminEmail);
    
    let supabaseUserId: string;
    
    if (existingUser) {
      // User exists, update password
      supabaseUserId = existingUser.id;
      console.log(`📝 User ${adminEmail} already exists in Supabase, updating password...`);
      
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
        supabaseUserId,
        { 
          password: adminPassword,
          email_confirm: true
        }
      );
      
      if (updateError) {
        console.error('❌ Error updating password:', updateError);
        throw updateError;
      }
      console.log('✅ Password updated successfully');
      
    } else {
      // Create new user in Supabase
      console.log(`📝 Creating new user ${adminEmail} in Supabase...`);
      
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: adminEmail,
        password: adminPassword,
        email_confirm: true,
        user_metadata: {
          first_name: adminData.firstName,
          last_name: adminData.lastName,
          role: adminData.role
        }
      });
      
      if (createError || !newUser.user) {
        console.error('❌ Error creating user in Supabase:', createError);
        throw createError || new Error('Failed to create user');
      }
      
      supabaseUserId = newUser.user.id;
      console.log(`✅ User created in Supabase with ID: ${supabaseUserId}`);
    }
    
    // Check if user exists in database
    const [existingDbUser] = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existingDbUser) {
      // Update existing user
      console.log(`📝 Updating user in database...`);
      await db.update(users)
        .set({
          id: supabaseUserId,
          ...adminData,
          updatedAt: new Date()
        })
        .where(eq(users.email, adminEmail));
      console.log('✅ User updated in database');
    } else {
      // Create new user in database
      console.log(`📝 Creating user in database...`);
      await db.insert(users).values({
        id: supabaseUserId,
        ...adminData,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ User created in database');
    }
    
    console.log('\n🎉 Admin user setup completed successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role: Admin');
    console.log('\nYou can now log in at /auth/login');
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error);
    throw error;
  }
}

// Run the script
createAdminUser()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });