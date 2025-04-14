import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://gjeserrdlniaipmurdvu.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdqZXNlcnJkbG5pYWlwbXVyZHZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwMDcyNDUsImV4cCI6MjA1ODU4MzI0NX0.sjB7QACzEVKRFc3Qh-KOkLkADvYpZQio4N89PohtNKs";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});
