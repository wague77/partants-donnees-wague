import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vcszyggfsqbvjfejuimm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjc3p5Z2dmc3FidmpmZWp1aW1tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA2MDc2MDMsImV4cCI6MjEwNjE4MzYwM30.7GjkXfalJmIcV4fbPojTzW2oXhFUYEiqdRzzK0yx3fk';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
