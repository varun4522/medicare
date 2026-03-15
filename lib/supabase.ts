import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://neutznckrwdeyqpjxdgt.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ldXR6bmNrcndkZXlxcGp4ZGd0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI2ODAwMDgsImV4cCI6MjA4ODI1NjAwOH0.Pp1r6mJEYmLleD8446T5NBY7eLwp854jHChdwA0DxlQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
