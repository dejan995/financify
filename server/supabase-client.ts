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
    
    // Test with anonymous key first - simple auth check
    const testClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test basic connectivity with auth session
    const { data: authData, error: authError } = await testClient.auth.getSession();
    
    if (authError && !authError.message.includes('Auth session missing')) {
      console.log('Anonymous key test failed:', authError.message);
      return { success: false, error: `Anonymous key authentication failed: ${authError.message}` };
    }
    
    console.log('Anonymous key connection successful');
    
    // If service key is provided, test it too
    if (supabaseServiceKey) {
      console.log('Testing service role key...');
      const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      
      // Test service role with a simple RPC call that should always work
      const { data: versionData, error: versionError } = await serviceClient.rpc('version');
      
      if (versionError && !versionError.message.includes('not found')) {
        console.error('Service key test failed:', versionError);
        return { success: false, error: `Service Role Key test failed: ${versionError.message}` };
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