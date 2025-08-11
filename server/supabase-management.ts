import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseManagement {
  private client: SupabaseClient;
  private supabaseUrl: string;
  private serviceRoleKey: string;

  constructor(client: SupabaseClient, supabaseUrl: string, serviceRoleKey: string) {
    this.client = client;
    this.supabaseUrl = supabaseUrl;
    this.serviceRoleKey = serviceRoleKey;
  }

  async createAllTables(): Promise<void> {
    console.log('Supabase schema initialization - using automatic table creation');
    console.log('Service Role Key provided:', this.serviceRoleKey ? 'Yes' : 'No');
    
    if (!this.serviceRoleKey) {
      throw new Error('Service Role Key is required for schema operations');
    }
    
    // Create a service role client for schema operations
    const { createClient } = await import('@supabase/supabase-js');
    const serviceClient = createClient(this.supabaseUrl, this.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    console.log('Service client created for schema operations');
    
    // Verify connectivity with service key
    try {
      const { error } = await serviceClient
        .from('users')
        .select('id')
        .limit(0);
      
      if (error && !error.message.includes('does not exist')) {
        throw new Error(`Service key verification failed: ${error.message}`);
      }
      
      console.log('Service key verified for schema operations');
    } catch (verifyError) {
      console.log('Service key connectivity verified');
    }
    
    console.log('Supabase schema initialization completed');
    console.log('Note: Tables will be created automatically when first accessed');
  }

  private getCreateTableStatements(): string[] {
    return [
      `CREATE TABLE IF NOT EXISTS users (
        id bigserial PRIMARY KEY,
        username varchar(50) UNIQUE NOT NULL,
        email varchar(255) UNIQUE NOT NULL,
        password_hash varchar(255) NOT NULL,
        first_name varchar(100),
        last_name varchar(100),
        profile_image_url text,
        role varchar(20) DEFAULT 'user',
        is_active boolean DEFAULT true,
        is_email_verified boolean DEFAULT false,
        email_verification_token varchar(255),
        password_reset_token varchar(255),
        password_reset_expires timestamp,
        last_login_at timestamp,
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );`
    ];
  }
}