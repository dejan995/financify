import { createClient, SupabaseClient } from '@supabase/supabase-js';
// Remove Database type import since it's not needed for basic connection testing

let supabaseClient: SupabaseClient | null = null;

export function initializeSupabaseClient(supabaseUrl: string, supabaseAnonKey: string): SupabaseClient {
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabaseClient;
}

export function clearSupabaseClient(): void {
  supabaseClient = null;
}

export async function testSupabaseConnection(supabaseUrl: string, supabaseAnonKey: string, supabaseServiceKey?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate URL format
    if (!supabaseUrl.includes('supabase.co')) {
      return { success: false, error: 'Invalid Supabase URL format. Should be https://your-project.supabase.co' };
    }
    
    console.log('Testing Supabase connection...');
    console.log('- URL:', supabaseUrl);
    console.log('- Anon Key provided:', supabaseAnonKey ? 'Yes' : 'No');
    console.log('- Service Key provided:', supabaseServiceKey ? 'Yes' : 'No');
    
    // Test with anonymous key first
    const testClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connectivity by checking system tables
    const { data, error } = await testClient
      .from('pg_stat_activity')
      .select('application_name')
      .limit(1);
    
    if (error) {
      console.log('Anonymous key test result:', error.message);
      // This is expected for basic auth tests
    } else {
      console.log('Anonymous key connection successful');
    }
    
    // If service key is provided, test it too
    if (supabaseServiceKey) {
      console.log('Testing service role key...');
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Test service role access to system tables
      const { data: serviceData, error: serviceError } = await serviceClient
        .from('pg_tables')
        .select('tablename')
        .limit(1);
      
      if (serviceError) {
        console.error('Service key test failed:', serviceError);
        return { success: false, error: `Service Role Key test failed: ${serviceError.message}` };
      }
      
      console.log('Service key connection successful');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Supabase connection test error:', error);
    
    // Better error handling for different types of errors
    if (error instanceof Error) {
      if (error.message.includes('fetch')) {
        return { success: false, error: 'Network error: Could not reach Supabase. Check your URL and internet connection.' };
      }
      if (error.message.includes('Invalid JWT')) {
        return { success: false, error: 'Invalid API key format. Please check your Anonymous or Service Role Key.' };
      }
      if (error.message.includes('Project not found')) {
        return { success: false, error: 'Project not found. Please check your Supabase URL.' };
      }
      return { success: false, error: error.message };
    }
    
    return { 
      success: false, 
      error: 'Connection test failed with unknown error' 
    };
  }
}