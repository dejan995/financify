import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wpuschvhqmascimvikdq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndwdXNjaHZocW1hc2NpbXZpa2RxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MTI3NzAsImV4cCI6MjA2Njk4ODc3MH0.4ef1pLaspzSzDq3XbcW_09zcT97OxEZVMmm5Ar3WYcA';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);