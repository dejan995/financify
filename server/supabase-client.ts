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

export async function testSupabaseConnection(supabaseUrl: string, supabaseAnonKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate URL format
    if (!supabaseUrl.includes('supabase.co')) {
      return { success: false, error: 'Invalid Supabase URL format. Should be https://your-project.supabase.co' };
    }
    
    const testClient = createClient(supabaseUrl, supabaseAnonKey);
    
    // Test the connection by trying to access auth
    const { error } = await testClient.auth.getSession();
    
    if (error && error.message !== 'Auth session missing!') {
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || 'Failed to connect to Supabase' };
  }
}