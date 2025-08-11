import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { User, UpsertUser } from '@shared/schema';

export class SupabaseStorageNew {
  private client: SupabaseClient;
  private serviceClient: SupabaseClient;
  private supabaseUrl: string;
  private supabaseAnonKey: string;
  private supabaseServiceKey: string;

  constructor(supabaseUrl: string, supabaseAnonKey: string, supabaseServiceKey: string) {
    this.supabaseUrl = supabaseUrl;
    this.supabaseAnonKey = supabaseAnonKey;
    this.supabaseServiceKey = supabaseServiceKey;

    // Create both anon and service clients
    this.client = createClient(supabaseUrl, supabaseAnonKey);
    this.serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    console.log('SupabaseStorageNew initialized with both anon and service clients');
  }

  async initializeSchema(): Promise<void> {
    console.log('Supabase schema initialization - checking table existence...');
    
    // Instead of trying to create tables programmatically, just verify they exist
    try {
      const { data, error } = await this.serviceClient
        .from('users')
        .select('id')
        .limit(1);

      if (error && error.message?.includes('does not exist')) {
        console.log('CRITICAL: Users table does not exist in Supabase database');
        console.log('');
        console.log('ACTION REQUIRED:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run this SQL to create the users table:');
        console.log('');
        console.log(this.getUsersTableSQL());
        console.log('');
        throw new Error('Users table does not exist. Please create it manually in Supabase dashboard.');
      }

      console.log('Users table exists and is accessible');
    } catch (error) {
      if (error instanceof Error && error.message.includes('does not exist')) {
        throw error;
      }
      console.error('Error checking table existence:', error);
      // Continue anyway - might be a temporary connection issue
    }
  }

  private getUsersTableSQL(): string {
    return `
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  role TEXT DEFAULT 'user',
  is_active BOOLEAN DEFAULT true,
  is_email_verified BOOLEAN DEFAULT false,
  email_verification_token TEXT,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMP,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Disable RLS for simpler initial setup
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
`;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    console.log('Creating user in Supabase with service client...');
    
    const dbUserData = {
      username: userData.username,
      email: userData.email,
      password_hash: userData.passwordHash,
      first_name: userData.firstName || null,
      last_name: userData.lastName || null,
      profile_image_url: userData.profileImageUrl || null,
      role: userData.role || 'user',
      is_active: userData.isActive ?? true,
      is_email_verified: userData.isEmailVerified ?? false,
      email_verification_token: userData.emailVerificationToken || null,
      password_reset_token: userData.passwordResetToken || null,
      password_reset_expires: userData.passwordResetExpires || null,
      last_login_at: userData.lastLoginAt || null,
    };

    console.log('Inserting user data:', JSON.stringify(dbUserData, null, 2));

    try {
      const { data, error } = await this.serviceClient
        .from('users')
        .insert(dbUserData)
        .select()
        .single();

      if (error) {
        console.error('Supabase insert error:', error);
        
        if (error.message?.includes('does not exist')) {
          throw new Error('Users table does not exist. Please create it manually in Supabase dashboard first.');
        }
        
        if (error.message?.includes('duplicate key')) {
          throw new Error(`User with username "${userData.username}" or email "${userData.email}" already exists`);
        }

        throw new Error(`Failed to create user: ${error.message}`);
      }

      if (!data) {
        throw new Error('User creation succeeded but no data was returned');
      }

      console.log('User created successfully:', data.id);
      return data;
    } catch (error) {
      console.error('User creation failed:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await this.serviceClient
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.serviceClient
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  async getUserById(id: number): Promise<User | null> {
    const { data, error } = await this.serviceClient
      .from('users')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No rows found
      }
      throw new Error(`Failed to get user: ${error.message}`);
    }

    return data;
  }

  async updateUser(id: number, updates: Partial<UpsertUser>): Promise<User> {
    const dbUpdates: any = {};
    
    if (updates.username !== undefined) dbUpdates.username = updates.username;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.passwordHash !== undefined) dbUpdates.password_hash = updates.passwordHash;
    if (updates.firstName !== undefined) dbUpdates.first_name = updates.firstName;
    if (updates.lastName !== undefined) dbUpdates.last_name = updates.lastName;
    if (updates.profileImageUrl !== undefined) dbUpdates.profile_image_url = updates.profileImageUrl;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;
    if (updates.isEmailVerified !== undefined) dbUpdates.is_email_verified = updates.isEmailVerified;
    if (updates.emailVerificationToken !== undefined) dbUpdates.email_verification_token = updates.emailVerificationToken;
    if (updates.passwordResetToken !== undefined) dbUpdates.password_reset_token = updates.passwordResetToken;
    if (updates.passwordResetExpires !== undefined) dbUpdates.password_reset_expires = updates.passwordResetExpires;
    if (updates.lastLoginAt !== undefined) dbUpdates.last_login_at = updates.lastLoginAt;
    
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await this.serviceClient
      .from('users')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update user: ${error.message}`);
    }

    if (!data) {
      throw new Error('Update succeeded but no data was returned');
    }

    return data;
  }

  async deleteUser(id: number): Promise<void> {
    const { error } = await this.serviceClient
      .from('users')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete user: ${error.message}`);
    }
  }

  async getAllUsers(): Promise<User[]> {
    const { data, error } = await this.serviceClient
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to get users: ${error.message}`);
    }

    return data || [];
  }

  async getUserCount(): Promise<number> {
    const { count, error } = await this.serviceClient
      .from('users')
      .select('*', { count: 'exact', head: true });

    if (error) {
      throw new Error(`Failed to get user count: ${error.message}`);
    }

    return count || 0;
  }

  // Helper method to test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.serviceClient
        .from('users')
        .select('count')
        .limit(1);

      if (error && error.message?.includes('does not exist')) {
        return {
          success: false,
          error: 'Users table does not exist. Please create it manually in Supabase dashboard.'
        };
      }

      if (error) {
        return {
          success: false,
          error: error.message
        };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}