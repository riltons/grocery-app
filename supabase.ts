import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://eajhacfvnifqfovifjyw.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVhamhhY2Z2bmlmcWZvdmlmanl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTY2ODU2NTMsImV4cCI6MjAzMjI2MTY1M30.5WEEVQOZqTRfqtxXhqZURQ8mkHk3xc6qcu6YI2ZJj0Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);